import * as TsType from './../../tstype';
import { Ezsp } from './ezsp';
import { EzspConfigId, EmberZdoConfigurationFlags, EmberStatus, EmberNodeType, EmberNodeId } from './types';
import { EventEmitter } from "events";
import { EmberApsFrame, EmberNetworkParameters, EmberInitialSecurityState } from './types/struct';
import { Deferred, ember_security } from './utils';
import { EmberOutgoingMessageType, EmberEUI64, EmberJoinMethod, EmberDeviceUpdate, EzspValueId } from './types/named';
import { Multicast } from './multicast';
import Waitress from "../../../utils/waitress";

interface AddEndpointParameters {
    endpoint?: number,
    profileId?: number, 
    deviceId?: number,
    appFlags?: number,
    inputClusters?: number[],
    outputClusters?: number[],
};

export class Driver extends EventEmitter {
    private direct = EmberOutgoingMessageType.OUTGOING_DIRECT
    private _ezsp: Ezsp;
    private _nwkOpt: TsType.NetworkOptions;
    public networkParams: EmberNetworkParameters;
    private eui64ToNodeId = new Map<string, number>();
    private pending = new Map<number, Array<Deferred<any>>>();
    private logger: any;
    private _nwk: EmberNodeId;
    private _ieee: EmberEUI64;
    private _multicast: Multicast;
    //private waitress: Waitress<ZiGateObject, WaitressMatcher>;

    constructor(nodeInfo?:Iterable<{nodeId:number, eui64: string | EmberEUI64}>){
        super();

        if (!nodeInfo) return;

        for(let node of nodeInfo){
            let eui64 = node.eui64 instanceof EmberEUI64 ? node.eui64 : new EmberEUI64(node.eui64);
            this.eui64ToNodeId.set(eui64.toString(), node.nodeId);
        }
    }

    public async startup(port: string, serialOpt: {}, nwkOpt: TsType.NetworkOptions, logger: any) {
        this.logger = logger;
        this._nwkOpt = nwkOpt;
        let ezsp = this._ezsp = new Ezsp(this.logger);
        await ezsp.connect(port, serialOpt);
        const version = await ezsp.version();
        console.log('Got version', version);

        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_TC_REJOINS_USING_WELL_KNOWN_KEY_TIMEOUT_S, 90);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_PAN_ID_CONFLICT_REPORT_THRESHOLD, 2);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_STACK_PROFILE, 2);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_MAX_END_DEVICE_CHILDREN, 32);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_INDIRECT_TRANSMISSION_TIMEOUT, 7680);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_MULTICAST_TABLE_SIZE, 16);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_SECURITY_LEVEL, 5);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_SUPPORTED_NETWORKS, 1);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_APPLICATION_ZDO_FLAGS,
            EmberZdoConfigurationFlags.APP_RECEIVES_SUPPORTED_ZDO_REQUESTS
            | EmberZdoConfigurationFlags.APP_HANDLES_UNSUPPORTED_ZDO_REQUESTS);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_TRUST_CENTER_ADDRESS_CACHE_SIZE, 2);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_PACKET_BUFFER_COUNT, 0xff);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_END_DEVICE_POLL_TIMEOUT, 8);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_SOURCE_ROUTE_TABLE_SIZE, 16);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_ADDRESS_TABLE_SIZE, 16);

        await this.addEndpoint({outputClusters: [0x0500]});

        if (!await ezsp.networkInit()) {
            await this.form_network();
            const state = await ezsp.execCommand('networkState');
            console.log('Network state', state);
        }

        let [status, nodeType, networkParams] = await ezsp.execCommand('getNetworkParameters');
        console.assert(status == EmberStatus.SUCCESS);
        if (nodeType != EmberNodeType.COORDINATOR) {
            this.logger(`Leaving current network as ${nodeType} and forming new network`);
            const [st] = await this._ezsp.leaveNetwork();
            console.assert(st == EmberStatus.NETWORK_DOWN);
            await this.form_network();
            [status, nodeType, networkParams] = await ezsp.execCommand('getNetworkParameters');
            console.assert(status == EmberStatus.SUCCESS);
        }
        this.networkParams = networkParams;
        this.logger("Node type: %s, Network parameters: %s", nodeType, networkParams);

        await ezsp.updatePolicies({});

        const [nwk] = await ezsp.execCommand('getNodeId');
        this._nwk = nwk;
        this._ieee = await this.getLocalEUI64();
        // this.handle_join(this.nwk, this.ieee, 0);
        console.log('Network ready');
        ezsp.on('frame', this.handleFrame.bind(this))
        this.logger(`EZSP nwk=${this._nwk}, IEEE=${this._ieee}`);

        // const [status, count] = await ezsp.getConfigurationValue(EzspConfigId.CONFIG_APS_UNICAST_MESSAGE_COUNT);
        // this.logger("APS_UNICAST_MESSAGE_COUNT is set to %s", count);
        this._multicast = new Multicast(ezsp, logger);
        await this._multicast.startup([]);
    }

    private async form_network() {
        const panID = this._nwkOpt.panID;
        const extendedPanID = this._nwkOpt.extendedPanID;
        const hashed_tclk = this._ezsp.ezsp_version > 4;
        const initial_security_state:EmberInitialSecurityState = ember_security(this._nwkOpt, true, hashed_tclk);
        const [status] = await this._ezsp.setInitialSecurityState(initial_security_state);
        const parameters:EmberNetworkParameters = new EmberNetworkParameters();
        parameters.panId = panID;
        parameters.extendedPanId = extendedPanID;
        parameters.radioTxPower = 8;
        parameters.radioChannel = this._nwkOpt.channelList[0];
        parameters.joinMethod = EmberJoinMethod.USE_MAC_ASSOCIATION;
        parameters.nwkManagerId = 0;
        parameters.nwkUpdateId = 0;
        parameters.channels = 0x07FFF800; // all channels
        
        await this._ezsp.formNetwork(parameters);
        await this._ezsp.setValue(EzspValueId.VALUE_STACK_TOKEN_WRITING, 1);
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
        this.emit('deviceJoined', [nwk, ieee])
    }

    private handleReply(sender: number, apsFrame: EmberApsFrame, tsn: number, commandId: number, ...args: any[]) {
        try {
            var arr = this.pending.get(tsn);
            if (!arr) {
                console.log('Unexpected reponse TSN=', tsn, 'command=', commandId, args)
                return;
            };
            let [sendDeferred, replyDeferred] = arr;
            if (sendDeferred.isFullfilled) {
                this.pending.delete(tsn);
            }
            replyDeferred.resolve(args);
            return;
        } catch (e) {
            console.log(e);
            return;
        }
    }

    public async request(nwk: number | EmberEUI64, apsFrame: EmberApsFrame, data: Buffer, timeout = 30000): Promise<boolean> {

        let seq = apsFrame.sequence+1;
        console.assert(!this.pending.has(seq));
        let sendDeferred = new Deferred<boolean>();
        let replyDeferred = new Deferred<boolean>();
        this.pending.set(seq, [sendDeferred, replyDeferred]);

        let handle;
        let eui64: EmberEUI64;
        try {

            if (timeout > 0) {
                handle = setTimeout(() => {
                    throw new Error('Timeout while waiting for reply');
                }, timeout);
            }


            if (typeof nwk !== 'number') {
                eui64 = nwk as EmberEUI64;
                let strEui64 = eui64.toString();
                let nodeId = this.eui64ToNodeId.get(strEui64);
                if (nodeId === undefined) {
                    nodeId = await this._ezsp.execCommand('lookupNodeIdByEui64', eui64);
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
            await this._ezsp.execCommand('setExtendedTimeout', eui64, true);

            let v = await this._ezsp.sendUnicast(this.direct, nwk, apsFrame, seq, data);
            console.log('unicast message sent, waiting for reply');
            if (v[0] != 0) {
                this.pending.delete(seq);
                sendDeferred.reject(false);
                replyDeferred.reject(false);
                throw new Error(`Message send failure ${v[0]}`)
            }

            await sendDeferred.promise;
            if (timeout > 0) {
                await replyDeferred.promise;
            } else {
                this.pending.delete(seq);
            }
            return true;
        } catch (e) {
            return false;
        } finally {
            if (handle)
                clearTimeout(handle);
        }
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
        return this._ezsp.close();
    }

    public getLocalEUI64(): Promise<EmberEUI64> {
        return this._ezsp.execCommand('getEui64');
    }

    public async networkIdToEUI64(nwk: number): Promise<EmberEUI64> {
        for (let [eUI64, value] of this.eui64ToNodeId) {
            if (value === nwk) return new EmberEUI64(eUI64);
        }
        let value = await this._ezsp.execCommand('lookupEui64ByNodeId', nwk);
        if (value[0] === EmberStatus.SUCCESS) {
            let eUI64 = new EmberEUI64(value[1] as any);
            this.eui64ToNodeId.set(eUI64.toString(), nwk);
            return eUI64;
        } else {
            throw new Error('Unrecognized nodeId:' + nwk)
        }
    }

    public permitJoining(seconds:number){
        return this._ezsp.execCommand('permitJoining', seconds);
    }

    public make_zdo_frame(name: string, ...args: any[]) {
        return this._ezsp.make_zdo_frame(name, ...args);
    }

    public async addEndpoint({endpoint=1, profileId=260, deviceId=0xBEEF, appFlags=0, inputClusters=[], outputClusters=[]}: AddEndpointParameters) {
        const res = await this._ezsp.execCommand('addEndpoint',
            endpoint,
            profileId,
            deviceId,
            appFlags,
            inputClusters.length,
            outputClusters.length,
            inputClusters,
            outputClusters,
        );
        this.logger("Ezsp adding endpoint: %s", res);
    }

    // public waitFor(
    //     type: Type, subsystem: Subsystem, command: string, payload: ZpiObjectPayload = {},
    //     timeout: number = timeouts.default
    // ): {start: () => {promise: Promise<ZpiObject>; ID: number}; ID: number} {
    //     return this.waitress.waitFor({type, subsystem, command, payload}, timeout);
    // }
}