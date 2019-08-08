import {Znp} from '../znp';
import {Constants as UnpiConstants} from '../unpi';
import * as Constants from '../constants';
import equals from 'fast-deep-equal';
import * as TsType from '../../tstype';
import fs, { write } from 'fs';

const debug = require('debug')('zigbee-herdsman:controller:zStack:startZnp');
const Subsystem = UnpiConstants.Subsystem;
const NvItemsIds = Constants.COMMON.nvItemIds;

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
        await validateItem(znp, items.znpHasConfigured(version), 'hasConfigured');

        // TODO: check for z-stack 3
        await validateItem(znp, items.panID(options.panID), 'panID');
        await validateItem(znp, items.extendedPanID(options.extenedPanID), 'extendedPanID');

        await validateItem(znp, items.channelList(options.channelList), 'channelList');
        await validateItem(znp, items.networkKeyDistribute(options.networkKeyDistribute), 'networkKeyDistribute');

        if (version === ZnpVersion.zStack3x0) {
            await validateItem(znp, items.networkKey(options.networkKey), 'networkKey');
        } else {
            await validateItem(znp, items.networkKey(options.networkKey), 'networkKey', Subsystem.SAPI, 'readConfiguration');
        }

        return false;
    } catch (e) {
        return true;
    }
}

async function boot(znp: Znp): Promise<void> {
    const result = await znp.request(Subsystem.UTIL, 'getDeviceInfo', {});

    if (result.payload.devicestate !== Constants.COMMON.devStates.ZB_COORD) {
        debug('Start ZNP as coordinator...');
        const started = znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'stateChangeInd', {state: 9})
        znp.request(Subsystem.ZDO, 'startupFromApp', {startdelay: 100});
        await started;
        debug('ZNP started as coordinator');
    } else {
        debug('ZNP is already started as coordinator');
    }
}

async function restore(backupPath: string): Promise<void> {
    // TODO
}

async function initialise(znp: Znp, version: ZnpVersion, options: TsType.NetworkOptions): Promise<void> {
    debug('Executing soft reset');
    await znp.request(Subsystem.SYS, 'resetReq', {type: Constants.SYS.resetType.SOFT});

    await writeItem(znp, items.startupOption(0x02), 'startupOption');

    debug('Executing soft reset');
    await znp.request(Subsystem.SYS, 'resetReq', {type: Constants.SYS.resetType.SOFT});

    await writeItem(znp, items.logicalType(Constants.ZDO.deviceLogicalType.COORDINATOR), 'startupOption');
    await writeItem(znp, items.networkKeyDistribute(options.networkKeyDistribute), 'networkKeyDistribute');
    await writeItem(znp, items.zdoDirectCb(), 'zdoDirectCb');
    await writeItem(znp, items.channelList(options.channelList), 'channelList');

    if (version === ZnpVersion.zStack30x || version === ZnpVersion.zStack3x0) {
        await writeItem(znp, items.networkKey(options.networkKey), 'networkKey');
        // TODO for z-stack 3
        // Set panid and extended pan id
        //         function () { return self.request('APP_CNF', 'bdbSetChannel', {isPrimary: 0x1, channel: channel}).delay(10); },
        //         function () { return self.request('APP_CNF', 'bdbSetChannel', {isPrimary: 0x0, channel: 0x0}).delay(10); },
        //         function () { return self.request('APP_CNF', 'bdbStartCommissioning', {mode: 0x04}).delay(5000); },
        //         function () { return self.request('APP_CNF', 'bdbStartCommissioning', {mode: 0x02}).delay(10); },
    } else {
        await writeItem(znp, items.panID(options.panID), 'panID');
        await writeItem(znp, items.extendedPanID(options.extenedPanID), 'extendedPanID');
        await writeItem(znp, items.networkKey(options.networkKey), 'networkKey', Subsystem.SAPI, 'writeConfiguration');
        await writeItem(znp, items.tcLinkKey(), 'tcLinkKey');
    }

    await writeItem(znp, items.znpHasConfigured(version), 'hasConfigured');
}

export default async (znp: Znp, options: TsType.NetworkOptions, backupPath?: string): Promise<void> => {
    let result;

    result = await znp.request(Subsystem.SYS, 'version', {});
    const version: ZnpVersion = result.payload.product;

    debug(`Detected znp version '${ZnpVersion[version]}'`);

    if (await needsToBeInitialised(znp, version, options)) {
        debug('Reinitialising coordinator');
        if (backupPath && fs.existsSync(backupPath)) {
            await restore(backupPath);
        } else {
            await initialise(znp, version, options);
        }
    }

    await boot(znp);

    // After startup, write the channel again, otherwise the channel is not always persisted in the NV.
    // Not sure why this is needed.
    await writeItem(znp, items.channelList(options.channelList), 'channelList');
};