/* eslint-disable max-len */
import Debug from "debug";
import {Znp} from "../znp";
import * as Models from "../../../models";
import * as Structs from "../structs";
import * as Utils from "../utils";
import {BackupUtils} from "../../../utils";
import {fs} from "mz";
import {AdapterNvMemory} from "./adapter-nv-memory";
import {NvItemsIds, NvSystemIds} from "../constants/common";
import {Subsystem} from "../unpi/constants";
import {ZnpVersion} from "./tstype";
import {AddressManagerUser, SecurityManagerAuthenticationOption} from "../structs";

/**
 * Class providing ZNP adapter backup and restore procedures based mostly on NV memory manipulation.
 */
export class AdapterBackup {

    private znp: Znp;
    private nv: AdapterNvMemory;
    private defaultPath: string;
    private debug = Debug("zigbee-herdsman:adapter:zStack:startup:backup");

    public constructor(znp: Znp, nv: AdapterNvMemory, path: string) {
        this.znp = znp;
        this.nv = nv;
        this.defaultPath = path;
    }

    /**
     * Loads currently stored backup and returns it in internal backup model.
     */
    public async getStoredBackup(): Promise<Models.Backup> {
        try {
            await fs.access(this.defaultPath);
        } catch (error) {
            return null;
        }
        const data = JSON.parse((await fs.readFile(this.defaultPath)).toString());
        if (data.metadata?.format === "zigpy/open-coordinator-backup" && data.metadata?.version) {
            if (data.metadata?.version !== 1) {
                throw new Error(`Unsupported open coordinator backup version (version=${data.metadata?.version})`);
            }
            return BackupUtils.fromUnifiedBackup(data as Models.UnifiedBackupStorage);
        } else if (data.adapterType === "zStack") {
            return BackupUtils.fromLegacyBackup(data as Models.LegacyBackupStorage);
        } else {
            throw new Error("Unknown backup format");
        }
    }

    /**
     * Creates a new backup from connected ZNP adapter and returns it in internal backup model format.
     */
    public async createBackup(): Promise<Models.Backup> {
        this.debug("creating backup");
        const version: ZnpVersion = await this.getAdapterVersion();

        /* get adapter ieee address */
        const ieeeAddressResponse = await this.znp.request(Subsystem.SYS, "getExtAddr", {});
        if (!ieeeAddressResponse || !ieeeAddressResponse.payload.extaddress || !ieeeAddressResponse.payload.extaddress.startsWith("0x")) {
            throw new Error("Failed to read adapter IEEE address");
        }
        const ieeeAddress = Buffer.from(ieeeAddressResponse.payload.extaddress.split("0x")[1], "hex");
        this.debug("fetched adapter ieee address");

        /* get adapter nib */
        const nib = await this.nv.readItem(NvItemsIds.NIB, 0, Structs.nib);
        if (!nib) {
            throw new Error("Cannot backup - adapter not commissioned");
        } 
        this.debug("fetched adapter nib");

        /* get adapter active key information */
        const activeKeyInfo = await this.nv.readItem(NvItemsIds.NWK_ACTIVE_KEY_INFO, 0, Structs.nwkKeyDescriptor);
        if (!activeKeyInfo) {
            throw new Error("Cannot backup - missing active key info");
        }
        this.debug("fetched adapter active key information");

        /* get adapter security data */
        const preconfiguredKeyEnabled = await this.nv.readItem(NvItemsIds.PRECFGKEYS_ENABLE, 0);
        this.debug("fetched adapter pre-configured key");
        const addressManagerTable = await this.getAddressManagerTable(version);
        this.debug("fetched adapter address manager table");
        const securityManagerTable = await this.getSecurityManagerTable();
        this.debug("fetched adapter security manager table");
        const apsLinkKeyDataTable = await this.getApsLinkKeyDataTable(version);
        this.debug("fetched adapter aps link key data table");
        const tclkSeed = await this.nv.readItem(NvItemsIds.TCLK_SEED, 0, Structs.nwkKey);
        this.debug("fetched adapter tclk seed");
        const tclkTable = await this.getTclkTable(version);
        this.debug("fetched adapter tclk table");
        const secMaterialTable = await this.getNetworkSecurityMaterialTable(version);
        this.debug("fetched adapter network security material table");

        /* examine network security material table */
        const genericExtendedPanId = Buffer.alloc(8, 0xff);
        let secMaterialDescriptor: ReturnType<typeof Structs.nwkSecMaterialDescriptorEntry> = null;
        /* istanbul ignore next */
        for (const entry of secMaterialTable.used) {
            if (entry.extendedPanID.equals(nib.extendedPANID)) {
                secMaterialDescriptor = entry;
                break;
            } else if (!secMaterialDescriptor && entry.extendedPanID.equals(genericExtendedPanId)) {
                secMaterialDescriptor = entry;
            }
        }

        if (!secMaterialDescriptor) {
            secMaterialDescriptor = Structs.nwkSecMaterialDescriptorEntry();
            secMaterialDescriptor.extendedPanID = nib.extendedPANID;
            secMaterialDescriptor.FrameCounter = 1250;
        }

        /* return backup structure */
        /* istanbul ignore next */
        return {
            znp: {
                version: version,
                trustCenterLinkKeySeed: tclkSeed?.key || undefined
            },
            networkOptions: {
                panId: nib.nwkPanId,
                extendedPanId: nib.extendedPANID,
                channelList: Utils.unpackChannelList(nib.channelList),
                networkKey: activeKeyInfo.key,
                networkKeyDistribute: preconfiguredKeyEnabled && preconfiguredKeyEnabled[0] === 0x01
            },
            logicalChannel: nib.nwkLogicalChannel,
            networkKeyInfo: {
                sequenceNumber: activeKeyInfo.keySeqNum,
                frameCounter: secMaterialDescriptor.FrameCounter
            },
            securityLevel: nib.SecurityLevel,
            networkUpdateId: nib.nwkUpdateId,
            coordinatorIeeeAddress: ieeeAddress,
            devices: addressManagerTable && addressManagerTable.used.map((ame, ami) => {
                /* take all entries of assoc and/or security type */
                if (!ame.isSet() || (ame.user & (AddressManagerUser.Assoc | AddressManagerUser.Security)) === 0) {
                    /* istanbul ignore next */
                    return null;
                }
                let linkKeyInfo: { key: Buffer, rxCounter: number, txCounter: number } = null;
                const sme = securityManagerTable.used.find(e => e.ami === ami);
                if (sme) {
                    const apsKeyDataIndex = version === ZnpVersion.zStack30x ? sme.keyNvId - NvItemsIds.APS_LINK_KEY_DATA_START : sme.keyNvId;
                    const apsKeyData = apsLinkKeyDataTable.used[apsKeyDataIndex] || null;
                    if (apsKeyData) {
                        linkKeyInfo = {
                            key: apsKeyData.key,
                            rxCounter: apsKeyData.rxFrmCntr,
                            txCounter: apsKeyData.txFrmCntr
                        };
                    }
                } else {
                    const tclkTableEntry = tclkTable.used.find(e => e.extAddr.equals(ame.extAddr));
                    if (tclkTableEntry) {
                        const rotatedSeed = Buffer.concat([tclkSeed.key.slice(tclkTableEntry.SeedShift_IcIndex), tclkSeed.key.slice(0, tclkTableEntry.SeedShift_IcIndex)]);
                        const extAddrReversed = Buffer.from(ame.extAddr).reverse();
                        const extAddrRepeated = Buffer.concat([extAddrReversed, extAddrReversed]);
                        const derivedKey = Buffer.alloc(16);
                        for (let i = 0; i < 16; i++) {
                            derivedKey[i] = rotatedSeed[i] ^ extAddrRepeated[i];
                        }
                        linkKeyInfo = {
                            key: derivedKey,
                            rxCounter: tclkTableEntry.rxFrmCntr,
                            txCounter: tclkTableEntry.txFrmCntr
                        };
                    }
                }
                return {
                    networkAddress: ame.nwkAddr,
                    ieeeAddress: ame.extAddr,
                    linkKey: !linkKeyInfo ? undefined : linkKeyInfo
                }; 
            }).filter(e => e) || []
        };
    }

    /**
     * Restores a structure in internal backup format to connected ZNP adapter.
     * 
     * @param backup Backup to restore to connected adapter.
     */
    public async restoreBackup(backup: Models.Backup): Promise<void> {
        this.debug("restoring backup");
        const version: ZnpVersion = await this.getAdapterVersion();

        /* fetch provisional NIB */
        const nib = await this.nv.readItem(NvItemsIds.NIB, 0, Structs.nib);

        /* update NIB with desired nwk config */
        nib.nwkPanId = backup.networkOptions.panId;
        nib.channelList = Utils.packChannelList(backup.networkOptions.channelList);
        nib.nwkLogicalChannel = backup.networkOptions.channelList[0];
        nib.extendedPANID = backup.networkOptions.extendedPanId;
        nib.SecurityLevel = backup.securityLevel;
        nib.nwkUpdateId = backup.networkUpdateId;

        /* prepare key info */
        const keyDescriptor = Structs.nwkKeyDescriptor();
        keyDescriptor.keySeqNum = backup.networkKeyInfo.sequenceNumber || 0;
        keyDescriptor.key = backup.networkOptions.networkKey;

        /* determine table sizes */
        const currentAddressManagerTable = await this.getAddressManagerTable(version);
        const currentSecurityManagerTable = await this.getSecurityManagerTable();
        const currentApsLinkKeyDataTable = await this.getApsLinkKeyDataTable(version);
        const currentTclkTable = await this.getTclkTable(version);
        const currentNwkSecMaterialTable = await this.getNetworkSecurityMaterialTable(version);
        this.debug(`got target adapter table sizes:`);
        this.debug(` - address manager table: ${currentAddressManagerTable.capacity}`);
        this.debug(` - security manager table: ${currentSecurityManagerTable.capacity}`);
        this.debug(` - aps link key data table: ${currentApsLinkKeyDataTable.capacity}`);
        this.debug(` - tclk table: ${currentTclkTable.capacity}`);
        this.debug(` - network security material table: ${currentNwkSecMaterialTable.capacity}`);

        /* prepare table structures */
        const addressManagerTable = Structs.addressManagerTable(currentAddressManagerTable.capacity);
        const securityManagerTable = Structs.securityManagerTable(currentSecurityManagerTable.capacity);
        const apsLinkKeyDataTable = Structs.apsLinkKeyDataTable(currentApsLinkKeyDataTable.capacity);
        const tclkTable = Structs.apsTcLinkKeyTable(currentTclkTable.capacity);
        const nwkSecurityMaterialTable = Structs.nwkSecMaterialDescriptorTable(currentNwkSecMaterialTable.capacity);

        /* prepare security material table (nwk frame counters) */
        const mwkSecMaterialEntry = nwkSecurityMaterialTable.entries[0];
        mwkSecMaterialEntry.extendedPanID = backup.networkOptions.extendedPanId;
        mwkSecMaterialEntry.FrameCounter = backup.networkKeyInfo.frameCounter + 2500;
        const genericNwkSecMaterialEntry = nwkSecurityMaterialTable.entries[nwkSecurityMaterialTable.capacity - 1];
        genericNwkSecMaterialEntry.extendedPanID = Buffer.alloc(8, 0xff);
        genericNwkSecMaterialEntry.FrameCounter = backup.networkKeyInfo.frameCounter + 2500;

        /* populate device & security tables and write them */
        for (const device of backup.devices) {
            const ame = addressManagerTable.getNextFree();
            ame.nwkAddr = device.networkAddress;
            ame.extAddr = device.ieeeAddress;
            ame.user = AddressManagerUser.Assoc;
            if (device.linkKey) {
                let linkKeyProcessed = false;
                /* attempt to recover tclk seed parameters (if available) */
                if (backup.znp?.trustCenterLinkKeySeed) {
                    const tclkSeed = backup.znp.trustCenterLinkKeySeed;
                    const extAddrReversed = Buffer.from(ame.extAddr).reverse();
                    const extAddrRepeated = Buffer.concat([extAddrReversed, extAddrReversed]);
                    const recoveredKey = Buffer.alloc(16);
                    for (let i = 0; i < 16; i++) {
                        recoveredKey[i] = device.linkKey.key[i] ^ extAddrRepeated[i];
                    }

                    let recoveredSeedShift: number | null = null;
                    for (let i = 0; i < 16; i++) {
                        const rotated = Buffer.concat([recoveredKey.slice(recoveredKey.length - i, recoveredKey.length), recoveredKey.slice(0, recoveredKey.length - i)]);
                        if (rotated.equals(tclkSeed)) {
                            recoveredSeedShift = i;
                            break;
                        }
                    }

                    if (recoveredSeedShift !== null) {
                        ame.user |= AddressManagerUser.Security;
                        const tclkEntry = tclkTable.getNextFree();
                        if (!tclkEntry) {
                            throw new Error(`target adapter tclk table size insufficient (size=${tclkTable.capacity})`);
                        }
                        tclkEntry.extAddr = ame.extAddr;
                        tclkEntry.SeedShift_IcIndex = recoveredSeedShift;
                        tclkEntry.keyAttributes = 2;
                        tclkEntry.keyType = 0;
                        tclkEntry.rxFrmCntr = device.linkKey.rxCounter;
                        tclkEntry.txFrmCntr = device.linkKey.txCounter + 2500;
                        linkKeyProcessed = true;
                        this.debug(`successfully recovered link key for ${device.ieeeAddress.toString("hex")} using tclk seed (shift=${recoveredSeedShift})`);
                    }
                }

                /* attempt to create aps link key data entry */
                if (!linkKeyProcessed) {
                    ame.user |= AddressManagerUser.Security;

                    const apsKeyDataEntry = apsLinkKeyDataTable.getNextFree();
                    if (!apsKeyDataEntry) {
                        throw new Error(`target adapter aps link key data table size insufficient (size=${apsLinkKeyDataTable.capacity})`);
                    }
                    apsKeyDataEntry.key = device.linkKey.key;
                    apsKeyDataEntry.rxFrmCntr = device.linkKey.rxCounter;
                    apsKeyDataEntry.txFrmCntr = device.linkKey.txCounter + 2500;

                    const sme = securityManagerTable.getNextFree();
                    if (!sme) {
                        throw new Error(`target adapter security manager table size insufficient (size=${securityManagerTable.capacity})`);
                    }
                    sme.ami = addressManagerTable.indexOf(ame);
                    sme.keyNvId = version === ZnpVersion.zStack3x0 ? apsLinkKeyDataTable.indexOf(apsKeyDataEntry) : NvItemsIds.APS_LINK_KEY_DATA_START + apsLinkKeyDataTable.indexOf(apsKeyDataEntry);
                    sme.authenticationOption = SecurityManagerAuthenticationOption.AuthenticatedCBCK;

                    linkKeyProcessed = true;
                    this.debug(`successfully recovered link key for ${device.ieeeAddress.toString("hex")} using aps key data table`);
                }
            }
        }

        /* recover coordinator ieee address */
        const reversedAdapterIeee = Buffer.from(backup.coordinatorIeeeAddress).reverse();
        await this.nv.writeItem(NvItemsIds.EXTADDR, reversedAdapterIeee);

        /* write update nib */
        await this.nv.writeItem(NvItemsIds.NIB, nib);

        /* write network key info */
        await this.nv.updateItem(NvItemsIds.NWK_ACTIVE_KEY_INFO, keyDescriptor.serialize());
        await this.nv.updateItem(NvItemsIds.NWK_ALTERN_KEY_INFO, keyDescriptor.serialize());

        /* write tclk seed if present */
        if (backup.znp?.trustCenterLinkKeySeed) {
            await this.nv.writeItem(NvItemsIds.TCLK_SEED, backup.znp.trustCenterLinkKeySeed);
        }

        /* write network security material table (nwk frame counters) */
        if (version === ZnpVersion.zStack3x0) {
            await this.nv.writeTable("extended", NvSystemIds.ZSTACK, NvItemsIds.EX_NWK_SEC_MATERIAL_TABLE, nwkSecurityMaterialTable);
        } else {
            await this.nv.writeTable("legacy", NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START, nwkSecurityMaterialTable);
        }

        /* write address manager table */
        if (version === ZnpVersion.zStack3x0) {
            await this.nv.writeTable("extended", NvSystemIds.ZSTACK, NvItemsIds.ZCD_NV_EX_ADDRMGR, addressManagerTable);
        } else {
            await this.nv.writeItem(NvItemsIds.ADDRMGR, addressManagerTable);
        }

        /* write security manager table */
        await this.nv.writeItem(NvItemsIds.APS_LINK_KEY_TABLE, securityManagerTable);

        /* write aps link key data table */
        if (version === ZnpVersion.zStack3x0) {
            await this.nv.writeTable("extended", NvSystemIds.ZSTACK, NvItemsIds.ZCD_NV_EX_APS_KEY_DATA_TABLE, apsLinkKeyDataTable);
        } else {
            await this.nv.writeTable("legacy", NvItemsIds.APS_LINK_KEY_DATA_START, apsLinkKeyDataTable);
        }

        /* write tclk table */
        if (version === ZnpVersion.zStack3x0) {
            await this.nv.writeTable("extended", NvSystemIds.ZSTACK, NvItemsIds.EX_TCLK_TABLE, tclkTable);
        } else {
            await this.nv.writeTable("legacy", NvItemsIds.LEGACY_TCLK_TABLE_START, tclkTable);
        }
    }

    /**
     * Acquires ZNP version internal to `zigbee-herdsman` from controller.
     * 
     * *If Z-Stack 1.2 controller is detected an error is thrown, since Z-Stack 1.2 backup
     * and restore procedures are not supported.*
     */
    private async getAdapterVersion(): Promise<ZnpVersion> {
        const versionResponse = await this.znp.request(Subsystem.SYS, "version", {});
        const version: ZnpVersion = versionResponse.payload.product;
        /* istanbul ignore next */
        if (version === ZnpVersion.zStack12) {
            throw new Error("Backup is not supported for Z-Stack 1.2");
        }
        return version;
    }

    /**
     * Internal method to retrieve address manager table.
     * 
     * @param version ZNP stack version the adapter is running.
     */
    private async getAddressManagerTable(version: ZnpVersion): Promise<ReturnType<typeof Structs.addressManagerTable>> {
        if (version === ZnpVersion.zStack3x0) {
            return this.nv.readTable("extended", NvSystemIds.ZSTACK, NvItemsIds.ZCD_NV_EX_ADDRMGR, undefined, Structs.addressManagerTable);
        } else {
            return this.nv.readItem(NvItemsIds.ADDRMGR, 0, Structs.addressManagerTable);
        }
    }

    /**
     * Internal method to retrieve security manager table. Also referred to as APS Link Key Table.
     */
    private async getSecurityManagerTable(): Promise<ReturnType<typeof Structs.securityManagerTable>> {
        return this.nv.readItem(NvItemsIds.APS_LINK_KEY_TABLE, 0, Structs.securityManagerTable);
    }

    /**
     * Internal method to retrieve APS Link Key Data Table containing arbitrary APS link keys.
     * 
     * @param version ZNP stack version the adapter is running.
     */
    private async getApsLinkKeyDataTable(version: ZnpVersion): Promise<ReturnType<typeof Structs.apsLinkKeyDataTable>> {
        if (version === ZnpVersion.zStack3x0) {
            return this.nv.readTable("extended", NvSystemIds.ZSTACK, NvItemsIds.ZCD_NV_EX_APS_KEY_DATA_TABLE, undefined, Structs.apsLinkKeyDataTable);
        } else {
            return this.nv.readTable("legacy", NvItemsIds.APS_LINK_KEY_DATA_START, 255, Structs.apsLinkKeyDataTable);
        }
    }

    /**
     * Internal method to retrieve Trust Center Link Key table which describes seed-based APS link keys for devices.
     * 
     * @param version ZNP stack version the adapter is running.
     */
    private async getTclkTable(version: ZnpVersion): Promise<ReturnType<typeof Structs.apsTcLinkKeyTable>> {
        if (version === ZnpVersion.zStack3x0) {
            return this.nv.readTable("extended", NvSystemIds.ZSTACK, NvItemsIds.EX_TCLK_TABLE, undefined, Structs.apsTcLinkKeyTable);
        } else {
            return this.nv.readTable("legacy", NvItemsIds.LEGACY_TCLK_TABLE_START, 239, Structs.apsTcLinkKeyTable);
        } 
    }

    /**
     * Internal method to retrieve network security material table, which contains network key frame counter.
     * 
     * @param version ZNP stack version the adapter is running.
     */
    private async getNetworkSecurityMaterialTable(version: ZnpVersion): Promise<ReturnType<typeof Structs.nwkSecMaterialDescriptorTable>> {
        if (version === ZnpVersion.zStack3x0) {
            return this.nv.readTable("extended", NvSystemIds.ZSTACK, NvItemsIds.EX_NWK_SEC_MATERIAL_TABLE, undefined, Structs.nwkSecMaterialDescriptorTable);
        } else {
            return this.nv.readTable("legacy", NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START, 12, Structs.nwkSecMaterialDescriptorTable);
        }
    }
}
