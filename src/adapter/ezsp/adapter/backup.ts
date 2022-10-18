/* istanbul ignore file */
import Debug from "debug";
import {Driver} from '../driver';
import * as Models from "../../../models";
import {EmberKeyType, EmberKeyStruct, EmberNetworkParameters} from '../driver/types';
import {channelsMask2list} from '../driver/utils';


export class EZSPAdapterBackup {
    private driver: Driver;
    private defaultPath: string;
    private debug = Debug("zigbee-herdsman:adapter:ezsp:backup");

    public constructor(driver: Driver, path: string) {
        this.driver = driver;
        this.defaultPath = path;
    }

    public async createBackup(): Promise<Models.Backup> {
        this.debug("creating backup");
        const version: number = await this.driver.ezsp.version();
        const linkResult = await this.driver.ezsp.execCommand('getKey', {keyType: EmberKeyType.TRUST_CENTER_LINK_KEY});
        const trustCenterLinkKey: EmberKeyStruct = linkResult.keyStruct;
        const netParams = await this.driver.ezsp.execCommand('getNetworkParameters');
        const networkParams: EmberNetworkParameters = netParams.parameters;
        const netResult = await this.driver.ezsp.execCommand('getKey', {keyType: EmberKeyType.CURRENT_NETWORK_KEY});
        const networkKey: EmberKeyStruct = netResult.keyStruct;
        const ieee = (await this.driver.ezsp.execCommand('getEui64')).eui64;
        /* return backup structure */
        /* istanbul ignore next */
        return {
            ezsp: {
                version: version,
                hashed_tclk: Buffer.from(trustCenterLinkKey.key.contents),
            },
            networkOptions: {
                panId: networkParams.panId,
                extendedPanId: Buffer.from(networkParams.extendedPanId),
                channelList: channelsMask2list(networkParams.channels),
                networkKey: Buffer.from(networkKey.key.contents),
                networkKeyDistribute: true,
            },
            logicalChannel: networkParams.radioChannel,
            networkKeyInfo: {
                sequenceNumber: networkKey.sequenceNumber,
                frameCounter: networkKey.outgoingFrameCounter
            },
            securityLevel: 5,
            networkUpdateId: networkParams.nwkUpdateId,
            coordinatorIeeeAddress: ieee,
            devices: []
        };
    }
}