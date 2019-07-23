interface Options {
    [s: string]: number;
}

interface ReadResult {
    value: number|number[]|string|Buffer|{[s: string]: number|string}[];
    length: number;
};

type Value = number|number[]|string|Buffer;

export {Options, ReadResult, Value};
