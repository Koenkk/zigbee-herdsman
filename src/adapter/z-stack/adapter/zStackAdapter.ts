import {NetworkOptions, SerialPortOptions} from '../../tstype';
import Adapter from '../../adapter';
import {Znp} from '../znp';
import StartZnp from './startZnp';

class ZStackAdapter extends Adapter {
    private znp: Znp;

    public constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath: string) {
        super(networkOptions, serialPortOptions, backupPath);
        this.znp = new Znp(this.serialPortOptions.path, this.serialPortOptions.baudRate, this.serialPortOptions.rtscts);
    }

    public async start(): Promise<void> {
        // TODO: gracefully close when on error
        await this.znp.open();
        await StartZnp(this.znp, this.networkOptions, this.backupPath);
    }

    public async stop(): Promise<void> {
        await this.znp.close();
    }
}

export default ZStackAdapter;