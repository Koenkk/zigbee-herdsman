import Equals from 'fast-deep-equal/es6';

function equalsPartial<T>(object: T, expected: Partial<T>): boolean {
    const entries = Object.entries(expected) as [keyof T, unknown][];
    return entries.every(([key, value]) => {
        const objectValue = object[key];
        if (typeof objectValue === 'string' && typeof value === 'string') {
            return objectValue.toLowerCase() === value.toLowerCase();
        }    
        return Equals(objectValue, value)
    });
}

export default equalsPartial;
