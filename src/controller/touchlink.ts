import {Adapter} from '../adapter';
import * as Zcl from '../zcl';
import {Wait} from '../utils';

const ScanRequest = Zcl.ZclFrame.create(
    Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, false,
    null, 12, 'scanRequest', Zcl.Utils.getCluster('touchlink').ID,
    {transactionID: 1, zigbeeInformation: 4, touchlinkInformation: 18}
);

const ScanChannels = [11, 15, 20, 25];

class Touchlink {
    private adapter: Adapter;

    public constructor(adapter: Adapter) {
        this.adapter = adapter;
    }

    public async scanAndJoin() {
        for (const channel of ScanChannels) {
            await this.adapter.setChannelInterPAN(channel);
            await this.adapter.sendZclFrameInterPAN(ScanRequest);
            await Wait(5000);
        }

        await this.adapter.restoreChannelInterPAN();
    }
}

export default Touchlink;
