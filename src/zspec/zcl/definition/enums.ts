/**
 * This is the specification-defined data types. It should not contain "custom" types and is expected to have [0x00-0xFF] values.
 *
 * - Values of analog types may be added to or subtracted from other values of the same type and are typically
 * used to measure the value of properties in the real world that vary continuously over a range.
 * - Values of discrete data types only have meaning as individual values and may not be added or subtracted.
 */
export enum DataType {
    /** length=0 */
    NO_DATA = 0x00,

    /** class=discrete, length=1 */
    DATA8 = 0x08,
    /** class=discrete, length=2 */
    DATA16 = 0x09,
    /** class=discrete, length=3 */
    DATA24 = 0x0a,
    /** class=discrete, length=4 */
    DATA32 = 0x0b,
    /** class=discrete, length=5 */
    DATA40 = 0x0c,
    /** class=discrete, length=6 */
    DATA48 = 0x0d,
    /** class=discrete, length=7 */
    DATA56 = 0x0e,
    /** class=discrete, length=8 */
    DATA64 = 0x0f,
    /** 0x00=false, 0x01=true, class=discrete, length=1, non-value=0xFF */
    BOOLEAN = 0x10,

    /** class=discrete, length=1 */
    BITMAP8 = 0x18,
    /** class=discrete, length=2 */
    BITMAP16 = 0x19,
    /** class=discrete, length=3 */
    BITMAP24 = 0x1a,
    /** class=discrete, length=4 */
    BITMAP32 = 0x1b,
    /** class=discrete, length=5 */
    BITMAP40 = 0x1c,
    /** class=discrete, length=6 */
    BITMAP48 = 0x1d,
    /** class=discrete, length=7 */
    BITMAP56 = 0x1e,
    /** class=discrete, length=8 */
    BITMAP64 = 0x1f,
    /** class=discrete, length=1, non-value=0xFF */
    UINT8 = 0x20,
    /** class=analog, length=2, non-value=0xFFFF */
    UINT16 = 0x21,
    /** class=analog, length=3, non-value=0xFFFFFF */
    UINT24 = 0x22,
    /** class=analog, length=4, non-value=0xFFFFFFFF */
    UINT32 = 0x23,
    /** class=analog, length=5, non-value=0xFFFFFFFFFF */
    UINT40 = 0x24,
    /** class=analog, length=6, non-value=0xFFFFFFFFFFFF */
    UINT48 = 0x25,
    /** class=analog, length=7, non-value=0xFFFFFFFFFFFFFF */
    UINT56 = 0x26,
    /** class=analog, length=8, non-value=0xFFFFFFFFFFFFFFFF */
    UINT64 = 0x27,
    /** class=analog, length=1, non-value=0x80 */
    INT8 = 0x28,
    /** class=analog, length=2, non-value=0x8000 */
    INT16 = 0x29,
    /** class=analog, length=3, non-value=0x800000 */
    INT24 = 0x2a,
    /** class=analog, length=4, non-value=0x80000000 */
    INT32 = 0x2b,
    /** class=analog, length=5, non-value=0x8000000000 */
    INT40 = 0x2c,
    /** class=analog, length=6, non-value=0x800000000000 */
    INT48 = 0x2d,
    /** class=analog, length=7, non-value=0x80000000000000 */
    INT56 = 0x2e,
    /** class=analog, length=8, non-value=0x8000000000000000 */
    INT64 = 0x2f,
    /** class=discrete, length=1, non-value=0xFF */
    ENUM8 = 0x30,
    /** class=discrete, length=2, non-value=0xFF */
    ENUM16 = 0x31,

    /** class=analog, length=2, non-value=NaN */
    SEMI_PREC = 0x38,
    /** class=analog, length=4, non-value=NaN */
    SINGLE_PREC = 0x39,
    /** class=analog, length=8, non-value=NaN */
    DOUBLE_PREC = 0x3a,

    /** class=composite, length=0x00-0xFE, non-value=0xFF */
    OCTET_STR = 0x41,
    /** class=composite, length=0x00-0xFE, non-value=0xFF */
    CHAR_STR = 0x42,
    /** class=composite, length=0x0000-0xFFFE, non-value=0xFFFF */
    LONG_OCTET_STR = 0x43,
    /** class=composite, length=0x0000-0xFFFE, non-value=0xFFFF */
    LONG_CHAR_STR = 0x44,

    /** class=composite, length=variable, non-value=[0]==0xFFFF */
    ARRAY = 0x48,

    /** class=composite, length=variable, non-value=(length) */
    STRUCT = 0x4c,

    /** class=composite, length=max(0xFFFE * DataType) non-value=(length=0xFFFF) */
    SET = 0x50,
    /** @see SET Same but allows duplicate values */
    BAG = 0x51,

    /** Time of Day, @see ZclTimeOfDay , class=analog, length=4, unused-subfield=0xFF, non-value=0xFFFFFFFF */
    TOD = 0xe0,
    /** @see ZclDate , class=analog, length=4, unused-subfield=0xFF, non-value=0xFFFFFFFF */
    DATE = 0xe1,
    /** Number of seconds since 2000-01-01 00:00:00 UTC, class=analog, length=4, non-value=0xFFFFFFFF */
    UTC = 0xe2,

    /** Defined in 2.6.1.3 of ZCL spec, class=discrete, length=2, non-value=0xFFFF */
    CLUSTER_ID = 0xe8,
    /** Defined in 2.6.1.4 of ZCL spec, class=discrete, length=2, non-value=0xFFFF */
    ATTR_ID = 0xe9,
    /** BACnet OID, allow internetworking (format defined in BACnet ref), class=discrete, length=4, non-value=0xFFFFFFFF */
    BAC_OID = 0xea,

    /** class=discrete, length=8, non-value=0xFFFFFFFFFFFFFFFF */
    IEEE_ADDR = 0xf0,
    /** Any 128-bit value, class=discrete, length=16 */
    SEC_KEY = 0xf1,

    /** length=0 */
    UNKNOWN = 0xff,
}

/** @TODO strings for backwards compat in tests. Should be moved to numbers. */
export enum DataTypeClass {
    ANALOG = 'ANALOG',
    DISCRETE = 'DISCRETE',
}

export enum BuffaloZclDataType {
    USE_DATA_TYPE = 1000,
    LIST_UINT8 = 1001,
    LIST_UINT16 = 1002,
    LIST_UINT24 = 1003,
    LIST_UINT32 = 1004,
    LIST_ZONEINFO = 1005,
    EXTENSION_FIELD_SETS = 1006,
    LIST_THERMO_TRANSITIONS = 1007,
    BUFFER = 1008,
    GDP_FRAME = 1009,
    STRUCTURED_SELECTOR = 1010,
    LIST_TUYA_DATAPOINT_VALUES = 1011,
    LIST_MIBOXER_ZONES = 1012,
    BIG_ENDIAN_UINT24 = 1013,
    MI_STRUCT = 1014,
}

/** @TODO strings for backwards compat in tests. Should be moved to numbers. */
export enum ParameterCondition {
    STATUS_EQUAL = 'statusEquals',
    STATUS_NOT_EQUAL = 'statusNotEquals',
    MINIMUM_REMAINING_BUFFER_BYTES = 'minimumRemainingBufferBytes',
    DIRECTION_EQUAL = 'directionEquals',
    BITMASK_SET = 'bitMaskSet',
    BITFIELD_ENUM = 'bitFieldEnum',
    DATA_TYPE_CLASS_EQUAL = 'dataTypeValueTypeEquals',
    FIELD_EQUAL = 'fieldEquals',
}

export enum FrameType {
    GLOBAL = 0,
    SPECIFIC = 1,
}

export enum Direction {
    CLIENT_TO_SERVER = 0,
    SERVER_TO_CLIENT = 1,
}

/**
 * The upper 4 bits of the Indicator subfield for Attributes Structured commands.
 */
export enum StructuredIndicatorType {
    /**
     * Write: Only for attributes of type other than array, structure, set or bag
     *
     * Read: Only for attributes of type other than array or structure
     */
    Whole = 0x00,
    /** Add element to the set/bag */
    WriteAdd = 0x10,
    /** Remove element from the set/bag */
    WriteRemove = 0x20,
}
