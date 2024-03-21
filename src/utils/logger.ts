export interface Logger {
    debug: (message: string, service?: string) => void;
    info: (message: string, service?: string) => void;
    warning: (message: string, service?: string) => void;
    error: (message: string | Error, service?: string) => void;
    child: (options?: object) => Omit<Logger, 'child'>;
}

export let logger: Logger = {
    debug: (message) => console.debug(message),
    info: (message) => console.info(message),
    warning: (message) => console.warn(message),
    error: (message) => console.error(message),
    child: (options) => ({
        debug: (message) => console.debug(options, message),
        info: (message) => console.info(options, message),
        warning: (message) => console.warn(options, message),
        error: (message) => console.error(options, message),
    }),
};

export function setLogger(l: Logger): void {
    logger = l;
}
