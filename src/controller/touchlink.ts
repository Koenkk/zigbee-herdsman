import {Adapter, Events as AdapterEvents} from '../adapter';
import * as Zcl from '../zcl';
import {Wait} from '../utils';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:controller:touchlink');

const scanRequest = Zcl.ZclFrame.create(
    Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, false,
    null, 12, 'scanRequest', Zcl.Utils.getCluster('touchlink').ID,
    {transactionID: 1, zigbeeInformation: 4, touchlinkInformation: 18}
);

const scanChannels = [11]; //, 15, 20, 25];

class Touchlink {
    private adapter: Adapter;

    public constructor(adapter: Adapter) {
        this.adapter = adapter;
    }

    public async onZclData(dataPayload: AdapterEvents.ZclDataPayload): Promise<void> {
    }

    public async scanAndJoin(): Promise<void> {
        for (const channel of scanChannels) {
            debug(`Set InterPAN channel to '${channel}'`);
            await this.adapter.setChannelInterPAN(channel);
            await this.adapter.sendZclFrameInterPAN(scanRequest);
            await Wait(5000);
        }

        debug(`Restore InterPAN channel`);
        await this.adapter.restoreChannelInterPAN();
    }
}

export default Touchlink;
