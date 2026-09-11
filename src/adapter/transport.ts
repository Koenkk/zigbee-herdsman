import events from "node:events";
import {Socket} from "node:net";
import {platform} from "node:os";
import {autoDetect, type SetOptions} from "@serialport/bindings-cpp";
import {type ModemBitsCallback, type OpenOptions, SerialPortStream} from "@serialport/stream";
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
    private serialPort?: SerialPortStream;
    private socket?: Socket;
    private opening = false;
    private closing = false;
    readonly options: TransportOptions;
    /** Access to the lower level, arch-specific binding. Mainly for tests. */
    serialPortBinding: OpenOptions["binding"] | undefined;

    constructor(options: TransportOptions) {
        super();

        this.options = options;
    }

    get isOpen(): boolean {
        return !this.opening && !this.closing && (this.serialPort?.isOpen ?? (this.socket !== undefined && !this.socket.closed));
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

    get serialPortInstance(): SerialPortStream | undefined {
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
                serialPort.removeAllListeners();

                if (serialPort.isOpen) {
                    await new Promise<void>((resolve, reject): void => {
                        serialPort.close((err) => (err ? reject(err) : resolve()));
                    });
                }
            } else if (socket) {
                socket.removeAllListeners();
                socket.destroy();
            }
        } finally {
            this.closing = false;
        }
    }

    public write(data: Buffer): boolean {
        if (!this.isOpen) {
            throw new Error("Cannot write while transport is closed");
        }

        // expensive and very verbose, enable locally only if necessary
        // logger.debug(() => `>>>> [TRANSPORT ${data.toString("hex")}]`, NS);

        return (this.serialPort ?? this.socket)?.write(data) ?? false;
    }

    public async set(options: SetOptions): Promise<void> {
        if (!this.serialPort) {
            throw new Error("Serial control operations are unavailable on a TCP transport");
        }

        if (!this.serialPort.isOpen) {
            throw new Error("Cannot set while transport is closed");
        }

        await new Promise<void>((resolve, reject): void => {
            this.serialPort?.set(options, (err) => (err ? reject(err) : resolve()));
        });
    }

    public async get(): Promise<Parameters<ModemBitsCallback>[1]> {
        if (!this.serialPort) {
            throw new Error("Serial control operations are unavailable on a TCP transport");
        }

        if (!this.serialPort.isOpen) {
            throw new Error("Cannot get while transport is closed");
        }

        return await new Promise((resolve, reject): void => {
            this.serialPort?.get((err, options) => (err ? reject(err) : resolve(options)));
        });
    }

    /**
     * TODO: enhance flow control setting (no, sw, hw) instead of relying on in-adapter boolean flipping
     *       requires Z2M migration for no-break
     */
    private async openSerial(path: string, noFlowCtrl: boolean): Promise<void> {
        const rtscts = this.options.rtscts ?? false;
        const swFlow = !rtscts && !noFlowCtrl;

        if (!this.serialPortBinding) {
            this.serialPortBinding = autoDetect() as OpenOptions["binding"];
        }

        const openOptions: OpenOptions = {
            path,
            baudRate: this.options.baudRate ?? 115200,
            rtscts,
            xon: swFlow,
            xoff: swFlow,
            dataBits: 8,
            parity: "none",
            stopBits: 1,
            autoOpen: false,
            binding: this.serialPortBinding,
        };

        if (platform() === "win32") {
            // this controls `DTR` on "open", whereas on Unix, it's on "close"
            // https://github.com/serialport/bindings-cpp/blob/19820c39fbbedc1b5f09d6508b5ef1268df3d455/src/serialport_win.cpp#L123-L127
            // https://github.com/serialport/bindings-cpp/blob/19820c39fbbedc1b5f09d6508b5ef1268df3d455/src/serialport_unix.cpp#L254-L256
            openOptions.hupcl = false;
        }

        const serialPort = new SerialPortStream(openOptions);
        this.serialPort = serialPort;

        serialPort.on("data", (data: Buffer) => {
            // expensive and very verbose, enable locally only if necessary
            // logger.debug(() => `<<<< [TRANSPORT ${data.toString("hex")}]`, NS);
            this.emit("data", data);
        });
        serialPort.once("close", (error) => this.onClose(serialPort, error));
        serialPort.on("error", (error) => logger.error(`Serial port error: ${error}`, NS));

        // TODO: WORKAROUND https://github.com/serialport/node-serialport/issues/3148
        {
            const [nodeMajor = 0, nodeMinor = 0] = process.versions.node.split(".").map(Number);

            if (nodeMajor > 26 || (nodeMajor === 26 && nodeMinor >= 4)) {
                setInterval(() => undefined, 16).unref();
            }
        }

        try {
            await new Promise<void>((resolve, reject): void => {
                serialPort.open((err) => (err ? reject(err) : resolve()));
            });

            logger.info("Serial port opened", NS);
        } catch (error) {
            this.serialPort = undefined;

            serialPort.removeAllListeners();

            if (serialPort.isOpen) {
                await new Promise<void>((resolve, reject): void => {
                    serialPort.close((err) => (err ? reject(err) : resolve()));
                });
            }

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

    private onClose(port: SerialPortStream | Socket, error?: boolean | Error): void {
        if (port === this.serialPort) {
            this.serialPort = undefined;
        } else if (port === this.socket) {
            this.socket = undefined;
        } else {
            return;
        }

        this.emit("close", error);
    }
}
