/* v8 ignore start */

import * as fs from 'node:fs';

import * as Models from '../../../models';
import {BackupUtils} from '../../../utils';
import {logger} from '../../../utils/logger';
import {uint32MaskToChannels} from '../../../zspec/utils';
import {Driver} from '../driver';
import {EmberKeyData, EmberKeyStruct, EmberKeyType, EmberNetworkParameters, EmberSecurityManagerNetworkKeyInfo} from '../driver/types';

const NS = 'zh:ezsp:backup';

export class EZSPAdapterBackup {
    private driver: Driver;
    private defaultPath: string;

    public constructor(driver: Driver, path: string) {
        this.driver = driver;
        this.defaultPath = path;
    }

    public async createBackup(): Promise<Models.Backup> {
        logger.debug('creating backup', NS);
        const version: number = await this.driver.ezsp.version();
        const linkResult = await this.driver.getKey(EmberKeyType.TRUST_CENTER_LINK_KEY);
        const netParams = await this.driver.ezsp.execCommand('getNetworkParameters');
        const networkParams: EmberNetworkParameters = netParams.parameters;
        const netResult = await this.driver.getKey(EmberKeyType.CURRENT_NETWORK_KEY);
        let tclKey: Buffer;
        let netKey: Buffer;
        let netKeySequenceNumber: number = 0;
        let netKeyFrameCounter: number = 0;

        if (version < 13) {
            tclKey = Buffer.from((linkResult.keyStruct as EmberKeyStruct).key.contents);
            netKey = Buffer.from((netResult.keyStruct as EmberKeyStruct).key.contents);
            netKeySequenceNumber = (netResult.keyStruct as EmberKeyStruct).sequenceNumber;
            netKeyFrameCounter = (netResult.keyStruct as EmberKeyStruct).outgoingFrameCounter;
        } else {
            tclKey = Buffer.from((linkResult.keyData as EmberKeyData).contents);
            netKey = Buffer.from((netResult.keyData as EmberKeyData).contents);
            // get rest of info from second cmd in EZSP 13+
            const netKeyInfoResult = await this.driver.getNetworkKeyInfo();
            const networkKeyInfo: EmberSecurityManagerNetworkKeyInfo = netKeyInfoResult.networkKeyInfo;
            netKeySequenceNumber = networkKeyInfo.networkKeySequenceNumber;
            netKeyFrameCounter = networkKeyInfo.networkKeyFrameCounter;
        }

        const ieee = (await this.driver.ezsp.execCommand('getEui64')).eui64;
        /* return backup structure */
        return {
            ezsp: {
                version: version,
                hashed_tclk: tclKey,
            },
            networkOptions: {
                panId: networkParams.panId,
                extendedPanId: Buffer.from(networkParams.extendedPanId),
                channelList: uint32MaskToChannels(networkParams.channels),
                networkKey: netKey,
                networkKeyDistribute: true,
            },
            logicalChannel: networkParams.radioChannel,
            networkKeyInfo: {
                sequenceNumber: netKeySequenceNumber,
                frameCounter: netKeyFrameCounter,
            },
            securityLevel: 5,
            networkUpdateId: networkParams.nwkUpdateId,
            coordinatorIeeeAddress: ieee,
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
            if (!data.metadata.internal?.ezspVersion) {
                throw new Error(`This open coordinator backup format not for EZSP adapter`);
            }
            return BackupUtils.fromUnifiedBackup(data);
        } else {
            throw new Error('Unknown backup format');
        }
    }
}
