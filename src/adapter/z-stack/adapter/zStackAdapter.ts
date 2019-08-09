import {NetworkOptions, SerialPortOptions, Coordinator} from '../../tstype';
import {Events, DeviceJoinedPayload, ZclDataPayload} from '../../events';
import Adapter from '../../adapter';
import {Znp, ZpiObject} from '../znp';
import StartZnp from './startZnp';
import {Constants as UnpiConstants} from '../unpi';
import {ZclFrame} from '../../../zcl';

const Subsystem = UnpiConstants.Subsystem;

class ZStackAdapter extends Adapter {
    private znp: Znp;

    public constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath: string) {
        super(networkOptions, serialPortOptions, backupPath);
        this.znp = new Znp(this.serialPortOptions.path, this.serialPortOptions.baudRate, this.serialPortOptions.rtscts);

        this.onZnpRecieved = this.onZnpRecieved.bind(this);
        this.onZnpClose = this.onZnpClose.bind(this);

        this.znp.on('received', this.onZnpRecieved);
        this.znp.on('close', this.onZnpClose);
    }

    public async start(): Promise<void> {
        // TODO: gracefully close when on error
        await this.znp.open();
        await StartZnp(this.znp, this.networkOptions, this.backupPath);
    }

    public async stop(): Promise<void> {
        await this.znp.close();
    }

    public async getCoordinator(): Promise<Coordinator> {
        const activeEpRsp = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'activeEpRsp');
        await this.znp.request(Subsystem.ZDO, 'activeEpReq', {dstaddr: 0, nwkaddrofinterest: 0});
        const activeEp = await activeEpRsp;

        const deviceInfo = await this.znp.request(Subsystem.UTIL, 'getDeviceInfo', {});

        const endpoints = [];
        for (let endpoint of activeEp.payload.activeeplist) {
            const simpleDescRsp = this.znp.waitFor(
                UnpiConstants.Type.AREQ, Subsystem.ZDO, 'simpleDescRsp'
            );

            this.znp.request(Subsystem.ZDO, 'simpleDescReq', {dstaddr: 0, nwkaddrofinterest: 0, endpoint});
            const simpleDesc = await simpleDescRsp;

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
        }
    }

    public async permitJoin(seconds: number): Promise<void> {
        const payload = {addrmode: 0x0F, dstaddr: 0xFFFC , duration: seconds, tcsignificance: 0 }
        await this.znp.request(Subsystem.ZDO, 'mgmtPermitJoinReq', payload);
    }

    public onZnpRecieved(object: ZpiObject): void {
        if (object.type !== UnpiConstants.Type.AREQ) {
            return;
        }

        console.log(object.command);

        if (object.subsystem === Subsystem.ZDO) {
            if (object.command === 'tcDeviceInd') {
                const payload: DeviceJoinedPayload = {
                    networkAddress: object.payload.nwkaddr,
                    ieeeAddr: object.payload.extaddr,
                };

                this.emit(Events.DeviceJoined, payload);
            }
        } else if (object.subsystem === Subsystem.AF) {
            if (object.command === 'incomingMsg') {
                const payload: ZclDataPayload = {
                    frame:  ZclFrame.fromBuffer(object.payload.clusterid, object.payload.data),
                    networkAddress: object.payload.srcaddr,
                }

                this.emit(Events.ZclData, payload);
            }
        }
    }

    public onZnpClose(): void {
        // TODO
    }
}

export default ZStackAdapter;