/* v8 ignore start */

import Device from "../../../controller/model/device";
import type * as Models from "../../../models";
import {Waitress, wait} from "../../../utils";
import {logger} from "../../../utils/logger";
import * as ZSpec from "../../../zspec";
import type {BroadcastAddress} from "../../../zspec/enums";
import * as Zcl from "../../../zspec/zcl";
import * as Zdo from "../../../zspec/zdo";
import type * as ZdoTypes from "../../../zspec/zdo/definition/tstypes";
import Adapter from "../../adapter";
import type * as Events from "../../events";
import type {AdapterOptions, CoordinatorVersion, NetworkOptions, NetworkParameters, SerialPortOptions, StartResult} from "../../tstype";
import PARAM, {type ApsDataRequest, type GpDataInd, type ReceivedDataResponse, type WaitForDataRequest} from "../driver/constants";
import Driver from "../driver/driver";
import processFrame, {frameParserEvents} from "../driver/frameParser";

const NS = "zh:deconz";

interface WaitressMatcher {
    address?: number | string;
    endpoint: number;
    transactionSequenceNumber?: number;
    frameType: Zcl.FrameType;
    clusterID: number;
    commandIdentifier: number;
    direction: number;
}

export class DeconzAdapter extends Adapter {
    private driver: Driver;
    private openRequestsQueue: WaitForDataRequest[];
    private transactionID: number;
    private frameParserEvent = frameParserEvents;
    private fwVersion?: CoordinatorVersion;
    private waitress: Waitress<Events.ZclPayload, WaitressMatcher>;
    private readonly txOptions;
    private joinPermitted = false;

    public constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath: string, adapterOptions: AdapterOptions) {
        super(networkOptions, serialPortOptions, backupPath, adapterOptions);
        this.hasZdoMessageOverhead = true;
        this.manufacturerID = Zcl.ManufacturerCode.DRESDEN_ELEKTRONIK_INGENIEURTECHNIK_GMBH;

        // const concurrent = this.adapterOptions && this.adapterOptions.concurrent ? this.adapterOptions.concurrent : 2;

        // TODO(mpi): This needs to go! A delay doesn't make any sense. This looks like trial and error to solve a problem via random delay.
        // TODO: https://github.com/Koenkk/zigbee2mqtt/issues/4884#issuecomment-728903121
        const delay = this.adapterOptions && typeof this.adapterOptions.delay === "number" ? this.adapterOptions.delay : 0;

        this.waitress = new Waitress<Events.ZclPayload, WaitressMatcher>(this.waitressValidator, this.waitressTimeoutFormatter);

        // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
        this.driver = new Driver(serialPortOptions.path!);
        this.driver.setDelay(delay);

        // TODO(mpi): APS ACKs are subject to each individual request, not a global setting.
        this.txOptions = delay >= 200 ? 0x04 /* activate APS ACKs */ : 0x00 /* no APS ACKs */;

        this.driver.on("rxFrame", processFrame);
        this.transactionID = 0;
        this.openRequestsQueue = [];
        this.fwVersion = undefined;

        this.frameParserEvent.on("receivedDataPayload", this.checkReceivedDataPayload);
        this.frameParserEvent.on("receivedGreenPowerIndication", this.checkReceivedGreenPowerIndication);

        setInterval(() => {
            this.checkReceivedDataPayload(null);
        }, 1000);
    }

    /**
     * Adapter methods
     */
    public async start(): Promise<StartResult> {
        // TODO(mpi): In future we should simply try which baudrate may work (in a state machine).
        // E.g. connect with baudrate XY, query firmware, on timeout try other baudrate.
        // Most units out there are ConBee2/3 which support 115200.
        // The 38400 default is outdated now and only works for a few units.
        const baudrate = this.serialPortOptions.baudRate || 38400;
        await this.driver.open(baudrate);

        let changed = false;
        const panid = await this.driver.readParameterRequest(PARAM.PARAM.Network.PAN_ID);
        const expanid = await this.driver.readParameterRequest(PARAM.PARAM.Network.APS_EXT_PAN_ID);
        const channel = await this.driver.readParameterRequest(PARAM.PARAM.Network.CHANNEL);
        const networkKey = await this.driver.readParameterRequest(PARAM.PARAM.Network.NETWORK_KEY);
        //const ep1 =  = await this.driver.readParameterRequest(PARAM.PARAM.STK.Endpoint,);

        // TODO(mpi): refactor in state machine based "reconfigure_network" function.

        // TODO(mpi): Read also network state, the network might have proper values but isn't activated.

        // TODO(mpi): If any network parameters need to be reconfigured it should be done directly
        // here with write parameter request. Instead remember `need_reconfigure`, and start the full proceduce
        // network = off, configure all parameters, network = on

        // check current channel against configuration.yaml
        if (this.networkOptions.channelList[0] !== channel) {
            logger.debug(
                `Channel in configuration.yaml (${this.networkOptions.channelList[0]}) differs from current channel (${channel}). Changing channel.`,
                NS,
            );

            // TODO(mpi): Simplify -> channemask = 1 << (channel);
            let setChannelMask = 0;
            switch (this.networkOptions.channelList[0]) {
                case 11:
                    setChannelMask = 0x800;
                    break;
                case 12:
                    setChannelMask = 0x1000;
                    break;
                case 13:
                    setChannelMask = 0x2000;
                    break;
                case 14:
                    setChannelMask = 0x4000;
                    break;
                case 15:
                    setChannelMask = 0x8000;
                    break;
                case 16:
                    setChannelMask = 0x10000;
                    break;
                case 17:
                    setChannelMask = 0x20000;
                    break;
                case 18:
                    setChannelMask = 0x40000;
                    break;
                case 19:
                    setChannelMask = 0x80000;
                    break;
                case 20:
                    setChannelMask = 0x100000;
                    break;
                case 21:
                    setChannelMask = 0x200000;
                    break;
                case 22:
                    setChannelMask = 0x400000;
                    break;
                case 23:
                    setChannelMask = 0x800000;
                    break;
                case 24:
                    setChannelMask = 0x1000000;
                    break;
                case 25:
                    setChannelMask = 0x2000000;
                    break;
                case 26:
                    setChannelMask = 0x4000000;
                    break;
                default:
                    break;
            }

            try {
                await this.driver.writeParameterRequest(PARAM.PARAM.Network.CHANNEL_MASK, setChannelMask);
                await wait(500);
                changed = true;
            } catch (error) {
                logger.debug(`Could not set channel: ${error}`, NS);
            }
        }

        // check current panid against configuration.yaml
        if (this.networkOptions.panID !== panid) {
            logger.debug(`panid in configuration.yaml (${this.networkOptions.panID}) differs from current panid (${panid}). Changing panid.`, NS);

            try {
                await this.driver.writeParameterRequest(PARAM.PARAM.Network.PAN_ID, this.networkOptions.panID);
                await wait(500);
                changed = true;
            } catch (error) {
                logger.debug(`Could not set panid: ${error}`, NS);
            }
        }

        // check current extended_panid against configuration.yaml
        // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
        if (this.driver.generalArrayToString(this.networkOptions.extendedPanID!, 8) !== expanid) {
            logger.debug(
                `extended panid in configuration.yaml (${
                    // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                    this.driver.macAddrArrayToString(this.networkOptions.extendedPanID!)
                }) differs from current extended panid (${expanid}). Changing extended panid.`,
                NS,
            );

            try {
                // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                await this.driver.writeParameterRequest(PARAM.PARAM.Network.APS_EXT_PAN_ID, this.networkOptions.extendedPanID!);
                await wait(500);
                changed = true;
            } catch (error) {
                logger.debug(`Could not set extended panid: ${error}`, NS);
            }
        }

        // check current network key against configuration.yaml
        // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
        // TODO(mpi): options.networkKey can be initially null! (I think)
        if (this.driver.generalArrayToString(this.networkOptions.networkKey!, 16) !== networkKey) {
            logger.debug(`network key in configuration.yaml (hidden) differs from current network key (${networkKey}). Changing network key.`, NS);

            try {
                // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                await this.driver.writeParameterRequest(PARAM.PARAM.Network.NETWORK_KEY, this.networkOptions.networkKey!);
                await wait(500);
                changed = true;
            } catch (error) {
                logger.debug(`Could not set network key: ${error}`, NS);
            }
        }

        if (changed) {
            await this.driver.changeNetworkStateRequest(PARAM.PARAM.Network.NET_OFFLINE);
            await wait(2000);
            await this.driver.changeNetworkStateRequest(PARAM.PARAM.Network.NET_CONNECTED);
            await wait(2000);
        }

        // TODO(mpi): Endpoint configuration should be written like other network parameters and subject to `changed`.
        // It should happen before NET_CONNECTED is set.
        // Therefore read endpoint configuration, compare, swap if needed.

        // TODO(mpi): The following code only adjusts first endpoint, with a fixed setting.
        // Ideally also second endpoint should be configured like deCONZ does.

        // write endpoints
        /* Format of the STK.Endpoint parameter:
            {
                u8 endpointIndex // index used by firmware 0..2
                u8 endpoint // actual zigbee endpoint
                u16 profileId
                u16 deviceId
                u8 deviceVersion
                u8 serverClusterCount
                u16 serverClusters[serverClusterCount]
                u8 clientClusterCount
                u16 clientClusters[clientClusterCount]
            }
         */
        //[ sd1   ep    proId       devId       vers  #inCl iCl1        iCl2        iCl3        iCl4        iCl5        #outC oCl1        oCl2        oCl3        oCl4      ]
        const sd = [
            0x00, // index
            0x01, // endpoint
            0x04, 0x01, // profileId
            0x05, 0x00, // deviceId
            0x01, // deviceVersion
            0x05, // serverClusterCount
            0x00, 0x00, // Basic
            0x00, 0x06, // On/Off        TODO(mpi): This is wrong byte order! should be 0x06 0x00
            0x0a, 0x00, // Time
            0x19, 0x00, // OTA
            0x01, 0x05, // IAS ACE
            0x04, // clientClusterCount
            0x01, 0x00, // Power Configuration
            0x20, 0x00, // Poll Control
            0x00, 0x05, // IAS Zone
            0x02, 0x05 // IAS WD
        ];
        // TODO(mpi) why is it reversed? That result in invalid endpoint configuration.
        // Likely the command gets discarded as it results in endpointIndex = 0x05.
        const sd1 = sd.reverse();
        await this.driver.writeParameterRequest(PARAM.PARAM.STK.Endpoint, sd1);

        return "resumed";
    }

    public async stop(): Promise<void> {
        await this.driver.close();
    }

    public async getCoordinatorIEEE(): Promise<string> {
        return (await this.driver.readParameterRequest(PARAM.PARAM.Network.MAC)) as string;
    }

    public async permitJoin(seconds: number, networkAddress?: number): Promise<void> {
        const clusterId = Zdo.ClusterId.PERMIT_JOINING_REQUEST;

        if (networkAddress) {
            // `authentication`: TC significance always 1 (zb specs)
            const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, seconds, 1, []);

            const result = await this.sendZdo(ZSpec.BLANK_EUI64, networkAddress, clusterId, zdoPayload, false);

            if (!Zdo.Buffalo.checkStatus<Zdo.ClusterId.PERMIT_JOINING_RESPONSE>(result)) {
                // TODO: will disappear once moved upstream
                throw new Zdo.StatusError(result[0]);
            }
        } else {
            await this.driver.writeParameterRequest(PARAM.PARAM.Network.PERMIT_JOIN, seconds);

            logger.debug(`Permit joining on coordinator for ${seconds} sec.`, NS);

            // broadcast permit joining ZDO
            if (networkAddress === undefined) {
                // `authentication`: TC significance always 1 (zb specs)
                const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, seconds, 1, []);

                await this.sendZdo(ZSpec.BLANK_EUI64, ZSpec.BroadcastAddress.DEFAULT, clusterId, zdoPayload, true);
            }
        }

        this.joinPermitted = seconds !== 0;
    }

    public async getCoordinatorVersion(): Promise<CoordinatorVersion> {
        // product: number; transportrev: number; majorrel: number; minorrel: number; maintrel: number; revision: string;
        if (this.fwVersion !== undefined) {
            return this.fwVersion;
        }

        try {
            const fw = await this.driver.readFirmwareVersionRequest();
            const buf = Buffer.from(fw);
            const fwString = `0x${buf.readUInt32LE(0).toString(16)}`;
            let type = "";

            logger.debug(`Firmware version: ${fwString} (${fw}) fw[1]=${fw[1]}`, NS);

            if (fw[1] === 5) {
                type = "ConBee/RaspBee";
            } else if (fw[1] === 7) {
                type = "ConBee2/RaspBee2";
            } else if (fw[1] == 9) {
                type = "ConBee3";
            } else {
                type = "Unknown";
            }

            const meta = {transportrev: 0, product: 0, majorrel: fw[3], minorrel: fw[2], maintrel: 0, revision: fwString};
            this.fwVersion = {type: type, meta: meta};
            return {type: type, meta: meta};
        } catch (error) {
            throw new Error(`Get coordinator version Error: ${error}`);
        }
    }

    public async addInstallCode(ieeeAddress: string, key: Buffer, hashed: boolean): Promise<void> {
        await this.driver.writeLinkKey(ieeeAddress, hashed ? key : ZSpec.Utils.aes128MmoHash(key));
    }
    public async reset(_type: "soft" | "hard"): Promise<void> {
        return await Promise.reject(new Error("Reset is not supported"));
    }

    public waitFor(
        networkAddress: number | undefined,
        endpoint: number,
        frameType: Zcl.FrameType,
        direction: Zcl.Direction,
        transactionSequenceNumber: number | undefined,
        clusterID: number,
        commandIdentifier: number,
        timeout: number,
    ): {promise: Promise<Events.ZclPayload>; cancel: () => void} {
        const payload = {
            address: networkAddress,
            endpoint,
            clusterID,
            commandIdentifier,
            frameType,
            direction,
            transactionSequenceNumber,
        };
        const waiter = this.waitress.waitFor(payload, timeout);
        const cancel = (): void => this.waitress.remove(waiter.ID);
        return {promise: waiter.start().promise, cancel};
    }

    public async sendZdo(
        ieeeAddress: string,
        networkAddress: number,
        clusterId: Zdo.ClusterId,
        payload: Buffer,
        disableResponse: true,
    ): Promise<void>;
    public async sendZdo<K extends keyof ZdoTypes.RequestToResponseMap>(
        ieeeAddress: string,
        networkAddress: number,
        clusterId: K,
        payload: Buffer,
        disableResponse: false,
    ): Promise<ZdoTypes.RequestToResponseMap[K]>;
    public async sendZdo<K extends keyof ZdoTypes.RequestToResponseMap>(
        ieeeAddress: string,
        networkAddress: number,
        clusterId: K,
        payload: Buffer,
        disableResponse: boolean,
    ): Promise<ZdoTypes.RequestToResponseMap[K] | undefined> {
        const transactionID = this.nextTransactionID();
        payload[0] = transactionID;
        // TODO(mpi): this needs a complete review there are many different ZDP requests, some unicast some broadcasts
        // channel change likely also affected..
        const isNwkAddrRequest = clusterId === Zdo.ClusterId.NETWORK_ADDRESS_REQUEST;
        const req: ApsDataRequest = {
            requestId: transactionID,
            destAddrMode: isNwkAddrRequest ? PARAM.PARAM.addressMode.IEEE_ADDR : PARAM.PARAM.addressMode.NWK_ADDR,
            destAddr16: isNwkAddrRequest ? undefined : networkAddress,
            destAddr64: isNwkAddrRequest ? ieeeAddress : undefined,
            destEndpoint: Zdo.ZDO_ENDPOINT,
            profileId: Zdo.ZDO_PROFILE_ID,
            clusterId,
            srcEndpoint: Zdo.ZDO_ENDPOINT,
            asduLength: payload.length,
            asduPayload: payload,
            txOptions: 0,
            radius: PARAM.PARAM.txRadius.DEFAULT_RADIUS,
            timeout: 30,
        };

        this.driver
            .enqueueSendDataRequest(req)
            .then(() => {})
            .catch(() => {});

        if (!disableResponse) {
            const responseClusterId = Zdo.Utils.getResponseClusterId(clusterId);

            if (responseClusterId) {
                try {
                    const response = await this.waitForData(isNwkAddrRequest ? ieeeAddress : networkAddress, Zdo.ZDO_PROFILE_ID, responseClusterId);
                    // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                    return response.zdo! as ZdoTypes.RequestToResponseMap[K];
                } catch (error) {
                    if (responseClusterId === Zdo.ClusterId.ACTIVE_ENDPOINTS_RESPONSE && networkAddress === 0) {
                        logger.warning("Failed to determine active endpoints of coordinator, falling back to [1]", NS);
                        // Some Conbee adapaters don't provide a response to an active endpoint request of the coordinator, always return
                        // an endpoint here. Before an active endpoint request was done to determine the endpoints, they were hardcoded:
                        // https://github.com/Koenkk/zigbee-herdsman/blob/d855b3bf85a066cb7c325fe3ef0006873c735add/src/adapter/deconz/adapter/deconzAdapter.ts#L105
                        const response: ZdoTypes.ResponseMap[Zdo.ClusterId.ACTIVE_ENDPOINTS_RESPONSE] = [
                            Zdo.Status.SUCCESS,
                            {endpointList: [1], nwkAddress: 0},
                        ];
                        return response as ZdoTypes.RequestToResponseMap[K];
                    }

                    throw error;
                }
            }
        }
    }

    public async sendZclFrameToEndpoint(
        _ieeeAddr: string,
        networkAddress: number,
        endpoint: number,
        zclFrame: Zcl.Frame,
        timeout: number,
        // TODO(mpi): From Ember driver:
        //        let commandResponseId: number | undefined;
        //
        //        if (command.response !== undefined && disableResponse === false) {
        //            commandResponseId = command.response;
        //        } else if (!zclFrame.header.frameControl.disableDefaultResponse) {
        //            commandResponseId = Zcl.Foundation.defaultRsp.ID;
        //        }
        // .....................
        // In case commandResponseId != undefined this Promise should resolve with Events.ZclPayload once the response
        // is received. The response could be a a normal ZCL frame with the commandId = commandResponseId OR a ZCL Default Response, where the payload is the commandResponseId!
        // The problem with this is that a device may not send a command with specific ResponseId, but a ZCL Default Response with some status like "unsupported".
        // Our implementation should wait for any response if disableResponse = false, and match via ZCL sequence number.
        // If enabled and no response is received within "timeout" the promise should fail.
        //-----------------------------
        disableResponse: boolean,
        // TODO(mpi): in ember driver this means keep going enqueue request to firmware (up to 3 times).
        // In our case this a little different: The firmware may reject the requests because no free APS slots are available,
        // this is the only case where "recovery" makes sense. Other cases mean the request will never succeed (network offline, invalid request, ...).
        _disableRecovery: boolean,
        sourceEndpoint?: number,
    ): Promise<Events.ZclPayload | undefined> {
        const transactionID = this.nextTransactionID();
        const payload = zclFrame.toBuffer();
        const request: ApsDataRequest = {
            requestId: transactionID,
            destAddrMode: PARAM.PARAM.addressMode.NWK_ADDR,
            destAddr16: networkAddress,
            destEndpoint: endpoint,
            profileId: sourceEndpoint === 242 && endpoint === 242 ? 0xa1e0 : 0x104,
            clusterId: zclFrame.cluster.ID,
            srcEndpoint: sourceEndpoint || 1,
            asduLength: payload.length,
            asduPayload: payload,
            // TODO(mpi): This must not be a global option.
            // Since z2m doesn't provide it, ideally the driver figures this out on its own.
            // deCONZ keeps an error count for each device, if devices work fine without APS ACKs don't use them.
            // But if errors occur enable them..
            //
            // ember driver enables ACKs based on 'commandResponseId' which imho doesn't make sense at all:
            //
            //      don't RETRY if no response expected
            //      if (commandResponseId === undefined)
            //         apsFrame.options &= ~EmberApsOption.RETRY;
            //

            txOptions: this.txOptions, // 0x00 normal, 0x04 APS ACK
            radius: PARAM.PARAM.txRadius.DEFAULT_RADIUS,
            // TODO(mpi): We could treat _disableRecovery = true, to retry if enqueue (valid) requests or APS-confirms fail within timeout period?
            timeout: timeout,
        };

        const command = zclFrame.command;

        let needWaitResponse = disableResponse === false;;

        try {
            await this.driver.enqueueSendDataRequest(request);
        } catch (err) {
            throw new Error(`failed to send ZCL request (${zclFrame.header.transactionSequenceNumber}) ${err}`);
        }

        logger.debug(`ZCL request sent with transactionSequenceNumber.: ${zclFrame.header.transactionSequenceNumber}`, NS);
        logger.debug(`command.response: ${command.response}, zcl.disableDefaultResponse: ${zclFrame.header.frameControl.disableDefaultResponse}, z2m.disableResponse: ${disableResponse}, request.timeout: ${request.timeout}`, NS);

        if (needWaitResponse) {
           try {
                const data = await this.waitForData(
                    networkAddress,
                    ZSpec.HA_PROFILE_ID,
                    zclFrame.cluster.ID,
                    zclFrame.header.transactionSequenceNumber,
                    request.timeout
                );

                let addr;
                if (data.srcAddr16 !== undefined)
                    addr = data.srcAddr16;
                else if (data.srcAddr64 !== undefined)
                    addr = '0x' + data.srcAddr64;
                else
                    throw new Error("Unexpected waitForData() didn't contain valid address");

                let groupId = 0;
                let wasBroadCast = false;

                if (data.destAddrMode == PARAM.PARAM.addressMode.GROUP_ADDR) {
                    wasBroadCast = true;
                    if (data.destAddr16 === undefined)
                        throw new Error("Unexpected waitForData() didn't contain valid destination group address");
                    groupId = data.destAddr16;
                } else if (data.destAddrMode == PARAM.PARAM.addressMode.NWK_ADDR) {
                    if (data.destAddr16 === undefined)
                        throw new Error("Unexpected waitForData() didn't contain valid destination short address");
                    // BroadcastAll             = 0xFFFF
                    // BroadcastLowPowerRouters = 0xFFFB
                    // BroadcastRouters         = 0xFFFC
                    // BroadcastRxOnWhenIdle    = 0xFFFD
                    if (data.destAddr16 >= 0xfffb)
                        wasBroadCast = true;
                }

                const response: Events.ZclPayload = {
                    address: addr,
                    data: data.asduPayload,
                    clusterID: zclFrame.cluster.ID,
                    header: Zcl.Header.fromBuffer(data.asduPayload),
                    endpoint: data.srcEndpoint,
                    linkquality: data.lqi,
                    // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                    groupID: groupId,
                    wasBroadcast: wasBroadCast,
                    destinationEndpoint: data.destEndpoint,
                };
                logger.debug(`Response received transactionSequenceNumber: ${zclFrame.header.transactionSequenceNumber}`, NS);
                return response;
            } catch (err) {
                throw new Error(`No ZCL response received for (${zclFrame.header.transactionSequenceNumber}) ${err}`);
            }
        }
    }

    public async sendZclFrameToGroup(groupID: number, zclFrame: Zcl.Frame): Promise<void> {
        const transactionID = this.nextTransactionID();
        const payload = zclFrame.toBuffer();

        logger.debug(`zclFrame to group - ${groupID}`, NS);

        const request: ApsDataRequest = {
            requestId: transactionID,
            destAddrMode: PARAM.PARAM.addressMode.GROUP_ADDR,
            destAddr16: groupID,
            profileId: 0x104,
            clusterId: zclFrame.cluster.ID,
            srcEndpoint: 1,
            asduLength: payload.length,
            asduPayload: payload,
            txOptions: 0,
            radius: PARAM.PARAM.txRadius.UNLIMITED,
        };

        logger.debug("sendZclFrameToGroup - message send", NS);
        return await (this.driver.enqueueSendDataRequest(request) as Promise<void>);
    }

    public async sendZclFrameToAll(endpoint: number, zclFrame: Zcl.Frame, sourceEndpoint: number, destination: BroadcastAddress): Promise<void> {
        const transactionID = this.nextTransactionID();
        const payload = zclFrame.toBuffer();

        logger.debug(`zclFrame to all - ${endpoint}`, NS);

        const request: ApsDataRequest = {
            requestId: transactionID,
            destAddrMode: PARAM.PARAM.addressMode.NWK_ADDR,
            destAddr16: destination,
            destEndpoint: endpoint,
            profileId: sourceEndpoint === 242 && endpoint === 242 ? 0xa1e0 : 0x104,
            clusterId: zclFrame.cluster.ID,
            srcEndpoint: sourceEndpoint,
            asduLength: payload.length,
            asduPayload: payload,
            txOptions: 0,
            radius: PARAM.PARAM.txRadius.UNLIMITED,
        };

        logger.debug("sendZclFrameToAll - message send", NS);
        return await (this.driver.enqueueSendDataRequest(request) as Promise<void>);
    }

    public async supportsBackup(): Promise<boolean> {
        return await Promise.resolve(false);
    }

    public async backup(): Promise<Models.Backup> {
        return await Promise.reject(new Error("This adapter does not support backup"));
    }

    public async getNetworkParameters(): Promise<NetworkParameters> {
        // TODO(mpi): This should work, needs more investigation.
        try {
            const panid = await this.driver.readParameterRequest(PARAM.PARAM.Network.PAN_ID);
            const expanid = await this.driver.readParameterRequest(PARAM.PARAM.Network.APS_EXT_PAN_ID);
            const channel = await this.driver.readParameterRequest(PARAM.PARAM.Network.CHANNEL);
            // For some reason, reading NWK_UPDATE_ID always returns `null` (tested with `0x26780700` on Conbee II)
            // 0x24 was taken from https://github.com/zigpy/zigpy-deconz/blob/70910bc6a63e607332b4f12754ba470651eb878c/zigpy_deconz/api.py#L152
            // const nwkUpdateId = await this.driver.readParameterRequest(0x24 /*PARAM.PARAM.Network.NWK_UPDATE_ID*/);

            return {
                panID: panid as number,
                extendedPanID: expanid as string, // read as `0x...`
                channel: channel as number,
                nwkUpdateID: 0 as number,
            };
        } catch (error) {
            const msg = `get network parameters Error:${error}`;
            logger.debug(msg, NS);
            return await Promise.reject(new Error(msg));
        }
    }

    public async restoreChannelInterPAN(): Promise<void> {
        await Promise.reject(new Error("not supported"));
    }
    public async sendZclFrameInterPANToIeeeAddr(_zclFrame: Zcl.Frame, _ieeeAddr: string): Promise<void> {
        await Promise.reject(new Error("not supported"));
    }
    public async sendZclFrameInterPANBroadcast(_zclFrame: Zcl.Frame, _timeout: number): Promise<Events.ZclPayload> {
        return await Promise.reject(new Error("not supported"));
    }
    public async sendZclFrameInterPANBroadcastWithResponse(_zclFrame: Zcl.Frame, _timeout: number): Promise<Events.ZclPayload> {
        return await Promise.reject(new Error("not supported"));
    }
    public async setChannelInterPAN(_channel: number): Promise<void> {
        await Promise.reject(new Error("not supported"));
    }
    public async sendZclFrameInterPANIeeeAddr(_zclFrame: Zcl.Frame, _ieeeAddr: string): Promise<void> {
        await Promise.reject(new Error("not supported"));
    }

    /**
     * Private methods
     */

    private waitForData(
        addr: number | string,
        profileId: number,
        clusterId: number,
        transactionSequenceNumber?: number,
        timeout?: number,
    ): Promise<ReceivedDataResponse> {
        return new Promise((resolve, reject): void => {
            const ts = Date.now();
            // const commandId = PARAM.PARAM.APS.DATA_INDICATION;
            const req: WaitForDataRequest = {addr, profileId, clusterId, transactionSequenceNumber, resolve, reject, ts, timeout};
            this.openRequestsQueue.push(req);
        });
    }

    private checkReceivedGreenPowerIndication(ind: GpDataInd): void {
        const gpdHeader = Buffer.alloc(15); // applicationId === IEEE_ADDRESS ? 20 : 15
        gpdHeader.writeUInt8(0b00000001, 0); // frameControl: FrameType.SPECIFIC + Direction.CLIENT_TO_SERVER + disableDefaultResponse=false
        gpdHeader.writeUInt8(ind.seqNr, 1);
        gpdHeader.writeUInt8(ind.id, 2); // commandIdentifier
        gpdHeader.writeUInt16LE(ind.options, 3); // options
        gpdHeader.writeUInt32LE(ind.srcId, 5);
        // omitted: gpdIEEEAddr (ieeeAddr)
        // omitted: gpdEndpoint (uint8)
        gpdHeader.writeUInt32LE(ind.frameCounter, 9);
        gpdHeader.writeUInt8(ind.commandId, 13);
        gpdHeader.writeUInt8(ind.commandFrameSize, 14);

        const payBuf = Buffer.concat([gpdHeader, ind.commandFrame]);
        const payload: Events.ZclPayload = {
            header: Zcl.Header.fromBuffer(payBuf),
            data: payBuf,
            clusterID: Zcl.Clusters.greenPower.ID,
            address: ind.srcId & 0xffff,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 0xff, // bogus
            groupID: ZSpec.GP_GROUP_ID,
            wasBroadcast: true, // Take the codepath that doesn't require `gppNwkAddr` as its not present in the payload
            destinationEndpoint: ZSpec.GP_ENDPOINT,
        };

        this.waitress.resolve(payload);
        this.emit("zclPayload", payload);
    }

    private checkReceivedDataPayload(resp: ReceivedDataResponse | null): void {
        let srcAddr: number | undefined;
        let srcEUI64: string | undefined;
        let header: Zcl.Header | undefined;

        if (resp) {
            if (resp.srcAddr16 != null) {
                srcAddr = resp.srcAddr16;
            } else {
                // For some devices srcAddr64 is reported by ConBee 3, even if the frame contains both
                // srcAddr16 and srcAddr64. This happens even if the request was sent to a short address.
                // At least some parts, e.g. the while loop below, only work with srcAddr16 (i.e. the network
                // address) being set. So we try to look up the network address in the list of know devices.
                if (resp.srcAddr64 != null) {
                    logger.debug(`Try to find network address of ${resp.srcAddr64}`, NS);
                    // Note: Device expects addresses with a 0x prefix...
                    srcAddr = Device.byIeeeAddr(`0x${resp.srcAddr64}`, false)?.networkAddress;
                    // apperantly some functions furhter up in the protocol stack expect this to be set.
                    // so let's make sure they get the network address
                    // Note: srcAddr16 can be undefined after this and this is intended behavior
                    // there are zigbee frames which do not contain a 16 bit address, e.g. during joining.
                    // So any code that relies on srcAddr16 must handle this in some way.
                    resp.srcAddr16 = srcAddr;
                }
            }

            if (resp.profileId === Zdo.ZDO_PROFILE_ID) {
                if (resp.clusterId === Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE) {
                    // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                    if (Zdo.Buffalo.checkStatus<Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE>(resp.zdo!)) {
                        // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                        srcEUI64 = resp.zdo![1].eui64;
                    }
                } else if (resp.clusterId === Zdo.ClusterId.END_DEVICE_ANNOUNCE) {
                    // XXX: using same response for announce (handled by controller) or joined depending on permit join status?
                    // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                    if (this.joinPermitted === true && Zdo.Buffalo.checkStatus<Zdo.ClusterId.END_DEVICE_ANNOUNCE>(resp.zdo!)) {
                        const payload = resp.zdo[1];

                        this.emit("deviceJoined", {networkAddress: payload.nwkAddress, ieeeAddr: payload.eui64});
                    }
                }

                // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                this.emit("zdoResponse", resp.clusterId, resp.zdo!);
            } else {
                header = Zcl.Header.fromBuffer(resp.asduPayload);
            }
        }

        let i = this.openRequestsQueue.length;

        while (i--) {
            const req: WaitForDataRequest = this.openRequestsQueue[i];

            if (
                resp &&
                (req.addr === undefined ||
                    (typeof req.addr === "number" ? srcAddr !== undefined && req.addr === srcAddr : srcEUI64 && req.addr === srcEUI64)) &&
                req.clusterId === resp.clusterId &&
                req.profileId === resp.profileId &&
                (header === undefined ||
                    req.transactionSequenceNumber === undefined ||
                    req.transactionSequenceNumber === header.transactionSequenceNumber)
            ) {
                this.openRequestsQueue.splice(i, 1);
                req.resolve(resp);
            }

            const now = Date.now();

            // Default timeout: 60 seconds.
            // Comparison is negated to prevent orphans when invalid timeout is entered (resulting in NaN).
            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            if (!(now - req.ts! <= (req.timeout ?? 60000))) {
                //logger.debug("Timeout for request in openRequestsQueue addr: " + req.addr.toString(16) + " clusterId: " + req.clusterId.toString(16) + " profileId: " + req.profileId.toString(16), NS);
                //remove from busyQueue
                this.openRequestsQueue.splice(i, 1);
                req.reject(new Error("waiting for response TIMEOUT"));
            }
        }

        if (resp && resp.profileId !== Zdo.ZDO_PROFILE_ID) {
            const payload: Events.ZclPayload = {
                clusterID: resp.clusterId,
                header,
                data: resp.asduPayload,
                address:
                    resp.srcAddrMode === 0x03
                        ? `0x${
                              // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                              resp.srcAddr64!
                          }`
                        : // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                          resp.srcAddr16!,
                endpoint: resp.srcEndpoint,
                linkquality: resp.lqi,
                // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                groupID: resp.destAddrMode === 0x01 ? resp.destAddr16! : 0,
                wasBroadcast: resp.destAddrMode === 0x01 || resp.destAddrMode === 0xf,
                destinationEndpoint: resp.destEndpoint,
            };

            this.waitress.resolve(payload);
            this.emit("zclPayload", payload);
        }
    }

    private nextTransactionID(): number {
        this.transactionID++;

        if (this.transactionID > 255) {
            this.transactionID = 1;
        }

        return this.transactionID;
    }

    private waitressTimeoutFormatter(matcher: WaitressMatcher, timeout: number): string {
        return (
            `Timeout - ${matcher.address} - ${matcher.endpoint}` +
            ` - ${matcher.transactionSequenceNumber} - ${matcher.clusterID}` +
            ` - ${matcher.commandIdentifier} after ${timeout}ms`
        );
    }

    private waitressValidator(payload: Events.ZclPayload, matcher: WaitressMatcher): boolean {
        return Boolean(
            payload.header &&
                (!matcher.address || payload.address === matcher.address) &&
                payload.endpoint === matcher.endpoint &&
                (!matcher.transactionSequenceNumber || payload.header.transactionSequenceNumber === matcher.transactionSequenceNumber) &&
                payload.clusterID === matcher.clusterID &&
                matcher.frameType === payload.header.frameControl.frameType &&
                matcher.commandIdentifier === payload.header.commandIdentifier &&
                matcher.direction === payload.header.frameControl.direction,
        );
    }
}
