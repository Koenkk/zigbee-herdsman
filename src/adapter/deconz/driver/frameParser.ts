/* v8 ignore start */

import {EventEmitter} from "node:events";

import {logger} from "../../../utils/logger";
import * as Zdo from "../../../zspec/zdo";
import PARAM, {
    type Command,
    type DataStateResponse,
    type GpDataInd,
    type ParamChannel,
    type ParamChannelMask,
    type ParamExtPanId,
    type ParamMac,
    type ParamNwkAddr,
    type ParamPanId,
    type ParamPermitJoin,
    type ReceivedDataResponse,
    type Request,
} from "./constants";
import {apsBusyQueue, busyQueue, enableRTS, enableRtsTimeout} from "./driver";

const NS = "zh:deconz:frameparser";

const MIN_BUFFER_SIZE = 3;
const littleEndian = true;
const lastReceivedGpInd = {srcId: 0, commandId: 0, frameCounter: 0};
export const frameParserEvents = new EventEmitter();

function parseReadParameterResponse(view: DataView): Command | null {
    const parameterId = view.getUint8(7);

    switch (parameterId) {
        case PARAM.PARAM.Network.MAC: {
            const mac: ParamMac = view.getBigUint64(8, littleEndian).toString(16);
            let result = mac;
            while (result.length < 16) {
                result = `0${result}`;
            }
            result = `0x${result}`;
            logger.debug(`MAC: ${result}`, NS);
            return result;
        }
        case PARAM.PARAM.Network.PAN_ID: {
            const panId: ParamPanId = view.getUint16(8, littleEndian);
            logger.debug(`PANID: ${panId.toString(16)}`, NS);
            return panId;
        }
        case PARAM.PARAM.Network.NWK_ADDRESS: {
            const nwkAddr: ParamNwkAddr = view.getUint16(8, littleEndian);
            logger.debug(`NWKADDR: ${nwkAddr.toString(16)}`, NS);
            return nwkAddr;
        }
        case PARAM.PARAM.Network.EXT_PAN_ID: {
            const extPanId: ParamExtPanId = view.getBigUint64(8, littleEndian).toString(16);
            let res = extPanId;
            while (res.length < 16) {
                res = `0${res}`;
            }
            res = `0x${res}`;
            logger.debug(`EXT_PANID: ${res}`, NS);
            return res;
        }
        case PARAM.PARAM.Network.APS_EXT_PAN_ID: {
            const apsExtPanId: ParamExtPanId = view.getBigUint64(8, littleEndian).toString(16);
            let resAEPID = apsExtPanId;
            while (resAEPID.length < 16) {
                resAEPID = `0${resAEPID}`;
            }
            resAEPID = `0x${resAEPID}`;
            logger.debug(`APS_EXT_PANID: ${resAEPID}`, NS);
            return resAEPID;
        }
        case PARAM.PARAM.Network.NETWORK_KEY: {
            const networkKey1 = view.getBigUint64(9).toString(16);
            let res1 = networkKey1;
            while (res1.length < 16) {
                res1 = `0${res1}`;
            }
            const networkKey2 = view.getBigUint64(17).toString(16);
            let res2 = networkKey2;
            while (res2.length < 16) {
                res2 = `0${res2}`;
            }
            logger.debug("NETWORK_KEY: hidden", NS);
            return `0x${res1}${res2}`;
        }
        case PARAM.PARAM.Network.CHANNEL: {
            const channel: ParamChannel = view.getUint8(8);
            logger.debug(`CHANNEL: ${channel}`, NS);
            return channel;
        }
        case PARAM.PARAM.Network.CHANNEL_MASK: {
            const chMask: ParamChannelMask = view.getUint32(8, littleEndian);
            logger.debug(`CHANNELMASK: ${chMask.toString(16)}`, NS);
            return chMask;
        }
        case PARAM.PARAM.Network.PERMIT_JOIN: {
            const permitJoin: ParamPermitJoin = view.getUint8(8);
            logger.debug(`PERMIT_JOIN: ${permitJoin}`, NS);
            return permitJoin;
        }
        case PARAM.PARAM.Network.WATCHDOG_TTL: {
            const ttl: ParamPermitJoin = view.getUint32(8);
            logger.debug(`WATCHDOG_TTL: ${ttl}`, NS);
            return ttl;
        }
        default:
            //throw new Error(`unknown parameter id ${parameterId}`);
            logger.debug(`unknown parameter id ${parameterId}`, NS);
            return null;
    }
}

function parseReadFirmwareResponse(view: DataView): number[] {
    const fw = [view.getUint8(5), view.getUint8(6), view.getUint8(7), view.getUint8(8)];
    logger.debug(`read firmware version response - version: ${fw}`, NS);
    return fw;
}

function parseDeviceStateResponse(view: DataView): number {
    const flag = view.getUint8(5);
    logger.debug(`Device state: ${flag.toString(2)}`, NS);
    frameParserEvents.emit("receivedDataNotification", flag);
    return flag;
}

function parseChangeNetworkStateResponse(view: DataView): number {
    const status = view.getUint8(2);
    const state = view.getUint8(5);
    logger.debug(`change network state - status: ${status} new state: ${state}`, NS);
    return state;
}

function parseQuerySendDataStateResponse(view: DataView): DataStateResponse | null {
    try {
        const commandId = view.getUint8(0);
        const seqNr = view.getUint8(1);
        const status = view.getUint8(2);

        if (status !== 0) {
            if (status !== 5) {
                logger.debug(`DATA_CONFIRM RESPONSE - seqNr.: ${seqNr} status: ${status}`, NS);
            }

            return null;
        }

        const frameLength = 7;
        const payloadLength = view.getUint16(5, littleEndian);
        const deviceState = view.getUint8(7);
        const requestId = view.getUint8(8);
        const destAddrMode = view.getUint8(9);

        let destAddr64: string | undefined;
        let destAddr16: number | undefined;
        let destEndpoint: number | undefined;
        let destAddr = "";

        if (destAddrMode === PARAM.PARAM.addressMode.IEEE_ADDR) {
            let res = view.getBigUint64(10, littleEndian).toString(16);
            while (res.length < 16) {
                res = `0${res}`;
            }
            destAddr64 = res;
            // const buf2 = view.buffer.slice(18, view.buffer.byteLength);
            destAddr = destAddr64;
        } else {
            destAddr16 = view.getUint16(10, littleEndian);
            // const buf2 = view.buffer.slice(12, view.buffer.byteLength);
            destAddr = destAddr16.toString(16);
        }

        if (destAddrMode === PARAM.PARAM.addressMode.NWK_ADDR || destAddrMode === PARAM.PARAM.addressMode.IEEE_ADDR) {
            destEndpoint = view.getUint8(view.byteLength - 7);
        }

        const srcEndpoint = view.getUint8(view.byteLength - 6);
        const confirmStatus = view.getInt8(view.byteLength - 5);

        let newStatus = deviceState.toString(2);

        for (let l = 0; l <= 8 - newStatus.length; l++) {
            newStatus = `0${newStatus}`;
        }

        // resolve send data request promise
        const i = apsBusyQueue.findIndex((r: Request) => r.request && r.request.requestId === requestId);

        if (i < 0) {
            return null;
        }

        clearTimeout(enableRtsTimeout);
        enableRTS(); // enable ReadyToSend because confirm received
        const req: Request = apsBusyQueue[i];

        // TODO timeout (at driver.ts)
        if (confirmStatus !== 0) {
            // reject if status is not SUCCESS
            //logger.debug("REJECT APS_REQUEST - request id: " + requestId + " confirm status: " + confirmStatus, NS);
            req.reject(new Error(`confirmStatus=${confirmStatus}`));
        } else {
            //logger.debug("RESOLVE APS_REQUEST - request id: " + requestId + " confirm status: " + confirmStatus, NS);
            req.resolve(confirmStatus);
        }

        //remove from busyqueue
        apsBusyQueue.splice(i, 1);

        logger.debug(`DATA_CONFIRM RESPONSE - destAddr: 0x${destAddr} request id: ${requestId} confirm status: ${confirmStatus}`, NS);
        frameParserEvents.emit("receivedDataNotification", deviceState);

        return {
            commandId,
            seqNr,
            status,
            frameLength,
            payloadLength,
            deviceState,
            requestId,
            destAddrMode,
            destAddr16,
            destAddr64,
            destEndpoint,
            srcEndpoint,
            confirmStatus,
        };
    } catch (error) {
        logger.debug(`DATA_CONFIRM RESPONSE - ${error}`, NS);
        return null;
    }
}

class UDataView {
    littleEndian: boolean = true;
    pos: number = 0;
    view: DataView;
    constructor(view: DataView, littleEndian: boolean) {
        this.view = view;
        this.littleEndian = littleEndian;
    }

    getI8() : number {
        if (this.pos + 1 <= this.view.byteLength) {
            this.pos += 1;
            return this.view.getInt8(this.pos - 1);
        }
        throw new RangeError();
    }

    getU8() : number {
        if (this.pos + 1 <= this.view.byteLength) {
            this.pos += 1;
            return this.view.getUint8(this.pos - 1);
        }
        throw new RangeError();
    }

    getU16() : number {
        if (this.pos + 2 <= this.view.byteLength) {
            this.pos += 2;
            return this.view.getUint16(this.pos - 2, this.littleEndian);
        }
        throw new RangeError();
    }

    getU32() : number {
        if (this.pos + 4 <= this.view.byteLength) {
            this.pos += 4;
            return this.view.getUint16(this.pos - 4, this.littleEndian);
        }
        throw new RangeError();
    }

    getU64() : bigint {
        if (this.pos + 8 <= this.view.byteLength) {
            this.pos += 8;
            return this.view.getBigUint64(this.pos - 8, this.littleEndian);
        }
        throw new RangeError();
    }
}

function parseReadReceivedDataResponse(inview: DataView): ReceivedDataResponse | null {
    // min 28 bytelength
    try {
        const uview = new UDataView(inview, true);

        const commandId = uview.getU8();
        const seqNr = uview.getU8();
        const status = uview.getU8();

        if (status !== 0) {
            if (status !== 5) {
                logger.debug(`DATA_INDICATION RESPONSE - seqNr.: ${seqNr} status: ${status}`, NS);
            }
            return null;
        }

        const frameLength = uview.getU16();
        const payloadLength = uview.getU16();
        //------ start of payload ----------------------------------
        const deviceState = uview.getU8();
        const destAddrMode = uview.getU8();

        let destAddr64: string | undefined;
        let destAddr16: number | undefined;
        let destAddr;

        if (destAddrMode === PARAM.PARAM.addressMode.IEEE_ADDR) {
            destAddr64 = uview.getU64().toString(16).padStart(16, '0');
            destAddr = destAddr64;
        } else if (destAddrMode === PARAM.PARAM.addressMode.NWK_ADDR || destAddrMode === PARAM.PARAM.addressMode.GROUP_ADDR) {
            destAddr16 = uview.getU16();
            destAddr = destAddr16.toString(16);
        } else {
            throw new Error(`unsupported destination address mode: ${destAddrMode}`);
        }

        const destEndpoint = uview.getU8();
        const srcAddrMode = uview.getU8();

        let srcAddr64: string | undefined;
        let srcAddr16: number | undefined;
        let srcAddr;

        if (srcAddrMode === PARAM.PARAM.addressMode.NWK_ADDR || srcAddrMode === PARAM.PARAM.addressMode.GROUP_ADDR || srcAddrMode === PARAM.PARAM.addressMode.NWK_IEEE_ADDR) {
            srcAddr16 = uview.getU16();
            srcAddr = srcAddr16.toString(16);

            if (srcAddrMode === PARAM.PARAM.addressMode.NWK_IEEE_ADDR) {
                srcAddr64 = uview.getU64().toString(16).padStart(16, '0');
            }
        } else if (srcAddrMode === PARAM.PARAM.addressMode.IEEE_ADDR) {
            srcAddr64 = uview.getU64().toString(16).padStart(16, '0');
            srcAddr = srcAddr64;
        }

        const srcEndpoint = uview.getU8();
        const profileId = uview.getU16();
        const clusterId = uview.getU16();
        const asduLength = uview.getU16();
        const asdu = new Uint8Array(asduLength);
        for (let i = 0; i < asduLength; i++) {
            asdu[i] = uview.getU8();
        }

        // The following two bytes depends on protocol version 2 or 3
        // for now just discard
        uview.getU16();

        const lqi = uview.getU8();

        // version >= 2
        let rssi = 0;
        try {
            rssi = uview.getI8()
        } catch (e) {}

        logger.debug(
            `DATA_INDICATION RESPONSE - seqNr. ${seqNr} srcAddr: 0x${srcAddr} destAddr: 0x${destAddr} profile id: 0x${profileId.toString(16)} cluster id: 0x${clusterId.toString(16)} lqi: ${lqi}`,
            NS,
        );
        logger.debug(`response payload: [${Array.from(asdu).map(x =>x.toString(16).padStart(2, '0')).join(' ')}]`, NS);
        frameParserEvents.emit("receivedDataNotification", deviceState);

        const asduPayload = Buffer.from(asdu);

        const response: ReceivedDataResponse = {
            commandId,
            seqNr,
            status,
            frameLength,
            payloadLength,
            deviceState,
            destAddrMode,
            destAddr16,
            destAddr64,
            destEndpoint,
            srcAddrMode,
            srcAddr16,
            srcAddr64,
            srcEndpoint,
            profileId,
            clusterId,
            asduLength,
            asduPayload,
            lqi,
            rssi,
            zdo: profileId === Zdo.ZDO_PROFILE_ID ? Zdo.Buffalo.readResponse(true, clusterId, asduPayload) : undefined,
        };

        frameParserEvents.emit("receivedDataPayload", response);
        
        return response;
    } catch (error) {
        logger.debug(`DATA_INDICATION RESPONSE - ${error}`, NS);
        return null;
    }
}

function parseEnqueueSendDataResponse(view: DataView): number | null {
    try {
        const status = view.getUint8(2);
        const requestId = view.getUint8(8);
        const deviceState = view.getUint8(7);
        logger.debug(`DATA_REQUEST RESPONSE - request id: ${requestId} status: ${status}`, NS);
        frameParserEvents.emit("receivedDataNotification", deviceState);
        return deviceState;
    } catch (error) {
        logger.debug(`parseEnqueueSendDataResponse - ${error}`, NS);
        return null;
    }
}

function parseWriteParameterResponse(view: DataView): number | null {
    try {
        const parameterId = view.getUint8(7);
        logger.debug(`write parameter response - parameter id: ${parameterId} - status: ${view.getUint8(2)}`, NS);
        return parameterId;
    } catch (error) {
        logger.debug(`parseWriteParameterResponse - ${error}`, NS);
        return null;
    }
}

function parseReceivedDataNotification(view: DataView): number | null {
    try {
        const deviceState = view.getUint8(5);
        logger.debug(`DEVICE_STATE changed: ${deviceState.toString(2)}`, NS);
        frameParserEvents.emit("receivedDataNotification", deviceState);
        return deviceState;
    } catch (error) {
        logger.debug(`parseReceivedDataNotification - ${error}`, NS);
        return null;
    }
}

function parseGreenPowerDataIndication(view: DataView): GpDataInd | null {
    try {
        let id: number;
        let rspId: number;
        let options: number;
        let srcId: number;
        let frameCounter: number;
        let commandId: number;
        let commandFrameSize: number;
        let commandFrame: Buffer;
        const seqNr = view.getUint8(1);

        if (view.byteLength < 30) {
            logger.debug("GP data notification", NS);
            id = 0x00; // 0 = notification, 4 = commissioning
            rspId = 0x01; // 1 = pairing, 2 = commissioning
            options = 0;
            view.getUint16(7, littleEndian); // frame ctrl field(7) ext.fcf(8)
            srcId = view.getUint32(9, littleEndian);
            frameCounter = view.getUint32(13, littleEndian);
            commandId = view.getUint8(17);
            commandFrameSize = view.byteLength - 18 - 6; // cut 18 from begin and 4 (sec mic) and 2 from end (cfc)
            commandFrame = Buffer.from(view.buffer.slice(18, commandFrameSize + 18));
        } else {
            logger.debug("GP commissioning notification", NS);
            id = 0x04; // 0 = notification, 4 = commissioning
            rspId = 0x01; // 1 = pairing, 2 = commissioning
            options = view.getUint16(14, littleEndian); // opt(14) ext.opt(15)
            srcId = view.getUint32(8, littleEndian);
            frameCounter = view.getUint32(36, littleEndian);
            commandId = view.getUint8(12);
            commandFrameSize = view.byteLength - 13 - 2; // cut 13 from begin and 2 from end (cfc)
            commandFrame = Buffer.from(view.buffer.slice(13, commandFrameSize + 13));
        }

        const ind: GpDataInd = {
            rspId,
            seqNr,
            id,
            options,
            srcId,
            frameCounter,
            commandId,
            commandFrameSize,
            commandFrame,
        };

        if (!(lastReceivedGpInd.srcId === srcId && lastReceivedGpInd.commandId === commandId && lastReceivedGpInd.frameCounter === frameCounter)) {
            lastReceivedGpInd.srcId = srcId;
            lastReceivedGpInd.commandId = commandId;
            lastReceivedGpInd.frameCounter = frameCounter;
            //logger.debug(`GP_DATA_INDICATION - src id: ${srcId} cmd id: ${commandId} frameCounter: ${frameCounter}`, NS);
            logger.debug(
                `GP_DATA_INDICATION - src id: 0x${srcId.toString(16)} cmd id: 0x${commandId.toString(16)} frameCounter: 0x${frameCounter.toString(16)}`,
                NS,
            );
            frameParserEvents.emit("receivedGreenPowerIndication", ind);
        }

        return ind;
    } catch (error) {
        logger.debug(`GREEN_POWER INDICATION - ${error}`, NS);
        return null;
    }
}
function parseMacPollCommand(_view: DataView): number {
    //logger.debug("Received command MAC_POLL", NS);
    return 28;
}
function parseBeaconRequest(_view: DataView): number {
    logger.debug("Received Beacon Request", NS);
    return 31;
}

function parseUnknownCommand(view: DataView): number {
    const id = view.getUint8(0);
    logger.debug(`received unknown command - id ${id}`, NS);
    return id;
}
function getParserForCommandId(id: number): (view: DataView) => Command | object | number | null {
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
        case PARAM.PARAM.APS.DATA_CONFIRM:
            return parseQuerySendDataStateResponse;
        case PARAM.PARAM.FrameType.DeviceStateChanged:
            return parseReceivedDataNotification;
        case PARAM.PARAM.NetworkState.CHANGE_NETWORK_STATE:
            return parseChangeNetworkStateResponse;
        case PARAM.PARAM.FrameType.GreenPowerDataInd:
            return parseGreenPowerDataIndication;
        case 28:
            return parseMacPollCommand;
        case 31:
            return parseBeaconRequest;
        default:
            return parseUnknownCommand;
        //throw new Error(`unknown command id ${id}`);
    }
}

function processFrame(frame: Uint8Array): void {
    const [seqNumber, status, command, commandId] = parseFrame(frame);
    // logger.debug(`Process frame with cmd: 0x${commandId.toString(16).padStart(2,'0')}, seq: ${seqNumber} status: ${status}`, NS);
    
    let queue = busyQueue;

    if (commandId === PARAM.PARAM.APS.DATA_INDICATION || commandId === PARAM.PARAM.APS.DATA_REQUEST || commandId === PARAM.PARAM.APS.DATA_CONFIRM) {
        // TODO(mpi): we really only need a busyQueue and queue.
        queue = apsBusyQueue;
    }

    const i = queue.findIndex((r: Request) => r.seqNumber === seqNumber && r.commandId === commandId);
    if (i < 0) {
        return;
    }

    const req: Request = queue[i];

    if (commandId === PARAM.PARAM.APS.DATA_REQUEST) {
        // if confirm is true resolve request only when data confirm arrives
        // TODO only return if a confirm was requested. if no confirm needed: go ahead
        //if (req.confirm === true) {
        return;
        //}
    }

    //remove from busyqueue
    queue.splice(i, 1);

    if (status !== 0) {
        // reject if status is not SUCCESS
        //logger.debug("REJECT REQUEST", NS);
        req.reject(new Error(`status=${status}`));
    } else {
        //logger.debug("RESOLVE REQUEST", NS);
        req.resolve(command);
    }
}

function parseFrame(frame: Uint8Array): [number, number, ReturnType<ReturnType<typeof getParserForCommandId>>, number] {
    // at this point frame.buffer.length is at least 5 bytes long
    const view = new DataView(frame.buffer);
    const commandId = view.getUint8(0);
    const seqNumber = view.getUint8(1);
    const status = view.getUint8(2);
    const parser = getParserForCommandId(commandId);

    return [seqNumber, status, parser(view), commandId];
}

export default processFrame;
