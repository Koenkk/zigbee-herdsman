import * as TsType from './../../tstype';
import { Ezsp } from './ezsp';
import { EzspConfigId, EmberZdoConfigurationFlags } from './types';
import { EventEmitter } from "events";
import { EmberApsFrame, EmberNetworkParameters } from './types/struct';
import { Deferred } from './utils';
import { EmberOutgoingMessageType, EmberEUI64, EmberJoinMethod, EmberDeviceUpdate, EzspValueId } from './types/named';
import { Multicast } from './multicast';

export class Driver extends EventEmitter {
    private direct = EmberOutgoingMessageType.OUTGOING_DIRECT
    private _ezsp: Ezsp;
    private _nwkOpt: TsType.NetworkOptions;
    private eui64ToNodeId = new Map<string, number>();
    private pending = new Map<number, Array<Deferred<any>>>();
    private logger: any;
    private _multicast: Multicast;

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

        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_STACK_PROFILE, 2);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_SECURITY_LEVEL, 5);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_SUPPORTED_NETWORKS, 1);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_APPLICATION_ZDO_FLAGS,
            EmberZdoConfigurationFlags.APP_RECEIVES_SUPPORTED_ZDO_REQUESTS
            | EmberZdoConfigurationFlags.APP_HANDLES_UNSUPPORTED_ZDO_REQUESTS);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_TRUST_CENTER_ADDRESS_CACHE_SIZE, 2);
        await ezsp.setConfigurationValue(EzspConfigId.CONFIG_PACKET_BUFFER_COUNT, 0xff);

        if (await ezsp.networkInit()) {
            console.log('Network ready');
            ezsp.on('frame', this.handleFrame.bind(this))
        } else {
            await this.form_network();
            const state = await ezsp.execCommand('networkState');
            console.log('Network state', state);
        }
        const [status, count] = await ezsp.getConfigurationValue(EzspConfigId.CONFIG_APS_UNICAST_MESSAGE_COUNT);
        this.logger("APS_UNICAST_MESSAGE_COUNT is set to %s", count);
        this._multicast = new Multicast(ezsp, logger);
        await this._multicast.startup([]);
    }

    private async form_network() {
        const panID = this._nwkOpt.panID;
        const extendedPanID = this._nwkOpt.extendedPanID;
        const hashed_tclk = this._ezsp.ezsp_version > 4;
        // const initial_security_state = bellows.zigbee.util.zha_security(
        //     nwk, controller=True, hashed_tclk=hashed_tclk
        // )
        // const [status] = await this._ezsp.setInitialSecurityState(initial_security_state);
        const parameters:EmberNetworkParameters = new EmberNetworkParameters();
        parameters.panId = panID;
        parameters.extendedPanId = extendedPanID;
        parameters.radioTxPower = 8;
        parameters.radioChannel = 15;
        parameters.joinMethod = EmberJoinMethod.USE_MAC_ASSOCIATION;
        parameters.nwkManagerId = 0;
        parameters.nwkUpdateId = 0;
        parameters.channels = 0x07FFF800;

        await this._ezsp.formNetwork(parameters);
        await this._ezsp.setValue(
            EzspValueId.VALUE_STACK_TOKEN_WRITING, 1
        );
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

        let seq = apsFrame.sequence;
        console.assert(!this.pending.has(seq));
        let sendDeferred = new Deferred<boolean>();
        let replyDeferred = new Deferred<boolean>();
        this.pending.set(seq, [sendDeferred, replyDeferred]);

        let handle;
        try {

            if (timeout > 0) {
                handle = setTimeout(() => {
                    throw new Error('Timeout while waiting for reply');
                }, timeout);
            }


            if (typeof nwk !== 'number') {
                let eui64 = nwk as EmberEUI64;
                let strEui64 = eui64.toString();
                let nodeId = this.eui64ToNodeId.get(strEui64);
                if (nodeId === undefined) {
                    nodeId = await this._ezsp.execCommand('lookupNodeIdByEui64', eui64).then(arr => arr[0]);
                    if (nodeId && nodeId !== 0xFFFF) {
                        this.eui64ToNodeId.set(strEui64, nodeId);
                    } else {
                        throw new Error('Unknown EUI64:' + strEui64);
                    }
                }
                nwk = nodeId;
            }

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
        return this._ezsp.execCommand('getEui64')
            .then(ret => new EmberEUI64(ret[0] as any));
    }

    public async networkIdToEUI64(nwk: number): Promise<EmberEUI64> {
        for (let [eUI64, value] of this.eui64ToNodeId) {
            if (value === nwk) return new EmberEUI64(eUI64);
        }
        let value = await this._ezsp.execCommand('lookupEui64ByNodeId', nwk);
        if (value[0] === 0) {
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

    // public async getNetworkParameters() : Promise<{nodeType: number, networkParams: EmberNetworkParameters}> {
    //     let [status, nodeType, networkParams] = await this._ezsp.execCommand('getNetworkParameters');
    //     // kirov 0x93 NOT_JOINED
    //     //if (status != 0 && status != 0x93)
    //     if (status != 0)
    //         throw new Error('Unable to obtain network parameters');
    //     return {nodeType, networkParams};
    // }
}