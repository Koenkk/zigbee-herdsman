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
import {LoggerStub} from "../../../controller/logger-stub";

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
    private logger: LoggerStub;
    private debug = {
        startup: Debug("zigbee-herdsman:adapter:zStack:startup"),
        strategy: Debug("zigbee-herdsman:adapter:zStack:startup:strategy"),
        commissioning: Debug("zigbee-herdsman:adapter:zStack:startup:commissioning")
    };

    public constructor(znp: Znp, options: ZStackModels.StartupOptions, logger: LoggerStub) {
        this.znp = znp;
        this.options = options;
        this.nv = new AdapterNvMemory(this.znp);
        this.backup = new AdapterBackup(this.znp, this.nv, this.options.backupPath);
        this.logger = logger;
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
            if (this.options.version === ZnpVersion.zStack12) {
                const hasConfigured = await this.nv.readItem(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1, 0, Structs.hasConfigured);
                await this.beginCommissioning(this.nwkOptions);
                await this.beginStartup();
                result = hasConfigured && hasConfigured.isConfigured() ? "reset" : "restored";
            } else {
                await this.beginCommissioning(this.nwkOptions);
                result = "reset";
            }
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
        const preconfiguredKey = this.options.version === ZnpVersion.zStack12 ?
            Structs.nwkKey((await this.znp.request(Subsystem.SAPI, "readConfiguration", {configid: NvItemsIds.PRECFGKEY})).payload.value) :
            await this.nv.readItem(NvItemsIds.PRECFGKEY, 0, Structs.nwkKey);

        /* get backup if available and supported by target */
        const backup = this.options.version === ZnpVersion.zStack12 ? undefined : await this.backup.getStoredBackup();

        /* Special treatment for incorrectly reversed Extended PAN IDs from previous releases */
        const isExtendedPanIdReversed = nib && this.nwkOptions.extendedPanId.equals(Buffer.from(nib.extendedPANID).reverse());

        /* istanbul ignore next */
        const configMatchesAdapter = (
            nib &&
            Utils.compareChannelLists(this.nwkOptions.channelList, nib.channelList) &&
            this.nwkOptions.panId === nib.nwkPanId &&
            (
                this.nwkOptions.extendedPanId.equals(nib.extendedPANID) ||
                /* exception for migration from previous code-base */
                isExtendedPanIdReversed || 
                /* exception for some adapters which may actually use 0xdddddddddddddddd as EPID (backward compatibility) */
                this.nwkOptions.hasDefaultExtendedPanId
            ) &&
            this.nwkOptions.networkKey.equals(preconfiguredKey.key) &&
            (this.options.version === ZnpVersion.zStack12 || this.nwkOptions.networkKey.equals(activeKeyInfo.key)) &&
            (this.options.version === ZnpVersion.zStack12 || this.nwkOptions.networkKey.equals(alternateKeyInfo.key))
        );

        const backupMatchesAdapter = (
            backup &&
            nib &&
            backup.networkOptions.panId === nib.nwkPanId &&
            backup.networkOptions.extendedPanId.equals(nib.extendedPANID) &&
            Utils.compareChannelLists(backup.networkOptions.channelList, nib.channelList) &&
            backup.networkOptions.networkKey.equals(activeKeyInfo.key)
        );

        const configMatchesBackup = (
            backup &&
            Utils.compareNetworkOptions(this.nwkOptions, backup.networkOptions, true)
        );

        /* Determine startup strategy */
        if (!hasConfigured || !hasConfigured.isConfigured() || !nib) {
            /* Adapter is not configured or not commissioned */
            this.debug.strategy("(stage-1) adapter is not configured / not commissioned");
            if (configMatchesBackup) {
                /* Adapter backup is available and matches configuration */
                this.debug.strategy("(stage-2) configuration matches backup");
                return "restoreBackup";
            } else {
                /* Adapter backup is either not available or does not match configuration */
                if (!backup) {
                    this.debug.strategy("(stage-2) adapter backup does not exist");
                } else {
                    this.debug.strategy("(stage-2) configuration does not match backup");
                }
                return "startCommissioning";
            }
        } else {
            /* Adapter is configured and commissioned */
            this.debug.strategy("(stage-1) adapter is configured");

            if (configMatchesAdapter) {
                /* Warn if EPID is reversed (backward-compat) */
                if (isExtendedPanIdReversed) {
                    this.debug.strategy("(stage-2) extended pan id is reversed");
                    this.logger.warn(`Extended PAN ID is reversed (expected=${this.nwkOptions.extendedPanId.toString("hex")}, actual=${nib.extendedPANID.toString("hex")})`);
                }

                /* Configuration matches adapter state - regular startup */
                this.debug.strategy("(stage-2) adapter state matches configuration");
                return "startup";
            } else {
                /* Configuration does not match adapter state */
                this.debug.strategy("(stage-2) adapter state does not match configuration");
                if (backup) {
                    /* Backup is present */
                    this.debug.strategy("(stage-3) got adapter backup");
                    if (backupMatchesAdapter) {
                        /* Backup matches adapter state */
                        this.debug.strategy("(stage-4) adapter state matches backup");
                        this.logger.error(`Configuration is not consistent with adapter state/backup!`);
                        this.logger.error(`- PAN ID: configured=${this.nwkOptions.panId}, adapter=${nib.nwkPanId}`);
                        this.logger.error(`- Extended PAN ID: configured=${this.nwkOptions.extendedPanId.toString("hex")}, adapter=${nib.extendedPANID.toString("hex")}`);
                        this.logger.error(`- Network Key: configured=${this.nwkOptions.networkKey.toString("hex")}, adapter=${activeKeyInfo.key.toString("hex")}`);
                        this.logger.error(`- Channel List: configured=${this.nwkOptions.channelList.toString()}, adapter=${Utils.unpackChannelList(nib.channelList).toString()}`);
                        this.logger.error(`Please update configuration to prevent further issues.`);
                        this.logger.error(`If you wish to re-commission your network, please remove coordinator backup at ${this.options.backupPath}.`);
                        this.logger.error(`Re-commissioning your network will require re-pairing of all devices!`);
                        throw new Error("startup failed - configuration-adapter mismatch - see logs above for more information");
                    } else {
                        /* Backup does not match adapter state */
                        this.debug.strategy("(stage-4) adapter state does not match backup");
                        if (configMatchesBackup) {
                            /* Adapter backup matches configuration */
                            this.debug.strategy("(stage-5) adapter backup matches configuration");
                            return "restoreBackup";
                        } else {
                            /* Adapter backup does not match configuration */
                            this.debug.strategy("(stage-5) adapter backup does not match configuration");
                            return "startCommissioning";
                        }
                    }
                } else {
                    /* Configuration mismatches adapter and no backup is available */
                    this.debug.strategy("(stage-3) configuration-adapter mismatch (no backup)");
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
        /* istanbul ignore next */
        if (!backup) {
            throw Error("Cannot restore backup - none is available");
        }

        /* generate random provisioning network parameters */
        const provisioningNwkOptions: Models.NetworkOptions = {
            panId: 1 + Math.round(Math.random() * 65532),
            extendedPanId: crypto.randomBytes(8),
            channelList: [11 + Math.round((Math.random() * (26 - 11)))],
            networkKey: crypto.randomBytes(16),
            networkKeyDistribute: false
        };

        /* commission provisioning network */
        this.debug.commissioning("commissioning random provisioning network:");
        this.debug.commissioning(` - panId: ${provisioningNwkOptions.panId}`);
        this.debug.commissioning(` - extendedPanId: ${provisioningNwkOptions.extendedPanId.toString("hex")}`);
        this.debug.commissioning(` - channelList: ${provisioningNwkOptions.channelList.join(", ")}`);
        this.debug.commissioning(` - networkKey: ${provisioningNwkOptions.networkKey.toString("hex")}`);
        this.debug.commissioning(` - networkKeyDistribute: ${provisioningNwkOptions.networkKeyDistribute}`);
        await this.beginCommissioning(provisioningNwkOptions, false, false);

        /* perform NV restore */
        await this.backup.restoreBackup(backup);

        /* update commissioning NV items with desired nwk configuration */
        await this.updateCommissioningNvItems(this.nwkOptions);
        
        /* settle & reset adapter */
        this.debug.commissioning("giving adapter some time to settle");
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
     * @param writeConfiguredFlag Whether zigbee-herdsman `hasConfigured` flag should be written to NV.
     */
    private async beginCommissioning(nwkOptions: Models.NetworkOptions, failOnCollision = true, writeConfiguredFlag = true): Promise<void> {
        if (nwkOptions.panId === 65535) {
            throw new Error(`network commissioning failed - cannot use pan id 65535`);
        }

        /* clear and reset the adapter */
        await this.nv.deleteItem(NvItemsIds.NIB);
        await this.clearAdapter();

        /* commission the network as per parameters */
        await this.updateCommissioningNvItems(nwkOptions);
        this.debug.commissioning("beginning network commissioning");
        if ([ZnpVersion.zStack30x, ZnpVersion.zStack3x0].includes(this.options.version)) {
            /* configure channel */
            await this.znp.request(Subsystem.APP_CNF, "bdbSetChannel", {isPrimary: 0x1, channel: Utils.packChannelList(nwkOptions.channelList)});
            await this.znp.request(Subsystem.APP_CNF, "bdbSetChannel", {isPrimary: 0x0, channel: 0x0});

            /* perform bdb commissioning */
            const started = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, "stateChangeInd", {state: 9}, 60000);
            await this.znp.request(Subsystem.APP_CNF, 'bdbStartCommissioning', {mode: 0x04});
            try {
                await started.start().promise;
            } catch (error) {
                throw new Error(`network commissioning timed out - most likely network with the same panId or extendedPanId already exists nearby`);
            }
        } else {
            /* Z-Stack 1.2 requires startup to be performed instead of BDB commissioning */
            await this.beginStartup();
        }

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

        this.debug.commissioning("network commissioned");

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

        await this.nv.updateItem(NvItemsIds.STARTUP_OPTION, Buffer.from([0x00]));
        await this.nv.updateItem(NvItemsIds.LOGICAL_TYPE, Buffer.from([ZnpConstants.ZDO.deviceLogicalType.COORDINATOR]));
        await this.nv.updateItem(NvItemsIds.ZDO_DIRECT_CB, Buffer.from([0x01]));
        await this.nv.updateItem(NvItemsIds.CHANLIST, channelList.serialize());
        await this.nv.updateItem(NvItemsIds.PANID, nwkPanId.serialize());
        await this.nv.updateItem(NvItemsIds.EXTENDED_PAN_ID, extendedPanIdReversed);
        await this.nv.updateItem(NvItemsIds.APS_USE_EXT_PANID, extendedPanIdReversed);
        /* istanbul ignore next */
        await this.nv.updateItem(NvItemsIds.PRECFGKEYS_ENABLE, Buffer.from([options.networkKeyDistribute ? 0x01 : 0x00]));

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
                this.debug.startup(`endpoint '${endpoint.endpoint}' already registered`);
            } else {
                this.debug.startup(`registering endpoint '${endpoint.endpoint}'`);
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
        this.debug.startup("adapter reset requested");
        await this.znp.request(Subsystem.SYS, 'resetReq', {type: ZnpConstants.SYS.resetType.SOFT});
        this.debug.startup("adapter reset successful");
    }

    /**
     * Internal method to reset adapter config and data.
     */
    private async clearAdapter(): Promise<void> {
        this.debug.startup("clearing adapter using startup option 3");
        await this.nv.writeItem(NvItemsIds.STARTUP_OPTION, Buffer.from([0x03]));
        await this.resetAdapter();
        await this.nv.writeItem(NvItemsIds.STARTUP_OPTION, Buffer.from([0x00]));
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
        /* istanbul ignore next */
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
            parsed.hasDefaultExtendedPanId = true;
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
