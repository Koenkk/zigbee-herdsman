import { EmberApsFrame, EmberNetworkParameters, EmberInitialSecurityState } from './struct';


export class EmberObject {
    private readonly _address: number;
    private readonly _payload: Buffer;
    private readonly _frame: EmberApsFrame;

    private constructor(
        address: number,
        frame: EmberApsFrame,
        payload: Buffer
    ) {
        this._address = address;
        this._payload = payload;
        this._frame = frame;
    }

    get address(): number {
        return this._address;
    }

    get frame(): EmberApsFrame {
        return this._frame;
    }

    get payload(): Buffer {
        return this._payload;
    }
}
