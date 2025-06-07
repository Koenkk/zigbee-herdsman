/* istanbul ignore file */

import * as fs from 'fs';

import * as Models from '../../../models';
import {BackupUtils} from '../../../utils';
import {logger} from '../../../utils/logger';
import {uint32MaskToChannels} from '../../../zspec/utils';
import {Driver} from '../driver';
import {BlzValueId} from '../driver/types/named';

const NS = 'zh:blz:backup';

export class BLZAdapterBackup {
    private driver: Driver;
    private defaultPath: string;

    public constructor(driver: Driver, path: string) {
        this.driver = driver;
        this.defaultPath = path;
    }

    public async createBackup(): Promise<Models.Backup> {
        logger.debug('creating backup', NS);
        const version: number = this.driver.blz.version.product;
        const linkResult = await this.driver.getGlobalTcLinkKey();
        const netParams = await this.driver.blz.execCommand('getNetworkParameters');
        const netResult = await this.driver.getNetworkKeyInfo();
        let tclKey: Buffer;
        let netKey: Buffer;
        let netKeySequenceNumber: number = 0;
        let netKeyFrameCounter: number = 0;

        tclKey = Buffer.from(linkResult.linkKey);
        netKey = Buffer.from(netResult.nwkKey);
        netKeySequenceNumber = netResult.nwkKeySeqNum;
        netKeyFrameCounter = netResult.outgoingFrameCounter;

        const ieee = (await this.driver.blz.execCommand('getValue', {valueId: BlzValueId.BLZ_VALUE_ID_MAC_ADDRESS})).value;
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
                    let extPanId = netParams.extPanId;
                    for (let i = 0; i < 8; i++) {
                        bytes.unshift(Number(extPanId & 0xFFn));
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
            fs.accessSync(this.defaultPath);
        } catch {
            return undefined;
        }
        let data;
        try {
            data = JSON.parse(fs.readFileSync(this.defaultPath).toString());
        } catch (error) {
            throw new Error(`Coordinator backup is corrupted (${(error as Error).stack})`);
        }
        if (data.metadata?.format === 'zigpy/open-coordinator-backup' && data.metadata?.version) {
            if (data.metadata?.version !== 1) {
                throw new Error(`Unsupported open coordinator backup version (version=${data.metadata?.version})`);
            }
            // no blz data needed for now
            // if (!data.metadata.internal?.blzVersion) {
            //     throw new Error(`This open coordinator backup format not for BLZ adapter`);
            // }
            return BackupUtils.fromUnifiedBackup(data);
        } else {
            throw new Error('Unknown backup format');
        }
    }
}
