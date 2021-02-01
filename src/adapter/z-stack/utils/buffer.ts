export const cloneBuffer = (buffer: Buffer): Buffer => {
    const cloned = Buffer.alloc(buffer.length);
    buffer.copy(cloned);
    return cloned;
};
