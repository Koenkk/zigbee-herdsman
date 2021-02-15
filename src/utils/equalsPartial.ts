import Equals from 'fast-deep-equal/es6';

interface ObjectAny {
    [s: string]: unknown
}

function equalsPartial(object: ObjectAny, expected: ObjectAny): boolean {
    return Object.entries(expected)
        .every(([key, value]) => Equals(object[key], value));
}

export default equalsPartial;