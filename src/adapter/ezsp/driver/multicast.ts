/* v8 ignore start */

import {logger} from '../../../utils/logger';
import {Driver} from './driver';
import {EzspConfigId} from './types';
import {EmberStatus} from './types/named';
import {EmberMulticastTableEntry} from './types/struct';

const NS = 'zh:ezsp:cast';

export class Multicast {
    TABLE_SIZE = 16;
    private driver: Driver;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    private _multicast: any;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    private _available: Array<any>;

    constructor(driver: Driver) {
        this.driver = driver;
        this._multicast = {};
        this._available = [];
    }

    private async _initialize(): Promise<void> {
        const size = await this.driver.ezsp.getConfigurationValue(EzspConfigId.CONFIG_MULTICAST_TABLE_SIZE);
        for (let i = 0; i < size; i++) {
            const entry = await this.driver.ezsp.getMulticastTableEntry(i);
            logger.debug(`MulticastTableEntry[${i}] = ${entry}`, NS);
            if (entry.endpoint !== 0) {
                this._multicast[entry.multicastId] = [entry, i];
            } else {
                this._available.push(i);
            }
        }
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    async startup(enpoints: Array<any>): Promise<void> {
        await this._initialize();
        for (const ep of enpoints) {
            if (!ep.id) continue;
            for (const group_id of ep.member_of) {
                await this.subscribe(group_id, ep.id);
            }
        }
    }

    public async subscribe(group_id: number, endpoint: number): Promise<EmberStatus> {
        if (this._multicast[group_id] !== undefined) {
            logger.debug(`${group_id} is already subscribed`, NS);
            return EmberStatus.SUCCESS;
        }

        try {
            const idx = this._available.pop();
            const entry: EmberMulticastTableEntry = new EmberMulticastTableEntry();
            entry.endpoint = endpoint;
            entry.multicastId = group_id;
            entry.networkIndex = 0;
            const status = await this.driver.ezsp.setMulticastTableEntry(idx, entry);
            if (status !== EmberStatus.SUCCESS) {
                logger.error(`Set MulticastTableEntry #${idx} for ${entry.multicastId} multicast id: ${status}`, NS);
                this._available.push(idx);
                return status;
            }

            this._multicast[entry.multicastId] = [entry, idx];
            logger.debug(`Set MulticastTableEntry #${idx} for ${entry.multicastId} multicast id: ${status}`, NS);
            return status;
        } catch (error) {
            logger.error(`No more available slots MulticastId subscription (${(error as Error).stack})`, NS);
            return EmberStatus.INDEX_OUT_OF_RANGE;
        }
    }
}
