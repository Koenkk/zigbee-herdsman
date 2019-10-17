import * as TsType from './tstype';
import {ZclDataPayload} from './events';
import events from 'events';
import {ZclFrame} from '../zcl';
import Debug from "debug";
import {RealpathSync} from '../utils';

const debug = Debug("zigbee-herdsman:adapter");

abstract class Adapter extends events.EventEmitter {
    protected networkOptions: TsType.NetworkOptions;
    protected serialPortOptions: TsType.SerialPortOptions;
    protected backupPath: string;

    protected constructor(
        networkOptions: TsType.NetworkOptions, serialPortOptions: TsType.SerialPortOptions, backupPath: string)
    {
        super();
        this.networkOptions = networkOptions;
        this.serialPortOptions = serialPortOptions;
        this.backupPath = backupPath;
    }

    public static async create(
        networkOptions: TsType.NetworkOptions, serialPortOptions: TsType.SerialPortOptions, backupPath: string
    ): Promise<Adapter> {
        const {ZStackAdapter} = await import('./z-stack/adapter');

        const adapters: typeof ZStackAdapter[] = [ZStackAdapter];
        // Use ZStackAdapter by default
        let adapter: typeof ZStackAdapter = ZStackAdapter;

        if (!serialPortOptions.path) {
            debug('No path provided, auto detecting path');
            for (const candidate of adapters) {
                const path = await candidate.autoDetectPath();
                if (path) {
                    debug(`Auto detected path '${path}' from adapter '${candidate.name}'`);
                    serialPortOptions.path = path;
                    adapter = candidate;
                    break;
                }
            }

            if (!serialPortOptions.path) {
                throw new Error("No path provided and failed to auto detect path");
            }
        } else {
            // Path can be a symlink, resolve it.
            serialPortOptions.path = RealpathSync(serialPortOptions.path);

            // Determine adapter to use
            for (const candidate of adapters) {
                if (await candidate.isValidPath(serialPortOptions.path)) {
                    debug(`Path '${serialPortOptions.path}' is valid for '${candidate.name}'`);
                    adapter = candidate;
                    break;
                }
            }
        }

        return new adapter(networkOptions, serialPortOptions, backupPath);
    }

    public abstract start(): Promise<TsType.StartResult>;

    public abstract stop(): Promise<void>;

    public abstract getCoordinator(): Promise<TsType.Coordinator>;

    public abstract permitJoin(seconds: number): Promise<void>;

    public abstract getCoordinatorVersion(): Promise<TsType.CoordinatorVersion>;

    public abstract reset(type: 'soft' | 'hard'): Promise<void>;

    public abstract supportsLED(): Promise<boolean>;

    public abstract setLED(enabled: boolean): Promise<void>;

    public abstract lqi(networkAddress: number): Promise<TsType.LQI>;

    public abstract routingTable(networkAddress: number): Promise<TsType.RoutingTable>;

    public abstract nodeDescriptor(networkAddress: number): Promise<TsType.NodeDescriptor>;

    public abstract activeEndpoints(networkAddress: number): Promise<TsType.ActiveEndpoints>;

    public abstract simpleDescriptor(networkAddress: number, endpointID: number): Promise<TsType.SimpleDescriptor>;

    public abstract sendZclFrameNetworkAddressWithResponse(
        networkAddress: number, endpoint: number, zclFrame: ZclFrame
    ): Promise<ZclDataPayload>;

    public abstract sendZclFrameNetworkAddress(
        networkAddress: number, endpoint: number, zclFrame: ZclFrame
    ): Promise<void>;

    public abstract sendZclFrameGroup(groupID: number, zclFrame: ZclFrame): Promise<void>;

    public abstract bind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint?: number
    ): Promise<void>;

    public abstract unbind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint: number
    ): Promise<void>;

    public abstract removeDevice(networkAddress: number, ieeeAddr: string): Promise<void>;

    public abstract supportsBackup(): Promise<boolean>;

    public abstract backup(): Promise<TsType.Backup>;

    public abstract getNetworkParameters(): Promise<TsType.NetworkParameters>;
}

export default Adapter;