import events from "node:events";
import {Socket} from "node:net";
import {NativeSerialPort, type NativeSerialPortOptions} from "@koenkk/serialport-napi-rs";
import {logger} from "../utils/logger";
import type {TransportOptions} from "./tstype";
import {isTcpPath, parseTcpPath} from "./utils";

interface TransportEventMap {
    data: [data: Buffer];
    close: [error?: boolean | Error];
}

const NS = "zh:adapter:transport";

/** A raw serial or TCP connection shared by an adapter's protocol stack. */
export class AdapterTransport extends events.EventEmitter<TransportEventMap> {
    private serialPort?: NativeSerialPort;
    private socket?: Socket;
    private opening = false;
    private closing = false;
    readonly options: TransportOptions;

    constructor(options: TransportOptions) {
        super();

        this.options = options;
    }

    get isOpen(): boolean {
        return !this.opening && !this.closing && (!!this.serialPort || (this.socket !== undefined && !this.socket.closed));
    }

    get isOpening(): boolean {
        return this.opening;
    }

    get isClosing(): boolean {
        return this.closing;
    }

    get isSerial(): boolean {
        return this.serialPort !== undefined;
    }

    get rtscts(): boolean {
        return this.options.rtscts ?? false;
    }

    get serialPortInstance(): NativeSerialPort | undefined {
        return this.serialPort;
    }

    get socketInstance(): Socket | undefined {
        return this.socket;
    }

    public async open(serialNoFlowCtrl = false): Promise<void> {
        if (this.isOpen) {
            await this.close();
        }

        if (!this.options.path) {
            throw new Error("Cannot open transport without a path");
        }

        this.opening = true;

        try {
            if (isTcpPath(this.options.path)) {
                await this.openSocket(this.options.path);
            } else {
                await this.openSerial(this.options.path, serialNoFlowCtrl);
            }
        } finally {
            this.opening = false;
        }
    }

    public async close(): Promise<void> {
        if (this.closing || (!this.serialPort && !this.socket)) {
            return;
        }

        this.closing = true;
        const serialPort = this.serialPort;
        const socket = this.socket;
        this.serialPort = undefined;
        this.socket = undefined;

        try {
            if (serialPort) {
                await serialPort.close();
            } else if (socket) {
                socket.removeAllListeners();
                socket.destroy();
            }
        } finally {
            this.closing = false;
        }
    }

    public async write(data: Buffer): Promise<void> {
        if (!this.isOpen) {
            throw new Error("Cannot write while transport is closed");
        }

        // expensive and very verbose, enable locally only if necessary
        // logger.debug(() => `>>>> [TRANSPORT ${data.toString("hex")}]`, NS);

        if (this.serialPort) {
            await this.serialPort.write(data);
        } else {
            // biome-ignore lint/style/noNonNullAssertion: one always valid from top check
            this.socket!.write(data);
        }
    }

    public async writeDataTerminalReady(level: boolean): Promise<void> {
        if (!this.serialPort) {
            throw new Error("Cannot write DTR while serial transport is closed");
        }

        return await this.serialPort.writeDataTerminalReady(level);
    }

    public async writeRequestToSend(level: boolean): Promise<void> {
        if (!this.serialPort) {
            throw new Error("Cannot write RTS while serial transport is closed");
        }

        return await this.serialPort.writeRequestToSend(level);
    }

    /**
     * TODO: enhance flow control setting (no, sw, hw) instead of relying on in-adapter boolean flipping
     *       requires Z2M migration for no-break
     */
    private async openSerial(path: string, noFlowCtrl: boolean): Promise<void> {
        const openOptions: NativeSerialPortOptions = {
            baudRate: this.options.baudRate ?? 115200,
            dataBits: 8,
            parity: "none",
            stopBits: 1,
            flowControl: this.options.rtscts ? "hardware" : noFlowCtrl ? "none" : "software",
        };

        try {
            const serialPort = await NativeSerialPort.open(path, openOptions, (error, data) => {
                if (error) {
                    logger.error(`Serial port error: ${error}`, NS);
                    this.onClose(serialPort, error);
                } else {
                    // expensive and very verbose, enable locally only if necessary
                    // logger.debug(() => `<<<< [TRANSPORT ${data.toString("hex")}]`, NS);
                    this.emit("data", data);
                }
            });
            this.serialPort = serialPort;

            logger.info("Serial port opened", NS);
        } catch (error) {
            this.serialPort = undefined;

            throw error;
        }
    }

    private async openSocket(path: string): Promise<void> {
        const {host, port} = parseTcpPath(path);
        const socket = new Socket();
        this.socket = socket;

        socket.setNoDelay(true);
        socket.setKeepAlive(true, 15000);
        socket.on("data", (data: Buffer) => {
            // expensive and very verbose, enable locally only if necessary
            // logger.debug(() => `<<<< [TRANSPORT ${data.toString("hex")}]`, NS);
            this.emit("data", data);
        });
        socket.once("close", (error) => this.onClose(socket, error));
        socket.on("error", (error) => logger.error(`TCP socket error: ${error}`, NS));

        try {
            await new Promise<void>((resolve, reject): void => {
                const onError = (error: Error): void => {
                    socket.removeListener("connect", resolve);
                    reject(error);
                };

                socket.once("error", onError);
                socket.once("connect", () => {
                    socket.removeListener("error", onError);
                    resolve();
                });
                socket.connect(port, host);
            });
            logger.info("Socket opened", NS);
        } catch (error) {
            this.socket = undefined;

            socket.removeAllListeners();
            socket.destroy();

            throw error;
        }
    }

    private onClose(port: NativeSerialPort | Socket, error?: boolean | Error): void {
        if (port === this.serialPort) {
            this.serialPort = undefined;
        } else if (port === this.socket) {
            this.socket = undefined;
            // defensive but likely unreachable, can't test
            /* v8 ignore start */
        } else {
            return;
        }
        /* v8 ignore stop */

        this.emit("close", error);
    }
}
