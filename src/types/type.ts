enum Type {
    UINT8  = 0,
    UINT16  = 1,
    UINT32  = 2,
    BUFFER  = 13,
    IEEEADDR  = 3,
    UINT16_LIST = 11,

    // Below should be checked
    ZDOMSGCB  = 4,
    DEVLISTBUFFER  = 5,
    NWKLISTBUFFER  = 6,
    PRELENLIST  = 9,
    PRELENBEACONLIST  = 10,
    LISTBUFFER  = 12,
    BUFFER8  = 14,
    BUFFER16  = 15,
    BUFFER18  = 16,
    BUFFER32  = 17,
    BUFFER42  = 18,
    BUFFER100  = 19,
    UINT32BE = 21,
}

export default Type;