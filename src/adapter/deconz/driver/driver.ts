/* istanbul ignore file */
/* eslint-disable */
import Debug from 'debug';
import events from 'events';
import SerialPort from 'serialport';
import Writer from './writer';
import Parser from './parser';
import Frame from './frame';
import PARAM from './constants';
import * as Events from '../../events';
import SerialPortUtils from '../../serialPortUtils';
import SocketPortUtils from '../../socketPortUtils';
import net from 'net';
import { Command, Request, parameterT, ApsDataRequest, ReceivedDataResponse, DataStateResponse } from './constants';

// @ts-ignore
import slip from 'slip';

const debug = Debug('zigbee-herdsman:deconz:driver');

const autoDetectDefinitions = [
    {manufacturer: 'dresden elektronik ingenieurtechnik GmbH', vendorId: '1cf1', productId: '0030'}, // Conbee II
];

var queue: Array<object> = [];
var busyQueue: Array<object> = [];
var apsQueue: Array<object> = [];
var apsBusyQueue: Array<object> = [];
var apsConfirmIndQueue: Array<object> = [];
var timeoutCounter = 0;
var readyToSend: boolean = true;

function enableRTS() {
    if (readyToSend === false) {
        readyToSend = true;
    }
}

function disableRTS() {
    readyToSend = false;
}

var enableRtsTimeout: ReturnType<typeof setTimeout> = null;

export { busyQueue, apsBusyQueue, readyToSend, enableRTS, disableRTS, enableRtsTimeout };

var frameParser = require('./frameParser');

const littleEndian = true;

class Driver extends events.EventEmitter {
    private path: string;
    private serialPort: SerialPort;
    private initialized: boolean;
    private writer: Writer;
    private parser: Parser;
    private frameParserEvent = frameParser.frameParserEvents;
    private seqNumber: number;
    private timeoutResetTimeout: any;
    private apsRequestFreeSlots: number;
    private apsDataConfirm: number;
    private apsDataIndication: number;
    private configChanged: number;
    private portType: 'serial' | 'socket';
    private socketPort: net.Socket;
    private DELAY: number;
    private READY_TO_SEND_TIMEOUT: number;
    private HANDLE_DEVICE_STATUS_DELAY: number;
    private PROCESS_QUEUES: number;

    public constructor(path: string) {
        super();
        this.path = path;
        this.initialized = false;
        this.seqNumber = 0;
        this.timeoutResetTimeout = null;
        this.portType = SocketPortUtils.isTcpPath(path) ? 'socket' : 'serial';

        this.apsRequestFreeSlots = 1;
        this.apsDataConfirm = 0;
        this.apsDataIndication = 0;
        this.configChanged = 0;
        this.DELAY = 0;
        this.READY_TO_SEND_TIMEOUT = 1;
        this.HANDLE_DEVICE_STATUS_DELAY = 5;
        this.PROCESS_QUEUES = 5;

        const that = this;
        setInterval(() => { that.deviceStateRequest()
                            .then(result => {})
                            .catch(error => {}); }, 10000);

        setInterval(() => {
            that.writeParameterRequest(0x26, 600) // reset watchdog // 10 minutes
                .then(result => {})
                .catch(error => {
                    //try again
                    debug("try again to reset watchdog");
                    that.writeParameterRequest(0x26, 600)
                    .then(result => {})
                    .catch(error => {debug("warning watchdog was not reset");});
                });
             }, (1000 * 60 * 8)); // 8 minutes

        this.onParsed = this.onParsed.bind(this);
        this.frameParserEvent.on('receivedDataNotification', (data: number) => {this.checkDeviceStatus(data)});
    }

    public setDelay(delay: number): void {
        debug(`Set delay to ${delay}`);
        this.DELAY = delay;
        this.READY_TO_SEND_TIMEOUT = delay;
        this.PROCESS_QUEUES = delay;
        this.HANDLE_DEVICE_STATUS_DELAY = delay;

        if (this.READY_TO_SEND_TIMEOUT === 0) {
            this.READY_TO_SEND_TIMEOUT = 1;
        }

        if (this.PROCESS_QUEUES < 5) {
            this.PROCESS_QUEUES = 5;
        }

        if (this.HANDLE_DEVICE_STATUS_DELAY < 5) {
            this.HANDLE_DEVICE_STATUS_DELAY = 5;
        }

        if (this.PROCESS_QUEUES > 60) {
            this.PROCESS_QUEUES = 60;
        }

        if (this.HANDLE_DEVICE_STATUS_DELAY > 60) {
            this.HANDLE_DEVICE_STATUS_DELAY = 60;
        }

        const that = this
        setInterval(() => { that.processQueue(); }, this.PROCESS_QUEUES);  // fire non aps requests
        setInterval(() => { that.processBusyQueue(); }, this.PROCESS_QUEUES); // check timeouts for non aps requests
        setInterval(() => { that.processApsQueue(); }, this.PROCESS_QUEUES);  // fire aps request
        setInterval(() => { that.processApsBusyQueue(); }, this.PROCESS_QUEUES);  // check timeouts for all open aps requests
        setInterval(() => { that.processApsConfirmIndQueue(); }, this.PROCESS_QUEUES);  // fire aps indications and confirms

        setInterval(() => { that.handleDeviceStatus()
                            .then(result => {})
                            .catch(error => {}); }, this.HANDLE_DEVICE_STATUS_DELAY); // query confirm and indication requests
    }

    public static async isValidPath(path: string): Promise<boolean> {
        return SerialPortUtils.is(path, autoDetectDefinitions);
    }

    public static async autoDetectPath(): Promise<string> {
        const paths = await SerialPortUtils.find(autoDetectDefinitions);
        return paths.length > 0 ? paths[0] : null;
    }

    private onPortClose(): void {
        debug('Port closed');
        this.initialized = false;
        this.emit('close');
    }

    public async open(): Promise<void> {
        return this.portType === 'serial' ? this.openSerialPort() : this.openSocketPort();
    }

    public openSerialPort(): Promise<void> {
        debug(`Opening with ${this.path}`);
        this.serialPort = new SerialPort(this.path, {baudRate: 38400, autoOpen: false});

        this.writer = new Writer();
        // @ts-ignore
        this.writer.pipe(this.serialPort);

        this.parser = new Parser();
        this.serialPort.pipe(this.parser);
        this.parser.on('parsed', this.onParsed);

        return new Promise((resolve, reject): void => {
            this.serialPort.open(async (error: object): Promise<void> => {
                if (error) {
                    reject(new Error(`Error while opening serialport '${error}'`));
                    this.initialized = false;
                    if (this.serialPort.isOpen) {
                        this.serialPort.close();
                    }
                } else {
                    debug('Serialport opened');
                    this.initialized = true;
                    resolve();
                }
            });
        });
    }

    private async openSocketPort(): Promise<void> {
        const info = SocketPortUtils.parseTcpPath(this.path);
        debug(`Opening TCP socket with ${info.host}:${info.port}`);
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
                debug('Socket connected');
            });

            // eslint-disable-next-line
            const self = this;
            this.socketPort.on('ready', async function() {
                debug('Socket ready');
                self.initialized = true;
                resolve();
            });

            this.socketPort.once('close', this.onPortClose);

            this.socketPort.on('error', function () {
                debug('Socket error');
                reject(new Error(`Error while opening socket`));
                self.initialized = false;
            });

            this.socketPort.connect(info.port, info.host);
        });
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

    public readParameterRequest(parameterId: number) : Promise<Command> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //debug(`push read parameter request to queue. seqNr: ${seqNumber} paramId: ${parameterId}`);
            const ts = 0;
            const commandId = PARAM.PARAM.FrameType.ReadParameter;
            const req: Request = {commandId, parameterId, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    public writeParameterRequest(parameterId: number, parameter: parameterT) : Promise<void> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //debug(`push write parameter request to queue. seqNr: ${seqNumber} paramId: ${parameterId} parameter: ${parameter}`);
            const ts = 0;
            const commandId = PARAM.PARAM.FrameType.WriteParameter;
            const req: Request = {commandId, parameterId, parameter, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    public readFirmwareVersionRequest() : Promise<number[]> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //debug(`push read firmware version request to queue. seqNr: ${seqNumber}`);
            const ts = 0;
            const commandId = PARAM.PARAM.FrameType.ReadFirmwareVersion;
            const req: Request = {commandId, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    private sendReadParameterRequest(parameterId: number, seqNumber: number) {
        /* command id, sequence number, 0, framelength(U16), payloadlength(U16), parameter id */
        const requestFrame = [PARAM.PARAM.FrameType.ReadParameter, seqNumber, 0x00, 0x08, 0x00, 0x01, 0x00, parameterId];
        if (parameterId === PARAM.PARAM.Network.NETWORK_KEY) {
            const requestFrame2= [PARAM.PARAM.FrameType.ReadParameter, seqNumber, 0x00, 0x09, 0x00, 0x02, 0x00, parameterId, 0x00];
            this.sendRequest(requestFrame2);
        } else {
            this.sendRequest(requestFrame);
        }
    }

    private sendWriteParameterRequest(parameterId: number, value: parameterT, seqNumber: number) {
        /* command id, sequence number, 0, framelength(U16), payloadlength(U16), parameter id, pameter */
        let parameterLength = 0;
        if (parameterId === PARAM.PARAM.STK.Endpoint) {
            let arrayParameterValue = value as number[];
            parameterLength = arrayParameterValue.length;
        } else {
            parameterLength = this.getLengthOfParameter(parameterId);
        }
        //debug("SEND WRITE_PARAMETER Request - parameter id: " + parameterId + " value: " + value.toString(16) + " length: " + parameterLength);

        const payloadLength = 1 + parameterLength;
        const frameLength = 7 + payloadLength;

        const fLength1 = frameLength & 0xff;
        const fLength2 = frameLength >> 8;

        const pLength1 = payloadLength & 0xff;
        const pLength2 = payloadLength >> 8;

        if (parameterId === PARAM.PARAM.Network.NETWORK_KEY) {
            const requestFrame2= [PARAM.PARAM.FrameType.WriteParameter, seqNumber, 0x00, 0x19, 0x00, 0x12, 0x00, parameterId, 0x00].concat(value);
            this.sendRequest(requestFrame2);
        } else {
            const requestframe = [PARAM.PARAM.FrameType.WriteParameter, seqNumber, 0x00, fLength1, fLength2, pLength1, pLength2, parameterId].concat(this.parameterBuffer(value, parameterLength));
            this.sendRequest(requestframe);
        }
    }

    private getLengthOfParameter(parameterId: number) : number {
        switch (parameterId) {
            case 9: case 16: case 21: case 28: case 33: case 36:
                return 1;
            case 5: case 7: case 34:
                return 2;
            case 10: case 38:
                return 4;
            case 1: case 8: case 11: case 14:
                return 8;
            case 24: case 25:
                return 16;
            default:
                return 0;
        }
    }

    private parameterBuffer(parameter: parameterT, parameterLength: number) : Array<number> {
        const paramArray = new Array();

        if (typeof parameter === 'number') {
            // for parameter <= 4 Byte
            if (parameterLength > 4)
                throw new Error("parameter to big for type number");

            for (let i = 0; i < parameterLength; i++) {
                paramArray[i] = (parameter >> (8 * i)) & 0xff;
            }
        } else {
            return parameter.reverse();
        }

        return paramArray;
    }

    private sendReadFirmwareVersionRequest(seqNumber: number) {
        /* command id, sequence number, 0, framelength(U16) */
        const requestFrame = [PARAM.PARAM.FrameType.ReadFirmwareVersion, seqNumber, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00];
        //debug(requestFrame);
        this.sendRequest(requestFrame);
    }

    private sendReadDeviceStateRequest(seqNumber: number) {
        /* command id, sequence number, 0, framelength(U16) */
        const requestFrame = [PARAM.PARAM.FrameType.ReadDeviceState, seqNumber, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00];
        this.sendRequest(requestFrame);
    }

    private sendRequest(buffer: number[]) {
        const crc = this.calcCrc(Buffer.from(buffer));
        const frame = Buffer.from(buffer.concat([crc[0], crc[1]]));
        const slipframe = slip.encode(frame);

        if ( this.portType === 'serial') {
            this.serialPort.write(slipframe, function(err) {
                if (err) {
                    debug("Error writing serial Port: " + err.message);
                }
            });
        } else {
            this.socketPort.write(slipframe, function(err) {
                if (err) {
                    debug("Error writing socket Port: " + err.message);
                }
            });
        }
    }

    private processQueue() {
        if (queue.length === 0) {
            return;
        }
        if (busyQueue.length > 0) {
            return;
        }
        const req: Request = queue.shift();
        req.ts = Date.now();

        switch (req.commandId) {
            case PARAM.PARAM.FrameType.ReadParameter:
                debug(`send read parameter request from queue. seqNr: ${req.seqNumber} paramId: ${req.parameterId}`);
                this.sendReadParameterRequest(req.parameterId, req.seqNumber);
                break;
            case PARAM.PARAM.FrameType.WriteParameter:
                debug(`send write parameter request from queue. seqNr: ${req.seqNumber} paramId: ${req.parameterId} param: ${req.parameter}`);
                this.sendWriteParameterRequest(req.parameterId, req.parameter, req.seqNumber);
                break;
            case PARAM.PARAM.FrameType.ReadFirmwareVersion:
                debug(`send read firmware version request from queue. seqNr: ${req.seqNumber}`);
                this.sendReadFirmwareVersionRequest(req.seqNumber);
                break;
            case PARAM.PARAM.FrameType.ReadDeviceState:
                debug(`send read device state from queue. seqNr: ${req.seqNumber}`);
                this.sendReadDeviceStateRequest(req.seqNumber);
                break;
            case PARAM.PARAM.NetworkState.CHANGE_NETWORK_STATE:
                debug(`send change network state request from queue. seqNr: ${req.seqNumber}`);
                this.sendChangeNetworkStateRequest(req.seqNumber, req.networkState);
                break;
            default:
                throw new Error("process queue - unknown command id");
                break;
        }

        busyQueue.push(req);
    }

    private async processBusyQueue() {
        let i = busyQueue.length;
        while (i--) {
            const req: Request = busyQueue[i];
            const now = Date.now();

            if ((now - req.ts) > 10000) {
                debug(`Timeout for request - CMD: 0x${req.commandId.toString(16)} seqNr: ${req.seqNumber}`);
                //remove from busyQueue
                busyQueue.splice(i, 1);
                timeoutCounter++;
                // after a timeout the timeoutcounter will be reset after 1 min. If another timeout happen then the timeoutcounter
                // will not be reset
                clearTimeout(this.timeoutResetTimeout);
                this.timeoutResetTimeout = null;
                this.resetTimeoutCounterAfter1min();
                req.reject("TIMEOUT");
                if (timeoutCounter >= 2) {
                    timeoutCounter = 0;
                    debug("too many timeouts - restart serial connecion");
                    if (this.serialPort?.isOpen) {
                        this.serialPort.close();
                    }
                    if (this.socketPort) {
                        this.socketPort.destroy();
                    }
                    await this.open();
                }
            }
        }
    }

    public changeNetworkStateRequest(networkState: number) : Promise<void> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //debug(`push change network state request to apsQueue. seqNr: ${seqNumber}`);
            const ts = 0;
            const commandId = PARAM.PARAM.NetworkState.CHANGE_NETWORK_STATE;
            const req: Request = {commandId, networkState, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    private sendChangeNetworkStateRequest(seqNumber: number, networkState: number) {
        const requestFrame = [PARAM.PARAM.NetworkState.CHANGE_NETWORK_STATE, seqNumber, 0x00, 0x06, 0x00, networkState];
        this.sendRequest(requestFrame);
    }

    private deviceStateRequest() {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //debug(`DEVICE_STATE Request - seqNr: ${seqNumber}`);
            const ts = 0;
            const commandId = PARAM.PARAM.FrameType.ReadDeviceState;
            const req: Request = {commandId, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    private async checkDeviceStatus(currentDeviceStatus: number) {
        const networkState = currentDeviceStatus & 0x03;
        this.apsDataConfirm = (currentDeviceStatus >> 2) & 0x01;
        this.apsDataIndication = (currentDeviceStatus >> 3) & 0x01;
        this.configChanged = (currentDeviceStatus >> 4) & 0x01;
        this.apsRequestFreeSlots = (currentDeviceStatus >> 5) & 0x01;

        debug("networkstate: " + networkState + " apsDataConfirm: " + this.apsDataConfirm + " apsDataIndication: " + this.apsDataIndication +
            " configChanged: " + this.configChanged + " apsRequestFreeSlots: " + this.apsRequestFreeSlots);
    }

    private async handleDeviceStatus() {
        if (this.apsDataConfirm === 1) {
            try {
                debug("query aps data confirm");
                this.apsDataConfirm = 0;
                const x = await this.querySendDataStateRequest();
            } catch (e) {
                if (e.status === 5) {
                    this.apsDataConfirm = 0;
                }
            }
        }
        if (this.apsDataIndication === 1) {
            try {
                debug("query aps data indication");
                this.apsDataIndication = 0;
                const x = await this.readReceivedDataRequest();
            } catch (e) {
                if (e.status === 5) {
                    this.apsDataIndication = 0;
                }
            }
        }
        if (this.configChanged === 1) {
            // when network settings changed
        }
    }

    // DATA_IND
    private readReceivedDataRequest() : Promise<void> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //debug(`push read received data request to apsQueue. seqNr: ${seqNumber}`);
            const ts = 0;
            const commandId = PARAM.PARAM.APS.DATA_INDICATION;
            const req: Request = {commandId, seqNumber, resolve, reject, ts};
            apsConfirmIndQueue.push(req);
        });
    }

    // DATA_REQ
    public enqueueSendDataRequest(request: ApsDataRequest) : Promise<void | ReceivedDataResponse> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //debug(`push enqueue send data request to apsQueue. seqNr: ${seqNumber}`);
            const ts = 0;
            const requestId = request.requestId;
            const commandId = PARAM.PARAM.APS.DATA_REQUEST;
            const req: Request = {commandId, seqNumber, request, resolve, reject, ts};
            apsQueue.push(req);
        });
    }

    // DATA_CONF
    private querySendDataStateRequest() : Promise<void> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //debug(`push query send data state request to apsQueue. seqNr: ${seqNumber}`);
            const ts = 0;
            const commandId = PARAM.PARAM.APS.DATA_CONFIRM;
            const req: Request = {commandId, seqNumber, resolve, reject, ts};
            apsConfirmIndQueue.push(req);
        });
    }

    private async processApsQueue() {
        if (apsQueue.length === 0) {
            return;
        }

        if (this.apsRequestFreeSlots !== 1) {
            debug("no free slots. Delay sending of APS Request");
            await this.sleep(1000);
            return;
        }

        const req: Request = apsQueue.shift();
        req.ts = Date.now();

        switch (req.commandId) {
            case PARAM.PARAM.APS.DATA_REQUEST:

                if (readyToSend === false) { // wait until last request was confirmed or given time elapsed
                    debug("delay sending of APS Request");
                    apsQueue.unshift(req);
                    break;
                } else {
                    disableRTS();
                    enableRtsTimeout = setTimeout(function(){enableRTS();}, this.READY_TO_SEND_TIMEOUT);
                    apsBusyQueue.push(req);
                    this.sendEnqueueSendDataRequest(req.request, req.seqNumber);
                    break;
                }
            default:
                throw new Error("process APS queue - unknown command id");
                break;
        }
    }

    private async processApsConfirmIndQueue() {
        if (apsConfirmIndQueue.length === 0) {
            return;
        }

        const req: Request = apsConfirmIndQueue.shift();
        req.ts = Date.now();

        apsBusyQueue.push(req);

        switch (req.commandId) {
            case PARAM.PARAM.APS.DATA_INDICATION:
                //debug(`read received data request. seqNr: ${req.seqNumber}`);
                if (this.DELAY === 0) {
                    this.sendReadReceivedDataRequest(req.seqNumber);
                } else {
                    await this.sendReadReceivedDataRequest(req.seqNumber);
                }
                break;
            case PARAM.PARAM.APS.DATA_CONFIRM:
                //debug(`query send data state request. seqNr: ${req.seqNumber}`);
                if (this.DELAY === 0) {
                    this.sendQueryDataStateRequest(req.seqNumber);
                } else {
                    await this.sendQueryDataStateRequest(req.seqNumber);
                }
                break;
            default:
                throw new Error("process APS Confirm/Ind queue - unknown command id");
                break;
        }
    }

    private sendQueryDataStateRequest(seqNumber: number) {
        debug(`DATA_CONFIRM - sending data state request - SeqNr. ${seqNumber}`);
        const requestFrame = [PARAM.PARAM.APS.DATA_CONFIRM, seqNumber, 0x00, 0x07, 0x00, 0x00, 0x00];
        this.sendRequest(requestFrame);
    }

    private sendReadReceivedDataRequest(seqNumber: number) {
        debug(`DATA_INDICATION - sending read data request - SeqNr. ${seqNumber}`);
        // payloadlength = 0, flag = none
        const requestFrame = [PARAM.PARAM.APS.DATA_INDICATION, seqNumber, 0x00, 0x08, 0x00, 0x01, 0x00, 0x01];
        this.sendRequest(requestFrame);
    }

    private sendEnqueueSendDataRequest(request: ApsDataRequest, seqNumber: number) {
        const payloadLength = 12 + ((request.destAddrMode === 0x01) ? 2 : (request.destAddrMode === 0x02) ? 3 : 9) + request.asduLength;
        const frameLength = 7 + payloadLength;
        const cid1 = request.clusterId & 0xff;
        const cid2 = (request.clusterId >> 8) & 0xff;
        const asdul1 = request.asduLength & 0xff;
        const asdul2 = (request.asduLength >> 8) & 0xff;
        let destArray: Array<number> = [];
        let dest = "";
        if (request.destAddr16 != null) {
            destArray[0] = request.destAddr16 & 0xff;
            destArray[1] = (request.destAddr16 >> 8) & 0xff;
            dest = request.destAddr16.toString(16);
        }
        if (request.destAddr64 != null) {
            dest = request.destAddr64;
            destArray = this.macAddrStringToArray(request.destAddr64);
        }
        if (request.destEndpoint != null) {
            destArray.push(request.destEndpoint);
            dest += " EP:";
            dest += request.destEndpoint;
        }

        debug(`DATA_REQUEST - destAddr: 0x${dest} SeqNr. ${seqNumber} request id: ${request.requestId}`);
        const requestFrame = [PARAM.PARAM.APS.DATA_REQUEST, seqNumber, 0x00, frameLength & 0xff, (frameLength >> 8) & 0xff,
            payloadLength & 0xff, (payloadLength >> 8) & 0xff,
            request.requestId, 0x00, request.destAddrMode].concat(
            destArray).concat([request.profileId & 0xff, (request.profileId >> 8) & 0xff,
            cid1, cid2, request.srcEndpoint, asdul1, asdul2]).concat(
            request.asduPayload).concat([request.txOptions, request.radius]);

        this.sendRequest(requestFrame);
    }

    private processApsBusyQueue() {
        let i = apsBusyQueue.length;
        while (i--) {
            const req: Request = apsBusyQueue[i];
            const now = Date.now();
            let timeout = 60000;
            if (req.request != null && req.request.timeout != null) {
                timeout = req.request.timeout * 1000; // seconds * 1000 = milliseconds
            }
            if ((now - req.ts) > timeout) {
                debug(`Timeout for aps request CMD: 0x${req.commandId.toString(16)} seq: ${req.seqNumber}`);
                //remove from busyQueue
                apsBusyQueue.splice(i, 1);
                req.reject("APS TIMEOUT");
            }
        }
    }

    private calcCrc(buffer: Uint8Array) : Array<number>{
        let crc = 0;
        for (let i=0; i < buffer.length; i++) {
           crc += buffer[i];
        }
        const crc0 = (~crc + 1) & 0xff;
        const crc1 = ((~crc + 1) >> 8) & 0xff;
        return [crc0, crc1];
    }

    public macAddrStringToArray(addr: string) : Array<number>{
        if (addr.indexOf("0x") === 0) {
            addr = addr.slice(2, addr.length);
        }
        if (addr.length < 16) {
            for (let l = 0; l < (16 - addr.length); l++) {
                addr = "0" + addr;
            }
        }
        let result: number[] = new Array<number>();
        let y = 0;
        for (let i = 0; i < 8; i++) {
            result[i] = parseInt(addr.substr(y,2), 16);
            y += 2;
        }
        const reverse = result.reverse();
        return reverse;
    }

    public macAddrArrayToString(addr: Array<number>) : string{
        if (addr.length != 8) {
            throw new Error("invalid array length for MAC address: " + addr.length);
        }

        let result: string = "0x";
        let char = '';
        let i = 8;
        while (i--) {
            char = addr[i].toString(16);
            if (char.length < 2) {
                char = "0" + char;
            }
            result += char;
        }
        return result;
    }

    /**
     *  generalArrayToString result is not reversed!
     */
    public generalArrayToString(key: Array<number>, length: number) : string{
        let result: string = "0x";
        let char = '';
        let i = 0;
        while (i < length) {
            char = key[i].toString(16);
            if (char.length < 2) {
                char = "0" + char;
            }
            result += char;
            i++;
        }
        return result;
    }

    private nextSeqNumber(): number {
        this.seqNumber++;

        if (this.seqNumber > 254) {
            this.seqNumber = 1;
        }

        return this.seqNumber;
    }

    private onParsed(frame: Uint8Array): void {
        this.emit('rxFrame', frame);
    }

    private sleep(ms: number) : Promise<void>{
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private resetTimeoutCounterAfter1min() {
        if (this.timeoutResetTimeout === null) {
            this.timeoutResetTimeout = setTimeout(() => {
                timeoutCounter = 0;
                this.timeoutResetTimeout = null;
            }, 60000);
        }
    }
}

export default Driver;
