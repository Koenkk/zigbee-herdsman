/* istanbul ignore file */

import * as fs from "node:fs";

import type * as Models from "../../../models";
import {BackupUtils} from "../../../utils";
import {logger} from "../../../utils/logger";
import {uint32MaskToChannels} from "../../../zspec/utils";
import type {Driver} from "../driver";
import {BlzValueId} from "../driver/types/named";

const NS = "zh:blz:backup";

export class BLZAdapterBackup {
    private driver: Driver;
    private defaultPath: string;

    public constructor(driver: Driver, path: string) {
        this.driver = driver;
        this.defaultPath = path;
    }

    public async createBackup(): Promise<Models.Backup> {
        logger.debug("creating backup", NS);
        const version: number = this.driver.blz.version.product;
        const linkResult = await this.driver.getGlobalTcLinkKey();
        const netParams = await this.driver.blz.execCommand("getNetworkParameters");
        const netResult = await this.driver.getNetworkKeyInfo();
        const tclKey = Buffer.from(linkResult.linkKey);
        const netKey = Buffer.from(netResult.nwkKey);
        let netKeySequenceNumber = 0;
        let netKeyFrameCounter = 0;
        netKeySequenceNumber = netResult.nwkKeySeqNum;
        netKeyFrameCounter = netResult.outgoingFrameCounter;

        const ieee = (await this.driver.blz.execCommand("getValue", {valueId: BlzValueId.BLZ_VALUE_ID_MAC_ADDRESS})).value;
        /* return backup structure */
        /* istanbul ignore next */
        return {
            blz: {
                version: version,
                tclk: tclKey,
                tclkFrameCounter: linkResult.outgoingFrameCounter,
            },
            networkOptions: {
                panId: netParams.panId,
                extendedPanId: (() => {
                    const bytes = [];
                    // in zigpy/open-coordinator-backup, all binary sequences in this format need to be stored MSB-LSB (big endian)
                    let extPanId = netParams.extPanId;
                    for (let i = 0; i < 8; i++) {
                        bytes.push(Number(extPanId & 0xFFn)); 
                        extPanId >>= 8n;
                    }
                    return Buffer.from(bytes);
                })(),
                channelList: uint32MaskToChannels(netParams.channelMask),
                networkKey: netKey,
                networkKeyDistribute: true,
            },
            logicalChannel: netParams.channel,
            networkKeyInfo: {
                sequenceNumber: netKeySequenceNumber,
                frameCounter: netKeyFrameCounter,
            },
            securityLevel: 5,
            networkUpdateId: netParams.nwkUpdateId,
            coordinatorIeeeAddress: Buffer.from(ieee),
            devices: [],
        };
    }

    /**
     * Loads currently stored backup and returns it in internal backup model.
     */
    public async getStoredBackup(): Promise<Models.Backup | undefined> {
        try {
            await fs.promises.access(this.defaultPath);
        } catch {
            return Promise.resolve(undefined);
        }
        interface BackupData extends Models.UnifiedBackupStorage {
            metadata: {
                format: "zigpy/open-coordinator-backup";
                version: 1;
                source: string;
                internal: {
                    [key: string]: unknown;
                    date: string;
                    znpVersion?: number;
                    ezspVersion?: number;
                    blzVersion?: number;
                };
            };
        }

        let data: BackupData;
        try {
            const fileContent = await fs.promises.readFile(this.defaultPath);
            data = JSON.parse(fileContent.toString()) as BackupData;
        } catch (error) {
            return Promise.reject(new Error(`Coordinator backup is corrupted (${(error as Error).stack})`));
        }
        if (data.metadata?.format === "zigpy/open-coordinator-backup" && data.metadata?.version) {
            if (data.metadata?.version !== 1) {
                throw new Error(`Unsupported open coordinator backup version (version=${data.metadata?.version})`);
            }
            // no blz data needed for now
            // if (!data.metadata.internal?.blzVersion) {
            //     throw new Error(`This open coordinator backup format not for BLZ adapter`);
            // }
            // Validate data structure before conversion
            if (typeof data !== "object" || data === null) {
                return Promise.reject(new Error("Invalid backup data format"));
            }
            return Promise.resolve(BackupUtils.fromUnifiedBackup(data));
        }
        return Promise.reject(new Error("Unknown backup format"));
    }
}
