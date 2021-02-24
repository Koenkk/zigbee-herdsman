import * as t from './types';
import { SerialDriver } from './uart';
import { COMMANDS, ZDO_COMMANDS } from './commands';

import { Deferred } from './utils';
import { EmberStatus, EmberOutgoingMessageType, EzspPolicyId, EzspDecisionId, EzspDecisionBitmask, EmberConcentratorType, EzspConfigId, EmberZdoConfigurationFlags } from './types/named';
import { EventEmitter } from 'events';
import { EmberApsFrame } from './types/struct';
import { Queue, Waitress } from '../../../utils';
import Debug from "debug";

const debug = {
    error: Debug('zigbee-herdsman:adapter:ezsp:error'),
    log: Debug('zigbee-herdsman:adapter:ezsp:log'),
};


const MTOR_MIN_INTERVAL = 10;
const MTOR_MAX_INTERVAL = 90;
const MTOR_ROUTE_ERROR_THRESHOLD = 4;
const MTOR_DELIVERY_FAIL_THRESHOLD = 3;

type EZSPFrame = {
    sequence: number,
    frameId: number,
    frameName: string,
    payload: any
};

type EZSPWaitressMatcher = {
    sequence: number,
    frameId: number
};

export class Ezsp extends EventEmitter {
    ezspV = 4;
    cmdSeq = 0;  // command sequence
    COMMANDS_BY_ID = new Map<number, { name: string, inArgs: any[], outArgs: any[] }>();
    private serialDriver: SerialDriver;
    private waitress: Waitress<EZSPFrame, EZSPWaitressMatcher>;
    private queue: Queue;

    constructor() {
        super();
        for (let name in COMMANDS) {
            let details = (<any>COMMANDS)[name];
            this.COMMANDS_BY_ID.set(details[0], { name, inArgs: details[1], outArgs: details[2] });
        }
        this.queue = new Queue();
        this.waitress = new Waitress<EZSPFrame, EZSPWaitressMatcher>(
            this.waitressValidator, this.waitressTimeoutFormatter);
        
        this.serialDriver = new SerialDriver();
        this.serialDriver.on('received', this.onFrameReceived.bind(this));
    }

    public async connect(path: string, options: {}) {
        await this.serialDriver.connect(path, options);
    }

    public close(): Promise<void> {
        return this.serialDriver.close();
    }

    private onFrameReceived(data: Buffer) {
        /*Handle a received EZSP frame

        The protocol has taken care of UART specific framing etc, so we should
        just have EZSP application stuff here, with all escaping/stuffing and
        data randomization removed.
        */
        debug.log(`<=== Frame: ${data.toString('hex')}`);
        var frame_id: number, result, schema, sequence;
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
        const cmd = this.COMMANDS_BY_ID.get(frame_id);
        if (!cmd) throw new Error('Unrecognized command from FrameID' + frame_id);
        const frameName = cmd.name;
        debug.log("<=== Application frame %s (%s) received: %s", frame_id, frameName, data.toString('hex'));
        schema = cmd.outArgs;
        [result, data] = t.deserialize(data, schema);
        debug.log(`<=== Application frame ${frame_id} (${frameName})   parsed: ${result}`);
        const handled = this.waitress.resolve({frameId: frame_id, frameName: frameName, sequence: sequence, payload: result});

        if (!handled) this.emit('frame', frameName, ...result);
        
        if ((frame_id === 0)) {
            this.ezspV = result[0];
        }
    }

    async version() {
        let version = this.ezspV;
        let result = await this.command("version", version);
        if ((result[0] !== version)) {
            debug.log("Switching to eszp version %d", result[0]);
            await this.command("version", result[0]);
        }
        return result[0];
    }

    async networkInit() {
        var fut: Deferred<any>, v, st;
        fut = new Deferred();
        this.on('frame', (frameName: string, response: any) => {
            if ((frameName === "stackStatusHandler")) {
                fut.resolve(response);
            }
        })

        const [result] = await this.command("networkInit");
        debug.log('network init result', result);
        if ((result !== EmberStatus.SUCCESS)) {
            debug.log("Failure to init network:" + result);
            throw new Error(("Failure to init network:" + result));
        }
        v = await fut.promise;
        return (v === EmberStatus.NETWORK_UP);
    }

    async leaveNetwork() {
        var fut: Deferred<any>, v, st;
        fut = new Deferred();
        this.on('frame', (frameName: string, response: any) => {
            if ((frameName === "stackStatusHandler")) {
                fut.resolve(response);
            }
        })
        v = await this.command("leaveNetwork");
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
        debug.log('Set %s = %s', EzspConfigId.valueToName(EzspConfigId, configId), value);
        [ret] = await this.execCommand('setConfigurationValue', configId, value);
        console.assert(ret === EmberStatus.SUCCESS);
    }

    async getConfigurationValue(configId: number) {
        let ret, value;
        debug.log('Get %s', EzspConfigId.valueToName(EzspConfigId, configId));
        [ret, value] = await this.execCommand('getConfigurationValue', configId);
        console.assert(ret === EmberStatus.SUCCESS);
        debug.log('Got %s = %s', EzspConfigId.valueToName(EzspConfigId, configId), value);
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
        debug.log('Set %s = %s', t.EzspValueId.valueToName(t.EzspValueId, valueId), value);
        [ret] = await this.execCommand('setValue', valueId, value);
        console.assert(ret === EmberStatus.SUCCESS);
        return [ret];
    }

    async getValue(valueId: t.EzspValueId) {
        let ret, value;
        debug.log('Get %s', t.EzspValueId.valueToName(t.EzspValueId, valueId));
        [ret, value] = await this.execCommand('getValue', valueId);
        console.assert(ret === EmberStatus.SUCCESS);
        debug.log('Got %s = %s', t.EzspValueId.valueToName(t.EzspValueId, valueId), value);
        return value;
    }

    async setPolicy(policyId: EzspPolicyId, value: any) {
        let ret;
        debug.log('Set %s = %s', EzspPolicyId.valueToName(EzspPolicyId, policyId), value);
        [ret] = await this.execCommand('setPolicy', policyId, value);
        console.assert(ret === EmberStatus.SUCCESS);
        return [ret];
    }

    async updateConfig() {
        const config = [
            [EzspConfigId.CONFIG_FRAGMENT_DELAY_MS, 50],
            [EzspConfigId.CONFIG_TX_POWER_MODE, 3],
            [EzspConfigId.CONFIG_FRAGMENT_WINDOW_SIZE, 1],
            //[EzspConfigId.CONFIG_BEACON_JITTER_DURATION, 0],
            [EzspConfigId.CONFIG_NEIGHBOR_TABLE_SIZE, 16],
            [EzspConfigId.CONFIG_ROUTE_TABLE_SIZE, 16],
            [EzspConfigId.CONFIG_BINDING_TABLE_SIZE, 0],
            [EzspConfigId.CONFIG_KEY_TABLE_SIZE, 12],
            [EzspConfigId.CONFIG_ZLL_GROUP_ADDRESSES, 0],
            [EzspConfigId.CONFIG_ZLL_RSSI_THRESHOLD, 215], // -40
            [EzspConfigId.CONFIG_TRANSIENT_KEY_TIMEOUT_S, 180],
            [EzspConfigId.CONFIG_APS_UNICAST_MESSAGE_COUNT, 15],
            [EzspConfigId.CONFIG_BROADCAST_TABLE_SIZE, 15],
            [EzspConfigId.CONFIG_MAX_HOPS, 30],

            [EzspConfigId.CONFIG_INDIRECT_TRANSMISSION_TIMEOUT, 7680], // 30000
            [EzspConfigId.CONFIG_SOURCE_ROUTE_TABLE_SIZE, 16], // 61
            [EzspConfigId.CONFIG_MULTICAST_TABLE_SIZE, 16], 
            [EzspConfigId.CONFIG_ADDRESS_TABLE_SIZE, 16], // 8
            [EzspConfigId.CONFIG_TRUST_CENTER_ADDRESS_CACHE_SIZE, 2],
            [EzspConfigId.CONFIG_SUPPORTED_NETWORKS, 1],
            [EzspConfigId.CONFIG_TC_REJOINS_USING_WELL_KNOWN_KEY_TIMEOUT_S, 90],
            [EzspConfigId.CONFIG_APPLICATION_ZDO_FLAGS,
                EmberZdoConfigurationFlags.APP_RECEIVES_SUPPORTED_ZDO_REQUESTS
                | EmberZdoConfigurationFlags.APP_HANDLES_UNSUPPORTED_ZDO_REQUESTS],
            [EzspConfigId.CONFIG_SECURITY_LEVEL, 5],
            [EzspConfigId.CONFIG_END_DEVICE_POLL_TIMEOUT, 8], // 14
            [EzspConfigId.CONFIG_PAN_ID_CONFLICT_REPORT_THRESHOLD, 2],
            [EzspConfigId.CONFIG_MAX_END_DEVICE_CHILDREN, 32],
            [EzspConfigId.CONFIG_STACK_PROFILE, 2],
            [EzspConfigId.CONFIG_PACKET_BUFFER_COUNT, 255],
        ];

        for (let [confName, value] of config) {
            await this.setConfigurationValue(confName, value);
        }
    }

    async updatePolicies() {
        // Set up the policies for what the NCP should do.
        const policies = [
            [EzspPolicyId.BINDING_MODIFICATION_POLICY, EzspDecisionId.CHECK_BINDING_MODIFICATIONS_ARE_VALID_ENDPOINT_CLUSTERS],
            [EzspPolicyId.UNICAST_REPLIES_POLICY, EzspDecisionId.HOST_WILL_NOT_SUPPLY_REPLY],
            [EzspPolicyId.POLL_HANDLER_POLICY, EzspDecisionId.POLL_HANDLER_IGNORE],
            [EzspPolicyId.MESSAGE_CONTENTS_IN_CALLBACK_POLICY, EzspDecisionId.MESSAGE_TAG_ONLY_IN_CALLBACK],
            [EzspPolicyId.PACKET_VALIDATE_LIBRARY_POLICY, EzspDecisionId.PACKET_VALIDATE_LIBRARY_CHECKS_ENABLED],
            [EzspPolicyId.ZLL_POLICY, EzspDecisionId.ALLOW_JOINS],
            [EzspPolicyId.TC_REJOINS_USING_WELL_KNOWN_KEY_POLICY, EzspDecisionId.ALLOW_JOINS],

            [EzspPolicyId.APP_KEY_REQUEST_POLICY, EzspDecisionId.DENY_APP_KEY_REQUESTS],
            [EzspPolicyId.TRUST_CENTER_POLICY, EzspDecisionBitmask.IGNORE_UNSECURED_REJOINS | EzspDecisionBitmask.ALLOW_JOINS],
            [EzspPolicyId.TC_KEY_REQUEST_POLICY, EzspDecisionId.ALLOW_TC_KEY_REQUESTS],
        ];

        for (let [policy, value] of policies) {
            await this.setPolicy(policy, value);
        }
    }
   
    public makeZDOframe(name: string, ...args: any[]): Buffer {
        var c, data, frame, cmd_id;
        c = (<any>ZDO_COMMANDS)[name];
        data = t.serialize(args, c[1]);
        return data;
    }

    private makeFrame(name: string, ...args: any[]) {
        var c, data, frame, cmd_id;
        c = (<any>COMMANDS)[name];
        data = t.serialize(args, c[1]);
        frame = [(this.cmdSeq & 255)];
        if ((this.ezspV < 8)) {
            if ((this.ezspV >= 5)) {
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

    private command(name: string, ...args: any[]): Promise<Buffer> {
        debug.log(`===> Send command ${name}: (${args})`);
        return this.queue.execute<Buffer>(async (): Promise<Buffer> => {
            const data = this.makeFrame(name, ...args);
            debug.log(`===> Send data    ${name}: (${data.toString('hex')})`);
            const c = (<any>COMMANDS)[name];
            const waiter = this.waitFor(c[0], this.cmdSeq);
            this.cmdSeq = (this.cmdSeq + 1 % 256);
            this.serialDriver.sendDATA(data);
            const response = await waiter.start().promise;
            return response.payload;
        });
    }

    async formNetwork(parameters: {}) {
        var fut: Deferred<any>, v, st;
        fut = new Deferred();
        this.on('frame', (frameName: string, response: any) => {
            if ((frameName === "stackStatusHandler")) {
                fut.resolve(response);
            }
        })
        v = await this.command("formNetwork", parameters);
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
        return this.command(name, ...args);
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

    public async setSourceRouting() {
        const [res] = await this.execCommand('setConcentrator', 
            true,
            EmberConcentratorType.HIGH_RAM_CONCENTRATOR,
            MTOR_MIN_INTERVAL,
            MTOR_MAX_INTERVAL,
            MTOR_ROUTE_ERROR_THRESHOLD,
            MTOR_DELIVERY_FAIL_THRESHOLD,
            0,
        )
        debug.log("Set concentrator type: %s", res);
        if (res != EmberStatus.SUCCESS) {
            debug.log("Couldn't set concentrator type %s: %s", true, res);
        }
        await this.execCommand('setSourceRouteDiscoveryMode', 1);
    }
    
    public waitFor(frameId: number, sequence: number, timeout: number = 30000)
           : {start: () => {promise: Promise<EZSPFrame>; ID: number}; ID: number} {
        return this.waitress.waitFor({frameId, sequence}, timeout);
    }

    private waitressTimeoutFormatter(matcher: EZSPWaitressMatcher, timeout: number): string {
        return `${JSON.stringify(matcher)} after ${timeout}ms`;
    }

    private waitressValidator(payload: EZSPFrame, matcher: EZSPWaitressMatcher): boolean {
        return (payload.sequence === matcher.sequence &&
            payload.frameId === matcher.frameId);
    }
}
