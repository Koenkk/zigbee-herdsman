import * as Constants from '../constants';
import {Backup as BackupType, NetworkOptions} from '../../tstype';
import {ZnpVersion} from './tstype';
import {Znp} from '../znp';
import {Subsystem} from '../unpi/constants';
import fs from 'fs';
import equals from 'fast-deep-equal/es6';
import Items from './nvItems';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:adapter:zStack:backup');

const {NvItemsIds, NvSystemIds, ZnpCommandStatus} = Constants.COMMON;

const PRODUCT_ALL = -1;

const items = {
    ZCD_NV_EXTADDR: {
        id: NvItemsIds.EXTADDR,
        offset: 0x00,
        osal: true,
        product: PRODUCT_ALL,
    },
    ZCD_NV_NIB: {
        id: NvItemsIds.NIB,
        offset: 0x00,
        osal: true,
        product: PRODUCT_ALL,
    },
    ZCD_NV_PANID: {
        id: NvItemsIds.PANID,
        offset: 0x00,
        osal: true,
        product: PRODUCT_ALL,
    },
    ZCD_NV_EXTENDED_PAN_ID: {
        id: NvItemsIds.EXTENDED_PAN_ID,
        offset: 0x00,
        osal: true,
        product: PRODUCT_ALL,
    },
    ZCD_NV_NWK_ACTIVE_KEY_INFO: {
        id: NvItemsIds.NWK_ACTIVE_KEY_INFO,
        offset: 0x00,
        osal: true,
        product: PRODUCT_ALL,
    },
    ZCD_NV_NWK_ALTERN_KEY_INFO: {
        id: NvItemsIds.NWK_ALTERN_KEY_INFO,
        offset: 0x00,
        osal: true,
        product: PRODUCT_ALL,
    },
    ZCD_NV_APS_USE_EXT_PANID: {
        id: NvItemsIds.APS_USE_EXT_PANID,
        offset: 0x00,
        osal: true,
        product: PRODUCT_ALL,
    },
    ZCD_NV_PRECFGKEY: {
        id: NvItemsIds.PRECFGKEY,
        offset: 0x00,
        osal: true,
        product: PRODUCT_ALL,
    },
    ZCD_NV_PRECFGKEY_ENABLE: {
        id: NvItemsIds.PRECFGKEYS_ENABLE,
        offset: 0x00,
        osal: true,
        product: PRODUCT_ALL,
    },
    ZCD_NV_CHANLIST: {
        id: NvItemsIds.CHANLIST,
        offset: 0x00,
        osal: true,
        product: PRODUCT_ALL,
    },
    ZCD_NV_LEGACY_TCLK_TABLE_START: {
        id: NvItemsIds.LEGACY_TCLK_TABLE_START,
        product: ZnpVersion.zStack30x,
        offset: 0x00,
        osal: true,
    },
    ZCD_NV_EX_TCLK_TABLE: {
        sysid: NvSystemIds.ZSTACK,
        itemid: NvItemsIds.EX_TCLK_TABLE,
        subid: 0,
        product: ZnpVersion.zStack3x0,
        osal: false,
        offset: 0x00
    },
    ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START: {
        id: NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START,
        product: ZnpVersion.zStack30x,
        offset: 0x00,
        osal: true,
    },
    ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE: {
        sysid: NvSystemIds.ZSTACK,
        itemid: NvItemsIds.EX_NWK_SEC_MATERIAL_TABLE,
        subid: 0,
        product: ZnpVersion.zStack3x0,
        osal: false,
        offset: 0x00,
    }
};

async function Backup(znp: Znp): Promise<BackupType> {
    const product = (await znp.request(Subsystem.SYS, 'version', {})).payload.product;

    if (product !== ZnpVersion.zStack30x && product !== ZnpVersion.zStack3x0) {
        throw new Error('Backup is only supported for Z-Stack 3');
    }

    // eslint-disable-next-line
    const data: {[s: string]: any} = {};
    for (const [key, entry] of Object.entries(items)) {
        if (entry.product === PRODUCT_ALL || entry.product === product) {
            let result = null;
            if (entry.osal) {
                result = await znp.request(Subsystem.SYS, 'osalNvRead', entry);
            } else {
                const len = (await znp.request(Subsystem.SYS, 'nvLength', entry)).payload.len;
                result = await znp.request(Subsystem.SYS, 'nvRead', {...entry, len});
            }
            data[key] = {...entry, value: [...result.payload.value], len: result.payload.value.length};
        }
    }


    return {
        adapterType: 'zStack',
        time: new Date().toUTCString(),
        meta: {product},
        data,
    };
}

async function Restore(znp: Znp, backupPath: string, options: NetworkOptions): Promise<void> {
    const backup = JSON.parse(fs.readFileSync(backupPath).toString());
    const product = (await znp.request(Subsystem.SYS, 'version', {})).payload.product;

    if (backup.adapterType !== 'zStack') {
        throw new Error(`Cannot restore backup, backup is for '${backup.adapterType}', current is 'zStack'`);
    }

    if ((product !== ZnpVersion.zStack30x && product !== ZnpVersion.zStack3x0)
        || (backup.meta.product !== ZnpVersion.zStack30x && backup.meta.product !== ZnpVersion.zStack3x0 )) {
        throw new Error('Backup is only supported for Z-Stack 3');
    }

    // 3.0                                                    3.x
    // (0x0111)ZCD_NV_LEGACY_TCLK_TABLE_START              -> (0x0004)ZCD_NV_EX_TCLK_TABLE
    // (0x0075)ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START  -> (0x0007)ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE
    if (backup.meta.product == ZnpVersion.zStack30x && product == ZnpVersion.zStack3x0) {
        debug(`Migrate '${ZnpVersion[backup.meta.product]}' -> '${ZnpVersion[product]}'`);

        backup.data.ZCD_NV_EX_TCLK_TABLE = {
            ...items.ZCD_NV_EX_TCLK_TABLE,
            value: backup.data.ZCD_NV_LEGACY_TCLK_TABLE_START.value,
            len: backup.data.ZCD_NV_LEGACY_TCLK_TABLE_START.len,
        };

        backup.data.ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE = {
            ...items.ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE,
            value: backup.data.ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START.value,
            len: backup.data.ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START.len,
        };

    } else if (backup.meta.product == ZnpVersion.zStack3x0 &&  product == ZnpVersion.zStack30x) {
        debug(`Migrate '${ZnpVersion[backup.meta.product]}' -> '${ZnpVersion[product]}'`);

        backup.data.ZCD_NV_LEGACY_TCLK_TABLE_START = {
            ...items.ZCD_NV_LEGACY_TCLK_TABLE_START,
            value: backup.data.ZCD_NV_EX_TCLK_TABLE.value,
            len: backup.data.ZCD_NV_EX_TCLK_TABLE.len,
        };

        backup.data.ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START = {
            ...items.ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START,
            value: backup.data.ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE.value,
            len: backup.data.ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE.len,
        };
    }

    if (!equals(backup.data.ZCD_NV_CHANLIST.value, Constants.Utils.getChannelMask(options.channelList))) {
        throw new Error(`Cannot restore backup, channel of backup is different`);
    }

    if (!equals(backup.data.ZCD_NV_PRECFGKEY.value, options.networkKey)) {
        throw new Error(`Cannot restore backup, networkKey of backup is different`);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (!equals(backup.data.ZCD_NV_PANID.value, Array.from(Items.panID(options.panID).value))) {
        throw new Error(`Cannot restore backup, panID of backup is different`);
    }

    if (!equals(backup.data.ZCD_NV_EXTENDED_PAN_ID.value, options.extendedPanID)) {
        throw new Error(`Cannot restore backup, extendedPanID of backup is different`);
    }

    const ZCD_NV_NIB = {
        ...backup.data.ZCD_NV_NIB,
        initvalue: backup.data.ZCD_NV_NIB.value,
        initlen: backup.data.ZCD_NV_NIB.len,
    };

    const bdbNodeIsOnANetwork = {
        id: NvItemsIds.BDBNODEISONANETWORK,
        len: 0x01,
        offset: 0x0,
        value: [0x01],
        initlen: 0x01,
        initvalue: [0x01]
    };

    debug("Restoring backup");

    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_EXTADDR);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await znp.request(Subsystem.SYS, 'osalNvItemInit', ZCD_NV_NIB, null,
        [ZnpCommandStatus.SUCCESS, ZnpCommandStatus.NV_ITEM_INITIALIZED]);
    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_NIB);
    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_PANID);
    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_EXTENDED_PAN_ID);
    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_NWK_ACTIVE_KEY_INFO);
    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_NWK_ALTERN_KEY_INFO);
    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_APS_USE_EXT_PANID);
    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_PRECFGKEY);
    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_PRECFGKEY_ENABLE);

    if (product === ZnpVersion.zStack30x) {
        await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_LEGACY_TCLK_TABLE_START);
        await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START);
    } else {
        /* istanbul ignore else */
        if (product === ZnpVersion.zStack3x0) {
            await znp.request(Subsystem.SYS, 'nvWrite', backup.data.ZCD_NV_EX_TCLK_TABLE);
            await znp.request(Subsystem.SYS, 'nvWrite', backup.data.ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE);
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await znp.request(Subsystem.SYS, 'osalNvItemInit', Items.znpHasConfiguredInit(product), null,
        [ZnpCommandStatus.SUCCESS, ZnpCommandStatus.NV_ITEM_INITIALIZED]);
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.znpHasConfigured(product));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await znp.request(Subsystem.SYS, 'osalNvItemInit', bdbNodeIsOnANetwork, null,
        [ZnpCommandStatus.SUCCESS, ZnpCommandStatus.NV_ITEM_INITIALIZED]);
    await znp.request(Subsystem.SYS, 'osalNvWrite', bdbNodeIsOnANetwork);
    await znp.request(Subsystem.SYS, 'resetReq', {type: Constants.SYS.resetType.SOFT});
}

export {Backup, Restore};
