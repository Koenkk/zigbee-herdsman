/* istanbul ignore file */
/* eslint-disable */
import debug from 'debug';

debug.formatters.h = (v): string => {
    return v.toString('hex');
};
const adapterDebug = debug('zigbee-herdsman:adapter:zigate');

const Debug = (suffix: string): { log: debug.Debugger, error: debug.Debugger , info: debug.Debugger} => {
    const extendDebug = adapterDebug.extend(suffix);
    return {
        log: extendDebug.extend('log'),
        info: extendDebug.extend('info'),
        error: extendDebug.extend('error'),
    };
};

export {Debug};
