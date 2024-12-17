import {Adapter} from '../adapter';
import {wait} from '../utils';
import {logger} from '../utils/logger';
import {assertString} from '../utils/utils';
import * as Zcl from '../zspec/zcl';

const NS = 'zh:controller:touchlink';
const scanChannels = [11, 15, 20, 25, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26];

export class Touchlink {
    private adapter: Adapter;
    private locked: boolean;

    public constructor(adapter: Adapter) {
        this.adapter = adapter;
        this.locked = false;
    }

    private lock(lock: boolean): void {
        if (lock && this.locked) {
            throw new Error(`Touchlink operation already in progress`);
        }

        this.locked = lock;
    }

    private transactionNumber(): number {
        return Math.floor(Math.random() * 0xffffffff);
    }

    public async scan(): Promise<{ieeeAddr: string; channel: number}[]> {
        this.lock(true);
        const result = [];

        try {
            for (const channel of scanChannels) {
                logger.info(`Set InterPAN channel to '${channel}'`, NS);
                await this.adapter.setChannelInterPAN(channel);

                try {
                    // TODO: multiple responses are not handled yet.
                    const response = await this.adapter.sendZclFrameInterPANBroadcast(this.createScanRequestFrame(this.transactionNumber()), 500);
                    logger.debug(`Got scan response on channel '${channel}' of '${response.address}'`, NS);
                    assertString(response.address);
                    result.push({ieeeAddr: response.address, channel});
                } catch (error) {
                    logger.warning(`Scan request failed or was not answered: '${error}'`, NS);
                }
            }
        } finally {
            logger.info(`Restore InterPAN channel`, NS);
            await this.adapter.restoreChannelInterPAN();
            this.lock(false);
        }

        return result;
    }

    public async identify(ieeeAddr: string, channel: number): Promise<void> {
        this.lock(true);

        try {
            const transaction = this.transactionNumber();

            logger.info(`Set InterPAN channel to '${channel}'`, NS);
            await this.adapter.setChannelInterPAN(channel);

            await this.adapter.sendZclFrameInterPANBroadcast(this.createScanRequestFrame(transaction), 500);
            logger.debug(`Got scan response on channel '${channel}'`, NS);

            logger.debug(`Identifying '${ieeeAddr}'`, NS);
            await this.adapter.sendZclFrameInterPANToIeeeAddr(this.createIdentifyRequestFrame(transaction), ieeeAddr);
        } finally {
            logger.info(`Restore InterPAN channel`, NS);
            await this.adapter.restoreChannelInterPAN();
            this.lock(false);
        }
    }

    public async factoryReset(ieeeAddr: string, channel: number): Promise<boolean> {
        this.lock(true);
        try {
            const transaction = this.transactionNumber();

            logger.info(`Set InterPAN channel to '${channel}'`, NS);
            await this.adapter.setChannelInterPAN(channel);

            await this.adapter.sendZclFrameInterPANBroadcast(this.createScanRequestFrame(transaction), 500);
            logger.debug(`Got scan response on channel '${channel}'`, NS);

            logger.debug(`Identifying '${ieeeAddr}'`, NS);
            await this.adapter.sendZclFrameInterPANToIeeeAddr(this.createIdentifyRequestFrame(transaction), ieeeAddr);
            await wait(2000);

            logger.debug(`Reset to factory new '${ieeeAddr}'`, NS);
            await this.adapter.sendZclFrameInterPANToIeeeAddr(this.createResetFactoryNewRequestFrame(transaction), ieeeAddr);
        } finally {
            logger.info(`Restore InterPAN channel`, NS);
            await this.adapter.restoreChannelInterPAN();
            this.lock(false);
        }

        return true;
    }

    public async factoryResetFirst(): Promise<boolean> {
        this.lock(true);
        let done = false;

        try {
            for (const channel of scanChannels) {
                logger.info(`Set InterPAN channel to '${channel}'`, NS);
                await this.adapter.setChannelInterPAN(channel);

                try {
                    const transaction = this.transactionNumber();

                    const response = await this.adapter.sendZclFrameInterPANBroadcast(this.createScanRequestFrame(transaction), 500);
                    logger.debug(`Got scan response on channel '${channel}'`, NS);
                    assertString(response.address);

                    // Device answered (if not it will fall in the catch below),
                    // identify it (this will make e.g. the bulb flash)
                    logger.debug(`Identifying`, NS);
                    await this.adapter.sendZclFrameInterPANToIeeeAddr(this.createIdentifyRequestFrame(transaction), response.address);
                    await wait(2000);

                    logger.debug(`Reset to factory new`, NS);
                    await this.adapter.sendZclFrameInterPANToIeeeAddr(this.createResetFactoryNewRequestFrame(transaction), response.address);
                    done = true;
                } catch (error) {
                    logger.warning(`Scan request failed or was not answered: '${error}'`, NS);
                }

                if (done) break;
            }
        } finally {
            logger.info(`Restore InterPAN channel`, NS);
            await this.adapter.restoreChannelInterPAN();
            this.lock(false);
        }

        return done;
    }

    private createScanRequestFrame(transaction: number): Zcl.Frame {
        return Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            0,
            'scanRequest',
            Zcl.Clusters.touchlink.ID,
            {transactionID: transaction, zigbeeInformation: 4, touchlinkInformation: 18},
            {},
        );
    }

    private createIdentifyRequestFrame(transaction: number): Zcl.Frame {
        return Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            0,
            'identifyRequest',
            Zcl.Clusters.touchlink.ID,
            {transactionID: transaction, duration: 65535},
            {},
        );
    }

    private createResetFactoryNewRequestFrame(transaction: number): Zcl.Frame {
        return Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            0,
            'resetToFactoryNew',
            Zcl.Clusters.touchlink.ID,
            {transactionID: transaction},
            {},
        );
    }
}

export default Touchlink;
