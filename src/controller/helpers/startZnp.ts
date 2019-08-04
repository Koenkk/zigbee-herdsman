import {Znp} from '../../znp';
import {Constants as UnpiConstants} from '../../unpi';
import * as Zsc from '../../zstack-constants';
import equals from 'fast-deep-equal';

const debug = require('debug')('controller:startZnp');
const Subsystem = UnpiConstants.Subsystem;
const NvItemsIds = Zsc.COMMON.nvItemIds;

enum ZnpVersion {
    zStack12 = 0,
    zStack3x0 = 1,
    zStack30x = 2,
}

interface NvItem {
    id: number;
    offset: number;
    len: number;
    value: Buffer;
}

interface NetworkOptions {
    panID: number;
    extenedPanID: number[];
    channelList: number[];
    networkKey: number[];
}

const channelListToBuffer = (channelList: number[]): Buffer => {
    let value = 0;

    for (let channel of channelList) {
        const key = Object.keys(Zsc.COMMON.logicalChannels).find((k: string): boolean => Zsc.COMMON.logicalChannels[k] === channel);
        console.log(key);
        value = value | Zsc.COMMON.channelMask[key];
    }
    return Buffer.from([value & 0xFF, (value >> 8) & 0xFF, (value >> 16) & 0xFF, (value >> 24) & 0xFF ]);
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
            value: channelListToBuffer(channelList),
        }
    }
}

async function validateItem(znp: Znp, item: NvItem, message: string): Promise<void> {
    const result = await znp.request(Subsystem.SYS, 'osalNvRead', item);

    if (!equals(result.payload.value, item.value)) {
        debug(`Item '${message}' is invalid, got '${JSON.stringify(result.payload.value)}', expected '${JSON.stringify(item.value)}'`);
        throw new Error();
    } else {
        debug(`Item '${message}' is valid`);
    }
}

async function needsToBeInitialised(znp: Znp, version: ZnpVersion, options: NetworkOptions): Promise<boolean> {
    try {
        // TODO: probably not working for z-stack 3
        validateItem(znp, items.znpHasConfigured(version), 'hasConfigured');

        // TODO: enable for z-stack 3
        if (version === ZnpVersion.zStack12) {
            validateItem(znp, items.panID(options.panID), 'panID');
            validateItem(znp, items.extendedPanID(options.extenedPanID), 'extendedPanID');
        }

        console.log(options, items.channelList(options.channelList));
        validateItem(znp, items.channelList(options.channelList), 'channelList');




        // steps = steps.concat([
        //     function () { return self.request('SYS', 'osalNvRead', nvParams.channelList).delay(10).then(function (rsp) {
        //         if (!_.isEqual(bufToArray(rsp.value), nvParams.channelList.value)) return Q.reject('reset');
        //     }) },
        //     function () { return self.request('SYS', 'osalNvRead', nvParams.precfgkeysEnable).delay(10).then(function (rsp) {
        //         if (!_.isEqual(bufToArray(rsp.value), nvParams.precfgkeysEnable.value)) return Q.reject('reset');
        //     }); }
        // ]);

        // if (self._isZstack3x0) {
        //     steps.push(
        //         function () { return self.request('SYS', 'osalNvRead', nvParams.precfgkey3).delay(10).then(function (rsp) {
        //             if (!_.isEqual(bufToArray(rsp.value), nvParams.precfgkey3.value)) return Q.reject('reset');
        //         }); },
        //     );
        // } else {
        //     steps.push(
        //         function () { return self.request('SAPI', 'readConfiguration', nvParams.precfgkey).delay(10).then(function (rsp) {
        //             if (!_.isEqual(bufToArray(rsp.value), nvParams.precfgkey.value)) return Q.reject('reset');
        //         }); },
        //     )
        // }


        return false;
    } catch {
        return true;
    }
}

export default async (znp: Znp, options: NetworkOptions): Promise<void> => {
    let result;

    result = await znp.request(Subsystem.SYS, 'version', {});
    const version: ZnpVersion = result.payload.product;

    debug(`Detected znp version '${ZnpVersion[version]}'`);

    if (await needsToBeInitialised(znp, version, options)) {

    } else {

    }

    // TODO add fore restore for znp3 result = znp.request(Subsystem.SYS, 'osalNvRead', nvParams.znpHasConfigured3)

    // if(self._isZstack3x0 || self._isZstack30x) {
    //     const cb = function (rsp) {
    //         if (rsp.message === 'rsp error: 2' || !_.isEqual(bufToArray(rsp.value), nvParams.znpHasConfigured3.value)) {
    //             if (self._shepherd._coordBackupPath && fs.existsSync(self._shepherd._coordBackupPath)) {
    //                 // not intialized and backup exists, restore from backup
    //                 return Q.reject('restore');
    //             } else {
    //                 return Q.reject('reset');
    //             }
    //         }
    //     }

    //     steps.push(
    //         function () { return self.request('SYS', 'osalNvRead', nvParams.znpHasConfigured3).delay(10).fail(cb).then(cb); },
    //     )
    // } else {
    //     steps = steps.concat([
    //         function () { return self.request('SYS', 'osalNvRead', nvParams.znpHasConfigured).delay(10).then(function (rsp) {
    //             if (!_.isEqual(bufToArray(rsp.value), nvParams.znpHasConfigured.value)) return Q.reject('reset');
    //         }); },
    //         function () { return self.request('SYS', 'osalNvRead', nvParams.panId).delay(10).then(function (rsp) {
    //             if (!_.isEqual(bufToArray(rsp.value), nvParams.panId.value)) return Q.reject('reset');
    //         }); },
    //         function () { return self.request('SYS', 'osalNvRead', nvParams.extPanId).delay(10).then(function (rsp) {
    //             if (!_.isEqual(bufToArray(rsp.value), nvParams.extPanId.value)) return Q.reject('reset');
    //         }); },
    //     ])
    // }

    // steps = steps.concat([
    //     function () { return self.request('SYS', 'osalNvRead', nvParams.channelList).delay(10).then(function (rsp) {
    //         if (!_.isEqual(bufToArray(rsp.value), nvParams.channelList.value)) return Q.reject('reset');
    //     }) },
    //     function () { return self.request('SYS', 'osalNvRead', nvParams.precfgkeysEnable).delay(10).then(function (rsp) {
    //         if (!_.isEqual(bufToArray(rsp.value), nvParams.precfgkeysEnable.value)) return Q.reject('reset');
    //     }); }
    // ]);

    // if (self._isZstack3x0) {
    //     steps.push(
    //         function () { return self.request('SYS', 'osalNvRead', nvParams.precfgkey3).delay(10).then(function (rsp) {
    //             if (!_.isEqual(bufToArray(rsp.value), nvParams.precfgkey3.value)) return Q.reject('reset');
    //         }); },
    //     );
    // } else {
    //     steps.push(
    //         function () { return self.request('SAPI', 'readConfiguration', nvParams.precfgkey).delay(10).then(function (rsp) {
    //             if (!_.isEqual(bufToArray(rsp.value), nvParams.precfgkey.value)) return Q.reject('reset');
    //         }); },
    //     )
    // }

    // return steps.reduce(function (soFar, fn) {
    //     return soFar.then(fn);
    // }, Q(0)).fail(function (err) {
    //     if (err === 'restore') {
    //         return self.restoreCoordinator(self._shepherd._coordBackupPath);
    //     } else if (err === 'reset' || err.message === 'rsp error: 2') {
    //         self._nvChanged = true;
    //         debug.init('Non-Volatile memory is changed.');
    //         return self.reset('hard');
    //     } else {
    //         return Q.reject(err);
    //     }
    // }).nodeify(callback);
};