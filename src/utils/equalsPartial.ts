import Equals from 'fast-deep-equal/es6';

// eslint-disable-next-line
interface ObjectAny {[s: string]: any};

function equalsPartial(object: ObjectAny, expected: ObjectAny): boolean {
    for (const [key, value] of Object.entries(expected)) {
        if (!Equals(object[key], value)) {
            return false;
        }
    }

    return true;
}

export default equalsPartial;