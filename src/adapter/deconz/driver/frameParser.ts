const MIN_BUFFER_SIZE = 3;
const littleEndian = true;
import PARAM from './constants';
import { busyQueue, apsBusyQueue } from './driver';
import { Request, ReceivedDataResponse, Command, ParamMac, ParamPanId, ParamNwkAddr, ParamExtPanId, ParamChannel, ParamChannelMask } from './constants';

import Debug from 'debug';
const debug = Debug('zigbee-herdsman:deconz:frameParser');

var events = require('events');
var frameParserEvents = new events.EventEmitter();
module.exports.frameParserEvents = frameParserEvents;


function parseReadParameterResponse(view: DataView) : Command {
    const parameterId = view.getUint8(7);

    switch (parameterId) {
        case PARAM.PARAM.Network.MAC:
            const mac: ParamMac = view.getBigUint64(8, littleEndian).toString(16);
            debug(`MAC: ${mac}`);
            return mac;
        case PARAM.PARAM.Network.PAN_ID:
            const panId: ParamPanId = view.getUint16(8, littleEndian);
            debug('PANID: ' + panId.toString(16));
            return panId;
        case PARAM.PARAM.Network.NWK_ADDRESS:
            const nwkAddr: ParamNwkAddr = view.getUint16(8, littleEndian);
            debug('NWKADDR: ' + nwkAddr.toString(16));
            return nwkAddr;
        case PARAM.PARAM.Network.EXT_PAN_ID:
            const extPanId: ParamExtPanId = view.getBigUint64(8, littleEndian).toString(16);
            debug(`EXT_PANID: ${extPanId}`);
            return extPanId;
        case PARAM.PARAM.Network.CHANNEL:
            const channel: ParamChannel = view.getUint8(8);
            debug('CHANNEL: ' + channel);
            return channel;
        case PARAM.PARAM.Network.CHANNEL_MASK:
            const chMask: ParamChannelMask = view.getUint32(8, littleEndian);
            debug('CHANNELMASK: ' + chMask.toString(16));
            return chMask;
        default:
            throw new Error("unknown parameter id");
    }
}

function parseReadFirmwareResponse(view : DataView) : number[] {
    const fw = [view.getUint8(5), view.getUint8(6), view.getUint8(7), view.getUint8(8)];
    debug("read firmware version response - version: " + fw);
    return fw;
}

function parseDeviceStateResponse(view : DataView) : number {
    const flag = view.getUint8(5);
    debug("device state: " + flag.toString(2));
    return flag;
}

function parseReadReceivedDataResponse(view : DataView) : object {
    const response: ReceivedDataResponse = {};
    let buf2, buf3;

    response.commandId = view.getUint8(0);
    response.seqNr = view.getUint8(1);
    response.status = view.getUint8(2);
    response.frameLength = view.getUint16(3, littleEndian);
    response.payloadLength = view.getUint16(5, littleEndian);
    response.deviceState = view.getUint8(7);
    response.destAddrMode = view.getUint8(8);

    let destAddr = "";
    if (response.destAddrMode === 0x03) {
        response.destAddr64 = view.getBigUint64(9, littleEndian).toString(16);
        buf2 = view.buffer.slice(17, view.buffer.byteLength);
        destAddr = response.destAddr64;
    } else {
        response.destAddr16 = view.getUint16(9, littleEndian);
        buf2 = view.buffer.slice(11, view.buffer.byteLength);
        destAddr = response.destAddr16.toString(16);
    }

    view = new DataView(buf2);
    response.destEndpoint = view.getUint8(0);
    response.srcAddrMode = view.getUint8(1);

    let srcAddr = "";
    if (response.srcAddrMode === 0x02 || response.srcAddrMode === 0x04) {
        response.srcAddr16 = view.getUint16(2, littleEndian)
        buf3 = view.buffer.slice(4, view.buffer.byteLength);
        srcAddr = response.srcAddr16.toString(16);
    }

    if (response.srcAddrMode === 0x03 || response.srcAddrMode === 0x04) {
        response.srcAddr64 = view.getBigUint64(2, littleEndian).toString(16);
        buf3 = view.buffer.slice(18, view.buffer.byteLength);
        srcAddr = response.srcAddr64;
    }

    view = new DataView(buf3);
    response.srcEndpoint = view.getUint8(0);
    response.profileId = view.getUint16(1, littleEndian);
    response.clusterId = view.getUint16(3, littleEndian);
    response.asduLength = view.getUint16(5, littleEndian);

    let payload = [];
    let i = 0;
    for (let u = 7; u < (response.asduLength + 7); u++) {
        payload[i] = view.getUint8(u);
        i++;
    }

    response.asduPayload = payload;
    response.lqi = view.getUint8(view.byteLength - 6);
    response.rssi = view.getInt8(view.byteLength - 1);

    let newStatus = response.deviceState.toString(2);
    for (let l = 0; l <= (8 - newStatus.length); l++) {
        newStatus = "0" + newStatus;
    }
    debug("received data from 0x" + srcAddr + " to 0x" + destAddr + " profile id: 0x" + response.profileId.toString(16) + " cluster id: 0x" + response.clusterId.toString(16) + " new state: " + newStatus);
    //console.log(response);
    return response;
}

function parseWriteParameterResponse(view : DataView) : number {
    const parameterId = view.getUint8(7);
    debug(`write parameter response - parameter id: ${parameterId}`);
    return parameterId;
}

function parseReceivedDataNotification(view : DataView) : number {
    const flag = view.getUint8(5);
    debug("received data - device state changed: " + flag.toString(2));
    frameParserEvents.emit('receivedDataNotification', flag);
    return flag;
}

function parseMacPollCommand(view : DataView) : number {
    debug("Received command MAC_POLL");
    return 28;
}

function parseBeaconRequest(view : DataView) : number {
    debug("Received Beacon Request");
    return 31;
}

function getParserForCommandId(id: Number) : Function {
    switch (id) {
        case PARAM.PARAM.FrameType.ReadParameter:
            return parseReadParameterResponse;
        case PARAM.PARAM.FrameType.WriteParameter:
            return parseWriteParameterResponse;
        case PARAM.PARAM.FrameType.ReadFirmwareVersion:
            return parseReadFirmwareResponse;
        case PARAM.PARAM.FrameType.ReadDeviceState:
            return parseDeviceStateResponse;
        case PARAM.PARAM.APS.DATA_INDICATION:
            return parseReadReceivedDataResponse;
        case PARAM.PARAM.APS.DATA_REQUEST:
            return parseEnqueueSendDataResponse;
        case PARAM.PARAM.FrameType.DeviceStateChanged:
            return parseReceivedDataNotification;
        case 28:
            return parseMacPollCommand;
        case 31:
            return parseBeaconRequest;
        default:
            throw new Error(`unknown command id ${id}`);
    }
}

async function processFrame(frame: Uint8Array) : Promise<void> {
    const [seqNumber, status, command, commandId] = await parseFrame(frame);
    //debug(`process frame with seq: ${seqNumber} status: ${status}`);

    let queue = busyQueue;

    if (commandId === PARAM.PARAM.APS.DATA_INDICATION ||
        commandId === PARAM.PARAM.APS.DATA_REQUEST ||
        commandId === PARAM.PARAM.APS.DATA_CONFIRM ) {
        queue = apsBusyQueue;
    }

    const i = queue.findIndex((r: Request) => r.seqNumber === seqNumber);
    if (i < 0)
        return;

    const req: Request = queue[i];

    if (status !== 0) {
        // reject if status is not SUCCESS
        req.reject({status});
    } else {
        req.resolve(command);
    }

    //remove from busyqueue
    queue.splice(i, 1);
}

function parseFrame(frame: Uint8Array) : [number, number, Command, number] {

    if (frame.length < MIN_BUFFER_SIZE) {
        throw new Error("received frame size to small");
    }

    const view = new DataView(frame.buffer);

    const commandId = view.getUint8(0);
    const seqNumber = view.getUint8(1);
    const status = view.getUint8(2);
    const frameLength = view.getUint16(3, littleEndian);
    const payloadLength = view.getUint16(5, littleEndian);
    // todo check framelength, payloadlength < x

    const parser = getParserForCommandId(commandId);
    return [seqNumber, status, parser(view), commandId];

}

export default processFrame;
