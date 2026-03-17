export enum Status {
    /**  Operation was successful. */
    SUCCESS = 0x00,
    /**  Operation was not successful. */
    FAILURE = 0x01,
    /** The sender of the command does not have authorization to carry out this command. */
    NOT_AUTHORIZED = 0x7e,
    RESERVED = 0x7f,
    /**
     * The command appears to contain the wrong fields, as detected either by the presence of one or more invalid
     * field entries or by there being missing fields.
     * Command not carried out. Implementer has discretion as to whether to return this error or INVALID_FIELD.
     */
    MALFORMED_COMMAND = 0x80,
    // UNSUP_CLUSTER_COMMAND = 0x81, DEPRECATED in favor of UNSUP_COMMAND
    /** The specified command is not supported on the device. Command not carried out. */
    UNSUP_COMMAND = 0x81,
    /** @deprecated use UNSUP_COMMAND */
    UNSUP_GENERAL_COMMAND = 0x82,
    /** @deprecated use UNSUP_COMMAND */
    UNSUP_MANUF_CLUSTER_COMMAND = 0x83,
    /** @deprecated use UNSUP_COMMAND */
    UNSUP_MANUF_GENERAL_COMMAND = 0x84,
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
    /** @deprecated use SUCCESS */
    DUPLICATE_EXISTS = 0x8a,
    /** The requested information (e.g., table entry) could not be found. */
    NOT_FOUND = 0x8b,
    /** Periodic reports cannot be issued for this attribute.*/
    UNREPORTABLE_ATTRIBUTE = 0x8c,
    /** The data type given for an attribute is incorrect. Command not carried out.*/
    INVALID_DATA_TYPE = 0x8d,
    /** The selector for an attribute is incorrect. */
    INVALID_SELECTOR = 0x8e,
    /** @deprecated use NOT_AUTHORIZED */
    WRITE_ONLY = 0x8f,
    /** @deprecated use FAILURE */
    INCONSISTENT_STARTUP_STATE = 0x90,
    /** @deprecated use FAILURE */
    DEFINED_OUT_OF_BAND = 0x91,
    RESERVED14 = 0x92,
    /** @deprecated use FAILURE */
    ACTION_DENIED = 0x93,
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
    /** @deprecated use FAILURE */
    HARDWARE_FAILURE = 0xc0,
    /** @deprecated use FAILURE */
    SOFTWARE_FAILURE = 0xc1,
    RESERVED15 = 0xc2,
    /** The cluster is not supported. */
    UNSUPPORTED_CLUSTER = 0xc3,
    /** @deprecated use SUCCESS */
    LIMIT_REACHED = 0xc4,
}
