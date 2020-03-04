import {Adapter} from '../adapter';
import * as Zcl from '../zcl';
import {Wait, AssertString} from '../utils';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:controller:touchlink');
const scanChannels = [11, 15, 20, 25, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26];

class Touchlink {
    private adapter: Adapter;

    public constructor(adapter: Adapter) {
        this.adapter = adapter;
    }

    public async factoryReset(): Promise<boolean> {
        let done = false;

        for (const channel of scanChannels) {
            debug(`Set InterPAN channel to '${channel}'`);
            await this.adapter.setChannelInterPAN(channel);

            try {
                const response = await this.adapter.sendZclFrameInterPANBroadcast(
                    this.createScanRequestFrame(), 500
                );
                debug(`Got scan response on channel '${channel}'`);
                AssertString(response.address);

                // Device answered (if not it will fall in the catch below),
                // identify it (this will make e.g. the bulb flash)
                debug(`Identifying`);
                await this.adapter.sendZclFrameInterPANToIeeeAddr(this.createIdentifyRequestFrame(), response.address);
                await Wait(2000);

                debug(`Reset to factory new`);
                await this.adapter.sendZclFrameInterPANToIeeeAddr(
                    this.createResetFactoryNewRequestFrame(), response.address
                );
                done = true;
            } catch (error) {
                debug(`Scan request failed or was not answered: '${error}'`);
            }

            debug(`Restore InterPAN channel`);
            await this.adapter.restoreChannelInterPAN();

            if (done) break;
        }

        return done;
    }

    private createScanRequestFrame(): Zcl.ZclFrame {
        return Zcl.ZclFrame.create(
            Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true,
            null, 0, 'scanRequest', Zcl.Utils.getCluster('touchlink').ID,
            {transactionID: 1, zigbeeInformation: 4, touchlinkInformation: 18}
        );
    }

    private createIdentifyRequestFrame(): Zcl.ZclFrame {
        return Zcl.ZclFrame.create(
            Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true,
            null, 0, 'identifyRequest', Zcl.Utils.getCluster('touchlink').ID,
            {transactionID: 1, duration: 65535}
        );
    }

    private createResetFactoryNewRequestFrame(): Zcl.ZclFrame {
        return Zcl.ZclFrame.create(
            Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true,
            null, 0, 'resetToFactoryNew', Zcl.Utils.getCluster('touchlink').ID,
            {transactionID: 1}
        );
    }
}

export default Touchlink;
