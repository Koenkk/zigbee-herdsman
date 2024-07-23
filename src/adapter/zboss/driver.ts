import EventEmitter from "events";
import {TsType} from "..";
import {logger} from "../../utils/logger";
import {ZBOSSUart} from "./uart";
import {ZBOSSFrame, makeFrame, FrameType} from "./frame";
import {KeyValue,} from "../../controller/tstype";
import {ClusterId, EUI64, NodeId, ProfileId} from '../../zspec/tstypes';
import {Queue, Waitress, Wait} from '../../utils';
import {CommandId, ResetOptions, PolicyType} from "./enums";

const NS = 'zh:zboss:driv';

const MAX_INIT_ATTEMPTS = 5;


type ZBOSSWaitressMatcher = {
    tsn: number | null,
    commandId: number,
};

export class ZBOSSDriver extends EventEmitter {
    public readonly port: ZBOSSUart;
    private waitress: Waitress<ZBOSSFrame, ZBOSSWaitressMatcher>;
    private queue: Queue;
    tsn = 1;  // command sequence

    constructor(options: TsType.SerialPortOptions) {
        super();
        this.queue = new Queue();
        this.waitress = new Waitress<ZBOSSFrame, ZBOSSWaitressMatcher>(
            this.waitressValidator, this.waitressTimeoutFormatter);

        this.port = new ZBOSSUart(options);
        this.port.on('frame', this.onFrame.bind(this));
    }

    public async start(): Promise<boolean> {
        logger.info(`Driver starting`, NS);

        let status: boolean;

        for (let i = 0; i < MAX_INIT_ATTEMPTS; i++) {
            status = await this.port.resetNcp();

            // fail early if we couldn't even get the port set up
            if (!status) {
                return status;
            }

            status = await this.port.start();

            if (status) {
                logger.info(`Driver started`, NS);
                await this.reset();
                return status;
            }
        }

        return status;
    }

    private async reset(): Promise<void> {
        logger.info(`Driver reset`, NS);
        this.port.inReset = true;
        await this.execCommand(CommandId.NCP_RESET, {options: ResetOptions.NoOptions}, 10000);
    }

    public async startup(): Promise<TsType.StartResult> {
        logger.info(`Driver startup`, NS);
        let result: TsType.StartResult = 'resumed';
        await this.execCommand(CommandId.SET_TC_POLICY, {type: PolicyType.LINK_KEY_REQUIRED, value: 0});
        await this.execCommand(CommandId.SET_TC_POLICY, {type: PolicyType.IC_REQUIRED, value: 0});
        await this.execCommand(CommandId.SET_TC_POLICY, {type: PolicyType.TC_REJOIN_ENABLED, value: 1});
        await this.execCommand(CommandId.SET_TC_POLICY, {type: PolicyType.IGNORE_TC_REJOIN, value: 0});
        await this.execCommand(CommandId.SET_TC_POLICY, {type: PolicyType.APS_INSECURE_JOIN, value: 0});
        await this.execCommand(CommandId.SET_TC_POLICY, {type: PolicyType.DISABLE_NWK_MGMT_CHANNEL_UPDATE, value: 0});

        await this.execCommand(CommandId.GET_ZIGBEE_ROLE, {});

        return result;
    }

    public async stop(): Promise<void> {
        await this.port.stop();

        logger.info(`Driver stopped`, NS);
    }

    private onFrame(frame: ZBOSSFrame): void {
        logger.info(`<== Frame: ${JSON.stringify(frame)}`, NS);

        const handled = this.waitress.resolve(frame);

        if (!handled) {
            this.emit('frame', frame);
        }
    }

    public async execCommand(commandId: number, params: KeyValue = null, timeout: number = 10000): Promise<ZBOSSFrame> {
        logger.debug(`==> ${CommandId[commandId]}(${commandId}): ${JSON.stringify(params)}`, NS);

        if (!this.port.portOpen) {
            throw new Error('Connection not initialized');
        }

        return this.queue.execute<ZBOSSFrame>(async (): Promise<ZBOSSFrame> => {
            const frame = makeFrame(FrameType.REQUEST, commandId, params);
            frame.tsn = this.tsn;
            const waiter = this.waitFor(commandId, (commandId == CommandId.NCP_RESET) ? null : this.tsn, timeout);
            this.tsn = (this.tsn + 1) & 255;

            try {
                logger.debug(`==> FRAME: ${JSON.stringify(frame)}`, NS);
                await this.port.sendFrame(frame);

                const response = await waiter.start().promise;

                return response;
            } catch (error) {
                this.waitress.remove(waiter.ID);
                logger.error(`==> Error: ${error}`, NS);
                throw new Error(`Failure send ${commandId}:` + JSON.stringify(frame));
            }
        });
    }

    public waitFor(commandId: number, tsn: number | null, timeout = 10000)
        : { start: () => { promise: Promise<ZBOSSFrame>; ID: number }; ID: number } {
        return this.waitress.waitFor({commandId, tsn}, timeout);
    }

    private waitressTimeoutFormatter(matcher: ZBOSSWaitressMatcher, timeout: number): string {
        return `${JSON.stringify(matcher)} after ${timeout}ms`;
    }

    private waitressValidator(payload: ZBOSSFrame, matcher: ZBOSSWaitressMatcher): boolean {
        return (
            (matcher.tsn == null || payload.tsn === matcher.tsn) &&
            (matcher.commandId == payload.commandId)
        );
    }

    public async getCoordinator(): Promise<TsType.Coordinator> {
        const res = await this.execCommand(CommandId.GET_LOCAL_IEEE_ADDR, {mac: 0});
        const ieeeAddr = res.payload.ieee;
        // const message = await this.execCommand(CommandId.ZDO_ACTIVE_EP_REQ, {nwk: 0x0000});
        // const activeEndpoints = message.payload.endpoints;
        return {
            ieeeAddr,
            networkAddress: 0x0000,
            manufacturerID: 0x0000,
            endpoints:[],
        };
    }

    public async getCoordinatorVersion(): Promise<TsType.CoordinatorVersion> {
        const ver = await this.execCommand(CommandId.GET_MODULE_VERSION, {});
        const cver = await this.execCommand(CommandId.GET_COORDINATOR_VERSION, {});
        const ver2str = (version: number) => {
            const major = (version >> 24 & 0xFF);
            const minor = (version >> 16 & 0xFF);
            const revision = (version >> 8 & 0xFF);
            const commit = (version & 0xFF);
            return `${major}.${minor}.${revision}.${commit}`;
        };
        
        return {
            type: `zboss`,
            meta: {
                coordinator: cver.payload.version,
                stack: ver2str(ver.payload.stackVersion),
                protocol: ver2str(ver.payload.protocolVersion),
                revision: ver2str(ver.payload.fwVersion),
            },
        };
    }
};