import EventEmitter from "events";
import {TsType} from "..";
import {logger} from "../../utils/logger";
import {ZBOSSUart} from "./uart";
import {ZBOSSFrame, makeFrame, FrameType} from "./frame";
import {KeyValue} from "../../controller/tstype";
import {ClusterId, EUI64, NodeId, ProfileId} from '../../zspec/tstypes';
import {Queue, Waitress, Wait} from '../../utils';
import {CommandId, ResetOptions} from "./enums";

const NS = 'zh:zboss:driv';

const MAX_INIT_ATTEMPTS = 5;


type ZBOSSWaitressMatcher = {
    sequence: number | null,
    commandId: number,
};

export class ZBOSSDriver extends EventEmitter {
    public readonly port: ZBOSSUart;
    public ieee: EUI64;
    private waitress: Waitress<ZBOSSFrame, ZBOSSWaitressMatcher>;
    private queue: Queue;
    cmdSeq = 0;  // command sequence

    constructor(options: TsType.SerialPortOptions) {
        super();
        const ieee = '0xFFFFFFFFFFFFFFFF';
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
                return status;
            }
        }

        return status;
    }

    public async reset(): Promise<void> {
        logger.info(`Driver reset`, NS);
        await this.execCommand(CommandId.NCP_RESET, {options: ResetOptions.NoOptions});
    }

    public async stop(): Promise<void> {
        await this.port.stop();

        logger.info(`Driver stopped`, NS);
    }

    private onFrame(frame: ZBOSSFrame): void {
        logger.info(`<== Frame: ${JSON.stringify(frame)}`, NS);
    }

    public async execCommand(commandId: number, params: KeyValue = null): Promise<ZBOSSFrame> {
        logger.debug(`==> ${CommandId[commandId]}(${commandId}): ${JSON.stringify(params)}`, NS);

        if (!this.port.portOpen) {
            throw new Error('Connection not initialized');
        }

        return this.queue.execute<ZBOSSFrame>(async (): Promise<ZBOSSFrame> => {
            const frame = makeFrame(FrameType.REQUEST, commandId, params);
            frame.sequence = this.cmdSeq;
            const waiter = this.waitFor(commandId, this.cmdSeq);
            this.cmdSeq = (this.cmdSeq + 1) & 255;

            try {
                logger.debug(`==> FRAME: ${JSON.stringify(frame)}`, NS);
                await this.port.sendFrame(frame);

                const response = await waiter.start().promise;

                return response;
            } catch (error) {
                this.waitress.remove(waiter.ID);
                throw new Error(`Failure send ${commandId}:` + JSON.stringify(frame));
            }
        });
    }

    public waitFor(commandId: number, sequence: number | null, timeout = 10000)
        : { start: () => { promise: Promise<ZBOSSFrame>; ID: number }; ID: number } {
        return this.waitress.waitFor({commandId, sequence}, timeout);
    }

    private waitressTimeoutFormatter(matcher: ZBOSSWaitressMatcher, timeout: number): string {
        return `${JSON.stringify(matcher)} after ${timeout}ms`;
    }

    private waitressValidator(payload: ZBOSSFrame, matcher: ZBOSSWaitressMatcher): boolean {
        return (
            (matcher.sequence == null || payload.sequence === matcher.sequence) &&
            (matcher.commandId == payload.commandId)
        );
    }
};