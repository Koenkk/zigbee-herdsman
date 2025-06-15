/* v8 ignore start */
class Frame {
    public toBuffer(): Buffer {
        return Buffer.alloc(0);
    }
    public static fromBuffer(_buffer: Buffer): Frame {
        return new Frame();
    }
}

export default Frame;
