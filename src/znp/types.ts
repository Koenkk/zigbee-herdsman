type MtType = string|number|Buffer|number[];

interface MtParameter {
    name: string;
    parameterType: number;
};

interface MtCmd {
    name: string;
    ID: number;
    type: number;
    request?: MtParameter[];
    response?: MtParameter[];
};

interface ZpiObjectPayload {
    [s: string]: MtType;
};

export {ZpiObjectPayload, MtParameter, MtCmd, MtType};
