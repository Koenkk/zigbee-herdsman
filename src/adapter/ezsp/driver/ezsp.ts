/* istanbul ignore file */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as t from './types';
import {SerialDriver} from './uart';
import {
    FRAMES,
    FRAME_NAMES_BY_ID,
    EZSPFrameDesc,
    ParamsDesc,
    ZDOREQUESTS,
    ZDOREQUEST_NAME_BY_ID, 
    ZDORESPONSES,
    ZDORESPONSE_NAME_BY_ID
} from './commands';
import {
    EmberStatus,
    EzspPolicyId,
    EzspDecisionId,
    EzspDecisionBitmask,
    EzspValueId,
    EmberConcentratorType,
    EzspConfigId,
    EmberZdoConfigurationFlags,
} from './types/named';
import {EventEmitter} from 'events';
import {EmberNetworkParameters} from './types/struct';
import {Queue, Waitress, Wait} from '../../../utils';
import Debug from "debug";
import {SerialPortOptions} from '../../tstype';
import {
    EZSP_EXTENDED_FRAME_CONTROL_HB_INDEX,
    EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX,
    EZSP_EXTENDED_FRAME_CONTROL_RESERVED_MASK,
    EZSP_EXTENDED_FRAME_FORMAT_VERSION,
    EZSP_EXTENDED_FRAME_FORMAT_VERSION_MASK,
    EZSP_FRAME_CONTROL_DIRECTION_MASK,
    EZSP_FRAME_CONTROL_INDEX,
    EZSP_FRAME_CONTROL_OVERFLOW,
    EZSP_FRAME_CONTROL_OVERFLOW_MASK,
    EZSP_FRAME_CONTROL_RESPONSE,
    EZSP_FRAME_CONTROL_TRUNCATED,
    EZSP_FRAME_CONTROL_TRUNCATED_MASK,
    EZSP_FRAME_ID_INDEX,
    EZSP_PARAMETERS_INDEX,
    EZSP_SEQUENCE_INDEX
} from './consts';


const debug = {
    error: Debug('zigbee-herdsman:adapter:ezsp:erro'),
    log: Debug('zigbee-herdsman:adapter:ezsp:ezsp'),
};


const MAX_SERIAL_CONNECT_ATTEMPTS = 4;
/** In ms. This is multiplied by tries count (above), e.g. 4 tries = 5000, 10000, 15000 */
const SERIAL_CONNECT_NEW_ATTEMPT_MIN_DELAY = 5000;
const MTOR_MIN_INTERVAL = 10;
const MTOR_MAX_INTERVAL = 90;
const MTOR_ROUTE_ERROR_THRESHOLD = 4;
const MTOR_DELIVERY_FAIL_THRESHOLD = 3;
const MAX_WATCHDOG_FAILURES = 4;
//const RESET_ATTEMPT_BACKOFF_TIME = 5;
const WATCHDOG_WAKE_PERIOD = 10;  // in sec
//const EZSP_COUNTER_CLEAR_INTERVAL = 180;  // Clear counters every n * WATCHDOG_WAKE_PERIOD

const CONFIG_IDS_PRE_V9: readonly [EzspConfigId, number][] = [
    [EzspConfigId.CONFIG_TC_REJOINS_USING_WELL_KNOWN_KEY_TIMEOUT_S, 90],
    [EzspConfigId.CONFIG_TRUST_CENTER_ADDRESS_CACHE_SIZE, 2],
    //[EzspConfigId.CONFIG_SUPPORTED_NETWORKS, 1],
    [EzspConfigId.CONFIG_FRAGMENT_DELAY_MS, 50],
    [EzspConfigId.CONFIG_PAN_ID_CONFLICT_REPORT_THRESHOLD, 2],
    //[EzspConfigId.CONFIG_SOURCE_ROUTE_TABLE_SIZE, 16],
    //[EzspConfigId.CONFIG_ADDRESS_TABLE_SIZE, 16],
    [EzspConfigId.CONFIG_APPLICATION_ZDO_FLAGS, 
        EmberZdoConfigurationFlags.APP_HANDLES_UNSUPPORTED_ZDO_REQUESTS | 
        EmberZdoConfigurationFlags.APP_RECEIVES_SUPPORTED_ZDO_REQUESTS],
    [EzspConfigId.CONFIG_INDIRECT_TRANSMISSION_TIMEOUT, 7680],
    [EzspConfigId.CONFIG_END_DEVICE_POLL_TIMEOUT, 14],
    [EzspConfigId.CONFIG_SECURITY_LEVEL, 5],
    [EzspConfigId.CONFIG_STACK_PROFILE, 2],
    //[EzspConfigId.CONFIG_TX_POWER_MODE, 3],
    [EzspConfigId.CONFIG_FRAGMENT_WINDOW_SIZE, 1],
    //[EzspConfigId.CONFIG_NEIGHBOR_TABLE_SIZE, 16],
    //[EzspConfigId.CONFIG_ROUTE_TABLE_SIZE, 16],
    //[EzspConfigId.CONFIG_BINDING_TABLE_SIZE, 32],
    //[EzspConfigId.CONFIG_KEY_TABLE_SIZE, 12],
    //[EzspConfigId.CONFIG_ZLL_GROUP_ADDRESSES, 0],
    //[EzspConfigId.CONFIG_ZLL_RSSI_THRESHOLD, 0],
    //[EzspConfigId.CONFIG_APS_UNICAST_MESSAGE_COUNT, 255],
    //[EzspConfigId.CONFIG_BROADCAST_TABLE_SIZE, 43],
    //[EzspConfigId.CONFIG_MAX_HOPS, 30],
    //[EzspConfigId.CONFIG_MAX_END_DEVICE_CHILDREN, 32],
    [EzspConfigId.CONFIG_PACKET_BUFFER_COUNT, 255],
];

/**
 * Can only decrease "NCP Memory Allocation" configs at runtime from V9 on.
 * @see https://www.silabs.com/documents/public/release-notes/emberznet-release-notes-7.0.1.0.pdf
 */
const CONFIG_IDS_CURRENT: readonly [EzspConfigId, number][] = [
    [EzspConfigId.CONFIG_RETRY_QUEUE_SIZE, 16],
    [EzspConfigId.CONFIG_TC_REJOINS_USING_WELL_KNOWN_KEY_TIMEOUT_S, 90],
    [EzspConfigId.CONFIG_FRAGMENT_DELAY_MS, 50],
    [EzspConfigId.CONFIG_PAN_ID_CONFLICT_REPORT_THRESHOLD, 2],
    [EzspConfigId.CONFIG_APPLICATION_ZDO_FLAGS, 
        EmberZdoConfigurationFlags.APP_HANDLES_UNSUPPORTED_ZDO_REQUESTS | 
        EmberZdoConfigurationFlags.APP_RECEIVES_SUPPORTED_ZDO_REQUESTS],
    [EzspConfigId.CONFIG_INDIRECT_TRANSMISSION_TIMEOUT, 7680],
    [EzspConfigId.CONFIG_END_DEVICE_POLL_TIMEOUT, 14],
    [EzspConfigId.CONFIG_SECURITY_LEVEL, 5],
    [EzspConfigId.CONFIG_STACK_PROFILE, 2],
    [EzspConfigId.CONFIG_FRAGMENT_WINDOW_SIZE, 1],
];

/**
 * Zigbeed-specific configuration
 * Since these are currently not overriden, by above configs,
 * don't need to trigger NCP calls for nothing, just here in case that changes.
 * @source Unify SDK
 */
// const CONFIG_IDS_ZIGBEED: readonly [EzspConfigId, number][] = [
//     [EzspConfigId.CONFIG_BINDING_TABLE_SIZE, 128],
//     [EzspConfigId.CONFIG_KEY_TABLE_SIZE, 128],
//     [EzspConfigId.CONFIG_MAX_END_DEVICE_CHILDREN, 64],
//     [EzspConfigId.CONFIG_APS_UNICAST_MESSAGE_COUNT, 32],
//     [EzspConfigId.CONFIG_NEIGHBOR_TABLE_SIZE, 26],
//     [EzspConfigId.CONFIG_SOURCE_ROUTE_TABLE_SIZE, 254],
//     [EzspConfigId.CONFIG_ROUTE_TABLE_SIZE, 254],
//     [EzspConfigId.CONFIG_DISCOVERY_TABLE_SIZE, 64],
//     [EzspConfigId.CONFIG_MAC_FILTER_TABLE_SIZE, 32],
// ];

const POLICY_IDS_PRE_V8: readonly [EzspPolicyId, number][] = [
    // [EzspPolicyId.BINDING_MODIFICATION_POLICY,
    //     EzspDecisionId.DISALLOW_BINDING_MODIFICATION],
    // [EzspPolicyId.UNICAST_REPLIES_POLICY, EzspDecisionId.HOST_WILL_NOT_SUPPLY_REPLY],
    // [EzspPolicyId.POLL_HANDLER_POLICY, EzspDecisionId.POLL_HANDLER_IGNORE],
    // [EzspPolicyId.MESSAGE_CONTENTS_IN_CALLBACK_POLICY,
    //     EzspDecisionId.MESSAGE_TAG_ONLY_IN_CALLBACK],
    // [EzspPolicyId.PACKET_VALIDATE_LIBRARY_POLICY,
    //     EzspDecisionId.PACKET_VALIDATE_LIBRARY_CHECKS_DISABLED],
    // [EzspPolicyId.ZLL_POLICY, EzspDecisionId.ALLOW_JOINS],
    // [EzspPolicyId.TC_REJOINS_USING_WELL_KNOWN_KEY_POLICY, EzspDecisionId.ALLOW_JOINS],
    [EzspPolicyId.APP_KEY_REQUEST_POLICY, EzspDecisionId.DENY_APP_KEY_REQUESTS],
    [EzspPolicyId.TC_KEY_REQUEST_POLICY, EzspDecisionId.ALLOW_TC_KEY_REQUESTS],
];

const POLICY_IDS_CURRENT: readonly [EzspPolicyId, number][] = [
    [EzspPolicyId.APP_KEY_REQUEST_POLICY, EzspDecisionId.DENY_APP_KEY_REQUESTS],
    [EzspPolicyId.TC_KEY_REQUEST_POLICY, EzspDecisionId.ALLOW_TC_KEY_REQUESTS],
    [EzspPolicyId.TRUST_CENTER_POLICY, EzspDecisionBitmask.ALLOW_UNSECURED_REJOINS | EzspDecisionBitmask.ALLOW_JOINS],
];


type EZSPFrame = {
    sequence: number,
    frameId: number,
    frameName: string,
    payload: EZSPFrameData
};

type EZSPWaitressMatcher = {
    sequence: number | null,
    frameId: number | string
};


export class EZSPFrameData {
    _cls_: string;
    _id_: number;
    _isRequest_: boolean;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    [name: string]: any;

    static createFrame(ezspv: number, frame_id: number, isRequest: boolean, params: ParamsDesc | Buffer): EZSPFrameData {
        const names = FRAME_NAMES_BY_ID[frame_id];

        if (!names) {
            throw new Error(`Unrecognized frame FrameID ${frame_id}`);
        }

        let frm: EZSPFrameData;

        names.every((frameName)=>{
            const frameDesc = EZSPFrameData.getFrame(frameName);

            if ((frameDesc.maxV && frameDesc.maxV < ezspv) || (frameDesc.minV && frameDesc.minV > ezspv)) {
                return true;
            }

            try {
                frm = new EZSPFrameData(frameName, isRequest, params);
            } catch (error) {
                debug.error(`Frame ${frameName} parsing error: ${error.stack}`);
                return true;
            }

            return false;
        });

        return frm;
    }

    /**
     * Validate the information available in the incoming frame, and create an EZSPFrameData if valid.
     * @param rawData Full data buffer as received by UART layer (needed to check validity).
     * @returns EzspStatus of the operation, anything but SUCCESS should result in the frame being reject.
     * @returns EZSPFrameData The actual frame data, if valid, else null.
     */
    static createValidReceivedFrame(ezspv: number, rawData: Buffer): [t.EzspStatus, EZSPFrameData] {
        let frameControl: number;
        let frameId: number;

        // extended vs legacy EZSP frame format detection
        if ((rawData[EZSP_EXTENDED_FRAME_CONTROL_HB_INDEX] & EZSP_EXTENDED_FRAME_FORMAT_VERSION_MASK) === EZSP_EXTENDED_FRAME_FORMAT_VERSION) {
            // Extended: [Sequence: 1] [Frame Control: 2] [Frame ID: 2] [Parameters*]
            [frameControl, rawData] = t.uint16_t.deserialize(t.uint16_t, rawData.subarray(EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX));// + HB_INDEX

            if (((frameControl >> 8) & 0xFF) & EZSP_EXTENDED_FRAME_CONTROL_RESERVED_MASK) {
                return [t.EzspStatus.ERROR_UNSUPPORTED_CONTROL, null];
            }

            [frameId, rawData] = t.uint16_t.deserialize(t.uint16_t, rawData);// EZSP_EXTENDED_FRAME_ID_LB_INDEX + HB_INDEX
            // rawBuffer now starts at EZSP_EXTENDED_PARAMETERS_INDEX
        } else {
            // Legacy: [Sequence: 1] [Frame Control: 1] [Frame ID: 1] [Parameters*]
            frameControl = rawData[EZSP_FRAME_CONTROL_INDEX];
            frameId = rawData[EZSP_FRAME_ID_INDEX];
            rawData = rawData.subarray(EZSP_PARAMETERS_INDEX);
        }

        // check control information
        if (frameId === FRAMES.invalidCommand.ID) {
            return [rawData[0], null];
        }

        if ((frameControl & EZSP_FRAME_CONTROL_DIRECTION_MASK) !== EZSP_FRAME_CONTROL_RESPONSE) {
            return [t.EzspStatus.ERROR_WRONG_DIRECTION, null];
        }

        if ((frameControl & EZSP_FRAME_CONTROL_TRUNCATED_MASK) === EZSP_FRAME_CONTROL_TRUNCATED) {
            return [t.EzspStatus.ERROR_TRUNCATED, null];
        }

        if ((frameControl & EZSP_FRAME_CONTROL_OVERFLOW_MASK) === EZSP_FRAME_CONTROL_OVERFLOW) {
            return [t.EzspStatus.ERROR_OVERFLOW, null];
        }

        // if ((frameControl & EZSP_FRAME_CONTROL_PENDING_CB_MASK) === EZSP_FRAME_CONTROL_PENDING_CB) {
        //     // ncpHasCallbacks = true;
        // } else {
        //     // ncpHasCallbacks = false;
        // }

        // rawData is no longer "raw" after deserializing, may still be null if frame not supported by Z2M yet
        return [t.EzspStatus.SUCCESS, EZSPFrameData.createFrame(ezspv, frameId, false, rawData)];
    }

    static getFrame(name: string): EZSPFrameDesc {
        const frameDesc = FRAMES[name];

        if (!frameDesc) {
            throw new Error(`Unrecognized frame from FrameID ${name}`);
        }

        return frameDesc;
    }

    constructor(key: string, isRequest: boolean, params: ParamsDesc | Buffer) {
        this._cls_ = key;
        this._id_ = FRAMES[this._cls_].ID;
        
        this._isRequest_ = isRequest;
        const frame = EZSPFrameData.getFrame(key);
        const frameDesc = (this._isRequest_) ? frame.request || {} : frame.response || {};

        if (Buffer.isBuffer(params)) {
            let data = params;

            for (const prop of Object.getOwnPropertyNames(frameDesc)) {
                [this[prop], data] = frameDesc[prop].deserialize(frameDesc[prop], data);
            }
        } else {
            for (const prop of Object.getOwnPropertyNames(frameDesc)) {
                this[prop] = params[prop];
            }
        }
    }

    serialize(): Buffer {
        const frame = EZSPFrameData.getFrame(this._cls_);
        const frameDesc = (this._isRequest_) ? frame.request || {} : frame.response || {};
        const result = [];

        for (const prop of Object.getOwnPropertyNames(frameDesc)) {
            result.push(frameDesc[prop].serialize(frameDesc[prop], this[prop]));
        }

        return Buffer.concat(result);
    }

    get name(): string {
        return this._cls_;
    }

    get id(): number {
        return this._id_;
    }
}

export class EZSPZDORequestFrameData {
    _cls_: string;
    _id_: number;
    _isRequest_: boolean;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    [name: string]: any;

    static getFrame(key: string|number): EZSPFrameDesc {
        const name = (typeof key == 'string') ? key : ZDOREQUEST_NAME_BY_ID[key];
        const frameDesc = ZDOREQUESTS[name];

        if (!frameDesc) {
            throw new Error(`Unrecognized ZDOFrame from FrameID ${key}`);
        }

        return frameDesc;
    }

    constructor(key: string|number, isRequest: boolean, params: ParamsDesc | Buffer) {
        if (typeof key == 'string') {
            this._cls_ = key;
            this._id_ = ZDOREQUESTS[this._cls_].ID;
        } else {
            this._id_ = key;
            this._cls_ = ZDOREQUEST_NAME_BY_ID[key];
        }
        
        this._isRequest_ = isRequest;
        const frame = EZSPZDORequestFrameData.getFrame(key);
        const frameDesc = (this._isRequest_) ? frame.request || {} : frame.response || {};

        if (Buffer.isBuffer(params)) {
            let data = params;

            for (const prop of Object.getOwnPropertyNames(frameDesc)) {
                [this[prop], data] = frameDesc[prop].deserialize(frameDesc[prop], data);
            }
        } else {
            for (const prop of Object.getOwnPropertyNames(frameDesc)) {
                this[prop] = params[prop];
            }
        }
    }

    serialize(): Buffer {
        const frame = EZSPZDORequestFrameData.getFrame(this._cls_);
        const frameDesc = (this._isRequest_) ? frame.request || {} : frame.response || {};
        const result = [];

        for (const prop of Object.getOwnPropertyNames(frameDesc)) {
            result.push(frameDesc[prop].serialize(frameDesc[prop], this[prop]));
        }

        return Buffer.concat(result);
    }

    get name(): string {
        return this._cls_;
    }

    get id(): number {
        return this._id_;
    }
}

export class EZSPZDOResponseFrameData {
    _cls_: string;
    _id_: number;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    [name: string]: any;

    static getFrame(key: string|number): ParamsDesc {
        const name = (typeof key == 'string') ? key : ZDORESPONSE_NAME_BY_ID[key];
        const frameDesc = ZDORESPONSES[name];

        if (!frameDesc) {
            throw new Error(`Unrecognized ZDOFrame from FrameID ${key}`);
        }

        return frameDesc.params;
    }

    constructor(key: string|number, params: ParamsDesc | Buffer) {
        if (typeof key == 'string') {
            this._cls_ = key;
            this._id_ = ZDORESPONSES[this._cls_].ID;
        } else {
            this._id_ = key;
            this._cls_ = ZDORESPONSE_NAME_BY_ID[key];
        }
        
        const frameDesc = EZSPZDOResponseFrameData.getFrame(key);

        if (Buffer.isBuffer(params)) {
            let data = params;

            for (const prop of Object.getOwnPropertyNames(frameDesc)) {
                [this[prop], data] = frameDesc[prop].deserialize(frameDesc[prop], data);
            }
        } else {
            for (const prop of Object.getOwnPropertyNames(frameDesc)) {
                this[prop] = params[prop];
            }
        }
    }

    serialize(): Buffer {
        const frameDesc = EZSPZDOResponseFrameData.getFrame(this._cls_);
        const result = [];

        for (const prop of Object.getOwnPropertyNames(frameDesc)) {
            result.push(frameDesc[prop].serialize(frameDesc[prop], this[prop]));
        }

        return Buffer.concat(result);
    }

    get name(): string {
        return this._cls_;
    }

    get id(): number {
        return this._id_;
    }
}


export class Ezsp extends EventEmitter {
    ezspV = 8;// XXX: avoid a second NCP call in majority of cases by using "most popular" version instead of 4?
    cmdSeq = 0;// command sequence
    private serialDriver: SerialDriver;
    private waitress: Waitress<EZSPFrame, EZSPWaitressMatcher>;
    private queue: Queue;
    private watchdogTimer: NodeJS.Timeout;
    private failures = 0;

    constructor() {
        super();

        this.queue = new Queue();
        this.waitress = new Waitress<EZSPFrame, EZSPWaitressMatcher>(
            this.waitressValidator, this.waitressTimeoutFormatter);

        this.serialDriver = new SerialDriver();
        this.serialDriver.on('received', this.onFrameReceived.bind(this));
        this.serialDriver.on('close', this.onSerialClose.bind(this));
    }

    public async connect(options: SerialPortOptions): Promise<void> {
        let lastError = null;

        for (let i = 1; i <= MAX_SERIAL_CONNECT_ATTEMPTS; i++) {
            try {
                await this.serialDriver.connect(options);
                break;
            } catch (error) {
                debug.error(`Connection attempt ${i} error: ${error.stack}`);

                if (i < MAX_SERIAL_CONNECT_ATTEMPTS) {
                    await Wait(SERIAL_CONNECT_NEW_ATTEMPT_MIN_DELAY * i);
                    debug.log(`Next attempt ${i+1}`);
                }

                lastError = error;
            }
        }

        if (!this.serialDriver.isInitialized()) {
            throw new Error("Failure to connect", {cause: lastError});
        }

        this.serialDriver.on('reset', this.onSerialReset.bind(this));

        if (WATCHDOG_WAKE_PERIOD) {
            this.watchdogTimer = setInterval(
                this.watchdogHandler.bind(this),
                WATCHDOG_WAKE_PERIOD*1000
            );
        }
    }

    private onSerialReset(): void {
        debug.log('onSerialReset()');
        this.emit('reset');
    }

    private onSerialClose(): void {
        debug.log('onSerialClose()');
        this.emit('close');
    }

    public async close(emitClose: boolean): Promise<void> {
        debug.log('Closing Ezsp');

        clearTimeout(this.watchdogTimer);
        this.queue.clear();
        await this.serialDriver.close(emitClose);
    }

    /**
     * Handle a received EZSP frame
     * 
     * The protocol has taken care of UART specific framing etc, so we should
     * just have EZSP application stuff here, with all escaping/stuffing and
     * data randomization removed.
     * @param data 
     */
    private onFrameReceived(data: Buffer): void {
        debug.log(`<== EZSPFrame ${data.toString('hex')}`);
        const sequence = data[EZSP_SEQUENCE_INDEX];
        const [status, frm] = EZSPFrameData.createValidReceivedFrame(this.ezspV, data);

        if (status !== t.EzspStatus.SUCCESS) {
            // already logged
            switch (status) {
            case t.EzspStatus.ERROR_UNSUPPORTED_CONTROL: {
                // XXX: SDK resets NCP upon receiving this
                debug.error(`Received frame with unsupported control.`);
                break;
            }
            case t.EzspStatus.ERROR_WRONG_DIRECTION: {
                debug.error(`Received frame with EzspStatus.ERROR_WRONG_DIRECTION in control.`);
                // XXX: SDK resets NCP upon receiving this
                break;
            }
            case t.EzspStatus.ERROR_TRUNCATED: {
                debug.error(`Received frame with EzspStatus.ERROR_TRUNCATED in control.`);
                console.log(`[WARNING] NCP may be running out of buffers. Remediate network congestion, if present.`);
                // XXX: SDK resets NCP upon receiving this
                break;
            }
            case t.EzspStatus.ERROR_OVERFLOW: {
                debug.error(`Received frame with EzspStatus.ERROR_OVERFLOW in control.`);
                console.log(`[ERROR] NCP has run out of buffers, causing general malfunction. Remediate network congestion, if present.`);
                // XXX: hold the host from sending frames for a short duration?
                break;
            }
            default: {
                debug.error(`Received invalidCommand(0x0058) with reason=${t.EzspStatus.valueToName(t.EzspStatus, status)}.`);
                // XXX: SDK resets NCP upon receiving this, depending on "reason"
                break;
            }
            }

            // XXX: handle possible NCP reset for "bad cases" @see EZSPFrameData.validateAndCreateReceivedFrame
            return;
        }

        if (!frm) {
            debug.error(`Skipping unparsed frame. ${data.toString('hex')}`);
            return;
        }

        debug.log(`<== ${frm.name}: ${JSON.stringify(frm)}`);

        const handled = this.waitress.resolve({frameId: frm.id, frameName: frm.name, sequence, payload: frm});

        if (!handled) {
            this.emit('frame', frm.name, frm);
        }

        if (frm.id === 0) {
            this.ezspV = frm.protocolVersion;
        }
    }

    async version(): Promise<number> {
        const version = this.ezspV;
        const result = await this.execCommand("version", {desiredProtocolVersion: version});
 
        if ((result.protocolVersion !== version)) {
            debug.log("Switching to eszp version %d", result.protocolVersion);
 
            await this.execCommand("version", {desiredProtocolVersion: result.protocolVersion});
        }

        return result.protocolVersion;
    }

    async networkInit(): Promise<boolean> {
        const waiter = this.waitFor("stackStatusHandler", null);
        const result = await this.execCommand("networkInit");

        debug.log('network init result: ', JSON.stringify(result));

        if ((result.status !== EmberStatus.SUCCESS)) {
            this.waitress.remove(waiter.ID);
            debug.log("Failure to init network");
            return false;
        }

        const response = await waiter.start().promise;

        return response.payload.status == EmberStatus.NETWORK_UP;
    }

    async leaveNetwork(): Promise<number> {
        const waiter = this.waitFor("stackStatusHandler", null);
        const result = await this.execCommand("leaveNetwork");

        debug.log('network init result', JSON.stringify(result));

        if ((result.status !== EmberStatus.SUCCESS)) {
            this.waitress.remove(waiter.ID);
            debug.log("Failure to leave network");
            throw new Error(("Failure to leave network: " + JSON.stringify(result)));
        }

        const response = await waiter.start().promise;

        if ((response.payload.status !== EmberStatus.NETWORK_DOWN)) {
            debug.log("Wrong network status: " + JSON.stringify(response.payload));
            throw new Error(("Wrong network status: " + JSON.stringify(response.payload)));
        }

        return response.payload.status;
    }

    async setConfigurationValue(configId: EzspConfigId, value: number): Promise<void> {
        const cmdStr = `[EzspConfigId] Set ${EzspConfigId.valueToName(EzspConfigId, configId)} = ${value}`;
        debug.log(cmdStr);
        const ret = await this.execCommand('setConfigurationValue', {configId: configId, value: value});
        console.assert(ret.status === EmberStatus.SUCCESS, `${cmdStr} returned unexpected state: ${JSON.stringify(ret)}`);
    }

    async getConfigurationValue(configId: EzspConfigId): Promise<number> {
        const cmdStr = `[EzspConfigId] Get ${EzspConfigId.valueToName(EzspConfigId, configId)}`;
        debug.log(cmdStr);
        const ret = await this.execCommand('getConfigurationValue', {configId: configId});
        console.assert(ret.status === EmberStatus.SUCCESS, `${cmdStr} returned unexpected state: ${JSON.stringify(ret)}`);
        debug.log(`${cmdStr} ==> ${ret.value}`);
        return ret.value;
    }

    async getMulticastTableEntry(index: number): Promise<t.EmberMulticastTableEntry> {
        const ret = await this.execCommand('getMulticastTableEntry', {index: index});
        return ret.value;
    }

    async setMulticastTableEntry(index: number, entry: t.EmberMulticastTableEntry): Promise<EmberStatus> {
        const ret = await this.execCommand('setMulticastTableEntry', {index: index, value: entry});
        console.assert(ret.status === EmberStatus.SUCCESS,
            `Command (setMulticastTableEntry) returned unexpected state: ${JSON.stringify(ret)}`);
        return ret.status;
    }

    async setInitialSecurityState(entry: t.EmberInitialSecurityState): Promise<EmberStatus>{
        const ret = await this.execCommand('setInitialSecurityState', {state: entry});
        console.assert(ret.success === EmberStatus.SUCCESS,
            `Command (setInitialSecurityState) returned unexpected state: ${JSON.stringify(ret)}`);
        return ret.success;
    }

    async getCurrentSecurityState(): Promise<EZSPFrameData> {
        const ret = await this.execCommand('getCurrentSecurityState');
        console.assert(ret.status === EmberStatus.SUCCESS,
            `Command (getCurrentSecurityState) returned unexpected state: ${JSON.stringify(ret)}`);
        return ret;
    }

    async setValue(valueId: EzspValueId, value: number): Promise<EZSPFrameData> {
        const cmdStr = `[EzspValueId] Set ${EzspValueId.valueToName(EzspValueId, valueId)} = ${value}`;
        debug.log(cmdStr);
        const ret = await this.execCommand('setValue', {valueId, value});
        console.assert(ret.status === EmberStatus.SUCCESS, `${cmdStr} returned unexpected state: ${JSON.stringify(ret)}`);
        return ret;
    }

    async getValue(valueId: EzspValueId): Promise<Buffer> {
        const cmdStr = `[EzspValueId] Get ${EzspValueId.valueToName(EzspValueId, valueId)}`;
        debug.log(cmdStr);
        const ret = await this.execCommand('getValue', {valueId});
        console.assert(ret.status === EmberStatus.SUCCESS, `${cmdStr} returned unexpected state: ${JSON.stringify(ret)}`);
        debug.log(`${cmdStr} ==> ${(ret.value as Buffer).toString('hex')}`);
        return ret.value;
    }

    async setPolicy(policyId: EzspPolicyId, value: number): Promise<EZSPFrameData> {
        const cmdStr = `[EzspPolicyId] Set ${EzspPolicyId.valueToName(EzspPolicyId, policyId)} = ${value}`;
        debug.log(cmdStr);
        const ret = await this.execCommand('setPolicy', {policyId: policyId, decisionId: value});
        console.assert(ret.status === EmberStatus.SUCCESS, `${cmdStr} returned unexpected state: ${JSON.stringify(ret)}`);
        return ret;
    }

    async updateConfig(): Promise<void> {
        const config = (this.ezspV < 9 ? CONFIG_IDS_PRE_V9 : CONFIG_IDS_CURRENT);

        for (const [confName, value] of config) {
            try {
                await this.setConfigurationValue(confName, value);
            } catch (error) {
                debug.error(`[EzspConfigId] Set ${confName} = ${value}; error: ${error} ${error.stack}`);
            }
        }
    }

    async updatePolicies(): Promise<void> {
        // Set up the policies for what the NCP should do.
        const policies = (this.ezspV < 8 ? POLICY_IDS_PRE_V8 : POLICY_IDS_CURRENT);

        for (const [policy, value] of policies) {
            try {
                await this.setPolicy(policy, value);
            } catch (error) {
                debug.error(`[EzspPolicyId] Set ${policy} = ${value}; error: ${error} ${error.stack}`);
            }
        }
    }

    private makeFrame(name: string, params: ParamsDesc, seq: number): Buffer {
        const frmData = new EZSPFrameData(name, true, params);

        debug.log(`==> ${JSON.stringify(frmData)}`);

        const frame = [(seq & 255)];

        if ((this.ezspV < 8)) {
            if ((this.ezspV >= 5)) {
                frame.push(0x00, 0xFF, 0x00, frmData.id);
            } else {
                frame.push(0x00, frmData.id);
            }
        } else {
            const cmd_id = t.serialize([frmData.id], [t.uint16_t]);

            frame.push(0x00, 0x01, ...cmd_id);
        }

        return Buffer.concat([Buffer.from(frame), frmData.serialize()]);
    }

    public async execCommand(name: string, params: ParamsDesc = null): Promise<EZSPFrameData> {
        debug.log(`==> ${name}: ${JSON.stringify(params)}`);

        if (!this.serialDriver.isInitialized()) {
            throw new Error('Connection not initialized');
        }

        return this.queue.execute<EZSPFrameData>(async (): Promise<EZSPFrameData> => {
            const data = this.makeFrame(name, params, this.cmdSeq);
            const waiter = this.waitFor(name, this.cmdSeq);
            this.cmdSeq = (this.cmdSeq + 1) & 255;

            try {
                await this.serialDriver.sendDATA(data);

                const response = await waiter.start().promise;

                return response.payload;
            } catch (error) {
                this.waitress.remove(waiter.ID);

                throw new Error(`Failure to send ${name}: ${JSON.stringify(data)}`);
            }
        });
    }

    async formNetwork(params: EmberNetworkParameters): Promise<number> {
        const waiter = this.waitFor("stackStatusHandler", null);
        const formNwkStatus = await this.execCommand("formNetwork", {parameters: params});

        if (formNwkStatus.status !== EmberStatus.SUCCESS) {
            this.waitress.remove(waiter.ID);

            throw new Error(`Failure forming network: ${JSON.stringify(formNwkStatus)}`);
        }

        const response = await waiter.start().promise;

        if (response.payload.status !== EmberStatus.NETWORK_UP) {
            throw new Error(`Wrong network status: ${JSON.stringify(response.payload)}`);
        }

        return response.payload.status;
    }

    public async setSourceRouting(): Promise<boolean> {
        const res = await this.execCommand('setConcentrator', {
            on: true,
            concentratorType: EmberConcentratorType.HIGH_RAM_CONCENTRATOR,
            minTime: MTOR_MIN_INTERVAL,
            maxTime: MTOR_MAX_INTERVAL,
            routeErrorThreshold: MTOR_ROUTE_ERROR_THRESHOLD,
            deliveryFailureThreshold: MTOR_DELIVERY_FAIL_THRESHOLD,
            maxHops: 0,
        });

        if (res.status === EmberStatus.SUCCESS) {
            debug.log(`Set concentrator type to HIGH_RAM_CONCENTRATOR.`);

            if (this.ezspV >= 8) {
                await this.execCommand('setSourceRouteDiscoveryMode', {mode: 1});
            }

            return true;
        } else {
            debug.log(`Failed to set concentrator type, status=${res.status}.`);

            return false;
        }
    }

    public waitFor(frameId: string|number, sequence: number | null, timeout = 10000)
        : { start: () => { promise: Promise<EZSPFrame>; ID: number }; ID: number } {
        return this.waitress.waitFor({frameId, sequence}, timeout);
    }

    private waitressTimeoutFormatter(matcher: EZSPWaitressMatcher, timeout: number): string {
        return `${JSON.stringify(matcher)} after ${timeout}ms`;
    }

    private waitressValidator(payload: EZSPFrame, matcher: EZSPWaitressMatcher): boolean {
        const frameNames = (typeof matcher.frameId == 'string') ?
            [matcher.frameId] : FRAME_NAMES_BY_ID[matcher.frameId];
        return (
            (matcher.sequence == null || payload.sequence === matcher.sequence) &&
            frameNames.includes(payload.frameName)
        );
    }

    private async watchdogHandler(): Promise<void> {
        debug.log(`Time to watchdog ... ${this.failures}`);

        try {
            await this.execCommand('nop');
        } catch (error) {
            debug.error(`Watchdog heartbeat timeout ${error.stack}`);

            this.failures += 1;

            if (this.failures > MAX_WATCHDOG_FAILURES) {
                this.failures = 0;

                this.emit('reset');
            }
        }
    }
}
