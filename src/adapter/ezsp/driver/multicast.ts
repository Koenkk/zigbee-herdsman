import { Driver } from './driver';
import { EzspConfigId, EmberZdoConfigurationFlags } from './types';
import * as t from './types/basic';
import { EmberStatus, EmberOutgoingMessageType, EmberMulticastId } from './types/named';
import { EmberMulticastTableEntry } from './types/struct';
import Debug from "debug";

const debug = {
    log: Debug('zigbee-herdsman:adapter:ezsp:multicast'),
};


export class Multicast {
    TABLE_SIZE = 16;
    private driver: Driver;
    private _multicast: any;
    private _available: Array<any>;

    constructor(driver: Driver){
        this.driver = driver;
        this._multicast = {};
        this._available = [];
    }

    private async _initialize() {
        const size = await this.driver.ezsp.getConfigurationValue(
            EzspConfigId.CONFIG_MULTICAST_TABLE_SIZE
        );
        for (let i = 0; i < size; i++) {
            let st: any, entry: any;
            [st, entry] = await this.driver.ezsp.getMulticastTableEntry(i);
            if (st !== EmberStatus.SUCCESS) {
                debug.log("Couldn't get MulticastTableEntry #%s: %s", i, st);
                continue;
            }
            debug.log("MulticastTableEntry[%s] = %s", i, entry);
            if (entry.endpoint !== 0) {
                this._multicast[entry.multicastId] = [entry, i];
            } else {
                this._available.push(i);
            }
        }
    }

    async startup(enpoints: Array<any>) {
        return this.driver.queue.execute<void>(async () => {
            await this._initialize();
            for (let ep of enpoints) {
                if (!ep.id) continue;
                for (let group_id of ep.member_of) {
                    await this.subscribe(group_id);
                }
            }
        });
    }

    async subscribe(group_id: number):Promise<EmberStatus> {
        if (this._multicast.indexOf(group_id) >= 0) {
            debug.log("%s is already subscribed", group_id);
            return EmberStatus.SUCCESS;
        }

        try {
            const idx = this._available.pop();
            const entry:EmberMulticastTableEntry = new EmberMulticastTableEntry();
            entry.endpoint = 1;
            entry.multicastId = group_id;
            entry.networkIndex = 0;
            const [status] = await this.driver.ezsp.setMulticastTableEntry(idx, entry);
            if (status !== EmberStatus.SUCCESS) {
                debug.log(
                    "Set MulticastTableEntry #%s for %s multicast id: %s",
                    idx,
                    entry.multicastId,
                    status,
                )
                this._available.push(idx);
                return status;
            }

            this._multicast[entry.multicastId] = [entry, idx];
            debug.log(
                "Set MulticastTableEntry #%s for %s multicast id: %s",
                idx,
                entry.multicastId,
                status,
            )
            return status;
        } catch (e) {
            debug.log("No more available slots MulticastId subscription");
            return EmberStatus.INDEX_OUT_OF_RANGE;
        }
    }
}