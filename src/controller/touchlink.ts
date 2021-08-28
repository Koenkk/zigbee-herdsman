import {Adapter} from '../adapter';
import * as Zcl from '../zcl';
import {Wait, AssertString} from '../utils';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:controller:touchlink');
const scanChannels = [11, 15, 20, 25, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26];

class Touchlink {
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
        return Math.floor(Math.random() * 0xFFFFFFFF);
    }

    public async scan(): Promise<{ieeeAddr: string; channel: number}[]> {
        this.lock(true);
        const result = [];

        try {
            for (const channel of scanChannels) {
                debug(`Set InterPAN channel to '${channel}'`);
                await this.adapter.setChannelInterPAN(channel);

                try {
                    // TODO: multiple responses are not handled yet.
                    const response = await this.adapter.sendZclFrameInterPANBroadcast(
                        this.createScanRequestFrame(this.transactionNumber()), 500
                    );
                    debug(`Got scan response on channel '${channel}' of '${response.address}'`);
                    AssertString(response.address);
                    result.push({ieeeAddr: response.address, channel});
                } catch (error) {
                    debug(`Scan request failed or was not answered: '${error}'`);
                }
            }
        } finally {
            debug(`Restore InterPAN channel`);
            await this.adapter.restoreChannelInterPAN();
            this.lock(false);
        }

        return result;
    }

    public async identify(ieeeAddr: string, channel: number): Promise<void> {
        this.lock(true);

        try {
            const transaction = this.transactionNumber();

            debug(`Set InterPAN channel to '${channel}'`);
            await this.adapter.setChannelInterPAN(channel);

            await this.adapter.sendZclFrameInterPANBroadcast(this.createScanRequestFrame(transaction), 500);
            debug(`Got scan response on channel '${channel}'`);

            debug(`Identifying '${ieeeAddr}'`);
            await this.adapter.sendZclFrameInterPANToIeeeAddr(this.createIdentifyRequestFrame(transaction), ieeeAddr);
        } finally {
            debug(`Restore InterPAN channel`);
            await this.adapter.restoreChannelInterPAN();
            this.lock(false);
        }
    }

    public async factoryReset(ieeeAddr: string, channel: number): Promise<boolean> {
        this.lock(true);
        try {
            const transaction = this.transactionNumber();

            debug(`Set InterPAN channel to '${channel}'`);
            await this.adapter.setChannelInterPAN(channel);

            await this.adapter.sendZclFrameInterPANBroadcast(this.createScanRequestFrame(transaction), 500);
            debug(`Got scan response on channel '${channel}'`);

            debug(`Identifying '${ieeeAddr}'`);
            await this.adapter.sendZclFrameInterPANToIeeeAddr(this.createIdentifyRequestFrame(transaction), ieeeAddr);
            await Wait(2000);

            debug(`Reset to factory new '${ieeeAddr}'`);
            await this.adapter.sendZclFrameInterPANToIeeeAddr(
                this.createResetFactoryNewRequestFrame(transaction), ieeeAddr
            );
        } finally {
            debug(`Restore InterPAN channel`);
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
                debug(`Set InterPAN channel to '${channel}'`);
                await this.adapter.setChannelInterPAN(channel);

                try {
                    const transaction = this.transactionNumber();

                    const response = await this.adapter.sendZclFrameInterPANBroadcast(
                        this.createScanRequestFrame(transaction), 500
                    );
                    debug(`Got scan response on channel '${channel}'`);
                    AssertString(response.address);

                    // Device answered (if not it will fall in the catch below),
                    // identify it (this will make e.g. the bulb flash)
                    debug(`Identifying`);
                    await this.adapter.sendZclFrameInterPANToIeeeAddr(
                        this.createIdentifyRequestFrame(transaction), response.address
                    );
                    await Wait(2000);

                    debug(`Reset to factory new`);
                    await this.adapter.sendZclFrameInterPANToIeeeAddr(
                        this.createResetFactoryNewRequestFrame(transaction), response.address
                    );
                    done = true;
                } catch (error) {
                    debug(`Scan request failed or was not answered: '${error}'`);
                }

                if (done) break;
            }
        } finally {
            debug(`Restore InterPAN channel`);
            await this.adapter.restoreChannelInterPAN();
            this.lock(false);
        }

        return done;
    }

    private createScanRequestFrame(transaction: number): Zcl.ZclFrame {
        return Zcl.ZclFrame.create(
            Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true,
            null, 0, 'scanRequest', Zcl.Utils.getCluster('touchlink').ID,
            {transactionID: transaction, zigbeeInformation: 4, touchlinkInformation: 18},
        );
    }

    private createIdentifyRequestFrame(transaction: number): Zcl.ZclFrame {
        return Zcl.ZclFrame.create(
            Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true,
            null, 0, 'identifyRequest', Zcl.Utils.getCluster('touchlink').ID,
            {transactionID: transaction, duration: 65535}
        );
    }

    private createResetFactoryNewRequestFrame(transaction: number): Zcl.ZclFrame {
        return Zcl.ZclFrame.create(
            Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true,
            null, 0, 'resetToFactoryNew', Zcl.Utils.getCluster('touchlink').ID,
            {transactionID: transaction}
        );
    }
}

export default Touchlink;
