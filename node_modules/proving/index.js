var proving = {};

proving.string = function (val, msg) {
    if (typeof val !== 'string')
        throw new TypeError(msg || 'Input value should be a string.');
    return true;
};

proving.number = function (val, msg) {
    if (typeof val !== 'number' || isNaN(val))
        throw new TypeError(msg || 'Input value should be a number and cannot be a NaN.');
    return true;
};

proving.boolean = function (val, msg) {
    if (typeof val !== 'boolean')
        throw new TypeError(msg || 'Input value should be a bool.');
    return true;
};

proving.array = function (val, msg) {
    if (!Array.isArray(val))
        throw new TypeError(msg || 'Input value should be an array.');
    return true;
};

proving.fn = function (val, msg) {
    if (typeof val !== 'function')
        throw new TypeError(msg || 'Input value should be a function.');
    return true;
}

proving.object = function (val, msg) {
    if (typeof val !== 'object'|| Array.isArray(val) || val === null)
        throw new TypeError(msg || 'Input value should be an object.');
    return true;
};

proving.defined = function (val, msg) {
    if (undefined === val)
        throw new TypeError(msg || 'Input value should be given.');
    return true;
};

proving.stringOrNumber = function (val, msg) {
    msg = msg || 'Input value should be a number or a string.';
    if (typeof val === 'number') {
        if (isNaN(val))
            throw new TypeError(msg);
    } else if (typeof val !== 'string') {
        throw new TypeError(msg);
    }
    return true;
};

module.exports = proving;
