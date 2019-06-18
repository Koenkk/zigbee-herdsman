import * as stream from 'stream';
import Frame from './frame';

class Writer extends stream.Readable {
    public write(frame: Frame): void {
        this.push(frame.toBuffer());
    }

    public _read(): void {}
}

export default Writer;
