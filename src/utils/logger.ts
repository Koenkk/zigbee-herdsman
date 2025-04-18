export interface Logger {
    debug: (messageOrLambda: string | (() => string), namespace: string) => void;
    info: (messageOrLambda: string | (() => string), namespace: string) => void;
    warning: (messageOrLambda: string | (() => string), namespace: string) => void;
    error: (messageOrLambda: string, namespace: string) => void;
}

export let logger: Logger = {
    debug: (messageOrLambda, namespace) =>
        console.debug(`[${new Date().toISOString()}] ${namespace}: ${typeof messageOrLambda === "function" ? messageOrLambda() : messageOrLambda}`),
    info: (messageOrLambda, namespace) =>
        console.info(`[${new Date().toISOString()}] ${namespace}: ${typeof messageOrLambda === "function" ? messageOrLambda() : messageOrLambda}`),
    warning: (messageOrLambda, namespace) =>
        console.warn(`[${new Date().toISOString()}] ${namespace}: ${typeof messageOrLambda === "function" ? messageOrLambda() : messageOrLambda}`),
    error: (message, namespace) => console.error(`[${new Date().toISOString()}] ${namespace}: ${message}`),
};

export function setLogger(l: Logger): void {
    logger = l;
}
