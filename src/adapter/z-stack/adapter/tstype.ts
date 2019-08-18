enum ZnpVersion {
    zStack12 = 0,
    zStack3x0 = 1,
    zStack30x = 2,
}

interface NvItem {
    id: number;
    offset?: number;
    len: number;
    value?: Buffer;
    configid?: number;
    initlen?: number;
    initvalue?: Buffer;
}

export {
    ZnpVersion, NvItem,
};