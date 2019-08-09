import {NetworkOptions, SerialPortOptions, Coordinator} from './tstype';
import events from 'events';

abstract class Adapter extends events.EventEmitter {
    protected networkOptions: NetworkOptions;
    protected serialPortOptions: SerialPortOptions;
    protected backupPath: string;

    public constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath: string) {
        super();
        this.networkOptions = networkOptions;
        this.serialPortOptions = serialPortOptions;
        this.backupPath = backupPath;
    }

    public abstract start(): Promise<void>;

    public abstract stop(): Promise<void>;

    public abstract getCoordinator(): Promise<Coordinator>;

    public abstract permitJoin(seconds: number): Promise<void>;
}

export default Adapter;