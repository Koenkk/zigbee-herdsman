/* v8 ignore start */
class Frame {
    public toBuffer(): Buffer<ArrayBuffer> {
        return Buffer.alloc(0);
    }
    public static fromBuffer(_buffer: Buffer<ArrayBuffer>): Frame {
        return new Frame();
    }
}

export default Frame;
