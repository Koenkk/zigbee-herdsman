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
import {nwkSecMaterialDescriptor} from "../structs";

export class AdapterBackup {

    private znp: Znp;
    private nv: AdapterNvMemory;
    private defaultPath: string;

    public constructor(znp: Znp, path: string) {
        this.znp = znp;
        this.defaultPath = path;
        this.nv = new AdapterNvMemory(this.znp);
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

        const ieeeAddressResponse = await this.znp.request(Subsystem.SYS, "getExtAddr", {});
        if (!ieeeAddressResponse || !ieeeAddressResponse.payload.extaddress || !ieeeAddressResponse.payload.extaddress.startsWith("0x")) {
            throw new Error("Failed to read adapter IEEE address");
        }
        const ieeeAddress = Buffer.from(ieeeAddressResponse.payload.extaddress.split("0x")[1], "hex");
        const nib = await this.nv.readItem(NvItemsIds.NIB, 0, Structs.nvNIB);
        const activeKeyInfo = await this.nv.readItem(NvItemsIds.NWK_ACTIVE_KEY_INFO, 0, Structs.nwkKeyDescriptor);
        const preconfiguredKeyEnabled = await this.nv.readItem(NvItemsIds.PRECFGKEYS_ENABLE, 0);
        if (!nib) {
            throw new Error("Cannot backup - adapter not commissioned");
        } else if (!activeKeyInfo) {
            throw new Error("Cannot backup - missing active key info");
        }
        const frameCounters: Models.Backup["frameCounters"][0][] = [];
        if (version === ZnpVersion.zStack30x) {
            const tableStart = NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START;
            const tableEnd = 0x0080;
            for (let i = tableStart; i <= tableEnd; i++) {
                const materialDescriptor = await this.nv.readItem(i, 0, nwkSecMaterialDescriptor);
                if (materialDescriptor && materialDescriptor.extendedPanID.compare(Buffer.alloc(8, 0x00)) !== 0) {
                    frameCounters.push({
                        extendedPanId: materialDescriptor.extendedPanID,
                        value: materialDescriptor.FrameCounter
                    });
                }
            }
        } else if (version === ZnpVersion.zStack3x0) {
            for (let i = 0; i < 10; i++) {
                const materialDescriptor = await this.nv.readExtendedTableEntry(NvSystemIds.ZSTACK, NvItemsIds.EX_NWK_SEC_MATERIAL_TABLE, i, 0, Structs.nwkSecMaterialDescriptor);
                if (materialDescriptor && materialDescriptor.extendedPanID.compare(Buffer.alloc(8, 0x00)) !== 0) {
                    frameCounters.push({
                        extendedPanId: materialDescriptor.extendedPanID,
                        value: materialDescriptor.FrameCounter
                    });
                }
            }
        }
        return {
            networkOptions: {
                panId: nib.nwkPanId,
                extendedPanId: nib.extendedPANID,
                channelList: Utils.unpackChannelList(nib.channelList),
                networkKey: activeKeyInfo.key,
                networkKeyDistribute: preconfiguredKeyEnabled && preconfiguredKeyEnabled[0] === 0x01
            },
            frameCounters,
            securityLevel: nib.SecurityLevel,
            networkUpdateId: nib.nwkUpdateId,
            coordinatorIeeeAddress: ieeeAddress
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
            pan_id: backup.networkOptions.panId,
            extended_pan_id: backup.networkOptions.extendedPanId.toString("hex"),
            channel_list: backup.networkOptions.channelList,
            coordinator_ieee: backup.coordinatorIeeeAddress?.toString("hex") || null,
            network_key: backup.networkOptions.networkKey.toString("hex"),
            nwk_update_id: backup.networkUpdateId || 0,
            security_level: backup.securityLevel || null,
            frame_counters: backup.frameCounters.map(counter => ({
                extended_pan_id: counter.extendedPanId.toString("hex"),
                value: counter.value
            }))
        };
    }

    public fromUnifiedBackup(backup: Models.UnifiedBackupStorage): Models.Backup {
        return {
            networkOptions: {
                panId: backup.pan_id,
                extendedPanId: Buffer.from(backup.extended_pan_id, "hex"),
                channelList: backup.channel_list,
                networkKey: Buffer.from(backup.network_key, "hex"),
                networkKeyDistribute: false
            },
            coordinatorIeeeAddress: backup.coordinator_ieee ? Buffer.from(backup.coordinator_ieee, "hex") : null,
            securityLevel: backup.security_level || null,
            networkUpdateId: backup.nwk_update_id || null,
            frameCounters: backup.frame_counters.map(counter => ({extendedPanId: Buffer.from(counter.extended_pan_id,"hex"), value: counter.value}))
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
        } else if (!backup.data.ZCD_NV_EX_TCLK_TABLE && !backup.data.ZCD_NV_LEGACY_TCLK_TABLE_START) {
            throw new Error("Backup corrupted - missing TC link key table");
        } else if (!backup.data.ZCD_NV_EXTADDR) {
            throw new Error("Backup corrupted - missing adapter IEEE address NV entry"); 
        }
        const ieeeAddress = Buffer.from(backup.data.ZCD_NV_EXTADDR.value).reverse();
        const nib = Structs.nvNIB(Buffer.from(backup.data.ZCD_NV_NIB.value));
        const activeKeyInfo = Structs.nwkKeyDescriptor(Buffer.from(backup.data.ZCD_NV_NWK_ACTIVE_KEY_INFO.value));
        const preconfiguredKeyEnabled = backup.data.ZCD_NV_PRECFGKEY_ENABLE.value[0] !== 0x00;
        const nwkSecMaterialSource = backup.data.ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE || backup.data.ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START;
        const nwkSecMaterialEntry = Structs.nwkSecMaterialDescriptor(Buffer.from(nwkSecMaterialSource.value));
        const tcLinkKeySource = backup.data.ZCD_NV_EX_TCLK_TABLE || backup.data.ZCD_NV_LEGACY_TCLK_TABLE_START;
        const tcLinkKeyEntry = Structs.apsmeTcLinkKeyEntry(Buffer.from(tcLinkKeySource.value));

        return {
            networkOptions: {
                panId: nib.nwkPanId,
                extendedPanId: nib.extendedPANID,
                channelList: Utils.unpackChannelList(nib.channelList),
                networkKey: activeKeyInfo.key,
                networkKeyDistribute: preconfiguredKeyEnabled
            },
            coordinatorIeeeAddress: ieeeAddress,
            securityLevel: nib.SecurityLevel,
            networkUpdateId: nib.nwkUpdateId,
            frameCounters: [
                {extendedPanId: nwkSecMaterialEntry.extendedPanID, value: nwkSecMaterialEntry.FrameCounter}
            ],
            tcLinkKeyTable: [
                tcLinkKeyEntry
            ]
        };
    }
}
