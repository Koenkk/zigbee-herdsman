/* v8 ignore start */

import {logger} from "../../../utils/logger";
import type {Driver} from "./driver";
import {EzspConfigId} from "./types";
import {EmberStatus} from "./types/named";
import {EmberMulticastTableEntry} from "./types/struct";

const NS = "zh:ezsp:cast";

export class Multicast {
    tableSize = 16;
    private driver: Driver;
    private _multicast: Record<number, [EmberMulticastTableEntry, number]>;
    private _available: number[];

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

    async startup(enpoints: {id: number; member_of: number[]}[]): Promise<void> {
        await this._initialize();
        for (const ep of enpoints) {
            if (!ep.id) continue;
            for (const group_id of ep.member_of) {
                await this.subscribe(group_id, ep.id);
            }
        }
    }

    public async subscribe(groupId: number, endpoint: number): Promise<EmberStatus> {
        if (this._multicast[groupId] !== undefined) {
            logger.debug(`${groupId} is already subscribed`, NS);
            return EmberStatus.SUCCESS;
        }

        try {
            const idx = this._available.pop();

            if (idx === undefined) {
                throw new Error("No available");
            }

            const entry: EmberMulticastTableEntry = new EmberMulticastTableEntry();
            entry.endpoint = endpoint;
            entry.multicastId = groupId;
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
