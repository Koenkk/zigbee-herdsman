/* istanbul ignore file */
import * as TsType from './../../tstype';
import {Ezsp, EZSPFrameData, EZSPZDOResponseFrameData} from './ezsp';
import {EmberStatus, EmberNodeType, uint16_t, uint8_t, uint32_t, EmberZDOCmd, EmberApsOption, EmberKeyData,
    EmberJoinDecision} from './types';
import {EventEmitter} from "events";
import {EmberApsFrame, EmberNetworkParameters, EmberInitialSecurityState,
    EmberRawFrame, EmberIeeeRawFrame, EmberAesMmoHashContext} from './types/struct';
import {ember_security} from './utils';
import {
    EmberOutgoingMessageType,
    EmberEUI64,
    EmberJoinMethod,
    EmberDeviceUpdate,
    EzspValueId,
    EzspPolicyId,
    EzspDecisionBitmask,
    EmberNetworkStatus,
    EmberKeyType
} from './types/named';
import {Multicast} from './multicast';
import {Waitress, Wait} from '../../../utils';
import Debug from "debug";
import equals from 'fast-deep-equal/es6';
import {ParamsDesc} from './commands';

const debug = {
    error: Debug('zigbee-herdsman:adapter:ezsp:erro'),
    log: Debug('zigbee-herdsman:adapter:ezsp:driv'),
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

type IeeeMfg = {
    mfgId: number,
    prefix: number[]
};

export interface EmberIncomingMessage {
    messageType: number, 
    apsFrame: EmberApsFrame, 
    lqi: number, 
    rssi: number,
    sender: number,
    bindingIndex: number,
    addressIndex: number,
    message: Buffer,
    senderEui64: EmberEUI64
}

const IEEE_PREFIX_MFG_ID: IeeeMfg[] = [
    {mfgId: 0x115F, prefix: [0x04,0xcf,0xfc]},
    {mfgId: 0x115F, prefix: [0x54,0xef,0x44]},
];
const DEFAULT_MFG_ID = 0x1049;

export class Driver extends EventEmitter {
    private direct = EmberOutgoingMessageType.OUTGOING_DIRECT;
    public ezsp: Ezsp;
    private nwkOpt: TsType.NetworkOptions;
    private greenPowerGroup: number;
    public networkParams: EmberNetworkParameters;
    public version: {
        product: number; majorrel: string; minorrel: string; maintrel: string; revision: string;
    };
    private eui64ToNodeId = new Map<string, number>();
    private eui64ToRelays = new Map<string, number>();
    public ieee: EmberEUI64;
    private multicast: Multicast;
    private waitress: Waitress<EmberFrame, EmberWaitressMatcher>;
    private transactionID = 1;
    private port: string;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    private serialOpt: Record<string, any>;

    constructor() {
        super();
        
        this.waitress = new Waitress<EmberFrame, EmberWaitressMatcher>(
            this.waitressValidator, this.waitressTimeoutFormatter);
    }
    
    private async onReset(): Promise<void> {
        let attempts = 0;
        const pauses = [10, 30, 60];
        let pause = 0;
        while (true) {
            debug.log(`Reset connection. Try ${attempts}`);
            try {
                await this.stop();
                await Wait(1000);
                await this.startup(this.port, this.serialOpt, this.nwkOpt, this.greenPowerGroup);
                break;
            } catch (e) {
                debug.error(`Reset error ${e.stack}`);
                attempts += 1;
                if (pauses.length) {
                    pause = pauses.shift();
                }
                debug.log(`Pause ${pause}sec before try ${attempts}`);
                await Wait(pause*1000);
            }
        }
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    public async startup(port: string, serialOpt: Record<string, any>, nwkOpt: TsType.NetworkOptions, 
        greenPowerGroup: number): Promise<TsType.StartResult> {
        let result: TsType.StartResult = 'resumed';
        this.nwkOpt = nwkOpt;
        this.port = port;
        this.serialOpt = serialOpt;
        this.greenPowerGroup = greenPowerGroup;
        this.transactionID = 1;
        this.ezsp = undefined;
        this.ezsp = new Ezsp();
        this.ezsp.on('reset', this.onReset.bind(this));
        this.ezsp.on('close', this.onClose.bind(this));
    
        await this.ezsp.connect(port, serialOpt);
        await this.ezsp.version();

        await this.ezsp.updateConfig();

        await this.ezsp.updatePolicies();

        //await this.ezsp.setValue(EzspValueId.VALUE_MAXIMUM_OUTGOING_TRANSFER_SIZE, 82);
        //await this.ezsp.setValue(EzspValueId.VALUE_MAXIMUM_INCOMING_TRANSFER_SIZE, 82);
        await this.ezsp.setValue(EzspValueId.VALUE_END_DEVICE_KEEP_ALIVE_SUPPORT_MODE, 3);
        await this.ezsp.setValue(EzspValueId.VALUE_CCA_THRESHOLD, 0);

        await this.ezsp.setSourceRouting();

        //const count = await ezsp.getConfigurationValue(EzspConfigId.CONFIG_APS_UNICAST_MESSAGE_COUNT);
        //debug.log("APS_UNICAST_MESSAGE_COUNT is set to %s", count);

        await this.addEndpoint({
            inputClusters: [0x0000, 0x0003, 0x0006, 0x000A, 0x0019, 0x001A, 0x0300],
            outputClusters: [0x0000, 0x0003, 0x0004, 0x0005, 0x0006, 0x0008, 0x0020,
                0x0300, 0x0400, 0x0402, 0x0405, 0x0406, 0x0500, 0x0B01, 0x0B03,
                0x0B04, 0x0702, 0x1000, 0xFC01, 0xFC02]
        });
        await this.addEndpoint({
            endpoint: 242, profileId: 0xA1E0, deviceId: 0x61,
            outputClusters: [0x0021]
        });

        // getting MFG_STRING token
        //const mfgName = await ezsp.execCommand('getMfgToken', EzspMfgTokenId.MFG_STRING);
        // getting MFG_BOARD_NAME token
        //const boardName = await ezsp.execCommand('getMfgToken', EzspMfgTokenId.MFG_BOARD_NAME);
        /* eslint-disable prefer-const */
        let verInfo = await this.ezsp.getValue(EzspValueId.VALUE_VERSION_INFO);
        let build, major, minor, patch, special;
        [build, verInfo] = uint16_t.deserialize(uint16_t, verInfo);
        [major, verInfo] = uint8_t.deserialize(uint8_t, verInfo);
        [minor, verInfo] = uint8_t.deserialize(uint8_t, verInfo);
        [patch, verInfo] = uint8_t.deserialize(uint8_t, verInfo);
        [special, verInfo] = uint8_t.deserialize(uint8_t, verInfo);
        /* eslint-enable prefer-const */
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
            const res = await this.ezsp.execCommand('networkState');
            debug.log(`Network state ${res.status}`);
            if (res.status == EmberNetworkStatus.JOINED_NETWORK) {
                debug.log(`Leaving current network and forming new network`);
                const st = await this.ezsp.leaveNetwork();
                console.assert(st == EmberStatus.NETWORK_DOWN, `leaveNetwork returned unexpected status: ${st}`);
            }
            await this.form_network();
            result = 'reset';
        }
        const state = (await this.ezsp.execCommand('networkState')).status;
        debug.log(`Network state ${state}`);

        const netParams = await this.ezsp.execCommand('getNetworkParameters');
        console.assert(netParams.status == EmberStatus.SUCCESS,
            `Command (getNetworkParameters) returned unexpected state: ${netParams.status}`);
        this.networkParams = netParams.parameters;
        debug.log("Node type: %s, Network parameters: %s", netParams.nodeType, this.networkParams);

        const nwk = (await this.ezsp.execCommand('getNodeId')).nodeId;
        const ieee = (await this.ezsp.execCommand('getEui64')).eui64;
        this.ieee = new EmberEUI64(ieee);
        debug.log('Network ready');
        this.ezsp.on('frame', this.handleFrame.bind(this));
        this.handleNodeJoined(nwk, this.ieee);
        debug.log(`EZSP nwk=${nwk}, IEEE=0x${this.ieee}`);
        const linkResult = await this.ezsp.execCommand('getKey', {keyType: EmberKeyType.TRUST_CENTER_LINK_KEY});
        debug.log(`TRUST_CENTER_LINK_KEY: ${JSON.stringify(linkResult)}`);
        const netResult = await this.ezsp.execCommand('getKey', {keyType: EmberKeyType.CURRENT_NETWORK_KEY});
        debug.log(`CURRENT_NETWORK_KEY: ${JSON.stringify(netResult)}`);
        await Wait(1000);
        await this.ezsp.execCommand('setManufacturerCode', {code: DEFAULT_MFG_ID});
        
        this.multicast = new Multicast(this);
        await this.multicast.startup([]);
        await this.multicast.subscribe(greenPowerGroup, 242);
        // await this.multicast.subscribe(1, 901);
        return result;
    }

    private async needsToBeInitialised(options: TsType.NetworkOptions): Promise<boolean> {
        let valid = true;
        valid = valid && (await this.ezsp.networkInit());
        const netParams = await this.ezsp.execCommand('getNetworkParameters');
        const networkParams = netParams.parameters;
        debug.log("Current Node type: %s, Network parameters: %s", netParams.nodeType, networkParams);
        valid = valid && (netParams.status == EmberStatus.SUCCESS);
        valid = valid && (netParams.nodeType == EmberNodeType.COORDINATOR);
        valid = valid && (options.panID == networkParams.panId);
        valid = valid && (options.channelList.includes(networkParams.radioChannel));
        valid = valid && (equals(options.extendedPanID, networkParams.extendedPanId));
        return !valid;
    }

    private async form_network(): Promise<void> {
        let status;
        status = (await this.ezsp.execCommand('clearKeyTable')).status;
        console.assert(status == EmberStatus.SUCCESS,
            `Command clearKeyTable returned unexpected state: ${status}`);
        await this.ezsp.execCommand('clearTransientLinkKeys');

        const panID = this.nwkOpt.panID;
        const extendedPanID = this.nwkOpt.extendedPanID;
        const initial_security_state: EmberInitialSecurityState = ember_security(this.nwkOpt);
        status = await this.ezsp.setInitialSecurityState(initial_security_state);
        const parameters: EmberNetworkParameters = new EmberNetworkParameters();
        parameters.panId = panID;
        parameters.extendedPanId = extendedPanID;
        parameters.radioTxPower = 5;
        parameters.radioChannel = this.nwkOpt.channelList[0];
        parameters.joinMethod = EmberJoinMethod.USE_MAC_ASSOCIATION;
        parameters.nwkManagerId = 0;
        parameters.nwkUpdateId = 0;
        parameters.channels = 0x07FFF800; // all channels

        await this.ezsp.formNetwork(parameters);
        await this.ezsp.setValue(EzspValueId.VALUE_STACK_TOKEN_WRITING, 1);
    }

    private handleFrame(frameName: string, frame: EZSPFrameData): void {
        switch (true) {
        case (frameName === 'incomingMessageHandler'): {
            const eui64 = this.eui64ToNodeId.get(frame.sender);
            const handled = this.waitress.resolve({address: frame.sender, payload: frame.message,
                frame: frame.apsFrame});
            if (!handled) {
                this.emit('incomingMessage', {
                    messageType: frame.type, 
                    apsFrame: frame.apsFrame, 
                    lqi: frame.lastHopLqi, 
                    rssi: frame.lastHopRssi,
                    sender: frame.sender,
                    bindingIndex: frame.bindingIndex,
                    addressIndex: frame.addressIndex,
                    message: frame.message,
                    senderEui64: eui64
                });
            }
            break;
        }
        case (frameName === 'trustCenterJoinHandler'): {
            if (frame.status === EmberDeviceUpdate.DEVICE_LEFT) {
                this.handleNodeLeft(frame.newNodeId, frame.newNodeEui64);
            } else {
                if (frame.status === EmberDeviceUpdate.STANDARD_SECURITY_UNSECURED_JOIN) {
                    this.cleanupTClinkKey(frame.newNodeEui64);
                }
                if (frame.policyDecision !== EmberJoinDecision.DENY_JOIN) {
                    this.handleNodeJoined(frame.newNodeId, frame.newNodeEui64);
                }
            }
            break;
        }
        case (frameName === 'incomingRouteRecordHandler'): {
            this.handleRouteRecord(frame.source, frame.longId, frame.lastHopLqi, frame.lastHopRssi, frame.relay);
            break;
        }
        case (frameName === 'incomingRouteErrorHandler'): {
            this.handleRouteError(frame.status, frame.target);
            break;
        }
        case (frameName === 'messageSentHandler'): {
            // todo
            const status = frame.status;
            if (status != 0) {
                // send failure
            } else {
                // send success
                // If there was a message to the group and this group is not known, 
                // then we will register the coordinator in this group
                // Applicable for IKEA remotes
                const msgType = frame.type;
                if (msgType == EmberOutgoingMessageType.OUTGOING_MULTICAST) {
                    const apsFrame = frame.apsFrame;
                    if (apsFrame.destinationEndpoint == 255) {
                        this.multicast.subscribe(apsFrame.groupId, 1);
                    }
                }
            }
            break;
        }
        case (frameName === 'macFilterMatchMessageHandler'): {
            const [rawFrame, data] = EmberIeeeRawFrame.deserialize(EmberIeeeRawFrame, frame.message);
            debug.log(`macFilterMatchMessageHandler frame message: ${rawFrame}`);
            this.emit('incomingMessage', {
                messageType: null, 
                apsFrame: rawFrame, 
                lqi: frame.lastHopLqi, 
                rssi: frame.lastHopRssi,
                sender: null,
                bindingIndex: null,
                addressIndex: null,
                message: data,
                senderEui64: new EmberEUI64(rawFrame.sourceAddress)
            });
            break;
        }
        case (frameName === 'stackStatusHandler'): {
            debug.log(`stackStatusHandler: ${EmberStatus.valueToName(EmberStatus, frame.status)}`);
            break;
        }
        // case (frameName === 'childJoinHandler'): {
        //     if (!frame.joining) {
        //         this.handleNodeLeft(frame.childId, frame.childEui64);
        //     } else {
        //         this.handleNodeJoined(frame.childId, frame.childEui64);
        //     }
        //     break;
        // }
        case (frameName == 'gpepIncomingMessageHandler'): {
            this.handleGPMessage(frame);
            break;
        }
        default:
            // <=== Application frame 35 (childJoinHandler) received: 00013e9c2ebd08feff9ffd9004 +1ms
            // <=== Application frame 35 (childJoinHandler)   parsed: 0,1,39998,144,253,159,255,254,8,189,46,4 +1ms
            // Unhandled frame childJoinHandler +2s
            // <=== Application frame 98 (incomingSenderEui64Handler) received: 2ebd08feff9ffd90 +2ms
            // <=== Application frame 98 (incomingSenderEui64Handler)   parsed: 144,253,159,255,254,8,189,46 +1ms
            // Unhandled frame incomingSenderEui64Handler
            // <=== Application frame 155 (zigbeeKeyEstablishmentHandler) received: 2ebd08feff9ffd9006 +2ms
            // <=== Application frame 155 (zigbeeKeyEstablishmentHandler)   parsed: 144,253,159,255,254,8,189,46,6 +2ms
            // Unhandled frame zigbeeKeyEstablishmentHandler
            debug.log(`Unhandled frame ${frameName}`);
        }
    }

    private async cleanupTClinkKey(ieee: EmberEUI64): Promise<void> {
        // Remove tc link_key for the given device.
        const index = (await this.ezsp.execCommand('findKeyTableEntry', {address: ieee, linkKey: true})).index;
        if (index != 0xFF) {
            await this.ezsp.execCommand('eraseKeyTableEntry', {index: index});
        }
    }

    private handleRouteRecord(nwk: number, ieee: EmberEUI64 | number[], lqi: number, rssi: number,
        relays: number): void {
        // todo
        debug.log(`handleRouteRecord: nwk=${nwk}, ieee=${ieee}, lqi=${lqi}, rssi=${rssi}, relays=${relays}`);
        this.setNode(nwk, ieee);
        // if (ieee && !(ieee instanceof EmberEUI64)) {
        //     ieee = new EmberEUI64(ieee);
        // }
        // this.eui64ToRelays.set(ieee.toString(), relays);
    }

    private async handleRouteError(status: EmberStatus, nwk: number): Promise<void> {
        // todo
        debug.log(`handleRouteError: nwk=${nwk}, status=${status}`);
        //this.waitress.reject({address: nwk, payload: null, frame: null}, 'Route error');
        // const ieee = await this.networkIdToEUI64(nwk);
        // this.eui64ToRelays.set(ieee.toString(), null);
    }

    private handleNodeLeft(nwk: number, ieee: EmberEUI64 | number[]): void {
        if (ieee && !(ieee instanceof EmberEUI64)) {
            ieee = new EmberEUI64(ieee);
        }
        this.eui64ToNodeId.delete(ieee.toString());
        this.emit('deviceLeft', [nwk, ieee]);
    }

    private async resetMfgId(mfgId: number): Promise<void> {
        await this.ezsp.execCommand('setManufacturerCode', {code: mfgId});
        // 60 sec for waiting
        await Wait(60000);
        await this.ezsp.execCommand('setManufacturerCode', {code: DEFAULT_MFG_ID});
    }

    public handleNodeJoined(nwk: number, ieee: EmberEUI64 | number[]): void {
        if (ieee && !(ieee instanceof EmberEUI64)) {
            ieee = new EmberEUI64(ieee);
        }
        for(const rec of IEEE_PREFIX_MFG_ID) {
            if ((Buffer.from((ieee as EmberEUI64).value)).indexOf(Buffer.from(rec.prefix)) == 0) {
                // set ManufacturerCode
                debug.log(`handleNodeJoined: change ManufacturerCode for ieee ${ieee} to ${rec.mfgId}`);
                this.resetMfgId(rec.mfgId);
                break;
            }
        }

        this.eui64ToNodeId.set(ieee.toString(), nwk);
        this.emit('deviceJoined', [nwk, ieee]);
    }

    public setNode(nwk: number, ieee: EmberEUI64 | number[]): void {
        if (ieee && !(ieee instanceof EmberEUI64)) {
            ieee = new EmberEUI64(ieee);
        }
        this.eui64ToNodeId.set(ieee.toString(), nwk);
    }

    public async request(nwk: number | EmberEUI64, apsFrame: EmberApsFrame, 
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
        data: Buffer, timeout = 30000): Promise<boolean> {
        try {
            const seq = (apsFrame.sequence + 1) & 0xFF;
            let eui64: EmberEUI64;
            if (typeof nwk !== 'number') {
                eui64 = nwk as EmberEUI64;
                const strEui64 = eui64.toString();
                let nodeId = this.eui64ToNodeId.get(strEui64);
                if (nodeId === undefined) {
                    nodeId = (await this.ezsp.execCommand('lookupNodeIdByEui64', {eui64: eui64})).nodeId;
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
            if (this.ezsp.ezspV < 8) {
                // const route = this.eui64ToRelays.get(eui64.toString());
                // if (route) {
                //     const = await this.ezsp.execCommand('setSourceRoute', {eui64});
                // // }
            }
            await this.ezsp.execCommand('setExtendedTimeout', {remoteEui64: eui64, extendedTimeout: true});
            const result = await this.ezsp.sendUnicast(this.direct, nwk, apsFrame, seq, data);
            return result.status == EmberStatus.SUCCESS;
        } catch (e) {
            debug.error(`Request error ${e}: ${e.stack}`);
            return false;
        }
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    public async mrequest(apsFrame: EmberApsFrame, data: Buffer, timeout = 30000): Promise<boolean> {
        try {
            const seq = (apsFrame.sequence + 1) & 0xFF;
            await this.ezsp.sendMulticast(apsFrame, seq, data);
            return true;
        } catch (e) {
            return false;
        }
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    public async rawrequest(rawFrame: EmberRawFrame, data: Buffer, timeout = 10000): Promise<boolean> {
        try {
            const msgData = Buffer.concat([EmberRawFrame.serialize(EmberRawFrame, rawFrame), data]);
            await this.ezsp.execCommand('sendRawMessage', {message: msgData});
            return true;
        } catch (e) {
            debug.error(`Request error ${e}: ${e.stack}`);
            return false;
        }
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    public async ieeerawrequest(rawFrame: EmberIeeeRawFrame, data: Buffer, timeout = 10000): Promise<boolean> {
        try {
            const msgData = Buffer.concat([EmberIeeeRawFrame.serialize(EmberIeeeRawFrame, rawFrame), data]);
            await this.ezsp.execCommand('sendRawMessage', {message: msgData});
            return true;
        } catch (e) {
            debug.error(`Request error ${e}: ${e.stack}`);
            return false;
        }
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    public async brequest(destination: number, apsFrame: EmberApsFrame, data: Buffer): Promise<boolean> {
        try {
            const seq = (apsFrame.sequence + 1) & 0xFF;
            await this.ezsp.sendBroadcast(destination, apsFrame, seq, data);
            return true;
        } catch (e) {
            return false;
        }
    }

    private nextTransactionID(): number {
        this.transactionID = (this.transactionID + 1) & 0xFF;
        return this.transactionID;
    }

    public makeApsFrame(clusterId: number, disableResponse: boolean): EmberApsFrame {
        const frame = new EmberApsFrame();
        frame.clusterId = clusterId;
        frame.profileId = 0;
        frame.sequence = this.nextTransactionID();
        frame.sourceEndpoint = 0;
        frame.destinationEndpoint = 0;
        frame.groupId = 0;
        frame.options = (EmberApsOption.APS_OPTION_ENABLE_ROUTE_DISCOVERY ||
            EmberApsOption.APS_OPTION_ENABLE_ADDRESS_DISCOVERY);
        if (!disableResponse) {
            frame.options ||= EmberApsOption.APS_OPTION_RETRY;
        }
        return frame;
    }

    public makeEmberRawFrame(): EmberRawFrame {
        const frame = new EmberRawFrame();
        frame.sequence = this.nextTransactionID();
        return frame;
    }

    public makeEmberIeeeRawFrame(): EmberIeeeRawFrame {
        const frame = new EmberIeeeRawFrame();
        frame.sequence = this.nextTransactionID();
        return frame;
    }

    public async zdoRequest(networkAddress: number, requestCmd: EmberZDOCmd,
        responseCmd: EmberZDOCmd, params: ParamsDesc): Promise<EZSPZDOResponseFrameData> {
        const requestName = EmberZDOCmd.valueName(EmberZDOCmd, requestCmd);
        const responseName = EmberZDOCmd.valueName(EmberZDOCmd, responseCmd);
        debug.log(`ZDO ${requestName} params: ${JSON.stringify(params)}`);
        const frame = this.makeApsFrame(requestCmd as number, false);
        const payload = this.makeZDOframe(requestCmd as number, {transId: frame.sequence, ...params});
        const waiter = this.waitFor(networkAddress, responseCmd as number, frame.sequence).start();
        const res = await this.request(networkAddress, frame, payload);
        if (!res) {
            debug.error(`zdoRequest error`);
            this.waitress.remove(waiter.ID);
            throw Error('ZdoRequest error');
        }
        const message = await waiter.promise;
        debug.log(`${responseName}  frame: ${JSON.stringify(message.payload)}`);
        const result = this.parse_frame_payload(responseCmd as number, message.payload);
        debug.log(`${responseName} parsed: ${JSON.stringify(result)}`);
        return result;
    }

    private onClose(): void {
        debug.log('Close driver');
    }

    public async stop(): Promise<void> {
        if (this.ezsp) {
            debug.log('Stop driver');
            return this.ezsp.close(true);
        }
    }

    public async networkIdToEUI64(nwk: number): Promise<EmberEUI64> {
        for (const [eUI64, value] of this.eui64ToNodeId) {
            if (value === nwk) return new EmberEUI64(eUI64);
        }
        const value = await this.ezsp.execCommand('lookupEui64ByNodeId', {nodeId: nwk});
        if (value.status === EmberStatus.SUCCESS) {
            const eUI64 = new EmberEUI64(value.eui64);
            this.eui64ToNodeId.set(eUI64.toString(), nwk);
            return eUI64;
        } else {
            throw new Error('Unrecognized nodeId:' + nwk);
        }
    }

    public async preJoining(): Promise<void> {
        const ieee = new EmberEUI64('0xFFFFFFFFFFFFFFFF');
        const linkKey = new EmberKeyData();
        linkKey.contents = Buffer.from("ZigBeeAlliance09");
        const result = await this.addTransientLinkKey(ieee, linkKey);
        if (result.status !== EmberStatus.SUCCESS) {
            throw new Error(`Add Transient Link Key for '${ieee}' failed`);
        }
        if (this.ezsp.ezspV >= 8) {
            await this.ezsp.setPolicy(EzspPolicyId.TRUST_CENTER_POLICY, 
                EzspDecisionBitmask.ALLOW_UNSECURED_REJOINS | EzspDecisionBitmask.ALLOW_JOINS);
            //| EzspDecisionBitmask.JOINS_USE_INSTALL_CODE_KEY
        }
    }

    public async permitJoining(seconds: number): Promise<EZSPFrameData> {
        return this.ezsp.execCommand('permitJoining', {duration: seconds});
    }

    public makeZDOframe(name: string|number, params: ParamsDesc): Buffer {
        return this.ezsp.makeZDOframe(name, params);
    }

    public parse_frame_payload(name: string|number, obj: Buffer): EZSPZDOResponseFrameData {
        return this.ezsp.parse_frame_payload(name, obj);
    }

    public async addEndpoint({
        endpoint = 1,
        profileId = 260,
        deviceId = 0xBEEF,
        appFlags = 0,
        inputClusters = [],
        outputClusters = []
    }: AddEndpointParameters): Promise<void> {
        const res = await this.ezsp.execCommand('addEndpoint', {
            endpoint: endpoint,
            profileId: profileId,
            deviceId: deviceId,
            appFlags: appFlags,
            inputClusterCount: inputClusters.length,
            outputClusterCount: outputClusters.length,
            inputClusterList: inputClusters,
            outputClusterList: outputClusters,
        });
        debug.log(`Ezsp adding endpoint: ${JSON.stringify(res)}`);
    }

    public waitFor(address: number, clusterId: number, sequence: number, timeout = 10000)
        : { start: () => { promise: Promise<EmberFrame>; ID: number }; ID: number } {
        return this.waitress.waitFor({address, clusterId, sequence}, timeout);
    }

    private waitressTimeoutFormatter(matcher: EmberWaitressMatcher, timeout: number): string {
        return `${JSON.stringify(matcher)} after ${timeout}ms`;
    }

    private waitressValidator(payload: EmberFrame, matcher: EmberWaitressMatcher): boolean {
        return (!matcher.address || payload.address === matcher.address) &&
            (!payload.frame || payload.frame.clusterId === matcher.clusterId) &&
            (!payload.frame || payload.payload[0] === matcher.sequence);
    }

    public setRadioPower(value: number): Promise<EZSPFrameData> {
        return this.ezsp.execCommand('setRadioPower', {power: value});
    }

    public setChannel(channel: number): Promise<EZSPFrameData> {
        return this.ezsp.execCommand('setLogicalAndRadioChannel', {radioChannel: channel});
    }
    
    public addTransientLinkKey(partner: EmberEUI64, transientKey: EmberKeyData): Promise<EZSPFrameData> {
        return this.ezsp.execCommand('addTransientLinkKey', {partner, transientKey});
    }
    
    public async addInstallCode(ieeeAddress: string, key: Buffer): Promise<void> {
        // Key need to be converted to aes hash string 
        const hc = new EmberAesMmoHashContext();
        hc.result = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        hc.length = 0;
        const hash = await this.ezsp.execCommand('aesMmoHash', {context: hc, finalize: true, data: key});
        if (hash.status == EmberStatus.SUCCESS) {
            const ieee = new EmberEUI64(ieeeAddress);
            const linkKey = new EmberKeyData();
            linkKey.contents = hash.returnContext.result;
            const result = await this.addTransientLinkKey(ieee, linkKey);
            if (result.status !== EmberStatus.SUCCESS) {
                throw new Error(`Add install code for '${ieeeAddress}' failed`);
            }
        } else {
            throw new Error(`Add install code for '${ieeeAddress}' failed`);
        }
    }

    private async handleGPMessage(frame: EZSPFrameData): Promise<void> {
        // Commissioning
        if (frame.gpdCommandId == 0xE0) {
            let data = frame.payload.subarray(5);
            /* eslint-disable */
            let st, deviceId, options, extOptions, key, mic, counter;
            [st, data] = uint8_t.deserialize(uint8_t, data);
            [deviceId, data] = uint8_t.deserialize(uint8_t, data);
            [options, data] = uint8_t.deserialize(uint8_t, data);
            [extOptions, data] = uint8_t.deserialize(uint8_t, data);
            [key, data] = EmberKeyData.deserialize(EmberKeyData, data);
            [mic, data] = uint32_t.deserialize(uint32_t, data);
            [counter, data] = uint32_t.deserialize(uint32_t, data);
            /* eslint-enable */
            const gpdMessage = {
                messageType: frame.gpdCommandId,
                apsFrame: {
                    profileId: 0xA1E0,
                    sourceEndpoint: 242,
                    clusterId: 0x0021,
                    sequence: frame.sequenceNumber,
                }, 
                lqi: frame.gpdLink,
                message: {
                    commandID: frame.gpdCommandId,
                    commandFrame: {
                        options: options,
                        securityKey: Buffer.from(key.contents),
                        deviceID: deviceId,
                        outgoingCounter: counter,
                    },
                    srcID: frame.srcId,
                },
                sender: frame.addr,
            };
            this.emit('incomingMessage', gpdMessage);
        } else {
            const gpdMessage = {
                messageType: frame.gpdCommandId,
                apsFrame: {
                    profileId: 0xA1E0,
                    sourceEndpoint: 242,
                    clusterId: 0x0021,
                    sequence: frame.sequenceNumber,
                }, 
                lqi: frame.gpdLink,
                message: {
                    commandID: frame.gpdCommandId,
                    frameCounter: frame.sequenceNumber,
                    srcID: frame.srcId,
                },
                sender: frame.addr,
            };
            this.emit('incomingMessage', gpdMessage);
        }
    }
}
