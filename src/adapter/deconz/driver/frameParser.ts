/* v8 ignore start */

import {EventEmitter} from "node:events";
import {logger} from "../../../utils/logger";
import * as Zdo from "../../../zspec/zdo";
import PARAM, {
    type Command,
    type DataStateResponse,
    type GpDataInd,
    type ReceivedDataResponse,
    type ApsRequest,
    type Request,
    FirmwareCommand,
    CommandStatus,
    ParamId,
} from "./constants";
import {apsBusyQueue, busyQueue} from "./driver";

const NS = "zh:deconz:frameparser";

const littleEndian = true;
const lastReceivedGpInd = {srcId: 0, commandId: 0, frameCounter: 0};
export const frameParserEvents = new EventEmitter();

function parseReadParameterResponse(view: DataView): Command | null {
    const seqNumber = view.getUint8(1);
    const status = view.getUint8(2);
    const parameterId = view.getUint8(7);
    let pos = 8;
    let result = null;

    switch (parameterId) {
        case ParamId.MAC_ADDRESS: {
            result = `0x${view.getBigUint64(pos, littleEndian).toString(16).padStart(16, "0")}`;
            break;
        }
        case ParamId.NWK_PANID: {
            result = view.getUint16(pos, littleEndian);
            break;
        }
        case ParamId.STK_PROTOCOL_VERSION: {
            result = view.getUint16(pos, littleEndian);
            break;
        }
        case ParamId.NWK_NETWORK_ADDRESS: {
            result = view.getUint16(pos, littleEndian);
            break;
        }
        case ParamId.NWK_EXTENDED_PANID: {
            result = `0x${view.getBigUint64(pos, littleEndian).toString(16).padStart(16, "0")}`;
            break;
        }
        case ParamId.APS_USE_EXTENDED_PANID: {
            result = `0x${view.getBigUint64(pos, littleEndian).toString(16).padStart(16, "0")}`;
            break;
        }
        case ParamId.STK_NETWORK_KEY: {
            result = "0x";

            pos += 1; // key index
            for (let i = 0; i < 16; i++) {
                result += view.getUint8(pos).toString(16).padStart(2, "0");
                pos += 1;
            }
            break;
        }
        case ParamId.STK_CURRENT_CHANNEL: {
            result = view.getUint8(pos);
            break;
        }
        case ParamId.APS_CHANNEL_MASK: {
            result = view.getUint32(pos, littleEndian);
            break;
        }
        case ParamId.STK_PERMIT_JOIN: {
            result = view.getUint8(pos);
            break;
        }
        case ParamId.DEV_WATCHDOG_TTL: {
            result = view.getUint32(pos, littleEndian);
            break;
        }
        case ParamId.STK_NWK_UPDATE_ID: {
            result = view.getUint8(pos);
            break;
        }
        default:
            //throw new Error(`unknown parameter id ${parameterId}`);
            logger.debug(`unknown parameter id ${parameterId}`, NS);
            break;
    }

    if (parameterId in ParamId) {
        let p = result;
        if (parameterId === ParamId.STK_NETWORK_KEY) {
            // don't show in logs
            p = "<hidden>";
        }
        logger.debug(`Received read parameter response for ${ParamId[parameterId]}, seq: ${seqNumber}, status: ${status}, parameter: ${p}`, NS);
    }

    return result;
}

function parseReadFirmwareResponse(view: DataView): number {
    const fw = view.getUint32(5, littleEndian);
    logger.debug(`read firmware version response - version: 0x${fw.toString(16)}`, NS);
    return fw;
}

function parseDeviceStateResponse(view: DataView): number {
    const deviceState = view.getUint8(5);
    frameParserEvents.emit("deviceStateUpdated", deviceState);
    return deviceState;
}

function parseChangeNetworkStateResponse(view: DataView): number {
    const status = view.getUint8(2);
    const state = view.getUint8(5);
    logger.debug(`change network state - status: ${status} new state: ${state}`, NS);
    return state;
}

function parseApsConfirmResponse(view: DataView): DataStateResponse | null {
    const commandId = view.getUint8(0);
    const seqNr = view.getUint8(1);
    const status = view.getUint8(2);

    if (status !== CommandStatus.Success) {
        logger.debug(`Response APS-DATA.confirm seq: ${seqNr} status: ${CommandStatus[status]} (error)`, NS);
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
        destAddr64 = view.getBigUint64(10, littleEndian).toString(16).padStart(16, "0");
        destAddr = destAddr64;
    } else {
        destAddr16 = view.getUint16(10, littleEndian);
        destAddr = destAddr16.toString(16);
    }

    if (destAddrMode === PARAM.PARAM.addressMode.NWK_ADDR || destAddrMode === PARAM.PARAM.addressMode.IEEE_ADDR) {
        destEndpoint = view.getUint8(view.byteLength - 7);
    }

    const srcEndpoint = view.getUint8(view.byteLength - 6);
    const confirmStatus = view.getInt8(view.byteLength - 5);

    // resolve APS-DATA.request promise
    const i = apsBusyQueue.findIndex((r: ApsRequest) => r.request && r.request.requestId === requestId);

    if (i < 0) {
        return null;
    }

    const req: ApsRequest = apsBusyQueue[i];

    //TODO(mpi): Add enum for possible (MAC,NWK,APS) status codes.
    if (confirmStatus === 0x00) {
        // Success
        req.resolve(confirmStatus);
    } else {
        req.reject(new Error(`Failed APS-DATA.request with confirm status: 0x${confirmStatus.toString(16).padStart(2, "0")}`));
    }

    //remove from busyqueue
    apsBusyQueue.splice(i, 1);

    logger.debug(
        `APS-DATA.confirm  destAddr: 0x${destAddr} APS request id: ${requestId} confirm status: 0x${confirmStatus.toString(16).padStart(2, "0")}`,
        NS,
    );
    frameParserEvents.emit("deviceStateUpdated", deviceState);

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
}

class UDataView {
    littleEndian = true;
    pos = 0;
    view: DataView;
    constructor(view: DataView, littleEndian: boolean) {
        this.view = view;
        this.littleEndian = littleEndian;
    }

    getI8(): number {
        if (this.pos + 1 <= this.view.byteLength) {
            this.pos += 1;
            return this.view.getInt8(this.pos - 1);
        }
        throw new RangeError();
    }

    getU8(): number {
        if (this.pos + 1 <= this.view.byteLength) {
            this.pos += 1;
            return this.view.getUint8(this.pos - 1);
        }
        throw new RangeError();
    }

    getU16(): number {
        if (this.pos + 2 <= this.view.byteLength) {
            this.pos += 2;
            return this.view.getUint16(this.pos - 2, this.littleEndian);
        }
        throw new RangeError();
    }

    getU32(): number {
        if (this.pos + 4 <= this.view.byteLength) {
            this.pos += 4;
            return this.view.getUint16(this.pos - 4, this.littleEndian);
        }
        throw new RangeError();
    }

    getU64(): bigint {
        if (this.pos + 8 <= this.view.byteLength) {
            this.pos += 8;
            return this.view.getBigUint64(this.pos - 8, this.littleEndian);
        }
        throw new RangeError();
    }
}

function parseApsDataIndicationResponse(inview: DataView): ReceivedDataResponse | null {
    // min 28 bytelength
    try {
        const uview = new UDataView(inview, true);

        const commandId = uview.getU8();
        const seqNr = uview.getU8();
        const status = uview.getU8();

        if (status !== CommandStatus.Success) {
            logger.debug(`Response APS-DATA.indication seq: ${seqNr} status: ${CommandStatus[status]}`, NS);
            return null;
        }

        const frameLength = uview.getU16();
        const payloadLength = uview.getU16();
        //------ start of payload ----------------------------------
        const deviceState = uview.getU8();
        const destAddrMode = uview.getU8();

        let destAddr64: string | undefined;
        let destAddr16: number | undefined;
        let destAddr: string | number;

        if (destAddrMode === PARAM.PARAM.addressMode.IEEE_ADDR) {
            destAddr64 = uview.getU64().toString(16).padStart(16, "0");
            destAddr16 = 0xfffe;
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
        let srcAddr16 = 0xfffe;
        let srcAddr: string | number;

        if (srcAddrMode === PARAM.PARAM.addressMode.NWK_ADDR || srcAddrMode === PARAM.PARAM.addressMode.NWK_IEEE_ADDR) {
            srcAddr16 = uview.getU16();
            srcAddr = srcAddr16.toString(16);

            if (srcAddrMode === PARAM.PARAM.addressMode.NWK_IEEE_ADDR) {
                srcAddr64 = uview.getU64().toString(16).padStart(16, "0");
            }
        } else {
            throw new Error(`unsupported source address mode: ${srcAddrMode}`);
        }
        //  else if (srcAddrMode === PARAM.PARAM.addressMode.IEEE_ADDR) {
        //     srcAddr64 = uview.getU64().toString(16).padStart(16, '0');
        //     srcAddr = srcAddr64;
        // }

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
            rssi = uview.getI8();
        } catch (_) {}

        logger.debug(
            `Response APS-DATA.indication seq: ${seqNr} srcAddr: 0x${srcAddr} destAddr: 0x${destAddr} profile id: 0x${profileId.toString(16).padStart(4, "0")} cluster id: 0x${clusterId.toString(16).padStart(4, "0")} lqi: ${lqi}`,
            NS,
        );
        //logger.debug(`Response payload: [${Array.from(asdu).map(x =>x.toString(16).padStart(2, '0')).join(' ')}]`, NS);
        frameParserEvents.emit("deviceStateUpdated", deviceState);

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
        logger.debug(`Response APS-DATA.indication error: ${error}`, NS);
        return null;
    }
}

function parseApsDataRequestResponse(view: DataView): number | null {
    try {
        const status = view.getUint8(2);
        const requestId = view.getUint8(8);
        const deviceState = view.getUint8(7);
        logger.debug(`Response APS-DATA.request APS request id: ${requestId} status: ${CommandStatus[status]}`, NS);
        frameParserEvents.emit("deviceStateUpdated", deviceState);
        return deviceState;
    } catch (error) {
        logger.debug(`parseEnqueueSendDataResponse - ${error}`, NS);
        return null;
    }
}

function parseWriteParameterResponse(view: DataView): number | null {
    try {
        const status = view.getUint8(2);
        const parameterId = view.getUint8(7);

        if (parameterId in ParamId) {
            // should always be true
            logger.debug(`Write parameter response parameter: ${ParamId[parameterId]}, status: ${CommandStatus[status]}`, NS);
        }

        return parameterId;
    } catch (error) {
        logger.debug(`parseWriteParameterResponse - ${error}`, NS);
        return null;
    }
}

function parseDeviceStateChangedNotification(view: DataView): number | null {
    try {
        const deviceState = view.getUint8(5);
        frameParserEvents.emit("deviceStateUpdated", deviceState);
        return deviceState;
    } catch (error) {
        logger.debug(`parsedeviceStateUpdated - ${error}`, NS);
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
        case FirmwareCommand.ReadParameter:
            return parseReadParameterResponse;
        case FirmwareCommand.WriteParameter:
            return parseWriteParameterResponse;
        case FirmwareCommand.FirmwareVersion:
            return parseReadFirmwareResponse;
        case FirmwareCommand.Status:
            return parseDeviceStateResponse;
        case FirmwareCommand.ApsDataIndication:
            return parseApsDataIndicationResponse;
        case FirmwareCommand.ApsDataRequest:
            return parseApsDataRequestResponse;
        case FirmwareCommand.ApsDataConfirm:
            return parseApsConfirmResponse;
        case FirmwareCommand.StatusChangeIndication:
            return parseDeviceStateChangedNotification;
        case FirmwareCommand.ChangeNetworkState:
            return parseChangeNetworkStateResponse;
        case FirmwareCommand.ZgpDataIndication:
            return parseGreenPowerDataIndication;
        case FirmwareCommand.MacPollIndication:
            return parseMacPollCommand;
        case FirmwareCommand.Beacon:
            return parseBeaconRequest;
        default:
            return parseUnknownCommand;
        //throw new Error(`unknown command id ${id}`);
    }
}

function processFrame(frame: Uint8Array): void {
    const [seqNumber, status, command, commandId] = parseFrame(frame);
    // logger.debug(`Process frame with cmd: 0x${commandId.toString(16).padStart(2,'0')}, seq: ${seqNumber} status: ${status}`, NS);

    let queue: ApsRequest[] | Request[] = busyQueue;

    if (commandId === FirmwareCommand.ApsDataRequest) {
        queue = apsBusyQueue;
    }

    const i = queue.findIndex((r: ApsRequest | Request) => r.seqNumber === seqNumber && r.commandId === commandId);
    if (i < 0) {
        return;
    }

    const req: ApsRequest | Request = queue[i];

    if (commandId === FirmwareCommand.ApsDataRequest) {
        if (status === CommandStatus.Success) {
            // wait for APS-DATA.confirm to arrive
            return;
        }

        // TODO(mpi): Within the timeout we should reschedule the APS-DATA.request (given that network state = connected)
        // continue to reject as there will be no APS-DATA.confirm
    }

    //remove from busyqueue
    queue.splice(i, 1);

    if (status === CommandStatus.Success) {
        req.resolve(command);
    } else {
        let cmdName: string;
        if (commandId in FirmwareCommand) {
            cmdName = FirmwareCommand[commandId];
        } else {
            cmdName = `0x${commandId.toString(16).padStart(2, "0")}`;
        }

        req.reject(new Error(`Command ${cmdName} failed with status: ${CommandStatus[status]}`));
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
