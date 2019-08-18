import {Znp} from '../znp';
import {Constants as UnpiConstants} from '../unpi';
import * as Constants from '../constants';
import equals from 'fast-deep-equal';
import * as TsType from '../../tstype';
import * as Zcl from '../../../zcl';
import {ZnpVersion, NvItem} from './tstype';
import Debug from "debug";
import {Restore} from './backup';
import Items from './nvItems';
import fs from 'fs';

const debug = Debug('zigbee-herdsman:controller:zStack:startZnp');
const Subsystem = UnpiConstants.Subsystem;

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
        await validateItem(znp, Items.znpHasConfigured(version), 'hasConfigured')
        await validateItem(znp, Items.channelList(options.channelList), 'channelList');
        await validateItem(znp, Items.networkKeyDistribute(options.networkKeyDistribute), 'networkKeyDistribute');

        if (version === ZnpVersion.zStack3x0) {
            await validateItem(znp, Items.networkKey(options.networkKey), 'networkKey');
        } else {
            await validateItem(znp, Items.networkKey(options.networkKey), 'networkKey', Subsystem.SAPI, 'readConfiguration');
        }

        if (version === ZnpVersion.zStack12) {
            // TODO: add extendedPanID and panID for zStack 3
            await validateItem(znp, Items.panID(options.panID), 'panID');
            await validateItem(znp, Items.extendedPanID(options.extenedPanID), 'extendedPanID');
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
        const started = znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'stateChangeInd', {state: 9}, 60000)
        znp.request(Subsystem.ZDO, 'startupFromApp', {startdelay: 100}, [0, 1]);
        await started;
        debug('ZNP started as coordinator');
    } else {
        debug('ZNP is already started as coordinator');
    }
}

async function registerEndpoints(znp: Znp): Promise<void> {
    const activeEpResponse = znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'activeEpRsp');
    znp.request(Subsystem.ZDO, 'activeEpReq', {dstaddr: 0, nwkaddrofinterest: 0});
    const activeEp = await activeEpResponse;

    for (const endpoint of Endpoints) {
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

    if (version === ZnpVersion.zStack12) {
        // TODO: add extendedPanID and panID for zStack 3
        await validateItem(znp, Items.panID(options.panID), 'panID');
        await validateItem(znp, Items.extendedPanID(options.extenedPanID), 'extendedPanID');
    }

    if (version === ZnpVersion.zStack30x || version === ZnpVersion.zStack3x0) {
        await znp.request(Subsystem.SYS, 'osalNvWrite', Items.networkKey(options.networkKey));
        // Default link key is already OK for Z-Stack 3 ('ZigBeeAlliance09')
        const channelMask = Buffer.from(Constants.Utils.getChannelMask(options.channelList)).readUInt32LE(0);
        await znp.request(Subsystem.APP_CNF, 'bdbSetChannel', {isPrimary: 0x1, channel: channelMask});
        await znp.request(Subsystem.APP_CNF, 'bdbSetChannel', {isPrimary: 0x0, channel: 0x0});
        const started = znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'stateChangeInd', {state: 9}, 60000)
        await znp.request(Subsystem.APP_CNF, 'bdbStartCommissioning', {mode: 0x04});
        await started;
        await znp.request(Subsystem.APP_CNF, 'bdbStartCommissioning', {mode: 0x02});
    } else {
        await znp.request(Subsystem.SAPI, 'writeConfiguration', Items.networkKey(options.networkKey));
        await znp.request(Subsystem.SYS, 'osalNvWrite', Items.tcLinkKey());
    }

    // expect status code 9 (= item created and initialized)
    await znp.request(Subsystem.SYS, 'osalNvItemInit', Items.znpHasConfiguredInit(version), [0, 9]);
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.znpHasConfigured(version));
}

export default async (znp: Znp, version: ZnpVersion, options: TsType.NetworkOptions, backupPath?: string): Promise<TsType.StartResult> => {
    let result: TsType.StartResult = 'resumed';
    let hasConfigured = false;

    try {
        await validateItem(znp, Items.znpHasConfigured(version), 'hasConfigured')
        hasConfigured = true;
    } catch {
        hasConfigured = false;
    }

    // Restore from backup when the coordinator has never been configured yet.
    if (backupPath && fs.existsSync(backupPath) && !hasConfigured) {
        debug('Restoring coordinator from backup');
        await Restore(znp, backupPath, options);
        result = 'restored';
    } else if (await needsToBeInitialised(znp, version, options)) {
        await initialise(znp, version, options);
        result = 'resetted';
    }

    await boot(znp);
    await registerEndpoints(znp);
    return result;
};