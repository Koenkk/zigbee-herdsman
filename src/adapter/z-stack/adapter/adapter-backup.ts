/* eslint-disable max-len */
import {Znp} from "../znp";
import * as Models from "../models";
import * as Structs from "../structs";
import * as Utils from "../utils";
import {fs} from "mz";
import {AdapterNvMemory} from "./adapter-nv-memory";
import {NvItemsIds, NvSystemIds} from "../constants/common";
import {Subsystem} from "../unpi/constants";
import {ZnpVersion} from "./tstype";
import {AddressManagerUser} from "../structs";
import {send} from "process";

export class AdapterBackup {

    private znp: Znp;
    private nv: AdapterNvMemory;
    private defaultPath: string;

    public constructor(znp: Znp, nv: AdapterNvMemory, path: string) {
        this.znp = znp;
        this.nv = nv;
        this.defaultPath = path;
    }

    public async getStoredBackup(): Promise<Models.Backup> {
        try {
            await fs.access(this.defaultPath);
        } catch (error) {
            return null;
        }
        const data = JSON.parse((await fs.readFile(this.defaultPath)).toString());
        if (data.metadata?.internal?.zhFormat === 2) {
            return this.fromUnifiedBackup(data as Models.UnifiedBackupStorage);
        } else if (data.adapterType === "zStack") {
            return this.fromLegacyBackup(data as Models.LegacyBackupStorage);
        } else {
            throw new Error("Unknown backup format");
        }
    }

    public async createBackup(): Promise<Models.Backup> {
        const versionResponse = await this.znp.request(Subsystem.SYS, "version", {});
        const version: ZnpVersion = versionResponse.payload.product;
        if (version === ZnpVersion.zStack12) {
            throw new Error("Backup is not supported for Z-Stack 1.2");
        }
        
        /* get adapter ieee address */
        const ieeeAddressResponse = await this.znp.request(Subsystem.SYS, "getExtAddr", {});
        if (!ieeeAddressResponse || !ieeeAddressResponse.payload.extaddress || !ieeeAddressResponse.payload.extaddress.startsWith("0x")) {
            throw new Error("Failed to read adapter IEEE address");
        }
        const ieeeAddress = Buffer.from(ieeeAddressResponse.payload.extaddress.split("0x")[1], "hex");

        /* get adapter nib */
        const nib = await this.nv.readItem(NvItemsIds.NIB, 0, Structs.nvNIB);
        if (!nib) {
            throw new Error("Cannot backup - adapter not commissioned");
        } 

        /* get adapter active key information */
        const activeKeyInfo = await this.nv.readItem(NvItemsIds.NWK_ACTIVE_KEY_INFO, 0, Structs.nwkKeyDescriptor);
        if (!activeKeyInfo) {
            throw new Error("Cannot backup - missing active key info");
        }

        /* get adapter security data */
        const preconfiguredKeyEnabled = await this.nv.readItem(NvItemsIds.PRECFGKEYS_ENABLE, 0);
        const addressManagerTable =  version === ZnpVersion.zStack30x ?
            await this.nv.readItem(NvItemsIds.ADDRMGR, 0, Structs.addressManagerTable) :
            {entries: await this.nv.readTable("extended", NvSystemIds.ZSTACK, NvItemsIds.ZCD_NV_EX_ADDRMGR, undefined, Structs.addressManagerEntry) || []};
        const securityManagerTable = await this.nv.readItem(NvItemsIds.APS_LINK_KEY_TABLE, 0, Structs.securityManagerTable);
        const apsLinkKeyDataTable = version === ZnpVersion.zStack30x ?
            await this.nv.readTable("legacy", NvItemsIds.APS_LINK_KEY_DATA_START, 255, Structs.apsLinkKeyDataEntry) :
            await this.nv.readTable("extended", NvSystemIds.ZSTACK, NvItemsIds.ZCD_NV_EX_APS_KEY_DATA_TABLE, undefined, Structs.apsLinkKeyDataEntry);
        const tclkSeed = await this.nv.readItem(NvItemsIds.TCLK_SEED, 0, Structs.nwkKey);
        const tclkTable = version === ZnpVersion.zStack30x ?
            await this.nv.readTable("legacy", NvItemsIds.LEGACY_TCLK_TABLE_START, 239, Structs.apsTcLinkKeyEntry) :
            await this.nv.readTable("extended", NvSystemIds.ZSTACK, NvItemsIds.EX_TCLK_TABLE, undefined, Structs.apsTcLinkKeyEntry);
        let secMaterialTable = version === ZnpVersion.zStack30x ?
            await this.nv.readTable("legacy", NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START, 12, Structs.nwkSecMaterialDescriptor) :
            await this.nv.readTable("extended", NvSystemIds.ZSTACK, NvItemsIds.EX_NWK_SEC_MATERIAL_TABLE, undefined, Structs.nwkSecMaterialDescriptor);
        secMaterialTable = secMaterialTable.filter(e => e.isSet());

        console.log(addressManagerTable.entries);

        /* examine network security material table */
        const genericExtendedPanId = Buffer.alloc(8, 0xff);
        let secMaterialDescriptor: ReturnType<typeof Structs.nwkSecMaterialDescriptor> = null;
        for (const entry of secMaterialTable) {
            if (entry.extendedPanID.equals(nib.extendedPANID)) {
                secMaterialDescriptor = entry;
                break;
            } else if (!secMaterialDescriptor && entry.extendedPanID.equals(genericExtendedPanId)) {
                secMaterialDescriptor = entry;
            }
        }

        if (!secMaterialDescriptor) {
            secMaterialDescriptor = Structs.nwkSecMaterialDescriptor();
            secMaterialDescriptor.extendedPanID = nib.extendedPANID;
            secMaterialDescriptor.FrameCounter = 1250;
        }

        /* return backup structure */
        return {
            networkOptions: {
                panId: nib.nwkPanId,
                extendedPanId: nib.extendedPANID,
                channelList: Utils.unpackChannelList(nib.channelList),
                networkKey: activeKeyInfo.key,
                networkKeyDistribute: preconfiguredKeyEnabled && preconfiguredKeyEnabled[0] === 0x01
            },
            logicalChannel: nib.nwkLogicalChannel,
            trustCenterLinkKeySeed: tclkSeed.key,
            networkKeyInfo: {
                sequenceNumber: activeKeyInfo.keySeqNum,
                frameCounter: secMaterialDescriptor.FrameCounter
            },
            securityLevel: nib.SecurityLevel,
            networkUpdateId: nib.nwkUpdateId,
            coordinatorIeeeAddress: ieeeAddress,
            devices: addressManagerTable && addressManagerTable.entries.map((ame, ami) => {
                if (ame.nwkAddr === 0xfffe || (ame.user & AddressManagerUser.Assoc) === 0) {
                    return null;
                }
                let linkKeyInfo: { key: Buffer, rxCounter: number, txCounter: number } = null;
                const sme = securityManagerTable.used.find(e => e.ami === ami);
                if (sme) {
                    const apsKeyDataIndex = version === ZnpVersion.zStack30x ? sme.keyNvId - NvItemsIds.APS_LINK_KEY_DATA_START : sme.keyNvId;
                    const apsKeyData = apsLinkKeyDataTable[apsKeyDataIndex] || null;
                    if (apsKeyData) {
                        linkKeyInfo = {
                            key: apsKeyData.key,
                            rxCounter: apsKeyData.rxFrmCntr,
                            txCounter: apsKeyData.txFrmCntr
                        };
                    }
                } else {
                    const tclkTableEntry = tclkTable.find(e => e.extAddr.equals(ame.extAddr));
                    if (tclkTableEntry) {
                        const rotatedSeed = Buffer.concat([tclkSeed.key.slice(tclkTableEntry.SeedShift_IcIndex), tclkSeed.key.slice(0, tclkTableEntry.SeedShift_IcIndex)]);
                        const extAddrReversed = Buffer.from(ame.extAddr).reverse();
                        const extAddrRepeated = Buffer.concat([extAddrReversed, extAddrReversed]);
                        const derivedKey = Buffer.alloc(16);
                        for (let i = 0; i < 16; i++) {
                            derivedKey[i] = rotatedSeed[i] ^ extAddrRepeated[i];
                        }
                        linkKeyInfo = {
                            key: derivedKey,
                            rxCounter: tclkTableEntry.rxFrmCntr,
                            txCounter: tclkTableEntry.txFrmCntr
                        };
                    }
                }
                return {
                    networkAddress: ame.nwkAddr,
                    ieeeAddress: ame.extAddr,
                    linkKey: !linkKeyInfo ? undefined : linkKeyInfo
                }; 
            }).filter(e => e) || []
        };
    }

    public toUnifiedBackup(backup: Models.Backup): Models.UnifiedBackupStorage {
        return {
            metadata: {
                version: [0, 1],
                source: "zigbee2mqtt",
                internal: {
                    zhFormat: 2
                }
            },
            stack_specific: {
                zstack: {
                    tclk_seed: backup.trustCenterLinkKeySeed?.toString("hex") || undefined
                }
            },
            coordinator_ieee: backup.coordinatorIeeeAddress?.toString("hex") || null,
            pan_id: backup.networkOptions.panId,
            extended_pan_id: backup.networkOptions.extendedPanId.toString("hex"),
            nwk_update_id: backup.networkUpdateId || 0,
            security_level: backup.securityLevel || null,
            channel: backup.logicalChannel,
            channel_mask: backup.networkOptions.channelList,
            network_key: {
                key: backup.networkOptions.networkKey.toString("hex"),
                sequence_number: backup.networkKeyInfo.sequenceNumber,
                frame_counter: backup.networkKeyInfo.frameCounter
            },
            devices: backup.devices.map(device => ({
                nwk_address: device.networkAddress,
                ieee_address: device.ieeeAddress.toString("hex"),
                link_key: !device.linkKey ? undefined : {
                    key: device.linkKey.key.toString("hex"),
                    rx_counter: device.linkKey.rxCounter,
                    tx_counter: device.linkKey.txCounter
                }
            }))
        };
    }

    public fromUnifiedBackup(backup: Models.UnifiedBackupStorage): Models.Backup {
        const tclkSeedString = backup.stack_specific?.zstack?.tclk_seed || null;
        return {
            networkOptions: {
                panId: backup.pan_id,
                extendedPanId: Buffer.from(backup.extended_pan_id, "hex"),
                channelList: backup.channel_mask,
                networkKey: Buffer.from(backup.network_key.key, "hex"),
                networkKeyDistribute: false
            },
            logicalChannel: backup.channel,
            networkKeyInfo: {
                sequenceNumber: backup.network_key.sequence_number,
                frameCounter: backup.network_key.frame_counter
            },
            coordinatorIeeeAddress: backup.coordinator_ieee ? Buffer.from(backup.coordinator_ieee, "hex") : null,
            securityLevel: backup.security_level || null,
            networkUpdateId: backup.nwk_update_id || null,
            trustCenterLinkKeySeed: tclkSeedString ? Buffer.from(tclkSeedString, "hex") : undefined,
            devices: backup.devices.map(device => ({
                networkAddress: device.nwk_address,
                ieeeAddress: Buffer.from(device.ieee_address, "hex"),
                linkKey: !device.link_key ? undefined : {
                    key: Buffer.from(device.link_key.key),
                    rxCounter: device.link_key.rx_counter,
                    txCounter: device.link_key.tx_counter
                }
            }))
        };
    }

    public fromLegacyBackup(backup: Models.LegacyBackupStorage): Models.Backup {
        if (!backup.data.ZCD_NV_NIB) {
            throw new Error("Backup corrupted - missing NIB");
        } else if (!backup.data.ZCD_NV_NWK_ACTIVE_KEY_INFO) {
            throw new Error("Backup corrupted - missing active key info");
        } else if (!backup.data.ZCD_NV_PRECFGKEY_ENABLE) {
            throw new Error("Backup corrupted - missing pre-configured key enable attribute");
        } else if (!backup.data.ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE && !backup.data.ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START) {
            throw new Error("Backup corrupted - missing network security material table");
        } else if (!backup.data.ZCD_NV_EXTADDR) {
            throw new Error("Backup corrupted - missing adapter IEEE address NV entry"); 
        }
        const ieeeAddress = Buffer.from(backup.data.ZCD_NV_EXTADDR.value).reverse();
        const nib = Structs.nvNIB(Buffer.from(backup.data.ZCD_NV_NIB.value));
        const activeKeyInfo = Structs.nwkKeyDescriptor(Buffer.from(backup.data.ZCD_NV_NWK_ACTIVE_KEY_INFO.value));
        const preconfiguredKeyEnabled = backup.data.ZCD_NV_PRECFGKEY_ENABLE.value[0] !== 0x00;
        const nwkSecMaterialSource = backup.data.ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE || backup.data.ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START;
        const nwkSecMaterialEntry = Structs.nwkSecMaterialDescriptor(Buffer.from(nwkSecMaterialSource.value));

        return {
            networkOptions: {
                panId: nib.nwkPanId,
                extendedPanId: nib.extendedPANID,
                channelList: Utils.unpackChannelList(nib.channelList),
                networkKey: activeKeyInfo.key,
                networkKeyDistribute: preconfiguredKeyEnabled
            },
            logicalChannel: nib.nwkLogicalChannel,
            networkKeyInfo: {
                sequenceNumber: activeKeyInfo.keySeqNum,
                frameCounter: nwkSecMaterialEntry.FrameCounter
            },
            coordinatorIeeeAddress: ieeeAddress,
            securityLevel: nib.SecurityLevel,
            networkUpdateId: nib.nwkUpdateId,
            devices: []
        };
    }
}
