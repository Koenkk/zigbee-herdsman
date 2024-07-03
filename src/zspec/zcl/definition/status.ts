export enum Status {
    /**  Operation was successful. */
    SUCCESS = 0x00,
    /**  Operation was not successful. */
    FAILURE = 0x01,
    /** The sender of the command does not have authorization to carry out this command. */
    NOT_AUTHORIZED = 0x7e,
    reserved = 0x7f,
    /**
     * The command appears to contain the wrong fields, as detected either by the presence of one or more invalid
     * field entries or by there being missing fields.
     * Command not carried out. Implementer has discretion as to whether to return this error or INVALID_FIELD.
     */
    MALFORMED_COMMAND = 0x80,
    // UNSUP_CLUSTER_COMMAND = 0x81, DEPRECATED in favor of UNSUP_COMMAND
    /** The specified command is not supported on the device. Command not carried out. */
    UNSUP_COMMAND = 0x81,
    UNSUP_GENERAL_COMMAND = 0x82, // DEPRECATED in favor of UNSUP_COMMAND
    UNSUP_MANUF_CLUSTER_COMMAND = 0x83, // DEPRECATED in favor of UNSUP_COMMAND
    UNSUP_MANUF_GENERAL_COMMAND = 0x84, // DEPRECATED in favor of UNSUP_COMMAND
    /** At least one field of the command contains an incorrect value, according to the specification the device is implemented to. */
    INVALID_FIELD = 0x85,
    /** The specified attribute does not exist on the device. */
    UNSUPPORTED_ATTRIBUTE = 0x86,
    /**
     * Out of range error or set to a reserved value. Attribute keeps its old value.
     * Note that an attribute value may be out of range if an attribute is related to another,
     * e.g., with minimum and maximum attributes. See the individual attribute descriptions for specific details.
     */
    INVALID_VALUE = 0x87,
    /** Attempt to write a read-only attribute. */
    READ_ONLY = 0x88,
    /** An operation failed due to an insufficient amount of free space available. */
    INSUFFICIENT_SPACE = 0x89,
    DUPLICATE_EXISTS = 0x8a, // DEPRECATED in favor of SUCCESS
    /** The requested information (e.g., table entry) could not be found. */
    NOT_FOUND = 0x8b,
    /** Periodic reports cannot be issued for this attribute.*/
    UNREPORTABLE_ATTRIBUTE = 0x8c,
    /** The data type given for an attribute is incorrect. Command not carried out.*/
    INVALID_DATA_TYPE = 0x8d,
    /** The selector for an attribute is incorrect. */
    INVALID_SELECTOR = 0x8e,
    WRITE_ONLY = 0x8f, // DEPRECATED in favor of NOT_AUTHORIZED
    INCONSISTENT_STARTUP_STATE = 0x90, // DEPRECATED in favor of FAILURE
    DEFINED_OUT_OF_BAND = 0x91, // DEPRECATED in favor of FAILURE
    reserved14 = 0x92,
    ACTION_DENIED = 0x93, // DEPRECATED in favor of FAILURE
    /** The exchange was aborted due to excessive response time. */
    TIMEOUT = 0x94,
    /** Failed case when a client or a server decides to abort the upgrade process. */
    ABORT = 0x95,
    /** Invalid OTA upgrade image (ex. failed signature validation or signer information check or CRC check). */
    INVALID_IMAGE = 0x96,
    /** Server does not have data block available yet. */
    WAIT_FOR_DATA = 0x97,
    /** No OTA upgrade image available for the client. */
    NO_IMAGE_AVAILABLE = 0x98,
    /** The client still requires more OTA upgrade image files to successfully upgrade. */
    REQUIRE_MORE_IMAGE = 0x99,
    /** The command has been received and is being processed. */
    NOTIFICATION_PENDING = 0x9a,
    HARDWARE_FAILURE = 0xc0, // DEPRECATED in favor of FAILURE
    SOFTWARE_FAILURE = 0xc1, // DEPRECATED in favor of FAILURE
    reserved15 = 0xc2,
    /** The cluster is not supported. */
    UNSUPPORTED_CLUSTER = 0xc3,
    LIMIT_REACHED = 0xc4, // DEPRECATED in favor of SUCCESS
}
