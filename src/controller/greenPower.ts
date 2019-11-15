import {TsType as AdapterTsType, Adapter, Events as AdapterEvents} from '../adapter';
import * as Zcl from '../zcl';

class GreenPower {
    private adapter: Adapter;

    public constructor(adapter: Adapter) {
        this.adapter = adapter;
    }

    public async onZclGreenPowerData(dataPayload: AdapterEvents.ZclDataPayload): Promise<void> {
        // if (dataPayload.frame.getCommand().name === 'commisioningNotification') {
        //     const payload = {
        //         options: 0x00e548,
        //         srcID: dataPayload.frame.Payload.srcID,
        //         sinkGroupID: 0x0b84,
        //         deviceID: dataPayload.frame.Payload.commandFrame.deviceID,
        //         frameCounter: 491,
        //         gpdKey: [0x1d, 0xd5, 0x12, 0x34, 0xd5, 0x34, 0x98, 0x58, 0xb7, 0x31, 0x65, 0x6e, 0xd1, 0xf8, 0xf4, 0x8c],
        //     };

        //     const frame = Zcl.ZclFrame.create(
        //         Zcl.FrameType.SPECIFIC, Zcl.Direction.SERVER_TO_CLIENT, true,
        //         null, 100, 'pairing', 33, payload
        //     );

        //     await this.adapter.sendZclFrameBroadcast(frame);
        // }
    }

    public async enableCommisioning(time: number): Promise<void> {
        {
            ///await this.adapter.znp.request(5, 'extAddGroup', {endpoint: 242, groupid: 0x0b84, namelen: 0, groupname:[]});
            // const cluster = Zcl.Utils.getCluster('genGroups');
            // const command = cluster.getCommand('add');
            // const payload = {groupid: 0x0b84, groupname: ''};
            // const frame = Zcl.ZclFrame.create(
            //     Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, false,
            //     null, 100, command.ID, cluster.ID, payload
            // );

            // await this.adapter.sendZclFrameNetworkAddressWithResponse(
            //     0x00, 242, frame, 10000, 15000,
            // );
        }


        const payload = {
            options: 0x0b,
            commisioningWindow: time,
        };

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.SPECIFIC, Zcl.Direction.SERVER_TO_CLIENT, true,
            null, 100, 'commisioningMode', 33, payload
        );

        await this.adapter.sendZclFrameBroadcast(frame);
    }
}

export default GreenPower;