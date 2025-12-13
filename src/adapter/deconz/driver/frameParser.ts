/* v8 ignore start */

import {EventEmitter} from "node:events";
import {Buffalo} from "../../../buffalo";
import {logger} from "../../../utils/logger";
import * as Zdo from "../../../zspec/zdo";
import {
    ApsAddressMode,
    type ApsRequest,
    ApsStatusCode,
    type Command,
    CommandStatus,
    type DataStateResponse,
    FirmwareCommand,
    type GpDataInd,
    ParamId,
    type ReceivedDataResponse,
    type Request,
} from "./constants";
import {apsBusyQueue, apsQueue, busyQueue} from "./driver";

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

    if (status !== CommandStatus.Success) {
        if (parameterId in ParamId) {
            logger.debug(`Received read parameter response for ${ParamId[parameterId]}, seq: ${seqNumber}, status: ${status}`, NS);
        }
        return result;
    }

    switch (parameterId) {
        case ParamId.MAC_ADDRESS: {
            result = view.getBigUint64(pos, littleEndian);
            break;
        }
        case ParamId.APS_TRUST_CENTER_ADDRESS: {
            result = view.getBigUint64(pos, littleEndian);
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
            result = view.getBigUint64(pos, littleEndian);
            break;
        }
        case ParamId.APS_USE_EXTENDED_PANID: {
            result = view.getBigUint64(pos, littleEndian);
            break;
        }
        case ParamId.STK_NETWORK_KEY: {
            result = Buffer.alloc(16);
            pos += 1; // key index
            for (let i = 0; i < 16; i++) {
                result[i] = view.getUint8(pos);
                pos += 1;
            }
            break;
        }
        case ParamId.STK_CURRENT_CHANNEL: {
            result = view.getUint8(pos);
            break;
        }
        case ParamId.STK_ENDPOINT: {
            result = Buffer.alloc(view.byteLength - pos);
            for (let i = 0; pos < view.byteLength; i++, pos++) {
                result[i] = view.getUint8(pos);
            }
            break;
        }
        case ParamId.APS_CHANNEL_MASK: {
            result = view.getUint32(pos, littleEndian);
            break;
        }
        case ParamId.STK_FRAME_COUNTER: {
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
        let p: Command | string | null = result;
        if (parameterId === ParamId.STK_NETWORK_KEY) {
            // don't show in logs
            p = "<hidden>";
        } else if (typeof result === "bigint") {
            p = `0x${result.toString(16).padStart(16, "0")}`;
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
    const buf = new Buffalo(Buffer.from(view.buffer));

    const commandId = buf.readUInt8();
    const seqNr = buf.readUInt8();
    const status = buf.readUInt8();

    if (status !== CommandStatus.Success) {
        logger.debug(`Response APS-DATA.confirm seq: ${seqNr} status: ${CommandStatus[status]} (error)`, NS);
        return null;
    }

    const frameLength = buf.readUInt16();
    const payloadLength = buf.readUInt16();
    // payload
    const deviceState = buf.readUInt8();
    const requestId = buf.readUInt8();
    const destAddrMode = buf.readUInt8();

    let destAddr64: string | undefined;
    let destAddr16: number | undefined;
    let destEndpoint: number | undefined;
    let destAddr = "";

    if (destAddrMode === ApsAddressMode.Nwk) {
        destAddr16 = buf.readUInt16();
        destAddr = destAddr16.toString(16).padStart(4, "0");
        destEndpoint = buf.readUInt8();
    } else if (destAddrMode === ApsAddressMode.Group) {
        destAddr16 = buf.readUInt16();
        destAddr = destAddr16.toString(16).padStart(4, "0");
    } else if (destAddrMode === ApsAddressMode.Ieee) {
        destAddr64 = buf.readUInt64().toString(16).padStart(16, "0");
        destAddr = destAddr64;
        destEndpoint = buf.readUInt8();
    } else {
        logger.debug(`Response APS-DATA.confirm seq: ${seqNr} unsupported address mode: ${destAddrMode}`, NS);
    }

    const srcEndpoint = buf.readUInt8();
    const confirmStatus = buf.readUInt8();

    // resolve APS-DATA.request promise
    const i = apsBusyQueue.findIndex((r: ApsRequest) => r.request && r.request.requestId === requestId);

    if (i < 0) {
        logger.debug(`Response APS-DATA.confirm seq: ${seqNr} but no matching request`, NS);
        return null;
    }

    const req: ApsRequest = apsBusyQueue[i];
    //remove from busyqueue
    apsBusyQueue.splice(i, 1);

    let strstatus = "unknown";
    const hexstatus = `0x${confirmStatus.toString(16).padStart(2, "0")}`;
    if (confirmStatus in ApsStatusCode) {
        strstatus = ApsStatusCode[confirmStatus];
    }

    // TODO(mpi): This function should not change the queue and resolve/reject the request promise.
    // It should only do what the name says and remaining parts handled in upper callframe.

    if (confirmStatus === ApsStatusCode.Success) {
        req.resolve(confirmStatus);
    } else {
        // if the request failed check if we can resend with APS ACK enabled
        const hasTimeLeft = Date.now() - req.ts < req.request.timeout;

        if (req.request.txOptions === 0 && hasTimeLeft && req.request.destAddrMode === ApsAddressMode.Nwk) {
            req.request.txOptions = 0x04;

            logger.debug(`Resend request with APS ACK enabled seq: ${seqNr}`, NS);
            apsQueue.push(req);
        } else {
            req.reject(new Error(`Failed APS-DATA.request with confirm status: ${strstatus} (${hexstatus})`));
        }
    }

    logger.debug(`APS-DATA.confirm  destAddr: 0x${destAddr} APS request id: ${requestId} confirm status: ${strstatus} ${hexstatus}`, NS);
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

// TODO(mpi): The ../buffalo/buffalo.ts already provides this, so we should reuse it instead of a own implementation?!
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

        if (destAddrMode === ApsAddressMode.Ieee) {
            destAddr64 = uview.getU64().toString(16).padStart(16, "0");
            destAddr16 = 0xfffe;
            destAddr = destAddr64;
        } else if (destAddrMode === ApsAddressMode.Nwk || destAddrMode === ApsAddressMode.Group) {
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

        if (srcAddrMode === ApsAddressMode.Nwk || srcAddrMode === ApsAddressMode.NwkAndIeee) {
            srcAddr16 = uview.getU16();
            srcAddr = srcAddr16.toString(16);

            if (srcAddrMode === ApsAddressMode.NwkAndIeee) {
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

// The ApplicationID sub-field contains the information about the application used by the GPD.
// ApplicationID = 0b000 indicates the GPD_ID field has the length of 4B and contains the GPD SrcID.
// ApplicationID = 0b010 indicates the GPD_ID field has the length of 8B and contains the GPD IEEE address.
enum GpApplicationId {
    SrcId4B = 0,
    Lped = 1,
    Ieee8B = 2,
}

enum GpSecurityLevel {
    NoSecurity = 0,
    // TODO(mpi): "Reserved" is noted in the available spec but the code defined it as follows:
    Reserved = 1, // 0b01 1LSB of frame counter and short (2B) MIC only
    FrameCounter4BMic4B = 2,
    EncryptionFrameCounter4BMic4B = 3,
}

enum ZgpConstants {
    GpNwkProtocolVersion = 3,
    GpNwkDataFrame = 0,
    GpNwkMaintenanceFrame = 1,
    GpMinMsduSize = 1,
    GpAutoCommissioningFlag = 1 << 6,
    GpNwkFrameControlExtensionFlag = 1 << 7,
}

function parseGreenPowerDataIndication(view: DataView): GpDataInd | null {
    try {
        let srcId = 0;
        let frameCounter = 0;
        let commandId = 0;
        let commandFrameSize = 0;
        let commandFrame: Buffer | undefined;

        const buf = new Buffalo(Buffer.from(view.buffer));

        const _fwCommandId = buf.readUInt8();
        const seqNr = buf.readUInt8();
        const fwStatus = buf.readUInt8();

        if (fwStatus !== CommandStatus.Success) {
            return null;
        }

        const _frameLength = buf.readUInt16();
        const _payloadLength = buf.readUInt16();

        // payload

        // implementation ported from deCONZ GP code
        const nwkFrameControl = buf.readUInt8();

        // check frame type
        const frameType = nwkFrameControl & 0x03;

        if (frameType !== ZgpConstants.GpNwkDataFrame && frameType !== ZgpConstants.GpNwkMaintenanceFrame) {
            return null;
        }

        // check green power protocol version
        if (((nwkFrameControl >> 2) & 0x03) !== ZgpConstants.GpNwkProtocolVersion) {
            return null;
        }

        // extended frame control
        let nwkExtFrameControl = 0;
        const hasExtensionFlag = nwkFrameControl & ZgpConstants.GpNwkFrameControlExtensionFlag;
        if (hasExtensionFlag) {
            nwkExtFrameControl = buf.readUInt8();
        }

        const options = nwkExtFrameControl | (nwkFrameControl << 8);

        const applicationId = nwkExtFrameControl & 7;
        const securityLevel = (nwkExtFrameControl >> 3) & 3;

        if (applicationId !== GpApplicationId.SrcId4B && applicationId !== GpApplicationId.Ieee8B) {
            return null; // NOTE: GpApplicationId.Lped (1) should be dropped as per spec
        }

        // The GPDSrcID field is present if the Frame Type sub-field is set to 0b00 and the ApplicationID sub-
        // field of the Extended NWK Frame Control field is set to 0b000 (or not present).
        if (
            applicationId === GpApplicationId.SrcId4B &&
            frameType === ZgpConstants.GpNwkDataFrame /*|| (frameType === ZgpConstants.GpNwkMaintenanceFrame && hasExtensionFlag) */
        ) {
            srcId = buf.readUInt32();
        }
        // TODO(mpi): for applicationId == GpApplicationId.Ieee8B:
        // currently Ieee addresses aren't supported, do they actually appear?!
        // these need be extracted from MAC header which we don't have here (this is only the NWK payload).

        // frame counter filed
        frameCounter = 0;
        let micSize = 0;

        if (hasExtensionFlag && frameType === ZgpConstants.GpNwkDataFrame) {
            if (applicationId === GpApplicationId.Ieee8B) {
                const _endpoint = buf.readUInt8();
            }
            // If the SecurityLevel is set to 0b00, the SecurityKey sub-field is ignored on reception, and the
            // fields Security frame counter and MIC are not present.
            if (securityLevel === GpSecurityLevel.Reserved) {
                micSize = 2; // TODO(mpi) does this actually exists? Check recent specs!
            } else if (securityLevel === GpSecurityLevel.FrameCounter4BMic4B || securityLevel === GpSecurityLevel.EncryptionFrameCounter4BMic4B) {
                frameCounter = buf.readUInt32();
                micSize = 4;
            }
        }

        if (!buf.isMore()) {
            return null;
        }

        if (applicationId === GpApplicationId.SrcId4B || applicationId === GpApplicationId.Ieee8B) {
            commandId = buf.readUInt8();
            commandFrameSize = buf.getBuffer().length - buf.getPosition() - micSize;
            //logger.debug(`GPD payload length: ${commandFrameSize}, mic size: ${micSize}`, NS);
            if (commandFrameSize < 0) {
                logger.error(`GPD payload length < 0: ${commandFrameSize}`, NS);
                return null;
            }
            commandFrame = Buffer.from(buf.readBuffer(commandFrameSize)); // copy
        }

        // NOTE(mpi): The old adapter treated (view.byteLength < 30) as notification, larger as commissioning?!
        // The controller thus rejected commissioning frames.
        const id = 0; // 0 = notification, 4 = commissioning

        if (commandFrame === undefined) {
            logger.debug("GPD discard frame since commandFrame is null?!", NS);
            return null;
        }

        const ind: GpDataInd = {
            seqNr,
            id,
            options,
            srcId,
            frameCounter,
            commandId,
            commandFrameSize,
            commandFrame,
        };

        // TODO(mpi): This only tracks one frame, might be a bit optimistic
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
    return FirmwareCommand.MacPollIndication;
}
function parseBeaconRequest(_view: DataView): number {
    logger.debug("Received Beacon Request", NS);
    return FirmwareCommand.Beacon;
}

function parseDebugLog(view: DataView): null {
    let dbg = "";
    const buf = new Buffalo(Buffer.from(view.buffer));

    /* const commandId = */ buf.readUInt8();
    /* const seqNr = */ buf.readUInt8();
    const status = buf.readUInt8();

    if (status !== CommandStatus.Success) {
        // unlikely
        return null;
    }

    /* const frameLength = */ buf.readUInt16();
    const payloadLength = buf.readUInt16();

    for (let i = 0; i < payloadLength && buf.isMore(); i++) {
        const ch = buf.readUInt8();
        if (ch >= 32 && ch <= 127) {
            dbg += String.fromCharCode(ch);
        }
    }

    if (dbg.length !== 0) {
        logger.debug(`firmware log: ${dbg}`, NS);
    }

    return null;
}

function parseUnknownCommand(view: DataView): number {
    const id = view.getUint8(0);
    if (id in FirmwareCommand) {
        logger.debug(`received unsupported command: ${FirmwareCommand[id]} id: 0x${id.toString(16).padStart(2, "0")}`, NS);
    } else {
        logger.debug(`received unknown command: id: 0x${id.toString(16).padStart(2, "0")}`, NS);
    }
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
        case FirmwareCommand.DebugLog:
            return parseDebugLog;
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
    } else if (status === CommandStatus.Unsupported && commandId === FirmwareCommand.ReadParameter) {
        // resolve anyway to let higher layer handle unsupported
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
