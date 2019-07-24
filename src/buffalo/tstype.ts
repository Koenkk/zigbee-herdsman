interface Options {
    [s: string]: number;
}

type Value = number|number[]|string|Buffer|{[s: string]: number|string}[];

interface ReadResult {
    value: Value;
    length: number;
};


export {Options, ReadResult, Value};
