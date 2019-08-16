// eslint-disable-next-line
function isNumberArray(value: any): value is number[] {
    if (value instanceof Array) {
        for (const item of value) {
            if (typeof item !== 'number') {
                return false;
            }
        }

        return true;
    }

    return false;
}

export default isNumberArray;