enum Type {
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

    LIST_UINT16 = 11,
    LIST_ROUTING_TABLE = 12,
    LIST_BIND_TABLE = 13,
    LIST_NEIGHBOR_LQI = 14,
    LIST_NETWORK = 15,
    LIST_ASSOC_DEV = 16,
}

export default Type;