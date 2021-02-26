import * as TsType from './../../tstype';
import {Ezsp} from './ezsp';
import {EmberStatus, EmberNodeType, EmberNodeId, uint16_t, uint8_t, EmberZDOCmd, EmberApsOption} from './types';
import {EventEmitter} from "events";
import {EmberApsFrame, EmberNetworkParameters, EmberInitialSecurityState} from './types/struct';
import {Deferred, ember_security} from './utils';
import {
    EmberOutgoingMessageType,
    EmberEUI64,
    EmberJoinMethod,
    EmberDeviceUpdate,
    EzspValueId,
    EzspPolicyId,
    EzspDecisionBitmask,
    EzspMfgTokenId,
    EmberNetworkStatus,
    EmberKeyType
} from './types/named';
import {Multicast} from './multicast';
import {Queue, Waitress} from '../../../utils';
import Debug from "debug";
import equals from 'fast-deep-equal/es6';

const debug = {
    error: Debug('zigbee-herdsman:adapter:driver:error'),
    log: Debug('zigbee-herdsman:adapter:driver:log'),
};

interface AddEndpointParameters {
    endpoint?: number,
    profileId?: number,
    deviceId?: number,
    appFlags?: number,
    inputClusters?: number[],
    outputClusters?: number[],
}

type EmberFrame = {
    address: number;
    payload: Buffer;
    frame: EmberApsFrame;
};

type EmberWaitressMatcher = {
    address: number,
    clusterId: number,
    sequence: number
};

export class Driver extends EventEmitter {
    private direct = EmberOutgoingMessageType.OUTGOING_DIRECT;
    public ezsp: Ezsp;
    private nwkOpt: TsType.NetworkOptions;
    public networkParams: EmberNetworkParameters;
    public version: {
        product: number; majorrel: string; minorrel: string; maintrel: string; revision: string;
    };
    private eui64ToNodeId = new Map<string, number>();
    private eui64ToRelays = new Map<string, number>();
    public ieee: EmberEUI64;
    private multicast: Multicast;
    private waitress: Waitress<EmberFrame, EmberWaitressMatcher>;
    public queue: Queue;
    private transactionID: number;

    constructor() {
        super();
        this.transactionID = 1;
        this.queue = new Queue();

        this.waitress = new Waitress<EmberFrame, EmberWaitressMatcher>(
            this.waitressValidator, this.waitressTimeoutFormatter);
    }

    public async startup(port: string, serialOpt: {}, nwkOpt: TsType.NetworkOptions) {
        this.nwkOpt = nwkOpt;
        const ezsp = this.ezsp = new Ezsp();
        await ezsp.connect(port, serialOpt);
        const version = await ezsp.version();

        await ezsp.updateConfig();

        await ezsp.updatePolicies();

        await this.ezsp.setValue(EzspValueId.VALUE_MAXIMUM_OUTGOING_TRANSFER_SIZE, 82);
        await this.ezsp.setValue(EzspValueId.VALUE_MAXIMUM_INCOMING_TRANSFER_SIZE, 82);
        await this.ezsp.setValue(EzspValueId.VALUE_END_DEVICE_KEEP_ALIVE_SUPPORT_MODE, 3);

        await ezsp.setSourceRouting();

        //const count = await ezsp.getConfigurationValue(EzspConfigId.CONFIG_APS_UNICAST_MESSAGE_COUNT);
        //debug.log("APS_UNICAST_MESSAGE_COUNT is set to %s", count);

        //await this.addEndpoint({outputClusters: [0x0500]});
        await this.addEndpoint({
            inputClusters: [0x0000, 0x0003, 0x0006, 0x000A, 0x0019, 0x001A, 0x0300],
            outputClusters: [0x0000, 0x0003, 0x0004, 0x0005, 0x0006, 0x0008, 0x0020,
                0x0300, 0x0400, 0x0402, 0x0405, 0x0406, 0x0500, 0x0B01, 0x0B03,
                0x0B04, 0x0702, 0x1000, 0xFC01, 0xFC02]
        });
        await this.addEndpoint({
            endpoint: 242, profileId: 0xA10E, deviceId: 0x61,
            outputClusters: [0x0021]
        });

        // getting MFG_STRING token
        const mfgName = await ezsp.execCommand('getMfgToken', EzspMfgTokenId.MFG_STRING);
        // getting MFG_BOARD_NAME token
        const boardName = await ezsp.execCommand('getMfgToken', EzspMfgTokenId.MFG_BOARD_NAME);
        let verInfo = await ezsp.getValue(EzspValueId.VALUE_VERSION_INFO);
        let build, major, minor, patch, special;
        [build, verInfo] = uint16_t.deserialize(uint16_t, verInfo);
        [major, verInfo] = uint8_t.deserialize(uint8_t, verInfo);
        [minor, verInfo] = uint8_t.deserialize(uint8_t, verInfo);
        [patch, verInfo] = uint8_t.deserialize(uint8_t, verInfo);
        [special, verInfo] = uint8_t.deserialize(uint8_t, verInfo);
        const vers = `${major}.${minor}.${patch}.${special} build ${build}`;
        debug.log(`EmberZNet version: ${vers}`);
        this.version = {
            product: this.ezsp.ezspV,
            majorrel: `${major}`,
            minorrel: `${minor}`,
            maintrel: `${patch} `,
            revision: vers
        };

        if (await this.needsToBeInitialised(nwkOpt)) {
            const currentState = await ezsp.execCommand('networkState');
            debug.log('Network state', currentState);
            if (currentState == EmberNetworkStatus.JOINED_NETWORK) {
                debug.log(`Leaving current network and forming new network`);
                const st = await this.ezsp.leaveNetwork();
                console.assert(st == EmberStatus.NETWORK_DOWN);
            }
            await this.form_network();
        }
        const state = await ezsp.execCommand('networkState');
        debug.log('Network state', state);

        const [status, nodeType, networkParams] = await ezsp.execCommand('getNetworkParameters');
        console.assert(status == EmberStatus.SUCCESS);
        this.networkParams = networkParams;
        debug.log("Node type: %s, Network parameters: %s", nodeType, networkParams);

        const [nwk] = await ezsp.execCommand('getNodeId');
        const [ieee] = await this.ezsp.execCommand('getEui64');
        this.ieee = new EmberEUI64(ieee);
        debug.log('Network ready');
        ezsp.on('frame', this.handleFrame.bind(this));
        this.handleNodeJoined(nwk, this.ieee, {}, {}, {});
        debug.log(`EZSP nwk=${nwk}, IEEE=0x${this.ieee}`);

        this.multicast = new Multicast(this);
        await this.multicast.startup([]);
    }

    private async needsToBeInitialised(options: TsType.NetworkOptions): Promise<boolean> {
        let valid = true;
        valid = valid && (await this.ezsp.networkInit());
        const [status, nodeType, networkParams] = await this.ezsp.execCommand('getNetworkParameters');
        debug.log("Current Node type: %s, Network parameters: %s", nodeType, networkParams);
        valid = valid && (status == EmberStatus.SUCCESS);
        valid = valid && (nodeType == EmberNodeType.COORDINATOR);
        valid = valid && (options.panID == networkParams.panId);
        valid = valid && (options.channelList.includes(networkParams.radioChannel));
        valid = valid && (equals(options.extendedPanID, networkParams.extendedPanId));
        return !valid;
    }

    private async form_network() {
        let status;
        [status] = await this.ezsp.execCommand('clearKeyTable');
        console.assert(status == EmberStatus.SUCCESS);

        const panID = this.nwkOpt.panID;
        const extendedPanID = this.nwkOpt.extendedPanID;
        const initial_security_state: EmberInitialSecurityState = ember_security(this.nwkOpt);
        [status] = await this.ezsp.setInitialSecurityState(initial_security_state);
        const parameters: EmberNetworkParameters = new EmberNetworkParameters();
        parameters.panId = panID;
        parameters.extendedPanId = extendedPanID;
        parameters.radioTxPower = 20;
        parameters.radioChannel = this.nwkOpt.channelList[0];
        parameters.joinMethod = EmberJoinMethod.USE_MAC_ASSOCIATION;
        parameters.nwkManagerId = 0;
        parameters.nwkUpdateId = 0;
        parameters.channels = 0x07FFF800; // all channels

        await this.ezsp.formNetwork(parameters);
        await this.ezsp.setValue(EzspValueId.VALUE_STACK_TOKEN_WRITING, 1);

        await this.ezsp.execCommand('getKey', EmberKeyType.TRUST_CENTER_LINK_KEY);
        await this.ezsp.execCommand('getKey', EmberKeyType.CURRENT_NETWORK_KEY);
    }

    private handleFrame(frameName: string, ...args: any[]) {
        switch (true) {
        case (frameName === 'incomingMessageHandler'): {
            const [messageType, apsFrame, lqi, rssi, sender, bindingIndex, addressIndex, message] = args;
            const eui64 = this.eui64ToNodeId.get(sender);

            const handled = this.waitress.resolve({address: sender, payload: message, frame: apsFrame});
            if (!handled) {
                this.emit('incomingMessage', {
                    messageType, apsFrame, lqi, rssi, sender, bindingIndex, addressIndex, message,
                    senderEui64: eui64
                });
            }
            break;
        }
        case (frameName === 'trustCenterJoinHandler'): {
            if (args[2] === EmberDeviceUpdate.DEVICE_LEFT) {
                this.handleNodeLeft.apply(this, args);
            } else {
                this.handleNodeJoined.apply(this, args);
            }
            break;
        }
        case (frameName === 'incomingRouteRecordHandler'): {
            const [nwk, ieee, lqi, rssi, relays] = args;
            this.handleRouteRecord(nwk, ieee, lqi, rssi, relays);
            break;
        }
        case (frameName === 'incomingRouteErrorHandler'): {
            const [status, nwk] = args;
            this.handleRouteError(status, nwk);
            break;
        }
        case (frameName === 'messageSentHandler'): {
            // todo
            const status = args[4];
            if (status != 0) {
                // send failure
            } else {
                // send success
            }
            break;
        }
        default:
            debug.log(`Unhandled frame ${frameName}`);
        }
    }

    private handleRouteRecord(nwk: number, ieee: EmberEUI64 | number[], lqi: number, rssi: number, relays: any) {
        debug.log(`handleRouteRecord: nwk=${nwk}, ieee=${ieee}, lqi=${lqi}, rssi=${rssi}, relays=${relays}`);
        // todo
    }

    private handleRouteError(status: EmberStatus, nwk: number) {
        debug.log(`handleRouteError: number=${status}, nwk=${nwk}`);
        // todo
    }

    private handleNodeLeft(nwk: number, ieee: EmberEUI64 | number[], ...args: any[]) {
        if (ieee && !(ieee instanceof EmberEUI64)) {
            ieee = new EmberEUI64(ieee);
        }
        this.eui64ToNodeId.delete(ieee.toString());
        this.emit('deviceLeft', [nwk, ieee]);
    }

    private handleNodeJoined(nwk: number, ieee: EmberEUI64 | number[], deviceUpdate: any, joinDec: any, parentNwk: any) {
        if (ieee && !(ieee instanceof EmberEUI64)) {
            ieee = new EmberEUI64(ieee);
        }
        this.eui64ToNodeId.set(ieee.toString(), nwk);
        this.emit('deviceJoined', [nwk, ieee]);
    }

    public async request(nwk: number | EmberEUI64, apsFrame: EmberApsFrame, data: Buffer, timeout = 30000): Promise<boolean> {
        try {
            const seq = apsFrame.sequence + 1;
            let eui64: EmberEUI64;
            if (typeof nwk !== 'number') {
                eui64 = nwk as EmberEUI64;
                const strEui64 = eui64.toString();
                let nodeId = this.eui64ToNodeId.get(strEui64);
                if (nodeId === undefined) {
                    nodeId = await this.ezsp.execCommand('lookupNodeIdByEui64', eui64);
                    if (nodeId && nodeId !== 0xFFFF) {
                        this.eui64ToNodeId.set(strEui64, nodeId);
                    } else {
                        throw new Error('Unknown EUI64:' + strEui64);
                    }
                }
                nwk = nodeId;
            } else {
                eui64 = await this.networkIdToEUI64(nwk);
            }
            await this.ezsp.execCommand('setExtendedTimeout', eui64, true);

            const v = await this.ezsp.sendUnicast(this.direct, nwk, apsFrame, seq, data);
            return true;
        } catch (e) {
            return false;
        }
    }

    private nextTransactionID(): number {
        this.transactionID = (this.transactionID + 1) & 0xFF;
        return this.transactionID;
    }

    public makeApsFrame(clusterId: number) {
        const frame = new EmberApsFrame();
        frame.clusterId = clusterId;
        frame.profileId = 0;
        frame.sequence = this.nextTransactionID();
        frame.sourceEndpoint = 0;
        frame.destinationEndpoint = 0;
        frame.groupId = 0;
        //frame.options = EmberApsOption.APS_OPTION_ENABLE_ROUTE_DISCOVERY|EmberApsOption.APS_OPTION_RETRY;
        frame.options = EmberApsOption.APS_OPTION_NONE;
        return frame;
    }

    public async zdoRequest(networkAddress: number, requestCmd: EmberZDOCmd, responseCmd: EmberZDOCmd, ...args: any[]): Promise<any> {
        const requestName = EmberZDOCmd.valueName(EmberZDOCmd, requestCmd);
        const responseName = EmberZDOCmd.valueName(EmberZDOCmd, responseCmd);
        debug.log(`${requestName} params: ${[...args]}`);
        const frame = this.makeApsFrame(requestCmd as number);
        const payload = this.makeZDOframe(requestName, frame.sequence, ...args);
        debug.log(`${requestName}  frame: ${payload}`);
        const response = this.waitFor(networkAddress, responseCmd as number, frame.sequence);
        await this.request(networkAddress, frame, payload);
        const message = await response.start().promise;
        debug.log(`${responseName}  frame: ${JSON.stringify(message.payload)}`);
        const result = this.parse_frame_payload(responseName, message.payload);
        debug.log(`${responseName} parsed: ${JSON.stringify(result)}`);
        return result;
    }

    public stop() {
        return this.ezsp.close();
    }

    public getLocalEUI64(): Promise<EmberEUI64> {
        return this.ezsp.execCommand('getEui64');
    }

    public async networkIdToEUI64(nwk: number): Promise<EmberEUI64> {
        for (const [eUI64, value] of this.eui64ToNodeId) {
            if (value === nwk) return new EmberEUI64(eUI64);
        }
        const value = await this.ezsp.execCommand('lookupEui64ByNodeId', nwk);
        if (value[0] === EmberStatus.SUCCESS) {
            const eUI64 = new EmberEUI64(value[1] as any);
            this.eui64ToNodeId.set(eUI64.toString(), nwk);
            return eUI64;
        } else {
            throw new Error('Unrecognized nodeId:' + nwk);
        }
    }

    public async permitJoining(seconds: number) {
        await this.ezsp.setPolicy(EzspPolicyId.TRUST_CENTER_POLICY, EzspDecisionBitmask.IGNORE_UNSECURED_REJOINS | EzspDecisionBitmask.ALLOW_JOINS);
        return await this.ezsp.execCommand('permitJoining', seconds);
    }

    public makeZDOframe(name: string, ...args: any[]) {
        return this.ezsp.makeZDOframe(name, ...args);
    }

    public parse_frame_payload(name: string, obj: Buffer) {
        return this.ezsp.parse_frame_payload(name, obj);
    }

    public async addEndpoint({
        endpoint = 1,
        profileId = 260,
        deviceId = 0xBEEF,
        appFlags = 0,
        inputClusters = [],
        outputClusters = []
    }: AddEndpointParameters) {
        const res = await this.ezsp.execCommand('addEndpoint',
            endpoint,
            profileId,
            deviceId,
            appFlags,
            inputClusters.length,
            outputClusters.length,
            inputClusters,
            outputClusters,
        );
        debug.log("Ezsp adding endpoint: %s", res);
    }

    public waitFor(address: number, clusterId: number, sequence: number, timeout = 30000)
        : { start: () => { promise: Promise<EmberFrame>; ID: number }; ID: number } {
        return this.waitress.waitFor({address, clusterId, sequence}, timeout);
    }

    private waitressTimeoutFormatter(matcher: EmberWaitressMatcher, timeout: number): string {
        return `${JSON.stringify(matcher)} after ${timeout}ms`;
    }

    private waitressValidator(payload: EmberFrame, matcher: EmberWaitressMatcher): boolean {
        return (!matcher.address || payload.address === matcher.address) &&
            payload.frame.clusterId === matcher.clusterId &&
            payload.payload[0] === matcher.sequence;
    }
}
