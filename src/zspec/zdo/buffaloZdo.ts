import Buffalo from '../../buffalo/buffalo';
import {logger} from '../../utils/logger';
import {DEFAULT_ENCRYPTION_KEY_SIZE, EUI64_SIZE, EXTENDED_PAN_ID_SIZE, PAN_ID_SIZE} from '../consts';
import {ClusterId, EUI64, NodeId, ProfileId} from '../tstypes';
import * as ZSpecUtils from '../utils';
import {ClusterId as ZdoClusterId} from './definition/clusters';
import {CHALLENGE_VALUE_SIZE, CURVE_PUBLIC_POINT_SIZE, MULTICAST_BINDING, UNICAST_BINDING, ZDO_MESSAGE_OVERHEAD} from './definition/consts';
import {GlobalTLV, LeaveRequestFlags, RoutingTableStatus} from './definition/enums';
import {Status} from './definition/status';
import {
    ActiveEndpointsResponse,
    APSFrameCounterChallengeTLV,
    APSFrameCounterResponseTLV,
    AuthenticationTokenIdTLV,
    BeaconAppendixEncapsulationGlobalTLV,
    BeaconSurveyConfigurationTLV,
    BeaconSurveyResultsTLV,
    BindingTableEntry,
    BindingTableResponse,
    ChallengeResponse,
    ClearAllBindingsReqEUI64TLV,
    ConfigurationParametersGlobalTLV,
    Curve25519PublicPointTLV,
    DeviceAuthenticationLevelTLV,
    DeviceCapabilityExtensionGlobalTLV,
    DeviceEUI64ListTLV,
    FragmentationParametersGlobalTLV,
    GetAuthenticationLevelResponse,
    GetConfigurationResponse,
    IEEEAddressResponse,
    JoinerEncapsulationGlobalTLV,
    LocalTLVReader,
    LQITableEntry,
    LQITableResponse,
    ManufacturerSpecificGlobalTLV,
    MatchDescriptorsResponse,
    NetworkAddressResponse,
    NextChannelChangeGlobalTLV,
    NextPanIdChangeGlobalTLV,
    NodeDescriptorResponse,
    NwkBeaconSurveyResponse,
    NwkEnhancedUpdateResponse,
    NwkIEEEJoiningListResponse,
    NwkUnsolicitedEnhancedUpdateResponse,
    NwkUpdateResponse,
    PanIdConflictReportGlobalTLV,
    ParentAnnounceResponse,
    PotentialParentsTLV,
    PowerDescriptorResponse,
    ProcessingStatusTLV,
    RequestMap,
    ResponseMap,
    RetrieveAuthenticationTokenResponse,
    RouterInformationGlobalTLV,
    RoutingTableEntry,
    RoutingTableResponse,
    SelectedKeyNegotiationMethodTLV,
    ServerMask,
    SetConfigurationResponse,
    SimpleDescriptorResponse,
    StartKeyNegotiationResponse,
    SupportedKeyNegotiationMethodsGlobalTLV,
    SymmetricPassphraseGlobalTLV,
    SystemServerDiscoveryResponse,
    TargetIEEEAddressTLV,
    TLV,
    ValidResponseMap,
} from './definition/tstypes';
import * as Utils from './utils';
import {ZdoStatusError} from './zdoStatusError';

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
        return this.position + count <= this.buffer.length;
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
        let sourceDeviceEui64: SupportedKeyNegotiationMethodsGlobalTLV['sourceDeviceEui64'];

        if (length >= 2 + EUI64_SIZE) {
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
        let fragmentationOptions: FragmentationParametersGlobalTLV['fragmentationOptions'];
        let maxIncomingTransferUnit: FragmentationParametersGlobalTLV['maxIncomingTransferUnit'];

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
        const additionalTLVs = encapsulationBuffalo.readTLVs(undefined, true);

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
        const additionalTLVs = encapsulationBuffalo.readTLVs(undefined, true);

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
        this.writeUInt8(tlv.length - 1); // remove offset (spec quirk...)

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

    public readGlobalTLV(tagId: number, length: number): TLV['tlv'] | undefined {
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
                return undefined;
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
        if (length !== EUI64_SIZE + CURVE_PUBLIC_POINT_SIZE) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected ${EUI64_SIZE + CURVE_PUBLIC_POINT_SIZE}.`);
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

        if (length !== 4 + entryCount * 3) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected ${4 + entryCount * 3}.`);
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

        if (length !== 1 + count * 2) {
            throw new Error(`Malformed TLV. Invalid length '${length}', expected ${1 + count * 2}.`);
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
    public readTLVs(localTLVReaders?: Map<number, LocalTLVReader>, encapsulated: boolean = false): TLV[] {
        const tlvs: TLV[] = [];

        while (this.isMore()) {
            const tagId = this.readUInt8();

            // validation: cannot have duplicate tagId, except MANUFACTURER_SPECIFIC_GLOBAL_TLV
            if (tagId !== GlobalTLV.MANUFACTURER_SPECIFIC && tlvs.findIndex((tlv) => tlv.tagId === tagId) !== -1) {
                throw new Error(`Duplicate tag. Cannot have more than one of tagId=${tagId}.`);
            }

            // validation: encapsulation TLV cannot contain another encapsulation TLV, outer considered malformed, reject message
            if (encapsulated && (tagId === GlobalTLV.BEACON_APPENDIX_ENCAPSULATION || tagId === GlobalTLV.JOINER_ENCAPSULATION)) {
                throw new Error(`Invalid nested encapsulation for tagId=${tagId}.`);
            }

            const length = this.readUInt8() + 1; // add offset (spec quirk...)

            // validation: invalid if not at least ${length} bytes to read
            if (!this.isMoreBy(length)) {
                throw new Error(`Malformed TLV. Invalid data length for tagId=${tagId}, expected ${length}.`);
            }

            const nextTLVStart = this.getPosition() + length;
            // undefined == unknown tag
            let tlv: TLV['tlv'] | undefined;

            if (tagId < GlobalTLV.MANUFACTURER_SPECIFIC) {
                if (localTLVReaders) {
                    const localTLVReader = localTLVReaders.get(tagId);

                    if (localTLVReader) {
                        tlv = localTLVReader.call(this, length);
                        /* v8 ignore start */
                    } else {
                        logger.debug(`Local TLV found tagId=${tagId} but no reader given for it. Ignoring it.`, NS);
                    }
                    /* v8 ignore stop */
                    /* v8 ignore start */
                } else {
                    logger.debug(`Local TLV found tagId=${tagId} but no reader available. Ignoring it.`, NS);
                }
                /* v8 ignore stop */
            } else {
                tlv = this.readGlobalTLV(tagId, length);
            }

            // validation: unknown tag shall be ignored
            if (tlv) {
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

    public static buildRequest<K extends keyof RequestMap>(hasZdoMessageOverhead: boolean, clusterId: K, ...args: RequestMap[K]): Buffer {
        const buffalo = new BuffaloZdo(Buffer.alloc(MAX_BUFFER_SIZE), hasZdoMessageOverhead ? ZDO_MESSAGE_OVERHEAD : 0);

        switch (clusterId) {
            case ZdoClusterId.NETWORK_ADDRESS_REQUEST: {
                return buffalo.buildNetworkAddressRequest(...(args as RequestMap[ZdoClusterId.NETWORK_ADDRESS_REQUEST]));
            }

            case ZdoClusterId.IEEE_ADDRESS_REQUEST: {
                return buffalo.buildIeeeAddressRequest(...(args as RequestMap[ZdoClusterId.IEEE_ADDRESS_REQUEST]));
            }

            case ZdoClusterId.NODE_DESCRIPTOR_REQUEST: {
                return buffalo.buildNodeDescriptorRequest(...(args as RequestMap[ZdoClusterId.NODE_DESCRIPTOR_REQUEST]));
            }

            case ZdoClusterId.POWER_DESCRIPTOR_REQUEST: {
                return buffalo.buildPowerDescriptorRequest(...(args as RequestMap[ZdoClusterId.POWER_DESCRIPTOR_REQUEST]));
            }

            case ZdoClusterId.SIMPLE_DESCRIPTOR_REQUEST: {
                return buffalo.buildSimpleDescriptorRequest(...(args as RequestMap[ZdoClusterId.SIMPLE_DESCRIPTOR_REQUEST]));
            }

            case ZdoClusterId.ACTIVE_ENDPOINTS_REQUEST: {
                return buffalo.buildActiveEndpointsRequest(...(args as RequestMap[ZdoClusterId.ACTIVE_ENDPOINTS_REQUEST]));
            }

            case ZdoClusterId.MATCH_DESCRIPTORS_REQUEST: {
                return buffalo.buildMatchDescriptorRequest(...(args as RequestMap[ZdoClusterId.MATCH_DESCRIPTORS_REQUEST]));
            }

            case ZdoClusterId.SYSTEM_SERVER_DISCOVERY_REQUEST: {
                return buffalo.buildSystemServiceDiscoveryRequest(...(args as RequestMap[ZdoClusterId.SYSTEM_SERVER_DISCOVERY_REQUEST]));
            }

            case ZdoClusterId.PARENT_ANNOUNCE: {
                return buffalo.buildParentAnnounce(...(args as RequestMap[ZdoClusterId.PARENT_ANNOUNCE]));
            }

            case ZdoClusterId.BIND_REQUEST: {
                return buffalo.buildBindRequest(...(args as RequestMap[ZdoClusterId.BIND_REQUEST]));
            }

            case ZdoClusterId.UNBIND_REQUEST: {
                return buffalo.buildUnbindRequest(...(args as RequestMap[ZdoClusterId.UNBIND_REQUEST]));
            }

            case ZdoClusterId.CLEAR_ALL_BINDINGS_REQUEST: {
                return buffalo.buildClearAllBindingsRequest(...(args as RequestMap[ZdoClusterId.CLEAR_ALL_BINDINGS_REQUEST]));
            }

            case ZdoClusterId.LQI_TABLE_REQUEST: {
                return buffalo.buildLqiTableRequest(...(args as RequestMap[ZdoClusterId.LQI_TABLE_REQUEST]));
            }

            case ZdoClusterId.ROUTING_TABLE_REQUEST: {
                return buffalo.buildRoutingTableRequest(...(args as RequestMap[ZdoClusterId.ROUTING_TABLE_REQUEST]));
            }

            case ZdoClusterId.BINDING_TABLE_REQUEST: {
                return buffalo.buildBindingTableRequest(...(args as RequestMap[ZdoClusterId.BINDING_TABLE_REQUEST]));
            }

            case ZdoClusterId.LEAVE_REQUEST: {
                return buffalo.buildLeaveRequest(...(args as RequestMap[ZdoClusterId.LEAVE_REQUEST]));
            }

            case ZdoClusterId.PERMIT_JOINING_REQUEST: {
                return buffalo.buildPermitJoining(...(args as RequestMap[ZdoClusterId.PERMIT_JOINING_REQUEST]));
            }

            case ZdoClusterId.NWK_UPDATE_REQUEST: {
                return buffalo.buildNwkUpdateRequest(...(args as RequestMap[ZdoClusterId.NWK_UPDATE_REQUEST]));
            }

            case ZdoClusterId.NWK_ENHANCED_UPDATE_REQUEST: {
                return buffalo.buildNwkEnhancedUpdateRequest(...(args as RequestMap[ZdoClusterId.NWK_ENHANCED_UPDATE_REQUEST]));
            }

            case ZdoClusterId.NWK_IEEE_JOINING_LIST_REQUEST: {
                return buffalo.buildNwkIEEEJoiningListRequest(...(args as RequestMap[ZdoClusterId.NWK_IEEE_JOINING_LIST_REQUEST]));
            }

            case ZdoClusterId.NWK_BEACON_SURVEY_REQUEST: {
                return buffalo.buildNwkBeaconSurveyRequest(...(args as RequestMap[ZdoClusterId.NWK_BEACON_SURVEY_REQUEST]));
            }

            case ZdoClusterId.START_KEY_NEGOTIATION_REQUEST: {
                return buffalo.buildStartKeyNegotiationRequest(...(args as RequestMap[ZdoClusterId.START_KEY_NEGOTIATION_REQUEST]));
            }

            case ZdoClusterId.RETRIEVE_AUTHENTICATION_TOKEN_REQUEST: {
                return buffalo.buildRetrieveAuthenticationTokenRequest(...(args as RequestMap[ZdoClusterId.RETRIEVE_AUTHENTICATION_TOKEN_REQUEST]));
            }

            case ZdoClusterId.GET_AUTHENTICATION_LEVEL_REQUEST: {
                return buffalo.buildGetAuthenticationLevelRequest(...(args as RequestMap[ZdoClusterId.GET_AUTHENTICATION_LEVEL_REQUEST]));
            }

            case ZdoClusterId.SET_CONFIGURATION_REQUEST: {
                return buffalo.buildSetConfigurationRequest(...(args as RequestMap[ZdoClusterId.SET_CONFIGURATION_REQUEST]));
            }

            case ZdoClusterId.GET_CONFIGURATION_REQUEST: {
                return buffalo.buildGetConfigurationRequest(...(args as RequestMap[ZdoClusterId.GET_CONFIGURATION_REQUEST]));
            }

            case ZdoClusterId.START_KEY_UPDATE_REQUEST: {
                return buffalo.buildStartKeyUpdateRequest(...(args as RequestMap[ZdoClusterId.START_KEY_UPDATE_REQUEST]));
            }

            case ZdoClusterId.DECOMMISSION_REQUEST: {
                return buffalo.buildDecommissionRequest(...(args as RequestMap[ZdoClusterId.DECOMMISSION_REQUEST]));
            }

            case ZdoClusterId.CHALLENGE_REQUEST: {
                return buffalo.buildChallengeRequest(...(args as RequestMap[ZdoClusterId.CHALLENGE_REQUEST]));
            }

            default: {
                throw new Error(`Unsupported request building for cluster ID '${clusterId}'.`);
            }
        }
    }

    /**
     * @see ClusterId.NETWORK_ADDRESS_REQUEST
     * @param target IEEE address for the request
     * @param reportKids True to request that the target list their children in the response. [request type = 0x01]
     * @param childStartIndex The index of the first child to list in the response. Ignored if reportKids is false.
     */
    private buildNetworkAddressRequest(target: EUI64, reportKids: boolean, childStartIndex: number): Buffer {
        this.writeIeeeAddr(target);
        this.writeUInt8(reportKids ? 1 : 0);
        this.writeUInt8(childStartIndex);

        return this.getWritten();
    }

    /**
     * @see ClusterId.IEEE_ADDRESS_REQUEST
     * Can be sent to target, or to another node that will send to target.
     * @param target NWK address for the request
     * @param reportKids True to request that the target list their children in the response. [request type = 0x01]
     * @param childStartIndex The index of the first child to list in the response. Ignored if reportKids is false.
     */
    private buildIeeeAddressRequest(target: NodeId, reportKids: boolean, childStartIndex: number): Buffer {
        this.writeUInt16(target);
        this.writeUInt8(reportKids ? 1 : 0);
        this.writeUInt8(childStartIndex);

        return this.getWritten();
    }

    /**
     * @see ClusterId.NODE_DESCRIPTOR_REQUEST
     * @param target NWK address for the request
     */
    private buildNodeDescriptorRequest(target: NodeId, fragmentationParameters?: FragmentationParametersGlobalTLV): Buffer {
        this.writeUInt16(target);

        if (fragmentationParameters) {
            let length = 2;

            if (fragmentationParameters.fragmentationOptions) {
                length += 1;
            }

            if (fragmentationParameters.maxIncomingTransferUnit) {
                length += 2;
            }

            this.writeGlobalTLV({tagId: GlobalTLV.FRAGMENTATION_PARAMETERS, length, tlv: fragmentationParameters});
        }

        return this.getWritten();
    }

    /**
     * @see ClusterId.POWER_DESCRIPTOR_REQUEST
     * @param target NWK address for the request
     */
    private buildPowerDescriptorRequest(target: NodeId): Buffer {
        this.writeUInt16(target);

        return this.getWritten();
    }

    /**
     * @see ClusterId.SIMPLE_DESCRIPTOR_REQUEST
     * @param target NWK address for the request
     * @param targetEndpoint The endpoint on the destination
     */
    private buildSimpleDescriptorRequest(target: NodeId, targetEndpoint: number): Buffer {
        this.writeUInt16(target);
        this.writeUInt8(targetEndpoint);

        return this.getWritten();
    }

    /**
     * @see ClusterId.ACTIVE_ENDPOINTS_REQUEST
     * @param target NWK address for the request
     */
    private buildActiveEndpointsRequest(target: NodeId): Buffer {
        this.writeUInt16(target);

        return this.getWritten();
    }

    /**
     * @see ClusterId.MATCH_DESCRIPTORS_REQUEST
     * @param target NWK address for the request
     * @param profileId Profile ID to be matched at the destination
     * @param inClusterList List of Input ClusterIDs to be used for matching
     * @param outClusterList List of Output ClusterIDs to be used for matching
     */
    private buildMatchDescriptorRequest(target: NodeId, profileId: ProfileId, inClusterList: ClusterId[], outClusterList: ClusterId[]): Buffer {
        this.writeUInt16(target);
        this.writeUInt16(profileId);
        this.writeUInt8(inClusterList.length);
        this.writeListUInt16(inClusterList);
        this.writeUInt8(outClusterList.length);
        this.writeListUInt16(outClusterList);

        return this.getWritten();
    }

    /**
     * @see ClusterId.SYSTEM_SERVER_DISCOVERY_REQUEST
     * @param serverMask See Table 2-34 for bit assignments.
     */
    private buildSystemServiceDiscoveryRequest(serverMask: ServerMask): Buffer {
        this.writeUInt16(Utils.createServerMask(serverMask));

        return this.getWritten();
    }

    /**
     * @see ClusterId.PARENT_ANNOUNCE
     * @param children The IEEE addresses of the children bound to the parent.
     */
    private buildParentAnnounce(children: EUI64[]): Buffer {
        this.writeUInt8(children.length);

        for (const child of children) {
            this.writeIeeeAddr(child);
        }

        return this.getWritten();
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
    private buildBindRequest(
        source: EUI64,
        sourceEndpoint: number,
        clusterId: ClusterId,
        type: number,
        destination: EUI64,
        groupAddress: number,
        destinationEndpoint: number,
    ): Buffer {
        this.writeIeeeAddr(source);
        this.writeUInt8(sourceEndpoint);
        this.writeUInt16(clusterId);
        this.writeUInt8(type);

        switch (type) {
            case UNICAST_BINDING: {
                this.writeIeeeAddr(destination);
                this.writeUInt8(destinationEndpoint);
                break;
            }
            case MULTICAST_BINDING: {
                this.writeUInt16(groupAddress);
                break;
            }
            default:
                throw new ZdoStatusError(Status.NOT_SUPPORTED);
        }

        return this.getWritten();
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
    private buildUnbindRequest(
        source: EUI64,
        sourceEndpoint: number,
        clusterId: ClusterId,
        type: number,
        destination: EUI64,
        groupAddress: number,
        destinationEndpoint: number,
    ): Buffer {
        this.writeIeeeAddr(source);
        this.writeUInt8(sourceEndpoint);
        this.writeUInt16(clusterId);
        this.writeUInt8(type);

        switch (type) {
            case UNICAST_BINDING: {
                this.writeIeeeAddr(destination);
                this.writeUInt8(destinationEndpoint);
                break;
            }
            case MULTICAST_BINDING: {
                this.writeUInt16(groupAddress);
                break;
            }
            default:
                throw new ZdoStatusError(Status.NOT_SUPPORTED);
        }

        return this.getWritten();
    }

    /**
     * @see ClusterId.CLEAR_ALL_BINDINGS_REQUEST
     */
    private buildClearAllBindingsRequest(tlv: ClearAllBindingsReqEUI64TLV): Buffer {
        // ClearAllBindingsReqEUI64TLV: Local: ID: 0x00
        this.writeUInt8(0x00);
        this.writeUInt8(tlv.eui64List.length * EUI64_SIZE + 1 - 1);
        this.writeUInt8(tlv.eui64List.length);

        for (const entry of tlv.eui64List) {
            this.writeIeeeAddr(entry);
        }

        return this.getWritten();
    }

    /**
     * @see ClusterId.LQI_TABLE_REQUEST
     * @param startIndex Starting Index for the requested elements of the Neighbor Table.
     */
    private buildLqiTableRequest(startIndex: number): Buffer {
        this.writeUInt8(startIndex);

        return this.getWritten();
    }

    /**
     * @see ClusterId.ROUTING_TABLE_REQUEST
     * @param startIndex Starting Index for the requested elements of the Neighbor Table.
     */
    private buildRoutingTableRequest(startIndex: number): Buffer {
        this.writeUInt8(startIndex);

        return this.getWritten();
    }

    /**
     * @see ClusterId.BINDING_TABLE_REQUEST
     * @param startIndex Starting Index for the requested elements of the Neighbor Table.
     */
    private buildBindingTableRequest(startIndex: number): Buffer {
        this.writeUInt8(startIndex);

        return this.getWritten();
    }

    /**
     * @see ClusterId.LEAVE_REQUEST
     * @param deviceAddress All zeros if the target is to remove itself from the network or
     *   the EUI64 of a child of the target device to remove that child.
     * @param leaveRequestFlags A bitmask of leave options. Include ::AND_REJOIN if the target is to rejoin the network immediately after leaving.
     */
    private buildLeaveRequest(deviceAddress: EUI64, leaveRequestFlags: LeaveRequestFlags): Buffer {
        this.writeIeeeAddr(deviceAddress);
        this.writeUInt8(leaveRequestFlags);

        return this.getWritten();
    }

    /**
     * @see ClusterId.PERMIT_JOINING_REQUEST
     * @param duration A value of 0x00 disables joining. A value of 0xFF enables joining. Any other value enables joining for that number of seconds.
     * @param authentication Controls Trust Center authentication behavior.
     *   This field SHALL always have a value of 1, indicating a request to change the Trust Center policy.
     *   If a frame is received with a value of 0, it shall be treated as having a value of 1.
     */
    private buildPermitJoining(duration: number, authentication: number, tlvs: TLV[]): Buffer {
        this.writeUInt8(duration);
        this.writeUInt8(authentication);
        // BeaconAppendixEncapsulationGlobalTLV
        //   - SupportedKeyNegotiationMethodsGlobalTLV
        //   - FragmentationParametersGlobalTLV
        this.writeGlobalTLVs(tlvs);

        return this.getWritten();
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
    private buildNwkUpdateRequest(
        channels: number[],
        duration: number,
        count: number | undefined,
        nwkUpdateId: number | undefined,
        nwkManagerAddr: number | undefined,
    ): Buffer {
        this.writeUInt32(ZSpecUtils.channelsToUInt32Mask(channels));
        this.writeUInt8(duration);

        if (count !== undefined && duration >= 0x00 && duration <= 0x05) {
            this.writeUInt8(count);
        }

        // TODO: What does "This value is set by the Network Channel Manager prior to sending the message." mean exactly??
        //       (isn't used/mentioned in EmberZNet, confirmed working if not set at all for channel change)
        // for now, allow to bypass with undefined, otherwise should throw if undefined and duration passes below conditions (see NwkEnhancedUpdateRequest)
        if (nwkUpdateId !== undefined && (duration === 0xfe || duration === 0xff)) {
            this.writeUInt8(nwkUpdateId);
        }

        if (nwkManagerAddr !== undefined && duration === 0xff) {
            this.writeUInt16(nwkManagerAddr);
        }

        return this.getWritten();
    }

    // /**
    //  * Shortcut for @see BuffaloZdo.buildNwkUpdateRequest
    //  */
    // private buildScanChannelsRequest(scanChannels: number[], duration: number, count: number): Buffer {
    //     return this.buildNwkUpdateRequest(scanChannels, duration, count, undefined, undefined);
    // }

    // /**
    //  * Shortcut for @see BuffaloZdo.buildNwkUpdateRequest
    //  */
    // private buildChannelChangeRequest(channel: number, nwkUpdateId: number | undefined): Buffer {
    //     return this.buildNwkUpdateRequest([channel], 0xfe, undefined, nwkUpdateId, undefined);
    // }

    // /**
    //  * Shortcut for @see BuffaloZdo.buildNwkUpdateRequest
    //  */
    // private buildSetActiveChannelsAndNwkManagerIdRequest(channels: number[], nwkUpdateId: number | undefined, nwkManagerAddr: NodeId): Buffer {
    //     return this.buildNwkUpdateRequest(channels, 0xff, undefined, nwkUpdateId, nwkManagerAddr);
    // }

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
    private buildNwkEnhancedUpdateRequest(
        channelPages: number[],
        duration: number,
        count: number | undefined,
        nwkUpdateId: number | undefined,
        nwkManagerAddr: NodeId | undefined,
        configurationBitmask: number | undefined,
    ): Buffer {
        this.writeUInt8(channelPages.length);

        for (const channelPage of channelPages) {
            this.writeUInt32(channelPage);
        }

        this.writeUInt8(duration);

        if (count !== undefined && duration >= 0x00 && duration <= 0x05) {
            this.writeUInt8(count);
        }

        if (nwkUpdateId !== undefined && (duration === 0xfe || duration === 0xff)) {
            this.writeUInt8(nwkUpdateId);
        }

        if (nwkManagerAddr !== undefined && duration === 0xff) {
            this.writeUInt16(nwkManagerAddr);
        }

        if (configurationBitmask !== undefined) {
            this.writeUInt8(configurationBitmask);
        }

        return this.getWritten();
    }

    // /**
    //  * Shortcut for @see BuffaloZdo.buildNwkEnhancedUpdateRequest
    //  */
    // private buildEnhancedScanChannelsRequest(channelPages: number[], duration: number, count: number, configurationBitmask: number | undefined): Buffer {
    //     return this.buildNwkEnhancedUpdateRequest(channelPages, duration, count, undefined, undefined, configurationBitmask);
    // }

    // /**
    //  * Shortcut for @see BuffaloZdo.buildNwkEnhancedUpdateRequest
    //  */
    // private buildEnhancedChannelChangeRequest(channelPage: number, nwkUpdateId: number | undefined, configurationBitmask: number | undefined): Buffer {
    //     return this.buildNwkEnhancedUpdateRequest([channelPage], 0xfe, undefined, nwkUpdateId, undefined, configurationBitmask);
    // }

    // /**
    //  * Shortcut for @see BuffaloZdo.buildNwkEnhancedUpdateRequest
    //  */
    // private buildEnhancedSetActiveChannelsAndNwkManagerIdRequest(
    //     channelPages: number[],
    //     nwkUpdateId: number | undefined,
    //     nwkManagerAddr: NodeId,
    //     configurationBitmask: number | undefined,
    // ): Buffer {
    //     return this.buildNwkEnhancedUpdateRequest(channelPages, 0xff, undefined, nwkUpdateId, nwkManagerAddr, configurationBitmask);
    // }

    /**
     * @see ClusterId.NWK_IEEE_JOINING_LIST_REQUEST
     * @param startIndex The starting index into the receiving device’s nwkIeeeJoiningList that SHALL be sent back.
     */
    private buildNwkIEEEJoiningListRequest(startIndex: number): Buffer {
        this.writeUInt8(startIndex);

        return this.getWritten();
    }

    /**
     * @see ClusterId.NWK_BEACON_SURVEY_REQUEST
     */
    private buildNwkBeaconSurveyRequest(tlv: BeaconSurveyConfigurationTLV): Buffer {
        // BeaconSurveyConfigurationTLV: Local: ID: 0x00
        this.writeUInt8(0x00);
        this.writeUInt8(2 + tlv.scanChannelList.length * 4 - 1);
        this.writeUInt8(tlv.scanChannelList.length);
        this.writeListUInt32(tlv.scanChannelList);
        this.writeUInt8(tlv.configurationBitmask);

        return this.getWritten();
    }

    /**
     * @see ClusterId.START_KEY_NEGOTIATION_REQUEST
     */
    private buildStartKeyNegotiationRequest(tlv: Curve25519PublicPointTLV): Buffer {
        // Curve25519PublicPointTLV: Local: ID: 0x00
        this.writeUInt8(0x00);
        this.writeUInt8(EUI64_SIZE + CURVE_PUBLIC_POINT_SIZE - 1);
        this.writeIeeeAddr(tlv.eui64);
        this.writeBuffer(tlv.publicPoint, CURVE_PUBLIC_POINT_SIZE);

        return this.getWritten();
    }

    /**
     * @see ClusterId.RETRIEVE_AUTHENTICATION_TOKEN_REQUEST
     */
    private buildRetrieveAuthenticationTokenRequest(tlv: AuthenticationTokenIdTLV): Buffer {
        // AuthenticationTokenIdTLV: Local: ID: 0x00
        this.writeUInt8(0x00);
        this.writeUInt8(1 - 1);
        this.writeUInt8(tlv.tlvTypeTagId);

        return this.getWritten();
    }

    /**
     * @see ClusterId.GET_AUTHENTICATION_LEVEL_REQUEST
     */
    private buildGetAuthenticationLevelRequest(tlv: TargetIEEEAddressTLV): Buffer {
        // TargetIEEEAddressTLV: Local: ID: 0x00
        this.writeUInt8(0x00);
        this.writeUInt8(EUI64_SIZE - 1);
        this.writeIeeeAddr(tlv.ieee);

        return this.getWritten();
    }

    /**
     * @see ClusterId.SET_CONFIGURATION_REQUEST
     */
    private buildSetConfigurationRequest(
        nextPanIdChange: NextPanIdChangeGlobalTLV,
        nextChannelChange: NextChannelChangeGlobalTLV,
        configurationParameters: ConfigurationParametersGlobalTLV,
    ): Buffer {
        this.writeGlobalTLV({tagId: GlobalTLV.NEXT_PAN_ID_CHANGE, length: PAN_ID_SIZE, tlv: nextPanIdChange});
        this.writeGlobalTLV({tagId: GlobalTLV.NEXT_CHANNEL_CHANGE, length: 4, tlv: nextChannelChange});
        this.writeGlobalTLV({tagId: GlobalTLV.CONFIGURATION_PARAMETERS, length: 2, tlv: configurationParameters});

        return this.getWritten();
    }

    /**
     * @see ClusterId.GET_CONFIGURATION_REQUEST
     * @param tlvIds The IDs of each TLV that are being requested.
     *   Maximum number dependent on the underlying maximum size of the message as allowed by fragmentation.
     */
    private buildGetConfigurationRequest(tlvIds: number[]): Buffer {
        this.writeUInt8(tlvIds.length);

        for (const tlvId of tlvIds) {
            this.writeUInt8(tlvId);
        }

        return this.getWritten();
    }

    /**
     * @see ClusterId.START_KEY_UPDATE_REQUEST
     */
    private buildStartKeyUpdateRequest(
        selectedKeyNegotiationMethod: SelectedKeyNegotiationMethodTLV,
        fragmentationParameters: FragmentationParametersGlobalTLV,
    ): Buffer {
        // SelectedKeyNegotiationMethodTLV: Local: ID: 0x00
        this.writeUInt8(0x00);
        this.writeUInt8(EUI64_SIZE + 2 - 1);
        this.writeUInt8(selectedKeyNegotiationMethod.protocol);
        this.writeUInt8(selectedKeyNegotiationMethod.presharedSecret);
        this.writeIeeeAddr(selectedKeyNegotiationMethod.sendingDeviceEui64);

        {
            let length = 2;

            if (fragmentationParameters.fragmentationOptions) {
                length += 1;
            }

            if (fragmentationParameters.maxIncomingTransferUnit) {
                length += 2;
            }

            this.writeGlobalTLV({tagId: GlobalTLV.FRAGMENTATION_PARAMETERS, length, tlv: fragmentationParameters});
        }

        return this.getWritten();
    }

    /**
     * @see ClusterId.DECOMMISSION_REQUEST
     */
    private buildDecommissionRequest(tlv: DeviceEUI64ListTLV): Buffer {
        // DeviceEUI64ListTLV: Local: ID: 0x00
        this.writeUInt8(0x00);
        this.writeUInt8(tlv.eui64List.length * EUI64_SIZE + 1 - 1);
        this.writeUInt8(tlv.eui64List.length);

        for (const eui64 of tlv.eui64List) {
            this.writeIeeeAddr(eui64);
        }

        return this.getWritten();
    }

    /**
     * @see ClusterId.CHALLENGE_REQUEST
     */
    private buildChallengeRequest(tlv: APSFrameCounterChallengeTLV): Buffer {
        // APSFrameCounterChallengeTLV: Local: ID: 0x00
        this.writeUInt8(0x00);
        this.writeUInt8(EUI64_SIZE + CHALLENGE_VALUE_SIZE - 1);
        this.writeIeeeAddr(tlv.senderEui64);
        this.writeBuffer(tlv.challengeValue, CHALLENGE_VALUE_SIZE);

        return this.getWritten();
    }
    //-- RESPONSES

    public static checkStatus<K extends keyof ValidResponseMap>(result: ResponseMap[number]): result is ValidResponseMap[K] {
        return result[0] === Status.SUCCESS;
    }

    public static readResponse<K extends number>(
        hasZdoMessageOverhead: boolean,
        clusterId: K extends keyof ResponseMap ? keyof ResponseMap : K,
        buffer: Buffer,
    ): ResponseMap[K] {
        const buffalo = new BuffaloZdo(buffer, hasZdoMessageOverhead ? ZDO_MESSAGE_OVERHEAD : 0); // set pos to skip `transaction sequence number`

        switch (clusterId) {
            case ZdoClusterId.NETWORK_ADDRESS_RESPONSE: {
                return buffalo.readNetworkAddressResponse() as ResponseMap[K];
            }
            case ZdoClusterId.IEEE_ADDRESS_RESPONSE: {
                return buffalo.readIEEEAddressResponse() as ResponseMap[K];
            }
            case ZdoClusterId.NODE_DESCRIPTOR_RESPONSE: {
                return buffalo.readNodeDescriptorResponse() as ResponseMap[K];
            }
            case ZdoClusterId.POWER_DESCRIPTOR_RESPONSE: {
                return buffalo.readPowerDescriptorResponse() as ResponseMap[K];
            }
            case ZdoClusterId.SIMPLE_DESCRIPTOR_RESPONSE: {
                return buffalo.readSimpleDescriptorResponse() as ResponseMap[K];
            }
            case ZdoClusterId.ACTIVE_ENDPOINTS_RESPONSE: {
                return buffalo.readActiveEndpointsResponse() as ResponseMap[K];
            }
            case ZdoClusterId.MATCH_DESCRIPTORS_RESPONSE: {
                return buffalo.readMatchDescriptorsResponse() as ResponseMap[K];
            }
            case ZdoClusterId.END_DEVICE_ANNOUNCE: {
                return buffalo.readEndDeviceAnnounce() as ResponseMap[K];
            }
            case ZdoClusterId.SYSTEM_SERVER_DISCOVERY_RESPONSE: {
                return buffalo.readSystemServerDiscoveryResponse() as ResponseMap[K];
            }
            case ZdoClusterId.PARENT_ANNOUNCE_RESPONSE: {
                return buffalo.readParentAnnounceResponse() as ResponseMap[K];
            }
            case ZdoClusterId.BIND_RESPONSE: {
                return buffalo.readBindResponse() as ResponseMap[K];
            }
            case ZdoClusterId.UNBIND_RESPONSE: {
                return buffalo.readUnbindResponse() as ResponseMap[K];
            }
            case ZdoClusterId.CLEAR_ALL_BINDINGS_RESPONSE: {
                return buffalo.readClearAllBindingsResponse() as ResponseMap[K];
            }
            case ZdoClusterId.LQI_TABLE_RESPONSE: {
                return buffalo.readLQITableResponse() as ResponseMap[K];
            }
            case ZdoClusterId.ROUTING_TABLE_RESPONSE: {
                return buffalo.readRoutingTableResponse() as ResponseMap[K];
            }
            case ZdoClusterId.BINDING_TABLE_RESPONSE: {
                return buffalo.readBindingTableResponse() as ResponseMap[K];
            }
            case ZdoClusterId.LEAVE_RESPONSE: {
                return buffalo.readLeaveResponse() as ResponseMap[K];
            }
            case ZdoClusterId.PERMIT_JOINING_RESPONSE: {
                return buffalo.readPermitJoiningResponse() as ResponseMap[K];
            }
            case ZdoClusterId.NWK_UPDATE_RESPONSE: {
                return buffalo.readNwkUpdateResponse() as ResponseMap[K];
            }
            case ZdoClusterId.NWK_ENHANCED_UPDATE_RESPONSE: {
                return buffalo.readNwkEnhancedUpdateResponse() as ResponseMap[K];
            }
            case ZdoClusterId.NWK_IEEE_JOINING_LIST_RESPONSE: {
                return buffalo.readNwkIEEEJoiningListResponse() as ResponseMap[K];
            }
            case ZdoClusterId.NWK_UNSOLICITED_ENHANCED_UPDATE_RESPONSE: {
                return buffalo.readNwkUnsolicitedEnhancedUpdateResponse() as ResponseMap[K];
            }
            case ZdoClusterId.NWK_BEACON_SURVEY_RESPONSE: {
                return buffalo.readNwkBeaconSurveyResponse() as ResponseMap[K];
            }
            case ZdoClusterId.START_KEY_NEGOTIATION_RESPONSE: {
                return buffalo.readStartKeyNegotiationResponse() as ResponseMap[K];
            }
            case ZdoClusterId.RETRIEVE_AUTHENTICATION_TOKEN_RESPONSE: {
                return buffalo.readRetrieveAuthenticationTokenResponse() as ResponseMap[K];
            }
            case ZdoClusterId.GET_AUTHENTICATION_LEVEL_RESPONSE: {
                return buffalo.readGetAuthenticationLevelResponse() as ResponseMap[K];
            }
            case ZdoClusterId.SET_CONFIGURATION_RESPONSE: {
                return buffalo.readSetConfigurationResponse() as ResponseMap[K];
            }
            case ZdoClusterId.GET_CONFIGURATION_RESPONSE: {
                return buffalo.readGetConfigurationResponse() as ResponseMap[K];
            }
            case ZdoClusterId.START_KEY_UPDATE_RESPONSE: {
                return buffalo.readStartKeyUpdateResponse() as ResponseMap[K];
            }
            case ZdoClusterId.DECOMMISSION_RESPONSE: {
                return buffalo.readDecommissionResponse() as ResponseMap[K];
            }
            case ZdoClusterId.CHALLENGE_RESPONSE: {
                return buffalo.readChallengeResponse() as ResponseMap[K];
            }
            default: {
                throw new Error(`Unsupported response reading for cluster ID '${clusterId}'.`);
            }
        }
    }

    /**
     * @see ClusterId.NETWORK_ADDRESS_RESPONSE
     */
    public readNetworkAddressResponse(): ResponseMap[ZdoClusterId.NETWORK_ADDRESS_RESPONSE] {
        // INV_REQUESTTYPE or DEVICE_NOT_FOUND
        const status: Status = this.readUInt8();
        let result: NetworkAddressResponse | undefined;

        if (status == Status.SUCCESS) {
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

            result = {
                eui64,
                nwkAddress,
                startIndex,
                assocDevList,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.IEEE_ADDRESS_RESPONSE
     */
    public readIEEEAddressResponse(): ResponseMap[ZdoClusterId.IEEE_ADDRESS_RESPONSE] {
        // INV_REQUESTTYPE or DEVICE_NOT_FOUND
        const status: Status = this.readUInt8();
        let result: IEEEAddressResponse | undefined;

        if (status === Status.SUCCESS) {
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

            result = {
                eui64,
                nwkAddress,
                startIndex,
                assocDevList,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.NODE_DESCRIPTOR_RESPONSE
     */
    public readNodeDescriptorResponse(): ResponseMap[ZdoClusterId.NODE_DESCRIPTOR_RESPONSE] {
        // DEVICE_NOT_FOUND, INV_REQUESTTYPE, or NO_DESCRIPTOR
        const status: Status = this.readUInt8();
        let result: NodeDescriptorResponse | undefined;

        if (status === Status.SUCCESS) {
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

            result = {
                nwkAddress,
                logicalType: nodeDescByte1 & 0x07,
                fragmentationSupported: serverMask.stackComplianceRevision >= 23 ? (nodeDescByte1 & 0x20) >> 5 === 1 : undefined,
                apsFlags: nodeDescByte2 & 0x07,
                frequencyBand: (nodeDescByte2 & 0xf8) >> 3,
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

        return [status, result];
    }

    /**
     * @see ClusterId.POWER_DESCRIPTOR_RESPONSE
     */
    public readPowerDescriptorResponse(): ResponseMap[ZdoClusterId.POWER_DESCRIPTOR_RESPONSE] {
        // DEVICE_NOT_FOUND, INV_REQUESTTYPE, or NO_DESCRIPTOR
        const status: Status = this.readUInt8();
        let result: PowerDescriptorResponse | undefined;

        if (status === Status.SUCCESS) {
            const nwkAddress = this.readUInt16();
            const byte1 = this.readUInt8();
            const byte2 = this.readUInt8();

            result = {
                nwkAddress,
                currentPowerMode: byte1 & 0xf,
                availPowerSources: (byte1 >> 4) & 0xf,
                currentPowerSource: byte2 & 0xf,
                currentPowerSourceLevel: (byte2 >> 4) & 0xf,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.SIMPLE_DESCRIPTOR_RESPONSE
     */
    public readSimpleDescriptorResponse(): ResponseMap[ZdoClusterId.SIMPLE_DESCRIPTOR_RESPONSE] {
        // INVALID_EP, NOT_ACTIVE, DEVICE_NOT_FOUND, INV_REQUESTTYPE or NO_DESCRIPTOR
        const status: Status = this.readUInt8();
        let result: SimpleDescriptorResponse | undefined;

        if (status === Status.SUCCESS) {
            const nwkAddress = this.readUInt16();
            // Length in bytes of the Simple Descriptor to follow. [0x00-0xff]
            const length = this.readUInt8();
            const endpoint = this.readUInt8();
            const profileId = this.readUInt16();
            const deviceId = this.readUInt16();
            const deviceVersion = this.readUInt8();
            const inClusterCount = this.readUInt8();
            const inClusterList = this.readListUInt16(inClusterCount); // empty if inClusterCount==0
            const outClusterCount = this.readUInt8();
            const outClusterList = this.readListUInt16(outClusterCount); // empty if outClusterCount==0

            result = {
                nwkAddress,
                length,
                endpoint,
                profileId,
                deviceId,
                deviceVersion,
                inClusterList,
                outClusterList,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.ACTIVE_ENDPOINTS_RESPONSE
     */
    public readActiveEndpointsResponse(): ResponseMap[ZdoClusterId.ACTIVE_ENDPOINTS_RESPONSE] {
        // DEVICE_NOT_FOUND, INV_REQUESTTYPE, or NO_DESCRIPTOR
        const status: Status = this.readUInt8();
        let result: ActiveEndpointsResponse | undefined;

        if (status === Status.SUCCESS) {
            const nwkAddress = this.readUInt16();
            const endpointCount = this.readUInt8();
            const endpointList = this.readListUInt8(endpointCount);

            result = {
                nwkAddress,
                endpointList,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.MATCH_DESCRIPTORS_RESPONSE
     */
    public readMatchDescriptorsResponse(): ResponseMap[ZdoClusterId.MATCH_DESCRIPTORS_RESPONSE] {
        // DEVICE_NOT_FOUND, INV_REQUESTTYPE, or NO_DESCRIPTOR
        const status: Status = this.readUInt8();
        let result: MatchDescriptorsResponse | undefined;

        if (status === Status.SUCCESS) {
            const nwkAddress = this.readUInt16();
            const endpointCount = this.readUInt8();
            const endpointList = this.readListUInt8(endpointCount);

            result = {
                nwkAddress,
                endpointList,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.END_DEVICE_ANNOUNCE
     */
    public readEndDeviceAnnounce(): ResponseMap[ZdoClusterId.END_DEVICE_ANNOUNCE] {
        const nwkAddress = this.readUInt16();
        const eui64 = this.readIeeeAddr();
        /** @see MACCapabilityFlags */
        const capabilities = this.readUInt8();

        return [Status.SUCCESS, {nwkAddress, eui64, capabilities: Utils.getMacCapFlags(capabilities)}];
    }

    /**
     * @see ClusterId.SYSTEM_SERVER_DISCOVERY_RESPONSE
     */
    public readSystemServerDiscoveryResponse(): ResponseMap[ZdoClusterId.SYSTEM_SERVER_DISCOVERY_RESPONSE] {
        // never expected !== SUCCESS
        const status: Status = this.readUInt8();
        let result: SystemServerDiscoveryResponse | undefined;

        if (status === Status.SUCCESS) {
            const serverMask = Utils.getServerMask(this.readUInt16());

            result = {
                serverMask,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.PARENT_ANNOUNCE_RESPONSE
     */
    public readParentAnnounceResponse(): ResponseMap[ZdoClusterId.PARENT_ANNOUNCE_RESPONSE] {
        // NOT_SUPPORTED
        const status: Status = this.readUInt8();
        let result: ParentAnnounceResponse | undefined;

        if (status === Status.SUCCESS) {
            const numberOfChildren = this.readUInt8();
            const children: EUI64[] = [];

            for (let i = 0; i < numberOfChildren; i++) {
                const childEui64 = this.readIeeeAddr();

                children.push(childEui64);
            }

            result = {children};
        }

        return [status, result];
    }

    /**
     * @see ClusterId.BIND_RESPONSE
     * @returns No response payload, throws if not success
     */
    public readBindResponse(): ResponseMap[ZdoClusterId.BIND_RESPONSE] {
        // NOT_SUPPORTED, INVALID_EP, TABLE_FULL, or NOT_AUTHORIZED
        const status: Status = this.readUInt8();

        return [status, undefined];
    }

    /**
     * @see ClusterId.UNBIND_RESPONSE
     * @returns No response payload, throws if not success
     */
    public readUnbindResponse(): ResponseMap[ZdoClusterId.UNBIND_RESPONSE] {
        // NOT_SUPPORTED, INVALID_EP, NO_ENTRY or NOT_AUTHORIZED
        const status: Status = this.readUInt8();

        return [status, undefined];
    }

    /**
     * @see ClusterId.CLEAR_ALL_BINDINGS_RESPONSE
     * @returns No response payload, throws if not success
     */
    public readClearAllBindingsResponse(): ResponseMap[ZdoClusterId.CLEAR_ALL_BINDINGS_RESPONSE] {
        // NOT_SUPPORTED, NOT_AUTHORIZED, INV_REQUESTTYPE, or NO_MATCH.
        const status: Status = this.readUInt8();

        return [status, undefined];
    }

    /**
     * @see ClusterId.LQI_TABLE_RESPONSE
     */
    public readLQITableResponse(): ResponseMap[ZdoClusterId.LQI_TABLE_RESPONSE] {
        // NOT_SUPPORTED or any status code returned from the NLME-GET.confirm primitive.
        const status: Status = this.readUInt8();
        let result: LQITableResponse | undefined;

        if (status === Status.SUCCESS) {
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
                    rxOnWhenIdle: (deviceTypeByte & 0x0c) >> 2,
                    relationship: (deviceTypeByte & 0x70) >> 4,
                    reserved1: (deviceTypeByte & 0x10) >> 7,
                    permitJoining: permitJoiningByte & 0x03,
                    reserved2: (permitJoiningByte & 0xfc) >> 2,
                    depth,
                    lqi,
                });
            }

            result = {
                neighborTableEntries,
                startIndex,
                entryList,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.ROUTING_TABLE_RESPONSE
     */
    public readRoutingTableResponse(): ResponseMap[ZdoClusterId.ROUTING_TABLE_RESPONSE] {
        // NOT_SUPPORTED or any status code returned from the NLMEGET.confirm primitive.
        const status: Status = this.readUInt8();
        let result: RoutingTableResponse | undefined;

        if (status === Status.SUCCESS) {
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
                    status: RoutingTableStatus[statusByte & 0x07] as keyof typeof RoutingTableStatus,
                    memoryConstrained: (statusByte & 0x08) >> 3,
                    manyToOne: (statusByte & 0x10) >> 4,
                    routeRecordRequired: (statusByte & 0x20) >> 5,
                    reserved1: (statusByte & 0xc0) >> 6,
                    nextHopAddress,
                });
            }

            result = {
                routingTableEntries,
                startIndex,
                entryList,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.BINDING_TABLE_RESPONSE
     */
    public readBindingTableResponse(): ResponseMap[ZdoClusterId.BINDING_TABLE_RESPONSE] {
        // NOT_SUPPORTED or any status code returned from the APSMEGET.confirm primitive.
        const status: Status = this.readUInt8();
        let result: BindingTableResponse | undefined;

        if (status === Status.SUCCESS) {
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
                const dest = destAddrMode === 0x01 ? this.readUInt16() : destAddrMode === 0x03 ? this.readIeeeAddr() : undefined;
                const destEndpoint = destAddrMode === 0x03 ? this.readUInt8() : undefined;

                if (dest === undefined) {
                    // not supported (using reserved value)
                    continue;
                }

                entryList.push({
                    sourceEui64,
                    sourceEndpoint,
                    clusterId,
                    destAddrMode,
                    dest,
                    destEndpoint,
                });
            }

            result = {
                bindingTableEntries,
                startIndex,
                entryList,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.LEAVE_RESPONSE
     * @returns No response payload, throws if not success
     */
    public readLeaveResponse(): ResponseMap[ZdoClusterId.LEAVE_RESPONSE] {
        // NOT_SUPPORTED, NOT_AUTHORIZED or any status code returned from the NLMELEAVE.confirm primitive.
        const status: Status = this.readUInt8();

        return [status, undefined];
    }

    /**
     * @see ClusterId.PERMIT_JOINING_RESPONSE
     * @returns No response payload, throws if not success
     */
    public readPermitJoiningResponse(): ResponseMap[ZdoClusterId.PERMIT_JOINING_RESPONSE] {
        // INV_REQUESTTYPE, NOT_AUTHORIZED, or any status code returned from the NLME-PERMIT-JOINING.confirm primitive.
        const status: Status = this.readUInt8();

        return [status, undefined];
    }

    /**
     * @see ClusterId.NWK_UPDATE_RESPONSE
     */
    public readNwkUpdateResponse(): ResponseMap[ZdoClusterId.NWK_UPDATE_RESPONSE] {
        // INV_REQUESTTYPE, NOT_SUPPORTED, or any status values returned from the MLME-SCAN.confirm primitive
        const status: Status = this.readUInt8();
        let result: NwkUpdateResponse | undefined;

        if (status === Status.SUCCESS) {
            const scannedChannels = this.readUInt32();
            const totalTransmissions = this.readUInt16();
            const totalFailures = this.readUInt16();
            // [0x00-0xFF]
            const entryCount = this.readUInt8();
            const entryList = this.readListUInt8(entryCount);

            result = {
                scannedChannels,
                totalTransmissions,
                totalFailures,
                entryList,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.NWK_ENHANCED_UPDATE_RESPONSE
     */
    public readNwkEnhancedUpdateResponse(): ResponseMap[ZdoClusterId.NWK_ENHANCED_UPDATE_RESPONSE] {
        // INV_REQUESTTYPE, NOT_SUPPORTED, or any status values returned from the MLME-SCAN.confirm primitive.
        const status: Status = this.readUInt8();
        let result: NwkEnhancedUpdateResponse | undefined;

        if (status === Status.SUCCESS) {
            const scannedChannels = this.readUInt32();
            const totalTransmissions = this.readUInt16();
            const totalFailures = this.readUInt16();
            // [0x00-0xFF]
            const entryCount = this.readUInt8();
            const entryList = this.readListUInt8(entryCount);

            result = {
                scannedChannels,
                totalTransmissions,
                totalFailures,
                entryList,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.NWK_IEEE_JOINING_LIST_REPONSE
     */
    public readNwkIEEEJoiningListResponse(): ResponseMap[ZdoClusterId.NWK_IEEE_JOINING_LIST_RESPONSE] {
        // INV_REQUESTTYPE, or NOT_SUPPORTED
        const status: Status = this.readUInt8();
        let result: NwkIEEEJoiningListResponse | undefined;

        if (status === Status.SUCCESS) {
            const updateId = this.readUInt8();
            const joiningPolicy = this.readUInt8();
            // [0x00-0xFF]
            const entryListTotal = this.readUInt8();
            let startIndex: number | undefined;
            let entryList: EUI64[] | undefined;

            if (entryListTotal > 0) {
                startIndex = this.readUInt8();
                const entryCount = this.readUInt8();
                entryList = [];

                for (let i = 0; i < entryCount; i++) {
                    const ieee = this.readIeeeAddr();

                    entryList.push(ieee);
                }
            }

            result = {
                updateId,
                joiningPolicy,
                entryListTotal,
                startIndex,
                entryList,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.NWK_UNSOLICITED_ENHANCED_UPDATE_RESPONSE
     */
    public readNwkUnsolicitedEnhancedUpdateResponse(): ResponseMap[ZdoClusterId.NWK_UNSOLICITED_ENHANCED_UPDATE_RESPONSE] {
        // ??
        const status: Status = this.readUInt8();
        let result: NwkUnsolicitedEnhancedUpdateResponse | undefined;

        if (status === Status.SUCCESS) {
            const channelInUse = this.readUInt32();
            const macTxUCastTotal = this.readUInt16();
            const macTxUCastFailures = this.readUInt16();
            const macTxUCastRetries = this.readUInt16();
            const timePeriod = this.readUInt8();

            result = {
                channelInUse,
                macTxUCastTotal,
                macTxUCastFailures,
                macTxUCastRetries,
                timePeriod,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.NWK_BEACON_SURVEY_RESPONSE
     */
    public readNwkBeaconSurveyResponse(): ResponseMap[ZdoClusterId.NWK_BEACON_SURVEY_RESPONSE] {
        // INV_REQUESTTYPE, or NOT_SUPPORTED
        const status: Status = this.readUInt8();
        let result: NwkBeaconSurveyResponse | undefined;

        if (status === Status.SUCCESS) {
            const localTLVs = new Map<number, LocalTLVReader>([
                // Local: ID: 0x01: BeaconSurveyResultsTLV
                [0x01, this.readBeaconSurveyResultsTLV],
                // Local: ID: 0x02: PotentialParentsTLV
                [0x02, this.readPotentialParentsTLV],
            ]);
            const tlvs: TLV[] = this.readTLVs(localTLVs);

            result = {
                tlvs,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.START_KEY_NEGOTIATION_RESPONSE
     */
    public readStartKeyNegotiationResponse(): ResponseMap[ZdoClusterId.START_KEY_NEGOTIATION_RESPONSE] {
        // INVALID_TLV, MISSING_TLV, TEMPORARY_FAILURE, NOT_AUTHORIZED
        const status: Status = this.readUInt8();
        let result: StartKeyNegotiationResponse | undefined;

        if (status === Status.SUCCESS) {
            const localTLVs = new Map<number, LocalTLVReader>([
                // Local: ID: 0x00: Curve25519PublicPointTLV
                [0x00, this.readCurve25519PublicPointTLV],
            ]);
            const tlvs: TLV[] = this.readTLVs(localTLVs);

            result = {
                tlvs,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.RETRIEVE_AUTHENTICATION_TOKEN_RESPONSE
     */
    public readRetrieveAuthenticationTokenResponse(): ResponseMap[ZdoClusterId.RETRIEVE_AUTHENTICATION_TOKEN_RESPONSE] {
        const status: Status = this.readUInt8();
        let result: RetrieveAuthenticationTokenResponse | undefined;

        if (status === Status.SUCCESS) {
            // no local TLV
            const tlvs: TLV[] = this.readTLVs();

            result = {
                tlvs,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.GET_AUTHENTICATION_LEVEL_RESPONSE
     */
    public readGetAuthenticationLevelResponse(): ResponseMap[ZdoClusterId.GET_AUTHENTICATION_LEVEL_RESPONSE] {
        // NOT_SUPPORTED, INV_REQUESTTYPE, MISSING_TLV, and NOT_AUTHORIZED
        const status: Status = this.readUInt8();
        let result: GetAuthenticationLevelResponse | undefined;

        if (status === Status.SUCCESS) {
            const localTLVs = new Map<number, LocalTLVReader>([
                // Local: ID: 0x00: DeviceAuthenticationLevelTLV
                [0x00, this.readDeviceAuthenticationLevelTLV],
            ]);
            const tlvs: TLV[] = this.readTLVs(localTLVs);

            result = {
                tlvs,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.SET_CONFIGURATION_RESPONSE
     */
    public readSetConfigurationResponse(): ResponseMap[ZdoClusterId.SET_CONFIGURATION_RESPONSE] {
        // INV_REQUESTTYPE, or NOT_SUPPORTED
        const status: Status = this.readUInt8();
        let result: SetConfigurationResponse | undefined;

        if (status === Status.SUCCESS) {
            const localTLVs = new Map<number, LocalTLVReader>([
                // Local: ID: 0x00: ProcessingStatusTLV
                [0x00, this.readProcessingStatusTLV],
            ]);
            const tlvs: TLV[] = this.readTLVs(localTLVs);

            result = {
                tlvs,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.GET_CONFIGURATION_RESPONSE
     */
    public readGetConfigurationResponse(): ResponseMap[ZdoClusterId.GET_CONFIGURATION_RESPONSE] {
        // INV_REQUESTTYPE, or NOT_SUPPORTED
        const status: Status = this.readUInt8();
        let result: GetConfigurationResponse | undefined;

        if (status === Status.SUCCESS) {
            // Global: IDs: x, y, z
            const tlvs: TLV[] = this.readTLVs();

            result = {
                tlvs,
            };
        }

        return [status, result];
    }

    /**
     * @see ClusterId.START_KEY_UPDATE_RESPONSE
     * @returns No response payload, throws if not success
     */
    public readStartKeyUpdateResponse(): ResponseMap[ZdoClusterId.START_KEY_UPDATE_RESPONSE] {
        // INV_REQUESTTYPE, NOT_AUTHORIZED or NOT_SUPPORTED
        const status: Status = this.readUInt8();

        return [status, undefined];
    }

    /**
     * @see ClusterId.DECOMMISSION_RESPONSE
     * @returns No response payload, throws if not success
     */
    public readDecommissionResponse(): ResponseMap[ZdoClusterId.DECOMMISSION_RESPONSE] {
        // INV_REQUESTTYPE, NOT_AUTHORIZED or NOT_SUPPORTED
        const status: Status = this.readUInt8();

        return [status, undefined];
    }

    /**
     * @see ClusterId.CHALLENGE_RESPONSE
     */
    public readChallengeResponse(): ResponseMap[ZdoClusterId.CHALLENGE_RESPONSE] {
        const status: Status = this.readUInt8();
        let result: ChallengeResponse | undefined;

        if (status === Status.SUCCESS) {
            const localTLVs = new Map<number, LocalTLVReader>([
                // Local: ID: 0x00: APSFrameCounterResponseTLV
                [0x00, this.readAPSFrameCounterResponseTLV],
            ]);
            const tlvs: TLV[] = this.readTLVs(localTLVs);

            result = {
                tlvs,
            };
        }

        return [status, result];
    }
}
