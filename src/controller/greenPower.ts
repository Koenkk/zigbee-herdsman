import {Adapter, Events as AdapterEvents} from '../adapter';
import * as Zcl from '../zcl';
import crypto from 'crypto';
import ZclTransactionSequenceNumber from './helpers/zclTransactionSequenceNumber';
import events from 'events';
import {GreenPowerEvents, GreenPowerDeviceJoinedPayload} from './tstype';

const zigBeeLinkKey = Buffer.from([
    0x5A, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6C, 0x6C, 0x69, 0x61, 0x6E, 0x63, 0x65, 0x30, 0x39
]);

class GreenPower extends events.EventEmitter {
    private adapter: Adapter;

    public constructor(adapter: Adapter) {
        super();
        this.adapter = adapter;
    }

    private encryptSecurityKey(sourceID: number, securityKey: Buffer): Buffer {
        const sourceIDInBytes = Buffer.from([
            (sourceID & 0x000000ff),
            (sourceID & 0x0000ff00) >> 8,
            (sourceID & 0x00ff0000) >> 16,
            (sourceID & 0xff000000) >> 24]
        );


        const nonce = Buffer.alloc(13);
        for (let i = 0; i < 3; i++)
        {
            for (let j = 0; j < 4; j++)
            {
                nonce[4 * i + j] = sourceIDInBytes[j];
            }
        }
        nonce[12] = 0x05;

        const cipher = crypto.createCipheriv('aes-128-ccm', zigBeeLinkKey, nonce, {authTagLength: 16});
        const encrypted = cipher.update(securityKey);
        return Buffer.concat([encrypted, cipher.final()]);
    }

    public async onZclGreenPowerData(dataPayload: AdapterEvents.ZclDataPayload): Promise<void> {
        if (dataPayload.frame.Payload.commandID === 224 && typeof dataPayload.address === 'number') {
            const key = this.encryptSecurityKey(
                dataPayload.frame.Payload.srcID, dataPayload.frame.Payload.commandFrame.securityKey
            );

            if (dataPayload.wasBroadcast) {
                const payload = {
                    options: 0x00e548,
                    srcID: dataPayload.frame.Payload.srcID,
                    sinkGroupID: this.adapter.greenPowerGroup,
                    deviceID: dataPayload.frame.Payload.commandFrame.deviceID,
                    frameCounter: dataPayload.frame.Payload.commandFrame.outgoingCounter,
                    gpdKey: [...key],
                };

                const frame = Zcl.ZclFrame.create(
                    Zcl.FrameType.SPECIFIC, Zcl.Direction.SERVER_TO_CLIENT, true,
                    null, ZclTransactionSequenceNumber.next(), 'pairing', 33, payload
                );

                await this.adapter.sendZclFrameToAll(242, frame, 242);
            }
            else {
                const coordinator = await this.adapter.getCoordinator();

                const payload = {
                    options: 0x00e568,
                    srcID: dataPayload.frame.Payload.srcID,
                    sinkIEEEAddr: coordinator.ieeeAddr,
                    sinkNwkAddr: coordinator.networkAddress,
                    deviceID: dataPayload.frame.Payload.commandFrame.deviceID,
                    frameCounter: dataPayload.frame.Payload.commandFrame.outgoingCounter,
                    gpdKey: [...key],
                };

                const frame = Zcl.ZclFrame.create(
                    Zcl.FrameType.SPECIFIC, Zcl.Direction.SERVER_TO_CLIENT, true,
                    null, ZclTransactionSequenceNumber.next(), 'pairing', 33, payload
                );

                await this.adapter.sendZclFrameToEndpoint(null, dataPayload.frame.Payload.gppNwkAddr,242,frame,10000,
                    false,false,242);
            }

            const eventData: GreenPowerDeviceJoinedPayload = {
                sourceID: dataPayload.frame.Payload.srcID,
                deviceID: dataPayload.frame.Payload.commandFrame.deviceID,
                networkAddress: dataPayload.frame.Payload.srcID & 0xFFFF,
            };

            this.emit(GreenPowerEvents.deviceJoined, eventData);
        }
    }

    public async permitJoin(time: number, networkAddress: number): Promise<void> {
        const payload = {
            options: time ? (networkAddress === null ? 0x0b : 0x2b) : 0x0a,
            commisioningWindow: time,
        };

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.SPECIFIC, Zcl.Direction.SERVER_TO_CLIENT, true,
            null, ZclTransactionSequenceNumber.next(), 'commisioningMode', 33, payload
        );

        if (networkAddress === null) {
            await this.adapter.sendZclFrameToAll(242, frame, 242);
        } else {
            await this.adapter.sendZclFrameToEndpoint(null, networkAddress,242,frame,10000,false,false,242);
        }
    }
}

export default GreenPower;