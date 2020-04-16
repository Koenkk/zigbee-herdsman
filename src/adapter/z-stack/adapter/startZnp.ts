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

const debug = Debug('zigbee-herdsman:adapter:zStack:startZnp');
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
};

const Endpoints = [
    {...EndpointDefaults, endpoint: 1, appprofid: 0x0104},
    {...EndpointDefaults, endpoint: 2, appprofid: 0x0101},
    {...EndpointDefaults, endpoint: 3, appprofid: 0x0105},
    {...EndpointDefaults, endpoint: 4, appprofid: 0x0107},
    {...EndpointDefaults, endpoint: 5, appprofid: 0x0108},
    {...EndpointDefaults, endpoint: 6, appprofid: 0x0109},
    {...EndpointDefaults, endpoint: 8, appprofid: 0x0104},
    {
        ...EndpointDefaults,
        endpoint: 11,
        appprofid: 0x0104,
        appdeviceid: 0x0400,
        appnumoutclusters: 1,
        appoutclusterlist: [Zcl.Utils.getCluster('ssIasZone').ID]
    },
    // TERNCY: https://github.com/Koenkk/zigbee-herdsman/issues/82
    {...EndpointDefaults, endpoint: 0x6E, appprofid: 0x0104},
    {...EndpointDefaults, endpoint: 12, appprofid: 0xc05e},
    {
        ...EndpointDefaults,
        endpoint: 13,
        appprofid: 0x0104,
        appnuminclusters: 1,
        appinclusterlist: [Zcl.Utils.getCluster('genOta').ID]
    },
    // Insta/Jung/Gira: OTA fallback EP (since it's buggy in firmware 10023202 when it tries to find a matching EP for
    // OTA - it queries for ZLL profile, but then contacts with HA profile)
    {...EndpointDefaults, endpoint: 47, appprofid: 0x0104},
    {...EndpointDefaults, endpoint: 242, appprofid: 0xa1e0},
];

async function validateItem(
    znp: Znp, item: NvItem, message: string, subsystem = Subsystem.SYS, command = 'osalNvRead',
    expectedStatus: number[] = [0]
): Promise<boolean> {
    const result = await znp.request(subsystem, command, item, expectedStatus);

    if (!equals(result.payload.value, item.value)) {
        debug(
            `Item '${message}' is invalid, got '${JSON.stringify(result.payload.value)}', ` +
            `expected '${JSON.stringify(item.value)}'`
        );
        return false;
    } else {
        debug(`Item '${message}' is valid`);
        return true;
    }
}

async function needsToBeInitialised(znp: Znp, version: ZnpVersion, options: TsType.NetworkOptions): Promise<boolean> {
    let valid = true;

    valid = valid && (await validateItem(
        znp, Items.znpHasConfigured(version), 'hasConfigured', Subsystem.SYS, 'osalNvRead', [0,2],
    ));
    valid = valid && (await validateItem(znp, Items.channelList(options.channelList), 'channelList'));
    valid = valid && (await validateItem(
        znp, Items.networkKeyDistribute(options.networkKeyDistribute), 'networkKeyDistribute'
    ));

    if (version === ZnpVersion.zStack3x0) {
        valid = valid && (await validateItem(znp, Items.networkKey(options.networkKey), 'networkKey'));
    } else {
        valid = valid && (await validateItem(
            znp, Items.networkKey(options.networkKey), 'networkKey', Subsystem.SAPI, 'readConfiguration'
        ));
    }

    if (valid) {
        valid = valid && (await validateItem(znp, Items.panID(options.panID), 'panID'));
        valid = valid && (await validateItem(znp, Items.extendedPanID(options.extendedPanID), 'extendedPanID'));

        if (!valid) {
            if (version === ZnpVersion.zStack30x || version === ZnpVersion.zStack3x0) {
                // Zigbee-herdsman =< 0.6.5 didn't set the panID and extendedPanID on zStack 3.
                // As we are now checking it, it would trigger a reinitialise which will cause users
                // to lose their network. Therefore we are ignoring this case.
                // When the panID has never been set, it will be [0xFF, 0xFF].
                const current = await znp.request(Subsystem.SYS, 'osalNvRead', Items.panID(options.panID));
                if (Buffer.compare(current.payload.value, Buffer.from([0xFF, 0XFF])) === 0) {
                    debug('Skip enforcing panID because a random panID is used');
                    valid = true;
                }
            }
        }
    }

    return !valid;
}

async function boot(znp: Znp): Promise<void> {
    const result = await znp.request(Subsystem.UTIL, 'getDeviceInfo', {});

    if (result.payload.devicestate !== Constants.COMMON.devStates.ZB_COORD) {
        debug('Start ZNP as coordinator...');
        const started = znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'stateChangeInd', {state: 9}, 60000);
        znp.request(Subsystem.ZDO, 'startupFromApp', {startdelay: 100}, [0, 1]);
        await started.promise;
        debug('ZNP started as coordinator');
    } else {
        debug('ZNP is already started as coordinator');
    }
}

async function registerEndpoints(znp: Znp): Promise<void> {
    const activeEpResponse = znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'activeEpRsp');
    znp.request(Subsystem.ZDO, 'activeEpReq', {dstaddr: 0, nwkaddrofinterest: 0});
    const activeEp = await activeEpResponse.promise;

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
    debug('Initialising coordinator');
    await znp.request(Subsystem.SYS, 'resetReq', {type: Constants.SYS.resetType.SOFT});
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.startupOption(0x02));
    await znp.request(Subsystem.SYS, 'resetReq', {type: Constants.SYS.resetType.SOFT});
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.logicalType(Constants.ZDO.deviceLogicalType.COORDINATOR));
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.networkKeyDistribute(options.networkKeyDistribute));
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.zdoDirectCb());
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.channelList(options.channelList));
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.panID(options.panID));
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.extendedPanID(options.extendedPanID));

    if (version === ZnpVersion.zStack30x || version === ZnpVersion.zStack3x0) {
        await znp.request(Subsystem.SYS, 'osalNvWrite', Items.networkKey(options.networkKey));
        // Default link key is already OK for Z-Stack 3 ('ZigBeeAlliance09')
        const channelMask = Buffer.from(Constants.Utils.getChannelMask(options.channelList)).readUInt32LE(0);
        await znp.request(Subsystem.APP_CNF, 'bdbSetChannel', {isPrimary: 0x1, channel: channelMask});
        await znp.request(Subsystem.APP_CNF, 'bdbSetChannel', {isPrimary: 0x0, channel: 0x0});
        const started = znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'stateChangeInd', {state: 9}, 60000);
        await znp.request(Subsystem.APP_CNF, 'bdbStartCommissioning', {mode: 0x04});
        try {
            await started.promise;
        } catch (error) {
            throw new Error(
                'Coordinator failed to start, probably the panID is already in use, try a different panID or channel'
            );
        }

        await znp.request(Subsystem.APP_CNF, 'bdbStartCommissioning', {mode: 0x02});
    } else {
        await znp.request(Subsystem.SAPI, 'writeConfiguration', Items.networkKey(options.networkKey));
        await znp.request(Subsystem.SYS, 'osalNvWrite', Items.tcLinkKey());
    }

    // expect status code 9 (= item created and initialized)
    await znp.request(Subsystem.SYS, 'osalNvItemInit', Items.znpHasConfiguredInit(version), [0, 9]);
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.znpHasConfigured(version));
}

async function addToGroup(znp: Znp, endpoint: number, group: number): Promise<void> {
    const result = await znp.request(5, 'extFindGroup', {endpoint, groupid: group}, [0, 1]);
    if (result.payload.status === 1) {
        await znp.request(5, 'extAddGroup', {endpoint, groupid: group, namelen: 0, groupname:[]});
    }
}

export default async (
    znp: Znp, version: ZnpVersion, options: TsType.NetworkOptions, greenPowerGroup: number, backupPath?: string,
): Promise<TsType.StartResult> => {
    let result: TsType.StartResult = 'resumed';
    const hasConfigured = await validateItem(
        znp, Items.znpHasConfigured(version), 'hasConfigured', Subsystem.SYS, 'osalNvRead', [0,2]
    );

    // Restore from backup when the coordinator has never been configured yet.
    if (backupPath && fs.existsSync(backupPath) && !hasConfigured) {
        debug('Restoring coordinator from backup');
        await Restore(znp, backupPath, options);
        result = 'restored';
    } else if (await needsToBeInitialised(znp, version, options)) {
        await initialise(znp, version, options);

        if (version === ZnpVersion.zStack12) {
            // zStack12 allows to restore a network without restoring a backup (as long as the
            // networkey, panid and channel don't change).
            // If the device has not been configured yet we assume that this is the case.
            // If we always return 'reset' the controller clears the database on a reflash of the stick.
            result = hasConfigured ? 'reset' : 'restored';
        } else {
            result = 'reset';
        }
    }

    await boot(znp);
    await registerEndpoints(znp);

    // Add to required group to receive greenPower messages.
    await addToGroup(znp, 242, greenPowerGroup);

    if (result === 'restored') {
        // Write channellist again, otherwise it doesnt seem to stick.
        await znp.request(Subsystem.SYS, 'osalNvWrite', Items.channelList(options.channelList));
    }

    return result;
};