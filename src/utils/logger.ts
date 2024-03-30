export interface Logger {
    debug: (message: string, namespace: string) => void;
    info: (message: string, namespace: string) => void;
    warning: (message: string, namespace: string) => void;
    error: (message: string | Error, namespace: string) => void;
}

export let logger: Logger = {
    debug: (message, namespace) => console.debug(`${namespace}: ${message}`),
    info: (message, namespace) => console.info(`${namespace}: ${message}`),
    warning: (message, namespace) => console.warn(`${namespace}: ${message}`),
    error: (message, namespace) => console.error(`${namespace}: ${message}`),
};

export function setLogger(l: Logger): void {
    logger = l;
}
