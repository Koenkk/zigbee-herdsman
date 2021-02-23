function assertString(input: unknown): asserts input is string {
    if (typeof input !== 'string') {
        throw new Error('Input must be a string!');
    }
}

export default assertString;