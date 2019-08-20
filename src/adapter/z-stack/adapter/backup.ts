import * as Constants from '../constants';
import {Backup as BackupType, NetworkOptions} from '../../tstype';
import {ZnpVersion} from './tstype';
import {Znp} from '../znp';
import {Subsystem} from '../unpi/constants';
import fs from 'fs';
import equals from 'fast-deep-equal';
import Items from './nvItems';

const NvItemsIds = Constants.COMMON.nvItemIds;

const items = {
    ZCD_NV_EXTADDR: {
        id: NvItemsIds.EXTADDR,
        offset: 0x00
    },
    ZCD_NV_NIB: {
        id: NvItemsIds.NIB,
        offset: 0x00
    },
    ZCD_NV_EXTENDED_PAN_ID: {
        id: NvItemsIds.EXTENDED_PAN_ID,
        offset: 0x00
    },
    ZCD_NV_NWK_ACTIVE_KEY_INFO: {
        id: NvItemsIds.NWK_ACTIVE_KEY_INFO,
        offset: 0x00
    },
    ZCD_NV_NWK_ALTERN_KEY_INFO: {
        id: NvItemsIds.NWK_ALTERN_KEY_INFO,
        offset: 0x00
    },
    ZCD_NV_APS_USE_EXT_PANID: {
        id: NvItemsIds.APS_USE_EXT_PANID,
        offset: 0x00
    },
    ZCD_NV_PRECFGKEY: {
        id: NvItemsIds.PRECFGKEY,
        offset: 0x00
    },
    ZCD_NV_PRECFGKEY_ENABLE: {
        id: NvItemsIds.PRECFGKEYS_ENABLE,
        offset: 0x00
    },
    ZCD_NV_TCLK_TABLE_START: {
        id: NvItemsIds.TCLK_TABLE_START,
        offset: 0x00
    },
    ZCD_NV_CHANLIST: {
        id: NvItemsIds.CHANLIST,
        offset: 0x00,
    },
    ZCD_NV_NWK_SEC_MATERIAL_TABLE_START: {
        id: NvItemsIds.NWK_SEC_MATERIAL_TABLE_START,
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
        const result = await znp.request(Subsystem.SYS, 'osalNvRead', entry);
        data[key] = {...entry, value: result.payload.value.toJSON().data, len: result.payload.value.length};
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

    if (backup.meta.product != product) {
        throw new Error(
            `Cannot restore backup, backup is for '${ZnpVersion[backup.meta.product]}', ` +
            `current is '${ZnpVersion[product]}'`
        );
    }

    if (!equals(backup.data.ZCD_NV_CHANLIST.value, Constants.Utils.getChannelMask(options.channelList))) {
        throw new Error(`Cannot restore backup, channel of backup is different`);
    }

    if (!equals(backup.data.ZCD_NV_PRECFGKEY.value, options.networkKey)) {
        throw new Error(`Cannot restore backup, networkKey of backup is different`);
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

    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_EXTADDR);
    await znp.request(Subsystem.SYS, 'osalNvItemInit', ZCD_NV_NIB, [9]);
    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_EXTENDED_PAN_ID);
    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_NWK_ACTIVE_KEY_INFO);
    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_NWK_ALTERN_KEY_INFO);
    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_APS_USE_EXT_PANID);
    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_PRECFGKEY);
    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_PRECFGKEY_ENABLE);
    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_TCLK_TABLE_START);
    await znp.request(Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_NWK_SEC_MATERIAL_TABLE_START);
    await znp.request(Subsystem.SYS, 'osalNvItemInit', Items.znpHasConfiguredInit(product), [9]);
    await znp.request(Subsystem.SYS, 'osalNvWrite', Items.znpHasConfigured(product));
    await znp.request(Subsystem.SYS, 'osalNvItemInit', bdbNodeIsOnANetwork, [0, 9]);
    await znp.request(Subsystem.SYS, 'osalNvWrite', bdbNodeIsOnANetwork);
    await znp.request(Subsystem.SYS, 'resetReq', {type: Constants.SYS.resetType.SOFT});
}

export {Backup, Restore};