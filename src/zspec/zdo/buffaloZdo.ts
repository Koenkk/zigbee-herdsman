import Buffalo from '../../buffalo/buffalo';
import {Status} from './definition/status';
import {ZdoStatusError} from './zdoStatusError';
import {
    ActiveEndpointsResponse,
    BindingTableResponse,
    EndDeviceAnnounce,
    IEEEAddressResponse,
    LQITableResponse,
    MatchDescriptorsResponse,
    NetworkAddressResponse,
    NodeDescriptorResponse,
    ParentAnnounceResponse,
    PowerDescriptorResponse,
    RoutingTableResponse,
    SimpleDescriptorResponse,
    SystemServerDiscoveryResponse,
    LQITableEntry,
    RoutingTableEntry,
    BindingTableEntry,
    NwkUpdateResponse,
    NwkEnhancedUpdateResponse,
    NwkIEEEJoiningListResponse,
    NwkUnsolicitedEnhancedUpdateResponse,
    NwkBeaconSurveyResponse,
    StartKeyNegotiationResponse,
    RetrieveAuthenticationTokenResponse,
    GetAuthenticationLevelResponse,
    SetConfigurationResponse,
    GetConfigurationResponse,
    ChallengeResponse,
    APSFrameCounterChallengeTLV,
    AuthenticationTokenIdTLV,
    Curve25519PublicPointTLV,
    FragmentationParametersGlobalTLV,
    SelectedKeyNegotiationMethodTLV,
    PotentialParentsTLV,
    ClearAllBindingsReqEUI64TLV,
    BeaconAppendixEncapsulationGlobalTLV,
    TargetIEEEAddressTLV,
    NextPanIdChangeGlobalTLV,
    NextChannelChangeGlobalTLV,
    ConfigurationParametersGlobalTLV,
    DeviceEUI64ListTLV,
    BeaconSurveyResultsTLV,
    DeviceAuthenticationLevelTLV,
    ProcessingStatusTLV,
    APSFrameCounterResponseTLV,
    BeaconSurveyConfigurationTLV,
    ManufacturerSpecificGlobalTLV,
    SupportedKeyNegotiationMethodsGlobalTLV,
    PanIdConflictReportGlobalTLV,
    SymmetricPassphraseGlobalTLV,
    RouterInformationGlobalTLV,
    JoinerEncapsulationGlobalTLV,
    DeviceCapabilityExtensionGlobalTLV,
    TLV,
    LocalTLVReader,
    ServerMask,
} from './definition/tstypes';
import {
    LeaveRequestFlags,
    GlobalTLV,
} from './definition/enums';
import {
    ZDO_MESSAGE_OVERHEAD,
    UNICAST_BINDING,
    MULTICAST_BINDING,
    CHALLENGE_VALUE_SIZE,
    CURVE_PUBLIC_POINT_SIZE,
} from './definition/consts';
import {logger} from '../../utils/logger';
import {DEFAULT_ENCRYPTION_KEY_SIZE, EUI64_SIZE, EXTENDED_PAN_ID_SIZE, PAN_ID_SIZE} from '../consts';
import * as Utils from './utils';
import * as ZSpecUtils from '../utils';
import {ClusterId as ZdoClusterId} from './definition/clusters';
import {ClusterId, EUI64, NodeId, ProfileId} from '../tstypes';

const NS = 'zh:zdo:buffalo';

const MAX_BUFFER_SIZE = 255;

export class BuffaloZdo extends Buffalo {

    /**
     * Set the position of the internal position tracker.
     * TODO: move to base `Buffalo` class
     * @param position
     */
    public setPosition(position: number): void {
        this.position = position;
    }

    /**
     * Set the byte at given position without affecting the internal position tracker.
     * TODO: move to base `Buffalo` class
     * @param position 
     * @param value 
     */
    public setByte(position: number, value: number): void {
        this.buffer.writeUInt8(value, position);
    }

    /**
     * Get the byte at given position without affecting the internal position tracker.
     * TODO: move to base `Buffalo` class
     * @param position 
     * @returns 
     */
    public getByte(position: number): number {
        return this.buffer.readUInt8(position);
    }

    /**
     * Check if internal buffer has enough bytes to satisfy: (current position + given count).
     * TODO: move to base `Buffalo` class
     * @param count 
     * @returns True if has given more bytes
     */
    public isMoreBy(count: number): boolean {
        return (this.position + count) <= this.buffer.length;
    }

    //-- GLOBAL TLVS

    private writeManufacturerSpecificGlobalTLV(tlv: ManufacturerSpecificGlobalTLV): void {
        this.writeUInt16(tlv.zigbeeManufacturerId);
        this.writeBuffer(tlv.additionalData, tlv.additionalData.length);
    }

    private readManufacturerSpecificGlobalTLV(length: number): ManufacturerSpecificGlobalTLV {
        logger.debug(`readManufacturerSpecificGlobalTLV with length=${length}`, NS);
        if (length < 2) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected at least 2.`);
        }

        const zigbeeManufacturerId = this.readUInt16();
        const additionalData = this.readBuffer(length - 2);

        return {
            zigbeeManufacturerId,
            additionalData,
        };
    }

    private writeSupportedKeyNegotiationMethodsGlobalTLV(tlv: SupportedKeyNegotiationMethodsGlobalTLV): void {
        this.writeUInt8(tlv.keyNegotiationProtocolsBitmask);
        this.writeUInt8(tlv.preSharedSecretsBitmask);

        if (tlv.sourceDeviceEui64) {
            this.writeIeeeAddr(tlv.sourceDeviceEui64);
        }
    }

    private readSupportedKeyNegotiationMethodsGlobalTLV(length: number): SupportedKeyNegotiationMethodsGlobalTLV {
        logger.debug(`readSupportedKeyNegotiationMethodsGlobalTLV with length=${length}`, NS);
        if (length < 2) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected at least 2.`);
        }

        const keyNegotiationProtocolsBitmask = this.readUInt8();
        const preSharedSecretsBitmask = this.readUInt8();
        let sourceDeviceEui64: EUI64;

        if (length >= (2 + EUI64_SIZE)) {
            sourceDeviceEui64 = this.readIeeeAddr();
        }

        return {
            keyNegotiationProtocolsBitmask,
            preSharedSecretsBitmask,
            sourceDeviceEui64,
        };
    }

    private writePanIdConflictReportGlobalTLV(tlv: PanIdConflictReportGlobalTLV): void {
        this.writeUInt16(tlv.nwkPanIdConflictCount);
    }

    private readPanIdConflictReportGlobalTLV(length: number): PanIdConflictReportGlobalTLV {
        logger.debug(`readPanIdConflictReportGlobalTLV with length=${length}`, NS);
        if (length < 2) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected at least 2.`);
        }

        const nwkPanIdConflictCount = this.readUInt16();

        return {
            nwkPanIdConflictCount,
        };
    }

    private writeNextPanIdChangeGlobalTLV(tlv: NextPanIdChangeGlobalTLV): void {
        this.writeUInt16(tlv.panId);
    }

    private readNextPanIdChangeGlobalTLV(length: number): NextPanIdChangeGlobalTLV {
        logger.debug(`readNextPanIdChangeGlobalTLV with length=${length}`, NS);
        if (length < PAN_ID_SIZE) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected at least ${PAN_ID_SIZE}.`);
        }

        const panId = this.readUInt16();

        return {
            panId,
        };
    }

    private writeNextChannelChangeGlobalTLV(tlv: NextChannelChangeGlobalTLV): void {
        this.writeUInt32(tlv.channel);
    }

    private readNextChannelChangeGlobalTLV(length: number): NextChannelChangeGlobalTLV {
        logger.debug(`readNextChannelChangeGlobalTLV with length=${length}`, NS);
        if (length < 4) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected at least 4.`);
        }

        const channel = this.readUInt32();

        return {
            channel,
        };
    }

    private writeSymmetricPassphraseGlobalTLV(tlv: SymmetricPassphraseGlobalTLV): void {
        this.writeBuffer(tlv.passphrase, DEFAULT_ENCRYPTION_KEY_SIZE);
    }

    private readSymmetricPassphraseGlobalTLV(length: number): SymmetricPassphraseGlobalTLV {
        logger.debug(`readSymmetricPassphraseGlobalTLV with length=${length}`, NS);
        if (length < DEFAULT_ENCRYPTION_KEY_SIZE) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected at least ${DEFAULT_ENCRYPTION_KEY_SIZE}.`);
        }

        const passphrase = this.readBuffer(DEFAULT_ENCRYPTION_KEY_SIZE);

        return {
            passphrase,
        };
    }

    private writeRouterInformationGlobalTLV(tlv: RouterInformationGlobalTLV): void {
        this.writeUInt16(tlv.bitmask);
    }

    private readRouterInformationGlobalTLV(length: number): RouterInformationGlobalTLV {
        logger.debug(`readRouterInformationGlobalTLV with length=${length}`, NS);
        if (length < 2) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected at least 2.`);
        }

        const bitmask = this.readUInt16();

        return {
            bitmask,
        };
    }

    private writeFragmentationParametersGlobalTLV(tlv: FragmentationParametersGlobalTLV): void {
        this.writeUInt16(tlv.nwkAddress);

        if (tlv.fragmentationOptions != undefined) {
            this.writeUInt8(tlv.fragmentationOptions);
        }

        if (tlv.maxIncomingTransferUnit != undefined) {
            this.writeUInt16(tlv.maxIncomingTransferUnit);
        }
    }

    private readFragmentationParametersGlobalTLV(length: number): FragmentationParametersGlobalTLV {
        logger.debug(`readFragmentationParametersGlobalTLV with length=${length}`, NS);
        if (length < 2) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected at least 2.`);
        }

        const nwkAddress = this.readUInt16();
        let fragmentationOptions: number;
        let maxIncomingTransferUnit: number;

        if (length >= 3) {
            fragmentationOptions = this.readUInt8();
        }

        if (length >= 5) {
            maxIncomingTransferUnit = this.readUInt16();
        }

        return {
            nwkAddress,
            fragmentationOptions,
            maxIncomingTransferUnit,
        };
    }

    private writeJoinerEncapsulationGlobalTLV(encapsulationTLV: JoinerEncapsulationGlobalTLV): void {
        this.writeGlobalTLVs(encapsulationTLV.additionalTLVs);
    }

    private readJoinerEncapsulationGlobalTLV(length: number): JoinerEncapsulationGlobalTLV {
        logger.debug(`readJoinerEncapsulationGlobalTLV with length=${length}`, NS);
        // at least the length of tagId+length for first encapsulated tlv, doesn't make sense otherwise
        if (length < 2) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected at least 2.`);
        }

        const encapsulationBuffalo = new BuffaloZdo(this.readBuffer(length));
        const additionalTLVs = encapsulationBuffalo.readTLVs(null, true);

        return {
            additionalTLVs,
        };
    }

    private writeBeaconAppendixEncapsulationGlobalTLV(encapsulationTLV: BeaconAppendixEncapsulationGlobalTLV): void {
        this.writeGlobalTLVs(encapsulationTLV.additionalTLVs);
    }

    private readBeaconAppendixEncapsulationGlobalTLV(length: number): BeaconAppendixEncapsulationGlobalTLV {
        logger.debug(`readBeaconAppendixEncapsulationGlobalTLV with length=${length}`, NS);
        // at least the length of tagId+length for first encapsulated tlv, doesn't make sense otherwise
        if (length < 2) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected at least 2.`);
        }

        const encapsulationBuffalo = new BuffaloZdo(this.readBuffer(length));
        // Global: SupportedKeyNegotiationMethodsGlobalTLV
        // Global: FragmentationParametersGlobalTLV
        const additionalTLVs = encapsulationBuffalo.readTLVs(null, true);

        return {
            additionalTLVs,
        };
    }

    private writeConfigurationParametersGlobalTLV(configurationParameters: ConfigurationParametersGlobalTLV): void {
        this.writeUInt16(configurationParameters.configurationParameters);
    }

    private readConfigurationParametersGlobalTLV(length: number): ConfigurationParametersGlobalTLV {
        logger.debug(`readConfigurationParametersGlobalTLV with length=${length}`, NS);
        if (length < 2) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected at least 2.`);
        }

        const configurationParameters = this.readUInt16();

        return {
            configurationParameters,
        };
    }

    private writeDeviceCapabilityExtensionGlobalTLV(tlv: DeviceCapabilityExtensionGlobalTLV): void {
        this.writeBuffer(tlv.data, tlv.data.length);
    }

    private readDeviceCapabilityExtensionGlobalTLV(length: number): DeviceCapabilityExtensionGlobalTLV {
        logger.debug(`readDeviceCapabilityExtensionGlobalTLV with length=${length}`, NS);
        const data = this.readBuffer(length);

        return {
            data,
        };
    }

    public writeGlobalTLV(tlv: TLV): void {
        this.writeUInt8(tlv.tagId);
        this.writeUInt8(tlv.length - 1);// remove offset (spec quirk...)

        switch (tlv.tagId) {
        case GlobalTLV.MANUFACTURER_SPECIFIC: {
            this.writeManufacturerSpecificGlobalTLV(tlv.tlv as ManufacturerSpecificGlobalTLV);
            break;
        }
        case GlobalTLV.SUPPORTED_KEY_NEGOTIATION_METHODS: {
            this.writeSupportedKeyNegotiationMethodsGlobalTLV(tlv.tlv as SupportedKeyNegotiationMethodsGlobalTLV);
            break;
        }
        case GlobalTLV.PAN_ID_CONFLICT_REPORT: {
            this.writePanIdConflictReportGlobalTLV(tlv.tlv as PanIdConflictReportGlobalTLV);
            break;
        }
        case GlobalTLV.NEXT_PAN_ID_CHANGE: {
            this.writeNextPanIdChangeGlobalTLV(tlv.tlv as NextPanIdChangeGlobalTLV);
            break;
        }
        case GlobalTLV.NEXT_CHANNEL_CHANGE: {
            this.writeNextChannelChangeGlobalTLV(tlv.tlv as NextChannelChangeGlobalTLV);
            break;
        }
        case GlobalTLV.SYMMETRIC_PASSPHRASE: {
            this.writeSymmetricPassphraseGlobalTLV(tlv.tlv as SymmetricPassphraseGlobalTLV);
            break;
        }
        case GlobalTLV.ROUTER_INFORMATION: {
            this.writeRouterInformationGlobalTLV(tlv.tlv as RouterInformationGlobalTLV);
            break;
        }
        case GlobalTLV.FRAGMENTATION_PARAMETERS: {
            this.writeFragmentationParametersGlobalTLV(tlv.tlv as FragmentationParametersGlobalTLV);
            break;
        }
        case GlobalTLV.JOINER_ENCAPSULATION: {
            this.writeJoinerEncapsulationGlobalTLV(tlv.tlv as JoinerEncapsulationGlobalTLV);
            break;
        }
        case GlobalTLV.BEACON_APPENDIX_ENCAPSULATION: {
            this.writeBeaconAppendixEncapsulationGlobalTLV(tlv.tlv as BeaconAppendixEncapsulationGlobalTLV);
            break;
        }
        case GlobalTLV.CONFIGURATION_PARAMETERS: {
            this.writeConfigurationParametersGlobalTLV(tlv.tlv as ConfigurationParametersGlobalTLV);
            break;
        }
        case GlobalTLV.DEVICE_CAPABILITY_EXTENSION: {
            this.writeDeviceCapabilityExtensionGlobalTLV(tlv.tlv as DeviceCapabilityExtensionGlobalTLV);
            break;
        }
        default: {
            throw new ZdoStatusError(Status.NOT_SUPPORTED);
        }
        }
    }

    public readGlobalTLV(tagId: number, length: number): TLV['tlv'] {
        switch (tagId) {
        case GlobalTLV.MANUFACTURER_SPECIFIC: {
            return this.readManufacturerSpecificGlobalTLV(length);
        }
        case GlobalTLV.SUPPORTED_KEY_NEGOTIATION_METHODS: {
            return this.readSupportedKeyNegotiationMethodsGlobalTLV(length);
        }
        case GlobalTLV.PAN_ID_CONFLICT_REPORT: {
            return this.readPanIdConflictReportGlobalTLV(length);
        }
        case GlobalTLV.NEXT_PAN_ID_CHANGE: {
            return this.readNextPanIdChangeGlobalTLV(length);
        }
        case GlobalTLV.NEXT_CHANNEL_CHANGE: {
            return this.readNextChannelChangeGlobalTLV(length);
        }
        case GlobalTLV.SYMMETRIC_PASSPHRASE: {
            return this.readSymmetricPassphraseGlobalTLV(length);
        }
        case GlobalTLV.ROUTER_INFORMATION: {
            return this.readRouterInformationGlobalTLV(length);
        }
        case GlobalTLV.FRAGMENTATION_PARAMETERS: {
            return this.readFragmentationParametersGlobalTLV(length);
        }
        case GlobalTLV.JOINER_ENCAPSULATION: {
            return this.readJoinerEncapsulationGlobalTLV(length);
        }
        case GlobalTLV.BEACON_APPENDIX_ENCAPSULATION: {
            return this.readBeaconAppendixEncapsulationGlobalTLV(length);
        }
        case GlobalTLV.CONFIGURATION_PARAMETERS: {
            return this.readConfigurationParametersGlobalTLV(length);
        }
        case GlobalTLV.DEVICE_CAPABILITY_EXTENSION: {
            return this.readDeviceCapabilityExtensionGlobalTLV(length);
        }
        default: {
            // validation: unknown tag shall be ignored
            return null;
        }
        }
    }

    public writeGlobalTLVs(tlvs: TLV[]): void {
        for (const tlv of tlvs) {
            this.writeGlobalTLV(tlv);
        }
    }

    //-- LOCAL TLVS

    // write only
    // private readBeaconSurveyConfigurationTLV(length: number): BeaconSurveyConfigurationTLV {
    //     logger.debug(`readBeaconSurveyConfigurationTLV with length=${length}`, NS);
    //     const count = this.readUInt8();

    //     /* istanbul ignore else */
    //     if (length !== (1 + (count * 4) + 1)) {
    //         throw new Error(`Malformed TLV. Invalid length '${length}', expected ${(1 + (count * 4) + 1)}.`);
    //     }

    //     const scanChannelList = this.readListUInt32(count);
    //     const configurationBitmask = this.readUInt8();

    //     return {
    //         scanChannelList,
    //         configurationBitmask,
    //     };
    // }

    private readCurve25519PublicPointTLV(length: number): Curve25519PublicPointTLV {
        logger.debug(`readCurve25519PublicPointTLV with length=${length}`, NS);
        if (length !== (EUI64_SIZE + CURVE_PUBLIC_POINT_SIZE)) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected ${(EUI64_SIZE + CURVE_PUBLIC_POINT_SIZE)}.`);
        }

        const eui64 = this.readIeeeAddr();
        const publicPoint = this.readBuffer(CURVE_PUBLIC_POINT_SIZE);

        return {
            eui64,
            publicPoint,
        };
    }

    // write only
    // private readTargetIEEEAddressTLV(length: number): TargetIEEEAddressTLV {
    //     logger.debug(`readTargetIEEEAddressTLV with length=${length}`, NS);
    //     /* istanbul ignore else */
    //     if (length !== EUI64_SIZE) {
    //         throw new Error(`Malformed TLV. Invalid length '${length}', expected ${EUI64_SIZE}.`);
    //     }

    //     const ieee = this.readIeeeAddr();

    //     return {
    //         ieee,
    //     };
    // }

    // write only
    // private readSelectedKeyNegotiationMethodTLV(length: number): SelectedKeyNegotiationMethodTLV {
    //     logger.debug(`readSelectedKeyNegotiationMethodTLV with length=${length}`, NS);
    //     /* istanbul ignore else */
    //     if (length !== 10) {
    //         throw new Error(`Malformed TLV. Invalid length '${length}', expected 10.`);
    //     }

    //     const protocol = this.readUInt8();
    //     const presharedSecret = this.readUInt8();
    //     const sendingDeviceEui64 = this.readIeeeAddr();

    //     return {
    //         protocol,
    //         presharedSecret,
    //         sendingDeviceEui64,
    //     };
    // }

    // write only
    // private readDeviceEUI64ListTLV(length: number): DeviceEUI64ListTLV {
    //     logger.debug(`readDeviceEUI64ListTLV with length=${length}`, NS);
    //     const count = this.readUInt8();

    //     /* istanbul ignore else */
    //     if (length !== (1 + (count * EUI64_SIZE))) {
    //         throw new Error(`Malformed TLV. Invalid length '${length}', expected ${(1 + (count * EUI64_SIZE))}.`);
    //     }

    //     const eui64List: DeviceEUI64ListTLV['eui64List'] = [];

    //     for (let i = 0; i < count; i++) {
    //         const eui64 = this.readIeeeAddr();

    //         eui64List.push(eui64);
    //     }

    //     return {
    //         eui64List,
    //     };
    // }

    private readAPSFrameCounterResponseTLV(length: number): APSFrameCounterResponseTLV {
        logger.debug(`readAPSFrameCounterResponseTLV with length=${length}`, NS);
        if (length !== 32) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected 32.`);
        }

        const responderEui64 = this.readIeeeAddr();
        const receivedChallengeValue = this.readBuffer(CHALLENGE_VALUE_SIZE);
        const apsFrameCounter = this.readUInt32();
        const challengeSecurityFrameCounter = this.readUInt32();
        const mic = this.readBuffer(8);

        return {
            responderEui64,
            receivedChallengeValue,
            apsFrameCounter,
            challengeSecurityFrameCounter,
            mic,
        };
    }

    private readBeaconSurveyResultsTLV(length: number): BeaconSurveyResultsTLV {
        logger.debug(`readBeaconSurveyResultsTLV with length=${length}`, NS);
        if (length !== 4) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected 4.`);
        }

        const totalBeaconsReceived = this.readUInt8();
        const onNetworkBeacons = this.readUInt8();
        const potentialParentBeacons = this.readUInt8();
        const otherNetworkBeacons = this.readUInt8();

        return {
            totalBeaconsReceived,
            onNetworkBeacons,
            potentialParentBeacons,
            otherNetworkBeacons,
        };
    }

    private readPotentialParentsTLV(length: number): PotentialParentsTLV {
        logger.debug(`readPotentialParentsTLV with length=${length}`, NS);
        if (length < 4) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected at least 4.`);
        }

        const currentParentNwkAddress = this.readUInt16();
        const currentParentLQA = this.readUInt8();
        // [0x00 - 0x05]
        const entryCount = this.readUInt8();

        if (length !== (4 + (entryCount * 3))) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected ${(4 + (entryCount * 3))}.`);
        }

        const potentialParents: PotentialParentsTLV['potentialParents'] = [];

        for (let i = 0; i < entryCount; i++) {
            const nwkAddress = this.readUInt16();
            const lqa = this.readUInt8();

            potentialParents.push({
                nwkAddress,
                lqa,
            });
        }

        return {
            currentParentNwkAddress,
            currentParentLQA,
            entryCount,
            potentialParents,
        };
    }

    private readDeviceAuthenticationLevelTLV(length: number): DeviceAuthenticationLevelTLV {
        logger.debug(`readDeviceAuthenticationLevelTLV with length=${length}`, NS);
        if (length !== 10) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected 10.`);
        }

        const remoteNodeIeee = this.readIeeeAddr();
        const initialJoinMethod = this.readUInt8();
        const activeLinkKeyType = this.readUInt8();

        return {
            remoteNodeIeee,
            initialJoinMethod,
            activeLinkKeyType,
        };
    }

    private readProcessingStatusTLV(length: number): ProcessingStatusTLV {
        logger.debug(`readProcessingStatusTLV with length=${length}`, NS);
        const count = this.readUInt8();

        if (length !== (1 + (count * 2))) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected ${(1 + (count * 2))}.`);
        }

        const tlvs: ProcessingStatusTLV['tlvs'] = [];

        for (let i = 0; i < count; i++) {
            const tagId = this.readUInt8();
            const processingStatus = this.readUInt8();

            tlvs.push({
                tagId,
                processingStatus,
            });
        }

        return {
            count,
            tlvs,
        };
    }

    /**
     * ANNEX I ZIGBEE TLV DEFINITIONS AND FORMAT
     * 
     * Unknown tags => TLV ignored
     * Duplicate tags => reject message except for MANUFACTURER_SPECIFIC_GLOBAL_TLV
     * Malformed TLVs => reject message
     * 
     * @param localTLVReaders Mapping of tagID to local TLV reader function
     * @param encapsulated Default false. If true, this is reading inside an encapsuled TLV (excludes further encapsulation)
     * @returns 
     */
    public readTLVs(localTLVReaders: Map<number, LocalTLVReader> = null, encapsulated: boolean = false): TLV[] {
        const tlvs: TLV[] = [];

        while (this.isMore()) {
            const tagId = this.readUInt8();

            // validation: cannot have duplicate tagId, except MANUFACTURER_SPECIFIC_GLOBAL_TLV
            if ((tagId !== GlobalTLV.MANUFACTURER_SPECIFIC) && (tlvs.findIndex((tlv) => tlv.tagId === tagId) !== -1)) {
                throw new Error(`Duplicate tag. Cannot have more than one of tagId=${tagId}.`);
            }

            // validation: encapsulation TLV cannot contain another encapsulation TLV, outer considered malformed, reject message
            if (encapsulated && ((tagId === GlobalTLV.BEACON_APPENDIX_ENCAPSULATION) || (tagId === GlobalTLV.JOINER_ENCAPSULATION))) {
                throw new Error(`Invalid nested encapsulation for tagId=${tagId}.`);
            }

            const length = this.readUInt8() + 1;// add offset (spec quirk...)

            console.log(this.position, length);
            // validation: invalid if not at least ${length} bytes to read
            if (!this.isMoreBy(length)) {
                throw new Error(`Malformed TLV. Invalid data length for tagId=${tagId}, expected ${length}.`);
            }

            const nextTLVStart = this.getPosition() + length;
            // null == unknown tag
            let tlv: TLV['tlv'] = null;

            if (tagId < GlobalTLV.MANUFACTURER_SPECIFIC) {
                /* istanbul ignore else */
                if (localTLVReaders) {
                    const localTLVReader = localTLVReaders.get(tagId);

                    /* istanbul ignore else */
                    if (localTLVReader) {
                        tlv = localTLVReader.call(this, length);
                    } else {
                        logger.debug(`Local TLV found tagId=${tagId} but no reader given for it. Ignoring it.`, NS);
                    }
                } else {
                    logger.debug(`Local TLV found tagId=${tagId} but no reader available. Ignoring it.`, NS);
                }
            } else {
                tlv = this.readGlobalTLV(tagId, length);
            }

            // validation: unknown tag shall be ignored
            /* istanbul ignore else */
            if (tlv != null) {
                tlvs.push({
                    tagId,
                    length,
                    tlv,
                });
            } else {
                logger.debug(`Unknown TLV tagId=${tagId}. Ignoring it.`, NS);
            }

            // ensure we're at the right position as dictated by the tlv length field, and not the tlv reader (should be the same if proper)
            this.setPosition(nextTLVStart);
        }

        return tlvs;
    }

    //-- REQUESTS

    /**
     * @see ClusterId.NETWORK_ADDRESS_REQUEST
     * @param target IEEE address for the request
     * @param reportKids True to request that the target list their children in the response. [request type = 0x01]
     * @param childStartIndex The index of the first child to list in the response. Ignored if reportKids is false.
     */
    public static buildNetworkAddressRequest(target: EUI64, reportKids: boolean, childStartIndex: number): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        buffalo.writeIeeeAddr(target);
        buffalo.writeUInt8(reportKids ? 1 : 0);
        buffalo.writeUInt8(childStartIndex);

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.IEEE_ADDRESS_REQUEST
     * Can be sent to target, or to another node that will send to target.
     * @param target NWK address for the request
     * @param reportKids True to request that the target list their children in the response. [request type = 0x01]
     * @param childStartIndex The index of the first child to list in the response. Ignored if reportKids is false.
     */
    public static buildIeeeAddressRequest(target: NodeId, reportKids: boolean, childStartIndex: number): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        buffalo.writeUInt16(target);
        buffalo.writeUInt8(reportKids ? 1 : 0);
        buffalo.writeUInt8(childStartIndex);

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.NODE_DESCRIPTOR_REQUEST
     * @param target NWK address for the request
     */
    public static buildNodeDescriptorRequest(target: NodeId, fragmentationParameters?: FragmentationParametersGlobalTLV): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        buffalo.writeUInt16(target);

        if (fragmentationParameters) {
            let length = 2;
            
            /* istanbul ignore else */
            if (fragmentationParameters.fragmentationOptions) {
                length += 1;
            }

            /* istanbul ignore else */
            if (fragmentationParameters.maxIncomingTransferUnit) {
                length += 2;
            }

            buffalo.writeGlobalTLV({tagId: GlobalTLV.FRAGMENTATION_PARAMETERS, length, tlv: fragmentationParameters});
        }

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.POWER_DESCRIPTOR_REQUEST
     * @param target NWK address for the request
     */
    public static buildPowerDescriptorRequest(target: NodeId): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        buffalo.writeUInt16(target);

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.SIMPLE_DESCRIPTOR_REQUEST
     * @param target NWK address for the request
     * @param targetEndpoint The endpoint on the destination
     */
    public static buildSimpleDescriptorRequest(target: NodeId, targetEndpoint: number): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        buffalo.writeUInt16(target);
        buffalo.writeUInt8(targetEndpoint);

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.ACTIVE_ENDPOINTS_REQUEST
     * @param target NWK address for the request
     */
    public static buildActiveEndpointsRequest(target: NodeId): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        buffalo.writeUInt16(target);

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.MATCH_DESCRIPTORS_REQUEST
     * @param target NWK address for the request
     * @param profileId Profile ID to be matched at the destination
     * @param inClusterList List of Input ClusterIDs to be used for matching
     * @param outClusterList List of Output ClusterIDs to be used for matching
     */
    public static buildMatchDescriptorRequest(target: NodeId, profileId: ProfileId, inClusterList: ClusterId[], outClusterList: ClusterId[],)
        : Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        buffalo.writeUInt16(target);
        buffalo.writeUInt16(profileId);
        buffalo.writeUInt8(inClusterList.length);
        buffalo.writeListUInt16(inClusterList);
        buffalo.writeUInt8(outClusterList.length);
        buffalo.writeListUInt16(outClusterList);

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.SYSTEM_SERVER_DISCOVERY_REQUEST
     * @param serverMask See Table 2-34 for bit assignments.
     */
    public static buildSystemServiceDiscoveryRequest(serverMask: ServerMask): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        buffalo.writeUInt16(Utils.createServerMask(serverMask));

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.PARENT_ANNOUNCE
     * @param children The IEEE addresses of the children bound to the parent.
     */
    public static buildParentAnnounce(children: EUI64[]): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        buffalo.writeUInt8(children.length);

        for (const child of children) {
            buffalo.writeIeeeAddr(child);
        }

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.BIND_REQUEST
     * 
     * @param source The IEEE address for the source.
     * @param sourceEndpoint The source endpoint for the binding entry.
     * @param clusterId The identifier of the cluster on the source device that is bound to the destination.
     * @param type The addressing mode for the destination address used in this command, either ::UNICAST_BINDING, ::MULTICAST_BINDING.
     * @param destination The destination address for the binding entry. IEEE for ::UNICAST_BINDING.
     * @param groupAddress The destination address for the binding entry. Group ID for ::MULTICAST_BINDING.
     * @param destinationEndpoint The destination endpoint for the binding entry. Only if ::UNICAST_BINDING.
     */
    public static buildBindRequest(source: EUI64, sourceEndpoint: number, clusterId: ClusterId, type: number, destination: EUI64,
        groupAddress: number, destinationEndpoint: number): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);
    
        buffalo.writeIeeeAddr(source);
        buffalo.writeUInt8(sourceEndpoint);
        buffalo.writeUInt16(clusterId);
        buffalo.writeUInt8(type);

        switch (type) {
        case UNICAST_BINDING: {
            buffalo.writeIeeeAddr(destination);
            buffalo.writeUInt8(destinationEndpoint);
            break;
        }
        case MULTICAST_BINDING: {
            buffalo.writeUInt16(groupAddress);
            break;
        }
        default:
            throw new ZdoStatusError(Status.NOT_SUPPORTED);
        }

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.UNBIND_REQUEST
     * 
     * @param source The IEEE address for the source.
     * @param sourceEndpoint The source endpoint for the binding entry.
     * @param clusterId The identifier of the cluster on the source device that is bound to the destination.
     * @param type The addressing mode for the destination address used in this command, either ::UNICAST_BINDING, ::MULTICAST_BINDING.
     * @param destination The destination address for the binding entry. IEEE for ::UNICAST_BINDING.
     * @param groupAddress The destination address for the binding entry. Group ID for ::MULTICAST_BINDING.
     * @param destinationEndpoint The destination endpoint for the binding entry. Only if ::UNICAST_BINDING.
     */
    public static buildUnbindRequest(source: EUI64, sourceEndpoint: number, clusterId: ClusterId, type: ClusterId, destination: EUI64,
        groupAddress: number, destinationEndpoint: number): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);
    
        buffalo.writeIeeeAddr(source);
        buffalo.writeUInt8(sourceEndpoint);
        buffalo.writeUInt16(clusterId);
        buffalo.writeUInt8(type);

        switch (type) {
        case UNICAST_BINDING: {
            buffalo.writeIeeeAddr(destination);
            buffalo.writeUInt8(destinationEndpoint);
            break;
        }
        case MULTICAST_BINDING: {
            buffalo.writeUInt16(groupAddress);
            break;
        }
        default:
            throw new ZdoStatusError(Status.NOT_SUPPORTED);
        }

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.CLEAR_ALL_BINDINGS_REQUEST
     */
    public static buildClearAllBindingsRequest(tlv: ClearAllBindingsReqEUI64TLV): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        // ClearAllBindingsReqEUI64TLV: Local: ID: 0x00
        buffalo.writeUInt8(0x00);
        buffalo.writeUInt8(tlv.eui64List.length * EUI64_SIZE + 1 - 1);
        buffalo.writeUInt8(tlv.eui64List.length);

        for (const entry of tlv.eui64List) {
            buffalo.writeIeeeAddr(entry);
        }

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.LQI_TABLE_REQUEST
     * @param startIndex Starting Index for the requested elements of the Neighbor Table.
     */
    public static buildLqiTableRequest(startIndex: number): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        buffalo.writeUInt8(startIndex);

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.ROUTING_TABLE_REQUEST
     * @param startIndex Starting Index for the requested elements of the Neighbor Table.
     */
    public static buildRoutingTableRequest(startIndex: number): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        buffalo.writeUInt8(startIndex);

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.BINDING_TABLE_REQUEST
     * @param startIndex Starting Index for the requested elements of the Neighbor Table.
     */
    public static buildBindingTableRequest(startIndex: number): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        buffalo.writeUInt8(startIndex);

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.LEAVE_REQUEST
     * @param deviceAddress All zeros if the target is to remove itself from the network or
     *   the EUI64 of a child of the target device to remove that child.
     * @param leaveRequestFlags A bitmask of leave options. Include ::AND_REJOIN if the target is to rejoin the network immediately after leaving.
     */
    public static buildLeaveRequest(deviceAddress: EUI64, leaveRequestFlags: LeaveRequestFlags): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        buffalo.writeIeeeAddr(deviceAddress);
        buffalo.writeUInt8(leaveRequestFlags);

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.PERMIT_JOINING_REQUEST
     * @param duration A value of 0x00 disables joining. A value of 0xFF enables joining. Any other value enables joining for that number of seconds.
     * @param authentication Controls Trust Center authentication behavior.
     *   This field SHALL always have a value of 1, indicating a request to change the Trust Center policy.
     *   If a frame is received with a value of 0, it shall be treated as having a value of 1.
     */
    public static buildPermitJoining(duration: number, authentication: number, tlvs: TLV[]): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        buffalo.writeUInt8(duration);
        buffalo.writeUInt8(authentication);
        // BeaconAppendixEncapsulationGlobalTLV
        //   - SupportedKeyNegotiationMethodsGlobalTLV
        //   - FragmentationParametersGlobalTLV
        buffalo.writeGlobalTLVs(tlvs);

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.NWK_UPDATE_REQUEST
     * @param channels See Table 3-7 for details on the 32-bit field structure..
     * @param duration A value used to calculate the length of time to spend scanning each channel.
     *   The time spent scanning each channel is (aBaseSuperframeDuration * (2n + 1)) symbols, where n is the value of the duration parameter.
     *   If has a value of 0xfe this is a request for channel change.
     *   If has a value of 0xff this is a request to change the apsChannelMaskList and nwkManagerAddr attributes.
     * @param count This field represents the number of energy scans to be conducted and reported.
     *   This field SHALL be present only if the duration is within the range of 0x00 to 0x05.
     * @param nwkUpdateId The value of the nwkUpdateId contained in this request.
     *   This value is set by the Network Channel Manager prior to sending the message.
     *   This field SHALL only be present if the duration is 0xfe or 0xff.
     *   If the ScanDuration is 0xff, then the value in the nwkUpdateID SHALL be ignored.
     * @param nwkManagerAddr This field SHALL be present only if the duration is set to 0xff, and, where present,
     *   indicates the NWK address for the device with the Network Manager bit set in its Node Descriptor.
     */
    private static buildNwkUpdateRequest(channels: number[], duration: number, count: number | null, nwkUpdateId: number | null,
        nwkManagerAddr: number | null): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);
    
        buffalo.writeUInt32(ZSpecUtils.channelsToUInt32Mask(channels));
        buffalo.writeUInt8(duration);

        if (count != null && (duration >= 0x00 && duration <= 0x05)) {
            buffalo.writeUInt8(count);
        }

        // TODO: What does "This value is set by the Network Channel Manager prior to sending the message." mean exactly??
        //       (isn't used/mentioned in EmberZNet, confirmed working if not set at all for channel change)
        // for now, allow to bypass with null, otherwise should throw if null and duration passes below conditions (see NwkEnhancedUpdateRequest)
        if (nwkUpdateId != null && (duration === 0xFE || duration === 0xFF)) {
            buffalo.writeUInt8(nwkUpdateId);
        }

        if (nwkManagerAddr != null && duration === 0xFF) {
            buffalo.writeUInt16(nwkManagerAddr);
        }

        return buffalo.getWritten();
    }

    /**
     * Shortcut for @see BuffaloZdo.buildNwkUpdateRequest
     */
    public static buildScanChannelsRequest(scanChannels: number[], duration: number, count: number): Buffer {
        return BuffaloZdo.buildNwkUpdateRequest(scanChannels, duration, count, null, null);
    }

    /**
     * Shortcut for @see BuffaloZdo.buildNwkUpdateRequest
     */
    public static buildChannelChangeRequest(channel: number, nwkUpdateId: number | null): Buffer {
        return BuffaloZdo.buildNwkUpdateRequest([channel], 0xFE, null, nwkUpdateId, null);
    }

    /**
     * Shortcut for @see BuffaloZdo.buildNwkUpdateRequest
     */
    public static buildSetActiveChannelsAndNwkManagerIdRequest(channels: number[], nwkUpdateId: number | null, nwkManagerAddr: NodeId): Buffer {
        return BuffaloZdo.buildNwkUpdateRequest(channels, 0xFF, null, nwkUpdateId, nwkManagerAddr);
    }

    /**
     * @see ClusterId.NWK_ENHANCED_UPDATE_REQUEST
     * @param channelPages The set of channels (32-bit bitmap) for each channel page.
     *   The five most significant bits (b27,..., b31) represent the binary encoded Channel Page.
     *   The 27 least significant bits (b0, b1,... b26) indicate which channels are to be scanned
     *   (1 = scan, 0 = do not scan) for each of the 27 valid channels
     *   If duration is in the range 0x00 to 0x05, SHALL be restricted to a single page.
     * @param duration A value used to calculate the length of time to spend scanning each channel.
     *   The time spent scanning each channel is (aBaseSuperframeDuration * (2n + 1)) symbols, where n is the value of the duration parameter.
     *   If has a value of 0xfe this is a request for channel change.
     *   If has a value of 0xff this is a request to change the apsChannelMaskList and nwkManagerAddr attributes.
     * @param count This field represents the number of energy scans to be conducted and reported.
     *   This field SHALL be present only if the duration is within the range of 0x00 to 0x05.
     * @param nwkUpdateId The value of the nwkUpdateId contained in this request.
     *   This value is set by the Network Channel Manager prior to sending the message.
     *   This field SHALL only be present if the duration is 0xfe or 0xff.
     *   If the ScanDuration is 0xff, then the value in the nwkUpdateID SHALL be ignored.
     * @param nwkManagerAddr This field SHALL be present only if the duration is set to 0xff, and, where present,
     *   indicates the NWK address for the device with the Network Manager bit set in its Node Descriptor.
     * @param configurationBitmask Defined in defined in section 2.4.3.3.12.
     *   The configurationBitmask must be added to the end of the list of parameters.
     *   This octet may or may not be present.
     *   If not present then assumption should be that it is enhanced active scan.
     *   Bit 0: This bit determines whether to do an Active Scan or Enhanced Active Scan.
     *          When the bit is set to 1 it indicates an Enhanced Active Scan.
     *          And in case of Enhanced Active scan EBR shall be sent with EPID filter instead of PJOIN filter.
     *   Bit 1-7: Reserved
     */
    private static buildNwkEnhancedUpdateRequest(channelPages: number[], duration: number, count: number | null,
        nwkUpdateId: number | null, nwkManagerAddr: NodeId | null, configurationBitmask: number | null): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);
    
        buffalo.writeUInt8(channelPages.length);

        for (const channelPage of channelPages) {
            buffalo.writeUInt32(channelPage);
        }

        buffalo.writeUInt8(duration);

        if (count != null && (duration >= 0x00 && duration <= 0x05)) {
            buffalo.writeUInt8(count);
        }

        if (nwkUpdateId != null && (duration === 0xFE || duration === 0xFF)) {
            buffalo.writeUInt8(nwkUpdateId);
        }

        if (nwkManagerAddr != null && duration === 0xFF) {
            buffalo.writeUInt16(nwkManagerAddr);
        }

        /* istanbul ignore else */
        if (configurationBitmask != null) {
            buffalo.writeUInt8(configurationBitmask);
        }

        return buffalo.getWritten();
    }

    /**
     * Shortcut for @see BuffaloZdo.buildNwkEnhancedUpdateRequest
     */
    public static buildEnhancedScanChannelsRequest(channelPages: number[], duration: number, count: number,
        configurationBitmask: number | null): Buffer {
        return BuffaloZdo.buildNwkEnhancedUpdateRequest(channelPages, duration, count, null, null, configurationBitmask);
    }

    /**
     * Shortcut for @see BuffaloZdo.buildNwkEnhancedUpdateRequest
     */
    public static buildEnhancedChannelChangeRequest(channelPage: number, nwkUpdateId: number | null, configurationBitmask: number | null): Buffer {
        return BuffaloZdo.buildNwkEnhancedUpdateRequest([channelPage], 0xFE, null, nwkUpdateId, null, configurationBitmask);
    }

    /**
     * Shortcut for @see BuffaloZdo.buildNwkEnhancedUpdateRequest
     */
    public static buildEnhancedSetActiveChannelsAndNwkManagerIdRequest(channelPages: number[], nwkUpdateId: number | null,
        nwkManagerAddr: NodeId, configurationBitmask: number | null): Buffer {
        return BuffaloZdo.buildNwkEnhancedUpdateRequest(channelPages, 0xFF, null, nwkUpdateId, nwkManagerAddr, configurationBitmask);
    }

    /**
     * @see ClusterId.NWK_IEEE_JOINING_LIST_REQUEST
     * @param startIndex The starting index into the receiving device’s nwkIeeeJoiningList that SHALL be sent back.
     */
    public static buildNwkIEEEJoiningListRequest(startIndex: number): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        buffalo.writeUInt8(startIndex);

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.NWK_BEACON_SURVEY_REQUEST
     */
    public static buildNwkBeaconSurveyRequest(tlv: BeaconSurveyConfigurationTLV): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        // BeaconSurveyConfigurationTLV: Local: ID: 0x00
        buffalo.writeUInt8(0x00);
        buffalo.writeUInt8(2 + (tlv.scanChannelList.length * 4) - 1);
        buffalo.writeUInt8(tlv.scanChannelList.length);
        buffalo.writeListUInt32(tlv.scanChannelList);
        buffalo.writeUInt8(tlv.configurationBitmask);

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.START_KEY_NEGOTIATION_REQUEST
     */
    public static buildStartKeyNegotiationRequest(tlv: Curve25519PublicPointTLV): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        // Curve25519PublicPointTLV: Local: ID: 0x00
        buffalo.writeUInt8(0x00);
        buffalo.writeUInt8(EUI64_SIZE + CURVE_PUBLIC_POINT_SIZE - 1);
        buffalo.writeIeeeAddr(tlv.eui64);
        buffalo.writeBuffer(tlv.publicPoint, CURVE_PUBLIC_POINT_SIZE);

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.RETRIEVE_AUTHENTICATION_TOKEN_REQUEST
     */
    public static buildRetrieveAuthenticationTokenRequest(tlv: AuthenticationTokenIdTLV): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        // AuthenticationTokenIdTLV: Local: ID: 0x00
        buffalo.writeUInt8(0x00);
        buffalo.writeUInt8(1 - 1);
        buffalo.writeUInt8(tlv.tlvTypeTagId);

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.GET_AUTHENTICATION_LEVEL_REQUEST
     */
    public static buildGetAuthenticationLevelRequest(tlv: TargetIEEEAddressTLV): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        // TargetIEEEAddressTLV: Local: ID: 0x00
        buffalo.writeUInt8(0x00);
        buffalo.writeUInt8(EUI64_SIZE - 1);
        buffalo.writeIeeeAddr(tlv.ieee);

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.SET_CONFIGURATION_REQUEST
     */
    public static buildSetConfigurationRequest(nextPanIdChange: NextPanIdChangeGlobalTLV, nextChannelChange: NextChannelChangeGlobalTLV,
        configurationParameters: ConfigurationParametersGlobalTLV): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);
    
        buffalo.writeGlobalTLV({tagId: GlobalTLV.NEXT_PAN_ID_CHANGE, length: PAN_ID_SIZE, tlv: nextPanIdChange});
        buffalo.writeGlobalTLV({tagId: GlobalTLV.NEXT_CHANNEL_CHANGE, length: 4, tlv: nextChannelChange});
        buffalo.writeGlobalTLV({tagId: GlobalTLV.CONFIGURATION_PARAMETERS, length: 2, tlv: configurationParameters});

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.GET_CONFIGURATION_REQUEST
     * @param tlvIds The IDs of each TLV that are being requested.
     *   Maximum number dependent on the underlying maximum size of the message as allowed by fragmentation.
     */
    public static buildGetConfigurationRequest(tlvIds: number[]): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        buffalo.writeUInt8(tlvIds.length);

        for (const tlvId of tlvIds) {
            buffalo.writeUInt8(tlvId);
        }

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.START_KEY_UPDATE_REQUEST
     */
    public static buildStartKeyUpdateRequest(selectedKeyNegotiationMethod: SelectedKeyNegotiationMethodTLV,
        fragmentationParameters: FragmentationParametersGlobalTLV): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);
    
        // SelectedKeyNegotiationMethodTLV: Local: ID: 0x00
        buffalo.writeUInt8(0x00);
        buffalo.writeUInt8(EUI64_SIZE + 2 - 1);
        buffalo.writeUInt8(selectedKeyNegotiationMethod.protocol);
        buffalo.writeUInt8(selectedKeyNegotiationMethod.presharedSecret);
        buffalo.writeIeeeAddr(selectedKeyNegotiationMethod.sendingDeviceEui64);

        {
            let length = 2;

            /* istanbul ignore else */
            if (fragmentationParameters.fragmentationOptions) {
                length += 1;
            }

            /* istanbul ignore else */
            if (fragmentationParameters.maxIncomingTransferUnit) {
                length += 2;
            }

            buffalo.writeGlobalTLV({tagId: GlobalTLV.FRAGMENTATION_PARAMETERS, length, tlv: fragmentationParameters});
        }

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.DECOMMISSION_REQUEST
     */
    public static buildDecommissionRequest(tlv: DeviceEUI64ListTLV): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        // DeviceEUI64ListTLV: Local: ID: 0x00
        buffalo.writeUInt8(0x00);
        buffalo.writeUInt8(tlv.eui64List.length * EUI64_SIZE + 1 - 1);
        buffalo.writeUInt8(tlv.eui64List.length);

        for (const eui64 of tlv.eui64List) {
            buffalo.writeIeeeAddr(eui64);
        }

        return buffalo.getWritten();
    }

    /**
     * @see ClusterId.CHALLENGE_REQUEST
     */
    public static buildChallengeRequest(tlv: APSFrameCounterChallengeTLV): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), ZDO_MESSAGE_OVERHEAD);

        // APSFrameCounterChallengeTLV: Local: ID: 0x00
        buffalo.writeUInt8(0x00);
        buffalo.writeUInt8(EUI64_SIZE + CHALLENGE_VALUE_SIZE - 1);
        buffalo.writeIeeeAddr(tlv.senderEui64);
        buffalo.writeBuffer(tlv.challengeValue, CHALLENGE_VALUE_SIZE);

        return buffalo.getWritten();
    }

    //-- RESPONSES

    public static readResponse(clusterId: ZdoClusterId, buffer: Buffer): unknown {
        const buffalo = new BuffaloZdo(buffer, ZDO_MESSAGE_OVERHEAD);// set pos to skip `transaction sequence number`

        switch(clusterId) {
        case ZdoClusterId.NETWORK_ADDRESS_RESPONSE: {
            return buffalo.readNetworkAddressResponse();
        }
        case ZdoClusterId.IEEE_ADDRESS_RESPONSE: {
            return buffalo.readIEEEAddressResponse();
        }
        case ZdoClusterId.NODE_DESCRIPTOR_RESPONSE: {
            return buffalo.readNodeDescriptorResponse();
        }
        case ZdoClusterId.POWER_DESCRIPTOR_RESPONSE: {
            return buffalo.readPowerDescriptorResponse();
        }
        case ZdoClusterId.SIMPLE_DESCRIPTOR_RESPONSE: {
            return buffalo.readSimpleDescriptorResponse();
        }
        case ZdoClusterId.ACTIVE_ENDPOINTS_RESPONSE: {
            return buffalo.readActiveEndpointsResponse();
        }
        case ZdoClusterId.MATCH_DESCRIPTORS_RESPONSE: {
            return buffalo.readMatchDescriptorsResponse();
        }
        case ZdoClusterId.END_DEVICE_ANNOUNCE: {
            return buffalo.readEndDeviceAnnounce();
        }
        case ZdoClusterId.SYSTEM_SERVER_DISCOVERY_RESPONSE: {
            return buffalo.readSystemServerDiscoveryResponse();
        }
        case ZdoClusterId.PARENT_ANNOUNCE_RESPONSE: {
            return buffalo.readParentAnnounceResponse();
        }
        case ZdoClusterId.BIND_RESPONSE: {
            return buffalo.readBindResponse();
        }
        case ZdoClusterId.UNBIND_RESPONSE: {
            return buffalo.readUnbindResponse();
        }
        case ZdoClusterId.CLEAR_ALL_BINDINGS_RESPONSE: {
            return buffalo.readClearAllBindingsResponse();
        }
        case ZdoClusterId.LQI_TABLE_RESPONSE: {
            return buffalo.readLQITableResponse();
        }
        case ZdoClusterId.ROUTING_TABLE_RESPONSE: {
            return buffalo.readRoutingTableResponse();
        }
        case ZdoClusterId.BINDING_TABLE_RESPONSE: {
            return buffalo.readBindingTableResponse();
        }
        case ZdoClusterId.LEAVE_RESPONSE: {
            return buffalo.readLeaveResponse();
        }
        case ZdoClusterId.PERMIT_JOINING_RESPONSE: {
            return buffalo.readPermitJoiningResponse();
        }
        case ZdoClusterId.NWK_UPDATE_RESPONSE: {
            return buffalo.readNwkUpdateResponse();
        }
        case ZdoClusterId.NWK_ENHANCED_UPDATE_RESPONSE: {
            return buffalo.readNwkEnhancedUpdateResponse();
        }
        case ZdoClusterId.NWK_IEEE_JOINING_LIST_REPONSE: {
            return buffalo.readNwkIEEEJoiningListResponse();
        }
        case ZdoClusterId.NWK_UNSOLICITED_ENHANCED_UPDATE_RESPONSE: {
            return buffalo.readNwkUnsolicitedEnhancedUpdateResponse();
        }
        case ZdoClusterId.NWK_BEACON_SURVEY_RESPONSE: {
            return buffalo.readNwkBeaconSurveyResponse();
        }
        case ZdoClusterId.START_KEY_NEGOTIATION_RESPONSE: {
            return buffalo.readStartKeyNegotiationResponse();
        }
        case ZdoClusterId.RETRIEVE_AUTHENTICATION_TOKEN_RESPONSE: {
            return buffalo.readRetrieveAuthenticationTokenResponse();
        }
        case ZdoClusterId.GET_AUTHENTICATION_LEVEL_RESPONSE: {
            return buffalo.readGetAuthenticationLevelResponse();
        }
        case ZdoClusterId.SET_CONFIGURATION_RESPONSE: {
            return buffalo.readSetConfigurationResponse();
        }
        case ZdoClusterId.GET_CONFIGURATION_RESPONSE: {
            return buffalo.readGetConfigurationResponse();
        }
        case ZdoClusterId.START_KEY_UPDATE_RESPONSE: {
            return buffalo.readStartKeyUpdateResponse();
        }
        case ZdoClusterId.DECOMMISSION_RESPONSE: {
            return buffalo.readDecommissionResponse();
        }
        case ZdoClusterId.CHALLENGE_RESPONSE: {
            return buffalo.readChallengeResponse();
        }
        default: {
            throw new Error(`Unsupported response reading for cluster ID '${clusterId}'.`);
        }
        }
    }

    /**
     * @see ClusterId.NETWORK_ADDRESS_RESPONSE
     */
    public readNetworkAddressResponse(): NetworkAddressResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // INV_REQUESTTYPE or DEVICE_NOT_FOUND
            throw new ZdoStatusError(status);
        } else {
            const eui64 = this.readIeeeAddr();
            const nwkAddress = this.readUInt16();
            let assocDevCount: number = 0;
            let startIndex: number = 0;
            let assocDevList: number[] = [];

            if (this.isMore()) {
                assocDevCount = this.readUInt8();
                startIndex = this.readUInt8();

                assocDevList = this.readListUInt16(assocDevCount);
            }

            return {
                eui64,
                nwkAddress,
                startIndex,
                assocDevList,
            };
        }
    }

    /**
     * @see ClusterId.IEEE_ADDRESS_RESPONSE
     */
    public readIEEEAddressResponse(): IEEEAddressResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // INV_REQUESTTYPE or DEVICE_NOT_FOUND
            throw new ZdoStatusError(status);
        } else {
            const eui64 = this.readIeeeAddr();
            const nwkAddress = this.readUInt16();
            let assocDevCount: number = 0;
            let startIndex: number = 0;
            let assocDevList: number[] = [];

            if (this.isMore()) {
                assocDevCount = this.readUInt8();
                startIndex = this.readUInt8();
                assocDevList = this.readListUInt16(assocDevCount);
            }

            return {
                eui64,
                nwkAddress,
                startIndex,
                assocDevList,
            };
        }
    }

    /**
     * @see ClusterId.NODE_DESCRIPTOR_RESPONSE
     */
    public readNodeDescriptorResponse(): NodeDescriptorResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // DEVICE_NOT_FOUND, INV_REQUESTTYPE, or NO_DESCRIPTOR
            throw new ZdoStatusError(status);
        } else {
            const nwkAddress = this.readUInt16();
            // in bits: [logical type: 3] [deprecated: 1] [deprecated: 1] [fragmentation supported (R23): 1] [reserved/unused: 2]
            const nodeDescByte1 = this.readUInt8();
            // in bits: [aps flags: 3] [frequency band: 5]
            const nodeDescByte2 = this.readUInt8();
            const macCapFlags = Utils.getMacCapFlags(this.readUInt8());
            const manufacturerCode = this.readUInt16();
            const maxBufSize = this.readUInt8();
            const maxIncTxSize = this.readUInt16();
            const serverMask = Utils.getServerMask(this.readUInt16());
            const maxOutTxSize = this.readUInt16();
            const deprecated1 = this.readUInt8();
            // Global: FragmentationParametersGlobalTLV
            const tlvs: TLV[] = this.readTLVs();

            return {
                nwkAddress,
                logicalType: (nodeDescByte1 & 0x07),
                fragmentationSupported: (serverMask.stackComplianceResivion >= 23) ? ((nodeDescByte1 & 0x20) >> 5) === 1 : null,
                apsFlags: (nodeDescByte2 & 0x07),
                frequencyBand: (nodeDescByte2 & 0xF8) >> 3,
                capabilities: macCapFlags,
                manufacturerCode,
                maxBufSize,
                maxIncTxSize,
                serverMask,
                maxOutTxSize,
                deprecated1,
                tlvs,
            };
        }
    }

    /**
     * @see ClusterId.POWER_DESCRIPTOR_RESPONSE
     */
    public readPowerDescriptorResponse(): PowerDescriptorResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // DEVICE_NOT_FOUND, INV_REQUESTTYPE, or NO_DESCRIPTOR
            throw new ZdoStatusError(status);
        } else {
            const nwkAddress = this.readUInt16();
            const byte1 = this.readUInt8();
            const byte2 = this.readUInt8();

            return {
                nwkAddress,
                currentPowerMode: (byte1 & 0xF),
                availPowerSources: ((byte1 >> 4) & 0xF),
                currentPowerSource: (byte2 & 0xF),
                currentPowerSourceLevel: ((byte2 >> 4) & 0xF),
            };
        }
    }

    /**
     * @see ClusterId.SIMPLE_DESCRIPTOR_RESPONSE
     */
    public readSimpleDescriptorResponse(): SimpleDescriptorResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // INVALID_EP, NOT_ACTIVE, DEVICE_NOT_FOUND, INV_REQUESTTYPE or NO_DESCRIPTOR
            throw new ZdoStatusError(status);
        } else {
            const nwkAddress = this.readUInt16();
            // Length in bytes of the Simple Descriptor to follow. [0x00-0xff]
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const length = this.readUInt8();
            const endpoint = this.readUInt8();
            const profileId = this.readUInt16();
            const deviceId = this.readUInt16();
            const deviceVersion = this.readUInt8();
            const inClusterCount = this.readUInt8();
            const inClusterList = this.readListUInt16(inClusterCount);// empty if inClusterCount==0
            const outClusterCount = this.readUInt8();
            const outClusterList = this.readListUInt16(outClusterCount);// empty if outClusterCount==0

            return {
                nwkAddress, 
                endpoint,
                profileId,
                deviceId,
                deviceVersion,
                inClusterList,
                outClusterList,
            };
        }
    }

    /**
     * @see ClusterId.ACTIVE_ENDPOINTS_RESPONSE
     */
    public readActiveEndpointsResponse(): ActiveEndpointsResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // DEVICE_NOT_FOUND, INV_REQUESTTYPE, or NO_DESCRIPTOR
            throw new ZdoStatusError(status);
        } else {
            const nwkAddress = this.readUInt16();
            const endpointCount = this.readUInt8();
            const endpointList = this.readListUInt8(endpointCount);

            return {
                nwkAddress,
                endpointList,
            };
        }
    }

    /**
     * @see ClusterId.MATCH_DESCRIPTORS_RESPONSE
     */
    public readMatchDescriptorsResponse(): MatchDescriptorsResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // DEVICE_NOT_FOUND, INV_REQUESTTYPE, or NO_DESCRIPTOR
            throw new ZdoStatusError(status);
        } else {
            const nwkAddress = this.readUInt16();
            const endpointCount = this.readUInt8();
            const endpointList = this.readListUInt8(endpointCount);

            return {
                nwkAddress,
                endpointList,
            };
        }
    }

    /**
     * @see ClusterId.END_DEVICE_ANNOUNCE
     */
    public readEndDeviceAnnounce(): EndDeviceAnnounce {
        const nwkAddress = this.readUInt16();
        const eui64 = this.readIeeeAddr();
        /** @see MACCapabilityFlags */
        const capabilities = this.readUInt8();

        return {nwkAddress, eui64, capabilities: Utils.getMacCapFlags(capabilities)};
    }

    /**
     * @see ClusterId.SYSTEM_SERVER_DISCOVERY_RESPONSE
     */
    public readSystemServerDiscoveryResponse(): SystemServerDiscoveryResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // Shouldn't happen
            throw new ZdoStatusError(status);
        } else {
            const serverMask = Utils.getServerMask(this.readUInt16());

            return {
                serverMask,
            };
        }
    }

    /**
     * @see ClusterId.PARENT_ANNOUNCE_RESPONSE
     */
    public readParentAnnounceResponse(): ParentAnnounceResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // NOT_SUPPORTED
            throw new ZdoStatusError(status);
        } else {
            const numberOfChildren = this.readUInt8();
            const children: EUI64[] = [];

            for (let i = 0; i < numberOfChildren; i++) {
                const childEui64 = this.readIeeeAddr();

                children.push(childEui64);
            }

            return {children};
        }
    }

    /**
     * @see ClusterId.BIND_RESPONSE
     * @returns No response payload, throws if not success
     */
    public readBindResponse(): void {
        const status: Status = this.readUInt8();

        /* istanbul ignore else */
        if (status !== Status.SUCCESS) {
            // NOT_SUPPORTED, INVALID_EP, TABLE_FULL, or NOT_AUTHORIZED
            throw new ZdoStatusError(status);
        }
    }

    /**
     * @see ClusterId.UNBIND_RESPONSE
     * @returns No response payload, throws if not success
     */
    public readUnbindResponse(): void {
        const status: Status = this.readUInt8();

        /* istanbul ignore else */
        if (status !== Status.SUCCESS) {
            // NOT_SUPPORTED, INVALID_EP, NO_ENTRY or NOT_AUTHORIZED
            throw new ZdoStatusError(status);
        }
    }

    /**
     * @see ClusterId.CLEAR_ALL_BINDINGS_RESPONSE
     * @returns No response payload, throws if not success
     */
    public readClearAllBindingsResponse(): void {
        const status: Status = this.readUInt8();

        /* istanbul ignore else */
        if (status !== Status.SUCCESS) {
            // NOT_SUPPORTED, NOT_AUTHORIZED, INV_REQUESTTYPE, or NO_MATCH.
            throw new ZdoStatusError(status);
        }
    }

    /**
     * @see ClusterId.LQI_TABLE_RESPONSE
     */
    public readLQITableResponse(): LQITableResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // NOT_SUPPORTED or any status code returned from the NLME-GET.confirm primitive.
            throw new ZdoStatusError(status);
        } else {
            const neighborTableEntries = this.readUInt8();
            const startIndex = this.readUInt8();
            // [0x00-0x02]
            const entryCount = this.readUInt8();
            const entryList: LQITableEntry[] = [];

            for (let i = 0; i < entryCount; i++) {
                const extendedPanId = this.readListUInt8(EXTENDED_PAN_ID_SIZE);
                const eui64 = this.readIeeeAddr();
                const nwkAddress = this.readUInt16();
                const deviceTypeByte = this.readUInt8();
                const permitJoiningByte = this.readUInt8();
                const depth = this.readUInt8();
                const lqi = this.readUInt8();

                entryList.push({
                    extendedPanId,
                    eui64,
                    nwkAddress,
                    deviceType: deviceTypeByte & 0x03,
                    rxOnWhenIdle: (deviceTypeByte & 0x0C) >> 2,
                    relationship: (deviceTypeByte & 0x70) >> 4,
                    reserved1: (deviceTypeByte & 0x10) >> 7,
                    permitJoining: permitJoiningByte & 0x03,
                    reserved2: (permitJoiningByte & 0xFC) >> 2,
                    depth,
                    lqi,
                });
            }

            return {
                neighborTableEntries,
                startIndex,
                entryList,
            };
        }
    }

    /**
     * @see ClusterId.ROUTING_TABLE_RESPONSE
     */
    public readRoutingTableResponse(): RoutingTableResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // NOT_SUPPORTED or any status code returned from the NLMEGET.confirm primitive.
            throw new ZdoStatusError(status);
        } else {
            const routingTableEntries = this.readUInt8();
            const startIndex = this.readUInt8();
            // [0x00-0xFF]
            const entryCount = this.readUInt8();
            const entryList: RoutingTableEntry[] = [];

            for (let i = 0; i < entryCount; i++) {
                const destinationAddress = this.readUInt16();
                const statusByte = this.readUInt8();
                const nextHopAddress = this.readUInt16();

                entryList.push({
                    destinationAddress,
                    status: statusByte & 0x07,
                    memoryConstrained: (statusByte & 0x08) >> 3,
                    manyToOne: (statusByte & 0x10) >> 4,
                    routeRecordRequired: (statusByte & 0x20) >> 5,
                    reserved1: (statusByte & 0xC0) >> 6,
                    nextHopAddress,
                });
            }

            return {
                routingTableEntries,
                startIndex,
                entryList,
            };
        }
    }

    /**
     * @see ClusterId.BINDING_TABLE_RESPONSE
     */
    public readBindingTableResponse(): BindingTableResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // NOT_SUPPORTED or any status code returned from the APSMEGET.confirm primitive.
            throw new ZdoStatusError(status);
        } else {
            const bindingTableEntries = this.readUInt8();
            const startIndex = this.readUInt8();
            // [0x00-0xFF]
            const entryCount = this.readUInt8();
            const entryList: BindingTableEntry[] = [];

            for (let i = 0; i < entryCount; i++) {
                const sourceEui64 = this.readIeeeAddr();
                const sourceEndpoint = this.readUInt8();
                const clusterId = this.readUInt16();
                const destAddrMode = this.readUInt8();
                const dest = (destAddrMode === 0x01) ? this.readUInt16() : ((destAddrMode === 0x03) ? this.readIeeeAddr() : null);
                const destEndpoint = (destAddrMode === 0x03) ? this.readUInt8() : null;

                entryList.push({
                    sourceEui64,
                    sourceEndpoint,
                    clusterId,
                    destAddrMode,
                    dest,
                    destEndpoint,
                });
            }

            return {
                bindingTableEntries,
                startIndex,
                entryList,
            };
        }
    }

    /**
     * @see ClusterId.LEAVE_RESPONSE
     * @returns No response payload, throws if not success
     */
    public readLeaveResponse(): void {
        const status: Status = this.readUInt8();

        /* istanbul ignore else */
        if (status !== Status.SUCCESS) {
            // NOT_SUPPORTED, NOT_AUTHORIZED or any status code returned from the NLMELEAVE.confirm primitive.
            throw new ZdoStatusError(status);
        }
    }

    /**
     * @see ClusterId.PERMIT_JOINING_RESPONSE
     * @returns No response payload, throws if not success
     */
    public readPermitJoiningResponse(): void {
        const status: Status = this.readUInt8();

        /* istanbul ignore else */
        if (status !== Status.SUCCESS) {
            // INV_REQUESTTYPE, NOT_AUTHORIZED, or any status code returned from the NLME-PERMIT-JOINING.confirm primitive.
            throw new ZdoStatusError(status);
        }
    }

    /**
     * @see ClusterId.NWK_UPDATE_RESPONSE
     */
    public readNwkUpdateResponse(): NwkUpdateResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // INV_REQUESTTYPE, NOT_SUPPORTED, or any status values returned from the MLME-SCAN.confirm primitive
            throw new ZdoStatusError(status);
        } else {
            const scannedChannels = this.readUInt32();
            const totalTransmissions = this.readUInt16();
            const totalFailures = this.readUInt16();
            // [0x00-0xFF]
            const entryCount = this.readUInt8();
            const entryList = this.readListUInt8(entryCount);

            return {
                scannedChannels,
                totalTransmissions,
                totalFailures,
                entryList,
            };
        }
    }

    /**
     * @see ClusterId.NWK_ENHANCED_UPDATE_RESPONSE
     */
    public readNwkEnhancedUpdateResponse(): NwkEnhancedUpdateResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // INV_REQUESTTYPE, NOT_SUPPORTED, or any status values returned from the MLME-SCAN.confirm primitive.
            throw new ZdoStatusError(status);
        } else {
            const scannedChannels = this.readUInt32();
            const totalTransmissions = this.readUInt16();
            const totalFailures = this.readUInt16();
            // [0x00-0xFF]
            const entryCount = this.readUInt8();
            const entryList = this.readListUInt8(entryCount);

            return {
                scannedChannels,
                totalTransmissions,
                totalFailures,
                entryList,
            };
        }
    }

    /**
     * @see ClusterId.NWK_IEEE_JOINING_LIST_REPONSE
     */
    public readNwkIEEEJoiningListResponse(): NwkIEEEJoiningListResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // INV_REQUESTTYPE, or NOT_SUPPORTED
            throw new ZdoStatusError(status);
        } else {
            const updateId = this.readUInt8();
            const joiningPolicy = this.readUInt8();
            // [0x00-0xFF]
            const entryListTotal = this.readUInt8();
            let startIndex: number;
            let entryList: EUI64[];

            if (entryListTotal > 0) {
                startIndex = this.readUInt8();
                const entryCount = this.readUInt8();
                entryList = [];

                for (let i = 0; i < entryCount; i++) {
                    const ieee = this.readIeeeAddr();

                    entryList.push(ieee);
                }
            }

            return {
                updateId,
                joiningPolicy,
                entryListTotal,
                startIndex,
                entryList,
            };
        }
    }

    /**
     * @see ClusterId.NWK_UNSOLICITED_ENHANCED_UPDATE_RESPONSE
     */
    public readNwkUnsolicitedEnhancedUpdateResponse(): NwkUnsolicitedEnhancedUpdateResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // ??
            throw new ZdoStatusError(status);
        } else {
            const channelInUse = this.readUInt32();
            const macTxUCastTotal = this.readUInt16();
            const macTxUCastFailures = this.readUInt16();
            const macTxUCastRetries = this.readUInt16();
            const timePeriod = this.readUInt8();

            return {
                channelInUse,
                macTxUCastTotal,
                macTxUCastFailures,
                macTxUCastRetries,
                timePeriod,
            };
        }
    }

    /**
     * @see ClusterId.NWK_BEACON_SURVEY_RESPONSE
     */
    public readNwkBeaconSurveyResponse(): NwkBeaconSurveyResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // INV_REQUESTTYPE, or NOT_SUPPORTED
            throw new ZdoStatusError(status);
        } else {
            const localTLVs = new Map<number, LocalTLVReader>([
                // Local: ID: 0x01: BeaconSurveyResultsTLV
                [0x01, this.readBeaconSurveyResultsTLV],
                // Local: ID: 0x02: PotentialParentsTLV
                [0x02, this.readPotentialParentsTLV],
            ]);
            const tlvs: TLV[] = this.readTLVs(localTLVs);

            return {
                tlvs,
            };
        }
    }

    /**
     * @see ClusterId.START_KEY_NEGOTIATION_RESPONSE
     */
    public readStartKeyNegotiationResponse(): StartKeyNegotiationResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // INVALID_TLV, MISSING_TLV, TEMPORARY_FAILURE, NOT_AUTHORIZED
            throw new ZdoStatusError(status);
        } else {
            const localTLVs = new Map<number, LocalTLVReader>([
                // Local: ID: 0x00: Curve25519PublicPointTLV
                [0x00, this.readCurve25519PublicPointTLV],
            ]);
            const tlvs: TLV[] = this.readTLVs(localTLVs);

            return {
                tlvs,
            };
        }
    }

    /**
     * @see ClusterId.RETRIEVE_AUTHENTICATION_TOKEN_RESPONSE
     */
    public readRetrieveAuthenticationTokenResponse (): RetrieveAuthenticationTokenResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            throw new ZdoStatusError(status);
        } else {
            // no local TLV
            const tlvs: TLV[] = this.readTLVs();

            return {
                tlvs,
            };
        }
    }

    /**
     * @see ClusterId.GET_AUTHENTICATION_LEVEL_RESPONSE
     */
    public readGetAuthenticationLevelResponse (): GetAuthenticationLevelResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // NOT_SUPPORTED, INV_REQUESTTYPE, MISSING_TLV, and NOT_AUTHORIZED
            throw new ZdoStatusError(status);
        } else {
            const localTLVs = new Map<number, LocalTLVReader>([
                // Local: ID: 0x00: DeviceAuthenticationLevelTLV
                [0x00, this.readDeviceAuthenticationLevelTLV],
            ]);
            const tlvs: TLV[] = this.readTLVs(localTLVs);

            return {
                tlvs,
            };
        }
    }

    /**
     * @see ClusterId.SET_CONFIGURATION_RESPONSE
     */
    public readSetConfigurationResponse(): SetConfigurationResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // INV_REQUESTTYPE, or NOT_SUPPORTED
            throw new ZdoStatusError(status);
        } else {
            const localTLVs = new Map<number, LocalTLVReader>([
                // Local: ID: 0x00: ProcessingStatusTLV
                [0x00, this.readProcessingStatusTLV],
            ]);
            const tlvs: TLV[] = this.readTLVs(localTLVs);

            return {
                tlvs,
            };
        }
    }

    /**
     * @see ClusterId.GET_CONFIGURATION_RESPONSE
     */
    public readGetConfigurationResponse(): GetConfigurationResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            // INV_REQUESTTYPE, or NOT_SUPPORTED
            throw new ZdoStatusError(status);
        } else {
            // Global: IDs: x, y, z
            const tlvs: TLV[] = this.readTLVs();

            return {
                tlvs,
            };
        }
    }

    /**
     * @see ClusterId.START_KEY_UPDATE_RESPONSE
     * @returns No response payload, throws if not success
     */
    public readStartKeyUpdateResponse(): void {
        const status: Status = this.readUInt8();

        /* istanbul ignore else */
        if (status !== Status.SUCCESS) {
            // INV_REQUESTTYPE, NOT_AUTHORIZED or NOT_SUPPORTED
            throw new ZdoStatusError(status);
        }
    }

    /**
     * @see ClusterId.DECOMMISSION_RESPONSE
     * @returns No response payload, throws if not success
     */
    public readDecommissionResponse(): void {
        const status: Status = this.readUInt8();

        /* istanbul ignore else */
        if (status !== Status.SUCCESS) {
            // INV_REQUESTTYPE, NOT_AUTHORIZED or NOT_SUPPORTED
            throw new ZdoStatusError(status);
        }
    }

    /**
     * @see ClusterId.CHALLENGE_RESPONSE
     */
    public readChallengeResponse(): ChallengeResponse {
        const status: Status = this.readUInt8();

        if (status !== Status.SUCCESS) {
            throw new ZdoStatusError(status);
        } else {
            const localTLVs = new Map<number, LocalTLVReader>([
                // Local: ID: 0x00: APSFrameCounterResponseTLV
                [0x00, this.readAPSFrameCounterResponseTLV],
            ]);
            const tlvs: TLV[] = this.readTLVs(localTLVs);

            return {
                tlvs,
            };
        }
    }
}
