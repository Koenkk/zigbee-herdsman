interface ReadResult {
    value: number|number[]|string|Buffer;
    length: number;
};

interface ParserOptions {
    length?: number;
}

interface Parser {
    write(buffer: Buffer, offset: number, value: number|number[]|string): number;
    read(buffer: Buffer, offset: number, options: ParserOptions): ReadResult;
};

export {Parser, ParserOptions, ReadResult};
