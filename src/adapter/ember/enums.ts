/** Status Codes contains error and status code definitions used by Simplicity SDK software components and stacks. */
export enum SLStatus {
    // -----------------------------------------------------------------------------
    // Generic Errors

    /** No error. */
    OK = 0x0000,
    /** Generic error. */
    FAIL = 0x0001,

    // -----------------------------------------------------------------------------
    // State Errors

    /** Generic invalid state error. */
    INVALID_STATE = 0x0002,
    /** Module is not ready for requested operation. */
    NOT_READY = 0x0003,
    /** Module is busy and cannot carry out requested operation. */
    BUSY = 0x0004,
    /** Operation is in progress and not yet complete (pass or fail). */
    IN_PROGRESS = 0x0005,
    /** Operation aborted. */
    ABORT = 0x0006,
    /** Operation timed out. */
    TIMEOUT = 0x0007,
    /** Operation not allowed per permissions. */
    PERMISSION = 0x0008,
    /** Non-blocking operation would block. */
    WOULD_BLOCK = 0x0009,
    /** Operation/module is Idle, cannot carry requested operation. */
    IDLE = 0x000a,
    /** Operation cannot be done while construct is waiting. */
    IS_WAITING = 0x000b,
    /** No task/construct waiting/pending for that action/event. */
    NONE_WAITING = 0x000c,
    /** Operation cannot be done while construct is suspended. */
    SUSPENDED = 0x000d,
    /** Feature not available due to software configuration. */
    NOT_AVAILABLE = 0x000e,
    /** Feature not supported. */
    NOT_SUPPORTED = 0x000f,
    /** Initialization failed. */
    INITIALIZATION = 0x0010,
    /** Module has not been initialized. */
    NOT_INITIALIZED = 0x0011,
    /** Module has already been initialized. */
    ALREADY_INITIALIZED = 0x0012,
    /** Object/construct has been deleted. */
    DELETED = 0x0013,
    /** Illegal call from ISR. */
    ISR = 0x0014,
    /** Illegal call because network is up. */
    NETWORK_UP = 0x0015,
    /** Illegal call because network is down. */
    NETWORK_DOWN = 0x0016,
    /** Failure due to not being joined in a network. */
    NOT_JOINED = 0x0017,
    /** Invalid operation as there are no beacons. */
    NO_BEACONS = 0x0018,

    // -----------------------------------------------------------------------------
    // Allocation/ownership Errors

    /** Generic allocation error. */
    ALLOCATION_FAILED = 0x0019,
    /** No more resource available to perform the operation. */
    NO_MORE_RESOURCE = 0x001a,
    /** Item/list/queue is empty. */
    EMPTY = 0x001b,
    /** Item/list/queue is full. */
    FULL = 0x001c,
    /** Item would overflow. */
    WOULD_OVERFLOW = 0x001d,
    /** Item/list/queue has been overflowed. */
    HAS_OVERFLOWED = 0x001e,
    /** Generic ownership error. */
    OWNERSHIP = 0x001f,
    /** Already/still owning resource. */
    IS_OWNER = 0x0020,

    // -----------------------------------------------------------------------------
    // Invalid Parameters Errors

    /** Generic invalid argument or consequence of invalid argument. */
    INVALID_PARAMETER = 0x0021,
    /** Invalid null pointer received as argument. */
    NULL_POINTER = 0x0022,
    /** Invalid configuration provided. */
    INVALID_CONFIGURATION = 0x0023,
    /** Invalid mode. */
    INVALID_MODE = 0x0024,
    /** Invalid handle. */
    INVALID_HANDLE = 0x0025,
    /** Invalid type for operation. */
    INVALID_TYPE = 0x0026,
    /** Invalid index. */
    INVALID_INDEX = 0x0027,
    /** Invalid range. */
    INVALID_RANGE = 0x0028,
    /** Invalid key. */
    INVALID_KEY = 0x0029,
    /** Invalid credentials. */
    INVALID_CREDENTIALS = 0x002a,
    /** Invalid count. */
    INVALID_COUNT = 0x002b,
    /** Invalid signature / verification failed. */
    INVALID_SIGNATURE = 0x002c,
    /** Item could not be found. */
    NOT_FOUND = 0x002d,
    /** Item already exists. */
    ALREADY_EXISTS = 0x002e,

    // -----------------------------------------------------------------------------
    // IO/Communication Errors

    /** Generic I/O failure. */
    IO = 0x002f,
    /** I/O failure due to timeout. */
    IO_TIMEOUT = 0x0030,
    /** Generic transmission error. */
    TRANSMIT = 0x0031,
    /** Transmit underflowed. */
    TRANSMIT_UNDERFLOW = 0x0032,
    /** Transmit is incomplete. */
    TRANSMIT_INCOMPLETE = 0x0033,
    /** Transmit is busy. */
    TRANSMIT_BUSY = 0x0034,
    /** Generic reception error. */
    RECEIVE = 0x0035,
    /** Failed to read on/via given object. */
    OBJECT_READ = 0x0036,
    /** Failed to write on/via given object. */
    OBJECT_WRITE = 0x0037,
    /** Message is too long. */
    MESSAGE_TOO_LONG = 0x0038,

    // -----------------------------------------------------------------------------
    // EEPROM/Flash Errors

    /** EEPROM MFG version mismatch. */
    EEPROM_MFG_VERSION_MISMATCH = 0x0039,
    /** EEPROM Stack version mismatch. */
    EEPROM_STACK_VERSION_MISMATCH = 0x003a,
    /** Flash write is inhibited. */
    FLASH_WRITE_INHIBITED = 0x003b,
    /** Flash verification failed. */
    FLASH_VERIFY_FAILED = 0x003c,
    /** Flash programming failed. */
    FLASH_PROGRAM_FAILED = 0x003d,
    /** Flash erase failed. */
    FLASH_ERASE_FAILED = 0x003e,

    // -----------------------------------------------------------------------------
    // MAC Errors

    /** MAC no data. */
    MAC_NO_DATA = 0x003f,
    /** MAC no ACK received. */
    MAC_NO_ACK_RECEIVED = 0x0040,
    /** MAC indirect timeout. */
    MAC_INDIRECT_TIMEOUT = 0x0041,
    /** MAC unknown header type. */
    MAC_UNKNOWN_HEADER_TYPE = 0x0042,
    /** MAC ACK unknown header type. */
    MAC_ACK_HEADER_TYPE = 0x0043,
    /** MAC command transmit failure. */
    MAC_COMMAND_TRANSMIT_FAILURE = 0x0044,

    // -----------------------------------------------------------------------------
    // CLI_STORAGE Errors

    /** Error in open NVM */
    CLI_STORAGE_NVM_OPEN_ERROR = 0x0045,

    // -----------------------------------------------------------------------------
    // Security status codes

    /** Image checksum is not valid. */
    SECURITY_IMAGE_CHECKSUM_ERROR = 0x0046,
    /** Decryption failed */
    SECURITY_DECRYPT_ERROR = 0x0047,

    // -----------------------------------------------------------------------------
    // Command status codes

    /** Command was not recognized */
    COMMAND_IS_INVALID = 0x0048,
    /** Command or parameter maximum length exceeded */
    COMMAND_TOO_LONG = 0x0049,
    /** Data received does not form a complete command */
    COMMAND_INCOMPLETE = 0x004a,

    // -----------------------------------------------------------------------------
    // Misc Errors

    /** Bus error, e.g. invalid DMA address */
    BUS_ERROR = 0x004b,

    // -----------------------------------------------------------------------------
    // Unified MAC Errors

    /** CCA failure. */
    CCA_FAILURE = 0x004c,

    // -----------------------------------------------------------------------------
    // Scan errors

    /** MAC scanning. */
    MAC_SCANNING = 0x004d,
    /** MAC incorrect scan type. */
    MAC_INCORRECT_SCAN_TYPE = 0x004e,
    /** Invalid channel mask. */
    INVALID_CHANNEL_MASK = 0x004f,
    /** Bad scan duration. */
    BAD_SCAN_DURATION = 0x0050,

    // -----------------------------------------------------------------------------
    // MAC transmit related status

    /** The MAC transmit queue is full */
    MAC_TRANSMIT_QUEUE_FULL = 0x0053,
    /**
     * The transmit attempt failed because the radio scheduler could not find a slot to transmit this packet in or
     * a higher priority event interrupted it
     */
    TRANSMIT_SCHEDULER_FAIL = 0x0054,
    /** An unsupported channel setting was specified */
    TRANSMIT_INVALID_CHANNEL = 0x0055,
    /** An unsupported power setting was specified */
    TRANSMIT_INVALID_POWER = 0x0056,
    /** The expected ACK was received after the last transmission */
    TRANSMIT_ACK_RECEIVED = 0x0057,
    /**
     * The transmit attempt was blocked from going over the air.
     * Typically this is due to the Radio Hold Off (RHO) or Coexistence plugins as they can prevent transmits based on external signals.
     */
    TRANSMIT_BLOCKED = 0x0058,

    // -----------------------------------------------------------------------------
    // NVM3 specific errors

    /** The initialization was aborted as the NVM3 instance is not aligned properly in memory */
    NVM3_ALIGNMENT_INVALID = 0x0059,
    /** The initialization was aborted as the size of the NVM3 instance is too small */
    NVM3_SIZE_TOO_SMALL = 0x005a,
    /** The initialization was aborted as the NVM3 page size is not supported */
    NVM3_PAGE_SIZE_NOT_SUPPORTED = 0x005b,
    /** The application that there was an error initializing some of the tokens */
    NVM3_TOKEN_INIT_FAILED = 0x005c,
    /** The initialization was aborted as the NVM3 instance was already opened with other parameters */
    NVM3_OPENED_WITH_OTHER_PARAMETERS = 0x005d,

    // -----------------------------------------------------------------------------
    // Bluetooth status codes

    /** Bonding procedure can't be started because device has no space left for bond. */
    BT_OUT_OF_BONDS = 0x0402,
    /** Unspecified error */
    BT_UNSPECIFIED = 0x0403,
    /** Hardware failure */
    BT_HARDWARE = 0x0404,
    /** The bonding does not exist. */
    BT_NO_BONDING = 0x0406,
    /** Error using crypto functions */
    BT_CRYPTO = 0x0407,
    /** Data was corrupted. */
    BT_DATA_CORRUPTED = 0x0408,
    /** Invalid periodic advertising sync handle */
    BT_INVALID_SYNC_HANDLE = 0x040a,
    /** Bluetooth cannot be used on this hardware */
    BT_INVALID_MODULE_ACTION = 0x040b,
    /** Error received from radio */
    BT_RADIO = 0x040c,
    /** Returned when remote disconnects the connection-oriented channel by sending disconnection request. */
    BT_L2CAP_REMOTE_DISCONNECTED = 0x040d,
    /** Returned when local host disconnect the connection-oriented channel by sending disconnection request. */
    BT_L2CAP_LOCAL_DISCONNECTED = 0x040e,
    /** Returned when local host did not find a connection-oriented channel with given destination CID. */
    BT_L2CAP_CID_NOT_EXIST = 0x040f,
    /** Returned when connection-oriented channel disconnected due to LE connection is dropped. */
    BT_L2CAP_LE_DISCONNECTED = 0x0410,
    /** Returned when connection-oriented channel disconnected due to remote end send data even without credit. */
    BT_L2CAP_FLOW_CONTROL_VIOLATED = 0x0412,
    /** Returned when connection-oriented channel disconnected due to remote end send flow control credits exceed 65535. */
    BT_L2CAP_FLOW_CONTROL_CREDIT_OVERFLOWED = 0x0413,
    /** Returned when connection-oriented channel has run out of flow control credit and local application still trying to send data. */
    BT_L2CAP_NO_FLOW_CONTROL_CREDIT = 0x0414,
    /** Returned when connection-oriented channel has not received connection response message within maximum timeout. */
    BT_L2CAP_CONNECTION_REQUEST_TIMEOUT = 0x0415,
    /** Returned when local host received a connection-oriented channel connection response with an invalid destination CID. */
    BT_L2CAP_INVALID_CID = 0x0416,
    /** Returned when local host application tries to send a command which is not suitable for L2CAP channel's current state. */
    BT_L2CAP_WRONG_STATE = 0x0417,
    /** Flash reserved for PS store is full */
    BT_PS_STORE_FULL = 0x041b,
    /** PS key not found */
    BT_PS_KEY_NOT_FOUND = 0x041c,
    /** Mismatched or insufficient security level */
    BT_APPLICATION_MISMATCHED_OR_INSUFFICIENT_SECURITY = 0x041d,
    /** Encryption/decryption operation failed. */
    BT_APPLICATION_ENCRYPTION_DECRYPTION_ERROR = 0x041e,

    // -----------------------------------------------------------------------------
    // Bluetooth controller status codes

    /** Connection does not exist, or connection open request was cancelled. */
    BT_CTRL_UNKNOWN_CONNECTION_IDENTIFIER = 0x1002,
    /**
     * Pairing or authentication failed due to incorrect results in the pairing or authentication procedure.
     * This could be due to an incorrect PIN or Link Key
     */
    BT_CTRL_AUTHENTICATION_FAILURE = 0x1005,
    /** Pairing failed because of missing PIN, or authentication failed because of missing Key */
    BT_CTRL_PIN_OR_KEY_MISSING = 0x1006,
    /** Controller is out of memory. */
    BT_CTRL_MEMORY_CAPACITY_EXCEEDED = 0x1007,
    /** Link supervision timeout has expired. */
    BT_CTRL_CONNECTION_TIMEOUT = 0x1008,
    /** Controller is at limit of connections it can support. */
    BT_CTRL_CONNECTION_LIMIT_EXCEEDED = 0x1009,
    /**
     * The Synchronous Connection Limit to a Device Exceeded error code indicates that the Controller has reached
     * the limit to the number of synchronous connections that can be achieved to a device.
     */
    BT_CTRL_SYNCHRONOUS_CONNECTION_LIMIT_EXCEEDED = 0x100a,
    /**
     * The ACL Connection Already Exists error code indicates that an attempt to create a new ACL Connection
     * to a device when there is already a connection to this device.
     */
    BT_CTRL_ACL_CONNECTION_ALREADY_EXISTS = 0x100b,
    /** Command requested cannot be executed because the Controller is in a state where it cannot process this command at this time. */
    BT_CTRL_COMMAND_DISALLOWED = 0x100c,
    /** The Connection Rejected Due To Limited Resources error code indicates that an incoming connection was rejected due to limited resources. */
    BT_CTRL_CONNECTION_REJECTED_DUE_TO_LIMITED_RESOURCES = 0x100d,
    /**
     * The Connection Rejected Due To Security Reasons error code indicates that a connection was rejected due
     * to security requirements not being fulfilled, like authentication or pairing.
     */
    BT_CTRL_CONNECTION_REJECTED_DUE_TO_SECURITY_REASONS = 0x100e,
    /**
     * The Connection was rejected because this device does not accept the BD_ADDR.
     * This may be because the device will only accept connections from specific BD_ADDRs.
     */
    BT_CTRL_CONNECTION_REJECTED_DUE_TO_UNACCEPTABLE_BD_ADDR = 0x100f,
    /** The Connection Accept Timeout has been exceeded for this connection attempt. */
    BT_CTRL_CONNECTION_ACCEPT_TIMEOUT_EXCEEDED = 0x1010,
    /** A feature or parameter value in the HCI command is not supported. */
    BT_CTRL_UNSUPPORTED_FEATURE_OR_PARAMETER_VALUE = 0x1011,
    /** Command contained invalid parameters. */
    BT_CTRL_INVALID_COMMAND_PARAMETERS = 0x1012,
    /** User on the remote device terminated the connection. */
    BT_CTRL_REMOTE_USER_TERMINATED = 0x1013,
    /** The remote device terminated the connection because of low resources */
    BT_CTRL_REMOTE_DEVICE_TERMINATED_CONNECTION_DUE_TO_LOW_RESOURCES = 0x1014,
    /** Remote Device Terminated Connection due to Power Off */
    BT_CTRL_REMOTE_POWERING_OFF = 0x1015,
    /** Local device terminated the connection. */
    BT_CTRL_CONNECTION_TERMINATED_BY_LOCAL_HOST = 0x1016,
    /**
     * The Controller is disallowing an authentication or pairing procedure because too little time has elapsed
     * since the last authentication or pairing attempt failed.
     */
    BT_CTRL_REPEATED_ATTEMPTS = 0x1017,
    /**
     * The device does not allow pairing. This can be for example, when a device only allows pairing during
     * a certain time window after some user input allows pairing
     */
    BT_CTRL_PAIRING_NOT_ALLOWED = 0x1018,
    /** The remote device does not support the feature associated with the issued command. */
    BT_CTRL_UNSUPPORTED_REMOTE_FEATURE = 0x101a,
    /** No other error code specified is appropriate to use. */
    BT_CTRL_UNSPECIFIED_ERROR = 0x101f,
    /** Connection terminated due to link-layer procedure timeout. */
    BT_CTRL_LL_RESPONSE_TIMEOUT = 0x1022,
    /** LL procedure has collided with the same transaction or procedure that is already in progress. */
    BT_CTRL_LL_PROCEDURE_COLLISION = 0x1023,
    /** The requested encryption mode is not acceptable at this time. */
    BT_CTRL_ENCRYPTION_MODE_NOT_ACCEPTABLE = 0x1025,
    /** Link key cannot be changed because a fixed unit key is being used. */
    BT_CTRL_LINK_KEY_CANNOT_BE_CHANGED = 0x1026,
    /** LMP PDU or LL PDU that includes an instant cannot be performed because the instant when this would have occurred has passed. */
    BT_CTRL_INSTANT_PASSED = 0x1028,
    /** It was not possible to pair as a unit key was requested and it is not supported. */
    BT_CTRL_PAIRING_WITH_UNIT_KEY_NOT_SUPPORTED = 0x1029,
    /** LMP transaction was started that collides with an ongoing transaction. */
    BT_CTRL_DIFFERENT_TRANSACTION_COLLISION = 0x102a,
    /** The Controller cannot perform channel assessment because it is not supported. */
    BT_CTRL_CHANNEL_ASSESSMENT_NOT_SUPPORTED = 0x102e,
    /** The HCI command or LMP PDU sent is only possible on an encrypted link. */
    BT_CTRL_INSUFFICIENT_SECURITY = 0x102f,
    /** A parameter value requested is outside the mandatory range of parameters for the given HCI command or LMP PDU. */
    BT_CTRL_PARAMETER_OUT_OF_MANDATORY_RANGE = 0x1030,
    /**
     * The IO capabilities request or response was rejected because the sending Host does not support
     * Secure Simple Pairing even though the receiving Link Manager does.
     */
    BT_CTRL_SIMPLE_PAIRING_NOT_SUPPORTED_BY_HOST = 0x1037,
    /**
     * The Host is busy with another pairing operation and unable to support the requested pairing.
     * The receiving device should retry pairing again later.
     */
    BT_CTRL_HOST_BUSY_PAIRING = 0x1038,
    /** The Controller could not calculate an appropriate value for the Channel selection operation. */
    BT_CTRL_CONNECTION_REJECTED_DUE_TO_NO_SUITABLE_CHANNEL_FOUND = 0x1039,
    /** Operation was rejected because the controller is busy and unable to process the request. */
    BT_CTRL_CONTROLLER_BUSY = 0x103a,
    /** Remote device terminated the connection because of an unacceptable connection interval. */
    BT_CTRL_UNACCEPTABLE_CONNECTION_INTERVAL = 0x103b,
    /** Advertising for a fixed duration completed or, for directed advertising, that advertising completed without a connection being created. */
    BT_CTRL_ADVERTISING_TIMEOUT = 0x103c,
    /** Connection was terminated because the Message Integrity Check (MIC) failed on a received packet. */
    BT_CTRL_CONNECTION_TERMINATED_DUE_TO_MIC_FAILURE = 0x103d,
    /** LL initiated a connection but the connection has failed to be established. Controller did not receive any packets from remote end. */
    BT_CTRL_CONNECTION_FAILED_TO_BE_ESTABLISHED = 0x103e,
    /** The MAC of the 802.11 AMP was requested to connect to a peer, but the connection failed. */
    BT_CTRL_MAC_CONNECTION_FAILED = 0x103f,
    /**
     * The master, at this time, is unable to make a coarse adjustment to the piconet clock, using the supplied parameters.
     * Instead the master will attempt to move the clock using clock dragging.
     */
    BT_CTRL_COARSE_CLOCK_ADJUSTMENT_REJECTED_BUT_WILL_TRY_TO_ADJUST_USING_CLOCK_DRAGGING = 0x1040,
    /** A command was sent from the Host that should identify an Advertising or Sync handle, but the Advertising or Sync handle does not exist. */
    BT_CTRL_UNKNOWN_ADVERTISING_IDENTIFIER = 0x1042,
    /** Number of operations requested has been reached and has indicated the completion of the activity (e.g., advertising or scanning). */
    BT_CTRL_LIMIT_REACHED = 0x1043,
    /** A request to the Controller issued by the Host and still pending was successfully canceled. */
    BT_CTRL_OPERATION_CANCELLED_BY_HOST = 0x1044,
    /** An attempt was made to send or receive a packet that exceeds the maximum allowed packet l */
    BT_CTRL_PACKET_TOO_LONG = 0x1045,

    // -----------------------------------------------------------------------------
    // Bluetooth attribute status codes

    /** The attribute handle given was not valid on this server */
    BT_ATT_INVALID_HANDLE = 0x1101,
    /** The attribute cannot be read */
    BT_ATT_READ_NOT_PERMITTED = 0x1102,
    /** The attribute cannot be written */
    BT_ATT_WRITE_NOT_PERMITTED = 0x1103,
    /** The attribute PDU was invalid */
    BT_ATT_INVALID_PDU = 0x1104,
    /** The attribute requires authentication before it can be read or written. */
    BT_ATT_INSUFFICIENT_AUTHENTICATION = 0x1105,
    /** Attribute Server does not support the request received from the client. */
    BT_ATT_REQUEST_NOT_SUPPORTED = 0x1106,
    /** Offset specified was past the end of the attribute */
    BT_ATT_INVALID_OFFSET = 0x1107,
    /** The attribute requires authorization before it can be read or written. */
    BT_ATT_INSUFFICIENT_AUTHORIZATION = 0x1108,
    /** Too many prepare writes have been queued */
    BT_ATT_PREPARE_QUEUE_FULL = 0x1109,
    /** No attribute found within the given attribute handle range. */
    BT_ATT_ATT_NOT_FOUND = 0x110a,
    /** The attribute cannot be read or written using the Read Blob Request */
    BT_ATT_ATT_NOT_LONG = 0x110b,
    /** The Encryption Key Size used for encrypting this link is insufficient. */
    BT_ATT_INSUFFICIENT_ENC_KEY_SIZE = 0x110c,
    /** The attribute value length is invalid for the operation */
    BT_ATT_INVALID_ATT_LENGTH = 0x110d,
    /** The attribute request that was requested has encountered an error that was unlikely, and therefore could not be completed as requested. */
    BT_ATT_UNLIKELY_ERROR = 0x110e,
    /** The attribute requires encryption before it can be read or written. */
    BT_ATT_INSUFFICIENT_ENCRYPTION = 0x110f,
    /** The attribute type is not a supported grouping attribute as defined by a higher layer specification. */
    BT_ATT_UNSUPPORTED_GROUP_TYPE = 0x1110,
    /** Insufficient Resources to complete the request */
    BT_ATT_INSUFFICIENT_RESOURCES = 0x1111,
    /** The server requests the client to rediscover the database. */
    BT_ATT_OUT_OF_SYNC = 0x1112,
    /** The attribute parameter value was not allowed. */
    BT_ATT_VALUE_NOT_ALLOWED = 0x1113,
    /** When this is returned in a BGAPI response, the application tried to read or write the value of a user attribute from the GATT database. */
    BT_ATT_APPLICATION = 0x1180,
    /** The requested write operation cannot be fulfilled for reasons other than permissions. */
    BT_ATT_WRITE_REQUEST_REJECTED = 0x11fc,
    /** The Client Characteristic Configuration descriptor is not configured according to the requirements of the profile or service. */
    BT_ATT_CLIENT_CHARACTERISTIC_CONFIGURATION_DESCRIPTOR_IMPROPERLY_CONFIGURED = 0x11fd,
    /** The profile or service request cannot be serviced because an operation that has been previously triggered is still in progress. */
    BT_ATT_PROCEDURE_ALREADY_IN_PROGRESS = 0x11fe,
    /** The attribute value is out of range as defined by a profile or service specification. */
    BT_ATT_OUT_OF_RANGE = 0x11ff,

    // -----------------------------------------------------------------------------
    // Bluetooth Security Manager Protocol status codes

    /** The user input of passkey failed, for example, the user cancelled the operation */
    BT_SMP_PASSKEY_ENTRY_FAILED = 0x1201,
    /** Out of Band data is not available for authentication */
    BT_SMP_OOB_NOT_AVAILABLE = 0x1202,
    /** The pairing procedure cannot be performed as authentication requirements cannot be met due to IO capabilities of one or both devices */
    BT_SMP_AUTHENTICATION_REQUIREMENTS = 0x1203,
    /** The confirm value does not match the calculated compare value */
    BT_SMP_CONFIRM_VALUE_FAILED = 0x1204,
    /** Pairing is not supported by the device */
    BT_SMP_PAIRING_NOT_SUPPORTED = 0x1205,
    /** The resultant encryption key size is insufficient for the security requirements of this device */
    BT_SMP_ENCRYPTION_KEY_SIZE = 0x1206,
    /** The SMP command received is not supported on this device */
    BT_SMP_COMMAND_NOT_SUPPORTED = 0x1207,
    /** Pairing failed due to an unspecified reason */
    BT_SMP_UNSPECIFIED_REASON = 0x1208,
    /** Pairing or authentication procedure is disallowed because too little time has elapsed since last pairing request or security request */
    BT_SMP_REPEATED_ATTEMPTS = 0x1209,
    /** The Invalid Parameters error code indicates: the command length is invalid or a parameter is outside of the specified range. */
    BT_SMP_INVALID_PARAMETERS = 0x120a,
    /** Indicates to the remote device that the DHKey Check value received doesn't match the one calculated by the local device. */
    BT_SMP_DHKEY_CHECK_FAILED = 0x120b,
    /** Indicates that the confirm values in the numeric comparison protocol do not match. */
    BT_SMP_NUMERIC_COMPARISON_FAILED = 0x120c,
    /** Indicates that the pairing over the LE transport failed due to a Pairing Request sent over the BR/EDR transport in process. */
    BT_SMP_BREDR_PAIRING_IN_PROGRESS = 0x120d,
    /** Indicates that the BR/EDR Link Key generated on the BR/EDR transport cannot be used to derive and distribute keys for the LE transport. */
    BT_SMP_CROSS_TRANSPORT_KEY_DERIVATION_GENERATION_NOT_ALLOWED = 0x120e,
    /** Indicates that the device chose not to accept a distributed key. */
    BT_SMP_KEY_REJECTED = 0x120f,

    // -----------------------------------------------------------------------------
    // Bluetooth Mesh status codes

    /** Returned when trying to add a key or some other unique resource with an ID which already exists */
    BT_MESH_ALREADY_EXISTS = 0x0501,
    /** Returned when trying to manipulate a key or some other resource with an ID which does not exist */
    BT_MESH_DOES_NOT_EXIST = 0x0502,
    /**
     * Returned when an operation cannot be executed because a pre-configured limit for keys, key bindings,
     * elements, models, virtual addresses, provisioned devices, or provisioning sessions is reached
     */
    BT_MESH_LIMIT_REACHED = 0x0503,
    /** Returned when trying to use a reserved address or add a "pre-provisioned" device using an address already used by some other device */
    BT_MESH_INVALID_ADDRESS = 0x0504,
    /** In a BGAPI response, the user supplied malformed data; in a BGAPI event, the remote end responded with malformed or unrecognized data */
    BT_MESH_MALFORMED_DATA = 0x0505,
    /** An attempt was made to initialize a subsystem that was already initialized. */
    BT_MESH_ALREADY_INITIALIZED = 0x0506,
    /** An attempt was made to use a subsystem that wasn't initialized yet. Call the subsystem's init function first. */
    BT_MESH_NOT_INITIALIZED = 0x0507,
    /** Returned when trying to establish a friendship as a Low Power Node, but no acceptable friend offer message was received. */
    BT_MESH_NO_FRIEND_OFFER = 0x0508,
    /** Provisioning link was unexpectedly closed before provisioning was complete. */
    BT_MESH_PROV_LINK_CLOSED = 0x0509,
    /**An unrecognized provisioning PDU was received. */
    BT_MESH_PROV_INVALID_PDU = 0x050a,
    /**A provisioning PDU with wrong length or containing field values that are out of bounds was received. */
    BT_MESH_PROV_INVALID_PDU_FORMAT = 0x050b,
    /**An unexpected (out of sequence) provisioning PDU was received. */
    BT_MESH_PROV_UNEXPECTED_PDU = 0x050c,
    /**The computed confirmation value did not match the expected value. */
    BT_MESH_PROV_CONFIRMATION_FAILED = 0x050d,
    /**Provisioning could not be continued due to insufficient resources. */
    BT_MESH_PROV_OUT_OF_RESOURCES = 0x050e,
    /**The provisioning data block could not be decrypted. */
    BT_MESH_PROV_DECRYPTION_FAILED = 0x050f,
    /**An unexpected error happened during provisioning. */
    BT_MESH_PROV_UNEXPECTED_ERROR = 0x0510,
    /**Device could not assign unicast addresses to all of its elements. */
    BT_MESH_PROV_CANNOT_ASSIGN_ADDR = 0x0511,
    /**Returned when trying to reuse an address of a previously deleted device before an IV Index Update has been executed. */
    BT_MESH_ADDRESS_TEMPORARILY_UNAVAILABLE = 0x0512,
    /**Returned when trying to assign an address that is used by one of the devices in the Device Database, or by the Provisioner itself. */
    BT_MESH_ADDRESS_ALREADY_USED = 0x0513,
    /**Application key or publish address are not set */
    BT_MESH_PUBLISH_NOT_CONFIGURED = 0x0514,
    /**Application key is not bound to a model */
    BT_MESH_APP_KEY_NOT_BOUND = 0x0515,

    // -----------------------------------------------------------------------------
    // Bluetooth Mesh foundation status codes

    /** Returned when address in request was not valid */
    BT_MESH_FOUNDATION_INVALID_ADDRESS = 0x1301,
    /** Returned when model identified is not found for a given element */
    BT_MESH_FOUNDATION_INVALID_MODEL = 0x1302,
    /** Returned when the key identified by AppKeyIndex is not stored in the node */
    BT_MESH_FOUNDATION_INVALID_APP_KEY = 0x1303,
    /** Returned when the key identified by NetKeyIndex is not stored in the node */
    BT_MESH_FOUNDATION_INVALID_NET_KEY = 0x1304,
    /** Returned when The node cannot serve the request due to insufficient resources */
    BT_MESH_FOUNDATION_INSUFFICIENT_RESOURCES = 0x1305,
    /** Returned when the key identified is already stored in the node and the new NetKey value is different */
    BT_MESH_FOUNDATION_KEY_INDEX_EXISTS = 0x1306,
    /** Returned when the model does not support the publish mechanism */
    BT_MESH_FOUNDATION_INVALID_PUBLISH_PARAMS = 0x1307,
    /** Returned when  the model does not support the subscribe mechanism */
    BT_MESH_FOUNDATION_NOT_SUBSCRIBE_MODEL = 0x1308,
    /** Returned when storing of the requested parameters failed */
    BT_MESH_FOUNDATION_STORAGE_FAILURE = 0x1309,
    /**Returned when requested setting is not supported */
    BT_MESH_FOUNDATION_NOT_SUPPORTED = 0x130a,
    /**Returned when the requested update operation cannot be performed due to general constraints */
    BT_MESH_FOUNDATION_CANNOT_UPDATE = 0x130b,
    /**Returned when the requested delete operation cannot be performed due to general constraints */
    BT_MESH_FOUNDATION_CANNOT_REMOVE = 0x130c,
    /**Returned when the requested bind operation cannot be performed due to general constraints */
    BT_MESH_FOUNDATION_CANNOT_BIND = 0x130d,
    /**Returned when The node cannot start advertising with Node Identity or Proxy since the maximum number of parallel advertising is reached */
    BT_MESH_FOUNDATION_TEMPORARILY_UNABLE = 0x130e,
    /**Returned when the requested state cannot be set */
    BT_MESH_FOUNDATION_CANNOT_SET = 0x130f,
    /**Returned when an unspecified error took place */
    BT_MESH_FOUNDATION_UNSPECIFIED = 0x1310,
    /**Returned when the NetKeyIndex and AppKeyIndex combination is not valid for a Config AppKey Update */
    BT_MESH_FOUNDATION_INVALID_BINDING = 0x1311,

    // -----------------------------------------------------------------------------
    // Wi-Fi Errors

    /** Invalid firmware keyset */
    WIFI_INVALID_KEY = 0x0b01,
    /** The firmware download took too long */
    WIFI_FIRMWARE_DOWNLOAD_TIMEOUT = 0x0b02,
    /** Unknown request ID or wrong interface ID used */
    WIFI_UNSUPPORTED_MESSAGE_ID = 0x0b03,
    /** The request is successful but some parameters have been ignored */
    WIFI_WARNING = 0x0b04,
    /** No Packets waiting to be received */
    WIFI_NO_PACKET_TO_RECEIVE = 0x0b05,
    /** The sleep mode is granted */
    WIFI_SLEEP_GRANTED = 0x0b08,
    /** The WFx does not go back to sleep */
    WIFI_SLEEP_NOT_GRANTED = 0x0b09,
    /** The SecureLink MAC key was not found */
    WIFI_SECURE_LINK_MAC_KEY_ERROR = 0x0b10,
    /** The SecureLink MAC key is already installed in OTP */
    WIFI_SECURE_LINK_MAC_KEY_ALREADY_BURNED = 0x0b11,
    /** The SecureLink MAC key cannot be installed in RAM */
    WIFI_SECURE_LINK_RAM_MODE_NOT_ALLOWED = 0x0b12,
    /** The SecureLink MAC key installation failed */
    WIFI_SECURE_LINK_FAILED_UNKNOWN_MODE = 0x0b13,
    /** SecureLink key (re)negotiation failed */
    WIFI_SECURE_LINK_EXCHANGE_FAILED = 0x0b14,
    /** The device is in an inappropriate state to perform the request */
    WIFI_WRONG_STATE = 0x0b18,
    /** The request failed due to regulatory limitations */
    WIFI_CHANNEL_NOT_ALLOWED = 0x0b19,
    /** The connection request failed because no suitable AP was found */
    WIFI_NO_MATCHING_AP = 0x0b1a,
    /** The connection request was aborted by host */
    WIFI_CONNECTION_ABORTED = 0x0b1b,
    /** The connection request failed because of a timeout */
    WIFI_CONNECTION_TIMEOUT = 0x0b1c,
    /** The connection request failed because the AP rejected the device */
    WIFI_CONNECTION_REJECTED_BY_AP = 0x0b1d,
    /** The connection request failed because the WPA handshake did not complete successfully */
    WIFI_CONNECTION_AUTH_FAILURE = 0x0b1e,
    /** The request failed because the retry limit was exceeded */
    WIFI_RETRY_EXCEEDED = 0x0b1f,
    /** The request failed because the MSDU life time was exceeded */
    WIFI_TX_LIFETIME_EXCEEDED = 0x0b20,

    // -----------------------------------------------------------------------------
    // MVP Driver and MVP Math status codes

    /** Critical fault */
    COMPUTE_DRIVER_FAULT = 0x1501,
    /** ALU operation output NaN */
    COMPUTE_DRIVER_ALU_NAN = 0x1502,
    /** ALU numeric overflow */
    COMPUTE_DRIVER_ALU_OVERFLOW = 0x1503,
    /** ALU numeric underflow */
    COMPUTE_DRIVER_ALU_UNDERFLOW = 0x1504,
    /** Overflow during array store */
    COMPUTE_DRIVER_STORE_CONVERSION_OVERFLOW = 0x1505,
    /** Underflow during array store conversion */
    COMPUTE_DRIVER_STORE_CONVERSION_UNDERFLOW = 0x1506,
    /** Infinity encountered during array store conversion */
    COMPUTE_DRIVER_STORE_CONVERSION_INFINITY = 0x1507,
    /** NaN encountered during array store conversion */
    COMPUTE_DRIVER_STORE_CONVERSION_NAN = 0x1508,

    /** MATH NaN encountered */
    COMPUTE_MATH_NAN = 0x1512,
    /** MATH Infinity encountered */
    COMPUTE_MATH_INFINITY = 0x1513,
    /** MATH numeric overflow */
    COMPUTE_MATH_OVERFLOW = 0x1514,
    /** MATH numeric underflow */
    COMPUTE_MATH_UNDERFLOW = 0x1515,

    // -----------------------------------------------------------------------------
    // Zigbee status codes

    /** Packet is dropped by packet-handoff callbacks */
    ZIGBEE_PACKET_HANDOFF_DROPPED = 0x0c01,
    /** The APS layer attempted to send or deliver a message and failed */
    ZIGBEE_DELIVERY_FAILED = 0x0c02,
    /** The maximum number of in-flight messages ::EMBER_APS_UNICAST_MESSAGE_COUNT has been reached */
    ZIGBEE_MAX_MESSAGE_LIMIT_REACHED = 0x0c03,
    /** The application is trying to delete or overwrite a binding that is in use */
    ZIGBEE_BINDING_IS_ACTIVE = 0x0c04,
    /** The application is trying to overwrite an address table entry that is in use */
    ZIGBEE_ADDRESS_TABLE_ENTRY_IS_ACTIVE = 0x0c05,
    /** After moving, a mobile node's attempt to re-establish contact with the network failed */
    ZIGBEE_MOVE_FAILED = 0x0c06,
    /** The local node ID has changed. The application can get the new node ID by calling ::sl_zigbee_get_node_id() */
    ZIGBEE_NODE_ID_CHANGED = 0x0c07,
    /** The chosen security level is not supported by the stack */
    ZIGBEE_INVALID_SECURITY_LEVEL = 0x0c08,
    /** An error occurred when trying to encrypt at the APS Level */
    ZIGBEE_IEEE_ADDRESS_DISCOVERY_IN_PROGRESS = 0x0c09,
    /** An error occurred when trying to encrypt at the APS Level */
    ZIGBEE_APS_ENCRYPTION_ERROR = 0x0c0a,
    /** There was an attempt to form or join a network with security without calling ::sl_zigbee_set_initial_security_state() first */
    ZIGBEE_SECURITY_STATE_NOT_SET = 0x0c0b,
    /**
     * There was an attempt to broadcast a key switch too quickly after broadcasting the next network key.
     * The Trust Center must wait at least a period equal to the broadcast timeout so that all routers have a chance
     * to receive the broadcast of the new network key
     */
    ZIGBEE_TOO_SOON_FOR_SWITCH_KEY = 0x0c0c,
    /** The received signature corresponding to the message that was passed to the CBKE Library failed verification and is not valid */
    ZIGBEE_SIGNATURE_VERIFY_FAILURE = 0x0c0d,
    /** The message could not be sent because the link key corresponding to the destination is not authorized for use in APS data messages */
    ZIGBEE_KEY_NOT_AUTHORIZED = 0x0c0e,
    /** The application tried to use a binding that has been remotely modified and the change has not yet been reported to the application */
    ZIGBEE_BINDING_HAS_CHANGED = 0x0c0f,
    /** The EUI of the Trust center has changed due to a successful rejoin after TC Swapout */
    ZIGBEE_TRUST_CENTER_SWAP_EUI_HAS_CHANGED = 0x0c10,
    /** A Trust Center Swapout Rejoin has occurred without the EUI of the TC changing */
    ZIGBEE_TRUST_CENTER_SWAP_EUI_HAS_NOT_CHANGED = 0x0c11,
    /** An attempt to generate random bytes failed because of insufficient random data from the radio */
    ZIGBEE_INSUFFICIENT_RANDOM_DATA = 0x0c12,
    /** A Zigbee route error command frame was received indicating that a source routed message from this node failed en route */
    ZIGBEE_SOURCE_ROUTE_FAILURE = 0x0c13,
    /** A Zigbee route error command frame was received indicating that a message sent to this node along a many-to-one route failed en route */
    ZIGBEE_MANY_TO_ONE_ROUTE_FAILURE = 0x0c14,
    /** A critical and fatal error indicating that the version of the stack trying to run does not match with the chip it's running on */
    ZIGBEE_STACK_AND_HARDWARE_MISMATCH = 0x0c15,
    /** The local PAN ID has changed. The application can get the new PAN ID by calling ::emberGetPanId() */
    ZIGBEE_PAN_ID_CHANGED = 0x0c16,
    /** The channel has changed. */
    ZIGBEE_CHANNEL_CHANGED = 0x0c17,
    /** The network has been opened for joining. */
    ZIGBEE_NETWORK_OPENED = 0x0c18,
    /** The network has been closed for joining. */
    ZIGBEE_NETWORK_CLOSED = 0x0c19,
    /**
     * An attempt was made to join a Secured Network using a pre-configured key, but the Trust Center sent back a
     * Network Key in-the-clear when an encrypted Network Key was required. (::EMBER_REQUIRE_ENCRYPTED_KEY)
     */
    ZIGBEE_RECEIVED_KEY_IN_THE_CLEAR = 0x0c1a,
    /** An attempt was made to join a Secured Network, but the device did not receive a Network Key. */
    ZIGBEE_NO_NETWORK_KEY_RECEIVED = 0x0c1b,
    /** After a device joined a Secured Network, a Link Key was requested (::EMBER_GET_LINK_KEY_WHEN_JOINING) but no response was ever received. */
    ZIGBEE_NO_LINK_KEY_RECEIVED = 0x0c1c,
    /**
     * An attempt was made to join a Secured Network without a pre-configured key, but the Trust Center sent encrypted data using a
     * pre-configured key.
     */
    ZIGBEE_PRECONFIGURED_KEY_REQUIRED = 0x0c1d,
    /** A Zigbee EZSP error has occured. Track the origin and corresponding EzspStatus for more info. */
    ZIGBEE_EZSP_ERROR = 0x0c1e,
}

/** Status values used by EZSP. */
export enum EzspStatus {
    /** Success. */
    SUCCESS = 0x00,
    /** Fatal error. */
    SPI_ERR_FATAL = 0x10,
    /** The Response frame of the current transaction indicates the NCP has reset. */
    SPI_ERR_NCP_RESET = 0x11,
    /** The NCP is reporting that the Command frame of the current transaction is oversized (the length byte is too large). */
    SPI_ERR_OVERSIZED_EZSP_FRAME = 0x12,
    /** The Response frame of the current transaction indicates the previous transaction was aborted (nSSEL deasserted too soon). */
    SPI_ERR_ABORTED_TRANSACTION = 0x13,
    /** The Response frame of the current transaction indicates the frame terminator is missing from the Command frame. */
    SPI_ERR_MISSING_FRAME_TERMINATOR = 0x14,
    /** The NCP has not provided a Response within the time limit defined by WAIT_SECTION_TIMEOUT. */
    SPI_ERR_WAIT_SECTION_TIMEOUT = 0x15,
    /** The Response frame from the NCP is missing the frame terminator. */
    SPI_ERR_NO_FRAME_TERMINATOR = 0x16,
    /** The Host attempted to send an oversized Command (the length byte is too large) and the AVR's spi-protocol.c blocked the transmission. */
    SPI_ERR_EZSP_COMMAND_OVERSIZED = 0x17,
    /** The NCP attempted to send an oversized Response (the length byte is too large) and the AVR's spi-protocol.c blocked the reception. */
    SPI_ERR_EZSP_RESPONSE_OVERSIZED = 0x18,
    /** The Host has sent the Command and is still waiting for the NCP to send a Response. */
    SPI_WAITING_FOR_RESPONSE = 0x19,
    /** The NCP has not asserted nHOST_INT within the time limit defined by WAKE_HANDSHAKE_TIMEOUT. */
    SPI_ERR_HANDSHAKE_TIMEOUT = 0x1a,
    /** The NCP has not asserted nHOST_INT after an NCP reset within the time limit defined by STARTUP_TIMEOUT. */
    SPI_ERR_STARTUP_TIMEOUT = 0x1b,
    /** The Host attempted to verify the SPI Protocol activity and version number, and the verification failed. */
    SPI_ERR_STARTUP_FAIL = 0x1c,
    /** The Host has sent a command with a SPI Byte that is unsupported by the current mode the NCP is operating in. */
    SPI_ERR_UNSUPPORTED_SPI_COMMAND = 0x1d,
    /** Operation not yet complete. */
    ASH_IN_PROGRESS = 0x20,
    /** Fatal error detected by host. */
    HOST_FATAL_ERROR = 0x21,
    /** Fatal error detected by NCP. */
    ASH_NCP_FATAL_ERROR = 0x22,
    /** Tried to send DATA frame too long. */
    DATA_FRAME_TOO_LONG = 0x23,
    /** Tried to send DATA frame too short. */
    DATA_FRAME_TOO_SHORT = 0x24,
    /** No space for tx'ed DATA frame. */
    NO_TX_SPACE = 0x25,
    /** No space for rec'd DATA frame. */
    NO_RX_SPACE = 0x26,
    /** No receive data available. */
    NO_RX_DATA = 0x27,
    /** Not in Connected state. */
    NOT_CONNECTED = 0x28,
    /** The NCP received a command before the EZSP version had been set. */
    ERROR_VERSION_NOT_SET = 0x30,
    /** The NCP received a command containing an unsupported frame ID. */
    ERROR_INVALID_FRAME_ID = 0x31,
    /** The direction flag in the frame control field was incorrect. */
    ERROR_WRONG_DIRECTION = 0x32,
    /**
     * The truncated flag in the frame control field was set, indicating there was not enough memory available to
     * complete the response or that the response would have exceeded the maximum EZSP frame length.
     */
    ERROR_TRUNCATED = 0x33,
    /**
     * The overflow flag in the frame control field was set, indicating one or more callbacks occurred since the previous
     * response and there was not enough memory available to report them to the Host.
     */
    ERROR_OVERFLOW = 0x34,
    /** Insufficient memory was available. */
    ERROR_OUT_OF_MEMORY = 0x35,
    /** The value was out of bounds. */
    ERROR_INVALID_VALUE = 0x36,
    /** The configuration id was not recognized. */
    ERROR_INVALID_ID = 0x37,
    /** Configuration values can no longer be modified. */
    ERROR_INVALID_CALL = 0x38,
    /** The NCP failed to respond to a command. */
    ERROR_NO_RESPONSE = 0x39,
    /** The length of the command exceeded the maximum EZSP frame length. */
    ERROR_COMMAND_TOO_LONG = 0x40,
    /** The UART receive queue was full causing a callback response to be dropped. */
    ERROR_QUEUE_FULL = 0x41,
    /** The command has been filtered out by NCP. */
    ERROR_COMMAND_FILTERED = 0x42,
    /** EZSP Security Key is already set */
    ERROR_SECURITY_KEY_ALREADY_SET = 0x43,
    /** EZSP Security Type is invalid */
    ERROR_SECURITY_TYPE_INVALID = 0x44,
    /** EZSP Security Parameters are invalid */
    ERROR_SECURITY_PARAMETERS_INVALID = 0x45,
    /** EZSP Security Parameters are already set */
    ERROR_SECURITY_PARAMETERS_ALREADY_SET = 0x46,
    /** EZSP Security Key is not set */
    ERROR_SECURITY_KEY_NOT_SET = 0x47,
    /** EZSP Security Parameters are not set */
    ERROR_SECURITY_PARAMETERS_NOT_SET = 0x48,
    /** Received frame with unsupported control byte */
    ERROR_UNSUPPORTED_CONTROL = 0x49,
    /** Received frame is unsecure, when security is established */
    ERROR_UNSECURE_FRAME = 0x4a,
    /** Incompatible ASH version */
    ASH_ERROR_VERSION = 0x50,
    /** Exceeded max ACK timeouts */
    ASH_ERROR_TIMEOUTS = 0x51,
    /** Timed out waiting for RSTACK */
    ASH_ERROR_RESET_FAIL = 0x52,
    /** Unexpected ncp reset */
    ASH_ERROR_NCP_RESET = 0x53,
    /** Serial port initialization failed */
    ERROR_SERIAL_INIT = 0x54,
    /** Invalid ncp processor type */
    ASH_ERROR_NCP_TYPE = 0x55,
    /** Invalid ncp reset method */
    ASH_ERROR_RESET_METHOD = 0x56,
    /** XON/XOFF not supported by host driver */
    ASH_ERROR_XON_XOFF = 0x57,
    /** ASH protocol started */
    ASH_STARTED = 0x70,
    /** ASH protocol connected */
    ASH_CONNECTED = 0x71,
    /** ASH protocol disconnected */
    ASH_DISCONNECTED = 0x72,
    /** Timer expired waiting for ack */
    ASH_ACK_TIMEOUT = 0x73,
    /** Frame in progress cancelled */
    ASH_CANCELLED = 0x74,
    /** Received frame out of sequence */
    ASH_OUT_OF_SEQUENCE = 0x75,
    /** Received frame with CRC error */
    ASH_BAD_CRC = 0x76,
    /** Received frame with comm error */
    ASH_COMM_ERROR = 0x77,
    /** Received frame with bad ackNum */
    ASH_BAD_ACKNUM = 0x78,
    /** Received frame shorter than minimum */
    ASH_TOO_SHORT = 0x79,
    /** Received frame longer than maximum */
    ASH_TOO_LONG = 0x7a,
    /** Received frame with illegal control byte */
    ASH_BAD_CONTROL = 0x7b,
    /** Received frame with illegal length for its type */
    ASH_BAD_LENGTH = 0x7c,
    /** Received ASH Ack */
    ASH_ACK_RECEIVED = 0x7d,
    /** Sent ASH Ack */
    ASH_ACK_SENT = 0x7e,
    /** Received ASH Nak */
    ASH_NAK_RECEIVED = 0x7f,
    /** Sent ASH Nak */
    ASH_NAK_SENT = 0x80,
    /** Received ASH RST */
    ASH_RST_RECEIVED = 0x81,
    /** Sent ASH RST */
    ASH_RST_SENT = 0x82,
    /** ASH Status */
    ASH_STATUS = 0x83,
    /** ASH TX */
    ASH_TX = 0x84,
    /** ASH RX */
    ASH_RX = 0x85,
    /** Failed to connect to CPC daemon or failed to open CPC endpoint */
    CPC_ERROR_INIT = 0x86,
    /** No reset or error */
    NO_ERROR = 0xff,
}

export enum EmberStackError {
    // Error codes that a router uses to notify the message initiator about a broken route.
    ROUTE_ERROR_NO_ROUTE_AVAILABLE = 0x00,
    ROUTE_ERROR_TREE_LINK_FAILURE = 0x01,
    ROUTE_ERROR_NON_TREE_LINK_FAILURE = 0x02,
    ROUTE_ERROR_LOW_BATTERY_LEVEL = 0x03,
    ROUTE_ERROR_NO_ROUTING_CAPACITY = 0x04,
    ROUTE_ERROR_NO_INDIRECT_CAPACITY = 0x05,
    ROUTE_ERROR_INDIRECT_TRANSACTION_EXPIRY = 0x06,
    ROUTE_ERROR_TARGET_DEVICE_UNAVAILABLE = 0x07,
    ROUTE_ERROR_TARGET_ADDRESS_UNALLOCATED = 0x08,
    ROUTE_ERROR_PARENT_LINK_FAILURE = 0x09,
    ROUTE_ERROR_VALIDATE_ROUTE = 0x0a,
    ROUTE_ERROR_SOURCE_ROUTE_FAILURE = 0x0b,
    ROUTE_ERROR_MANY_TO_ONE_ROUTE_FAILURE = 0x0c,
    ROUTE_ERROR_ADDRESS_CONFLICT = 0x0d,
    ROUTE_ERROR_VERIFY_ADDRESSES = 0x0e,
    ROUTE_ERROR_PAN_IDENTIFIER_UPDATE = 0x0f,

    NETWORK_STATUS_NETWORK_ADDRESS_UPDATE = 0x10,
    NETWORK_STATUS_BAD_FRAME_COUNTER = 0x11,
    NETWORK_STATUS_BAD_KEY_SEQUENCE_NUMBER = 0x12,
    NETWORK_STATUS_UNKNOWN_COMMAND = 0x13,
}

export enum EmberGPStatus {
    /** Success Status */
    OK,
    /** Match Frame */
    MATCH,
    /** Drop Frame */
    DROP_FRAME,
    /** Frame Unprocessed */
    UNPROCESSED,
    /** Frame Pass Unprocessed */
    PASS_UNPROCESSED,
    /** Frame TX Then Drop */
    TX_THEN_DROP,
    /** No Security */
    NO_SECURITY,
    /** Security Failure */
    AUTH_FAILURE,
}

/** Type of Ember software version */
export enum EmberVersionType {
    PRE_RELEASE = 0x00,

    // Alpha, should be used rarely
    ALPHA_1 = 0x11,
    ALPHA_2 = 0x12,
    ALPHA_3 = 0x13,
    // Leave space in case we decide to add other types in the future.
    BETA_1 = 0x21,
    BETA_2 = 0x22,
    BETA_3 = 0x23,

    // Anything other than 0xAA is considered pre-release
    // Silicon Labs may define other types in the future (e.g. beta, alpha)
    // Silicon Labs chose an arbitrary number (0xAA) to allow for expansion, but
    // to prevent ambiguity in case 0x00 or 0xFF is accidentally retrieved
    // as the version type.
    GA = 0xaa,
}

/**
 * For emberSetTxPowerMode and mfglibSetPower.
 * uint16_t
 */
export enum EmberTXPowerMode {
    /**
     * The application should call ::emberSetTxPowerMode() with the
     * txPowerMode parameter set to this value to disable all power mode options,
     * resulting in normal power mode and bi-directional RF transmitter output.
     */
    DEFAULT = 0x0000,
    /**
     * The application should call ::emberSetTxPowerMode() with the
     * txPowerMode parameter set to this value to enable boost power mode.
     */
    BOOST = 0x0001,
    /**
     * The application should call ::emberSetTxPowerMode() with the
     * txPowerMode parameter set to this value to enable the alternate transmitter
     * output.
     */
    ALTERNATE = 0x0002,
    /**
     * The application should call ::emberSetTxPowerMode() with the
     * txPowerMode parameter set to this value to enable both boost mode and the
     * alternate transmitter output.
     */
    BOOST_AND_ALTERNATE = 0x0003, // (BOOST | ALTERNATE)
    // The application does not ever need to call emberSetTxPowerMode() with the
    // txPowerMode parameter set to this value.  This value is used internally by
    // the stack to indicate that the default token configuration has not been
    // overridden by a prior call to emberSetTxPowerMode().
    USE_TOKEN = 0x8000,
}

/** uint8_t */
export enum EmberKeepAliveMode {
    KEEP_ALIVE_SUPPORT_UNKNOWN = 0x00,
    MAC_DATA_POLL_KEEP_ALIVE = 0x01,
    END_DEVICE_TIMEOUT_KEEP_ALIVE = 0x02,
    KEEP_ALIVE_SUPPORT_ALL = 0x03,
}

/** This is the Extended Security Bitmask that controls the use of various extended security features. */
export enum EmberExtendedSecurityBitmask {
    /**
     * If this bit is set, the 'key token data' field is set in the Initial Security Bitmask to 0 (No Preconfig Key token).
     * Otherwise, the field is left as is.
     */
    PRECONFIG_KEY_NOT_VALID = 0x0001,
    // bits 2-3 are unused.
    /**
     * This denotes that the network key update can only happen if the network key update request is unicast and encrypted
     * i.e. broadcast network key update requests will not be processed if bit 1 is set
     */
    SECURE_NETWORK_KEY_ROTATION = 0x0002,
    /** This denotes whether a joiner node (router or end-device) uses a Global Link Key or a Unique Link Key. */
    JOINER_GLOBAL_LINK_KEY = 0x0010,
    /**
     * This denotes whether the device's outgoing frame counter is allowed to be reset during forming or joining.
     * If the flag is set, the outgoing frame counter is not allowed to be reset.
     * If the flag is not set, the frame counter is allowed to be reset.
     */
    EXT_NO_FRAME_COUNTER_RESET = 0x0020,
    /** This denotes whether a device should discard or accept network leave without rejoin commands. */
    NWK_LEAVE_WITHOUT_REJOIN_NOT_ALLOWED = 0x0040,
    // Bit 7 reserved for future use (stored in TOKEN).
    /** This denotes whether a router node should discard or accept network Leave Commands. */
    NWK_LEAVE_REQUEST_NOT_ALLOWED = 0x0100,
    /**
     * This denotes whether a node is running the latest stack specification or is emulating R18 specs behavior.
     * If this flag is enabled, a router node should only send encrypted Update Device messages while the TC
     * should only accept encrypted Updated Device messages.
     */
    R18_STACK_BEHAVIOR = 0x0200,
    // Bit 10 is reserved for future use (stored in TOKEN).
    // Bit 11 is reserved for future use(stored in RAM).
    // Bit 12 - This denotes whether an end device should discard or accept ZDO Leave
    // from a network node other than its parent.
    ZDO_LEAVE_FROM_NON_PARENT_NOT_ALLOWED = 0x1000,
    // Bits 13-15 are unused.
}

/** This is the Initial Security Bitmask that controls the use of various security features. */
export enum EmberInitialSecurityBitmask {
    /** Enables Distributed Trust Center Mode for the device forming the network. (Previously known as ::EMBER_NO_TRUST_CENTER_MODE) */
    DISTRIBUTED_TRUST_CENTER_MODE = 0x0002,
    /** Enables a Global Link Key for the Trust Center. All nodes will share the same Trust Center Link Key. */
    TRUST_CENTER_GLOBAL_LINK_KEY = 0x0004,
    /** Enables devices that perform MAC Association with a pre-configured Network Key to join the network. It is only set on the Trust Center. */
    PRECONFIGURED_NETWORK_KEY_MODE = 0x0008,
    // Hidden field used internally.
    HAVE_TRUST_CENTER_UNKNOWN_KEY_TOKEN = 0x0010,
    // Hidden field used internally.
    HAVE_TRUST_CENTER_LINK_KEY_TOKEN = 0x0020,
    /**
     * This denotes that the ::EmberInitialSecurityState::preconfiguredTrustCenterEui64 has a value in it containing the trust center EUI64.
     * The device will only join a network and accept commands from a trust center with that EUI64.
     * Normally this bit is NOT set and the EUI64 of the trust center is learned during the join process.
     * When commissioning a device to join onto an existing network that is using a trust center and without sending any messages,
     * this bit must be set and the field ::EmberInitialSecurityState::preconfiguredTrustCenterEui64 must be populated with the appropriate EUI64.
     */
    HAVE_TRUST_CENTER_EUI64 = 0x0040,
    /**
     * This denotes that the ::EmberInitialSecurityState::preconfiguredKey is not the actual Link Key but a Root Key known only to the Trust Center.
     * It is hashed with the IEEE Address of the destination device to create the actual Link Key used in encryption.
     * This is bit is only used by the Trust Center. The joining device need not set this.
     */
    TRUST_CENTER_USES_HASHED_LINK_KEY = 0x0084,
    /**
     * This denotes that the ::EmberInitialSecurityState::preconfiguredKey element has valid data that should be used to configure
     * the initial security state.
     */
    HAVE_PRECONFIGURED_KEY = 0x0100,
    /**
     * This denotes that the ::EmberInitialSecurityState::networkKey element has valid data that should be used to configure
     * the initial security state.
     */
    HAVE_NETWORK_KEY = 0x0200,
    /**
     * This denotes to a joining node that it should attempt to acquire a Trust Center Link Key during joining.
     * This is necessary if the device does not have a pre-configured key, or wants to obtain a new one
     * (since it may be using a well-known key during joining).
     */
    GET_LINK_KEY_WHEN_JOINING = 0x0400,
    /**
     * This denotes that a joining device should only accept an encrypted network key from the Trust Center (using its pre-configured key).
     * A key sent in-the-clear by the Trust Center will be rejected and the join will fail.
     * This option is only valid when using a pre-configured key.
     */
    REQUIRE_ENCRYPTED_KEY = 0x0800,
    /**
     * This denotes whether the device should NOT reset its outgoing frame counters (both NWK and APS) when
     * ::emberSetInitialSecurityState() is called.
     * Normally it is advised to reset the frame counter before joining a new network.
     * However, when a device is joining to the same network again (but not using ::emberRejoinNetwork()),
     * it should keep the NWK and APS frame counters stored in its tokens.
     *
     * NOTE: The application is allowed to dynamically change the behavior via EMBER_EXT_NO_FRAME_COUNTER_RESET field.
     */
    NO_FRAME_COUNTER_RESET = 0x1000,
    /**
     * This denotes that the device should obtain its pre-configured key from an installation code stored in the manufacturing token.
     * The token contains a value that will be hashed to obtain the actual pre-configured key.
     * If that token is not valid, the call to ::emberSetInitialSecurityState() will fail.
     */
    GET_PRECONFIGURED_KEY_FROM_INSTALL_CODE = 0x2000,
    // Internal data
    EM_SAVED_IN_TOKEN = 0x4000,
    /* All other bits are reserved and must be zero. */
}

/** Either marks an event as inactive or specifies the units for the event execution time. uint8_t */
export enum EmberEventUnits {
    /** The event is not scheduled to run. */
    INACTIVE = 0,
    /** The execution time is in approximate milliseconds.  */
    MS_TIME = 1,
    /** The execution time is in 'binary' quarter seconds (256 approximate milliseconds each). */
    QS_TIME = 2,
    /** The execution time is in 'binary' minutes (65536 approximate milliseconds each). */
    MINUTE_TIME = 3,
    /** The event is scheduled to run at the earliest opportunity. */
    ZERO_DELAY = 4,
}

/**
 * Defines the events reported to the application by the ::emberCounterHandler().
 * Usage of the destinationNodeId or data fields found in the EmberCounterInfo or EmberExtraCounterInfo
 * structs is denoted for counter types that use them.
 * (See comments accompanying enum definitions in this source file for details.)
 */
export enum EmberCounterType {
    /**
     * The MAC received a broadcast Data frame, Command frame, or Beacon.
     * - destinationNodeId: BROADCAST_ADDRESS or Data frames or sender node ID for Beacon frames
     * - data: not used
     */
    MAC_RX_BROADCAST = 0,
    /**
     * The MAC transmitted a broadcast Data frame, Command frame or Beacon.
     * - destinationNodeId: BROADCAST_ADDRESS
     * - data: not used
     */
    MAC_TX_BROADCAST = 1,
    /**
     * The MAC received a unicast Data or Command frame.
     * - destinationNodeId: MAC layer source or EMBER_UNKNOWN_NODE_ID if no 16-bit source node ID is present in the frame
     * - data: not used
     */
    MAC_RX_UNICAST = 2,
    /**
     * The MAC successfully transmitted a unicast Data or Command frame.
     *   Note: Only frames with a 16-bit destination node ID are counted.
     * - destinationNodeId: MAC layer destination address
     * - data: not used
     */
    MAC_TX_UNICAST_SUCCESS = 3,
    /**
     * The MAC retried a unicast Data or Command frame after initial Tx attempt.
     *   Note: CSMA-related failures are tracked separately via PHY_CCA_FAIL_COUNT.
     * - destinationNodeId: MAC layer destination or EMBER_UNKNOWN_NODE_ID if no 16-bit destination node ID is present in the frame
     * - data: number of retries (after initial Tx attempt) accumulated so far for this packet. (Should always be >0.)
     */
    MAC_TX_UNICAST_RETRY = 4,
    /**
     * The MAC unsuccessfully transmitted a unicast Data or Command frame.
     *   Note: Only frames with a 16-bit destination node ID are counted.
     * - destinationNodeId: MAC layer destination address
     * - data: not used
     */
    MAC_TX_UNICAST_FAILED = 5,
    /**
     * The APS layer received a data broadcast.
     * - destinationNodeId: sender's node ID
     * - data: not used
     */
    APS_DATA_RX_BROADCAST = 6,
    /** The APS layer transmitted a data broadcast. */
    APS_DATA_TX_BROADCAST = 7,
    /**
     * The APS layer received a data unicast.
     * - destinationNodeId: sender's node ID
     * - data: not used
     */
    APS_DATA_RX_UNICAST = 8,
    /**
     * The APS layer successfully transmitted a data unicast.
     * - destinationNodeId: NWK destination address
     * - data: number of APS retries (>=0) consumed for this unicast.
     */
    APS_DATA_TX_UNICAST_SUCCESS = 9,
    /**
     * The APS layer retried a unicast Data frame.
     * This is a placeholder and is not used by the @c ::emberCounterHandler() callback.
     * Instead, the number of APS retries are returned in the data parameter of the callback
     * for the @c ::APS_DATA_TX_UNICAST_SUCCESS and @c ::APS_DATA_TX_UNICAST_FAILED types.
     * However, our supplied Counters component code will attempt to collect this information
     * from the aforementioned counters and populate this counter.
     * Note that this counter's behavior differs from that of @c ::MAC_TX_UNICAST_RETRY .
     */
    APS_DATA_TX_UNICAST_RETRY = 10,
    /**
     * The APS layer unsuccessfully transmitted a data unicast.
     * - destinationNodeId: NWK destination address
     * - data: number of APS retries (>=0) consumed for this unicast.
     */
    APS_DATA_TX_UNICAST_FAILED = 11,
    /** The network layer successfully submitted a new route discovery to the MAC. */
    ROUTE_DISCOVERY_INITIATED = 12,
    /** An entry was added to the neighbor table. */
    NEIGHBOR_ADDED = 13,
    /** An entry was removed from the neighbor table. */
    NEIGHBOR_REMOVED = 14,
    /** A neighbor table entry became stale because it had not been heard from. */
    NEIGHBOR_STALE = 15,
    /**
     * A node joined or rejoined to the network via this node.
     * - destinationNodeId: node ID of child
     * - data: not used
     */
    JOIN_INDICATION = 16,
    /**
     * An entry was removed from the child table.
     * - destinationNodeId: node ID of child
     * - data: not used
     */
    CHILD_REMOVED = 17,
    /** EZSP-UART only. An overflow error occurred in the UART. */
    ASH_OVERFLOW_ERROR = 18,
    /** EZSP-UART only. A framing error occurred in the UART. */
    ASH_FRAMING_ERROR = 19,
    /** EZSP-UART only. An overrun error occurred in the UART. */
    ASH_OVERRUN_ERROR = 20,
    /** A message was dropped at the Network layer because the NWK frame counter was not higher than the last message seen from that source. */
    NWK_FRAME_COUNTER_FAILURE = 21,
    /**
     * A message was dropped at the APS layer because the APS frame counter was not higher than the last message seen from that source.
     * - destinationNodeId: node ID of MAC source that relayed the message
     * - data: not used
     */
    APS_FRAME_COUNTER_FAILURE = 22,
    /** EZSP-UART only. An XOFF was transmitted by the UART. */
    ASH_XOFF = 23,
    /**
     * An encrypted message was dropped by the APS layer because the sender's key has not been authenticated.
     * As a result, the key is not authorized for use in APS data messages.
     * - destinationNodeId: EMBER_NULL_NODE_ID
     * - data: APS key table index related to the sender
     */
    APS_LINK_KEY_NOT_AUTHORIZED = 24,
    /**
     * A NWK encrypted message was received but dropped because decryption failed.
     * - destinationNodeId: sender of the dropped packet
     * - data: not used
     */
    NWK_DECRYPTION_FAILURE = 25,
    /**
     * An APS encrypted message was received but dropped because decryption failed.
     * - destinationNodeId: sender of the dropped packet
     * - data: not used
     */
    APS_DECRYPTION_FAILURE = 26,
    /**
     * The number of failures to allocate a set of linked packet buffers.
     * This doesn't necessarily mean that the packet buffer count was 0 at the time,
     * but that the number requested was greater than the number free.
     */
    ALLOCATE_PACKET_BUFFER_FAILURE = 27,
    /**
     * The number of relayed unicast packets.
     * - destinationId: NWK layer destination address of relayed packet
     * - data: not used
     */
    RELAYED_UNICAST = 28,
    /**
     * The number of times a packet was dropped due to reaching the preset PHY-to-MAC queue limit (sli_mac_phy_to_mac_queue_length).
     * The limit will determine how many messages are accepted by the PHY between calls to emberTick().
     * After that limit is reached, packets will be dropped. The counter records the number of dropped packets.
     *
     * NOTE: For each call to emberCounterHandler() there may be more than 1 packet that was dropped due to the limit reached.
     * The actual number of packets dropped will be returned in the 'data' parameter passed to that function.
     *
     * - destinationNodeId: not used
     * - data: number of dropped packets represented by this counter event
     * - phyIndex: present
     */
    PHY_TO_MAC_QUEUE_LIMIT_REACHED = 29,
    /**
     * The number of times a packet was dropped due to the packet-validate library checking a packet
     * and rejecting it due to length or other formatting problems.
     * - destinationNodeId: not used
     * - data: type of validation condition that failed
     */
    PACKET_VALIDATE_LIBRARY_DROPPED_COUNT = 30,
    /**
     * The number of times the NWK retry queue is full and a new message failed to be added.
     * - destinationNodeId; not used
     * - data: NWK retry queue size that has been exceeded
     */
    TYPE_NWK_RETRY_OVERFLOW = 31,
    /**
     * The number of times the PHY layer was unable to transmit due to a failed CCA (Clear Channel Assessment) attempt.
     * See also: MAC_TX_UNICAST_RETRY.
     * - destinationNodeId: MAC layer destination or EMBER_UNKNOWN_NODE_ID if no 16-bit destination node ID is present in the frame
     * - data: not used
     */
    PHY_CCA_FAIL_COUNT = 32,
    /** The number of times a NWK broadcast was dropped because the broadcast table was full. */
    BROADCAST_TABLE_FULL = 33,
    /** The number of times a low-priority packet traffic arbitration request has been made. */
    PTA_LO_PRI_REQUESTED = 34,
    /** The number of times a high-priority packet traffic arbitration request has been made. */
    PTA_HI_PRI_REQUESTED = 35,
    /** The number of times a low-priority packet traffic arbitration request has been denied. */
    PTA_LO_PRI_DENIED = 36,
    /** The number of times a high-priority packet traffic arbitration request has been denied. */
    PTA_HI_PRI_DENIED = 37,
    /** The number of times a low-priority packet traffic arbitration transmission has been aborted. */
    PTA_LO_PRI_TX_ABORTED = 38,
    /** The number of times a high-priority packet traffic arbitration transmission has been aborted. */
    PTA_HI_PRI_TX_ABORTED = 39,
    /** The number of times an address conflict has caused node_id change, and an address conflict error is sent. */
    ADDRESS_CONFLICT_SENT = 40,
    /** The number of times CSL failed to schedule Rx on target */
    CSL_RX_SCHEDULE_FAILED = 41,
    /** A placeholder giving the number of Ember counter types. */
    COUNT = 42,
}

/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
/** An enumerated list of library identifiers. */
export enum EmberLibraryId {
    FIRST = 0x00,

    ZIGBEE_PRO = 0x00,
    BINDING = 0x01,
    END_DEVICE_BIND = 0x02,
    SECURITY_CORE = 0x03,
    SECURITY_LINK_KEYS = 0x04,
    ALARM = 0x05,
    CBKE = 0x06,
    CBKE_DSA_SIGN = 0x07,
    ECC = 0x08,
    CBKE_DSA_VERIFY = 0x09,
    PACKET_VALIDATE = 0x0a,
    INSTALL_CODE = 0x0b,
    ZLL = 0x0c,
    CBKE_283K1 = 0x0d,
    ECC_283K1 = 0x0e,
    CBKE_CORE = 0x0f,
    NCP = 0x10,
    MULTI_NETWORK = 0x11,
    ENHANCED_BEACON_REQUEST = 0x12,
    CBKE_283K1_DSA_VERIFY = 0x13,
    MULTI_PAN = 0x14,

    NUMBER_OF_LIBRARIES = 0x15,
    NULL = 0xff,
}

/** This indicates the presence, absence, or status of an Ember stack library. */
export enum EmberLibraryStatus {
    // Base return codes. These may be ORed with statuses further below.
    LIBRARY_PRESENT_MASK = 0x80,
    LIBRARY_IS_STUB = 0x00,
    LIBRARY_ERROR = 0xff,

    // The ZigBee Pro library uses the following to indicate additional functionality:
    /** no router capability */
    ZIGBEE_PRO_LIBRARY_END_DEVICE_ONLY = 0x00,
    ZIGBEE_PRO_LIBRARY_HAVE_ROUTER_CAPABILITY = 0x01,
    ZIGBEE_PRO_LIBRARY_ZLL_SUPPORT = 0x02,

    // The Security library uses the following to indicate additional functionality:
    SECURITY_LIBRARY_END_DEVICE_ONLY = 0x00,
    /** router or trust center support */
    SECURITY_LIBRARY_HAVE_ROUTER_SUPPORT = 0x01,

    // The Packet Validate library may be globally turned on/off. Bit 0 indicates whether the library is enabled/disabled.
    PACKET_VALIDATE_LIBRARY_DISABLED = 0x00,
    PACKET_VALIDATE_LIBRARY_ENABLED = 0x01,
    PACKET_VALIDATE_LIBRARY_ENABLE_MASK = 0x01,
}
/* eslint-enable @typescript-eslint/no-duplicate-enum-values */

/** Defines the entropy source used by the stack. */
export enum EmberEntropySource {
    /** Error in identifying the entropy source. */
    ERROR = 0x00,
    /** The default radio entropy source. */
    RADIO = 0x01,
    /** TRNG with mbed TLS support. */
    MBEDTLS_TRNG = 0x02,
    /** Other mbed TLS entropy source. */
    MBEDTLS = 0x03,
}

/** Defines the options that should be used when initializing the node's network configuration. */
export enum EmberNetworkInitBitmask {
    NO_OPTIONS = 0x0000,
    /** The Parent Node ID and EUI64 are stored in a token. This prevents the need to perform an Orphan scan on startup. */
    PARENT_INFO_IN_TOKEN = 0x0001,
    /** Z3 compliant end devices on a network must send a rejoin request on reboot. */
    END_DEVICE_REJOIN_ON_REBOOT = 0x0002,
}

/** Defines the possible join states for a node. uint8_t */
export enum EmberNetworkStatus {
    /** The node is not associated with a network in any way. */
    NO_NETWORK,
    /** The node is currently attempting to join a network. */
    JOINING_NETWORK,
    /** The node is joined to a network. */
    JOINED_NETWORK,
    /** The node is an end device joined to a network but its parent is not responding. */
    JOINED_NETWORK_NO_PARENT,
    /** The node is a Sleepy-to-Sleepy initiator */
    JOINED_NETWORK_S2S_INITIATOR,
    /** The node is a Sleepy-to-Sleepy target */
    JOINED_NETWORK_S2S_TARGET,
    /** The node is in the process of leaving its current network. */
    LEAVING_NETWORK,
}

/** Network scan types. */
export enum EzspNetworkScanType {
    /** An energy scan scans each channel for its RSSI value. */
    ENERGY_SCAN = 0x00,
    /** An active scan scans each channel for available networks. */
    ACTIVE_SCAN = 0x01,
}

/** The type of method used for joining. uint8_t */
export enum EmberJoinMethod {
    /** Devices normally use MAC association to join a network, which respects
     *  the "permit joining" flag in the MAC beacon.
     *  This value should be used by default.
     */
    MAC_ASSOCIATION = 0,
    /** For networks where the "permit joining" flag is never turned
     *  on, devices will need to use a ZigBee NWK Rejoin.  This value causes the
     *  rejoin to be sent withOUT NWK security and the Trust Center will be
     *  asked to send the NWK key to the device.  The NWK key sent to the device
     *  can be encrypted with the device's corresponding Trust Center link key.
     *  That is determined by the ::EmberJoinDecision on the Trust Center
     *  returned by the ::emberTrustCenterJoinHandler().
     */
    NWK_REJOIN = 1,
    /* For networks where the "permit joining" flag is never turned
     * on, devices will need to use a NWK Rejoin.  If those devices have been
     * preconfigured with the  NWK key (including sequence number), they can use
     * a secured rejoin.  This is only necessary for end devices since they need
     * a parent.  Routers can simply use the ::CONFIGURED_NWK_STATE
     * join method below.
     */
    NWK_REJOIN_HAVE_NWK_KEY = 2,
    /** For networks where all network and security information is known
         ahead of time, a router device may be commissioned such that it does
        not need to send any messages to begin communicating on the network.
    */
    CONFIGURED_NWK_STATE = 3,
    /** This enumeration causes an unencrypted Network Commissioning Request to be
         sent out with joinType set to initial join. The trust center may respond
        by establishing a new dynamic link key and then sending the network key.
        Network Commissioning Requests should only be sent to parents that support
        processing of the command.
    */
    NWK_COMMISSIONING_JOIN = 4,
    /** This enumeration causes an unencrypted Network Commissioning Request to be
         sent out with joinType set to rejoin. The trust center may respond
        by establishing a new dynamic link key and then sending the network key.
        Network Commissioning Requests should only be sent to parents that support
        processing of the command.
    */
    NWK_COMMISSIONING_REJOIN = 5,
    /** This enumeration causes an encrypted Network Commissioning Request to be
         sent out with joinType set to rejoin. This enumeration is used by devices
        that already have the network key and wish to recover connection to a
        parent or the network in general.
        Network Commissioning Requests should only be sent to parents that support
        processing of the command.
    */
    NWK_COMMISSIONING_REJOIN_HAVE_NWK_KEY = 6,
}

/** Defines the possible types of nodes and the roles that a node might play in a network. */
export enum EmberNodeType {
    /** The device is not joined. */
    UNKNOWN_DEVICE = 0,
    /** Will relay messages and can act as a parent to other nodes. */
    COORDINATOR = 1,
    /** Will relay messages and can act as a parent to other nodes. */
    ROUTER = 2,
    /** Communicates only with its parent and will not relay messages. */
    END_DEVICE = 3,
    /** An end device whose radio can be turned off to save power. The application must call ::emberPollForData() to receive messages. */
    SLEEPY_END_DEVICE = 4,
    /** Sleepy end device which transmits with wake up frames (CSL). */
    S2S_INITIATOR_DEVICE = 5,
    /** Sleepy end device which duty cycles the radio Rx (CSL). */
    S2S_TARGET_DEVICE = 6,
}

/**  */
export enum EmberMultiPhyNwkConfig {
    ROUTERS_ALLOWED = 0x01,
    BROADCASTS_ENABLED = 0x02,
    DISABLED = 0x80,
}

/**
 * Duty cycle states
 *
 * Applications have no control over the state but the callback exposes
 * state changes to the application.
 */
export enum EmberDutyCycleState {
    /** No duty cycle tracking or metrics are taking place. */
    TRACKING_OFF = 0,
    /** Duty Cycle is tracked and has not exceeded any thresholds. */
    LBT_NORMAL = 1,
    /** The limited threshold of the total duty cycle allotment was exceeded. */
    LBT_LIMITED_THRESHOLD_REACHED = 2,
    /** The critical threshold of the total duty cycle allotment was exceeded. */
    LBT_CRITICAL_THRESHOLD_REACHED = 3,
    /** The suspend limit was reached and all outbound transmissions are blocked. */
    LBT_SUSPEND_LIMIT_REACHED = 4,
}

/** Defines binding types. uint8_t */
export enum EmberBindingType {
    /** A binding that is currently not in use. */
    UNUSED_BINDING = 0,
    /** A unicast binding whose 64-bit identifier is the destination EUI64. */
    UNICAST_BINDING = 1,
    /**
     * A unicast binding whose 64-bit identifier is the many-to-one destination EUI64.
     * Route discovery should be disabled when sending unicasts via many-to-one bindings.
     */
    MANY_TO_ONE_BINDING = 2,
    /**
     * A multicast binding whose 64-bit identifier is the group address.
     * This binding can be used to send messages to the group and to receive messages sent to the group.
     */
    MULTICAST_BINDING = 3,
}

/** Defines the possible outgoing message types. uint8_t */
export enum EmberOutgoingMessageType {
    /** Unicast sent directly to an EmberNodeId. */
    DIRECT,
    /** Unicast sent using an entry in the address table. */
    VIA_ADDRESS_TABLE,
    /** Unicast sent using an entry in the binding table. */
    VIA_BINDING,
    /** Multicast message. This value is passed to emberMessageSentHandler() only. It may not be passed to emberSendUnicast(). */
    MULTICAST,
    /** An aliased multicast message. This value is passed to emberMessageSentHandler() only. It may not be passed to emberSendUnicast(). */
    MULTICAST_WITH_ALIAS,
    /** An aliased Broadcast message. This value is passed to emberMessageSentHandler() only. It may not be passed to emberSendUnicast(). */
    BROADCAST_WITH_ALIAS,
    /** A broadcast message. This value is passed to emberMessageSentHandler() only. It may not be passed to emberSendUnicast(). */
    BROADCAST,
}

/** Defines the possible incoming message types. uint8_t */
export enum EmberIncomingMessageType {
    /** Unicast. */
    UNICAST,
    /** Unicast reply. */
    UNICAST_REPLY,
    /** Multicast. */
    MULTICAST,
    /** Multicast sent by the local device. */
    MULTICAST_LOOPBACK,
    /** Broadcast. */
    BROADCAST,
    /** Broadcast sent by the local device. */
    BROADCAST_LOOPBACK,
}

/**
 * Options to use when sending a message.
 *
 * The discover-route, APS-retry, and APS-indirect options may be used together.
 * Poll response cannot be combined with any other options.
 * uint16_t
 */
export enum EmberApsOption {
    /** No options. */
    NONE = 0x0000,
    ENCRYPT_WITH_TRANSIENT_KEY = 0x0001,
    USE_ALIAS_SEQUENCE_NUMBER = 0x0002,
    /**
     * This signs the application layer message body (APS Frame not included) and appends the ECDSA signature to the end of the message,
     * which is needed by Smart Energy applications and requires the CBKE and ECC libraries.
     * The ::emberDsaSignHandler() function is called after DSA signing is complete but before the message has been sent by the APS layer.
     * Note that when passing a buffer to the stack for DSA signing, the final byte in the buffer has a special significance as an indicator
     * of how many leading bytes should be ignored for signature purposes. See the API documentation of emberDsaSign()
     * or the dsaSign EZSP command for more details about this requirement.
     */
    DSA_SIGN = 0x0010,
    /** Send the message using APS Encryption using the Link Key shared with the destination node to encrypt the data at the APS Level. */
    ENCRYPTION = 0x0020,
    /**
     * Resend the message using the APS retry mechanism.
     * This option and the enable route discovery option must be enabled for an existing route to be repaired automatically.
     */
    RETRY = 0x0040,
    /**
     * Send the message with the NWK 'enable route discovery' flag, which  causes a route discovery to be initiated if no route to the
     * destination is known. Note that in the mesh stack, this option and the APS retry option must be enabled an existing route to be
     * repaired automatically.
     */
    ENABLE_ROUTE_DISCOVERY = 0x0100,
    /** Send the message with the NWK 'force route discovery' flag, which causes a route discovery to be initiated even if one is known. */
    FORCE_ROUTE_DISCOVERY = 0x0200,
    /** Include the source EUI64 in the network frame. */
    SOURCE_EUI64 = 0x0400,
    /** Include the destination EUI64 in the network frame. */
    DESTINATION_EUI64 = 0x0800,
    /** Send a ZDO request to discover the node ID of the destination if it is not already known. */
    ENABLE_ADDRESS_DISCOVERY = 0x1000,
    /**
     * This message is being sent in response to a call to  ::emberPollHandler().
     * It causes the message to be sent immediately instead of being queued up until the next poll from the (end device) destination.
     */
    POLL_RESPONSE = 0x2000,
    /**
     * This incoming message is a valid ZDO request and the application is responsible for sending a ZDO response.
     * This flag is used only within emberIncomingMessageHandler() when EMBER_APPLICATION_RECEIVES_UNSUPPORTED_ZDO_REQUESTS is defined. */
    ZDO_RESPONSE_REQUIRED = 0x4000,
    /**
     * This message is part of a fragmented message.  This option may only  be set for unicasts.
     * The groupId field gives the index of this fragment in the low-order byte.
     * If the low-order byte is zero this is the first fragment and the high-order byte contains the number of fragments in the message.
     */
    FRAGMENT = 0x8000, // SIGNED_ENUM 0x8000
}

/**
 * Types of source route discovery modes used by the concentrator.
 *
 * OFF no source route discovery is scheduled
 *
 * ON source routes discovery is scheduled, and it is triggered periodically
 *
 * RESCHEDULE  source routes discoveries are re-scheduled to be sent once immediately and then triggered periodically
 */
export enum EmberSourceRouteDiscoveryMode {
    /** off  */
    OFF = 0x00,
    /** on  */
    ON = 0x01,
    /** reschedule */
    RESCHEDULE = 0x02,
}

/** The types of MAC passthrough messages that an application may receive. This is a bitmask. */
export enum EmberMacPassthroughType {
    /** No MAC passthrough messages. */
    NONE = 0x00,
    /** SE InterPAN messages. */
    SE_INTERPAN = 0x01,
    /** EmberNet and first generation (v1) standalone bootloader messages. */
    EMBERNET = 0x02,
    /** EmberNet messages filtered by their source address. */
    EMBERNET_SOURCE = 0x04,
    /** Application-specific passthrough messages. */
    APPLICATION = 0x08,
    /** Custom inter-pan filter. */
    CUSTOM = 0x10,

    /** Internal Stack passthrough. */
    INTERNAL_ZLL = 0x80,
    INTERNAL_GP = 0x40,
}

/**
 * Interpan Message type: unicast, broadcast, or multicast.
 * uint8_t
 */
export enum EmberInterpanMessageType {
    UNICAST = 0x00,
    BROADCAST = 0x08,
    MULTICAST = 0x0c,
}

/** This is the Current Security Bitmask that details the use of various security features. */
export enum EmberCurrentSecurityBitmask {
    // These options are the same for Initial and Current Security state.

    /** This denotes that the device is running in a network with ZigBee
     *  Standard Security. */
    STANDARD_SECURITY_MODE_ = 0x0000,
    /** This denotes that the device is running in a network without
     *  a centralized Trust Center. */
    DISTRIBUTED_TRUST_CENTER_MODE_ = 0x0002,
    /** This denotes that the device has a Global Link Key.  The Trust Center
     *  Link Key is the same across multiple nodes. */
    TRUST_CENTER_GLOBAL_LINK_KEY_ = 0x0004,

    // Bit 3 reserved

    /** This denotes that the node has a Trust Center Link Key. */
    HAVE_TRUST_CENTER_LINK_KEY = 0x0010,

    /** This denotes that the Trust Center is using a Hashed Link Key. */
    TRUST_CENTER_USES_HASHED_LINK_KEY_ = 0x0084,

    // Bits 1, 5, 6, and 8-15 reserved.
}

/**
 * The list of supported key types used by Zigbee Security Manager.
 * uint8_t
 */
export enum SecManKeyType {
    NONE,
    /**
     * This is the network key, used for encrypting and decrypting network payloads.
     * There is only one of these keys in storage.
     */
    NETWORK,
    /**
     * This is the Trust Center Link Key. On the joining device, this is the APS
     * key used to communicate with the trust center. On the trust center, this
     * key can be used as a root key for APS encryption and decryption when
     * communicating with joining devices (if the security policy has the
     * EMBER_TRUST_CENTER_USES_HASHED_LINK_KEY bit set).
     * There is only one of these keys in storage.
     */
    TC_LINK,
    /**
     * This is a Trust Center Link Key, but it times out after either
     * ::EMBER_TRANSIENT_KEY_TIMEOUT_S or
     * ::EMBER_AF_PLUGIN_NETWORK_CREATOR_SECURITY_NETWORK_OPEN_TIME_S (if
     * defined), whichever is longer. This type of key is set on trust centers
     * who wish to open joining with a temporary, or transient, APS key for
     * devices to join with. Joiners who wish to try several keys when joining a
     * network may set several of these types of keys before attempting to join.
     * This is an indexed key, and local storage can fit as many keys as
     * available RAM allows.
     */
    TC_LINK_WITH_TIMEOUT,
    /**
     * This is an Application link key. On both joining devices and the trust
     * center, this key is used in APS encryption and decryption when
     * communicating to a joining device.
     * This is an indexed key table of size EMBER_KEY_TABLE_SIZE, so long as there
     * is sufficient nonvolatile memory to store keys.
     */
    APP_LINK,
    /** This is the ZLL encryption key for use by algorithms that require it. */
    ZLL_ENCRYPTION_KEY,
    /** For ZLL, this is the pre-configured link key used during classical ZigBee commissioning. */
    ZLL_PRECONFIGURED_KEY,
    /** This is a Green Power Device (GPD) key used on a Proxy device. */
    GREEN_POWER_PROXY_TABLE_KEY,
    /** This is a Green Power Device (GPD) key used on a Sink device. */
    GREEN_POWER_SINK_TABLE_KEY,
    /**
     * This is a generic key type intended to be loaded for one-time hashing or crypto operations.
     * This key is not persisted. Intended for use by the Zigbee stack.
     */
    INTERNAL,
}

/**
 * Derived keys are calculated when performing Zigbee crypto operations. The stack makes use of these derivations.
 * Compounding derivations can be specified by using an or-equals on two derived types if applicable;
 * this is limited to performing the key-transport, key-load, or verify-key hashes on either the TC Swap Out or TC Hashed Link keys.
 * uint16_t
 */
export enum SecManDerivedKeyType {
    /** Perform no derivation; use the key as is. */
    NONE = 0x0000,
    /** Perform the Key-Transport-Key hash. */
    KEY_TRANSPORT_KEY = 0x0001,
    /** Perform the Key-Load-Key hash. */
    KEY_LOAD_KEY = 0x0002,
    /** Perform the Verify Key hash. */
    VERIFY_KEY = 0x0004,
    /** Perform a simple AES hash of the key for TC backup. */
    TC_SWAP_OUT_KEY = 0x0008,
    /** For a TC using hashed link keys, hashed the root key against the supplied EUI in context. */
    TC_HASHED_LINK_KEY = 0x0010,
}

/**
 * Security Manager context flags.
 * uint8_t
 */
export enum SecManFlag {
    NONE = 0x00,
    /**
     * For export APIs, this flag indicates the key_index parameter is valid in
     *  the ::sl_zb_sec_man_context_t structure. This bit is set by the caller
     *  when intending to search for a key by key_index. This flag has no
     *  significance for import APIs. */
    KEY_INDEX_IS_VALID = 0x01,
    /**
     * For export APIs, this flag indicates the eui64 parameter is valid in the
     *  ::sl_zb_sec_man_context_t structure. This bit is set by the caller when
     *  intending to search for a key by eui64. It is also set when searching by
     *  key_index and an entry is found. This flag has no significance for import
     *  APIs. */
    EUI_IS_VALID = 0x02,
    /**
     * Internal use only. This indicates that the transient key being added is an
     * unconfirmed, updated key. This bit is set when we add a transient key and
     * the ::EmberTcLinkKeyRequestPolicy policy
     * is ::EMBER_ALLOW_TC_LINK_KEY_REQUEST_AND_GENERATE_NEW_KEY, whose behavior
     * dictates that we generate a new, unconfirmed key, send it to the requester,
     * and await for a Verify Key Confirm message. */
    UNCONFIRMED_TRANSIENT_KEY = 0x04,
    /**
     * Internal use only.  This indicates that the key being added was derived via
     * dynamic link key negotiation.  This may be used in conjunction with the above
     * ::UNCONFIRMED_TRANSIENT_KEY while the derived link key awaits
     * confirmation
     */
    AUTHENTICATED_DYNAMIC_LINK_KEY = 0x08,
    /**
     * Internal use only.  This indicates that the "key" being added is instead the
     * symmetric passphrase to be stored in the link key table. This flag will trigger the
     * addition of the KEY_TABLE_SYMMETRIC_PASSPHRASE bitmask when storing the symmetric
     * passphrase so that it can be differentiated from other keys with the same EUI64.
     */
    SYMMETRIC_PASSPHRASE = 0x10,
}

/** This denotes the status of an attempt to establish a key with another device. */
export enum EmberKeyStatus {
    STATUS_NONE = 0x00,
    APP_LINK_KEY_ESTABLISHED = 0x01,
    TRUST_CENTER_LINK_KEY_ESTABLISHED = 0x03,

    ESTABLISHMENT_TIMEOUT = 0x04,
    TABLE_FULL = 0x05,

    // These are success status values applying only to the Trust Center answering key requests.
    TC_RESPONDED_TO_KEY_REQUEST = 0x06,
    TC_APP_KEY_SENT_TO_REQUESTER = 0x07,

    // These are failure status values applying only to the
    // Trust Center answering key requests.
    TC_RESPONSE_TO_KEY_REQUEST_FAILED = 0x08,
    TC_REQUEST_KEY_TYPE_NOT_SUPPORTED = 0x09,
    TC_NO_LINK_KEY_FOR_REQUESTER = 0x0a,
    TC_REQUESTER_EUI64_UNKNOWN = 0x0b,
    TC_RECEIVED_FIRST_APP_KEY_REQUEST = 0x0c,
    TC_TIMEOUT_WAITING_FOR_SECOND_APP_KEY_REQUEST = 0x0d,
    TC_NON_MATCHING_APP_KEY_REQUEST_RECEIVED = 0x0e,
    TC_FAILED_TO_SEND_APP_KEYS = 0x0f,
    TC_FAILED_TO_STORE_APP_KEY_REQUEST = 0x10,
    TC_REJECTED_APP_KEY_REQUEST = 0x11,
    TC_FAILED_TO_GENERATE_NEW_KEY = 0x12,
    TC_FAILED_TO_SEND_TC_KEY = 0x13,

    // These are generic status values for a key requester.
    TRUST_CENTER_IS_PRE_R21 = 0x1e,

    // These are status values applying only to the Trust Center verifying link keys.
    TC_REQUESTER_VERIFY_KEY_TIMEOUT = 0x32,
    TC_REQUESTER_VERIFY_KEY_FAILURE = 0x33,
    TC_REQUESTER_VERIFY_KEY_SUCCESS = 0x34,

    // These are status values applying only to the key requester
    // verifying link keys.
    VERIFY_LINK_KEY_FAILURE = 0x64,
    VERIFY_LINK_KEY_SUCCESS = 0x65,
}

/** This bitmask describes the presence of fields within the ::EmberKeyStruct. uint16_t */
export enum EmberKeyStructBitmask {
    /** This indicates that the key has a sequence number associated with it. (i.e., a Network Key). */
    HAS_SEQUENCE_NUMBER = 0x0001,
    /** This indicates that the key has an outgoing frame counter and the corresponding value within the ::EmberKeyStruct has been populated.*/
    HAS_OUTGOING_FRAME_COUNTER = 0x0002,
    /** This indicates that the key has an incoming frame counter and the corresponding value within the ::EmberKeyStruct has been populated.*/
    HAS_INCOMING_FRAME_COUNTER = 0x0004,
    /**
     * This indicates that the key has an associated Partner EUI64 address and the corresponding value
     * within the ::EmberKeyStruct has been populated.
     */
    HAS_PARTNER_EUI64 = 0x0008,
    /**
     * This indicates the key is authorized for use in APS data messages.
     * If the key is not authorized for use in APS data messages it has not yet gone through a key agreement protocol, such as CBKE (i.e., ECC).
     */
    IS_AUTHORIZED = 0x0010,
    /**
     * This indicates that the partner associated with the link is a sleepy end device.
     * This bit is set automatically if the local device hears a device announce from the partner indicating it is not an 'RX on when idle' device.
     */
    PARTNER_IS_SLEEPY = 0x0020,
    /**
     * This indicates that the transient key which is being added is unconfirmed.
     * This bit is set when we add a transient key while the EmberTcLinkKeyRequestPolicy is EMBER_ALLOW_TC_LINK_KEY_REQUEST_AND_GENERATE_NEW_KEY
     */
    UNCONFIRMED_TRANSIENT = 0x0040,
    /** This indicates that the actual key data is stored in PSA, and the respective PSA ID is recorded in the psa_id field. */
    HAS_PSA_ID = 0x0080,
    /**
     * This indicates that the keyData field has valid data. On certain parts and depending on the security configuration,
     * keys may live in secure storage and are not exportable. In such cases, keyData will not house the actual key contents.
     */
    HAS_KEY_DATA = 0x0100,
    /**
     * This indicates that the key represents a Device Authentication Token and is not an encryption key.
     * The Authentication token is persisted for the lifetime of the device on the network and used to validate and update the device connection.
     * It is only removed when the device leaves or is decommissioned from the network
     */
    IS_AUTHENTICATION_TOKEN = 0x0200,
    /** This indicates that the key has been derived by the Dynamic Link Key feature. */
    DLK_DERIVED = 0x0400,
    /** This indicates that the device this key is being used to communicate with supports the APS frame counter synchronization procedure. */
    FC_SYNC_SUPPORTED = 0x0800,
}

/**
 * The Status of the Update Device message sent to the Trust Center.
 * The device may have joined or rejoined insecurely, rejoined securely, or left.
 * MAC Security has been deprecated and therefore there is no secure join.
 * These map to the actual values within the APS Command frame so they cannot be arbitrarily changed.
 * uint8_t
 */
export enum EmberDeviceUpdate {
    STANDARD_SECURITY_SECURED_REJOIN = 0,
    STANDARD_SECURITY_UNSECURED_JOIN = 1,
    DEVICE_LEFT = 2,
    STANDARD_SECURITY_UNSECURED_REJOIN = 3,
}

/** The decision made by the Trust Center when a node attempts to join. uint8_t */
export enum EmberJoinDecision {
    /** Allow the node to join. The node has the key. */
    USE_PRECONFIGURED_KEY = 0,
    /** Allow the node to join. Send the key to the node. */
    SEND_KEY_IN_THE_CLEAR,
    /** Deny join. */
    DENY_JOIN,
    /** Take no action. */
    NO_ACTION,
    /** Allow rejoins only.*/
    ALLOW_REJOINS_ONLY,
}

/** A bitmask indicating the state of the ZLL device. This maps directly to the ZLL information field in the scan response. uint16_t */
export enum EmberZllState {
    /** No state. */
    NONE = 0x0000,
    /** The device is factory new. */
    FACTORY_NEW = 0x0001,
    /** The device is capable of assigning addresses to other devices. */
    ADDRESS_ASSIGNMENT_CAPABLE = 0x0002,
    /** The device is initiating a link operation. */
    LINK_INITIATOR = 0x0010,
    /** The device is requesting link priority. */
    LINK_PRIORITY_REQUEST = 0x0020,
    /** The device is a ZigBee 3.0 device. */
    PROFILE_INTEROP = 0x0080,
    /** The device is on a non-ZLL network. */
    NON_ZLL_NETWORK = 0x0100,
    /** Internal use: the ZLL token's key values point to a PSA key identifier */
    TOKEN_POINTS_TO_PSA_ID = 0x0200,
}

/** Differentiates among ZLL network operations. */
export enum EzspZllNetworkOperation {
    /** ZLL form network command. */
    FORM_NETWORK = 0x00,
    /** ZLL join target command. */
    JOIN_TARGET = 0x01,
}

/** The key encryption algorithms supported by the stack. */
export enum EmberZllKeyIndex {
    /** The key encryption algorithm for use during development. */
    DEVELOPMENT = 0x00,
    /** The key encryption algorithm shared by all certified devices. */
    MASTER = 0x04,
    /** The key encryption algorithm for use during development and certification. */
    CERTIFICATION = 0x0f,
}

/** uint8_t */
export enum EmberGpApplicationId {
    /** Source identifier. */
    SOURCE_ID = 0x00,
    /** IEEE address. */
    IEEE_ADDRESS = 0x02,
}

/** Green Power Security Level. uint8_t */
export enum EmberGpSecurityLevel {
    /** No Security  */
    NONE = 0x00,
    /** Reserved  */
    RESERVED = 0x01,
    /** 4 Byte Frame Counter and 4 Byte MIC */
    FC_MIC = 0x02,
    /** 4 Byte Frame Counter and 4 Byte MIC with encryption */
    FC_MIC_ENCRYPTED = 0x03,
}

/** Green Power Security Security Key Type. uint8_t */
export enum EmberGpKeyType {
    /** No Key */
    NONE = 0x00,
    /** GP Security Key Type is Zigbee Network Key */
    NWK = 0x01,
    /** GP Security Key Type is Group Key */
    GPD_GROUP = 0x02,
    /** GP Security Key Type is Derived Network Key */
    NWK_DERIVED = 0x03,
    /** GP Security Key Type is Out Of Box Key */
    GPD_OOB = 0x04,
    /** GP Security Key Type is GPD Derived Key */
    GPD_DERIVED = 0x07,
}

/** uint8_t */
export enum EmberGpProxyTableEntryStatus {
    /** The GP table entry is in use for a Proxy Table Entry. */
    ACTIVE = 0x01,
    /** The proxy table entry is not in use. */
    UNUSED = 0xff,
}

/** GP Sink Type. */
export enum EmberGpSinkType {
    /** Sink Type is Full Unicast */
    FULL_UNICAST,
    /** Sink Type is Derived groupcast, the group ID is derived from the GpdId during commissioning.
     * The sink is added to the APS group with that groupId.
     */
    D_GROUPCAST,
    /** Sink type GROUPCAST, the groupId can be obtained from the APS group table
     * or from the sink table.
     */
    GROUPCAST,
    /** Sink Type is Light Weight Unicast. */
    LW_UNICAST,
    /** Unused sink type */
    UNUSED = 0xff,
}

/** uint8_t */
export enum EmberGpSinkTableEntryStatus {
    /** The GP table entry is in use for a Sink Table Entry. */
    ACTIVE = 0x01,
    /** The proxy table entry is not in use. */
    UNUSED = 0xff,
}

export enum EmberLeaveNetworkOption {
    /** Leave with no option. */
    WITH_NO_OPTION = 0x00,
    /** Leave with option rejoin. */
    WITH_OPTION_REJOIN = 0x20,
    /** Leave is requested. */
    IS_REQUESTED = 0x40,
}

/**
 * Packet transmit priorities in terms of getting into the MAC queue.
 *
 * SL_802154_TRANSMIT_PRIORITY_HIGH High priority headers go on the front of the queue.
 * SL_802154_TRANSMIT_PRIORITY_NORMAL  Normal priority headers go on the back of the queue.
 * SL_802154_TRANSMIT_PRIORITY_SCAN_OKAY Normally, only beacon requests and orphan notifications can be sent during a scan.
 * They are submitted with SCAN_OKAY and go on the front of the queue. Other packets could be submitted with this priority, but it is not recommended.
 */
export enum EmberTransmitPriority {
    HIGH = 0,
    NORMAL = 1,
    SCAN_OKAY = 2,
}

export enum IEEE802154CcaMode {
    /** RSSI-based CCA. CCA reports a busy medium upon detecting any energy above -75 (default RAIL_CsmaConfig_t.ccaThreshold). */
    RSSI = 0,
    /**
     * Signal Identifier-based CCA. CCA reports a busy medium only upon the detection of a signal compliant with this standard
     * with the same modulation and spreading characteristics of the PHY that is currently in use.
     */
    SIGNAL = 1,
    /**
     * RSSI or signal identifier-based CCA. CCA reports a busy medium on either detecting any energy above
     * -75 (default RAIL_CsmaConfig_t.ccaThreshold) or detection of a signal compliant with this standard with the same modulation
     * and spreading characteristics of the PHY that is currently in use.
     */
    SIGNAL_OR_RSSI = 2,
    /**
     * RSSI and signal identifier-based CCA. CCA reports a busy medium only on detecting any energy above -75 (default RAIL_CsmaConfig_t.ccaThreshold)
     * of a signal compliant with this standard with the same modulation and spreading characteristics of the PHY that is currently in use.
     */
    SIGNAL_AND_RSSI = 3,
    /** ALOHA. Always transmit CCA=1. CCA always reports an idle medium. */
    ALWAYS_TRANSMIT = 4,
}
