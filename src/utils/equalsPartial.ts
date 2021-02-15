import Equals from 'fast-deep-equal/es6';

function equalsPartial<T>(object: T, expected: Partial<T>): boolean {
    const entries = Object.entries(expected) as [keyof T, unknown][];
    return entries.every(([key, value]) => Equals(object[key], value));
}

export default equalsPartial;