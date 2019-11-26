// eslint-disable-next-line
function assertString(input: any): asserts input is string {
    if (typeof input === 'string') return;
    else throw new Error('Input must be a string!');
}

export default assertString;