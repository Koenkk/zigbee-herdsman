function isTcpPath(path: string): boolean {
    // tcp path must be:
    // tcp://<host>:<port>
    const regex = /^(?:tcp:\/\/)[\w.-]+[:][\d]+$/gm;
    return regex.test(path);
}

function parseTcpPath(path: string): {host: string; port: number} {
    const str = path.replace('tcp://', '');
    return {
        host: str.substring(0, str.indexOf(':')),
        port: Number(str.substring(str.indexOf(':') + 1)),
    };
}

export default {isTcpPath, parseTcpPath};
