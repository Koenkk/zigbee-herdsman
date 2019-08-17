import * as TsType from './tstype';
import {ZclDataPayload} from './events';
import events from 'events';
import {ZclFrame} from '../zcl';

abstract class Adapter extends events.EventEmitter {
    protected networkOptions: TsType.NetworkOptions;
    protected serialPortOptions: TsType.SerialPortOptions;
    protected backupPath: string;

    public constructor(networkOptions: TsType.NetworkOptions, serialPortOptions: TsType.SerialPortOptions, backupPath: string) {
        super();
        this.networkOptions = networkOptions;
        this.serialPortOptions = serialPortOptions;
        this.backupPath = backupPath;
    }

    public abstract start(): Promise<TsType.StartResult>;

    public abstract stop(): Promise<void>;

    public abstract getCoordinator(): Promise<TsType.Coordinator>;

    public abstract permitJoin(seconds: number): Promise<void>;

    public abstract getCoordinatorVersion(): Promise<TsType.CoordinatorVersion>;

    public abstract softReset(): Promise<void>;

    public abstract disableLED(): Promise<void>;

    public abstract lqi(networkAddress: number): Promise<TsType.LQI>;

    public abstract routingTable(networkAddress: number): Promise<TsType.RoutingTable>;

    public abstract nodeDescriptor(networkAddress: number): Promise<TsType.NodeDescriptor>;

    public abstract activeEndpoints(networkAddress: number): Promise<TsType.ActiveEndpoints>;

    public abstract simpleDescriptor(networkAddress: number, endpointID: number): Promise<TsType.SimpleDescriptor>;

    public abstract sendZclFrameNetworkAddressWithResponse(networkAddress: number, endpoint: number, zclFrame: ZclFrame): Promise<ZclDataPayload>;

    public abstract sendZclFrameNetworkAddress(networkAddress: number, endpoint: number, zclFrame: ZclFrame): Promise<void>;

    public abstract sendZclFrameGroup(groupID: number, zclFrame: ZclFrame): Promise<void>;

    public abstract bind(destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number, clusterID: number, destinationAddress: string, destinationEndpoint: number): Promise<void>;

    public abstract unbind(destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number, clusterID: number, destinationAddress: string, destinationEndpoint: number): Promise<void>;

    public abstract removeDevice(networkAddress: number, ieeeAddr: string): Promise<void>;

    public abstract supportsBackup(): Promise<boolean>;

    public abstract backup(): Promise<TsType.Backup>;

    public abstract getNetworkParameters(): Promise<TsType.NetworkParameters>;
}

export default Adapter;