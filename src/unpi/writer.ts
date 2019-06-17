import * as stream from 'stream';
import Frame from './frame';

class Writer extends stream.Readable {
    public write(frame: Frame) {
        this.push(frame.toBuffer());
    }

    _read() {}
}

export default Writer;
