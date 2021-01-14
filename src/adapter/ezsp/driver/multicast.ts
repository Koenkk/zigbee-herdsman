import { Ezsp } from './ezsp';
import { EzspConfigId, EmberZdoConfigurationFlags } from './types';
import { EmberStatus, EmberOutgoingMessageType } from './types/named';
import { EmberMulticastTableEntry } from './types/struct';


export class Multicast {
    TABLE_SIZE = 16;
    private _ezsp: Ezsp;
    private logger: any;
    private _multicast: any;
    private _available: Set<any>;

    constructor(ezsp: Ezsp, logger: any){
        this._ezsp = ezsp;
        this.logger = logger;
        this._multicast = {};
        this._available = new Set();
    }

    async initialize() {
        const [status, size] = await this._ezsp.getConfigurationValue(
            EzspConfigId.CONFIG_MULTICAST_TABLE_SIZE
        );
        if (status !== EmberStatus.SUCCESS) return;
        for (let i = 0; i < size; i++) {
            let st: any, entry: any;
            [st, entry] = await this._ezsp.getMulticastTableEntry(i);
            if (st !== EmberStatus.SUCCESS) {
                this.logger("Couldn't get MulticastTableEntry #%s: %s", i, st);
                continue;
            }
            this.logger("MulticastTableEntry[%s] = %s", i, entry);
            if (entry.endpoint !== 0) {
                this._multicast[entry.multicastId] = [entry, i];
            } else {
                this._available.add(i);
            }
        }
    }
}