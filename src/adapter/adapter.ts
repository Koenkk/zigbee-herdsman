import {NetworkOptions, SerialPortOptions} from './tstype';

abstract class Adapter {
    protected networkOptions: NetworkOptions;
    protected serialPortOptions: SerialPortOptions;
    protected backupPath: string;

    public constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath: string) {
        this.networkOptions = networkOptions;
        this.serialPortOptions = serialPortOptions;
        this.backupPath = backupPath;
    }

    public abstract start(): Promise<void>;

    public abstract stop(): Promise<void>;
}

export default Adapter;