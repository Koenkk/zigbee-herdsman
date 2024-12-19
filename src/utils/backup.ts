import * as fs from 'node:fs';
import * as path from 'node:path';

import * as ZStackStructs from '../adapter/z-stack/structs';
import * as ZStackUtils from '../adapter/z-stack/utils';
import * as Models from '../models';

/**
 * Converts internal backup format to unified backup storage format as described by
 * [zigpy/open-coordinator-backup](https://github.com/zigpy/open-coordinator-backup).
 *
 * @param backup Backup to create unified backup format from.
 */
export const toUnifiedBackup = async (backup: Models.Backup): Promise<Models.UnifiedBackupStorage> => {
    const packageInfo = JSON.parse(fs.readFileSync(path.join(__dirname, '../../', 'package.json')).toString());

    return {
        metadata: {
            format: 'zigpy/open-coordinator-backup',
            version: 1,
            source: `${packageInfo.name}@${packageInfo.version}`,
            internal: {
                date: new Date().toISOString(),
                ...(backup.znp ? {znpVersion: backup.znp?.version ?? undefined} : /* v8 ignore next */ undefined),
                ...(backup.ezsp ? {ezspVersion: backup.ezsp?.version ?? undefined} : /* v8 ignore next */ undefined),
            },
        },
        stack_specific: {
            /* v8 ignore next */
            ...(backup.znp ? {zstack: {tclk_seed: backup.znp?.trustCenterLinkKeySeed?.toString('hex') || undefined}} : undefined),
            ...(backup.ezsp ? {ezsp: {hashed_tclk: backup.ezsp?.hashed_tclk?.toString('hex') || undefined}} : /* v8 ignore next */ undefined),
        },
        coordinator_ieee: backup.coordinatorIeeeAddress.toString('hex'),
        pan_id: backup.networkOptions.panId.toString(16),
        extended_pan_id: backup.networkOptions.extendedPanId.toString('hex'),
        nwk_update_id: backup.networkUpdateId || 0,
        security_level: backup.securityLevel,
        channel: backup.logicalChannel,
        channel_mask: backup.networkOptions.channelList,
        network_key: {
            key: backup.networkOptions.networkKey.toString('hex'),
            sequence_number: backup.networkKeyInfo.sequenceNumber,
            frame_counter: backup.networkKeyInfo.frameCounter,
        },
        devices: backup.devices.map((device) => {
            return {
                nwk_address: device.networkAddress !== null ? device.networkAddress.toString(16) : /* v8 ignore next */ null,
                ieee_address: device.ieeeAddress.toString('hex'),
                is_child: device.isDirectChild,
                link_key: device.linkKey
                    ? {key: device.linkKey.key.toString('hex'), rx_counter: device.linkKey.rxCounter, tx_counter: device.linkKey.txCounter}
                    : undefined,
            };
        }),
    };
};

/**
 * Converts unified backup storage format to internal backup format.
 *
 * @param backup Unified format to convert to internal backup format.
 */
export const fromUnifiedBackup = (backup: Models.UnifiedBackupStorage): Models.Backup => {
    const tclkSeedString = backup.stack_specific?.zstack?.tclk_seed || undefined;

    return {
        networkOptions: {
            panId: Number.parseInt(backup.pan_id, 16),
            extendedPanId: Buffer.from(backup.extended_pan_id, 'hex'),
            channelList: backup.channel_mask,
            networkKey: Buffer.from(backup.network_key.key, 'hex'),
            networkKeyDistribute: false,
        },
        logicalChannel: backup.channel,
        networkKeyInfo: {
            sequenceNumber: backup.network_key.sequence_number,
            frameCounter: backup.network_key.frame_counter,
        },
        coordinatorIeeeAddress: Buffer.from(backup.coordinator_ieee, 'hex'),
        securityLevel: backup.security_level,
        networkUpdateId: backup.nwk_update_id,
        devices: backup.devices.map((device) => ({
            networkAddress: device.nwk_address ? Number.parseInt(device.nwk_address, 16) : null,
            ieeeAddress: Buffer.from(device.ieee_address, 'hex'),
            isDirectChild: typeof device.is_child === 'boolean' ? device.is_child : true,
            linkKey: device.link_key
                ? {key: Buffer.from(device.link_key.key, 'hex'), rxCounter: device.link_key.rx_counter, txCounter: device.link_key.tx_counter}
                : undefined,
        })),
        znp: {
            version: backup.metadata.internal?.znpVersion || undefined,
            trustCenterLinkKeySeed: tclkSeedString ? Buffer.from(tclkSeedString, 'hex') : undefined,
        },
        ezsp: {
            version: backup.metadata.internal?.ezspVersion || undefined,
            hashed_tclk: backup.stack_specific?.ezsp?.hashed_tclk ? Buffer.from(backup.stack_specific.ezsp.hashed_tclk, 'hex') : undefined,
        },
    };
};

/**
 * Converts legacy Zigbee2MQTT format to internal backup format.
 *
 * @param backup Legacy format to convert.
 */
export const fromLegacyBackup = (backup: Models.LegacyBackupStorage): Models.Backup => {
    if (!backup.data.ZCD_NV_NIB) {
        throw new Error('Backup corrupted - missing NIB');
    } else if (!backup.data.ZCD_NV_NWK_ACTIVE_KEY_INFO) {
        throw new Error('Backup corrupted - missing active key info');
    } else if (!backup.data.ZCD_NV_PRECFGKEY_ENABLE) {
        throw new Error('Backup corrupted - missing pre-configured key enable attribute');
    } else if (!backup.data.ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE && !backup.data.ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START) {
        throw new Error('Backup corrupted - missing network security material table');
    } else if (!backup.data.ZCD_NV_EXTADDR) {
        throw new Error('Backup corrupted - missing adapter IEEE address NV entry');
    }

    const ieeeAddress = Buffer.from(backup.data.ZCD_NV_EXTADDR.value).reverse();
    const nib = ZStackStructs.nib(Buffer.from(backup.data.ZCD_NV_NIB.value));
    const activeKeyInfo = ZStackStructs.nwkKeyDescriptor(Buffer.from(backup.data.ZCD_NV_NWK_ACTIVE_KEY_INFO.value));
    const preconfiguredKeyEnabled = backup.data.ZCD_NV_PRECFGKEY_ENABLE.value[0] !== 0x00;
    const nwkSecMaterialSource = backup.data.ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE || backup.data.ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START;
    const nwkSecMaterialEntry = ZStackStructs.nwkSecMaterialDescriptorEntry(Buffer.from(nwkSecMaterialSource.value));

    return {
        networkOptions: {
            panId: nib.nwkPanId,
            extendedPanId: nib.extendedPANID,
            channelList: ZStackUtils.unpackChannelList(nib.channelList),
            networkKey: activeKeyInfo.key,
            networkKeyDistribute: preconfiguredKeyEnabled,
        },
        logicalChannel: nib.nwkLogicalChannel,
        networkKeyInfo: {
            sequenceNumber: activeKeyInfo.keySeqNum,
            frameCounter: nwkSecMaterialEntry.FrameCounter,
        },
        coordinatorIeeeAddress: ieeeAddress,
        securityLevel: nib.SecurityLevel,
        networkUpdateId: nib.nwkUpdateId,
        devices: [],
    };
};
