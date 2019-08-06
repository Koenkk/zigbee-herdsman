import {Znp} from '../../znp';
import {Constants as UnpiConstants} from '../../unpi';
import * as Zsc from '../../zstack-constants';
import equals from 'fast-deep-equal';
import * as TsType from '../tstype';
import fs from 'fs';

const debug = require('debug')('zigbee-herdsman:controller:helpers:startZnp');
const Subsystem = UnpiConstants.Subsystem;
const NvItemsIds = Zsc.COMMON.nvItemIds;

enum ZnpVersion {
    zStack12 = 0,
    zStack3x0 = 1,
    zStack30x = 2,
}

interface NvItem {
    id: number;
    configid?: number;
    offset: number;
    len: number;
    value: Buffer;
}

const items = {
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
            value: Buffer.from(Zsc.Utils.getChannelMask(channelList)),
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
}

async function validateItem(znp: Znp, item: NvItem, message: string, subsystem = Subsystem.SYS, command = 'osalNvRead'): Promise<void> {
    const result = await znp.request(subsystem, command, item);

    if (!equals(result.payload.value, item.value)) {
        debug(`Item '${message}' is invalid, got '${JSON.stringify(result.payload.value)}', expected '${JSON.stringify(item.value)}'`);
        throw new Error();
    } else {
        debug(`Item '${message}' is valid`);
    }
}

async function writeItem(znp: Znp, item: NvItem, message: string, subsystem = Subsystem.SYS, command = 'osalNvWrite'): Promise<void> {
    debug(`Write '${message}'`);
    await znp.request(subsystem, command, item);
}

async function needsToBeInitialised(znp: Znp, version: ZnpVersion, options: TsType.NetworkOptions): Promise<boolean> {
    try {
        // TODO: probably not working for z-stack 3
        validateItem(znp, items.znpHasConfigured(version), 'hasConfigured');

        // TODO: enable for z-stack 3
        if (version === ZnpVersion.zStack12) {
            validateItem(znp, items.panID(options.panID), 'panID');
            validateItem(znp, items.extendedPanID(options.extenedPanID), 'extendedPanID');
        }

        validateItem(znp, items.channelList(options.channelList), 'channelList');
        validateItem(znp, items.networkKeyDistribute(options.networkKeyDistribute), 'networkKeyDistribute');

        if (version === ZnpVersion.zStack3x0) {
            validateItem(znp, items.networkKey(options.networkKey), 'networkKey');
        } else {
            validateItem(znp, items.networkKey(options.networkKey), 'networkKey', Subsystem.SAPI, 'readConfiguration');
        }

        return false;
    } catch {
        return true;
    }
}

async function boot(znp: Znp): Promise<void> {
    const result = await znp.request(Subsystem.UTIL, 'getDeviceInfo', {});

    if (result.payload.devicestate !== Zsc.COMMON.devStates.ZB_COORD) {
        debug('Start ZNP as coordinator...');
        const started = znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'stateChangeInd', {state: 9})
        znp.request(Subsystem.ZDO, 'startupFromApp', {startdelay: 100});
        await started;
        debug('ZNP started as coordinator');
    } else {
        debug('ZNP is already a coordinator');
    }
}

async function restore(backupPath: string): Promise<void> {
    // TODO
}

async function initialise(znp: Znp, version: ZnpVersion, options: TsType.NetworkOptions): Promise<void> {
    // TODO
}

export default async (znp: Znp, options: TsType.NetworkOptions, coordinatorBackupPath?: string): Promise<void> => {
    let result;

    result = await znp.request(Subsystem.SYS, 'version', {});
    const version: ZnpVersion = result.payload.product;

    debug(`Detected znp version '${ZnpVersion[version]}'`);

    if (await needsToBeInitialised(znp, version, options)) {
        if (coordinatorBackupPath && fs.existsSync(coordinatorBackupPath)) {
            await restore(coordinatorBackupPath);
        } else {
            await initialise(znp, version, options);
        }
    }

    await boot(znp);

    // After startup, write the channel again, otherwise the channel is not always persisted in the NV.
    // Not sure why this is needed.
    await writeItem(znp, items.channelList(options.channelList), 'channelList');
};