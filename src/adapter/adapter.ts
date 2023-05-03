import * as TsType from './tstype';
import {ZclDataPayload} from './events';
import events from 'events';
import {ZclFrame, FrameType, Direction} from '../zcl';
import Debug from "debug";
import {LoggerStub} from "../controller/logger-stub";
import * as Models from "../models";
import Bonjour, { Service } from 'bonjour-service';

const debug = Debug("zigbee-herdsman:adapter");

abstract class Adapter extends events.EventEmitter {
    public readonly greenPowerGroup = 0x0b84;
    protected networkOptions: TsType.NetworkOptions;
    protected adapterOptions: TsType.AdapterOptions;
    protected serialPortOptions: TsType.SerialPortOptions;
    protected backupPath: string;
    protected logger?: LoggerStub;

    protected constructor(
        networkOptions: TsType.NetworkOptions, serialPortOptions: TsType.SerialPortOptions, backupPath: string,
        adapterOptions: TsType.AdapterOptions, logger?: LoggerStub)
    {
        super();
        this.networkOptions = networkOptions;
        this.adapterOptions = adapterOptions;
        this.serialPortOptions = serialPortOptions;
        this.backupPath = backupPath;
        this.logger = logger;
    }

    /**
     * Utility
     */

    public static async create(
        networkOptions: TsType.NetworkOptions,
        serialPortOptions: TsType.SerialPortOptions,
        backupPath: string,
        adapterOptions: TsType.AdapterOptions,
        logger?: LoggerStub,
    ): Promise<Adapter> {
        const {ZStackAdapter} = await import('./z-stack/adapter');
        const {DeconzAdapter} = await import('./deconz/adapter');
        const {ZiGateAdapter} = await import('./zigate/adapter');
        const {EZSPAdapter} = await import('./ezsp/adapter');
        type AdapterImplementation = (typeof ZStackAdapter | typeof DeconzAdapter | typeof ZiGateAdapter
            | typeof EZSPAdapter);

        let adapters: AdapterImplementation[];
        const adapterLookup = {zstack: ZStackAdapter, deconz: DeconzAdapter, zigate: ZiGateAdapter,
            ezsp: EZSPAdapter};
        if (serialPortOptions.adapter && serialPortOptions.adapter !== 'auto') {
            if (adapterLookup.hasOwnProperty(serialPortOptions.adapter)) {
                adapters = [adapterLookup[serialPortOptions.adapter]];
            } else {
                throw new Error(
                    `Adapter '${serialPortOptions.adapter}' does not exists, possible ` +
                    `options: ${Object.keys(adapterLookup).join(', ')}`
                );
            }
        } else {
            adapters = Object.values(adapterLookup);
        }

        // Use ZStackAdapter by default
        let adapter: AdapterImplementation = adapters[0];

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
        } else if(serialPortOptions.path.indexOf("mdns://") != -1){
            const mdnsDevice = serialPortOptions.path.substring(7);
            if(mdnsDevice.length == 0){
                throw new Error(
                    `You must specify the adapter type after mdns://`+
                    `More about it [link_to_docs_here]`
                    );
                return;
            }
            const bj = new Bonjour();
            const mdnsTimeout = 2000; // timeout for mdns scan
            var mdnsIp = "";
            var mdnsPort: number;
            var mdnsBaud: number;
            var mdnsAdapter = 'zstack' as TsType.SerialPortOptions["adapter"];

            logger.info(`Starting mdns discovery for device: ${mdnsDevice}`);

            return await new Promise((resolve, reject) => {
                bj.findOne({ type: mdnsDevice}, mdnsTimeout, function (service: Service) {
                    if(service){
                        if(service.txt && service.txt.radio_type && service.txt.baud_rate && service.addresses && service.port){
                            mdnsIp = service.addresses[0];
                            mdnsPort = service.port;
                            mdnsAdapter = service.txt.radio_type == "znp" ? "zstack" : service.txt.radio_type;
                            mdnsBaud = parseInt(service.txt.baud_rate);
                            logger.info(`Found mdns adapter!`);
                            logger.info(`Adapter Ip: ${mdnsIp}`);
                            logger.info(`Adapter Port: ${mdnsPort}`);
                            logger.info(`Adapter Radio: ${mdnsAdapter}`);
                            logger.info(`Adapter Baud: ${mdnsBaud}\n`);
                            bj.destroy();
                            serialPortOptions.path = `tcp://${mdnsIp}:${mdnsPort}`;
                            serialPortOptions.adapter = mdnsAdapter;
                            serialPortOptions.baudRate = mdnsBaud;
                            resolve(new adapter(networkOptions, serialPortOptions, backupPath, adapterOptions, logger));
                        }else{
                            bj.destroy();
                            reject(new Error(`Adapter returned wrong Zeroconf format! Refer to documentation [link_to_docs_here]`));
                        }
                    }else{
                        bj.destroy();
                        reject(new Error(`Adapter [${mdnsDevice}] not found after ${mdnsTimeout}ms!`));
                    }
                });
            })
        } else {
            try {
                // Determine adapter to use
                for (const candidate of adapters) {
                    if (await candidate.isValidPath(serialPortOptions.path)) {
                        debug(`Path '${serialPortOptions.path}' is valid for '${candidate.name}'`);
                        adapter = candidate;
                        break;
                    }
                }
            } catch (error) {
                debug(`Failed to validate path: '${error}'`);
            }
        }

        return new adapter(networkOptions, serialPortOptions, backupPath, adapterOptions, logger);
    }

    public abstract start(): Promise<TsType.StartResult>;

    public abstract stop(): Promise<void>;

    public abstract getCoordinator(): Promise<TsType.Coordinator>;

    public abstract getCoordinatorVersion(): Promise<TsType.CoordinatorVersion>;

    public abstract reset(type: 'soft' | 'hard'): Promise<void>;

    public abstract supportsBackup(): Promise<boolean>;

    public abstract backup(): Promise<Models.Backup>;

    public abstract getNetworkParameters(): Promise<TsType.NetworkParameters>;

    public abstract setTransmitPower(value: number): Promise<void>;

    public abstract addInstallCode(ieeeAddress: string, key: Buffer): Promise<void>;

    public abstract waitFor(
        networkAddress: number, endpoint: number, frameType: FrameType, direction: Direction,
        transactionSequenceNumber: number, clusterID: number, commandIdentifier: number, timeout: number,
    ): {promise: Promise<ZclDataPayload>; cancel: () => void};

    /**
     * ZDO
     */

    public abstract permitJoin(seconds: number, networkAddress: number): Promise<void>;

    public abstract lqi(networkAddress: number): Promise<TsType.LQI>;

    public abstract routingTable(networkAddress: number): Promise<TsType.RoutingTable>;

    public abstract nodeDescriptor(networkAddress: number): Promise<TsType.NodeDescriptor>;

    public abstract activeEndpoints(networkAddress: number): Promise<TsType.ActiveEndpoints>;

    public abstract simpleDescriptor(networkAddress: number, endpointID: number): Promise<TsType.SimpleDescriptor>;

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

    /**
     * ZCL
     */

    public abstract sendZclFrameToEndpoint(
        ieeeAddr: string, networkAddress: number, endpoint: number, zclFrame: ZclFrame, timeout: number,
        disableResponse: boolean, disableRecovery: boolean, sourceEndpoint?: number,
    ): Promise<ZclDataPayload>;

    public abstract sendZclFrameToGroup(groupID: number, zclFrame: ZclFrame, sourceEndpoint?: number): Promise<void>;

    public abstract sendZclFrameToAll(endpoint: number, zclFrame: ZclFrame, sourceEndpoint: number): Promise<void>;

    /**
     * InterPAN
     */

    public abstract setChannelInterPAN(channel: number): Promise<void>;

    public abstract sendZclFrameInterPANToIeeeAddr(zclFrame: ZclFrame, ieeeAddress: string): Promise<void>;

    public abstract sendZclFrameInterPANBroadcast(
        zclFrame: ZclFrame, timeout: number
    ): Promise<ZclDataPayload>;

    public abstract restoreChannelInterPAN(): Promise<void>;

}

export default Adapter;
