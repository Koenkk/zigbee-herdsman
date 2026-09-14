import type * as Models from "../../../models";
import {logger} from "../../../utils/logger";
import {Utils as ZSpecUtils} from "../../../zspec";
import {
    OCB_FLASH_TCLK_ENTRIES,
    OcbCapabilityBit,
    OcbFieldResult,
    OcbLinkKeyAvailableBit,
    OcbLinkKeyKind,
    OcbRestoreFieldId,
    ZiGateCommandCode,
} from "../driver/constants";
import type Driver from "../driver/zigate";

const NS = "zh:zigate:ocb";

/** OCB ABI/schema version implemented here. */
const OCB_ABI = 1;
const OCB_SCHEMA = 1;
/** "OCB!" - public constant used in the UNLOCK confirmation relation, not a secret. */
const OCB_CONFIRM_MAGIC = 0x4f434221;
/** "ZGHX" magic bytes required by the capability probe request. */
const CAPABILITY_MAGIC = [0x5a, 0x47, 0x48, 0x58] as const;
const CAPABILITY_TIMEOUT = 3000;
/** Validity bits in OcbExportCore's `fields` bitmap that we rely on. */
const CORE_MANDATORY_FIELD_BITS: Readonly<Record<string, number>> = {coordinatorIeee: 0, panId: 1, extendedPanId: 2, channel: 3};

let txnCounter = 0x4f434200;

function nextTxn(): number {
    txnCounter = (txnCounter + 1) >>> 0;
    return txnCounter;
}

function hexToBuffer(hex: string): Buffer {
    return Buffer.from(hex.slice(2), "hex");
}

function u8(value: number): Buffer {
    const buffer = Buffer.alloc(1);
    buffer.writeUInt8(value);
    return buffer;
}

function u16(value: number): Buffer {
    const buffer = Buffer.alloc(2);
    buffer.writeUInt16BE(value);
    return buffer;
}

function u32(value: number): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value);
    return buffer;
}

export interface OcbCapability {
    /** Read-only typed metadata export (PAN/ext-PAN/channel/coordinator IEEE), no key material. */
    metadataExport: boolean;
    /** Full network/TC key export and streamed restore. The only mode that yields a usable backup. */
    experimentalKeys: boolean;
}

/**
 * OCB (Open Coordinator Backup) UART extension client. Only present on firmware built after
 * v3.23; absent/unsupported firmware simply fails every request here (timeout or a non-success
 * status), which callers must treat as "no backup support" rather than a hard error.
 */
export class OcbBackup {
    private driver: Driver;

    public constructor(driver: Driver) {
        this.driver = driver;
    }

    public async detectCapability(): Promise<OcbCapability> {
        try {
            const result = await this.driver.sendCommand(
                ZiGateCommandCode.OcbCapability,
                {
                    magic0: CAPABILITY_MAGIC[0],
                    magic1: CAPABILITY_MAGIC[1],
                    magic2: CAPABILITY_MAGIC[2],
                    magic3: CAPABILITY_MAGIC[3],
                    hostMajor: OCB_ABI,
                    hostMinor: OCB_SCHEMA,
                    nonce: nextTxn(),
                },
                CAPABILITY_TIMEOUT,
            );
            const bitmap = BigInt(`0x${(result.payload.capBitmap as Buffer).toString("hex")}`);
            const hasBit = (bit: OcbCapabilityBit): boolean => (bitmap & (1n << BigInt(bit))) !== 0n;

            return {metadataExport: hasBit(OcbCapabilityBit.MetadataExport), experimentalKeys: hasBit(OcbCapabilityBit.ExperimentalKeys)};
        } catch (error) {
            logger.debug(() => `OCB capability probe failed, treating as unsupported: ${(error as Error).message}`, NS);
            return {metadataExport: false, experimentalKeys: false};
        }
    }

    public async createBackup(_ieeeAddressesInDatabase: string[], networkKeyDistribute: boolean): Promise<Models.Backup> {
        const exportTxn = nextTxn();
        const begin = await this.driver.sendCommand(ZiGateCommandCode.OcbExportBegin, {abi: OCB_ABI, schema: OCB_SCHEMA, txn: exportTxn});

        if ((begin.payload.status as number) !== 0) {
            throw new Error(`OCB export begin rejected with status ${begin.payload.status}`);
        }

        const session = begin.payload.session as number;
        const core = await this.driver.sendCommand(ZiGateCommandCode.OcbExportCore, {abi: OCB_ABI, schema: OCB_SCHEMA, txn: exportTxn, session});

        if ((core.payload.status as number) !== 0) {
            throw new Error(`OCB export core rejected with status ${core.payload.status}`);
        }

        const fields = core.payload.fields as number;

        for (const [name, bit] of Object.entries(CORE_MANDATORY_FIELD_BITS)) {
            if ((fields & (1 << bit)) === 0) {
                throw new Error(`OCB export core: firmware did not report a valid '${name}' field`);
            }
        }

        try {
            const end = await this.driver.sendCommand(ZiGateCommandCode.OcbExportEnd, {abi: OCB_ABI, schema: OCB_SCHEMA, txn: exportTxn, session});

            if ((end.payload.status as number) !== 0) {
                logger.warning(`OCB export end rejected with status ${end.payload.status}`, NS);
            }
        } catch (error) {
            logger.debug(() => `OCB export end failed (non-fatal): ${(error as Error).message}`, NS);
        }

        const txn = await this.unlock();
        const secretCore = await this.driver.sendCommand(ZiGateCommandCode.OcbSecretCore, {abi: OCB_ABI, schema: OCB_SCHEMA, txn});

        if ((secretCore.payload.status as number) !== 0) {
            throw new Error(`OCB secret core rejected with status ${secretCore.payload.status}`);
        }

        const devices = new Map<string, Models.Backup["devices"][number]>();
        const deviceLinkKeyTypes: Record<string, number> = {};
        const linkKeyPlan: {kind: OcbLinkKeyKind; count: number}[] = [
            {kind: OcbLinkKeyKind.DefaultTc, count: 1},
            {kind: OcbLinkKeyKind.ApsTable, count: 1},
            {kind: OcbLinkKeyKind.FlashTclk, count: OCB_FLASH_TCLK_ENTRIES},
        ];

        for (const {kind, count} of linkKeyPlan) {
            for (let index = 0; index < count; index++) {
                const linkKey = await this.driver.sendCommand(ZiGateCommandCode.OcbLinkKey, {abi: OCB_ABI, schema: OCB_SCHEMA, txn, kind, index});

                if ((linkKey.payload.status as number) !== 0) {
                    continue; // NOT_FOUND: empty slot
                }

                const available = linkKey.payload.available as number;
                const hasKeyBytes = (available & (1 << OcbLinkKeyAvailableBit.TcOrApsLinkKey)) !== 0;
                const hasEui = (available & (1 << OcbLinkKeyAvailableBit.Eui64)) !== 0;

                if (!hasKeyBytes || !hasEui) {
                    continue;
                }

                const eui64 = linkKey.payload.eui64 as string;

                deviceLinkKeyTypes[eui64] = linkKey.payload.keyType as number;
                devices.set(eui64, {
                    networkAddress: null,
                    ieeeAddress: hexToBuffer(eui64),
                    isDirectChild: false,
                    linkKey: {
                        key: linkKey.payload.key as Buffer,
                        rxCounter: linkKey.payload.apsIn as number,
                        txCounter: linkKey.payload.apsOut as number,
                    },
                });
            }
        }

        return {
            networkOptions: {
                panId: core.payload.panId as number,
                extendedPanId: hexToBuffer(core.payload.extendedPanId as string),
                channelList: [core.payload.channel as number],
                networkKey: secretCore.payload.nwkKey as Buffer,
                networkKeyDistribute,
            },
            logicalChannel: core.payload.channel as number,
            networkKeyInfo: {
                sequenceNumber: secretCore.payload.nwkSeq as number,
                frameCounter: secretCore.payload.nwkOut as number,
            },
            securityLevel: core.payload.securityLevel as number,
            networkUpdateId: core.payload.nwkUpdateId as number,
            coordinatorIeeeAddress: hexToBuffer(core.payload.coordinatorIeee as string),
            devices: [...devices.values()],
            zigate: {
                tcLinkKey: secretCore.payload.tcKey as Buffer,
                tcKeyType: secretCore.payload.tcType as number,
                deviceLinkKeyTypes,
            },
        };
    }

    public async restoreBackup(backup: Models.Backup): Promise<void> {
        const txn = await this.unlock();

        try {
            const begin = await this.driver.sendCommand(ZiGateCommandCode.OcbRestoreBegin, {abi: OCB_ABI, schema: OCB_SCHEMA, txn});

            if ((begin.payload.status as number) !== 0) {
                throw new Error(`OCB restore begin rejected with status ${begin.payload.status}`);
            }

            await this.restoreField(txn, OcbRestoreFieldId.NwkKey, backup.networkOptions.networkKey);
            await this.restoreField(txn, OcbRestoreFieldId.NwkKeySeq, u8(backup.networkKeyInfo.sequenceNumber));
            await this.restoreField(txn, OcbRestoreFieldId.NwkOutFc, u32(backup.networkKeyInfo.frameCounter));
            await this.restoreField(txn, OcbRestoreFieldId.PanId, u16(backup.networkOptions.panId));
            await this.restoreField(txn, OcbRestoreFieldId.ExtPanId, backup.networkOptions.extendedPanId);
            await this.restoreField(txn, OcbRestoreFieldId.Channel, u8(backup.logicalChannel));
            await this.restoreField(txn, OcbRestoreFieldId.NwkAddr, u16(0x0000));
            await this.restoreField(txn, OcbRestoreFieldId.NwkUpdateId, u8(backup.networkUpdateId));

            if (backup.zigate?.tcLinkKey) {
                await this.restoreField(txn, OcbRestoreFieldId.TcAddr, backup.coordinatorIeeeAddress);
                await this.restoreField(txn, OcbRestoreFieldId.TcLinkKey, backup.zigate.tcLinkKey);

                if (backup.zigate.tcKeyType != null) {
                    await this.restoreField(txn, OcbRestoreFieldId.TcKeyType, u8(backup.zigate.tcKeyType));
                }
            }

            for (const device of backup.devices) {
                if (!device.linkKey) {
                    continue;
                }

                const eui64 = ZSpecUtils.eui64BEBufferToHex(device.ieeeAddress);
                const keyType = backup.zigate?.deviceLinkKeyTypes?.[eui64] ?? 0;
                const result = await this.driver.sendCommand(ZiGateCommandCode.OcbRestoreLink, {
                    abi: OCB_ABI,
                    schema: OCB_SCHEMA,
                    txn,
                    eui64,
                    keyType,
                    key: device.linkKey.key,
                });

                if ((result.payload.status as number) !== 0) {
                    throw new Error(`OCB restore link for ${eui64} rejected with status ${result.payload.status}`);
                }

                if ((result.payload.result as number) !== OcbFieldResult.Applied) {
                    logger.warning(`OCB restore link for ${eui64}: ${OcbFieldResult[result.payload.result as number]}`, NS);
                }
            }

            const validate = await this.driver.sendCommand(ZiGateCommandCode.OcbValidate, {abi: OCB_ABI, schema: OCB_SCHEMA, txn});

            if ((validate.payload.status as number) !== 0 || !(validate.payload.mandatoryOk as number)) {
                throw new Error("OCB restore validation failed: mandatory fields missing or rejected");
            }

            const commit = await this.driver.sendCommand(ZiGateCommandCode.OcbCommit, {abi: OCB_ABI, schema: OCB_SCHEMA, txn});

            if ((commit.payload.status as number) !== 0) {
                throw new Error(`OCB commit rejected with status ${commit.payload.status}`);
            }
        } catch (error) {
            try {
                await this.driver.sendCommand(ZiGateCommandCode.OcbAbort, {abi: OCB_ABI, schema: OCB_SCHEMA, txn});
            } catch (abortError) {
                logger.debug(() => `OCB abort after failed restore also failed: ${(abortError as Error).message}`, NS);
            }

            throw error;
        }
    }

    private async restoreField(txn: number, fieldId: OcbRestoreFieldId, value: Buffer): Promise<void> {
        const result = await this.driver.sendCommand(ZiGateCommandCode.OcbRestoreField, {
            abi: OCB_ABI,
            schema: OCB_SCHEMA,
            txn,
            fieldId,
            length: value.length,
            value,
        });

        if ((result.payload.status as number) !== 0) {
            throw new Error(`OCB restore field ${OcbRestoreFieldId[fieldId]} rejected with status ${result.payload.status}`);
        }

        const applyResult = result.payload.result as number;

        if (applyResult !== OcbFieldResult.Applied) {
            logger.warning(`OCB restore field ${OcbRestoreFieldId[fieldId]}: ${OcbFieldResult[applyResult] ?? applyResult}`, NS);
        }
    }

    /** Runs the 30-second-window CHALLENGE/UNLOCK handshake and returns the transaction id to reuse for follow-up calls. */
    private async unlock(): Promise<number> {
        const txn = nextTxn();
        const challenge = await this.driver.sendCommand(ZiGateCommandCode.OcbChallenge, {abi: OCB_ABI, schema: OCB_SCHEMA, txn});

        if ((challenge.payload.status as number) !== 0) {
            throw new Error(`OCB challenge rejected with status ${challenge.payload.status}`);
        }

        const nonce = challenge.payload.nonce as number;
        const confirmation = (nonce ^ txn ^ OCB_CONFIRM_MAGIC) >>> 0;
        const unlock = await this.driver.sendCommand(ZiGateCommandCode.OcbUnlock, {abi: OCB_ABI, schema: OCB_SCHEMA, txn, nonce, confirmation});

        if ((unlock.payload.status as number) !== 0) {
            throw new Error(`OCB unlock rejected with status ${unlock.payload.status}`);
        }

        return txn;
    }
}

export default OcbBackup;
