import {Znp} from '../znp';
import {Constants as UnpiConstants} from '../unpi';
import * as Constants from '../constants';
import equals from 'fast-deep-equal';
import * as TsType from '../../tstype';
import fs from 'fs';
import * as Zcl from '../../../zcl';
import {ZnpVersion} from './tstype';

const debug = require('debug')('zigbee-herdsman:controller:zStack:startZnp');
const Subsystem = UnpiConstants.Subsystem;
const NvItemsIds = Constants.COMMON.nvItemIds;

interface NvItem {
    id: number;
    offset?: number;
    len: number;
    value?: Buffer;
    configid?: number;
    initlen?: number;
    initvalue?: Buffer;
}

const Items = {
    znpHasConfiguredInit: (version: ZnpVersion): NvItem => {
        return {
            id: version === ZnpVersion.zStack12 ?
                NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1 : NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3,
            len: 0x01,
            initlen: 0x01,
            initvalue: Buffer.from([0x00]),
        };
    },
    znpHasConfigured: (version: ZnpVersion): NvItem => {
        return {
            id: version === ZnpVersion.zStack12 ?
                NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1 : NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3,
            offset: 0x00,
            len: 0x01,
            value: Buffer.from([0x55]),
        };
    },
    panID: (panID: number): NvItem => {
        return {
            id: NvItemsIds.PANID,
            len: 0x02,
            offset: 0x00,
            value: Buffer.from([panID & 0xFF, (panID >> 8) & 0xFF]),
        }
    },
    extendedPanID: (extendedPanID: number[]): NvItem =>  {
        return {
            id: NvItemsIds.EXTENDED_PAN_ID,
            len: 0x08,
            offset: 0x00,
            value: Buffer.from(extendedPanID),
        }
    },
    channelList: (channelList: number[]): NvItem => {
        return {
            id: NvItemsIds.CHANLIST,
            len: 0x04,
            offset: 0x00,
            value: Buffer.from(Constants.Utils.getChannelMask(channelList)),
        }
    },
    networkKeyDistribute: (distribute: boolean): NvItem => {
        return {
            id: NvItemsIds.PRECFGKEYS_ENABLE,
            len: 0x01,
            offset: 0x00,
            value: Buffer.from([distribute ? 0x01 : 0x00]),
        }
    },
    networkKey: (key: number[]): NvItem => {
        return {
            // id/configid is used depending if SAPI or SYS command is executed
            id: NvItemsIds.PRECFGKEY,
            configid: NvItemsIds.PRECFGKEY,
            len: 0x01,
            offset: 0x00,
            value: Buffer.from(key),
        }
    },
    startupOption: (value: number): NvItem => {
        return {
            id: NvItemsIds.STARTUP_OPTION,
            len: 0x01,
            offset: 0x00,
            value: Buffer.from([value]),
        };
    },
    logicalType: (value: number): NvItem => {
        return {
            id: NvItemsIds.LOGICAL_TYPE,
            len: 0x01,
            offset: 0x00,
            value: Buffer.from([value]),
        };
    },
    zdoDirectCb: (): NvItem => {
        return {
            id: NvItemsIds.ZDO_DIRECT_CB,
            len: 0x01,
            offset: 0x00,
            value: Buffer.from([0x01]),
        };
    },
    tcLinkKey: (): NvItem => {
        return {
            id: NvItemsIds.TCLK_TABLE_START,
            offset: 0x00,
            len: 0x20,
            // ZigBee Alliance Pre-configured TC Link Key - 'ZigBeeAlliance09'
            value: Buffer.from([
                0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x5a, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6c,
                0x6c, 0x69, 0x61, 0x6e, 0x63, 0x65, 0x30, 0x39, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
            ]),
        }
    },
}

const EndpointDefaults: {
    appdeviceid: number;
    appdevver: number;
    appnuminclusters: number;
    appinclusterlist: number[];
    appnumoutclusters: number;
    appoutclusterlist: number[];
    latencyreq: number;
} = {
    appdeviceid: 0x0005,
    appdevver: 0,
    appnuminclusters: 0,
    appinclusterlist: [],
    appnumoutclusters: 0,
    appoutclusterlist: [],
    latencyreq: Constants.AF.networkLatencyReq.NO_LATENCY_REQS,
}

const Endpoints = [
    {...EndpointDefaults, endpoint: 1, appprofid: 0x0104},
    {...EndpointDefaults, endpoint: 2, appprofid: 0x0101},
    {...EndpointDefaults, endpoint: 3, appprofid: 0x0105},
    {...EndpointDefaults, endpoint: 4, appprofid: 0x0107},
    {...EndpointDefaults, endpoint: 5, appprofid: 0x0108},
    {...EndpointDefaults, endpoint: 6, appprofid: 0x0109},
    {
        ...EndpointDefaults,
        endpoint: 11,
        appprofid: 0x0104,
        appdeviceid: 0x0400,
        appnumoutclusters: 1,
        appoutclusterlist: [Zcl.Utils.getCluster('ssIasZone').ID]
    },
]

async function validateItem(znp: Znp, item: NvItem, message: string, subsystem = Subsystem.SYS, command = 'osalNvRead'): Promise<void> {
    const result = await znp.request(subsystem, command, item);

    if (!equals(result.payload.value, item.value)) {
        debug(`Item '${message}' is invalid, got '${JSON.stringify(result.payload.value)}', expected '${JSON.stringify(item.value)}'`);
        throw new Error();
    } else {
        debug(`Item '${message}' is valid`);
    }
}

async function needsToBeInitialised(znp: Znp, version: ZnpVersion, options: TsType.NetworkOptions): Promise<boolean> {
    try {
        await validateItem(znp, Items.znpHasConfigured(version), 'hasConfigured');

        // TODO: check for z-stack 3
        await validateItem(znp, Items.panID(options.panID), 'panID');
        await validateItem(znp, Items.extendedPanID(options.extenedPanID), 'extendedPanID');

        await validateItem(znp, Items.channelList(options.channelList), 'channelList');
        await validateItem(znp, Items.networkKeyDistribute(options.networkKeyDistribute), 'networkKeyDistribute');

        if (version === ZnpVersion.zStack3x0) {
            // TODO: check for z-stack 3
            await validateItem(znp, Items.networkKey(options.networkKey), 'networkKey');
        } else {
            await validateItem(znp, Items.networkKey(options.networkKey), 'networkKey', Subsystem.SAPI, 'readConfiguration');
        }

        return false;
    } catch (e) {
        debug(`Error while validating items: '${e}'`);
        return true;
    }
}

async function boot(znp: Znp): Promise<void> {
    const result = await znp.request(Subsystem.UTIL, 'getDeviceInfo', {});

    if (result.payload.devicestate !== Constants.COMMON.devStates.ZB_COORD) {
        debug('Start ZNP as coordinator...');
        const started = znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'stateChangeInd', {state: 9})
        znp.request(Subsystem.ZDO, 'startupFromApp', {startdelay: 100}, [0, 1]);
        await started;
        debug('ZNP started as coordinator');
    } else {
        debug('ZNP is already started as coordinator');
    }
}

async function restore(backupPath: string): Promise<void> {
    backupPath;
    // TODO: check for z-stack 3
}

async function registerEndpoints(znp: Znp): Promise<void> {
    const activeEpResponse = znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'activeEpRsp');
    znp.request(Subsystem.ZDO, 'activeEpReq', {dstaddr: 0, nwkaddrofinterest: 0});
    const activeEp = await activeEpResponse;

    for (var endpoint of Endpoints) {
        if (activeEp.payload.activeeplist.includes(endpoint.endpoint)) {
            debug(`Endpoint '${endpoint.endpoint}' already registered`);
        } else {
            debug(`Registering endpoint '${endpoint.endpoint}'`);
            await znp.request(Subsystem.AF, 'register', endpoint);
        }
    }
}

async function initialise(znp: Znp, version: ZnpVersion, options: TsType.NetworkOptions): Promise<void> {
    debug('Initialising coordinator')
    await znp.request(Subsystem.SYS, 'resetReq', {type: Constants.SYS.resetType.SOFT});
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.startupOption(0x02));
    await znp.request(Subsystem.SYS, 'resetReq', {type: Constants.SYS.resetType.SOFT});
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.logicalType(Constants.ZDO.deviceLogicalType.COORDINATOR));
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.networkKeyDistribute(options.networkKeyDistribute));
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.zdoDirectCb());
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.channelList(options.channelList));
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.panID(options.panID)); // TODO z-stack 3
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.extendedPanID(options.extenedPanID)); // TODO z-stack 3

    if (version === ZnpVersion.zStack30x || version === ZnpVersion.zStack3x0) {
        await znp.request(Subsystem.SYS, 'osalNvWrite', Items.networkKey(options.networkKey));
        // Default link key is already OK for Z-Stack 3 ('ZigBeeAlliance09')
        // TODO: check for z-stack 3
        //
        //
        // Set panid and extended pan id
        //         function () { return self.request('APP_CNF', 'bdbSetChannel', {isPrimary: 0x1, channel: channel}).delay(10); },
        //         function () { return self.request('APP_CNF', 'bdbSetChannel', {isPrimary: 0x0, channel: 0x0}).delay(10); },
        //         function () { return self.request('APP_CNF', 'bdbStartCommissioning', {mode: 0x04}).delay(5000); },
        //         function () { return self.request('APP_CNF', 'bdbStartCommissioning', {mode: 0x02}).delay(10); },
    } else {
        await znp.request(Subsystem.SAPI, 'writeConfiguration', Items.networkKey(options.networkKey));
        await znp.request(Subsystem.SYS, 'osalNvWrite', Items.tcLinkKey());
    }

    // expect status code 9 (= item created and initialized)
    await znp.request(Subsystem.SYS, 'osalNvItemInit', Items.znpHasConfiguredInit(version), [0, 9]);
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.znpHasConfigured(version));
}

export default async (znp: Znp, version: ZnpVersion, options: TsType.NetworkOptions, backupPath?: string): Promise<void> => {
    if (await needsToBeInitialised(znp, version, options)) {
        debug('Coordinator needs to be reinitialised');
        if (backupPath && fs.existsSync(backupPath)) {
            debug('Restoring coordinator from backup');
            await restore(backupPath);
        } else {
            await initialise(znp, version, options);
        }
    }

    await boot(znp);

    // After startup, write the channel again, otherwise the channel is not always persisted in the NV.
    // Not sure why this is needed.
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.channelList(options.channelList));

    await registerEndpoints(znp);
};