/* istanbul ignore file */
import crc16ccitt from './crc16ccitt';
import {EmberInitialSecurityState, EmberKeyData} from '../types/struct';
import {EmberInitialSecurityBitmask, EmberEUI64} from '../types/named';

if (!Symbol.asyncIterator) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    (<any>Symbol).asyncIterator = Symbol.for("Symbol.asyncIterator");
}

export class Deferred<T> {

    public promise: Promise<T>;
    /* eslint-disable-next-line @typescript-eslint/ban-types*/
    public _resolve: Function;
    /* eslint-disable-next-line @typescript-eslint/ban-types*/
    public _reject: Function;
    _isResolved = false;
    _isRejected = false;

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    public resolve(value: T): void {
        this._isResolved = true;
        this._resolve(value);
    }

    public reject(value: T): void {
        this._isResolved = true;
        this.reject(value);
    }

    get isResolved(): boolean {
        return this._isResolved;
    }

    get isRejected(): boolean {
        return this._isRejected;
    }

    get isFullfilled(): boolean {
        return this._isResolved || this._isRejected;
    }
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
function ember_security(config: Record<string, any>): EmberInitialSecurityState {
    const isc: EmberInitialSecurityState = new EmberInitialSecurityState();
    isc.bitmask = (EmberInitialSecurityBitmask.HAVE_PRECONFIGURED_KEY |
        EmberInitialSecurityBitmask.TRUST_CENTER_GLOBAL_LINK_KEY |
        EmberInitialSecurityBitmask.HAVE_NETWORK_KEY |
        EmberInitialSecurityBitmask.PRECONFIGURED_NETWORK_KEY_MODE);
    isc.preconfiguredKey = new EmberKeyData();
    isc.preconfiguredKey.contents = Buffer.from("ZigBeeAlliance09");
    isc.networkKey = new EmberKeyData();
    isc.networkKey.contents = config.networkKey;
    isc.networkKeySequenceNumber = 0;
    isc.preconfiguredTrustCenterEui64 = new EmberEUI64([0, 0, 0, 0, 0, 0, 0, 0]);
    return isc;
}

export {crc16ccitt, ember_security};
