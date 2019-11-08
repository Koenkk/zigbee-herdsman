function isTcp(path: string): boolean {
    if (path.length > 0 && path.toLowerCase().startsWith('tcp')) {
        return true;
    }
    return false;
}

function isValidTcpPath(path: string): boolean {
    if (!this.isTcp(path)) {
        return false;
    }
    // tcp path must be:
    // tcp://<host>:<port>
    const regex = /^(?:tcp:\/\/)[\w.-]+[:][\d]+$/gm;
    if (regex.test(path)) {
        return true;
    }
    return false;
}

function getHost(path: string): string {
    const str = path.replace("tcp://", "");
    const retValue = str.substring(0, str.indexOf(":"));
    return retValue;
}

function getPort(path: string): number {
    const str = path.replace("tcp://", "");
    const retValue = str.substring(str.indexOf(":") + 1);
    return Number(retValue);
}

export default {isTcp, isValidTcpPath, getHost, getPort};