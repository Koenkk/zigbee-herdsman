import {NetworkOptions, SerialPortOptions, Coordinator, CoordinatorVersion, NodeDescriptor, ActiveEndpoints, SimpleDescriptor} from './tstype';
import {ZclDataPayload} from './events';
import events from 'events';
import {ZclFrame} from '../zcl';

abstract class Adapter extends events.EventEmitter {
    protected networkOptions: NetworkOptions;
    protected serialPortOptions: SerialPortOptions;
    protected backupPath: string;

    public constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath: string) {
        super();
        this.networkOptions = networkOptions;
        this.serialPortOptions = serialPortOptions;
        this.backupPath = backupPath;
    }

    public abstract start(): Promise<void>;

    public abstract stop(): Promise<void>;

    public abstract getCoordinator(): Promise<Coordinator>;

    public abstract permitJoin(seconds: number): Promise<void>;

    public abstract getCoordinatorVersion(): Promise<CoordinatorVersion>;

    public abstract softReset(): Promise<void>;

    public abstract disableLED(): Promise<void>;

    public abstract nodeDescriptor(networkAddress: number): Promise<NodeDescriptor>;

    public abstract activeEndpoints(networkAddress: number): Promise<ActiveEndpoints>;

    public abstract simpleDescriptor(networkAddress: number, endpointID: number): Promise<SimpleDescriptor>;

    public abstract sendZclFrameNetworkAddressWithResponse(networkAddress: number, endpoint: number, clusterID: number, zclFrame: ZclFrame): Promise<ZclDataPayload>;

    public abstract sendZclFrameNetworkAddress(networkAddress: number, endpoint: number, clusterID: number, zclFrame: ZclFrame): Promise<void>;
}

export default Adapter;