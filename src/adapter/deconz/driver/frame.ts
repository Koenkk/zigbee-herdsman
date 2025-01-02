/* v8 ignore start */
class Frame {
    public toBuffer(): Buffer {
        return Buffer.alloc(0);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static fromBuffer(buffer: Buffer): Frame {
        return new Frame();
    }
}

export default Frame;
