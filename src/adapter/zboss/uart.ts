import EventEmitter from "stream";
import {Socket} from "net";
import SocketPortUtils from "../socketPortUtils";
import {SerialPort} from "../serialPort";
import {SerialPortOptions} from "../tstype";
import {Wait} from "../../utils";
import {logger} from "../../utils/logger";
import {ZBOSSWriter} from "./writer";
import {ZBOSSReader} from "./reader";
import {ESCAPE, ESCEND, END, ESCESC} from "./consts";
import {ZBOSSFrame, readZBOSSFrame, writeZBOSSFrame} from "./frame";

const NS = 'zh:zboss:uart';

export class ZBOSSUart extends EventEmitter {
    private readonly portOptions: SerialPortOptions;
    private serialPort: SerialPort;
    private socketPort: Socket;
    private writer: ZBOSSWriter;
    private reader: ZBOSSReader;

    private closing: boolean;

    constructor(options: SerialPortOptions) {
        super();

        this.portOptions = options;
        this.serialPort = null;
        this.socketPort = null;
    }

    public async resetNcp(): Promise<boolean> {
        if (this.closing) {
            return false;
        }

        logger.info(`NCP reset`, NS);

        try {
            if (!this.portOpen) {
                await this.openPort();
            }

            return true;
        } catch (err) {
            logger.error(`Failed to init port with error ${err}`, NS);

            return false;
        }
    }

    get portOpen(): boolean {
        if (this.closing) {
            return false;
        }
        if (SocketPortUtils.isTcpPath(this.portOptions.path)) {
            return this.socketPort && !this.socketPort.closed;
        } else {
            return this.serialPort && this.serialPort.isOpen;
        }
    }

    public async start(): Promise<boolean> {
        if (!this.portOpen) {
            return false;
        }

        logger.info(`UART starting`, NS);

        try {
            if (this.serialPort != null) {
                // clear read/write buffers
                await this.serialPort.asyncFlush();
            }
        } catch (err) {
            logger.error(`Error while flushing before start: ${err}`, NS);
        }

        return true;
    }

    public async stop(): Promise<void> {
        this.closing = true;
        await this.closePort();

        logger.info(`UART stopped`, NS);
    }

    private async openPort(): Promise<void> {
        await this.closePort();

        if (!SocketPortUtils.isTcpPath(this.portOptions.path)) {
            const serialOpts = {
                path: this.portOptions.path,
                baudRate: typeof this.portOptions.baudRate === 'number' ? this.portOptions.baudRate : 115200, 
                rtscts: typeof this.portOptions.rtscts === 'boolean' ? this.portOptions.rtscts : false,
                autoOpen: false,
                parity: 'none' as const,
                stopBits: 1 as const,
                xon: false,
                xoff: false,
            };

            // enable software flow control if RTS/CTS not enabled in config
            if (!serialOpts.rtscts) {
                logger.info(`RTS/CTS config is off, enabling software flow control.`, NS);
                serialOpts.xon = true;
                serialOpts.xoff = true;
            }

            //@ts-expect-error Jest testing
            if (this.portOptions.binding != null) {
                //@ts-expect-error Jest testing
                serialOpts.binding = this.portOptions.binding;
            }

            logger.debug(`Opening serial port with ${JSON.stringify(serialOpts)}`, NS);
            this.serialPort = new SerialPort(serialOpts);

            this.writer = new ZBOSSWriter();
            this.writer.pipe(this.serialPort);

            this.reader = new ZBOSSReader();
            this.serialPort.pipe(this.reader);
            this.reader.on('data', this.onFrame.bind(this));
            
            try {
                await this.serialPort.asyncOpen();
                logger.info(`Serial port opened`, NS);

                this.serialPort.once('close', this.onPortClose.bind(this));
                this.serialPort.on('error', this.onPortError.bind(this));
            } catch (error) {
                await this.stop();

                throw error;
            }
        } else {
            const info = SocketPortUtils.parseTcpPath(this.portOptions.path);
            logger.debug(`Opening TCP socket with ${info.host}:${info.port}`, NS);

            this.socketPort = new Socket();
            this.socketPort.setNoDelay(true);
            this.socketPort.setKeepAlive(true, 15000);

            this.writer = new ZBOSSWriter();
            this.writer.pipe(this.socketPort);

            this.reader = new ZBOSSReader();
            this.socketPort.pipe(this.reader);
            this.reader.on('data', this.onFrame.bind(this));

            return new Promise((resolve, reject): void => {
                const openError = async (err: Error): Promise<void> => {
                    await this.stop();

                    reject(err);
                };

                this.socketPort.on('connect', () => {
                    logger.debug(`Socket connected`, NS);
                });
                this.socketPort.on('ready', async (): Promise<void> => {
                    logger.info(`Socket ready`, NS);
                    this.socketPort.removeListener('error', openError);
                    this.socketPort.once('close', this.onPortClose.bind(this));
                    this.socketPort.on('error', this.onPortError.bind(this));

                    resolve();
                });
                this.socketPort.once('error', openError);

                this.socketPort.connect(info.port, info.host);
            });
        }
    }

    public async closePort(): Promise<void> {
        if (this.serialPort?.isOpen) {
            try {
                await this.serialPort.asyncFlushAndClose();
            } catch (err) {
                logger.error(`Failed to close serial port ${err}.`, NS);
            }

            this.serialPort.removeAllListeners();
        } else if (this.socketPort != null && !this.socketPort.closed) {
            this.socketPort.destroy();
            this.socketPort.removeAllListeners();
        }
    }

    private async onPortClose(err: boolean | Error): Promise<void> {
        logger.info(`Port closed. Error? ${err ?? 'no'}`, NS);
    }

    private async onPortError(error: Error): Promise<void> {
        logger.info(`Port error: ${error}`, NS);
    }

    private* unescape(buffer: Buffer): Generator<number> {
        let escaped = false;
        for (const byte of buffer) {
            if (escaped) {
                if (byte === ESCEND) {
                    yield END;
                } else if (byte === ESCESC) {
                    yield ESCAPE;
                }
                escaped = false;
            } else {
                if (byte === ESCAPE) {
                    escaped = true;
                } else {
                    yield byte;
                }
            }
        }
    }

    private* escape(buffer: Buffer): Generator<number> {
        for (const byte of buffer) {
            if (byte === END) {
                yield ESCAPE;
                yield ESCEND;
            } else if (byte === ESCAPE) {
                yield ESCAPE;
                yield ESCESC;
            } else {
                yield byte;
            }
        }
    }

    private onFrame(buffer: Buffer): void {
        const frameBuffer: Buffer = Buffer.from([...this.unescape(buffer)]);
        try {
            const frame = readZBOSSFrame(frameBuffer);
            if (frame) {
                this.emit('frame', frame);
            }
        } catch (error) {
            logger.debug(`<-- error ${error.stack}`, NS);
        }
    }

    public sendFrame(frame: ZBOSSFrame): void {
        try {
            const b = this.escape(writeZBOSSFrame(frame));
            this.writer.push(b);
        } catch (error) {
            logger.debug(`--> error ${error.stack}`, NS);
        }
    }
}