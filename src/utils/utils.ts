export function isNumberArray(value: unknown): value is number[] {
    return value instanceof Array && value.every((item) => typeof item === 'number');
}

export function isNumberArrayOfLength(value: unknown, length: number): boolean {
    return isNumberArray(value) && value.length === length;
}

export function assertString(input: unknown): asserts input is string {
    if (typeof input !== 'string') {
        throw new Error('Input must be a string!');
    }
}

export function isObjectEmpty(object: object): boolean {
    // much faster than checking `Object.keys(object).length`
    for (const k in object) return false;
    return true;
}
