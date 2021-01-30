import * as t from './types';
import { Writer, Parser, FLAG, CANCEL } from './uart';
import { COMMANDS, ZDO_COMMANDS } from './commands';

import { Deferred, crc16ccitt } from './utils';
import { EmberStatus, EmberOutgoingMessageType, EzspPolicyId, EzspDecisionId, EzspDecisionBitmask } from './types/named';
import { EventEmitter } from 'events';
import { EmberApsFrame } from './types/struct';
import SerialPort from 'serialport';
import net from 'net';
import SocketPortUtils from '../../socketPortUtils';
import Debug from "debug";

const debug = {
    error: Debug('zigbee-herdsman:adapter:ezsp:error'),
    log: Debug('zigbee-herdsman:adapter:ezsp:log'),
};

enum NcpResetCode {
    RESET_UNKNOWN_REASON = 0x00,
    RESET_EXTERNAL = 0x01,
    RESET_POWER_ON = 0x02,
    RESET_WATCHDOG = 0x03,
    RESET_ASSERT = 0x06,
    RESET_BOOTLOADER = 0x09,
    RESET_SOFTWARE = 0x0B,
    ERROR_EXCEEDED_MAXIMUM_ACK_TIMEOUT_COUNT = 0x51,
    ERROR_UNKNOWN_EM3XX_ERROR = 0x80,
}

const RANDOMIZE_START = 0x42;
const RANDOMIZE_SEQ = 0xB8;


export class Ezsp extends EventEmitter {
    ezsp_version = 4;
    _seq = 0;
    send_seq = 0;
    recv_seq = 0;
    _tc_policy: any;
    _awaiting = new Map<number, { expectedId: number, schema: any, deferred: Deferred<Buffer> }>();
    COMMANDS_BY_ID = new Map<number, { name: string, inArgs: any[], outArgs: any[] }>();
    _cbCounter = 0;
    reset_deferred: Deferred<any>;
    private portType: 'serial' | 'socket';
    private serialPort: SerialPort;
    private socketPort: net.Socket;
    private writer: Writer;
    private parser: Parser;
    private initialized: boolean;

    constructor() {
        super();
        this.initialized = false;
        for (let name in COMMANDS) {
            let details = (<any>COMMANDS)[name];
            this.COMMANDS_BY_ID.set(details[0], { name, inArgs: details[1], outArgs: details[2] });
        }

        this.onParsed = this.onParsed.bind(this);
        this.onPortClose = this.onPortClose.bind(this);
    }
    
    //////////////////////// serial routines ////////////////////////

    private onParsed(data: Buffer): void {
        try {
            // const object = ZpiObject.fromUnpiFrame(frame);
            // const message =
            //     `<-- ${Subsystem[object.subsystem]} - ${object.command} - ${JSON.stringify(object.payload)}`;
            // this.log(object.type, message);
            // this.waitress.resolve(object);
            // this.emit('received', object);
            //debug.log(`<===== frame   : ${data.toString('hex')}`);
            /* Frame receive handler */
            switch (true) {
                case ((data[0] & 128) === 0):
                    debug.log("DATA frame: %s", data.toString('hex'));
                    this.data_frame_received(data);
                    break;
            
                case ((data[0] & 224) === 128):
                    debug.log("ACK frame: %s", data.toString('hex'));
                    this.handle_ack(data[0]);
                    break;

                case ((data[0] & 224) === 160):
                    debug.log("NAK frame: %s", data.toString('hex'));
                    this.handle_nak(data[0]);
                    break;

                case (data[0] === 192):
                    debug.log("RST frame: %s", data.toString('hex'));
                    break;
                
                case (data[0] === 193):
                    debug.log("RSTACK frame: %s", data.toString('hex'));
                    this.rstack_frame_received(data);
                    break;

                case (data[0] === 194):
                    debug.log("Error frame:", data.toString('hex'));
                    break;
                default:
                    debug.error("UNKNOWN FRAME RECEIVED: %r", data);
            }
            
        } catch (error) {
            debug.error(`Error while parsing to ZpiObject '${error.stack}'`);
        }
    }

    private data_frame_received(data: Buffer) {
        /* Data frame receive handler */
        var seq;
        seq = ((data[0] & 112) >> 4);
        this.recv_seq = ((seq + 1) % 8);
        debug.log('send ACK');
        this.writer.writeBuffer(this.make_ack_frame());
        this.handle_ack(data[0]);
        data = data.slice(1, (- 3));
        //this.waitress.resolve(data);
        //this.emit('received', this.randomize(data));
        const frame = this.randomize(data);
        this.frame_received(frame);
    }

    private handle_ack(control: number) {
        /* Handle an acknowledgement frame */
        // var ack, pending;
        // ack = (((control & 7) - 1) % 8);
        // if ((ack === this._pending[0])) {
        //     [pending, this._pending] = [this._pending, [(- 1), null]];
        //     pending[1].set_result(true);
        // }
    }

    private handle_nak(control: number) {
        /* Handle negative acknowledgment frame */
        // let nak = (control & 7);
        // if ((nak === this._pending[0])) {
        //     this._pending[1].set_result(false);
        // }
    }

    private rstack_frame_received(data: Buffer) {
        /* Reset acknowledgement frame receive handler */
        var code;
        this.send_seq = 0;
        this.recv_seq = 0;
        try {
            code = NcpResetCode[data[2]];
        } catch (e) {
            code = NcpResetCode.ERROR_UNKNOWN_EM3XX_ERROR;
        }
        debug.log("RSTACK Version: %d Reason: %s frame: %s", data[1], code.toString(), data.toString('hex'));
        if (NcpResetCode[<any>code].toString() !== NcpResetCode.RESET_SOFTWARE.toString()) {
            return;
        }
        if ((!this.reset_deferred)) {
            debug.log("Reset future is None");
            return;
        }
        this.reset_deferred.resolve(true);
    }

    private make_ack_frame(): Buffer {
        /* Construct a acknowledgement frame */
        console.assert(((0 <= this.recv_seq) && (this.recv_seq < 8)));
        return this.make_frame([(0b10000000 | (this.recv_seq & 0b00000111))]);
    }

    private make_frame(control: ArrayLike<number>, data?: ArrayLike<number>): Buffer {
        /* Construct a frame */
        const ctrlArr: Array<number> = Array.from(control);
        const dataArr: Array<number> = (data && Array.from(data)) || [];

        const sum = ctrlArr.concat(dataArr);

        let crc = crc16ccitt(Buffer.from(sum), 65535);
        let crcArr = [(crc >> 8), (crc % 256)];
        return Buffer.concat([this.writer.stuff(sum.concat(crcArr)), Buffer.from([FLAG])]);
    }

    private randomize(s: Buffer): Buffer {
        /*XOR s with a pseudo-random sequence for transmission
        Used only in data frames
        */
        let rand = RANDOMIZE_START;
        let out = Buffer.alloc(s.length);
        let outIdx = 0;
        for (let c of s){
            out.writeUInt8(c ^ rand, outIdx++);
            if ((rand % 2)) {
                rand = ((rand >> 1) ^ RANDOMIZE_SEQ);
            } else {
                rand = (rand >> 1);
            }
        }
        return out;
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    private onPortClose(): void {
        debug.log('Port closed');
        this.initialized = false;
        this.emit('close');
    }

    async connect(path: string, options: {}) {
        this.portType = SocketPortUtils.isTcpPath(path) ? 'socket' : 'serial';
        this.portType === 'serial' ? await this.openSerialPort(path, options) : await this.openSocketPort(path, options);
    }

    private async openSerialPort(path: string, opt: {}): Promise<void> {
        // @ts-ignore
        const options = {baudRate: opt.baudRate, rtscts: false, autoOpen: false};

        debug.log(`Opening SerialPort with ${path} and ${JSON.stringify(options)}`);
        this.serialPort = new SerialPort(path, options);

        this.writer = new Writer();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.writer.pipe(this.serialPort);

        this.parser = new Parser();
        this.serialPort.pipe(this.parser);
        this.parser.on('parsed', this.onParsed);

        return new Promise((resolve, reject): void => {
            this.serialPort.open(async (error): Promise<void> => {
                if (error) {
                    reject(new Error(`Error while opening serialport '${error}'`));
                    this.initialized = false;
                    if (this.serialPort.isOpen) {
                        this.serialPort.close();
                    }
                } else {
                    debug.log('Serialport opened');
                    this.serialPort.once('close', this.onPortClose);
                    this.serialPort.once('error', (error) => {
                        debug.error(`Serialport error: ${error}`);
                    });
                    // reset
                    await this.reset();
                    this.initialized = true;
                    resolve();
                }
            });
        });
    }

    private async openSocketPort(path: string, options: {}): Promise<void> {
        const info = SocketPortUtils.parseTcpPath(path);
        debug.log(`Opening TCP socket with ${info.host}:${info.port}`);

        this.socketPort = new net.Socket();
        this.socketPort.setNoDelay(true);
        this.socketPort.setKeepAlive(true, 15000);

        this.writer = new Writer();
        this.writer.pipe(this.socketPort);

        this.parser = new Parser();
        this.socketPort.pipe(this.parser);
        this.parser.on('parsed', this.onParsed);

        return new Promise((resolve, reject): void => {
            this.socketPort.on('connect', function() {
                debug.log('Socket connected');
            });

            // eslint-disable-next-line
            const self = this;
            this.socketPort.on('ready', async (error): Promise<void> => {
                debug.log('Socket ready');
                // reset
                await this.reset();
                self.initialized = true;
                resolve();
            });

            this.socketPort.once('close', this.onPortClose);

            this.socketPort.on('error', function () {
                debug.log('Socket error');
                reject(new Error(`Error while opening socket`));
                self.initialized = false;
            });

            this.socketPort.connect(info.port, info.host);
        });
    }

    private write(data: Buffer) {
        debug.log("write data: %s", data.toString('hex'));
        let seq = this.send_seq;
        this.send_seq = ((seq + 1) % 8);
        let pack;
        try {
            pack = this.data_frame(data, seq, 0);
            this.writer.writeBuffer(pack);
        } catch (e) {
            pack = this.data_frame(data, seq, 1);
            this.writer.writeBuffer(pack);
        }
    }

    private data_frame(data: Buffer, seq: number, rxmit: number) {
        /* Construct a data frame */
        let control;
        console.assert(((0 <= seq) && (seq <= 7)));
        console.assert(((0 <= rxmit) && (rxmit <= 1)));
        control = (((seq << 4) | (rxmit << 3)) | this.recv_seq);
        return this.make_frame([control], this.randomize(data));
    }

    async reset() {
        // return this._gw.reset();
        debug.log('uart reseting');
        if ((this.reset_deferred)) {
            throw new TypeError("reset can only be called on a new connection");
        }
        /* Construct a reset frame */
        const rst_frame = Buffer.concat([Buffer.from([CANCEL]), this.make_frame([0xC0])]);
        //this.write(rst_frame);
        this.writer.writeBuffer(rst_frame);
        this.reset_deferred = new Deferred<void>();
        return this.reset_deferred.promise;
    }

    public close(): Promise<void> {
        return new Promise((resolve, reject): void => {
            if (this.initialized) {
                if (this.portType === 'serial') {
                    this.serialPort.flush((): void => {
                        this.serialPort.close((error): void => {
                            this.initialized = false;
                            error == null ?
                                resolve() :
                                reject(new Error(`Error while closing serialport '${error}'`));
                            this.emit('close');
                        });
                    });
                } else {
                    this.socketPort.destroy();
                    resolve();
                }
            } else {
                resolve();
                this.emit('close');
            }
        });
    }

    //////////////////////// command routines ////////////////////////

    private frame_received(data: Buffer) {
        /*Handle a received EZSP frame

        The protocol has taken care of UART specific framing etc, so we should
        just have EZSP application stuff here, with all escaping/stuffing and
        data randomization removed.
        */
        debug.log(`<=== Frame: ${data.toString('hex')}`);
        var frame_id: number, result, schema, sequence;
        if ((this.ezsp_version < 8)) {
            [sequence, frame_id, data] = [data[0], data[2], data.slice(3)];
        } else {
            sequence = data[0];
            [[frame_id], data] = t.deserialize(data.slice(3), [t.uint16_t]);
        }
        if ((frame_id === 255)) {
            frame_id = 0;
            if ((data.length > 1)) {
                frame_id = data[1];
                data = data.slice(2);
            }
        }
        let cmd = this.COMMANDS_BY_ID.get(frame_id);
        if (!cmd) throw new Error('Unrecognized command from FrameID' + frame_id);
        let frameName = cmd.name;
        debug.log("<=== Application frame %s (%s) received: %s", frame_id, frameName, data.toString('hex'));
        if (this._awaiting.has(sequence)) {
            let entry = this._awaiting.get(sequence);
            this._awaiting.delete(sequence);
            if (entry) {
                console.assert(entry.expectedId === frame_id);
                [result, data] = t.deserialize(data, entry.schema);
                debug.log(`<=== Application frame ${frame_id} (${frameName})   parsed: ${result}`);
                entry.deferred.resolve(result);
            }
        } else {
            schema = cmd.outArgs;
            frameName = cmd.name;
            [result, data] = t.deserialize(data, schema);
            debug.log(`<=== Application frame ${frame_id} (${frameName}): ${result}`);
            super.emit('frame', frameName, ...result);
        }
        if ((frame_id === 0)) {
            this.ezsp_version = result[0];
        }
    }

    async version() {
        let version = this.ezsp_version;
        let result = await this._command("version", version);
        if ((result[0] !== version)) {
            debug.log("Switching to eszp version %d", result[0]);
            await this._command("version", result[0]);
        }
        return result[0];
    }

    async networkInit() {
        let result;
        [result] = await this._command("networkInit");
        console.log('network init result', result);
        return result === EmberStatus.SUCCESS;
    }

    async leaveNetwork() {
        var fut: Deferred<any>, v, st;
        fut = new Deferred();
        this.on('frame', (frameName: string, response: any) => {
            if ((frameName === "stackStatusHandler")) {
                fut.resolve(response);
            }
        })
        v = await this._command("leaveNetwork");
        if ((v[0] !== EmberStatus.SUCCESS)) {
            debug.log("Failure to leave network:" + v);
            throw new Error(("Failure to leave network:" + v));
        }
        v = await fut.promise;
        if ((v !== EmberStatus.NETWORK_DOWN)) {
            debug.log("Failure to leave network:" + v);
            throw new Error(("Failure to leave network:" + v));
        }
        return v;
    }

    async setConfigurationValue(configId: number, value: any) {
        let ret;
        [ret] = await this.execCommand('setConfigurationValue', configId, value);
        console.assert(ret === EmberStatus.SUCCESS);
        debug.log('Set %s = %s', configId, value);
    }

    async getConfigurationValue(configId: number) {
        let ret, value;
        [ret, value] = await this.execCommand('getConfigurationValue', configId);
        console.assert(ret === EmberStatus.SUCCESS);
        debug.log('Get %s = %s', configId, value);
        return value;
    }

    async getMulticastTableEntry(index: number) {
        let ret, value;
        [ret, value] = await this.execCommand('getMulticastTableEntry', index);
        console.assert(ret === EmberStatus.SUCCESS);
        return [ret, value];
    }
    
    async setMulticastTableEntry(index: number, entry: t.EmberMulticastTableEntry) {
        let ret;
        [ret] = await this.execCommand('setMulticastTableEntry', index, entry);
        console.assert(ret === EmberStatus.SUCCESS);
        return [ret];
    }

    async setInitialSecurityState(entry: t.EmberInitialSecurityState) {
        let ret;
        [ret] = await this.execCommand('setInitialSecurityState', entry);
        console.assert(ret === EmberStatus.SUCCESS);
        return [ret];
    }

    async getCurrentSecurityState(){
        let ret, res;
        [ret, res] = await this.execCommand('getCurrentSecurityState');
        console.assert(ret === EmberStatus.SUCCESS);
        return [ret, res];
    }

    async setValue(valueId: t.EzspValueId, value: any) {
        let ret;
        [ret] = await this.execCommand('setValue', valueId, value);
        console.assert(ret === EmberStatus.SUCCESS);
        return [ret];
    }

    async getValue(valueId: t.EzspValueId) {
        let ret, value;
        [ret, value] = await this.execCommand('getValue', valueId);
        console.assert(ret === EmberStatus.SUCCESS);
        return value;
    }

    async updatePolicies() {
        // Set up the policies for what the NCP should do.
        const policies = [
            [EzspPolicyId.APP_KEY_REQUEST_POLICY, EzspDecisionId.DENY_APP_KEY_REQUESTS],
            [EzspPolicyId.TRUST_CENTER_POLICY, EzspDecisionBitmask.IGNORE_UNSECURED_REJOINS | EzspDecisionBitmask.ALLOW_JOINS],
            [EzspPolicyId.TC_KEY_REQUEST_POLICY, EzspDecisionId.ALLOW_TC_KEY_REQUESTS],
        ];

        for (let [policy, value] of policies) {
            const [status] = await this.execCommand('setPolicy', policy, value);
            console.assert(status == EmberStatus.SUCCESS);
        }
    }
   
    public make_zdo_frame(name: string, ...args: any[]): Buffer {
        var c, data, frame, cmd_id;
        c = (<any>ZDO_COMMANDS)[name];
        data = t.serialize(args, c[1]);
        return data;
    }

    private _ezsp_frame(name: string, ...args: any[]) {
        var c, data, frame, cmd_id;
        c = (<any>COMMANDS)[name];
        data = t.serialize(args, c[1]);
        frame = [(this._seq & 255)];
        if ((this.ezsp_version < 8)) {
            if ((this.ezsp_version >= 5)) {
                frame.push(0x00, 0xFF, 0x00, c[0]);
            } else {
                frame.push(0x00, c[0]);
            }
        } else {
            cmd_id = t.serialize([c[0]], [t.uint16_t]);
            frame.push(0x00, 0x01, ...cmd_id);
        }
        return Buffer.concat([Buffer.from(frame), data]);
    }

    private _command(name: string, ...args: any[]): Promise<Buffer> {
        var c, data, deferred;
        debug.log(`---> Send command ${name}: (${args})`);
        data = this._ezsp_frame(name, ...args);
        debug.log(`---> Send  data  ${name}: (${data.toString('hex')})`);
        //this._gw.data(data);
        this.write(data);
        c = (<any>COMMANDS)[name];
        deferred = new Deferred<Buffer>();
        this._awaiting.set(this._seq, { expectedId: c[0], schema: c[2], deferred });
        this._seq = (this._seq + 1 % 256);
        return deferred.promise;
    }

    async formNetwork(parameters: {}) {
        var fut: Deferred<any>, v, st;
        fut = new Deferred();
        this.on('frame', (frameName: string, response: any) => {
            if ((frameName === "stackStatusHandler")) {
                fut.resolve(response);
            }
        })
        v = await this._command("formNetwork", parameters);
        if ((v[0] !== EmberStatus.SUCCESS)) {
            debug.log("Failure forming network:" + v);
            throw new Error(("Failure forming network:" + v));
        }
        v = await fut.promise;
        if ((v !== EmberStatus.NETWORK_UP)) {
            debug.log("Failure forming network:" + v);
            throw new Error(("Failure forming network:" + v));
        }
        return v;
    }

    execCommand(name: string, ...args: any[]): any {
        if (Object.keys(COMMANDS).indexOf(name) < 0) {
            throw new Error('Unknown command: ' + name);
        }
        return this._command(name, ...args);
    }

    public parse_frame_payload(name: string, data: Buffer) {
        if (Object.keys(ZDO_COMMANDS).indexOf(name) < 0) {
            throw new Error('Unknown ZDO command: ' + name);
        }
        const c = (<any>ZDO_COMMANDS)[name];
        const result = t.deserialize(data, c[1])[0];
        return result;
    }

    public sendUnicast(direct: EmberOutgoingMessageType, nwk: number, apsFrame: EmberApsFrame, seq: number, data: Buffer) {
        return this.execCommand('sendUnicast', direct, nwk, apsFrame, seq, data);
    }
}
