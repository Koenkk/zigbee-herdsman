import { Queue } from "../../../utils";
import { Adapter, TsType } from "../..";
import { Backup } from "../../../models";
import * as Zcl from "../../../zspec/zcl";
import {
    Coordinator,
} from '../../tstype';
import {
    ZclPayload
} from "../../events";
import {BroadcastAddress} from '../../../zspec/enums';
import {ZBOSSDriver} from '../driver';
import {logger} from "../../../utils/logger";
const NS = 'zh:zboss';

export class ZBOSSAdapter extends Adapter {
    private queue: Queue;
    private readonly driver: ZBOSSDriver;

    constructor(networkOptions: TsType.NetworkOptions, serialPortOptions: TsType.SerialPortOptions, backupPath: string,
        adapterOptions: TsType.AdapterOptions) {
        super(networkOptions, serialPortOptions, backupPath, adapterOptions);
        const concurrent = adapterOptions && adapterOptions.concurrent ? adapterOptions.concurrent : 8;
        logger.debug(`Adapter concurrent: ${concurrent}`, NS);
        this.queue = new Queue(concurrent);
        
        this.driver = new ZBOSSDriver(serialPortOptions, networkOptions);
    }

    public static async isValidPath(path: string): Promise<boolean> {
        return true;
    }

    public static async autoDetectPath(): Promise<string> {
        return null;
    }

    public async start(): Promise<TsType.StartResult> {
        logger.info(`ZBOSS Adapter starting`, NS);

        await this.driver.start();
        await this.driver.startup();

        return 'resumed';
    }

    public async stop(): Promise<void> {
        this.driver.stop();
        
        logger.info(`ZBOSS Adapter stopped`, NS);
    }

    public async getCoordinator(): Promise<Coordinator> {
        return this.queue.execute<Coordinator>(async () => {
            const info = await this.driver.getCoordinator();
            logger.debug(`ZBOSS Adapter Coordinator description:\n${JSON.stringify(info)}`, NS);
            return {
                networkAddress: info.networkAddress,
                manufacturerID: 0,
                ieeeAddr: info.ieeeAddr,
                endpoints: info.endpoints,
            };
        });
    }

    public async getCoordinatorVersion(): Promise<TsType.CoordinatorVersion> {
        return this.driver.getCoordinatorVersion();
    }

    public async reset(type: "soft" | "hard"): Promise<void> {
        return Promise.reject(new Error("Not supported"));
    }

    public async supportsBackup(): Promise<boolean> {
        return true;
    }

    public async backup(ieeeAddressesInDatabase: string[]): Promise<Backup> {
        return null;
    }

    public async getNetworkParameters(): Promise<TsType.NetworkParameters> {
        return this.queue.execute<TsType.NetworkParameters>(async () => {
            const channel = this.driver.netInfo.network.channel;
            const panID = this.driver.netInfo.network.panID;
            const extendedPanID = this.driver.netInfo.network.extendedPanID;

            return {
                panID,
                extendedPanID: parseInt(Buffer.from(extendedPanID).toString('hex'), 16),
                channel,
            };
        });
    }

    public async supportsChangeChannel(): Promise<boolean> {
        return false;
    }

    public async changeChannel(newChannel: number): Promise<void> {
        return null;
    }

    public async setTransmitPower(value: number): Promise<void> {
        return null;
    }

    public async addInstallCode(ieeeAddress: string, key: Buffer): Promise<void> {
        return null;
    }

    public waitFor(networkAddress: number, endpoint: number, frameType: Zcl.FrameType, direction: Zcl.Direction, transactionSequenceNumber: number,
        clusterID: number, commandIdentifier: number, timeout: number): {promise: Promise<ZclPayload>; cancel: () => void;} {
        return null;
    }

    public async permitJoin(seconds: number, networkAddress: number): Promise<void> {
        return null;
    }

    public async lqi(networkAddress: number): Promise<TsType.LQI> {
        return null;
    }

    public async routingTable(networkAddress: number): Promise<TsType.RoutingTable> {
        return null;
    }

    public async nodeDescriptor(networkAddress: number): Promise<TsType.NodeDescriptor> {
        return null;
    }

    public async activeEndpoints(networkAddress: number): Promise<TsType.ActiveEndpoints> {
        return null;
    }

    public async simpleDescriptor(networkAddress: number, endpointID: number): Promise<TsType.SimpleDescriptor> {
        return null;
    }

    public async bind(destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number, clusterID: number,
        destinationAddressOrGroup: string | number, type: "endpoint" | "group", destinationEndpoint?: number): Promise<void> {
        return null;
    }

    public async unbind(destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number, clusterID: number,
        destinationAddressOrGroup: string | number, type: "endpoint" | "group", destinationEndpoint: number): Promise<void> {
        return null;
    }

    public async removeDevice(networkAddress: number, ieeeAddr: string): Promise<void> {
        return null;
    }

    public async sendZclFrameToEndpoint(ieeeAddr: string, networkAddress: number, endpoint: number, zclFrame: Zcl.Frame, timeout: number,
        disableResponse: boolean, disableRecovery: boolean, sourceEndpoint?: number): Promise<ZclPayload> {
        return null;
    }

    public async sendZclFrameToGroup(groupID: number, zclFrame: Zcl.Frame, sourceEndpoint?: number): Promise<void> {
        return null;
    }

    public async sendZclFrameToAll(endpoint: number, zclFrame: Zcl.Frame, sourceEndpoint: number, destination: BroadcastAddress): Promise<void> {
        return null;
    }

    public async setChannelInterPAN(channel: number): Promise<void> {
        return null;
    }

    public async sendZclFrameInterPANToIeeeAddr(zclFrame: Zcl.Frame, ieeeAddress: string): Promise<void> {
        return null;
    }

    public async sendZclFrameInterPANBroadcast(zclFrame: Zcl.Frame, timeout: number): Promise<ZclPayload> {
        return null;
    }

    public async restoreChannelInterPAN(): Promise<void> {
        return null;
    }
}