import type {Adapter} from "../adapter";
import {wait} from "../utils";
import {logger} from "../utils/logger";
import {assertString} from "../utils/utils";
import * as Zcl from "../zspec/zcl";

const NS = "zh:controller:touchlink";
const scanChannels = [11, 15, 20, 25, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26];

const createScanRequestFrame = (transaction: number): Zcl.Frame =>
    Zcl.Frame.create(
        Zcl.FrameType.SPECIFIC,
        Zcl.Direction.CLIENT_TO_SERVER,
        true,
        undefined,
        0,
        "scanRequest",
        "touchlink",
        {transactionID: transaction, zigbeeInformation: 4, touchlinkInformation: 18},
        {},
    );

const createIdentifyRequestFrame = (transaction: number): Zcl.Frame =>
    Zcl.Frame.create(
        Zcl.FrameType.SPECIFIC,
        Zcl.Direction.CLIENT_TO_SERVER,
        true,
        undefined,
        0,
        "identifyRequest",
        "touchlink",
        {transactionID: transaction, duration: 65535},
        {},
    );

const createResetFactoryNewRequestFrame = (transaction: number): Zcl.Frame =>
    Zcl.Frame.create(
        Zcl.FrameType.SPECIFIC,
        Zcl.Direction.CLIENT_TO_SERVER,
        true,
        undefined,
        0,
        "resetToFactoryNew",
        "touchlink",
        {transactionID: transaction},
        {},
    );

export class Touchlink {
    private adapter!: Adapter;
    private locked = false;

    public constructor(adapter: Adapter) {
        this.adapter = adapter;
    }

    async stop(): Promise<void> {
        if (this.locked) {
            await this.restoreChannelInterPAN();

            this.locked = false;
        }
    }

    public lock(lock: boolean): void {
        if (lock && this.locked) {
            throw new Error("Touchlink operation already in progress");
        }

        this.locked = lock;
    }

    private transactionNumber(): number {
        return Math.floor(Math.random() * 0xffffffff);
    }

    public async setChannelInterPAN(channel: number): Promise<void> {
        logger.info(`Set InterPAN channel to '${channel}'`, NS);
        await this.adapter.setChannelInterPAN(channel);
    }

    public async restoreChannelInterPAN(): Promise<void> {
        logger.info("Restore InterPAN channel", NS);
        await this.adapter.restoreChannelInterPAN();
    }

    public async scan(): Promise<{ieeeAddr: string; channel: number}[]> {
        this.lock(true);
        const result = [];

        try {
            for (const channel of scanChannels) {
                await this.setChannelInterPAN(channel);

                try {
                    // TODO: multiple responses are not handled yet.
                    const response = await this.adapter.sendZclFrameInterPANBroadcast(createScanRequestFrame(this.transactionNumber()), 500, false);
                    logger.debug(`Got scan response on channel '${channel}' of '${response.address}'`, NS);
                    assertString(response.address);
                    result.push({ieeeAddr: response.address, channel});
                } catch (error) {
                    logger.warning(`Scan request failed or was not answered: '${error}'`, NS);
                }
            }
        } finally {
            await this.restoreChannelInterPAN();
            this.lock(false);
        }

        return result;
    }

    public async identify(ieeeAddr: string, channel: number): Promise<void> {
        this.lock(true);

        try {
            const transaction = this.transactionNumber();

            await this.setChannelInterPAN(channel);

            await this.adapter.sendZclFrameInterPANBroadcast(createScanRequestFrame(transaction), 500, false);
            logger.debug(`Got scan response on channel '${channel}'`, NS);

            logger.debug(`Identifying '${ieeeAddr}'`, NS);
            await this.adapter.sendZclFrameInterPANToIeeeAddr(createIdentifyRequestFrame(transaction), ieeeAddr);
        } finally {
            await this.restoreChannelInterPAN();
            this.lock(false);
        }
    }

    public async factoryReset(ieeeAddr: string, channel: number): Promise<boolean> {
        this.lock(true);
        try {
            const transaction = this.transactionNumber();

            await this.setChannelInterPAN(channel);

            await this.adapter.sendZclFrameInterPANBroadcast(createScanRequestFrame(transaction), 500, false);
            logger.debug(`Got scan response on channel '${channel}'`, NS);

            logger.debug(`Identifying '${ieeeAddr}'`, NS);
            await this.adapter.sendZclFrameInterPANToIeeeAddr(createIdentifyRequestFrame(transaction), ieeeAddr);
            await wait(2000);

            logger.debug(`Reset to factory new '${ieeeAddr}'`, NS);
            await this.adapter.sendZclFrameInterPANToIeeeAddr(createResetFactoryNewRequestFrame(transaction), ieeeAddr);
        } finally {
            await this.restoreChannelInterPAN();
            this.lock(false);
        }

        return true;
    }

    public async factoryResetFirst(): Promise<boolean> {
        this.lock(true);
        let done = false;

        try {
            for (const channel of scanChannels) {
                await this.setChannelInterPAN(channel);

                try {
                    const transaction = this.transactionNumber();

                    const response = await this.adapter.sendZclFrameInterPANBroadcast(createScanRequestFrame(transaction), 500, false);
                    logger.debug(`Got scan response on channel '${channel}'`, NS);
                    assertString(response.address);

                    // Device answered (if not it will fall in the catch below),
                    // identify it (this will make e.g. the bulb flash)
                    logger.debug("Identifying", NS);
                    await this.adapter.sendZclFrameInterPANToIeeeAddr(createIdentifyRequestFrame(transaction), response.address);
                    await wait(2000);

                    logger.debug("Reset to factory new", NS);
                    await this.adapter.sendZclFrameInterPANToIeeeAddr(createResetFactoryNewRequestFrame(transaction), response.address);
                    done = true;
                } catch (error) {
                    logger.warning(`Scan request failed or was not answered: '${error}'`, NS);
                }

                if (done) break;
            }
        } finally {
            await this.restoreChannelInterPAN();
            this.lock(false);
        }

        return done;
    }
}

export default Touchlink;
