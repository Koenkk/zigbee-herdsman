import {ClusterId as ZdoClusterId} from '../../../zspec/zdo';

export enum ADDRESS_MODE {
    bound = 0x00, //Use one or more bound nodes/endpoints, with acknowledgements
    group = 0x01, //Use a pre-defined group address, with acknowledgements
    short = 0x02, //Use a 16-bit network address, with acknowledgements
    ieee = 0x03, //Use a 64-bit IEEE/MAC address, with acknowledgements
    broadcast = 0x04, //Perform a broadcast
    no_transmit = 0x05, //Do not transmit
    bound_no_ack = 0x06, //Perform a bound transmission, with no acknowledgements
    short_no_ack = 0x07, //Perform a transmission using a 16-bit network address, with no acknowledgements
    ieee_no_ack = 0x08, //Perform a transmission using a 64-bit IEEE/MAC address, with no acknowledgements
    bound_non_blocking = 0x09, //Perform a non-blocking bound transmission, with acknowledgements
    bound_non_blocking_no_ack = 10, //Perform a non-blocking bound transmission, with no acknowledgements
}

export enum DEVICE_TYPE {
    coordinator = 0,
    router = 1,
    legacy_router = 2,
}

export enum BOOLEAN {
    false = 0x00,
    true = 0x01,
}

export enum LOG_LEVEL {
    'EMERG',
    'ALERT',
    'CRIT ',
    'ERROR',
    'WARN ',
    'NOT  ',
    'INFO ',
    'DEBUG',
}

export enum NODE_LOGICAL_TYPE {
    coordinator = 0x00,
    router = 0x01,
    end_device = 0x02,
}

export enum STATUS {
    E_SL_MSG_STATUS_SUCCESS,
    E_SL_MSG_STATUS_INCORRECT_PARAMETERS,
    E_SL_MSG_STATUS_UNHANDLED_COMMAND,
    E_SL_MSG_STATUS_BUSY,
    E_SL_MSG_STATUS_STACK_ALREADY_STARTED,
}

export enum PERMIT_JOIN_STATUS {
    on = 1, // devices are allowed to join network
    off = 0, // devices are not allowed join the network
}

export enum NETWORK_JOIN_STATUS {
    joined_existing_network = 0,
    formed_new_network = 1,
    failed_128 = 128, //network join failed (error 0x80)
    failed_129 = 129, //network join failed (error 0x81)
    failed_130 = 130, //network join failed (error 0x82)
    failed_131 = 131, //network join failed (error 0x83)
    failed_132 = 132, //network join failed (error 0x84)
    failed_133 = 133, //network join failed (error 0x85)
    failed_134 = 134, //network join failed (error 0x86)
    failed_135 = 135, //network join failed (error 0x87)
    failed_136 = 136, //network join failed (error 0x88)
    failed_137 = 137, //network join failed (error 0x89)
    failed_138 = 138, //network join failed (error 0x8a)
    failed_139 = 139, //network join failed (error 0x8b)
    failed_140 = 140, //network join failed (error 0x8c)
    failed_141 = 141, //network join failed (error 0x8d)
    failed_142 = 142, //network join failed (error 0x8e)
    failed_143 = 143, //network join failed (error 0x8f)
    failed_144 = 144, //network join failed (error 0x90)
    failed_145 = 145, //network join failed (error 0x91)
    failed_146 = 146, //network join failed (error 0x92)
    failed_147 = 147, //network join failed (error 0x93)
    failed_148 = 148, //network join failed (error 0x94)
    failed_149 = 149, //network join failed (error 0x95)
    failed_150 = 150, //network join failed (error 0x96)
    failed_151 = 151, //network join failed (error 0x97)
    failed_152 = 152, //network join failed (error 0x98)
    failed_153 = 153, //network join failed (error 0x99)
    failed_154 = 154, //network join failed (error 0x9a)
    failed_155 = 155, //network join failed (error 0x9b)
    failed_156 = 156, //network join failed (error 0x9c)
    failed_157 = 157, //network join failed (error 0x9d)
    failed_158 = 158, //network join failed (error 0x9e)
    failed_159 = 159, //network join failed (error 0x9f)
    failed_160 = 160, //network join failed (error 0xa0)
    failed_161 = 161, //network join failed (error 0xa1)
    failed_162 = 162, //network join failed (error 0xa2)
    failed_163 = 163, //network join failed (error 0xa3)
    failed_164 = 164, //network join failed (error 0xa4)
    failed_165 = 165, //network join failed (error 0xa5)
    failed_166 = 166, //network join failed (error 0xa6)
    failed_167 = 167, //network join failed (error 0xa7)
    failed_168 = 168, //network join failed (error 0xa8)
    failed_169 = 169, //network join failed (error 0xa9)
    failed_170 = 170, //network join failed (error 0xaa)
    failed_171 = 171, //network join failed (error 0xab)
    failed_172 = 172, //network join failed (error 0xac)
    failed_173 = 173, //network join failed (error 0xad)
    failed_174 = 174, //network join failed (error 0xae)
    failed_175 = 175, //network join failed (error 0xaf)
    failed_176 = 176, //network join failed (error 0xb0)
    failed_177 = 177, //network join failed (error 0xb1)
    failed_178 = 178, //network join failed (error 0xb2)
    failed_179 = 179, //network join failed (error 0xb3)
    failed_180 = 180, //network join failed (error 0xb4)
    failed_181 = 181, //network join failed (error 0xb5)
    failed_182 = 182, //network join failed (error 0xb6)
    failed_183 = 183, //network join failed (error 0xb7)
    failed_184 = 184, //network join failed (error 0xb8)
    failed_185 = 185, //network join failed (error 0xb9)
    failed_186 = 186, //network join failed (error 0xba)
    failed_187 = 187, //network join failed (error 0xbb)
    failed_188 = 188, //network join failed (error 0xbc)
    failed_189 = 189, //network join failed (error 0xbd)
    failed_190 = 190, //network join failed (error 0xbe)
    failed_191 = 191, //network join failed (error 0xbf)
    failed_192 = 192, //network join failed (error 0xc0)
    failed_193 = 193, //network join failed (error 0xc1)
    failed_194 = 194, //network join failed (error 0xc2)
    failed_195 = 195, //network join failed (error 0xc3)
    failed_196 = 196, //network join failed (error 0xc4)
    failed_197 = 197, //network join failed (error 0xc5)
    failed_198 = 198, //network join failed (error 0xc6)
    failed_199 = 199, //network join failed (error 0xc7)
    failed_200 = 200, //network join failed (error 0xc8)
    failed_201 = 201, //network join failed (error 0xc9)
    failed_202 = 202, //network join failed (error 0xca)
    failed_203 = 203, //network join failed (error 0xcb)
    failed_204 = 204, //network join failed (error 0xcc)
    failed_205 = 205, //network join failed (error 0xcd)
    failed_206 = 206, //network join failed (error 0xce)
    failed_207 = 207, //network join failed (error 0xcf)
    failed_208 = 208, //network join failed (error 0xd0)
    failed_209 = 209, //network join failed (error 0xd1)
    failed_210 = 210, //network join failed (error 0xd2)
    failed_211 = 211, //network join failed (error 0xd3)
    failed_212 = 212, //network join failed (error 0xd4)
    failed_213 = 213, //network join failed (error 0xd5)
    failed_214 = 214, //network join failed (error 0xd6)
    failed_215 = 215, //network join failed (error 0xd7)
    failed_216 = 216, //network join failed (error 0xd8)
    failed_217 = 217, //network join failed (error 0xd9)
    failed_218 = 218, //network join failed (error 0xda)
    failed_219 = 219, //network join failed (error 0xdb)
    failed_220 = 220, //network join failed (error 0xdc)
    failed_221 = 221, //network join failed (error 0xdd)
    failed_222 = 222, //network join failed (error 0xde)
    failed_223 = 223, //network join failed (error 0xdf)
    failed_224 = 224, //network join failed (error 0xe0)
    failed_225 = 225, //network join failed (error 0xe1)
    failed_226 = 226, //network join failed (error 0xe2)
    failed_227 = 227, //network join failed (error 0xe3)
    failed_228 = 228, //network join failed (error 0xe4)
    failed_229 = 229, //network join failed (error 0xe5)
    failed_230 = 230, //network join failed (error 0xe6)
    failed_231 = 231, //network join failed (error 0xe7)
    failed_232 = 232, //network join failed (error 0xe8)
    failed_233 = 233, //network join failed (error 0xe9)
    failed_234 = 234, //network join failed (error 0xea)
    failed_235 = 235, //network join failed (error 0xeb)
    failed_236 = 236, //network join failed (error 0xec)
    failed_237 = 237, //network join failed (error 0xed)
    failed_238 = 238, //network join failed (error 0xee)
    failed_239 = 239, //network join failed (error 0xef)
    failed_240 = 240, //network join failed (error 0xf0)
    failed_241 = 241, //network join failed (error 0xf1)
    failed_242 = 242, //network join failed (error 0xf2)
    failed_243 = 243, //network join failed (error 0xf3)
    failed_244 = 244, //network join failed (error 0xf4)
}

export enum ON_OFF_STATUS {
    on = 1,
    off = 0,
}

export enum RESTART_STATUS {
    startup = 0,
    nfn_start = 2,
    running = 6,
}

export enum ZiGateCommandCode {
    GetNetworkState = 0x0009,
    RawMode = 0x0002,
    SetExtendedPANID = 0x0020,
    SetChannelMask = 0x0021,
    GetVersion = 0x0010,
    Reset = 0x0011,
    ErasePersistentData = 0x0012,
    RemoveDevice = 0x0026,
    RawAPSDataRequest = 0x0530,
    GetTimeServer = 0x0017,
    SetTimeServer = 0x0016,
    PermitJoinStatus = 0x0014,
    GetDevicesList = 0x0015,

    StartNetwork = 0x0024,
    StartNetworkScan = 0x0025,
    SetCertification = 0x0019,

    // ResetFactoryNew = 0x0013,
    OnOff = 0x0092,
    OnOffTimed = 0x0093,
    AttributeDiscovery = 0x0140,
    AttributeRead = 0x0100,
    AttributeWrite = 0x0110,
    DescriptorComplex = 0x0531,

    // zdo
    Bind = 0x0030,
    UnBind = 0x0031,
    NwkAddress = 0x0040,
    IEEEAddress = 0x0041,
    NodeDescriptor = 0x0042,
    SimpleDescriptor = 0x0043,
    PowerDescriptor = 0x0044,
    ActiveEndpoint = 0x0045,
    MatchDescriptor = 0x0046,
    // ManagementLeaveRequest = 0x0047, XXX: some non-standard form of LeaveRequest?
    PermitJoin = 0x0049,
    ManagementNetworkUpdate = 0x004a,
    SystemServerDiscovery = 0x004b,
    LeaveRequest = 0x004c,
    ManagementLQI = 0x004e,
    // ManagementRtg = 0x004?,
    // ManagementBind = 0x004?,

    SetDeviceType = 0x0023,
    LED = 0x0018,
    SetTXpower = 0x0806,
    SetSecurityStateKey = 0x0022,
    AddGroup = 0x0060,
}

export const ZDO_REQ_CLUSTER_ID_TO_ZIGATE_COMMAND_ID: Readonly<Partial<Record<ZdoClusterId, ZiGateCommandCode>>> = {
    [ZdoClusterId.NETWORK_ADDRESS_REQUEST]: ZiGateCommandCode.NwkAddress,
    [ZdoClusterId.IEEE_ADDRESS_REQUEST]: ZiGateCommandCode.IEEEAddress,
    [ZdoClusterId.NODE_DESCRIPTOR_REQUEST]: ZiGateCommandCode.NodeDescriptor,
    [ZdoClusterId.POWER_DESCRIPTOR_REQUEST]: ZiGateCommandCode.PowerDescriptor,
    [ZdoClusterId.SIMPLE_DESCRIPTOR_REQUEST]: ZiGateCommandCode.SimpleDescriptor,
    [ZdoClusterId.MATCH_DESCRIPTORS_REQUEST]: ZiGateCommandCode.MatchDescriptor,
    [ZdoClusterId.ACTIVE_ENDPOINTS_REQUEST]: ZiGateCommandCode.ActiveEndpoint,
    [ZdoClusterId.SYSTEM_SERVER_DISCOVERY_REQUEST]: ZiGateCommandCode.SystemServerDiscovery,
    [ZdoClusterId.BIND_REQUEST]: ZiGateCommandCode.Bind,
    [ZdoClusterId.UNBIND_REQUEST]: ZiGateCommandCode.UnBind,
    [ZdoClusterId.LQI_TABLE_REQUEST]: ZiGateCommandCode.ManagementLQI,
    // [ZdoClusterId.ROUTING_TABLE_REQUEST]: ZiGateCommandCode.ManagementRtg,
    // [ZdoClusterId.BINDING_TABLE_REQUEST]: ZiGateCommandCode.ManagementBind,
    [ZdoClusterId.LEAVE_REQUEST]: ZiGateCommandCode.LeaveRequest,
    [ZdoClusterId.NWK_UPDATE_REQUEST]: ZiGateCommandCode.ManagementNetworkUpdate,
    [ZdoClusterId.PERMIT_JOINING_REQUEST]: ZiGateCommandCode.PermitJoin,
};

export enum ZiGateMessageCode {
    DeviceAnnounce = 0x004d,
    Status = 0x8000,
    LOG = 0x8001,
    DataIndication = 0x8002,
    NodeClusterList = 0x8003,
    NodeAttributeList = 0x8004,
    NodeCommandIDList = 0x8005,
    SimpleDescriptorResponse = 0x8043,
    NetworkState = 0x8009,
    VersionList = 0x8010,
    APSDataACK = 0x8011,
    APSDataConfirm = 0x8012,
    APSDataConfirmFailed = 0x8702,
    NetworkJoined = 0x8024,
    LeaveIndication = 0x8048,
    RouterDiscoveryConfirm = 0x8701,
    PermitJoinStatus = 0x8014,
    GetTimeServer = 0x8017,
    ManagementLQIResponse = 0x804e,
    ManagementLeaveResponse = 0x8047,
    PDMEvent = 0x8035,
    PDMLoaded = 0x0302,
    RestartNonFactoryNew = 0x8006,
    RestartFactoryNew = 0x8007,
    ExtendedStatusCallBack = 0x9999,
    AddGroupResponse = 0x8060,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ZiGateObjectPayload = any;

export enum ZPSNwkKeyState {
    ZPS_ZDO_NO_NETWORK_KEY,
    ZPS_ZDO_PRECONFIGURED_LINK_KEY,
    ZPS_ZDO_DISTRIBUTED_LINK_KEY,
    ZPS_ZDO_PRECONFIGURED_INSTALLATION_CODE,
}

export enum ZPSNwkKeyType {
    ZPS_APS_UNIQUE_LINK_KEY /*Initial key*/,
    ZPS_APS_GLOBAL_LINK_KEY,
}

export enum PDMEventType {
    E_PDM_SYSTEM_EVENT_WEAR_COUNT_TRIGGER_VALUE_REACHED = 0,
    E_PDM_SYSTEM_EVENT_DESCRIPTOR_SAVE_FAILED,
    E_PDM_SYSTEM_EVENT_PDM_NOT_ENOUGH_SPACE,
    E_PDM_SYSTEM_EVENT_LARGEST_RECORD_FULL_SAVE_NO_LONGER_POSSIBLE,
    E_PDM_SYSTEM_EVENT_SEGMENT_DATA_CHECKSUM_FAIL,
    E_PDM_SYSTEM_EVENT_SEGMENT_SAVE_OK,
    E_PDM_SYSTEM_EVENT_EEPROM_SEGMENT_HEADER_REPAIRED,
    E_PDM_SYSTEM_EVENT_SYSTEM_INTERNAL_BUFFER_WEAR_COUNT_SWAP,
    E_PDM_SYSTEM_EVENT_SYSTEM_DUPLICATE_FILE_SEGMENT_DETECTED,
    E_PDM_SYSTEM_EVENT_SYSTEM_ERROR,
    E_PDM_SYSTEM_EVENT_SEGMENT_PREWRITE,
    E_PDM_SYSTEM_EVENT_SEGMENT_POSTWRITE,
    E_PDM_SYSTEM_EVENT_SEQUENCE_DUPLICATE_DETECTED,
    E_PDM_SYSTEM_EVENT_SEQUENCE_VERIFY_FAIL,
    E_PDM_SYSTEM_EVENT_PDM_SMART_SAVE,
    E_PDM_SYSTEM_EVENT_PDM_FULL_SAVE,
}

const coordinatorEndpoints: readonly {ID: number; profileID: number; deviceID: number; inputClusters: number[]; outputClusters: number[]}[] = [
    {
        ID: 0x01,
        profileID: 0x0104,
        deviceID: 0x0840,
        inputClusters: [0x0000, 0x0003, 0x0019, 0x0204, 0x000f],
        outputClusters: [
            0x0b03, 0x0000, 0x0300, 0x0004, 0x0003, 0x0008, 0x0006, 0x0005, 0x0101, 0x0702, 0x0500, 0x0019, 0x0201, 0x0401, 0x0400, 0x0406, 0x0403,
            0x0405, 0x0402, 0x0204, 0x0001, 0x0b05, 0x1000,
        ],
    },
    {
        ID: 0x0a,
        profileID: 0x0104,
        deviceID: 0x0840,
        inputClusters: [0x0000, 0x0003, 0x0019, 0x0204, 0x000f],
        outputClusters: [
            0x0b03, 0x0000, 0x0300, 0x0004, 0x0003, 0x0008, 0x0006, 0x0005, 0x0101, 0x0702, 0x0500, 0x0019, 0x0201, 0x0401, 0x0400, 0x0406, 0x0403,
            0x0405, 0x0402, 0x0204, 0x0001, 0x0b05, 0x1000,
        ],
    },
];

export {coordinatorEndpoints};
