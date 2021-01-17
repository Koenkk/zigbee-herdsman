import crc16ccitt from './crc16ccitt';
import { EmberInitialSecurityState, EmberKeyData } from '../types/struct';
import { EmberInitialSecurityBitmask, EmberEUI64 } from '../types/named';

if (!Symbol.asyncIterator){
    (<any>Symbol).asyncIterator = Symbol.for("Symbol.asyncIterator");
}

export class Deferred<T> {

    public promise: Promise<T>;
    public _resolve: Function;
    public _reject: Function;
    _isResolved = false;
    _isRejected = false;

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this._resolve = resolve
            this._reject = reject
        })
    }

    public resolve(value:T){
        this._isResolved = true;
        this._resolve(value);
    }

     public reject(value:T){
        this._isResolved = true;
        this.reject(value);
    }

    get isResolved(){
        return this._isResolved;
    }

    get isRejected(){
        return this._isRejected;
    }

    get isFullfilled(){
        return this._isResolved || this._isRejected;
    }
}

//FROM: https://github.com/tc39/proposal-async-iteration/issues/99
export class AsyncQueue<T> {
    private queue: Array<{ type: string, value: any }> = [];
    private waiting: Array<Deferred<IteratorResult<T>>> = [];

    constructor(initializer: Function) {
        initializer({
            next: (value: T) => {
                if (this.waiting.length > 0) {
                    // If anyone is waiting we'll just send them the value
                    // immediately
                    const consumer = this.waiting.shift();
                    if (consumer) {
                        consumer.resolve({
                            done: false,
                            value
                        })
                    }
                } else {
                    return this.queue.push({
                        type: 'next',
                        value
                    })
                }
            },
            throw: (error: any) => {
                if (this.waiting.length > 0) {
                    const consumer = this.waiting.shift()
                    return consumer && consumer.reject(error)
                } else {
                    return this.queue.push({
                        value: error,
                        type: 'error'
                    })
                }
            },
            return: (value: T) => {
                if (this.waiting.length > 0) {
                    const consumer = this.waiting.shift()
                    return consumer && consumer.resolve({
                        done: true,
                        value
                    })
                } else {
                    return this.queue.push({
                        value,
                        type: 'return'
                    })
                }
            }
        })
    }

    next(): Promise<IteratorResult<T>>{
        if (this.queue.length > 1) {
            // If there are items available then simply put them
            // into the queue
            const item = this.queue.shift();
            if (!item){
                throw new Error('Working around TS strictNullCheck');
            }
            if (item.type === 'return') {
                return Promise.resolve({
                    done: true,
                    value: item.value
                })
            } else if (item.type === 'error') {
                return Promise.reject(item.value)
            } else {
                return Promise.resolve({
                    done: false,
                    value: item.value
                })
            }
        } else {
            // If there's nothing available then simply
            // give back a Promise immediately for when a value eventually
            // comes in
            const def = new Deferred<IteratorResult<T>>();
            this.waiting.push(def)
            return def.promise;
        }
    }

    [Symbol.asyncIterator] = () =>  {
        return this
    }
}


function ember_security(config: any, controller: boolean = false, hashed_tclk: boolean = true):EmberInitialSecurityState {
    const isc: EmberInitialSecurityState = new EmberInitialSecurityState();
    isc.bitmask = (EmberInitialSecurityBitmask.HAVE_PRECONFIGURED_KEY | EmberInitialSecurityBitmask.REQUIRE_ENCRYPTED_KEY);
    isc.preconfiguredKey = new EmberKeyData();
    isc.preconfiguredKey.contents = Buffer.from("ZigBeeAlliance09");
    isc.networkKey = new EmberKeyData();
    isc.networkKey.contents = config.networkKey;
    isc.networkKeySequenceNumber = 0;
    isc.preconfiguredTrustCenterEui64 = new EmberEUI64([0, 0, 0, 0, 0, 0, 0, 0]);

    if (controller) {
        isc.bitmask |= (
            EmberInitialSecurityBitmask.TRUST_CENTER_GLOBAL_LINK_KEY | EmberInitialSecurityBitmask.HAVE_NETWORK_KEY
        )
        if (hashed_tclk) {
            isc.preconfiguredKey = new EmberKeyData();
            isc.preconfiguredKey.contents = Buffer.from("ZigBeeAlliance09");
            isc.bitmask |= EmberInitialSecurityBitmask.TRUST_CENTER_USES_HASHED_LINK_KEY;
        }
    }
    return isc;
}

export {crc16ccitt, ember_security};