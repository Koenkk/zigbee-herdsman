/* eslint-disable max-len */
import {Znp} from "../znp";
import Debug from "debug";
import {ZnpVersion} from "./tstype";
import {TsType} from "../../";
import {DevStates, NvItemsIds, ZnpCommandStatus} from "../constants/common";
import * as Structs from "../structs";
import * as Models from "../../../models";
import * as ZStackModels from "../models";
import * as Utils from "../utils";
import * as ZnpConstants from "../constants";
import {AdapterBackup} from "./adapter-backup";
import {AdapterNvMemory} from "./adapter-nv-memory";
import {Subsystem} from "../unpi/constants";
import * as UnpiConstants from "../unpi/constants";
import * as crypto from "crypto";
import {Wait} from "../../../utils";
import {Endpoints} from "./endpoints";

/**
 * Startup strategy is internally used to determine required startup method.
 */
type StartupStrategy = "startup" | "restoreBackup" | "startCommissioning";

/**
 * ZNP Adapter Manager is responsible for handling adapter startup, network commissioning,
 * configuration backup and restore.
 */
export class ZnpAdapterManager {

    public nv: AdapterNvMemory;
    public backup: AdapterBackup;

    private znp: Znp;
    private options: ZStackModels.StartupOptions;
    private nwkOptions: Models.NetworkOptions;
    private debug = {
        startup: Debug("zigbee-herdsman:adapter:zStack:startup"),
        strategy: Debug("zigbee-herdsman:adapter:zStack:startup:strategy"),
        commissioning: Debug("zigbee-herdsman:adapter:zStack:startup:commissioning")
    };

    public constructor(znp: Znp, options: ZStackModels.StartupOptions) {
        this.znp = znp;
        this.options = options;
        this.nv = new AdapterNvMemory(this.znp);
        this.backup = new AdapterBackup(this.znp, this.nv, this.options.backupPath);
    }

    /**
     * Performs ZNP adapter startup. After this method returns the adapter is configured, endpoints are registered
     * and network is ready to process frames.
     */
    public async start(): Promise<TsType.StartResult> {
        this.debug.startup(`beginning znp startup`);
        this.nwkOptions = await this.parseConfigNetworkOptions(this.options.networkOptions);
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

    /**
     * Internal function to determine startup strategy. The strategy determination flow is described in
     * [this GitHub issue comment](https://github.com/Koenkk/zigbee-herdsman/issues/286#issuecomment-761029689).
     */
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
                    this.debug.strategy("adapter backup does not exist");
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

    /**
     * Internal method to perform regular adapter startup in coordinator mode.
     */
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

    /**
     * Internal method to perform adapter restore.
     */
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
        
        /* perform NV restore */
        await this.backup.restoreBackup(backup);

        /* update commissioning NV items with desired nwk configuration */
        await this.updateCommissioningNvItems(this.nwkOptions);
        
        /* settle & reset adapter */
        await Wait(1000);
        await this.resetAdapter();

        /* startup with restored adapter */
        await this.beginStartup();

        /* write configuration flag */
        await this.writeConfigurationFlag();
    }

    /**
     * Internal method to perform new network commissioning. Network commissioning creates a new ZigBee
     * network using the adapter.
     * 
     * @param nwkOptions Options to configure the new network with.
     * @param failOnCollision Whether process should throw an error if PAN ID collision is detected.
     * @param writeConfiguredFlag Whether Z2M `hasConfigured` flag should be written to NV.
     */
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

    /**
     * Updates commissioning NV memory parameters in connected controller. This method should be invoked
     * to configure network commissioning parameters or update the controller after restore.
     * 
     * @param options Network options to set in NV memory.
     */
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
        await this.nv.updateItem(NvItemsIds.CHANLIST, channelList.serialize());
        await this.nv.updateItem(NvItemsIds.PANID, nwkPanId.serialize());
        await this.nv.updateItem(NvItemsIds.EXTENDED_PAN_ID, extendedPanIdReversed);
        await this.nv.updateItem(NvItemsIds.APS_USE_EXT_PANID, extendedPanIdReversed);

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
    }

    /**
     * Registers endpoints before beginning normal operation.
     */
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

    /**
     * Adds endpoint to group.
     * 
     * @param endpoint Endpoint index to add.
     * @param group Target group index.
     */
    private async addToGroup(endpoint: number, group: number): Promise<void> {
        const result = await this.znp.request(5, 'extFindGroup', {endpoint, groupid: group}, null, [ZnpCommandStatus.SUCCESS, ZnpCommandStatus.FAILURE]);
        if (result.payload.status === ZnpCommandStatus.FAILURE) {
            await this.znp.request(5, 'extAddGroup', {endpoint, groupid: group, namelen: 0, groupname:[]});
        }
    }

    /**
     * Internal method to reset the adapter.
     */
    private async resetAdapter(): Promise<void> {
        await this.znp.request(Subsystem.SYS, 'resetReq', {type: ZnpConstants.SYS.resetType.SOFT});
    }

    /**
     * Transforms Z2M number-based network options to local Buffer-based options.
     * 
     * This function also takes care of `dd:dd:dd:dd:dd:dd:dd:dd` extended PAN ID
     * and replaces it with adapter IEEE address.
     * 
     * @param options Source Z2M network options.
     */
    private async parseConfigNetworkOptions(options: TsType.NetworkOptions): Promise<Models.NetworkOptions> {
        const channelList = options.channelList;
        channelList.sort((c1, c2) => c1 < c2 ? -1 : c1 > c2 ? 1 : 0);

        const parsed: Models.NetworkOptions = {
            channelList: channelList,
            panId: options.panID,
            extendedPanId: Buffer.from(options.extendedPanID),
            networkKey: Buffer.from(options.networkKey),
            networkKeyDistribute: options.networkKeyDistribute
        };
        if (parsed.extendedPanId.equals(Buffer.alloc(8, 0xdd))) {
            const adapterIeeeAddressResponse = await this.znp.request(Subsystem.SYS, "getExtAddr", {});
            parsed.extendedPanId = Buffer.from(adapterIeeeAddressResponse.payload.extaddress.split("0x")[1], "hex");
        }
        return parsed;
    }

    /**
     * Writes ZNP `hasConfigured` flag to NV memory. This flag indicates the adapter has been configured.
     */
    private async writeConfigurationFlag(): Promise<void> {
        this.debug.commissioning("writing configuration flag to adapter NV memory");
        await this.nv.writeItem(this.options.version === ZnpVersion.zStack12 ? NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1 : NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, Buffer.from([0x55]));
    }
}
