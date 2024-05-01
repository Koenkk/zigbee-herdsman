import * as TsType from './tstype';
import {ZclPayload} from './events';
import events from 'events';
import * as Zcl from '../zspec/zcl';
import * as Models from "../models";
import Bonjour, {Service} from 'bonjour-service';
import {logger} from '../utils/logger';
import {BroadcastAddress} from '../zspec/enums';

const NS = 'zh:adapter';

abstract class Adapter extends events.EventEmitter {
    public readonly greenPowerGroup = 0x0b84;
    protected networkOptions: TsType.NetworkOptions;
    protected adapterOptions: TsType.AdapterOptions;
    protected serialPortOptions: TsType.SerialPortOptions;
    protected backupPath: string;

    protected constructor(networkOptions: TsType.NetworkOptions, serialPortOptions: TsType.SerialPortOptions, backupPath: string,
        adapterOptions: TsType.AdapterOptions) {
        super();
        this.networkOptions = networkOptions;
        this.adapterOptions = adapterOptions;
        this.serialPortOptions = serialPortOptions;
        this.backupPath = backupPath;
    }

    /**
     * Utility
     */

    public static async create(
        networkOptions: TsType.NetworkOptions,
        serialPortOptions: TsType.SerialPortOptions,
        backupPath: string,
        adapterOptions: TsType.AdapterOptions,
    ): Promise<Adapter> {
        const {ZStackAdapter} = await import('./z-stack/adapter');
        const {DeconzAdapter} = await import('./deconz/adapter');
        const {ZiGateAdapter} = await import('./zigate/adapter');
        const {EZSPAdapter} = await import('./ezsp/adapter');
        const {EmberAdapter} = await import('./ember/adapter');
        type AdapterImplementation = (typeof ZStackAdapter | typeof DeconzAdapter | typeof ZiGateAdapter
            | typeof EZSPAdapter | typeof EmberAdapter);

        let adapters: AdapterImplementation[];
        const adapterLookup = {zstack: ZStackAdapter, deconz: DeconzAdapter, zigate: ZiGateAdapter,
            ezsp: EZSPAdapter, ember: EmberAdapter};
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
            logger.debug('No path provided, auto detecting path', NS);
            for (const candidate of adapters) {
                const path = await candidate.autoDetectPath();
                if (path) {
                    logger.debug(`Auto detected path '${path}' from adapter '${candidate.name}'`, NS);
                    serialPortOptions.path = path;
                    adapter = candidate;
                    break;
                }
            }

            if (!serialPortOptions.path) {
                throw new Error("No path provided and failed to auto detect path");
            }
        } else if (serialPortOptions.path.startsWith("mdns://")) {
            const mdnsDevice = serialPortOptions.path.substring(7);
            if (mdnsDevice.length == 0){
                throw new Error(
                    `No mdns device specified. ` +
                    `You must specify the coordinator mdns service type after mdns://, e.g. mdns://my-adapter`
                );
            }
            const bj = new Bonjour();
            const mdnsTimeout = 2000; // timeout for mdns scan

            logger.info(`Starting mdns discovery for coordinator: ${mdnsDevice}`, NS);
            await new Promise((resolve, reject) => {
                bj.findOne({type: mdnsDevice}, mdnsTimeout, function (service: Service) {
                    if (service) {
                        if (service.txt?.radio_type && service.txt?.baud_rate && service.addresses && service.port) {
                            const mdnsIp = service.addresses[0];
                            const mdnsPort = service.port;
                            const mdnsAdapter = (service.txt.radio_type == 'znp' ?
                                'zstack' : service.txt.radio_type) as TsType.SerialPortOptions['adapter'];
                            const mdnsBaud = parseInt(service.txt.baud_rate);
                            logger.info(`Coordinator Ip: ${mdnsIp}`, NS);
                            logger.info(`Coordinator Port: ${mdnsPort}`, NS);
                            logger.info(`Coordinator Radio: ${mdnsAdapter}`, NS);
                            logger.info(`Coordinator Baud: ${mdnsBaud}\n`, NS);
                            bj.destroy();
                            serialPortOptions.path = `tcp://${mdnsIp}:${mdnsPort}`;
                            serialPortOptions.adapter = mdnsAdapter;
                            serialPortOptions.baudRate = mdnsBaud;
                            
                            if (adapterLookup.hasOwnProperty(serialPortOptions.adapter) 
                                    && serialPortOptions.adapter !== 'auto') {
                                adapter = adapterLookup[serialPortOptions.adapter];
                                resolve(
                                    new adapter(networkOptions, serialPortOptions, backupPath, adapterOptions)
                                );
                            } else {
                                reject(new Error(`Adapter ${serialPortOptions.adapter} is not supported.`));
                            }
                        } else {
                            bj.destroy();
                            reject(new Error(
                                `Coordinator returned wrong Zeroconf format! The following values are expected:\n` +
                                `txt.radio_type, got: ${service.txt?.radio_type}\n` +
                                `txt.baud_rate, got: ${service.txt?.baud_rate}\n` +
                                `address, got: ${service.addresses?.[0]}\n` +
                                `port, got: ${service.port}`
                            ));
                        }
                    } else {
                        bj.destroy();
                        reject(new Error(`Coordinator [${mdnsDevice}] not found after timeout of ${mdnsTimeout}ms!`));
                    }
                });
            });
        } else {
            try {
                // Determine adapter to use
                for (const candidate of adapters) {
                    if (await candidate.isValidPath(serialPortOptions.path)) {
                        logger.debug(`Path '${serialPortOptions.path}' is valid for '${candidate.name}'`, NS);
                        adapter = candidate;
                        break;
                    }
                }
            } catch (error) {
                logger.debug(`Failed to validate path: '${error}'`, NS);
            }
        }

        return new adapter(networkOptions, serialPortOptions, backupPath, adapterOptions);
    }

    public abstract start(): Promise<TsType.StartResult>;

    public abstract stop(): Promise<void>;

    public abstract getCoordinator(): Promise<TsType.Coordinator>;

    public abstract getCoordinatorVersion(): Promise<TsType.CoordinatorVersion>;

    public abstract reset(type: 'soft' | 'hard'): Promise<void>;

    public abstract supportsBackup(): Promise<boolean>;

    public abstract backup(ieeeAddressesInDatabase: string[]): Promise<Models.Backup>;

    public abstract getNetworkParameters(): Promise<TsType.NetworkParameters>;

    public abstract supportsChangeChannel(): Promise<boolean>;

    public abstract changeChannel(newChannel: number): Promise<void>;

    public abstract setTransmitPower(value: number): Promise<void>;

    public abstract addInstallCode(ieeeAddress: string, key: Buffer): Promise<void>;

    public abstract waitFor(
        networkAddress: number, endpoint: number, frameType: Zcl.FrameType, direction: Zcl.Direction,
        transactionSequenceNumber: number, clusterID: number, commandIdentifier: number, timeout: number,
    ): {promise: Promise<ZclPayload>; cancel: () => void};

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
        ieeeAddr: string, networkAddress: number, endpoint: number, zclFrame: Zcl.Frame, timeout: number,
        disableResponse: boolean, disableRecovery: boolean, sourceEndpoint?: number,
    ): Promise<ZclPayload>;

    public abstract sendZclFrameToGroup(groupID: number, zclFrame: Zcl.Frame, sourceEndpoint?: number): Promise<void>;

    public abstract sendZclFrameToAll(endpoint: number, zclFrame: Zcl.Frame, sourceEndpoint: number, destination: BroadcastAddress): Promise<void>;

    /**
     * InterPAN
     */

    public abstract setChannelInterPAN(channel: number): Promise<void>;

    public abstract sendZclFrameInterPANToIeeeAddr(zclFrame: Zcl.Frame, ieeeAddress: string): Promise<void>;

    public abstract sendZclFrameInterPANBroadcast(
        zclFrame: Zcl.Frame, timeout: number
    ): Promise<ZclPayload>;

    public abstract restoreChannelInterPAN(): Promise<void>;

}

export default Adapter;
