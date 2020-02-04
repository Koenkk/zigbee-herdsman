import {
    NetworkOptions, SerialPortOptions, Coordinator, CoordinatorVersion, NodeDescriptor,
    DeviceType, ActiveEndpoints, SimpleDescriptor, LQI, RoutingTable, Backup as BackupType, NetworkParameters,
    StartResult,
} from '../../tstype';
import Debug from "debug";
import Adapter from '../../adapter';
const debug = Debug("zigbee-herdsman:deconz:adapter");
import Driver from '../driver/driver';
import {ZclFrame, FrameType, Direction, Foundation} from '../../../zcl';
import * as Events from '../../events';
import * as Zcl from '../../../zcl';
import processFrame from '../driver/frameParser';
import {Queue} from '../../../utils';
import PARAM from '../driver/constants';
import { Command, ApsDataRequest } from '../driver/constants';

class DeconzAdapter extends Adapter {
    private driver: Driver;
    private queue: Queue;
    private transactionID: number;

    public constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath: string) {
        super(networkOptions, serialPortOptions, backupPath);

        this.driver = new Driver(serialPortOptions.path);
        this.driver.on('rxFrame', (frame) => {processFrame(frame)});
        this.queue = new Queue(2);
        this.transactionID = 0;
        console.log('CREATED DECONZ ADAPTER');
    }

    public static async isValidPath(path: string): Promise<boolean> {
        return Driver.isValidPath(path);
    }

    public static async autoDetectPath(): Promise<string> {
        return Driver.autoDetectPath();
    }

    /**
     * Adapter methods
     */
    public async start(): Promise<StartResult> {
        await this.driver.open();
        return "resumed";
    }

    public async stop(): Promise<void> {
        this.driver.close();
    }

    public async getCoordinator(): Promise<Coordinator> {
        return this.queue.execute<Coordinator>(async () => {
            const ieeeAddr: any = await this.driver.readParameterRequest(PARAM.PARAM.Network.MAC);
            const nwkAddr: any = await this.driver.readParameterRequest(PARAM.PARAM.Network.NWK_ADDRESS);

            const endpoints: any = [{
                    ID: 0x01,
                    profileID: 0x0104,
                    deviceID: 0x0005,
                    inputClusters: [0x0019, 0x000A],
                    outputClusters: [0x0500]
                },
                {
                    ID: 0xF2,
                    profileID: 0xA1E0,
                    deviceID: 0x0064,
                    inputClusters: [],
                    outputClusters: [0x0021]
                }];

            return {
                networkAddress: nwkAddr,
                manufacturerID: 0x1135,
                ieeeAddr: ieeeAddr,
                endpoints,
            };
        });
    }

    public async permitJoin(seconds: number): Promise<void> {

    }

    public async getCoordinatorVersion(): Promise<CoordinatorVersion> {
        // product: number; transportrev: number; majorrel: number; minorrel: number; maintrel: number; revision: string;
        const fw = await this.driver.readFirmwareVersionRequest();
        const type: string = (fw[1] === 5) ? "raspbee" : "conbee2";
        const meta = {major: fw[3], minor: fw[2]}
        return {type: type, meta: meta};
    }

    public async reset(type: 'soft' | 'hard'): Promise<void> {

    }

    public async setLED(enabled: boolean): Promise<void> {

    }

    public async lqi(networkAddress: number): Promise<LQI> {
        return null;
    }

    public async routingTable(networkAddress: number): Promise<RoutingTable> {
        return null;
    }

    public async nodeDescriptor(networkAddress: number): Promise<NodeDescriptor> {
        return null;
    }

    public async activeEndpoints(networkAddress: number): Promise<ActiveEndpoints> {
        return null;
    }

    public async simpleDescriptor(networkAddress: number, endpointID: number): Promise<SimpleDescriptor> {
        return null;
    }

    public async sendZclFrameNetworkAddressWithResponse(
        networkAddress: number, endpoint: number, zclFrame: ZclFrame
    ): Promise<Events.ZclDataPayload> {
        return null;
    }

    public async sendZclFrameNetworkAddress(
        networkAddress: number, endpoint: number, zclFrame: ZclFrame
    ): Promise<void> {

    }

    public async sendZclFrameGroup(groupID: number, zclFrame: ZclFrame): Promise<void> {

    }

    public async bind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint?: number
    ): Promise<void> {

    }

    public async unbind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint: number
    ): Promise<void> {

    }

    public async removeDevice(networkAddress: number, ieeeAddr: string): Promise<void> {

    }

    public async supportsBackup(): Promise<boolean> {
        return null;
    }

    public async backup(): Promise<BackupType> {
        return null;
    }

    public async getNetworkParameters(): Promise<NetworkParameters> {
        const panid: any = await this.driver.readParameterRequest(PARAM.PARAM.Network.PAN_ID);
        const expanid: any = await this.driver.readParameterRequest(PARAM.PARAM.Network.EXT_PAN_ID);
        const channel: any = await this.driver.readParameterRequest(PARAM.PARAM.Network.CHANNEL);

        return {
            panID: panid,
            extendedPanID: expanid,
            channel: channel
        };
    }

    public async supportsLED(): Promise<boolean> {
        return false;
    }

    public async restoreChannelInterPAN(): Promise<void> {
        return Promise.reject();
    }

    public async sendZclFrameInterPANBroadcastWithResponse(
        zclFrame: ZclFrame, timeout: number
    ): Promise<Events.ZclDataPayload> {
        return Promise.reject();
    }

    public async setChannelInterPAN(channel: number): Promise<void> {
        return Promise.reject();
    }

    public async setTransmitPower(value: number): Promise<void> {
        return Promise.reject();
    }

    public async sendZclFrameInterPANIeeeAddr(zclFrame: ZclFrame, ieeeAddr: any): Promise<void> {
        return Promise.reject();
    }

    private nextTransactionID(): number {
        this.transactionID++;

        if (this.transactionID > 255) {
            this.transactionID = 1;
        }

        return this.transactionID;
    }
}

export default DeconzAdapter;
