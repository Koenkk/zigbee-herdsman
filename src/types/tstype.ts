interface ReadResult {
    value: number|number[]|string|Buffer|{[s: string]: number|string}[];
    length: number;
};

interface ParserOptions {
    length?: number;
    startIndex?: number;
}

interface Parser {
    write(buffer: Buffer, offset: number, value: number|number[]|string|Buffer|{[s: string]: number|string}[]): number;
    read(buffer: Buffer, offset: number, options: ParserOptions): ReadResult;
};

export {Parser, ParserOptions, ReadResult};
