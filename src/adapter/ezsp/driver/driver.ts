import * as TsType from './../../tstype';
import { Ezsp } from './ezsp';
import { EzspConfigId, EmberZdoConfigurationFlags, EmberStatus, EmberNodeType, EmberNodeId, uint16_t, uint8_t } from './types';
import { EventEmitter } from "events";
import { EmberApsFrame, EmberNetworkParameters, EmberInitialSecurityState } from './types/struct';
import { EmberObject } from './types/emberObj';
import { Deferred, ember_security } from './utils';
import { EmberOutgoingMessageType, EmberEUI64, EmberJoinMethod, EmberDeviceUpdate, EzspValueId, EzspPolicyId, EzspDecisionBitmask, EzspMfgTokenId, EmberNetworkStatus, EmberKeyType } from './types/named';
import { Multicast } from './multicast';
import {Queue, Waitress, Wait} from '../../../utils';
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
};

type EmberObjectPayload = any;

type EmberWaitressMatcher = {
    address: number,
    clusterId: number
};


export class Driver extends EventEmitter {
    private direct = EmberOutgoingMessageType.OUTGOING_DIRECT
    public ezsp: Ezsp;
    private _nwkOpt: TsType.NetworkOptions;
    public networkParams: EmberNetworkParameters;
    private eui64ToNodeId = new Map<string, number>();
    private pending = new Map<number, Array<Deferred<any>>>();
    private _nwk: EmberNodeId;
    private _ieee: EmberEUI64;
    private _multicast: Multicast;
    private waitress: Waitress<EmberObject, EmberWaitressMatcher>;
    public queue: Queue;

    constructor(){
        super();

        // if (!nodeInfo) return;

        // for(let node of nodeInfo){
        //     let eui64 = node.eui64 instanceof EmberEUI64 ? node.eui64 : new EmberEUI64(node.eui64);
        //     this.eui64ToNodeId.set(eui64.toString(), node.nodeId);
        // }
        this.queue = new Queue();

        this.waitress = new Waitress<EmberObject, EmberWaitressMatcher>(
            this.waitressValidator, this.waitressTimeoutFormatter);
    }

    public async startup(port: string, serialOpt: {}, nwkOpt: TsType.NetworkOptions) {
        this._nwkOpt = nwkOpt;
        let ezsp = this.ezsp = new Ezsp();
        await ezsp.connect(port, serialOpt);
        const version = await ezsp.version();
        console.log('Got version', version);

        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_INDIRECT_TRANSMISSION_TIMEOUT, 7680);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_SOURCE_ROUTE_TABLE_SIZE, 16);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_MULTICAST_TABLE_SIZE, 16);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_ADDRESS_TABLE_SIZE, 16);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_TRUST_CENTER_ADDRESS_CACHE_SIZE, 2);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_SUPPORTED_NETWORKS, 1);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_TC_REJOINS_USING_WELL_KNOWN_KEY_TIMEOUT_S, 90);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_APPLICATION_ZDO_FLAGS,
            EmberZdoConfigurationFlags.APP_RECEIVES_SUPPORTED_ZDO_REQUESTS
            | EmberZdoConfigurationFlags.APP_HANDLES_UNSUPPORTED_ZDO_REQUESTS);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_SECURITY_LEVEL, 5);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_END_DEVICE_POLL_TIMEOUT, 8);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_PAN_ID_CONFLICT_REPORT_THRESHOLD, 2);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_MAX_END_DEVICE_CHILDREN, 32);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_STACK_PROFILE, 2);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_PACKET_BUFFER_COUNT, 0xff);

        await ezsp.setSourceRouting();

        const count = await ezsp.getConfigurationValue(EzspConfigId.CONFIG_APS_UNICAST_MESSAGE_COUNT);
        debug.log("APS_UNICAST_MESSAGE_COUNT is set to %s", count);
        
        await this.addEndpoint({outputClusters: [0x0500]});

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

        if (await this.needsToBeInitialised(nwkOpt)) {
            const currentState = await ezsp.execCommand('networkState');
            console.log('Network state', currentState);
            if (currentState == EmberNetworkStatus.JOINED_NETWORK) {
                debug.log(`Leaving current network and forming new network`);
                const st = await this.ezsp.leaveNetwork();
                console.assert(st == EmberStatus.NETWORK_DOWN);
            }
            await this.form_network();
            const state = await ezsp.execCommand('networkState');
            debug.log('Network state', state);
        }

        let [status, nodeType, networkParams] = await ezsp.execCommand('getNetworkParameters');
        console.assert(status == EmberStatus.SUCCESS);
        this.networkParams = networkParams;
        debug.log("Node type: %s, Network parameters: %s", nodeType, networkParams);

        await ezsp.updatePolicies();

        const [nwk] = await ezsp.execCommand('getNodeId');
        this._nwk = nwk;
        const [ieee] = await this.ezsp.execCommand('getEui64');
        this._ieee = ieee;
        debug.log('Network ready');
        ezsp.on('frame', this.handleFrame.bind(this))
        this.handleNodeJoined(nwk, this._ieee, {}, {}, {});
        debug.log(`EZSP nwk=${this._nwk}, IEEE=${this._ieee}`);

        this._multicast = new Multicast(this);
        await this._multicast.startup([]);
    }

    
    private async needsToBeInitialised(options: TsType.NetworkOptions): Promise<boolean> {
        let valid = true;
        valid = valid && (await this.ezsp.networkInit());
        let [status, nodeType, networkParams] = await this.ezsp.execCommand('getNetworkParameters');
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

        const panID = this._nwkOpt.panID;
        const extendedPanID = this._nwkOpt.extendedPanID;
        const hashed_tclk = this.ezsp.ezsp_version > 4;
        const initial_security_state:EmberInitialSecurityState = ember_security(this._nwkOpt, true, hashed_tclk);
        [status] = await this.ezsp.setInitialSecurityState(initial_security_state);
        const parameters:EmberNetworkParameters = new EmberNetworkParameters();
        parameters.panId = panID;
        parameters.extendedPanId = extendedPanID;
        parameters.radioTxPower = 20;
        parameters.radioChannel = this._nwkOpt.channelList[0];
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

        if (frameName === 'incomingMessageHandler') {
            let [messageType, apsFrame, lqi, rssi, sender, bindingIndex, addressIndex, message] = args;
            let eui64;
            for(let [k,v] of this.eui64ToNodeId){
                if (v === sender){
                    eui64 = k;
                    break;
                }
            }

            this.waitress.resolve({address: sender, payload: message, frame: apsFrame} as EmberObject);

            super.emit('incomingMessage', {
                messageType, apsFrame, lqi, rssi, sender, bindingIndex, addressIndex, message,
                senderEui64: eui64
            });

            let isReply = false;
            let tsn = -1;
            let commandId = 0;
            if (isReply) {
                this.handleReply(sender, apsFrame, tsn, commandId, args);
            }
        } else if (frameName === 'messageSentHandler') {
            if (args[4] != 0) {
                this.handleFrameFailure.apply(this, args);
            } else {
                this.handleFrameSent.apply(this, args);
            }
        } else if (frameName === 'trustCenterJoinHandler') {
            if (args[2] === EmberDeviceUpdate.DEVICE_LEFT) {
                this.handleNodeLeft.apply(this, args);
            } else {
                this.handleNodeJoined.apply(this, args);
            }
        }

    }

    private handleNodeLeft(nwk: number, ieee: EmberEUI64 | number[], ...args: any[]) {
        if (ieee && !(ieee instanceof EmberEUI64)) {
            ieee = new EmberEUI64(ieee);
        }
        this.eui64ToNodeId.delete(ieee.toString());
        this.emit('deviceLeft', [nwk, ieee])
    }

    private handleNodeJoined(nwk: number, ieee: EmberEUI64 | number[], deviceUpdate: any, joinDec: any, parentNwk: any) {
        if (ieee && !(ieee instanceof EmberEUI64)) {
            ieee = new EmberEUI64(ieee);
        }
        this.eui64ToNodeId.set(ieee.toString(), nwk);
        this.emit('deviceJoined', [nwk, ieee]);
    }

    private handleReply(sender: number, apsFrame: EmberApsFrame, tsn: number, commandId: number, ...args: any[]) {
        try {
            var arr = this.pending.get(tsn);
            if (!arr) {
                debug.log('Unexpected reponse TSN=', tsn, 'command=', commandId, args)
                return;
            };
            let [sendDeferred, replyDeferred] = arr;
            if (sendDeferred.isFullfilled) {
                this.pending.delete(tsn);
            }
            replyDeferred.resolve(args);
            return;
        } catch (e) {
            debug.log(e);
            return;
        }
    }

    public async request(nwk: number | EmberEUI64, apsFrame: EmberApsFrame, data: Buffer, timeout = 30000): Promise<boolean> {
        try {
            let seq = apsFrame.sequence+1;
            let eui64: EmberEUI64;
            if (typeof nwk !== 'number') {
                eui64 = nwk as EmberEUI64;
                let strEui64 = eui64.toString();
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

            let v = await this.ezsp.sendUnicast(this.direct, nwk, apsFrame, seq, data);
            debug.log('unicast message sent, waiting for reply');
            return true;
        } catch (e) {
            return false;
        }
        // let seq = apsFrame.sequence+1;

        // console.assert(!this.pending.has(seq));

        
        // let sendDeferred = new Deferred<boolean>();
        // let replyDeferred = new Deferred<boolean>();
        // this.pending.set(seq, [sendDeferred, replyDeferred]);

        // let handle;
        // let eui64: EmberEUI64;
        // try {

        //     if (timeout > 0) {
        //         handle = setTimeout(() => {
        //             throw new Error('Timeout while waiting for reply');
        //         }, timeout);
        //     }


        //     if (typeof nwk !== 'number') {
        //         eui64 = nwk as EmberEUI64;
        //         let strEui64 = eui64.toString();
        //         let nodeId = this.eui64ToNodeId.get(strEui64);
        //         if (nodeId === undefined) {
        //             nodeId = await this.ezsp.execCommand('lookupNodeIdByEui64', eui64);
        //             if (nodeId && nodeId !== 0xFFFF) {
        //                 this.eui64ToNodeId.set(strEui64, nodeId);
        //             } else {
        //                 throw new Error('Unknown EUI64:' + strEui64);
        //             }
        //         }
        //         nwk = nodeId;
        //     } else {
        //         eui64 = await this.networkIdToEUI64(nwk);
        //     }
        //     //await this.ezsp.execCommand('setExtendedTimeout', eui64, true);

        //     let v = await this.ezsp.sendUnicast(this.direct, nwk, apsFrame, seq, data);
        //     console.log('unicast message sent, waiting for reply');
        //     if (v[0] != 0) {
        //         this.pending.delete(seq);
        //         sendDeferred.reject(false);
        //         replyDeferred.reject(false);
        //         throw new Error(`Message send failure ${v[0]}`)
        //     }

        //     await sendDeferred.promise;
        //     if (timeout > 0) {
        //         await replyDeferred.promise;
        //     } else {
        //         this.pending.delete(seq);
        //     }
        //     return true;
        // } catch (e) {
        //     return false;
        // } finally {
        //     if (handle)
        //         clearTimeout(handle);
        // }
    }

    private handleFrameFailure(messageType: number, destination: number, apsFrame: EmberApsFrame, messageTag: number, status: number, message: Buffer) {
        try {
            var arr = this.pending.get(messageTag);
            if (!arr) {
                console.log("Unexpected message send failure");
                return;
            }
            this.pending.delete(messageTag);
            let [sendDeferred,] = arr;
            let e = new Error('Message send failure:' + status);
            console.log(e);
            sendDeferred.reject(e);
            //replyDeferred.reject(e);
        } catch (e) {
            console.log(e);
        }
    }

    private handleFrameSent(messageType: number, destination: number, apsFrame: EmberApsFrame, messageTag: number, status: number, message: Buffer) {
        try {
            var arr = this.pending.get(messageTag);
            if (!arr) {
                console.log("Unexpected message send notification");
                return;
            }
            let [sendDeferred, replyDeferred] = arr;
            if (replyDeferred.isFullfilled) {
                this.pending.delete(messageTag);
            }
            sendDeferred.resolve(true);
        } catch (e) {
            console.log(e);
        }
    }

    public stop() {
        return this.ezsp.close();
    }

    public getLocalEUI64(): Promise<EmberEUI64> {
        return this.ezsp.execCommand('getEui64');
    }

    public async networkIdToEUI64(nwk: number): Promise<EmberEUI64> {
        for (let [eUI64, value] of this.eui64ToNodeId) {
            if (value === nwk) return new EmberEUI64(eUI64);
        }
        let value = await this.ezsp.execCommand('lookupEui64ByNodeId', nwk);
        if (value[0] === EmberStatus.SUCCESS) {
            let eUI64 = new EmberEUI64(value[1] as any);
            this.eui64ToNodeId.set(eUI64.toString(), nwk);
            return eUI64;
        } else {
            throw new Error('Unrecognized nodeId:' + nwk)
        }
    }

    public async permitJoining(seconds:number){
        const [status] = await this.ezsp.execCommand('setPolicy', EzspPolicyId.TRUST_CENTER_POLICY, EzspDecisionBitmask.IGNORE_UNSECURED_REJOINS | EzspDecisionBitmask.ALLOW_JOINS);
        console.assert(status == EmberStatus.SUCCESS);
        return await this.ezsp.execCommand('permitJoining', seconds);
    }

    public make_zdo_frame(name: string, ...args: any[]) {
        return this.ezsp.make_zdo_frame(name, ...args);
    }

    public parse_frame_payload(name: string, obj: Buffer) {
        return this.ezsp.parse_frame_payload(name, obj);
    }

    public async addEndpoint({endpoint=1, profileId=260, deviceId=0xBEEF, appFlags=0, inputClusters=[], outputClusters=[]}: AddEndpointParameters) {
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

    public waitFor(address: number, clusterId: number, timeout: number = 30000)
           : {start: () => {promise: Promise<EmberObject>; ID: number}; ID: number} {
        return this.waitress.waitFor({address, clusterId}, timeout);
    }

    private waitressTimeoutFormatter(matcher: EmberWaitressMatcher, timeout: number): string {
        return `${matcher} after ${timeout}ms`;
    }

    private waitressValidator(payload: EmberObject, matcher: EmberWaitressMatcher): boolean {
        const transactionSequenceNumber = payload.frame.sequence;
        return (!matcher.address || payload.address === matcher.address) &&
            payload.frame.clusterId === matcher.clusterId;
    }
}