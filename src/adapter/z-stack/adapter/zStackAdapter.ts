import assert from 'assert';

import debounce from 'debounce';

import * as Models from '../../../models';
import {Queue, Wait, Waitress} from '../../../utils';
import {logger} from '../../../utils/logger';
import {BroadcastAddress} from '../../../zspec/enums';
import * as Zcl from '../../../zspec/zcl';
import {Status as ZdoStatus} from '../../../zspec/zdo';
import Adapter from '../../adapter';
import * as Events from '../../events';
import {
    ActiveEndpoints,
    AdapterOptions,
    Coordinator,
    CoordinatorVersion,
    DeviceType,
    LQI,
    LQINeighbor,
    NetworkOptions,
    NetworkParameters,
    NodeDescriptor,
    RoutingTable,
    RoutingTableEntry,
    SerialPortOptions,
    SimpleDescriptor,
    StartResult,
} from '../../tstype';
import * as Constants from '../constants';
import {Constants as UnpiConstants} from '../unpi';
import {Znp, ZpiObject} from '../znp';
import {ZpiObjectPayload} from '../znp/tstype';
import {ZnpAdapterManager} from './manager';
import {ZnpVersion} from './tstype';

const NS = 'zh:zstack';
const Subsystem = UnpiConstants.Subsystem;
const Type = UnpiConstants.Type;
const {ZnpCommandStatus, AddressMode} = Constants.COMMON;

const DataConfirmTimeout = 9999; // Not an actual code
const DataConfirmErrorCodeLookup: {[k: number]: string} = {
    [DataConfirmTimeout]: 'Timeout',
    26: 'MAC no resources',
    183: 'APS no ack',
    205: 'No network route',
    225: 'MAC channel access failure',
    233: 'MAC no ack',
    240: 'MAC transaction expired',
};

interface WaitressMatcher {
    address?: number | string;
    endpoint: number;
    transactionSequenceNumber?: number;
    frameType: Zcl.FrameType;
    clusterID: number;
    commandIdentifier: number;
    direction: number;
}

class DataConfirmError extends Error {
    public code: number;
    constructor(code: number) {
        const message = `Data request failed with error: '${DataConfirmErrorCodeLookup[code]}' (${code})`;
        super(message);
        this.code = code;
    }
}

class ZStackAdapter extends Adapter {
    private deviceAnnounceRouteDiscoveryDebouncers: Map<number, () => void>;
    private znp: Znp;
    // @ts-expect-error initialized in `start`
    private adapterManager: ZnpAdapterManager;
    private transactionID: number;
    // @ts-expect-error initialized in `start`
    private version: {
        product: number;
        transportrev: number;
        majorrel: number;
        minorrel: number;
        maintrel: number;
        revision: string;
    };
    private closing: boolean;
    // @ts-expect-error initialized in `start`
    private queue: Queue;
    private supportsLED?: boolean;
    private interpanLock: boolean;
    private interpanEndpointRegistered: boolean;
    private waitress: Waitress<Events.ZclPayload, WaitressMatcher>;

    public constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath: string, adapterOptions: AdapterOptions) {
        super(networkOptions, serialPortOptions, backupPath, adapterOptions);
        this.znp = new Znp(this.serialPortOptions.path!, this.serialPortOptions.baudRate!, this.serialPortOptions.rtscts!);

        this.transactionID = 0;
        this.deviceAnnounceRouteDiscoveryDebouncers = new Map();
        this.interpanLock = false;
        this.interpanEndpointRegistered = false;
        this.closing = false;
        this.waitress = new Waitress<Events.ZclPayload, WaitressMatcher>(this.waitressValidator, this.waitressTimeoutFormatter);

        this.znp.on('received', this.onZnpRecieved.bind(this));
        this.znp.on('close', this.onZnpClose.bind(this));
    }

    /**
     * Adapter methods
     */
    public async start(): Promise<StartResult> {
        await this.znp.open();

        const attempts = 3;
        for (let i = 0; i < attempts; i++) {
            try {
                await this.znp.request(Subsystem.SYS, 'ping', {capabilities: 1});
                break;
            } catch (e) {
                if (attempts - 1 === i) {
                    throw new Error(`Failed to connect to the adapter (${e})`);
                }
            }
        }

        // Old firmware did not support version, assume it's Z-Stack 1.2 for now.
        try {
            this.version = (await this.znp.requestWithReply(Subsystem.SYS, 'version', {})).payload;
        } catch {
            logger.debug(`Failed to get zStack version, assuming 1.2`, NS);
            this.version = {transportrev: 2, product: 0, majorrel: 2, minorrel: 0, maintrel: 0, revision: ''};
        }

        const concurrent =
            this.adapterOptions && this.adapterOptions.concurrent
                ? this.adapterOptions.concurrent
                : this.version.product === ZnpVersion.zStack3x0
                  ? 16
                  : 2;

        logger.debug(`Adapter concurrent: ${concurrent}`, NS);

        this.queue = new Queue(concurrent);

        logger.debug(`Detected znp version '${ZnpVersion[this.version.product]}' (${JSON.stringify(this.version)})`, NS);
        this.adapterManager = new ZnpAdapterManager(this.znp, {
            backupPath: this.backupPath,
            version: this.version.product,
            greenPowerGroup: this.greenPowerGroup,
            networkOptions: this.networkOptions,
            adapterOptions: this.adapterOptions,
        });

        const startResult = this.adapterManager.start();

        if (this.adapterOptions.disableLED) {
            // Wait a bit for adapter to startup, otherwise led doesn't disable (tested with CC2531)
            await Wait(200);
            await this.setLED('disable');
        }

        if (this.adapterOptions.transmitPower != null) {
            await this.setTransmitPower(this.adapterOptions.transmitPower);
        }

        return await startResult;
    }

    public async stop(): Promise<void> {
        this.closing = true;
        await this.znp.close();
    }

    public static async isValidPath(path: string): Promise<boolean> {
        return await Znp.isValidPath(path);
    }

    public static async autoDetectPath(): Promise<string | undefined> {
        return await Znp.autoDetectPath();
    }

    public async getCoordinator(): Promise<Coordinator> {
        return await this.queue.execute<Coordinator>(async () => {
            this.checkInterpanLock();
            const activeEpRsp = this.waitForAreqZdo('activeEpRsp');
            await this.znp.request(Subsystem.ZDO, 'activeEpReq', {dstaddr: 0, nwkaddrofinterest: 0}, activeEpRsp.ID);
            const activeEp = await activeEpRsp.start();

            const deviceInfo = await this.znp.requestWithReply(Subsystem.UTIL, 'getDeviceInfo', {});

            const endpoints = [];
            for (const endpoint of activeEp.payload.activeeplist) {
                const simpleDescRsp = this.waitForAreqZdo('simpleDescRsp', {endpoint});
                await this.znp.request(Subsystem.ZDO, 'simpleDescReq', {dstaddr: 0, nwkaddrofinterest: 0, endpoint}, simpleDescRsp.ID);
                const simpleDesc = await simpleDescRsp.start();

                endpoints.push({
                    ID: simpleDesc.payload.endpoint,
                    profileID: simpleDesc.payload.profileid,
                    deviceID: simpleDesc.payload.deviceid,
                    inputClusters: simpleDesc.payload.inclusterlist,
                    outputClusters: simpleDesc.payload.outclusterlist,
                });
            }

            return {
                networkAddress: 0,
                manufacturerID: 0,
                ieeeAddr: deviceInfo.payload.ieeeaddr,
                endpoints,
            };
        });
    }

    public async permitJoin(seconds: number, networkAddress?: number): Promise<void> {
        const addrmode = networkAddress === undefined ? 0x0f : 0x02;
        const dstaddr = networkAddress || 0xfffc;
        await this.queue.execute<void>(async () => {
            this.checkInterpanLock();
            const payload = {addrmode, dstaddr, duration: seconds, tcsignificance: 0};
            await this.znp.request(Subsystem.ZDO, 'mgmtPermitJoinReq', payload);
            await this.setLED(seconds == 0 ? 'off' : 'on');
        });
    }

    public async getCoordinatorVersion(): Promise<CoordinatorVersion> {
        return {type: ZnpVersion[this.version.product], meta: this.version};
    }

    public async reset(type: 'soft' | 'hard'): Promise<void> {
        if (type === 'soft') {
            await this.znp.request(Subsystem.SYS, 'resetReq', {type: Constants.SYS.resetType.SOFT});
        } else {
            await this.znp.request(Subsystem.SYS, 'resetReq', {type: Constants.SYS.resetType.HARD});
        }
    }

    private async setLED(action: 'disable' | 'on' | 'off'): Promise<void> {
        if (this.supportsLED == undefined) {
            // Only zStack3x0 with 20210430 and greater support LED
            const zStack3x0 = this.version.product === ZnpVersion.zStack3x0;
            this.supportsLED = !zStack3x0 || (zStack3x0 && parseInt(this.version.revision) >= 20210430);
        }

        if (!this.supportsLED || (this.adapterOptions.disableLED && action !== 'disable')) {
            return;
        }

        // Firmwares build on and after 20211029 should handle LED themselves
        const firmwareControlsLed = parseInt(this.version.revision) >= 20211029;
        const lookup = {
            disable: firmwareControlsLed ? {ledid: 0xff, mode: 5} : {ledid: 3, mode: 0},
            on: firmwareControlsLed ? null : {ledid: 3, mode: 1},
            off: firmwareControlsLed ? null : {ledid: 3, mode: 0},
        };

        const payload = lookup[action];
        if (payload) {
            this.znp.request(Subsystem.UTIL, 'ledControl', payload, undefined, 500).catch(() => {
                // We cannot 100% correctly determine if an adapter supports LED. E.g. the zStack 1.2 20190608
                // fw supports led on the CC2531 but not on the CC2530. Therefore if a led request fails never thrown
                // an error but instead mark the led as unsupported.
                // https://github.com/Koenkk/zigbee-herdsman/issues/377
                // https://github.com/Koenkk/zigbee2mqtt/issues/7693
                this.supportsLED = false;
            });
        }
    }

    private async requestNetworkAddress(ieeeAddr: string): Promise<number> {
        /**
         * NOTE: There are cases where multiple nwkAddrRsp are recevied with different network addresses,
         * this is currently not handled, the first nwkAddrRsp is taken.
         */
        logger.debug(`Request network address of '${ieeeAddr}'`, NS);
        const response = this.waitForAreqZdo('nwkAddrRsp', {ieeeaddr: ieeeAddr});
        await this.znp.request(Subsystem.ZDO, 'nwkAddrReq', {ieeeaddr: ieeeAddr, reqtype: 0, startindex: 0});
        const result = await response.start();
        return result.payload.nwkaddr;
    }

    private supportsAssocRemove(): boolean {
        return this.version.product === ZnpVersion.zStack3x0 && parseInt(this.version.revision) >= 20200805;
    }

    private supportsAssocAdd(): boolean {
        return this.version.product === ZnpVersion.zStack3x0 && parseInt(this.version.revision) >= 20201026;
    }

    private async discoverRoute(networkAddress: number, wait = true): Promise<void> {
        logger.debug(`Discovering route to ${networkAddress}`, NS);
        const payload = {dstAddr: networkAddress, options: 0, radius: Constants.AF.DEFAULT_RADIUS};
        await this.znp.request(Subsystem.ZDO, 'extRouteDisc', payload);

        if (wait) {
            await Wait(3000);
        }
    }

    public async nodeDescriptor(networkAddress: number): Promise<NodeDescriptor> {
        return await this.queue.execute<NodeDescriptor>(async () => {
            this.checkInterpanLock();
            try {
                const result = await this.nodeDescriptorInternal(networkAddress);
                return result;
            } catch (error) {
                logger.debug(`Node descriptor request for '${networkAddress}' failed (${error}), retry`, NS);
                // Doing a route discovery after simple descriptor request fails makes it succeed sometimes.
                // https://github.com/Koenkk/zigbee2mqtt/issues/3276
                await this.discoverRoute(networkAddress);
                const result = await this.nodeDescriptorInternal(networkAddress);
                return result;
            }
        }, networkAddress);
    }

    private async nodeDescriptorInternal(networkAddress: number): Promise<NodeDescriptor> {
        const response = this.waitForAreqZdo('nodeDescRsp', {nwkaddr: networkAddress});
        const payload = {dstaddr: networkAddress, nwkaddrofinterest: networkAddress};
        await this.znp.request(Subsystem.ZDO, 'nodeDescReq', payload, response.ID);
        const descriptor = await response.start();

        let type: DeviceType = 'Unknown';
        const logicalType = descriptor.payload.logicaltype_cmplxdescavai_userdescavai & 0x07;
        for (const [key, value] of Object.entries(Constants.ZDO.deviceLogicalType)) {
            if (value === logicalType) {
                if (key === 'COORDINATOR') type = 'Coordinator';
                else if (key === 'ROUTER') type = 'Router';
                else if (key === 'ENDDEVICE') type = 'EndDevice';
                break;
            }
        }

        return {manufacturerCode: descriptor.payload.manufacturercode, type};
    }

    public async activeEndpoints(networkAddress: number): Promise<ActiveEndpoints> {
        return await this.queue.execute<ActiveEndpoints>(async () => {
            this.checkInterpanLock();
            const response = this.waitForAreqZdo('activeEpRsp', {nwkaddr: networkAddress});
            const payload = {dstaddr: networkAddress, nwkaddrofinterest: networkAddress};
            await this.znp.request(Subsystem.ZDO, 'activeEpReq', payload, response.ID);
            const activeEp = await response.start();
            return {endpoints: activeEp.payload.activeeplist};
        }, networkAddress);
    }

    public async simpleDescriptor(networkAddress: number, endpointID: number): Promise<SimpleDescriptor> {
        return await this.queue.execute<SimpleDescriptor>(async () => {
            this.checkInterpanLock();
            const responsePayload = {nwkaddr: networkAddress, endpoint: endpointID};
            const response = this.waitForAreqZdo('simpleDescRsp', responsePayload);
            const payload = {dstaddr: networkAddress, nwkaddrofinterest: networkAddress, endpoint: endpointID};
            await this.znp.request(Subsystem.ZDO, 'simpleDescReq', payload, response.ID);
            const descriptor = await response.start();
            return {
                profileID: descriptor.payload.profileid,
                endpointID: descriptor.payload.endpoint,
                deviceID: descriptor.payload.deviceid,
                inputClusters: descriptor.payload.inclusterlist,
                outputClusters: descriptor.payload.outclusterlist,
            };
        }, networkAddress);
    }

    public async sendZclFrameToEndpoint(
        ieeeAddr: string,
        networkAddress: number,
        endpoint: number,
        zclFrame: Zcl.Frame,
        timeout: number,
        disableResponse: boolean,
        disableRecovery: boolean,
        sourceEndpoint?: number,
    ): Promise<Events.ZclPayload | void> {
        return await this.queue.execute<Events.ZclPayload | void>(async () => {
            this.checkInterpanLock();
            return await this.sendZclFrameToEndpointInternal(
                ieeeAddr,
                networkAddress,
                endpoint,
                sourceEndpoint || 1,
                zclFrame,
                timeout,
                disableResponse,
                disableRecovery,
                0,
                0,
                false,
                false,
                false,
                undefined,
            );
        }, networkAddress);
    }

    private async sendZclFrameToEndpointInternal(
        ieeeAddr: string,
        networkAddress: number,
        endpoint: number,
        sourceEndpoint: number,
        zclFrame: Zcl.Frame,
        timeout: number,
        disableResponse: boolean,
        disableRecovery: boolean,
        responseAttempt: number,
        dataRequestAttempt: number,
        checkedNetworkAddress: boolean,
        discoveredRoute: boolean,
        assocRemove: boolean,
        assocRestore?: {ieeeadr: string; nwkaddr: number; noderelation: number},
    ): Promise<Events.ZclPayload | void> {
        logger.debug(
            `sendZclFrameToEndpointInternal ${ieeeAddr}:${networkAddress}/${endpoint} ` +
                `(${responseAttempt},${dataRequestAttempt},${this.queue.count()})`,
            NS,
        );
        let response = null;
        const command = zclFrame.command;
        if (command.response != undefined && disableResponse === false) {
            response = this.waitForInternal(
                networkAddress,
                endpoint,
                zclFrame.header.frameControl.frameType,
                Zcl.Direction.SERVER_TO_CLIENT,
                zclFrame.header.transactionSequenceNumber,
                zclFrame.cluster.ID,
                command.response,
                timeout,
            );
        } else if (!zclFrame.header.frameControl.disableDefaultResponse) {
            response = this.waitForInternal(
                networkAddress,
                endpoint,
                Zcl.FrameType.GLOBAL,
                Zcl.Direction.SERVER_TO_CLIENT,
                zclFrame.header.transactionSequenceNumber,
                zclFrame.cluster.ID,
                Zcl.Foundation.defaultRsp.ID,
                timeout,
            );
        }

        const dataConfirmResult = await this.dataRequest(
            networkAddress,
            endpoint,
            sourceEndpoint,
            zclFrame.cluster.ID,
            Constants.AF.DEFAULT_RADIUS,
            zclFrame.toBuffer(),
            timeout,
        );

        if (dataConfirmResult !== ZnpCommandStatus.SUCCESS) {
            // In case dataConfirm timesout (= null) or gives an error, try to recover
            logger.debug(`Data confirm error (${ieeeAddr}:${networkAddress},${dataConfirmResult},${dataRequestAttempt})`, NS);
            if (response !== null) response.cancel();

            /**
             * In case we did an assocRemove in the previous attempt and it still fails after this, assume that the
             * coordinator is still the parent of the device (but for some reason the device is not available now).
             * Re-add the device to the assoc table, otherwise we will never be able to reach it anymore.
             */
            if (assocRemove && assocRestore && this.supportsAssocAdd()) {
                logger.debug(`assocAdd(${assocRestore.ieeeadr})`, NS);
                await this.znp.request(Subsystem.UTIL, 'assocAdd', assocRestore);
                assocRestore = undefined;
            }

            const recoverableErrors = [
                ZnpCommandStatus.NWK_NO_ROUTE,
                ZnpCommandStatus.MAC_NO_ACK,
                ZnpCommandStatus.MAC_CHANNEL_ACCESS_FAILURE,
                ZnpCommandStatus.MAC_TRANSACTION_EXPIRED,
                ZnpCommandStatus.BUFFER_FULL,
                ZnpCommandStatus.MAC_NO_RESOURCES,
            ];

            if (dataRequestAttempt >= 4 || !recoverableErrors.includes(dataConfirmResult) || disableRecovery) {
                throw new DataConfirmError(dataConfirmResult);
            }

            if (
                dataConfirmResult === ZnpCommandStatus.MAC_CHANNEL_ACCESS_FAILURE ||
                dataConfirmResult === ZnpCommandStatus.BUFFER_FULL ||
                dataConfirmResult === ZnpCommandStatus.MAC_NO_RESOURCES
            ) {
                /**
                 * MAC_CHANNEL_ACCESS_FAILURE: When many commands at once are executed we can end up in a MAC
                 * channel access failure error. This is because there is too much traffic on the network.
                 * Retry this command once after a cooling down period.
                 * BUFFER_FULL: When many commands are executed at once the buffer can get full, wait
                 * some time and retry.
                 * MAC_NO_RESOURCES: Operation could not be completed because no memory resources are available,
                 * wait some time and retry.
                 */
                await Wait(2000);
                return await this.sendZclFrameToEndpointInternal(
                    ieeeAddr,
                    networkAddress,
                    endpoint,
                    sourceEndpoint,
                    zclFrame,
                    timeout,
                    disableResponse,
                    disableRecovery,
                    responseAttempt,
                    dataRequestAttempt + 1,
                    checkedNetworkAddress,
                    discoveredRoute,
                    assocRemove,
                    assocRestore,
                );
            } else {
                let doAssocRemove = false;
                if (
                    !assocRemove &&
                    dataConfirmResult === ZnpCommandStatus.MAC_TRANSACTION_EXPIRED &&
                    dataRequestAttempt >= 1 &&
                    this.supportsAssocRemove()
                ) {
                    const match = await this.znp.requestWithReply(Subsystem.UTIL, 'assocGetWithAddress', {
                        extaddr: ieeeAddr,
                        nwkaddr: networkAddress,
                    });

                    if (match.payload.nwkaddr !== 0xfffe && match.payload.noderelation !== 255) {
                        doAssocRemove = true;
                        assocRestore = {ieeeadr: ieeeAddr, nwkaddr: networkAddress, noderelation: match.payload.noderelation};
                    }

                    assocRemove = true;
                }

                // NWK_NO_ROUTE: no network route => rediscover route
                // MAC_NO_ACK: route may be corrupted
                // MAC_TRANSACTION_EXPIRED: Mac layer is sleeping
                if (doAssocRemove) {
                    /**
                     * Since child aging is disabled on the firmware, when a end device is directly connected
                     * to the coordinator and changes parent and the coordinator does not recevie this update,
                     * it still thinks it's directly connected.
                     * A discoverRoute() is not send out in this case, therefore remove it from the associated device
                     * list and try again.
                     * Note: assocRemove is a custom command, not available by default, only available on recent
                     * z-stack-firmware firmware version. In case it's not supported by the coordinator we will
                     * automatically timeout after 60000ms.
                     */
                    logger.debug(`assocRemove(${ieeeAddr})`, NS);
                    await this.znp.request(Subsystem.UTIL, 'assocRemove', {ieeeadr: ieeeAddr});
                } else if (!discoveredRoute && dataRequestAttempt >= 1) {
                    discoveredRoute = true;
                    await this.discoverRoute(networkAddress);
                } else if (!checkedNetworkAddress && dataRequestAttempt >= 1) {
                    // Figure out once if the network address has been changed.
                    try {
                        checkedNetworkAddress = true;
                        const actualNetworkAddress = await this.requestNetworkAddress(ieeeAddr);
                        if (networkAddress !== actualNetworkAddress) {
                            logger.debug(`Failed because request was done with wrong network address`, NS);
                            discoveredRoute = true;
                            networkAddress = actualNetworkAddress;
                            await this.discoverRoute(actualNetworkAddress);
                        } else {
                            logger.debug('Network address did not change', NS);
                        }
                    } catch {
                        /* empty */
                    }
                } else {
                    logger.debug('Wait 2000ms', NS);
                    await Wait(2000);
                }

                return await this.sendZclFrameToEndpointInternal(
                    ieeeAddr,
                    networkAddress,
                    endpoint,
                    sourceEndpoint,
                    zclFrame,
                    timeout,
                    disableResponse,
                    disableRecovery,
                    responseAttempt,
                    dataRequestAttempt + 1,
                    checkedNetworkAddress,
                    discoveredRoute,
                    assocRemove,
                    assocRestore,
                );
            }
        }

        if (response !== null) {
            try {
                const result = await response.start().promise;
                return result;
            } catch (error) {
                logger.debug(`Response timeout (${ieeeAddr}:${networkAddress},${responseAttempt})`, NS);
                if (responseAttempt < 1 && !disableRecovery) {
                    // No response could be because the radio of the end device is turned off:
                    // Sometimes the coordinator does not properly set the PENDING flag.
                    // Try to rewrite the device entry in the association table, this fixes it sometimes.
                    const match = await this.znp.requestWithReply(Subsystem.UTIL, 'assocGetWithAddress', {
                        extaddr: ieeeAddr,
                        nwkaddr: networkAddress,
                    });
                    logger.debug(
                        `Response timeout recovery: Node relation ${match.payload.noderelation} (${ieeeAddr} / ${match.payload.nwkaddr})`,
                        NS,
                    );
                    if (
                        this.supportsAssocAdd() &&
                        this.supportsAssocRemove() &&
                        match.payload.nwkaddr !== 0xfffe &&
                        match.payload.noderelation == 1
                    ) {
                        logger.debug(`Response timeout recovery: Rewrite association table entry (${ieeeAddr})`, NS);
                        await this.znp.request(Subsystem.UTIL, 'assocRemove', {ieeeadr: ieeeAddr});
                        await this.znp.request(Subsystem.UTIL, 'assocAdd', {
                            ieeeadr: ieeeAddr,
                            nwkaddr: networkAddress,
                            noderelation: match.payload.noderelation,
                        });
                    }
                    // No response could be of invalid route, e.g. when message is send to wrong parent of end device.
                    await this.discoverRoute(networkAddress);
                    return await this.sendZclFrameToEndpointInternal(
                        ieeeAddr,
                        networkAddress,
                        endpoint,
                        sourceEndpoint,
                        zclFrame,
                        timeout,
                        disableResponse,
                        disableRecovery,
                        responseAttempt + 1,
                        dataRequestAttempt,
                        checkedNetworkAddress,
                        discoveredRoute,
                        assocRemove,
                        assocRestore,
                    );
                } else {
                    throw error;
                }
            }
        }
    }

    public async sendZclFrameToGroup(groupID: number, zclFrame: Zcl.Frame, sourceEndpoint?: number): Promise<void> {
        return await this.queue.execute<void>(async () => {
            this.checkInterpanLock();
            await this.dataRequestExtended(
                AddressMode.ADDR_GROUP,
                groupID,
                0xff,
                0,
                sourceEndpoint || 1,
                zclFrame.cluster.ID,
                Constants.AF.DEFAULT_RADIUS,
                zclFrame.toBuffer(),
                3000,
                true,
            );

            /**
             * As a group command is not confirmed and thus immidiately returns
             * (contrary to network address requests) we will give the
             * command some time to 'settle' in the network.
             */
            await Wait(200);
        });
    }

    public async sendZclFrameToAll(endpoint: number, zclFrame: Zcl.Frame, sourceEndpoint: number, destination: BroadcastAddress): Promise<void> {
        return await this.queue.execute<void>(async () => {
            this.checkInterpanLock();
            await this.dataRequestExtended(
                AddressMode.ADDR_16BIT,
                destination,
                endpoint,
                0,
                sourceEndpoint,
                zclFrame.cluster.ID,
                Constants.AF.DEFAULT_RADIUS,
                zclFrame.toBuffer(),
                3000,
                false,
                0,
            );

            /**
             * As a broadcast command is not confirmed and thus immidiately returns
             * (contrary to network address requests) we will give the
             * command some time to 'settle' in the network.
             */
            await Wait(200);
        });
    }

    public async lqi(networkAddress: number): Promise<LQI> {
        return await this.queue.execute<LQI>(async (): Promise<LQI> => {
            this.checkInterpanLock();
            const neighbors: LQINeighbor[] = [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const request = async (startIndex: number): Promise<any> => {
                const response = this.waitForAreqZdo('mgmtLqiRsp', {srcaddr: networkAddress});
                await this.znp.request(Subsystem.ZDO, 'mgmtLqiReq', {dstaddr: networkAddress, startindex: startIndex}, response.ID);
                const result = await response.start();
                return result;
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const add = (list: any): void => {
                for (const entry of list) {
                    neighbors.push({
                        linkquality: entry.lqi,
                        networkAddress: entry.nwkAddr,
                        ieeeAddr: entry.extAddr,
                        relationship: entry.relationship,
                        depth: entry.depth,
                    });
                }
            };

            let response = await request(0);
            add(response.payload.neighborlqilist);
            const size = response.payload.neighbortableentries;
            let nextStartIndex = response.payload.neighborlqilist.length;

            while (neighbors.length < size) {
                response = await request(nextStartIndex);
                add(response.payload.neighborlqilist);
                nextStartIndex += response.payload.neighborlqilist.length;
            }

            return {neighbors};
        }, networkAddress);
    }

    public async routingTable(networkAddress: number): Promise<RoutingTable> {
        return await this.queue.execute<RoutingTable>(async (): Promise<RoutingTable> => {
            this.checkInterpanLock();
            const table: RoutingTableEntry[] = [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const request = async (startIndex: number): Promise<any> => {
                const response = this.waitForAreqZdo('mgmtRtgRsp', {srcaddr: networkAddress});
                await this.znp.request(Subsystem.ZDO, 'mgmtRtgReq', {dstaddr: networkAddress, startindex: startIndex}, response.ID);
                const result = await response.start();
                return result;
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const add = (list: any): void => {
                for (const entry of list) {
                    table.push({
                        destinationAddress: entry.destNwkAddr,
                        status: entry.routeStatus,
                        nextHop: entry.nextHopNwkAddr,
                    });
                }
            };

            let response = await request(0);
            add(response.payload.routingtablelist);
            const size = response.payload.routingtableentries;
            let nextStartIndex = response.payload.routingtablelist.length;

            while (table.length < size) {
                response = await request(nextStartIndex);
                add(response.payload.routingtablelist);
                nextStartIndex += response.payload.routingtablelist.length;
            }

            return {table};
        }, networkAddress);
    }

    public async addInstallCode(ieeeAddress: string, key: Buffer): Promise<void> {
        assert(this.version.product !== ZnpVersion.zStack12, 'Install code is not supported for ZStack 1.2 adapter');
        const payload = {installCodeFormat: key.length === 18 ? 1 : 2, ieeeaddr: ieeeAddress, installCode: key};
        await this.znp.request(Subsystem.APP_CNF, 'bdbAddInstallCode', payload);
    }

    public async bind(
        destinationNetworkAddress: number,
        sourceIeeeAddress: string,
        sourceEndpoint: number,
        clusterID: number,
        destinationAddressOrGroup: string | number,
        type: 'endpoint' | 'group',
        destinationEndpoint?: number,
    ): Promise<void> {
        await this.bindInternal(
            'bind',
            destinationNetworkAddress,
            sourceIeeeAddress,
            sourceEndpoint,
            clusterID,
            destinationAddressOrGroup,
            type,
            destinationEndpoint,
        );
    }

    public async unbind(
        destinationNetworkAddress: number,
        sourceIeeeAddress: string,
        sourceEndpoint: number,
        clusterID: number,
        destinationAddressOrGroup: string | number,
        type: 'endpoint' | 'group',
        destinationEndpoint?: number,
    ): Promise<void> {
        await this.bindInternal(
            'unbind',
            destinationNetworkAddress,
            sourceIeeeAddress,
            sourceEndpoint,
            clusterID,
            destinationAddressOrGroup,
            type,
            destinationEndpoint,
        );
    }

    private async bindInternal(
        bindType: 'bind' | 'unbind',
        destinationNetworkAddress: number,
        sourceIeeeAddress: string,
        sourceEndpoint: number,
        clusterID: number,
        destinationAddressOrGroup: string | number,
        targetType: 'endpoint' | 'group',
        destinationEndpoint?: number,
    ): Promise<void> {
        return await this.queue.execute<void>(async () => {
            this.checkInterpanLock();
            const response = this.waitForAreqZdo(`${bindType}Rsp`, {srcaddr: destinationNetworkAddress});

            const payload = {
                dstaddr: destinationNetworkAddress,
                srcaddr: sourceIeeeAddress,
                srcendpoint: sourceEndpoint,
                clusterid: clusterID,
                dstaddrmode: targetType === 'group' ? AddressMode.ADDR_GROUP : AddressMode.ADDR_64BIT,
                dstaddress: this.toAddressString(destinationAddressOrGroup),
                dstendpoint: targetType === 'group' ? 0xff : destinationEndpoint,
            };

            await this.znp.request(Subsystem.ZDO, `${bindType}Req`, payload, response.ID);
            await response.start();
        }, destinationNetworkAddress);
    }

    public removeDevice(networkAddress: number, ieeeAddr: string): Promise<void> {
        return this.queue.execute<void>(async () => {
            this.checkInterpanLock();
            const response = this.waitForAreqZdo('mgmtLeaveRsp', {srcaddr: networkAddress});

            const payload = {
                dstaddr: networkAddress,
                deviceaddress: ieeeAddr,
                removechildrenRejoin: 0,
            };

            await this.znp.request(Subsystem.ZDO, 'mgmtLeaveReq', payload, response.ID);
            await response.start();
        }, networkAddress);
    }

    /**
     * Event handlers
     */
    public onZnpClose(): void {
        if (!this.closing) {
            this.emit('disconnected');
        }
    }

    public onZnpRecieved(object: ZpiObject): void {
        if (object.type !== UnpiConstants.Type.AREQ) {
            return;
        }

        if (object.subsystem === Subsystem.ZDO) {
            if (object.command === 'tcDeviceInd') {
                const payload: Events.DeviceJoinedPayload = {
                    networkAddress: object.payload.nwkaddr,
                    ieeeAddr: object.payload.extaddr,
                };

                this.emit('deviceJoined', payload);
            } else if (object.command === 'endDeviceAnnceInd') {
                const payload: Events.DeviceAnnouncePayload = {
                    networkAddress: object.payload.nwkaddr,
                    ieeeAddr: object.payload.ieeeaddr,
                };

                // Only discover routes to end devices, if bit 1 of capabilities === 0 it's an end device.
                const isEndDevice = (object.payload.capabilities & (1 << 1)) === 0;
                if (isEndDevice) {
                    if (!this.deviceAnnounceRouteDiscoveryDebouncers.has(payload.networkAddress)) {
                        // If a device announces multiple times in a very short time, it makes no sense
                        // to rediscover the route every time.
                        const debouncer = debounce(
                            () => {
                                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                                this.queue.execute<void>(async () => {
                                    /* istanbul ignore next */
                                    this.discoverRoute(payload.networkAddress, false).catch(() => {});
                                }, payload.networkAddress);
                            },
                            60 * 1000,
                            {immediate: true},
                        );
                        this.deviceAnnounceRouteDiscoveryDebouncers.set(payload.networkAddress, debouncer);
                    }

                    const debouncer = this.deviceAnnounceRouteDiscoveryDebouncers.get(payload.networkAddress);
                    assert(debouncer);
                    debouncer();
                }

                this.emit('deviceAnnounce', payload);
            } else if (object.command === 'nwkAddrRsp') {
                const payload: Events.NetworkAddressPayload = {
                    networkAddress: object.payload.nwkaddr,
                    ieeeAddr: object.payload.ieeeaddr,
                };

                this.emit('networkAddress', payload);
            } else if (object.command === 'concentratorIndCb') {
                // Some routers may change short addresses and the announcement
                // is missed by the coordinator. This can happen when there are
                // power outages or other interruptions in service. They may
                // not send additional announcements, causing the device to go
                // offline. However, those devices may instead send
                // Concentrator Indicator Callback commands, which contain both
                // the short and the long address allowing us to update our own
                // mappings.
                // https://e2e.ti.com/cfs-file/__key/communityserver-discussions-components-files/158/4403.zstacktask.c
                // https://github.com/Koenkk/zigbee-herdsman/issues/74
                const payload: Events.NetworkAddressPayload = {
                    networkAddress: object.payload.srcaddr,
                    ieeeAddr: object.payload.extaddr,
                };

                this.emit('networkAddress', payload);
            } else {
                /* istanbul ignore else */
                if (object.command === 'leaveInd') {
                    if (object.payload.rejoin) {
                        logger.debug(`Device leave: Got leave indication with rejoin=true, nothing to do`, NS);
                    } else {
                        const payload: Events.DeviceLeavePayload = {
                            networkAddress: object.payload.srcaddr,
                            ieeeAddr: object.payload.extaddr,
                        };

                        this.emit('deviceLeave', payload);
                    }
                }
            }
        } else {
            /* istanbul ignore else */
            if (object.subsystem === Subsystem.AF) {
                /* istanbul ignore else */
                if (object.command === 'incomingMsg' || object.command === 'incomingMsgExt') {
                    const payload: Events.ZclPayload = {
                        clusterID: object.payload.clusterid,
                        data: object.payload.data,
                        header: Zcl.Header.fromBuffer(object.payload.data),
                        address: object.payload.srcaddr,
                        endpoint: object.payload.srcendpoint,
                        linkquality: object.payload.linkquality,
                        groupID: object.payload.groupid,
                        wasBroadcast: object.payload.wasbroadcast === 1,
                        destinationEndpoint: object.payload.dstendpoint,
                    };

                    this.waitress.resolve(payload);
                    this.emit('zclPayload', payload);
                }
            }
        }
    }

    public async getNetworkParameters(): Promise<NetworkParameters> {
        const result = await this.znp.requestWithReply(Subsystem.ZDO, 'extNwkInfo', {});
        return {
            panID: result.payload.panid,
            extendedPanID: result.payload.extendedpanid,
            channel: result.payload.channel,
        };
    }

    public async supportsBackup(): Promise<boolean> {
        return true;
    }

    public async backup(ieeeAddressesInDatabase: string[]): Promise<Models.Backup> {
        return await this.adapterManager.backup.createBackup(ieeeAddressesInDatabase);
    }

    public async setChannelInterPAN(channel: number): Promise<void> {
        return await this.queue.execute<void>(async () => {
            this.interpanLock = true;
            await this.znp.request(Subsystem.AF, 'interPanCtl', {cmd: 1, data: [channel]});

            if (!this.interpanEndpointRegistered) {
                // Make sure that endpoint 12 is registered to proxy the InterPAN messages.
                await this.znp.request(Subsystem.AF, 'interPanCtl', {cmd: 2, data: [12]});
                this.interpanEndpointRegistered = true;
            }
        });
    }

    public async sendZclFrameInterPANToIeeeAddr(zclFrame: Zcl.Frame, ieeeAddr: string): Promise<void> {
        return await this.queue.execute<void>(async () => {
            await this.dataRequestExtended(
                AddressMode.ADDR_64BIT,
                ieeeAddr,
                0xfe,
                0xffff,
                12,
                zclFrame.cluster.ID,
                30,
                zclFrame.toBuffer(),
                10000,
                false,
            );
        });
    }

    public async sendZclFrameInterPANBroadcast(zclFrame: Zcl.Frame, timeout: number): Promise<Events.ZclPayload> {
        return await this.queue.execute<Events.ZclPayload>(async () => {
            const command = zclFrame.command;
            if (command.response == undefined) {
                throw new Error(`Command '${command.name}' has no response, cannot wait for response`);
            }

            const response = this.waitForInternal(
                undefined,
                0xfe,
                zclFrame.header.frameControl.frameType,
                Zcl.Direction.SERVER_TO_CLIENT,
                undefined,
                zclFrame.cluster.ID,
                command.response,
                timeout,
            );

            try {
                await this.dataRequestExtended(
                    AddressMode.ADDR_16BIT,
                    0xffff,
                    0xfe,
                    0xffff,
                    12,
                    zclFrame.cluster.ID,
                    30,
                    zclFrame.toBuffer(),
                    10000,
                    false,
                );
            } catch (error) {
                response.cancel();
                throw error;
            }

            return await response.start().promise;
        });
    }

    public async restoreChannelInterPAN(): Promise<void> {
        return await this.queue.execute<void>(async () => {
            await this.znp.request(Subsystem.AF, 'interPanCtl', {cmd: 0, data: []});
            // Give adapter some time to restore, otherwise stuff crashes
            await Wait(3000);
            this.interpanLock = false;
        });
    }

    public async changeChannel(newChannel: number): Promise<void> {
        return await this.queue.execute<void>(async () => {
            this.checkInterpanLock();

            const payload = {
                dstaddr: 0xffff, // broadcast with sleepy
                dstaddrmode: AddressMode.ADDR_BROADCAST,
                channelmask: [newChannel].reduce((a, c) => a + (1 << c), 0),
                scanduration: 0xfe, // change channel
                scancount: 0,
                nwkmanageraddr: 0,
            };

            await this.znp.request(Subsystem.ZDO, 'mgmtNwkUpdateReq', payload);
            // wait for the broadcast to propagate and the adapter to actually change
            await Wait(10000);
        });
    }

    public async setTransmitPower(value: number): Promise<void> {
        return await this.queue.execute<void>(async () => {
            await this.znp.request(Subsystem.SYS, 'stackTune', {operation: 0, value});
        });
    }

    private waitForAreqZdo(command: string, payload?: ZpiObjectPayload): {start: () => Promise<ZpiObject>; ID: number} {
        const result = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, command, payload);
        const start = (): Promise<ZpiObject> => {
            const startResult = result.start();
            return new Promise<ZpiObject>((resolve, reject) => {
                startResult.promise
                    .then((response) => {
                        // Even though according to the Z-Stack docs the status is `0` or `1`, the actual code
                        // shows it sets the `zstack_ZdpStatus` which contains the ZDO status.
                        const code = response.payload.status;
                        if (code !== ZdoStatus.SUCCESS) {
                            reject(new Error(`ZDO error: ${command.replace('Rsp', '')} failed with status '${ZdoStatus[code]}' (${code})`));
                        } else {
                            resolve(response);
                        }
                    })
                    .catch(reject);
            });
        };
        return {start, ID: result.ID};
    }

    private waitForInternal(
        networkAddress: number | undefined,
        endpoint: number,
        frameType: Zcl.FrameType,
        direction: Zcl.Direction,
        transactionSequenceNumber: number | undefined,
        clusterID: number,
        commandIdentifier: number,
        timeout: number,
    ): {start: () => {promise: Promise<Events.ZclPayload>}; cancel: () => void} {
        const payload = {
            address: networkAddress,
            endpoint,
            clusterID,
            commandIdentifier,
            frameType,
            direction,
            transactionSequenceNumber,
        };

        const waiter = this.waitress.waitFor(payload, timeout);
        const cancel = (): void => this.waitress.remove(waiter.ID);
        return {start: waiter.start, cancel};
    }

    public waitFor(
        networkAddress: number | undefined,
        endpoint: number,
        frameType: Zcl.FrameType,
        direction: Zcl.Direction,
        transactionSequenceNumber: number | undefined,
        clusterID: number,
        commandIdentifier: number,
        timeout: number,
    ): {promise: Promise<Events.ZclPayload>; cancel: () => void} {
        const waiter = this.waitForInternal(
            networkAddress,
            endpoint,
            frameType,
            direction,
            transactionSequenceNumber,
            clusterID,
            commandIdentifier,
            timeout,
        );

        return {cancel: waiter.cancel, promise: waiter.start().promise};
    }

    /**
     * Private methods
     */
    private async dataRequest(
        destinationAddress: number,
        destinationEndpoint: number,
        sourceEndpoint: number,
        clusterID: number,
        radius: number,
        data: Buffer,
        timeout: number,
    ): Promise<number> {
        const transactionID = this.nextTransactionID();
        const response = this.znp.waitFor(Type.AREQ, Subsystem.AF, 'dataConfirm', {transid: transactionID}, timeout);

        await this.znp.request(
            Subsystem.AF,
            'dataRequest',
            {
                dstaddr: destinationAddress,
                destendpoint: destinationEndpoint,
                srcendpoint: sourceEndpoint,
                clusterid: clusterID,
                transid: transactionID,
                options: 0,
                radius: radius,
                len: data.length,
                data: data,
            },
            response.ID,
        );

        let result = null;
        try {
            const dataConfirm = await response.start().promise;
            result = dataConfirm.payload.status;
        } catch {
            result = DataConfirmTimeout;
        }

        return result;
    }

    private async dataRequestExtended(
        addressMode: number,
        destinationAddressOrGroupID: number | string,
        destinationEndpoint: number,
        panID: number,
        sourceEndpoint: number,
        clusterID: number,
        radius: number,
        data: Buffer,
        timeout: number,
        confirmation: boolean,
        attemptsLeft = 5,
    ): Promise<ZpiObject | void> {
        const transactionID = this.nextTransactionID();
        const response = confirmation ? this.znp.waitFor(Type.AREQ, Subsystem.AF, 'dataConfirm', {transid: transactionID}, timeout) : undefined;

        await this.znp.request(
            Subsystem.AF,
            'dataRequestExt',
            {
                dstaddrmode: addressMode,
                dstaddr: this.toAddressString(destinationAddressOrGroupID),
                destendpoint: destinationEndpoint,
                dstpanid: panID,
                srcendpoint: sourceEndpoint,
                clusterid: clusterID,
                transid: transactionID,
                options: 0, // TODO: why was this here? Constants.AF.options.DISCV_ROUTE,
                radius,
                len: data.length,
                data: data,
            },
            response?.ID,
        );

        if (confirmation && response) {
            const dataConfirm = await response.start().promise;
            if (dataConfirm.payload.status !== ZnpCommandStatus.SUCCESS) {
                if (
                    attemptsLeft > 0 &&
                    (dataConfirm.payload.status === ZnpCommandStatus.MAC_CHANNEL_ACCESS_FAILURE ||
                        dataConfirm.payload.status === ZnpCommandStatus.BUFFER_FULL)
                ) {
                    /**
                     * 225: When many commands at once are executed we can end up in a MAC channel access failure
                     * error. This is because there is too much traffic on the network.
                     * Retry this command once after a cooling down period.
                     */
                    await Wait(2000);
                    return await this.dataRequestExtended(
                        addressMode,
                        destinationAddressOrGroupID,
                        destinationEndpoint,
                        panID,
                        sourceEndpoint,
                        clusterID,
                        radius,
                        data,
                        timeout,
                        confirmation,
                        attemptsLeft - 1,
                    );
                } else {
                    throw new DataConfirmError(dataConfirm.payload.status);
                }
            }

            return dataConfirm;
        }
    }

    private nextTransactionID(): number {
        this.transactionID++;

        if (this.transactionID > 255) {
            this.transactionID = 1;
        }

        return this.transactionID;
    }

    private toAddressString(address: number | string): string {
        if (typeof address === 'number') {
            let addressString = address.toString(16);

            for (let i = addressString.length; i < 16; i++) {
                addressString = '0' + addressString;
            }

            return `0x${addressString}`;
        } else {
            return address.toString();
        }
    }

    private waitressTimeoutFormatter(matcher: WaitressMatcher, timeout: number): string {
        return (
            `Timeout - ${matcher.address} - ${matcher.endpoint}` +
            ` - ${matcher.transactionSequenceNumber} - ${matcher.clusterID}` +
            ` - ${matcher.commandIdentifier} after ${timeout}ms`
        );
    }

    private waitressValidator(payload: Events.ZclPayload, matcher: WaitressMatcher): boolean {
        return Boolean(
            payload.header &&
                (!matcher.address || payload.address === matcher.address) &&
                payload.endpoint === matcher.endpoint &&
                (!matcher.transactionSequenceNumber || payload.header.transactionSequenceNumber === matcher.transactionSequenceNumber) &&
                payload.clusterID === matcher.clusterID &&
                matcher.frameType === payload.header.frameControl.frameType &&
                matcher.commandIdentifier === payload.header.commandIdentifier &&
                matcher.direction === payload.header.frameControl.direction,
        );
    }

    private checkInterpanLock(): void {
        if (this.interpanLock) {
            throw new Error(`Cannot execute command, in Inter-PAN mode`);
        }
    }
}

export default ZStackAdapter;
