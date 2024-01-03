import * as Zcl from '../../zcl';
import {Endpoint} from '../model';
import Request from './request';
import Debug from "debug";

const debug = {
    info: Debug('zigbee-herdsman:helpers:requestQueue'),
    error: Debug('zigbee-herdsman:helpers:requestQeue'),
};

type Mutable<T> = { -readonly [P in keyof T ]: T[P] };


class RequestQueue extends Set<Request> {

    private sendInProgress: boolean;
    private ID: number;
    private deviceIeeeAddress: string;

    constructor (endpoint: Endpoint)
    {
        super();
        this.sendInProgress = false;
        this.ID = endpoint.ID;
        this.deviceIeeeAddress = endpoint.deviceIeeeAddress;
    }


    public async send(fastPolling: boolean): Promise<void> {
        if (this.size === 0) return;

        if (!fastPolling && this.sendInProgress) {
            debug.info(`Request Queue (${this.deviceIeeeAddress}/${this.ID}): sendPendingRequests already in progress`);
            return;
        }
        this.sendInProgress = true;

        // Remove expired requests first
        const now = Date.now();
        for (const request of this) {
            if (now > request.expires) {
                debug.info(`Request Queue (${this.deviceIeeeAddress}/${this.ID}): discard after timeout. ` +
                `Size before: ${this.size}`);
                request.reject();
                this.delete(request);
            }
        }

        debug.info(`Request Queue (${this.deviceIeeeAddress}/${this.ID}): send pending requests (` +
            `${this.size}, ${fastPolling})`);

        for (const request of this) {
            if (fastPolling || request.sendPolicy !== 'bulk') {
                try {
                    const result = await request.send();
                    debug.info(`Request Queue (${this.deviceIeeeAddress}/${this.ID}): send success`);
                    request.resolve(result);
                    this.delete(request);
                } catch (error) {
                    debug.info(`Request Queue (${this.deviceIeeeAddress}/${this.ID}): send failed, expires in ` +
                        `${(request.expires - now) / 1000} seconds`);
                }
            }
        }
        this.sendInProgress = false;
    }

    public async queue<Type>(request: Request<Type>): Promise<Type> {
        debug.info(`Request Queue (${this.deviceIeeeAddress}/${this.ID}): Sending when active. ` +
            `Expires: ${request.expires}`);
        return new Promise((resolve, reject): void =>  {
            request.addCallbacks(resolve, reject);
            this.add(request);
        });
    }

    public filter(newRequest: Request): void {

        if(this.size === 0 || !(typeof newRequest.frame.getCommand === 'function')) {
            return;
        }
        const clusterID = newRequest.frame.Cluster.ID;
        const payload = newRequest.frame.Payload;
        const commandID = newRequest.frame.getCommand().ID;

        debug.info(`Request Queue (${this.deviceIeeeAddress}/${this.ID}): ZCL ${newRequest.frame.getCommand().name} ` +
            `command, filter requests. Before: ${this.size}`);

        for (const request of this) {
            if( request?.frame?.Cluster?.ID === undefined || typeof request.frame.getCommand !== 'function') {
                continue;
            }
            if (['bulk', 'queue', 'immediate'].includes(request.sendPolicy)) {
                continue;
            }
            /* istanbul ignore else */
            if(request.frame.Cluster.ID === clusterID && request.frame.getCommand().ID === commandID) {
                /* istanbul ignore else */
                if (newRequest.sendPolicy === 'keep-payload'
                    && JSON.stringify(request.frame.Payload) === JSON.stringify(payload)) {
                    debug.info(`Request Queue (${this.deviceIeeeAddress}/${this.ID}): Merge duplicate request`);
                    this.delete(request);
                    newRequest.moveCallbacks(request);
                }
                else if ((newRequest.sendPolicy === 'keep-command' || newRequest.sendPolicy === 'keep-cmd-undiv') &&
                        Array.isArray(request.frame.Payload)) {
                    const filteredPayload = request.frame.Payload.filter((oldEl: {attrId: number}) =>
                        !payload.find((newEl: {attrId: number}) => oldEl.attrId === newEl.attrId));
                    if (filteredPayload.length == 0) {
                        debug.info(`Request Queue (${this.deviceIeeeAddress}/${this.ID}): Remove & reject request`);
                        if( JSON.stringify(request.frame.Payload) === JSON.stringify(payload)) {
                            newRequest.moveCallbacks(request);
                        } else {
                            request.reject();
                        }
                        this.delete(request);
                    } else if (newRequest.sendPolicy !== 'keep-cmd-undiv') {
                        // remove all duplicate attributes if we shall not write undivided
                        (request.frame as Mutable<Zcl.ZclFrame>).Payload = filteredPayload;
                        debug.info(`Request Queue (${this.deviceIeeeAddress}/${this.ID}): `
                            + `Remove commands from request`);
                    }
                }
            }
        }
        debug.info(`Request Queue (${this.deviceIeeeAddress}/${this.ID}): After: ${this.size}`);
    }
}

export default RequestQueue;