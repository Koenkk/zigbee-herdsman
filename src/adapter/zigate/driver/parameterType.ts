enum ParameterType {
    UINT8  = 0,
    UINT16  = 1,
    UINT32  = 2,
    IEEEADDR  = 3,

    BUFFER  = 4,
    BUFFER8 = 5,
    BUFFER16 = 6,
    BUFFER18 = 7,
    BUFFER32 = 8,
    BUFFER42 = 9,
    BUFFER100 = 10,

    LIST_UINT8 = 11,
    LIST_UINT16 = 12,

    INT8 = 18,
    MACCAPABILITY = 100,
    ADDRESS_WITH_TYPE_DEPENDENCY = 101,
    RAW = 102,
}

export default ParameterType;
