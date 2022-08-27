/* istanbul ignore file */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as t from './types';
import {SerialDriver} from './uart';
import {FRAMES, FRAME_NAME_BY_ID, EZSPFrameDesc, ParamsDesc, ZDOREQUESTS, ZDOREQUEST_NAME_BY_ID, 
    ZDORESPONSES, ZDORESPONSE_NAME_BY_ID} from './commands';

import {
    EmberStatus,
    EmberOutgoingMessageType,
    EzspPolicyId,
    EzspDecisionId,
    EzspDecisionBitmask,
    EmberConcentratorType,
    EzspConfigId,
    EmberZdoConfigurationFlags
} from './types/named';
import {EventEmitter} from 'events';
import {EmberApsFrame, EmberNetworkParameters} from './types/struct';
import {Queue, Waitress} from '../../../utils';
import Debug from "debug";


const debug = {
    error: Debug('zigbee-herdsman:adapter:ezsp:erro'),
    log: Debug('zigbee-herdsman:adapter:ezsp:ezsp'),
};


const MTOR_MIN_INTERVAL = 10;
const MTOR_MAX_INTERVAL = 90;
const MTOR_ROUTE_ERROR_THRESHOLD = 4;
const MTOR_DELIVERY_FAIL_THRESHOLD = 3;
const MAX_WATCHDOG_FAILURES = 4;
//const RESET_ATTEMPT_BACKOFF_TIME = 5;
const WATCHDOG_WAKE_PERIOD = 10;  // in sec
//const EZSP_COUNTER_CLEAR_INTERVAL = 180;  // Clear counters every n * WATCHDOG_WAKE_PERIOD
const EZSP_DEFAULT_RADIUS = 0;
const EZSP_MULTICAST_NON_MEMBER_RADIUS = 3;


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

    static getFrame(key: string|number): EZSPFrameDesc {
        const name = (typeof key == 'string') ? key : FRAME_NAME_BY_ID[key];
        const frameDesc = FRAMES[name];
        if (!frameDesc) throw new Error(`Unrecognized frame from FrameID ${key}`);
        return frameDesc;
    }

    constructor(key: string|number, isRequest: boolean, params: ParamsDesc | Buffer) {
        if (typeof key == 'string') {
            this._cls_ = key;
            this._id_ = FRAMES[this._cls_].ID;
        } else {
            this._id_ = key;
            this._cls_ = FRAME_NAME_BY_ID[key];
        }
        
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
        if (!frameDesc) throw new Error(`Unrecognized ZDOFrame from FrameID ${key}`);
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
        if (!frameDesc) throw new Error(`Unrecognized ZDOFrame from FrameID ${key}`);
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
    ezspV = 4;
    cmdSeq = 0;  // command sequence
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    // COMMANDS_BY_ID = new Map<number, { name: string, inArgs: any[], outArgs: any[] }>();
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
    }

    public async connect(path: string, options: Record<string, number|boolean>): Promise<void> {
        await this.serialDriver.connect(path, options);
        this.watchdogTimer = setInterval(
            this.watchdogHandler.bind(this),
            WATCHDOG_WAKE_PERIOD*1000
        );
    }

    public async close(): Promise<void> {
        debug.log('Stop ezsp');
        clearTimeout(this.watchdogTimer);
        await this.serialDriver.close();
    }

    private getFrameDesc(name: string): EZSPFrameDesc {
        return (name in FRAMES) ? FRAMES[name] : null;
    }

    private onFrameReceived(data: Buffer): void {
        /*Handle a received EZSP frame

        The protocol has taken care of UART specific framing etc, so we should
        just have EZSP application stuff here, with all escaping/stuffing and
        data randomization removed.
        */
        debug.log(`<== Frame: ${data.toString('hex')}`);
        let frame_id: number, sequence;
        if ((this.ezspV < 8)) {
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
        const frm = new EZSPFrameData(frame_id, false, data);
        debug.log(`<== 0x${frame_id.toString(16)}: ${JSON.stringify(frm)}`);
        const handled = this.waitress.resolve({
            frameId: frame_id,
            frameName: frm.name,
            sequence: sequence,
            payload: frm
        });

        if (!handled) this.emit('frame', frm.name, frm);

        if ((frame_id === 0)) {
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
        const waiter = this.waitFor("stackStatusHandler", null).start();

        const result = await this.execCommand("networkInit");
        debug.log('network init result: ', JSON.stringify(result));
        if ((result.status !== EmberStatus.SUCCESS)) {
            this.waitress.remove(waiter.ID);
            debug.log("Failure to init network");
            return false;
        }

        const response = await waiter.promise;
        return response.payload.status == EmberStatus.NETWORK_UP;
    }

    async leaveNetwork(): Promise<number> {
        const waiter = this.waitFor("stackStatusHandler", null).start();

        const result = await this.execCommand("leaveNetwork");
        debug.log('network init result', JSON.stringify(result));
        if ((result.status !== EmberStatus.SUCCESS)) {
            this.waitress.remove(waiter.ID);
            debug.log("Failure to leave network");
            throw new Error(("Failure to leave network: " + JSON.stringify(result)));
        }

        const response = await waiter.promise;
        if ((response.payload.status !== EmberStatus.NETWORK_DOWN)) {
            debug.log("Wrong network status: " + JSON.stringify(response.payload));
            throw new Error(("Wrong network status: " + JSON.stringify(response.payload)));
        }
        return response.payload.status;
    }

    async setConfigurationValue(configId: number, value: number): Promise<void> {
        debug.log('Set %s = %s', EzspConfigId.valueToName(EzspConfigId, configId), value);
        const ret = await this.execCommand('setConfigurationValue', {configId: configId, value: value});
        console.assert(ret.status === EmberStatus.SUCCESS,
            `Command (setConfigurationValue) returned unexpected state: ${ret}`);
    }

    async getConfigurationValue(configId: number): Promise<number> {
        debug.log('Get %s', EzspConfigId.valueToName(EzspConfigId, configId));
        const ret = await this.execCommand('getConfigurationValue', {configId: configId});
        console.assert(ret.status === EmberStatus.SUCCESS,
            `Command (getConfigurationValue) returned unexpected state: ${ret}`);
        debug.log('Got %s = %s', EzspConfigId.valueToName(EzspConfigId, configId), ret.value.toString());
        return ret.value;
    }

    async getMulticastTableEntry(index: number): Promise<t.EmberMulticastTableEntry> {
        const ret = await this.execCommand('getMulticastTableEntry', {index: index});
        return ret.value;
    }

    async setMulticastTableEntry(index: number, entry: t.EmberMulticastTableEntry): Promise<EmberStatus> {
        const ret = await this.execCommand('setMulticastTableEntry', {index: index, value: entry});
        console.assert(ret.status === EmberStatus.SUCCESS,
            `Command (setMulticastTableEntry) returned unexpected state: ${ret}`);
        return ret.status;
    }

    async setInitialSecurityState(entry: t.EmberInitialSecurityState): Promise<EmberStatus>{
        const ret = await this.execCommand('setInitialSecurityState', {state: entry});
        console.assert(ret.success === EmberStatus.SUCCESS,
            `Command (setInitialSecurityState) returned unexpected state: ${ret}`);
        return ret.success;
    }

    async getCurrentSecurityState(): Promise<EZSPFrameData> {
        const ret = await this.execCommand('getCurrentSecurityState');
        console.assert(ret.status === EmberStatus.SUCCESS,
            `Command (getCurrentSecurityState) returned unexpected state: ${ret}`);
        return ret;
    }

    async setValue(valueId: t.EzspValueId, value: number): Promise<EZSPFrameData> {
        debug.log('Set %s = %s', t.EzspValueId.valueToName(t.EzspValueId, valueId), value);
        const ret = await this.execCommand('setValue', {valueId, value});
        console.assert(ret.status === EmberStatus.SUCCESS,
            `Command (setValue) returned unexpected state: ${ret}`);

        return ret;
    }

    async getValue(valueId: t.EzspValueId): Promise<Buffer> {
        debug.log('Get %s', t.EzspValueId.valueToName(t.EzspValueId, valueId));
        const ret = await this.execCommand('getValue', {valueId});
        console.assert(ret.status === EmberStatus.SUCCESS,
            `Command (getValue) returned unexpected state: ${ret}`);
        debug.log('Got %s = %s', t.EzspValueId.valueToName(t.EzspValueId, valueId), ret.value);
        return ret.value;
    }

    async setPolicy(policyId: EzspPolicyId, value: number): Promise<EZSPFrameData> {
        debug.log('Set %s = %s', EzspPolicyId.valueToName(EzspPolicyId, policyId), value);
        const ret = await this.execCommand('setPolicy', {policyId: policyId, decisionId: value});
        console.assert(ret.status === EmberStatus.SUCCESS,
            `Command (setPolicy) returned unexpected state: ${ret}`);
        return ret;
    }

    async updateConfig(): Promise<void> {
        const config = [
            [EzspConfigId.CONFIG_FRAGMENT_DELAY_MS, 50],
            [EzspConfigId.CONFIG_TX_POWER_MODE, 3],
            [EzspConfigId.CONFIG_FRAGMENT_WINDOW_SIZE, 1],
            [EzspConfigId.CONFIG_NEIGHBOR_TABLE_SIZE, 16],
            [EzspConfigId.CONFIG_ROUTE_TABLE_SIZE, 16],
            [EzspConfigId.CONFIG_BINDING_TABLE_SIZE, 32],
            [EzspConfigId.CONFIG_KEY_TABLE_SIZE, 12],
            [EzspConfigId.CONFIG_ZLL_GROUP_ADDRESSES, 0],
            [EzspConfigId.CONFIG_ZLL_RSSI_THRESHOLD, 0],
            [EzspConfigId.CONFIG_APS_UNICAST_MESSAGE_COUNT, 255],
            [EzspConfigId.CONFIG_BROADCAST_TABLE_SIZE, 43],
            [EzspConfigId.CONFIG_MAX_HOPS, 30],
            [EzspConfigId.CONFIG_INDIRECT_TRANSMISSION_TIMEOUT, 30000],
            [EzspConfigId.CONFIG_SOURCE_ROUTE_TABLE_SIZE, 255],
            [EzspConfigId.CONFIG_ADDRESS_TABLE_SIZE, 250],
            [EzspConfigId.CONFIG_TRUST_CENTER_ADDRESS_CACHE_SIZE, 4],
            [EzspConfigId.CONFIG_SUPPORTED_NETWORKS, 1],
            [EzspConfigId.CONFIG_SECURITY_LEVEL, 5],
            [EzspConfigId.CONFIG_END_DEVICE_POLL_TIMEOUT, 14],
            [EzspConfigId.CONFIG_MAX_END_DEVICE_CHILDREN, 32],
            [EzspConfigId.CONFIG_STACK_PROFILE, 2],
            [EzspConfigId.CONFIG_PACKET_BUFFER_COUNT, 255],
        ];

        for (const [confName, value] of config) {
            await this.setConfigurationValue(confName, value);
        }
    }

    async updatePolicies(): Promise<void> {
        // Set up the policies for what the NCP should do.
        const policies = [
            [EzspPolicyId.BINDING_MODIFICATION_POLICY,
                EzspDecisionId.DISALLOW_BINDING_MODIFICATION],
            [EzspPolicyId.UNICAST_REPLIES_POLICY, EzspDecisionId.HOST_WILL_NOT_SUPPLY_REPLY],
            [EzspPolicyId.POLL_HANDLER_POLICY, EzspDecisionId.POLL_HANDLER_IGNORE],
            [EzspPolicyId.MESSAGE_CONTENTS_IN_CALLBACK_POLICY,
                EzspDecisionId.MESSAGE_TAG_ONLY_IN_CALLBACK],
            [EzspPolicyId.PACKET_VALIDATE_LIBRARY_POLICY,
                EzspDecisionId.PACKET_VALIDATE_LIBRARY_CHECKS_DISABLED],
            [EzspPolicyId.ZLL_POLICY, EzspDecisionId.ALLOW_JOINS],
            [EzspPolicyId.TC_REJOINS_USING_WELL_KNOWN_KEY_POLICY, EzspDecisionId.ALLOW_JOINS],
            [EzspPolicyId.APP_KEY_REQUEST_POLICY, EzspDecisionId.ALLOW_APP_KEY_REQUESTS],
            [EzspPolicyId.TRUST_CENTER_POLICY, EzspDecisionBitmask.ALLOW_UNSECURED_REJOINS
                | EzspDecisionBitmask.ALLOW_JOINS],
            [EzspPolicyId.TC_KEY_REQUEST_POLICY, EzspDecisionId.GENERATE_NEW_TC_LINK_KEY],
        ];

        for (const [policy, value] of policies) {
            await this.setPolicy(policy, value);
        }
    }

    public makeZDOframe(name: string|number, params: ParamsDesc): Buffer {
        const frmData = new EZSPZDORequestFrameData(name, true, params);
        return frmData.serialize();
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
        return this.queue.execute<EZSPFrameData>(async (): Promise<EZSPFrameData> => {
            const data = this.makeFrame(name, params, this.cmdSeq);
            const waiter = this.waitFor(name, this.cmdSeq);
            this.cmdSeq = (this.cmdSeq + 1) & 255;
            return this.serialDriver.sendDATA(data).then(async ()=>{
                const response = await waiter.start().promise;
                return response.payload;
            });
        });
    }

    async formNetwork(params: EmberNetworkParameters): Promise<number> {
        const waiter = this.waitFor("stackStatusHandler", null).start();
        const v = await this.execCommand("formNetwork", {parameters: params});
        if ((v.status !== EmberStatus.SUCCESS)) {
            this.waitress.remove(waiter.ID);
            debug.error("Failure forming network: " + JSON.stringify(v));
            throw new Error(("Failure forming network: " + JSON.stringify(v)));
        }
        const response = await waiter.promise;
        if ((response.payload.status !== EmberStatus.NETWORK_UP)) {
            debug.error("Wrong network status: " + JSON.stringify(response.payload));
            throw new Error(("Wrong network status: " + JSON.stringify(response.payload)));
        }
        return response.payload.status;
    }

    public parse_frame_payload(name: string|number, data: Buffer): EZSPZDOResponseFrameData {
        const frame = new EZSPZDOResponseFrameData(name, data);
        return frame;
    }

    public sendUnicast(direct: EmberOutgoingMessageType, nwk: number, apsFrame:
            EmberApsFrame, seq: number, data: Buffer): Promise<EZSPFrameData> {
        return this.execCommand('sendUnicast', {
            type: direct,
            indexOrDestination: nwk,
            apsFrame: apsFrame,
            messageTag: seq,
            message: data
        });
    }

    public sendMulticast(apsFrame: EmberApsFrame, seq: number, data: Buffer): Promise<EZSPFrameData> {
        return this.execCommand('sendMulticast', {
            apsFrame: apsFrame,
            hops: EZSP_DEFAULT_RADIUS,
            nonmemberRadius: EZSP_MULTICAST_NON_MEMBER_RADIUS,
            messageTag: seq,
            message: data
        });
    }

    public async setSourceRouting(): Promise<void> {
        const res = await this.execCommand('setConcentrator', {
            on: true,
            concentratorType: EmberConcentratorType.HIGH_RAM_CONCENTRATOR,
            minTime: MTOR_MIN_INTERVAL,
            maxTime: MTOR_MAX_INTERVAL,
            routeErrorThreshold: MTOR_ROUTE_ERROR_THRESHOLD,
            deliveryFailureThreshold: MTOR_DELIVERY_FAIL_THRESHOLD,
            maxHops: 0,
        });
        debug.log("Set concentrator type: %s", JSON.stringify(res));
        if (res.status != EmberStatus.SUCCESS) {
            debug.log("Couldn't set concentrator type %s: %s", true, JSON.stringify(res));
        }
        // await this.execCommand('setSourceRouteDiscoveryMode', 1);
    }

    public waitFor(frameId: string|number, sequence: number | null, timeout = 10000)
        : { start: () => { promise: Promise<EZSPFrame>; ID: number }; ID: number } {
        return this.waitress.waitFor({frameId, sequence}, timeout);
    }

    private waitressTimeoutFormatter(matcher: EZSPWaitressMatcher, timeout: number): string {
        return `${JSON.stringify(matcher)} after ${timeout}ms`;
    }

    private waitressValidator(payload: EZSPFrame, matcher: EZSPWaitressMatcher): boolean {
        const frameName = (typeof matcher.frameId == 'string') ? matcher.frameId : FRAME_NAME_BY_ID[matcher.frameId];
        return (
            (matcher.sequence == null || payload.sequence === matcher.sequence) &&
            payload.frameName === frameName
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
