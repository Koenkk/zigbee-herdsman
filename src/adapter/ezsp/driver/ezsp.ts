import * as t from './types';
import { UartProtocol } from './uart';
import { COMMANDS } from './commands';

import { Deferred } from './utils';
import { EmberStatus, EmberOutgoingMessageType } from './types/named';
import { EventEmitter } from 'events';
import { EmberApsFrame } from './types/struct';
import { int_t } from 'zigbee-herdsman/src/adapter/ezsp/driver/types/basic';

export class Ezsp extends EventEmitter {
    ezsp_version = 4;
    _gw: UartProtocol;
    _port : any;
    _seq = 0;
    _awaiting = new Map<number, { expectedId: number, schema: any, deferred: Deferred<Buffer> }>();
    COMMANDS_BY_ID = new Map<number, { name: string, inArgs: any[], outArgs: any[] }>();
    _cbCounter = 0;
    logger: any;

    constructor(logger: any) {
        super();
        this.logger = logger;
        for (let name in COMMANDS) {
            let details = (<any>COMMANDS)[name];
            this.COMMANDS_BY_ID.set(details[0], { name, inArgs: details[1], outArgs: details[2] });
        }
    }

    async connect(device: string, options: {}) {
        console.assert(!this._gw);
        [this._gw, this._port] = await UartProtocol.connect(device, options, this.logger);
        this.startReadQueue();
    }

    private async startReadQueue() {
        for await (let frame of this._gw) {
            try {
                this.frame_received(frame);
            } catch (e) {
                this.logger('Error handling frame', e);
            }
        }
    }

    reset() {
        return this._gw.reset();
    }

    async version() {
        let version = this.ezsp_version;
        let result = await this._command("version", version);
        if ((result[0] !== version)) {
            this.logger("Switching to eszp version %d", result[0]);
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

    async setConfigurationValue(configId: number, value: any) {
        let ret;
        [ret] = await this.execCommand('setConfigurationValue', configId, value);
        console.assert(ret === EmberStatus.SUCCESS);
        this.logger('Set %s = %s', configId, value);
    }

    async getConfigurationValue(configId: number) {
        let ret, value;
        [ret, value] = await this.execCommand('getConfigurationValue', configId);
        console.assert(ret === EmberStatus.SUCCESS);
        this.logger('Get %s = %s', configId, value);
        return [ret, value];
    }

    async getMulticastTableEntry(index: number) {
        let ret, value;
        [ret, value] = await this.execCommand('getMulticastTableEntry', index);
        console.assert(ret === EmberStatus.SUCCESS);
        return [ret, value];
    }

    close() {
        return this._port.close();
    }

    private _ezsp_frame(name: string, ...args: any[]) {
        var c, data, frame, cmd_id;
        c = (<any>COMMANDS)[name];
        data = t.serialize(args, c[1]);
        frame = [(this._seq & 255)];
        // kirov
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
        this.logger("Send command %s", name);
        data = this._ezsp_frame(name, ...args);
        this._gw.data(data);
        c = (<any>COMMANDS)[name];
        deferred = new Deferred<Buffer>();
        this._awaiting.set(this._seq, { expectedId: c[0], schema: c[2], deferred });
        this._seq = (this._seq + 1 % 256);
        return deferred.promise;
    }

    /* private async _list_command(name: string, item_frames: Array<string>, completion_frame: any, spos: number, ...args: any[]) {
        // Run a command, returning result callbacks as a list
        var cbid, fut: Deferred<Buffer>, v;
        var cb;
        fut = new Deferred();
        let results: any[] = [];
        cb = (frameName: string, response: any) => {
            if (item_frames.indexOf(frameName) >= 0) {
                results.push(response);
            } else {
                if ((frameName === completion_frame)) {
                    fut.resolve(response);
                }
            }
        };
        cbid = this.add_callback(cb);
        try {
            v = await this._command(name, ...args);
            if ((v[0] !== 0)) {
                throw new Error(v);
            }
            v = await fut.promise;
            if ((v[spos] !== 0)) {
                throw new Error(v);
            }
        } finally {
            this.remove_callback(cbid);
        }
        return results;
    }*/


    async formNetwork(parameters: {}) {
        var fut: Deferred<Buffer>, v;
        fut = new Deferred();
        this.on('frame', (frameName: string, response: any) => {
            if ((frameName === "stackStatusHandler")) {
                fut.resolve(response);
            }
        })
        v = await this._command("formNetwork", parameters);
        if ((v[0] !== 0)) {
            throw new Error(("Failure forming network:" + v));
        }
        v = await fut.promise;
        if ((v[0] !== 0x90 /*EmberStatus.NETWORK_UP*/)) {
            throw new Error(("Failure forming network:" + v));
        }
        return v;
    }

    execCommand(name: string, ...args: any[]) {
        if (Object.keys(COMMANDS).indexOf(name) < 0) {
            throw new Error('Unknown command: ' + name);
        }
        return this._command(name, ...args);
    }

    frame_received(data: Buffer) {
        /*Handle a received EZSP frame

        The protocol has taken care of UART specific framing etc, so we should
        just have EZSP application stuff here, with all escaping/stuffing and
        data randomization removed.
        */
        var frame_id: number, result, schema, sequence;
        // kirov
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
        this.logger("Application frame %s (%s) received", frame_id, frameName);
        if (this._awaiting.has(sequence)) {
            let entry = this._awaiting.get(sequence);
            this._awaiting.delete(sequence);
            if (entry) {
                console.assert(entry.expectedId === frame_id);
                [result, data] = t.deserialize(data, entry.schema);
                entry.deferred.resolve(result);
            }
        } else {
            schema = cmd.outArgs;
            frameName = cmd.name;
            [result, data] = t.deserialize(data, schema);
            super.emit('frame', frameName, ...result);
        }
        if ((frame_id === 0)) {
            this.ezsp_version = result[0];
        }
    }

    public sendUnicast(direct: EmberOutgoingMessageType, nwk: number, apsFrame: EmberApsFrame, seq: number, data: Buffer) {
        return this.execCommand('sendUnicast', direct, nwk, apsFrame, seq, data);
    }
}
