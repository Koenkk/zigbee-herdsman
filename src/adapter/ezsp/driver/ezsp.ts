/* istanbul ignore file */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as t from './types';
import {SerialDriver} from './uart';
import {COMMANDS, ZDO_COMMANDS} from './commands';

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
import {EmberApsFrame} from './types/struct';
import {Queue, Waitress} from '../../../utils';
import Debug from "debug";


const debug = {
    error: Debug('zigbee-herdsman:adapter:ezsp:error'),
    log: Debug('zigbee-herdsman:adapter:ezsp:log'),
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
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    payload: any
};

type EZSPWaitressMatcher = {
    sequence: number | null,
    frameId: number
};

export class Ezsp extends EventEmitter {
    ezspV = 4;
    cmdSeq = 0;  // command sequence
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    COMMANDS_BY_ID = new Map<number, { name: string, inArgs: any[], outArgs: any[] }>();
    private serialDriver: SerialDriver;
    private waitress: Waitress<EZSPFrame, EZSPWaitressMatcher>;
    private queue: Queue;
    private watchdogTimer: NodeJS.Timeout;
    private failures = 0;

    constructor() {
        super();
        for (const name in COMMANDS) {
            const details = COMMANDS[name];
            this.COMMANDS_BY_ID.set(details[0], {name, inArgs: details[1], outArgs: details[2]});
        }
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

    private onFrameReceived(data: Buffer): void {
        /*Handle a received EZSP frame

        The protocol has taken care of UART specific framing etc, so we should
        just have EZSP application stuff here, with all escaping/stuffing and
        data randomization removed.
        */
        debug.log(`<=== Frame: ${data.toString('hex')}`);
        let frame_id: number, result, sequence;
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
        const schema = cmd.outArgs;
        [result, data] = t.deserialize(data, schema);
        debug.log(`<=== Application frame ${frame_id} (${frameName})   parsed: ${result}`);
        const handled = this.waitress.resolve({
            frameId: frame_id,
            frameName: frameName,
            sequence: sequence,
            payload: result
        });

        if (!handled) this.emit('frame', frameName, ...result);

        if ((frame_id === 0)) {
            this.ezspV = result[0];
        }
    }

    async version(): Promise<number> {
        const version = this.ezspV;
        const result = await this.command("version", version);
        if ((result[0] !== version)) {
            debug.log("Switching to eszp version %d", result[0]);
            await this.command("version", result[0]);
        }
        return result[0];
    }

    async networkInit(): Promise<boolean> {
        const waiter = this.waitFor(COMMANDS["stackStatusHandler"][0], null).start();

        const [result] = await this.command("networkInit");
        debug.log('network init result', result);
        if ((result !== EmberStatus.SUCCESS)) {
            this.waitress.remove(waiter.ID);
            debug.log("Failure to init network:" + result);
            return false;
        }

        const response = await waiter.promise;
        return response.payload[0] == EmberStatus.NETWORK_UP;
    }

    async leaveNetwork(): Promise<number> {
        const waiter = this.waitFor(COMMANDS["stackStatusHandler"][0], null).start();

        const [result] = await this.command("leaveNetwork");
        debug.log('network init result', result);
        if ((result !== EmberStatus.SUCCESS)) {
            this.waitress.remove(waiter.ID);
            debug.log("Failure to leave network:" + result);
            throw new Error(("Failure to leave network:" + result));
        }

        const response = await waiter.promise;
        if ((response.payload[0] !== EmberStatus.NETWORK_DOWN)) {
            debug.log("Wrong network status:" + response.payload);
            throw new Error(("Wrong network status:" + response.payload));
        }
        return response.payload[0];
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    async setConfigurationValue(configId: number, value: any): Promise<void> {
        debug.log('Set %s = %s', EzspConfigId.valueToName(EzspConfigId, configId), value);
        const [ret] = await this.execCommand('setConfigurationValue', configId, value);
        console.assert(ret === EmberStatus.SUCCESS,
            `Command (setConfigurationValue) returned unexpected state: ${ret}`);
    }

    async getConfigurationValue(configId: number): Promise<number> {
        debug.log('Get %s', EzspConfigId.valueToName(EzspConfigId, configId));
        const [ret, value] = await this.execCommand('getConfigurationValue', configId);
        console.assert(ret === EmberStatus.SUCCESS,
            `Command (getConfigurationValue) returned unexpected state: ${ret}`);
        debug.log('Got %s = %s', EzspConfigId.valueToName(EzspConfigId, configId), value);
        return value;
    }

    async getMulticastTableEntry(index: number): Promise<t.EmberMulticastTableEntry> {
        const [value] = await this.execCommand('getMulticastTableEntry', index);
        //console.assert(ret === EmberStatus.SUCCESS);
        return value;
    }

    async setMulticastTableEntry(index: number, entry: t.EmberMulticastTableEntry): Promise<number[]> {
        const [ret] = await this.execCommand('setMulticastTableEntry', index, entry);
        console.assert(ret === EmberStatus.SUCCESS,
            `Command (setMulticastTableEntry) returned unexpected state: ${ret}`);
        return [ret];
    }

    async setInitialSecurityState(entry: t.EmberInitialSecurityState): Promise<number[]>{
        const [ret] = await this.execCommand('setInitialSecurityState', entry);
        console.assert(ret === EmberStatus.SUCCESS,
            `Command (setInitialSecurityState) returned unexpected state: ${ret}`);
        return [ret];
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    async getCurrentSecurityState(): Promise<any[]> {
        const [ret, res] = await this.execCommand('getCurrentSecurityState');
        console.assert(ret === EmberStatus.SUCCESS,
            `Command (getCurrentSecurityState) returned unexpected state: ${ret}`);
        return [ret, res];
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    async setValue(valueId: t.EzspValueId, value: any): Promise<number[]> {
        debug.log('Set %s = %s', t.EzspValueId.valueToName(t.EzspValueId, valueId), value);
        const [ret] = await this.execCommand('setValue', valueId, value);
        console.assert(ret === EmberStatus.SUCCESS,
            `Command (setValue) returned unexpected state: ${ret}`);

        return [ret];
    }

    async getValue(valueId: t.EzspValueId): Promise<Buffer> {
        debug.log('Get %s', t.EzspValueId.valueToName(t.EzspValueId, valueId));
        const [ret, value] = await this.execCommand('getValue', valueId);
        console.assert(ret === EmberStatus.SUCCESS,
            `Command (getValue) returned unexpected state: ${ret}`);
        debug.log('Got %s = %s', t.EzspValueId.valueToName(t.EzspValueId, valueId), value);
        return value;
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    async setPolicy(policyId: EzspPolicyId, value: any): Promise<number[]> {
        debug.log('Set %s = %s', EzspPolicyId.valueToName(EzspPolicyId, policyId), value);
        const [ret] = await this.execCommand('setPolicy', policyId, value);
        console.assert(ret === EmberStatus.SUCCESS,
            `Command (setPolicy) returned unexpected state: ${ret}`);
        return [ret];
    }

    async updateConfig(): Promise<void> {
        const config = [
            [EzspConfigId.CONFIG_FRAGMENT_DELAY_MS, 50],
            [EzspConfigId.CONFIG_TX_POWER_MODE, 3],
            [EzspConfigId.CONFIG_FRAGMENT_WINDOW_SIZE, 1],
            //[EzspConfigId.CONFIG_BEACON_JITTER_DURATION, 0],
            [EzspConfigId.CONFIG_NEIGHBOR_TABLE_SIZE, 16],
            [EzspConfigId.CONFIG_ROUTE_TABLE_SIZE, 16],
            [EzspConfigId.CONFIG_BINDING_TABLE_SIZE, 32],
            [EzspConfigId.CONFIG_KEY_TABLE_SIZE, 12],
            [EzspConfigId.CONFIG_ZLL_GROUP_ADDRESSES, 0],
            [EzspConfigId.CONFIG_ZLL_RSSI_THRESHOLD, 215], // -40
            [EzspConfigId.CONFIG_TRANSIENT_KEY_TIMEOUT_S, 300],
            //[EzspConfigId.CONFIG_APS_UNICAST_MESSAGE_COUNT, 255],
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

        for (const [confName, value] of config) {
            await this.setConfigurationValue(confName, value);
        }
    }

    async updatePolicies(): Promise<void> {
        // Set up the policies for what the NCP should do.
        const policies = [
            [EzspPolicyId.BINDING_MODIFICATION_POLICY,
                EzspDecisionId.CHECK_BINDING_MODIFICATIONS_ARE_VALID_ENDPOINT_CLUSTERS],
            [EzspPolicyId.UNICAST_REPLIES_POLICY, EzspDecisionId.HOST_WILL_NOT_SUPPLY_REPLY],
            [EzspPolicyId.POLL_HANDLER_POLICY, EzspDecisionId.POLL_HANDLER_IGNORE],
            [EzspPolicyId.MESSAGE_CONTENTS_IN_CALLBACK_POLICY,
                EzspDecisionId.MESSAGE_TAG_ONLY_IN_CALLBACK],
            [EzspPolicyId.PACKET_VALIDATE_LIBRARY_POLICY,
                EzspDecisionId.PACKET_VALIDATE_LIBRARY_CHECKS_DISABLED],
            [EzspPolicyId.ZLL_POLICY, EzspDecisionId.ALLOW_JOINS],
            [EzspPolicyId.TC_REJOINS_USING_WELL_KNOWN_KEY_POLICY, EzspDecisionId.ALLOW_JOINS],

            [EzspPolicyId.APP_KEY_REQUEST_POLICY, EzspDecisionId.DENY_APP_KEY_REQUESTS],
            [EzspPolicyId.TRUST_CENTER_POLICY, EzspDecisionBitmask.ALLOW_UNSECURED_REJOINS
                | EzspDecisionBitmask.ALLOW_JOINS],
            [EzspPolicyId.TC_KEY_REQUEST_POLICY, EzspDecisionId.ALLOW_TC_KEY_REQUESTS],
        ];

        for (const [policy, value] of policies) {
            await this.setPolicy(policy, value);
        }
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    public makeZDOframe(name: string, ...args: any[]): Buffer {
        const c = ZDO_COMMANDS[name];
        const data = t.serialize(args, c[1]);
        return data;
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    private makeFrame(name: string, ...args: any[]): Buffer {
        const c = COMMANDS[name];
        const data = t.serialize(args, c[1]);
        const frame = [(this.cmdSeq & 255)];
        if ((this.ezspV < 8)) {
            if ((this.ezspV >= 5)) {
                frame.push(0x00, 0xFF, 0x00, c[0]);
            } else {
                frame.push(0x00, c[0]);
            }
        } else {
            const cmd_id = t.serialize([c[0]], [t.uint16_t]);
            frame.push(0x00, 0x01, ...cmd_id);
        }
        return Buffer.concat([Buffer.from(frame), data]);
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    private command(name: string, ...args: any[]): Promise<Buffer> {
        debug.log(`===> Send command ${name}: (${args})`);
        return this.queue.execute<Buffer>(async (): Promise<Buffer> => {
            const data = this.makeFrame(name, ...args);
            debug.log(`===> Send data    ${name}: (${data.toString('hex')})`);
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
            const c = COMMANDS[name];
            const waiter = this.waitFor(c[0], this.cmdSeq).start();
            this.cmdSeq = (this.cmdSeq + 1) & 255;
            this.serialDriver.sendDATA(data);
            const response = await waiter.promise;
            return response.payload;
        });
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    async formNetwork(...args: any[]): Promise<number> {
        const waiter = this.waitFor(COMMANDS["stackStatusHandler"][0], null).start();
        const v = await this.command("formNetwork", ...args);
        if ((v[0] !== EmberStatus.SUCCESS)) {
            this.waitress.remove(waiter.ID);
            debug.error("Failure forming network:" + v);
            throw new Error(("Failure forming network:" + v));
        }
        const response = await waiter.promise;
        if ((response.payload[0] !== EmberStatus.NETWORK_UP)) {
            debug.error("Wrong network status:" + response.payload);
            throw new Error(("Wrong network status:" + response.payload));
        }
        return response.payload[0];
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    execCommand(name: string, ...args: any[]): any {
        if (Object.keys(COMMANDS).indexOf(name) < 0) {
            throw new Error('Unknown command: ' + name);
        }
        return this.command(name, ...args);
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    public parse_frame_payload(name: string, data: Buffer): any[] {
        if (Object.keys(ZDO_COMMANDS).indexOf(name) < 0) {
            throw new Error('Unknown ZDO command: ' + name);
        }
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
        const c = ZDO_COMMANDS[name];
        const result = t.deserialize(data, c[1])[0];
        return result;
    }

    /* eslint-disable @typescript-eslint/no-explicit-any*/
    public sendUnicast(direct: EmberOutgoingMessageType, nwk: number, apsFrame:
            EmberApsFrame, seq: number, data: Buffer): any {
        return this.execCommand('sendUnicast', direct, nwk, apsFrame, seq, data);
    }
    /* eslint-enable @typescript-eslint/no-explicit-any*/

    /* eslint-disable @typescript-eslint/no-explicit-any*/
    public sendMulticast(apsFrame: EmberApsFrame, seq: number, data: Buffer): any {
        return this.execCommand('sendMulticast', apsFrame, EZSP_DEFAULT_RADIUS,
            EZSP_MULTICAST_NON_MEMBER_RADIUS, seq, data);
    }
    /* eslint-enable @typescript-eslint/no-explicit-any*/

    public async setSourceRouting(): Promise<void> {
        const [res] = await this.execCommand('setConcentrator',
            true,
            EmberConcentratorType.HIGH_RAM_CONCENTRATOR,
            MTOR_MIN_INTERVAL,
            MTOR_MAX_INTERVAL,
            MTOR_ROUTE_ERROR_THRESHOLD,
            MTOR_DELIVERY_FAIL_THRESHOLD,
            0,
        );
        debug.log("Set concentrator type: %s", res);
        if (res != EmberStatus.SUCCESS) {
            debug.log("Couldn't set concentrator type %s: %s", true, res);
        }
        // await this.execCommand('setSourceRouteDiscoveryMode', 1);
    }

    public waitFor(frameId: number, sequence: number | null, timeout = 10000)
        : { start: () => { promise: Promise<EZSPFrame>; ID: number }; ID: number } {
        return this.waitress.waitFor({frameId, sequence}, timeout);
    }

    private waitressTimeoutFormatter(matcher: EZSPWaitressMatcher, timeout: number): string {
        return `${JSON.stringify(matcher)} after ${timeout}ms`;
    }

    private waitressValidator(payload: EZSPFrame, matcher: EZSPWaitressMatcher): boolean {
        return (
            (matcher.sequence == null || payload.sequence === matcher.sequence) &&
            payload.frameId === matcher.frameId
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
