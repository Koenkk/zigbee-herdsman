import {Adapter} from '../adapter';
import * as Zcl from '../zcl';
import {Wait} from '../utils';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:controller:touchlink');

const scanRequest = Zcl.ZclFrame.create(
    Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, false,
    null, 12, 'scanRequest', Zcl.Utils.getCluster('touchlink').ID,
    {transactionID: 1, zigbeeInformation: 4, touchlinkInformation: 18}
);

const identifyRequest = Zcl.ZclFrame.create(
    Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, false,
    null, 12, 'identifyRequest', Zcl.Utils.getCluster('touchlink').ID,
    {transactionID: 1, duration: 65535}
);

const resetFactoryNewRequest = Zcl.ZclFrame.create(
    Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, false,
    null, 12, 'resetToFactoryNew', Zcl.Utils.getCluster('touchlink').ID,
    {transactionID: 1}
);

const scanChannels = [11, 15, 20, 25, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26];

class Touchlink {
    private adapter: Adapter;

    public constructor(adapter: Adapter) {
        this.adapter = adapter;
    }

    public async factoryReset(): Promise<void> {
        let done = false;

        for (const channel of scanChannels) {
            debug(`Set InterPAN channel to '${channel}'`);
            await this.adapter.setChannelInterPAN(channel);

            try {
                await this.adapter.sendZclFrameInterPANWithResponse(scanRequest, 2000);
                debug(`Got scan response on channel '${channel}'`);

                // Device answered (if not it will fall in the catch below),
                // identify it (this will make e.g. the bulb flash)
                debug(`Identifying`);
                await this.adapter.sendZclFrameInterPAN(identifyRequest);
                await Wait(2000);

                debug(`Reset to factory new`);
                await this.adapter.sendZclFrameInterPAN(resetFactoryNewRequest);
                done = true;
            } catch (error) {
                debug(`Scan request failed or was not answered: '${error}'`);
            }

            debug(`Restore InterPAN channel`);
            await this.adapter.restoreChannelInterPAN();

            if (done) break;
        }
    }
}

export default Touchlink;
