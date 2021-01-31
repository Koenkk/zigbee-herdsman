/* eslint-disable max-len */
import {Znp} from "../znp";
import Debug from "debug";
import {ZnpVersion} from "./tstype";
import {TsType} from "../../";
import {DevStates, NvItemsIds, NvSystemIds, ZnpCommandStatus} from "../constants/common";
import * as Structs from "../structs";
import * as Models from "../models";
import * as Utils from "../utils";
import * as ZnpConstants from "../constants";
import {AdapterBackup} from "./adapter-backup";
import {AdapterNvMemory} from "./adapter-nv-memory";
import {Subsystem} from "../unpi/constants";
import * as UnpiConstants from "../unpi/constants";
import * as crypto from "crypto";
import {Wait} from "../../../utils";
import {Endpoints} from "./endpoints";

type StartupStrategy = "startup" | "restoreBackup" | "startCommissioning";

export class ZnpAdapterManager {

    public nv: AdapterNvMemory;
    public backup: AdapterBackup;

    private znp: Znp;
    private options: Models.StartupOptions;
    private nwkOptions: Models.NetworkOptions;
    private debug = {
        startup: Debug("zigbee-herdsman:adapter:zStack:startup"),
        strategy: Debug("zigbee-herdsman:adapter:zStack:startup:strategy"),
        commissioning: Debug("zigbee-herdsman:adapter:zStack:startup:commissioning")
    };

    public constructor(znp: Znp, options: Models.StartupOptions) {
        this.znp = znp;
        this.options = options;
        this.nwkOptions = this.parseConfigNetworkOptions(this.options.networkOptions);
        this.nv = new AdapterNvMemory(this.znp);
        this.backup = new AdapterBackup(this.znp, this.nv, this.options.backupPath);
    }

    public async start(): Promise<TsType.StartResult> {
        this.debug.startup(`beginning znp startup`);
        await this.nv.init();
        
        /* determine startup strategy */
        const strategy = await this.determineStrategy();
        this.debug.startup(`determined startup strategy: ${strategy}`);

        /* perform coordinator startup based on determined strategy */
        let result: TsType.StartResult;
        switch (strategy) {
        case "startup": {
            await this.beginStartup();
            result = "resumed";
            break;
        }
        case "restoreBackup": {
            await this.beginRestore();
            result = "restored";
            break;
        }
        case "startCommissioning": {
            await this.beginCommissioning(this.nwkOptions);
            result = "reset";
            break;
        }
        }

        /* register endpoints */
        await this.registerEndpoints();

        /* add green power group */
        await this.addToGroup(242, this.options.greenPowerGroup);

        return result;
    }

    private async determineStrategy(): Promise<StartupStrategy> {
        this.debug.strategy("determining znp startup strategy");

        /* acquire data from adapter */
        const hasConfiguredNvId = this.options.version === ZnpVersion.zStack12 ? NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1 : NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3;
        const hasConfigured = await this.nv.readItem(hasConfiguredNvId, 0, Structs.hasConfigured);
        const nib = await this.nv.readItem(NvItemsIds.NIB, 0, Structs.nib);
        const activeKeyInfo = await this.nv.readItem(NvItemsIds.NWK_ACTIVE_KEY_INFO, 0, Structs.nwkKeyDescriptor);
        const alternateKeyInfo = await this.nv.readItem(NvItemsIds.NWK_ALTERN_KEY_INFO, 0, Structs.nwkKeyDescriptor);
        const preconfiguredKey = await this.nv.readItem(NvItemsIds.PRECFGKEY, 0, Structs.nwkKey);

        /* get backup if available */
        const backup = await this.backup.getStoredBackup();

        /**
         * Reusable block used in multiple situations.
         */
        const determineRestoreOrCommissioning = (): StartupStrategy => {
            if (backup && Utils.compareNetworkOptions(this.nwkOptions, backup.networkOptions)) {
                /* Adapter backup is available and matches configuration */
                this.debug.strategy("configuration matches backup");
                return "restoreBackup";
            } else {
                /* Adapter backup is either not available or does not match configuration */
                if (!backup) {
                    this.debug.strategy("configuration does not exist");
                } else {
                    this.debug.strategy("configuration does not match backup");
                }
                return "startCommissioning";
            }
        };

        const configMatchesAdapter = (
            nib &&
            Utils.compareChannelLists(this.nwkOptions.channelList, nib.channelList) &&
            this.nwkOptions.panId === nib.nwkPanId &&
            this.nwkOptions.extendedPanId.equals(nib.extendedPANID) &&
            this.nwkOptions.networkKey.equals(activeKeyInfo.key) &&
            this.nwkOptions.networkKey.equals(alternateKeyInfo.key) &&
            this.nwkOptions.networkKey.equals(preconfiguredKey.key)
        );
        //console.log(configMatchesAdapter, Utils.compareChannelLists(this.nwkOptions.channelList, nib.channelList), this.nwkOptions.channelList, Utils.unpackChannelList(nib.channelList), this.nwkOptions.panId, nib.nwkPanId, this.nwkOptions.networkKey, activeKeyInfo.key, alternateKeyInfo.key, preconfiguredKey.key);

        const backupMatchesAdapter = (
            backup &&
            nib &&
            backup.networkOptions.panId === nib.nwkPanId &&
            backup.networkOptions.extendedPanId.equals(nib.extendedPANID) &&
            Utils.compareChannelLists(backup.networkOptions.channelList, nib.channelList) &&
            backup.networkOptions.networkKey.equals(activeKeyInfo.key)
        );

        /* Determine startup strategy */
        if (!hasConfigured || !hasConfigured.isConfigured() || !nib) {
            /* Adapter is not configured or not commissioned */
            this.debug.strategy("adapter is not configured / not commissioned");
            return determineRestoreOrCommissioning();
        } else {
            /* Adapter is configured and commissioned */
            this.debug.strategy("adapter is configured");

            if (configMatchesAdapter) {
                /* Configuration matches adapter state - regular startup */
                this.debug.strategy("adapter state matches configuration");
                return "startup";
            } else {
                /* Configuration does not match adapter state */
                this.debug.strategy("adapter state does not match configuration");
                if (backup) {
                    /* Backup is present */
                    this.debug.strategy("got adapter backup");
                    if (backupMatchesAdapter) {
                        /* Backup matches adapter state */
                        this.debug.strategy("adapter state matches backup");
                        console.log("WARNING! (config inconsistent, remove backup to re-commission)");
                        return "startup";
                    } else {
                        /* Backup does not match adapter state */
                        this.debug.strategy("adapter state does not match backup");
                        if (backup && Utils.compareNetworkOptions(this.nwkOptions, backup.networkOptions)) {
                            /* Adapter backup matches configuration */
                            this.debug.strategy("adapter backup matches configuration");
                            return "restoreBackup";
                        } else {
                            /* Adapter backup does not match configuration */
                            this.debug.strategy("adapter backup does not match configuration");
                            return "startCommissioning";
                        }
                    }
                } else {
                    /* Configuration mismatches adapter and no backup is available */
                    this.debug.strategy("configuration-adapter mismatch (no backup)");
                    return "startCommissioning";
                }
            }
        }
    }

    private async beginStartup(): Promise<void> {
        const deviceInfo = await this.znp.request(Subsystem.UTIL, 'getDeviceInfo', {});
        if (deviceInfo.payload.devicestate !== DevStates.ZB_COORD) {
            this.debug.startup("starting adapter as coordinator");
            const started = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'stateChangeInd', {state: 9}, 60000);
            await this.znp.request(Subsystem.ZDO, 'startupFromApp', {startdelay: 100}, null, [ZnpCommandStatus.SUCCESS, ZnpCommandStatus.FAILURE]);
            await started.start().promise;
            this.debug.startup("adapter successfully started in coordinator mode");
        } else {
            this.debug.startup("adapter is already running in coordinator mode");
        }
    }

    private async beginRestore(): Promise<void> {
        const backup = await this.backup.getStoredBackup();
        if (!backup) {
            throw Error("Cannot restore backup - none is available");
        }

        /* generate random provisioning network parameters */
        const provisioningNwkOptions: Models.NetworkOptions = {
            panId: 1 + Math.round(Math.random() * 65532),
            extendedPanId: crypto.randomBytes(8),
            channelList: [11 + Math.round((Math.random() * (29 - 11)))],
            networkKey: crypto.randomBytes(16),
            networkKeyDistribute: false
        };

        /* commission provisioning network */
        await this.beginCommissioning(provisioningNwkOptions, false, false);

        /* fetch provisioning NIB */
        const rawNib = await this.nv.readItem(NvItemsIds.NIB, 0);
        const nib = Structs.nvNIB(rawNib);

        /* reset adapter */
        await this.resetAdapter();

        /* update NIB with desired nwk config */
        nib.nwkPanId = backup.networkOptions.panId;
        nib.channelList = Utils.packChannelList(backup.networkOptions.channelList);
        nib.nwkLogicalChannel = backup.networkOptions.channelList[0];
        nib.extendedPANID = backup.networkOptions.extendedPanId;
        if (![null, undefined].includes(backup.securityLevel)) {
            nib.SecurityLevel = backup.securityLevel;
        }
        if (![null, undefined].includes(backup.networkUpdateId)) {
            nib.nwkUpdateId = backup.networkUpdateId;
        }
        await this.nv.writeItem(NvItemsIds.NIB, rawNib.length === 110 ? nib.getUnaligned() : nib.getAligned());
        await Wait(500);
        
        /* perform NV restore */
        await this.backup.restoreBackup(backup);

        /* update commissioning NV items with desired nwk configuration */
        await this.updateCommissioningNvItems(this.nwkOptions);
        
        /* update keys */
        const keyDescriptor = Structs.nwkKeyDescriptor();
        keyDescriptor.keySeqNum = 0;
        keyDescriptor.key = backup.networkOptions.networkKey;
        await this.nv.updateItem(NvItemsIds.NWK_ACTIVE_KEY_INFO, keyDescriptor.getRaw());
        await this.nv.updateItem(NvItemsIds.NWK_ALTERN_KEY_INFO, keyDescriptor.getRaw());

        /* clear target frame counters */
        const emptySecurityMaterialDescriptor = Structs.nwkSecMaterialDescriptor();
        emptySecurityMaterialDescriptor.extendedPanID = Buffer.alloc(8, 0x00);
        emptySecurityMaterialDescriptor.FrameCounter = 0;
        for (let i = 0; i < 10; i++) {
            if (this.options.version === ZnpVersion.zStack3x0) {
                const currentItem = await this.nv.readExtendedTableEntry(NvSystemIds.ZSTACK, NvItemsIds.EX_NWK_SEC_MATERIAL_TABLE, i);
                if (currentItem) {
                    await this.nv.writeExtendedTableEntry(NvSystemIds.ZSTACK, NvItemsIds.EX_NWK_SEC_MATERIAL_TABLE, i, emptySecurityMaterialDescriptor.getRaw());
                }
            } else {
                const currentItem = await this.nv.readItem(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + i);
                if (currentItem) {
                    await this.nv.writeItem(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + i, emptySecurityMaterialDescriptor.getRaw());
                }
            }
        }

        /* restore frame counters */
        for (const [index, frameCounter] of backup.frameCounters.entries()) {
            const secMaterialDesc = Structs.nwkSecMaterialDescriptor();
            secMaterialDesc.extendedPanID = frameCounter.extendedPanId;
            secMaterialDesc.FrameCounter = frameCounter.value + 1250;
            if (this.options.version === ZnpVersion.zStack30x) {
                if (index > 10) {
                    throw new Error(`Too many frame counter entries in backup (failedIndex=${index})`);
                }
                await this.nv.writeItem(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + index, secMaterialDesc.getRaw());
            } else if (this.options.version === ZnpVersion.zStack3x0) {
                await this.nv.writeExtendedTableEntry(NvSystemIds.ZSTACK, NvItemsIds.EX_NWK_SEC_MATERIAL_TABLE, index, secMaterialDesc.getRaw());
            }
        }

        /* settle NV */
        await Wait(1000);
        await this.resetAdapter();

        /* startup with restored adapter */
        await this.beginStartup();

        /* write configuration flag */
        await this.writeConfigurationFlag();
    }

    private async beginCommissioning(nwkOptions: Models.NetworkOptions, failOnCollision = true, writeConfiguredFlag = true): Promise<void> {
        if (nwkOptions.panId === 65535) {
            throw new Error(`network commissioning failed - cannot use pan id 65535`);
        }

        /* clear and reset the adapter */
        await this.nv.deleteItem(NvItemsIds.NIB);
        await this.resetAdapter();

        /* commission the network as per parameters */
        await this.updateCommissioningNvItems(nwkOptions);
        this.debug.commissioning("beginning network commissioning");
        if ([ZnpVersion.zStack30x, ZnpVersion.zStack3x0].includes(this.options.version)) {
            await this.znp.request(Subsystem.APP_CNF, "bdbSetChannel", {isPrimary: 0x1, channel: Utils.packChannelList(nwkOptions.channelList)});
            await this.znp.request(Subsystem.APP_CNF, "bdbSetChannel", {isPrimary: 0x0, channel: 0x0});
        }
        const started = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, "stateChangeInd", {state: 9}, 60000);
        await this.znp.request(Subsystem.APP_CNF, 'bdbStartCommissioning', {mode: 0x04});
        try {
            await started.start().promise;
        } catch (error) {
            throw new Error(`network commissioning timed out - most likely network with the same panId or extendedPanId already exists nearby`);
        }
        this.debug.commissioning("network commissioned");

        /* wait for NIB to settle (takes different amount of time of different platforms */
        this.debug.commissioning("waiting for NIB to settle");
        let reads = 0;
        let nib: ReturnType<typeof Structs.nib> = null;
        do {
            await Wait(3000);
            nib = await this.nv.readItem(NvItemsIds.NIB, 0, Structs.nib);
            reads++;
        } while ((!nib || nib.nwkPanId === 65535 || nib.nwkLogicalChannel === 0) && reads < 10);
        if (!nib || nib.nwkPanId === 65535 || nib.nwkLogicalChannel === 0) {
            throw new Error(`network commissioning failed - timed out waiting for nib to settle`);
        }

        /* validate provisioned PAN ID */
        const extNwkInfo = await this.znp.request(Subsystem.ZDO, 'extNwkInfo', {});
        if (extNwkInfo.payload.panid !== nwkOptions.panId && failOnCollision) {
            throw new Error(`network commissioning failed - panId collision detected (expected=${nwkOptions.panId}, actual=${extNwkInfo.payload.panid})`);
        }

        /* write configuration flag */
        if (writeConfiguredFlag) {
            await this.writeConfigurationFlag();
        }
    }

    private async updateCommissioningNvItems(options: Models.NetworkOptions): Promise<void> {
        const nwkPanId = Structs.nwkPanId();
        nwkPanId.panId = options.panId;
        const channelList = Structs.channelList();
        channelList.channelList = Utils.packChannelList(options.channelList);
        const extendedPanIdReversed = Buffer.from(options.extendedPanId).reverse();

        this.debug.commissioning(`setting network commissioning parameters`);

        this.debug.commissioning(`setting network commissioning parameters`);

        await this.nv.updateItem(NvItemsIds.LOGICAL_TYPE, Buffer.from([ZnpConstants.ZDO.deviceLogicalType.COORDINATOR]));
        await this.nv.updateItem(NvItemsIds.PRECFGKEYS_ENABLE, Buffer.from([options.networkKeyDistribute ? 0x01 : 0x00]));
        await this.nv.updateItem(NvItemsIds.ZDO_DIRECT_CB, Buffer.from([0x01]));
        await this.nv.updateItem(NvItemsIds.CHANLIST, channelList.getRaw());
        await this.nv.updateItem(NvItemsIds.PANID, nwkPanId.getRaw());
        await this.nv.updateItem(NvItemsIds.EXTENDED_PAN_ID, options.extendedPanId.reverse());
        if ([ZnpVersion.zStack30x, ZnpVersion.zStack3x0].includes(this.options.version)) {
            await this.nv.updateItem(NvItemsIds.PRECFGKEY, options.networkKey);
        } else {
            await this.znp.request(
                Subsystem.SAPI,
                "writeConfiguration",
                {
                    configid: NvItemsIds.PRECFGKEY,
                    len: options.networkKey.length,
                    value: options.networkKey
                }
            );
            await this.nv.writeItem(
                NvItemsIds.LEGACY_TCLK_TABLE_START_12,
                Buffer.from([
                    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x5a, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6c,
                    0x6c, 0x69, 0x61, 0x6e, 0x63, 0x65, 0x30, 0x39, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
                ])
            );
        }

        /* settle the NV (give it a bit of time and flush by SW reset) */
        await Wait(1000);
        await this.resetAdapter();
    }

    private async registerEndpoints(): Promise<void> {
        const activeEpResponse = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'activeEpRsp');
        this.znp.request(Subsystem.ZDO, 'activeEpReq', {dstaddr: 0, nwkaddrofinterest: 0});
        const activeEp = await activeEpResponse.start().promise;
    
        for (const endpoint of Endpoints) {
            if (activeEp.payload.activeeplist.includes(endpoint.endpoint)) {
                this.debug.startup(`Endpoint '${endpoint.endpoint}' already registered`);
            } else {
                this.debug.startup(`Registering endpoint '${endpoint.endpoint}'`);
                await this.znp.request(Subsystem.AF, 'register', endpoint);
            }
        }
    }

    private async addToGroup(endpoint: number, group: number): Promise<void> {
        const result = await this.znp.request(5, 'extFindGroup', {endpoint, groupid: group}, null, [ZnpCommandStatus.SUCCESS, ZnpCommandStatus.FAILURE]);
        if (result.payload.status === ZnpCommandStatus.FAILURE) {
            await this.znp.request(5, 'extAddGroup', {endpoint, groupid: group, namelen: 0, groupname:[]});
        }
    }

    private async resetAdapter(): Promise<void> {
        await this.znp.request(Subsystem.SYS, 'resetReq', {type: ZnpConstants.SYS.resetType.SOFT});
    }

    /**
     * Transforms Z2M number-based network options to local Buffer-based options.
     * 
     * @param options Source Z2M network options.
     */
    private parseConfigNetworkOptions(options: TsType.NetworkOptions): Models.NetworkOptions {
        const channelList = options.channelList;
        channelList.sort((c1, c2) => c1 < c2 ? -1 : c1 > c2 ? 1 : 0);
        return {
            channelList: channelList,
            panId: options.panID,
            extendedPanId: Buffer.from(options.extendedPanID),
            networkKey: Buffer.from(options.networkKey),
            networkKeyDistribute: options.networkKeyDistribute
        };
    }

    private async writeConfigurationFlag(): Promise<void> {
        this.debug.commissioning("writing configuration flag to adapter NV memory");
        await this.nv.writeItem(this.options.version === ZnpVersion.zStack12 ? NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1 : NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, Buffer.from([0x55]));
    }
}
