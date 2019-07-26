interface Options {
    [s: string]: number | string;
}

// eslint-disable-next-line
type Value = any;

interface ReadResult {
    value: Value;
    length: number;
};


export {Options, ReadResult, Value};
