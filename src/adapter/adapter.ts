import events from "node:events";

import type * as Models from "../models";
import type {BroadcastAddress} from "../zspec/enums";
import * as Zcl from "../zspec/zcl";
import type * as Zdo from "../zspec/zdo";
import type * as ZdoTypes from "../zspec/zdo/definition/tstypes";
import {discoverAdapter} from "./adapterDiscovery";
import type * as AdapterEvents from "./events";
import type * as TsType from "./tstype";

interface AdapterEventMap {
    deviceJoined: [payload: AdapterEvents.DeviceJoinedPayload];
    zclPayload: [payload: AdapterEvents.ZclPayload];
    zdoResponse: [clusterId: Zdo.ClusterId, response: ZdoTypes.GenericZdoResponse];
    disconnected: [];
    deviceLeave: [payload: AdapterEvents.DeviceLeavePayload];
}

export abstract class Adapter extends events.EventEmitter<AdapterEventMap> {
    public hasZdoMessageOverhead: boolean;
    public manufacturerID: Zcl.ManufacturerCode;
    protected networkOptions: TsType.NetworkOptions;
    protected adapterOptions: TsType.AdapterOptions;
    protected serialPortOptions: TsType.SerialPortOptions;
    protected backupPath: string;

    protected constructor(
        networkOptions: TsType.NetworkOptions,
        serialPortOptions: TsType.SerialPortOptions,
        backupPath: string,
        adapterOptions: TsType.AdapterOptions,
    ) {
        super();
        this.hasZdoMessageOverhead = true;
        this.manufacturerID = Zcl.ManufacturerCode.RESERVED_10;
        this.networkOptions = networkOptions;
        this.adapterOptions = adapterOptions;
        this.serialPortOptions = serialPortOptions;
        this.backupPath = backupPath;
    }

    /**
     * Utility
     */

    public static async create(
        networkOptions: TsType.NetworkOptions,
        serialPortOptions: TsType.SerialPortOptions,
        backupPath: string,
        adapterOptions: TsType.AdapterOptions,
    ): Promise<Adapter> {
        const [adapter, path] = await discoverAdapter(serialPortOptions.adapter, serialPortOptions.path);
        serialPortOptions.adapter = adapter;
        serialPortOptions.path = path;

        switch (adapter) {
            case "zstack": {
                const {ZStackAdapter} = await import("./z-stack/adapter/zStackAdapter.js");

                return new ZStackAdapter(networkOptions, serialPortOptions, backupPath, adapterOptions);
            }
            case "ember": {
                const {EmberAdapter} = await import("./ember/adapter/emberAdapter.js");

                return new EmberAdapter(networkOptions, serialPortOptions, backupPath, adapterOptions);
            }
            case "deconz": {
                const {DeconzAdapter} = await import("./deconz/adapter/deconzAdapter.js");

                return new DeconzAdapter(networkOptions, serialPortOptions, backupPath, adapterOptions);
            }
            case "zigate": {
                const {ZiGateAdapter} = await import("./zigate/adapter/zigateAdapter.js");

                return new ZiGateAdapter(networkOptions, serialPortOptions, backupPath, adapterOptions);
            }
            case "zboss": {
                const {ZBOSSAdapter} = await import("./zboss/adapter/zbossAdapter.js");

                return new ZBOSSAdapter(networkOptions, serialPortOptions, backupPath, adapterOptions);
            }
            case "zoh": {
                const {ZoHAdapter} = await import("./zoh/adapter/zohAdapter.js");

                return new ZoHAdapter(networkOptions, serialPortOptions, backupPath, adapterOptions);
            }
            case "blz": {
                const {BLZAdapter} = await import("./blz/adapter/blzAdapter.js");

                return new BLZAdapter(networkOptions, serialPortOptions, backupPath, adapterOptions);
            }
            // @deprecated
            case "ezsp": {
                const {EZSPAdapter} = await import("./ezsp/adapter/ezspAdapter.js");

                return new EZSPAdapter(networkOptions, serialPortOptions, backupPath, adapterOptions);
            }
            default: {
                throw new Error(`Adapter '${adapter}' does not exists, possible options: zstack, ember, deconz, zigate, zboss, zoh, blz, ezsp`);
            }
        }
    }

    public abstract start(): Promise<TsType.StartResult>;

    public abstract stop(): Promise<void>;

    public abstract getCoordinatorIEEE(): Promise<string>;

    public abstract getCoordinatorVersion(): Promise<TsType.CoordinatorVersion>;

    public abstract reset(type: "soft" | "hard"): Promise<void>;

    public abstract supportsBackup(): Promise<boolean>;

    public abstract backup(ieeeAddressesInDatabase: string[]): Promise<Models.Backup>;

    public abstract getNetworkParameters(): Promise<TsType.NetworkParameters>;

    public abstract addInstallCode(ieeeAddress: string, key: Buffer, hashed: boolean): Promise<void>;

    public abstract waitFor(
        networkAddress: number | undefined,
        endpoint: number,
        frameType: Zcl.FrameType,
        direction: Zcl.Direction,
        transactionSequenceNumber: number | undefined,
        clusterID: number,
        commandIdentifier: number,
        timeout: number,
    ): {promise: Promise<AdapterEvents.ZclPayload>; cancel: () => void};

    /**
     * ZDO
     */

    public abstract sendZdo(
        ieeeAddress: string,
        networkAddress: number,
        clusterId: Zdo.ClusterId,
        payload: Buffer,
        disableResponse: true,
    ): Promise<void>;
    public abstract sendZdo<K extends keyof ZdoTypes.RequestToResponseMap>(
        ieeeAddress: string,
        networkAddress: number,
        clusterId: K,
        payload: Buffer,
        disableResponse: false,
    ): Promise<ZdoTypes.RequestToResponseMap[K]>;
    public abstract sendZdo<K extends keyof ZdoTypes.RequestToResponseMap>(
        ieeeAddress: string,
        networkAddress: number,
        clusterId: K,
        payload: Buffer,
        disableResponse: boolean,
    ): Promise<ZdoTypes.RequestToResponseMap[K] | undefined>;

    public abstract permitJoin(seconds: number, networkAddress?: number): Promise<void>;

    /**
     * ZCL
     */

    public abstract sendZclFrameToEndpoint(
        ieeeAddr: string,
        networkAddress: number,
        endpoint: number,
        zclFrame: Zcl.Frame,
        timeout: number,
        disableResponse: boolean,
        disableRecovery: boolean,
        sourceEndpoint?: number,
    ): Promise<AdapterEvents.ZclPayload | undefined>;

    public abstract sendZclFrameToGroup(groupID: number, zclFrame: Zcl.Frame, sourceEndpoint?: number): Promise<void>;

    public abstract sendZclFrameToAll(endpoint: number, zclFrame: Zcl.Frame, sourceEndpoint: number, destination: BroadcastAddress): Promise<void>;

    /**
     * InterPAN
     */

    public abstract setChannelInterPAN(channel: number): Promise<void>;

    public abstract sendZclFrameInterPANToIeeeAddr(zclFrame: Zcl.Frame, ieeeAddress: string): Promise<void>;

    public abstract sendZclFrameInterPANBroadcast(zclFrame: Zcl.Frame, timeout: number): Promise<AdapterEvents.ZclPayload>;

    public abstract restoreChannelInterPAN(): Promise<void>;
}

export default Adapter;
