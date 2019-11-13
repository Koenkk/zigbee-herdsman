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
import processFrame from '../driver/frameParser';

class DeconzAdapter extends Adapter {
    private driver: Driver;

    public constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath: string) {
        super(networkOptions, serialPortOptions, backupPath);

        this.driver = new Driver(serialPortOptions.path);
        this.driver.on('rxFrame', (frame) => {processFrame(frame)});
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
        //throw new Error('Not implemented yet');
        return "resumed";
    }

    public async stop(): Promise<void> {
        this.driver.close();
    }

    public async getCoordinator(): Promise<Coordinator> {
        return null;
    }

    public async permitJoin(seconds: number): Promise<void> {

    }

    public async getCoordinatorVersion(): Promise<CoordinatorVersion> {
        return null;
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
        return null;
    }
}

export default DeconzAdapter;
