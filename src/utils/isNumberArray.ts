function isNumberArray(value: unknown): value is number[] {
    return value instanceof Array && value.every(item => typeof item === 'number');
}

export default isNumberArray;