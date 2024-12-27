/* v8 ignore start */

import Buffalo from '../../../buffalo/buffalo';
import {GP_SINK_LIST_ENTRIES} from '../consts';
import {EmberGpApplicationId, EmberGpSinkType, EzspStatus, SLStatus} from '../enums';
import {
    Ember802154RadioPriorities,
    EmberAesMmoHashContext,
    EmberApsFrame,
    EmberBeaconClassificationParams,
    EmberBeaconData,
    EmberBeaconIterator,
    EmberBindingTableEntry,
    EmberCertificate283k1Data,
    EmberCertificateData,
    EmberChildData,
    EmberCurrentSecurityState,
    EmberDutyCycleLimits,
    EmberEndpointDescription,
    EmberGpAddress,
    EmberGpProxyTableEntry,
    EmberGpSinkListEntry,
    EmberGpSinkTableEntry,
    EmberInitialSecurityState,
    EmberKeyData,
    EmberMessageDigest,
    EmberMulticastTableEntry,
    EmberMultiPhyRadioParameters,
    EmberMultiprotocolPriorities,
    EmberNeighborTableEntry,
    EmberNetworkInitStruct,
    EmberNetworkParameters,
    EmberPerDeviceDutyCycle,
    EmberPrivateKey283k1Data,
    EmberPrivateKeyData,
    EmberPublicKey283k1Data,
    EmberPublicKeyData,
    EmberRouteTableEntry,
    EmberRxPacketInfo,
    EmberSignature283k1Data,
    EmberSignatureData,
    EmberSmacData,
    EmberTokenData,
    EmberTokenInfo,
    EmberTokTypeStackZllData,
    EmberTokTypeStackZllSecurity,
    EmberZigbeeNetwork,
    EmberZllAddressAssignment,
    EmberZllDeviceInfoRecord,
    EmberZllInitialSecurityState,
    EmberZllNetwork,
    EmberZllSecurityAlgorithmData,
    SecManAPSKeyMetadata,
    SecManContext,
    SecManKey,
    SecManNetworkKeyInfo,
} from '../types';
import {highByte} from '../utils/math';
import {
    EMBER_AES_HASH_BLOCK_SIZE,
    EMBER_CERTIFICATE_283K1_SIZE,
    EMBER_CERTIFICATE_SIZE,
    EMBER_ENCRYPTION_KEY_SIZE,
    EMBER_PRIVATE_KEY_283K1_SIZE,
    EMBER_PRIVATE_KEY_SIZE,
    EMBER_PUBLIC_KEY_283K1_SIZE,
    EMBER_PUBLIC_KEY_SIZE,
    EMBER_SIGNATURE_283K1_SIZE,
    EMBER_SIGNATURE_SIZE,
    EMBER_SMAC_SIZE,
    EXTENDED_PAN_ID_SIZE,
    EZSP_EXTENDED_FRAME_CONTROL_HB_INDEX,
    EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX,
    EZSP_EXTENDED_FRAME_CONTROL_RESERVED_MASK,
    EZSP_EXTENDED_FRAME_FORMAT_VERSION,
    EZSP_EXTENDED_FRAME_FORMAT_VERSION_MASK,
    EZSP_EXTENDED_FRAME_ID_HB_INDEX,
    EZSP_EXTENDED_FRAME_ID_LB_INDEX,
    EZSP_EXTENDED_PARAMETERS_INDEX,
    EZSP_FRAME_CONTROL_INDEX,
    EZSP_FRAME_ID_INDEX,
    EZSP_PARAMETERS_INDEX,
} from './consts';
import {EzspFrameID} from './enums';

/**
 * Handle EmberStatus deprecation in v14+ for previous versions
 */
const EMBER_TO_SL_STATUS_MAP: ReadonlyMap<number, SLStatus> = new Map([
    [0x02 /*BAD_ARGUMENT*/, SLStatus.INVALID_PARAMETER],
    [0x18 /*NO_BUFFERS*/, SLStatus.ALLOCATION_FAILED],
    [0x19 /*PACKET_HANDOFF_DROP_PACKET*/, SLStatus.ZIGBEE_PACKET_HANDOFF_DROPPED],
    [0x66 /*DELIVERY_FAILED*/, SLStatus.ZIGBEE_DELIVERY_FAILED],
    [0x70 /*INVALID_CALL*/, SLStatus.INVALID_STATE],
    [0x72 /*MAX_MESSAGE_LIMIT_REACHED*/, SLStatus.ZIGBEE_MAX_MESSAGE_LIMIT_REACHED],
    [0x74 /*MESSAGE_TOO_LONG*/, SLStatus.MESSAGE_TOO_LONG],
    [0x75 /*BINDING_IS_ACTIVE*/, SLStatus.ZIGBEE_BINDING_IS_ACTIVE],
    [0x76 /*ADDRESS_TABLE_ENTRY_IS_ACTIVE*/, SLStatus.ZIGBEE_ADDRESS_TABLE_ENTRY_IS_ACTIVE],
    [0x90 /*NETWORK_UP*/, SLStatus.NETWORK_UP],
    [0x91 /*NETWORK_DOWN*/, SLStatus.NETWORK_DOWN],
    [0x93 /*NOT_JOINED*/, SLStatus.NOT_JOINED],
    [0x95 /*INVALID_SECURITY_LEVEL*/, SLStatus.ZIGBEE_INVALID_SECURITY_LEVEL],
    [0x96 /*MOVE_FAILED*/, SLStatus.ZIGBEE_MOVE_FAILED],
    [0x99 /*NODE_ID_CHANGED*/, SLStatus.ZIGBEE_NODE_ID_CHANGED],
    [0x9a /*PAN_ID_CHANGED*/, SLStatus.ZIGBEE_PAN_ID_CHANGED],
    [0x9b /*CHANNEL_CHANGED*/, SLStatus.ZIGBEE_CHANNEL_CHANGED],
    [0x9c /*NETWORK_OPENED*/, SLStatus.ZIGBEE_NETWORK_OPENED],
    [0x9d /*NETWORK_CLOSED*/, SLStatus.ZIGBEE_NETWORK_CLOSED],
    [0xa1 /*NETWORK_BUSY*/, SLStatus.BUSY],
    [0xa4 /*BINDING_HAS_CHANGED*/, SLStatus.ZIGBEE_BINDING_HAS_CHANGED],
    [0xa5 /*INSUFFICIENT_RANDOM_DATA*/, SLStatus.ZIGBEE_INSUFFICIENT_RANDOM_DATA],
    [0xa6 /*APS_ENCRYPTION_ERROR*/, SLStatus.ZIGBEE_APS_ENCRYPTION_ERROR],
    [0xa9 /*SOURCE_ROUTE_FAILURE*/, SLStatus.ZIGBEE_SOURCE_ROUTE_FAILURE],
    [0xa8 /*SECURITY_STATE_NOT_SET*/, SLStatus.ZIGBEE_SECURITY_STATE_NOT_SET],
    [0xaa /*MANY_TO_ONE_ROUTE_FAILURE*/, SLStatus.ZIGBEE_MANY_TO_ONE_ROUTE_FAILURE],
    [0xac /*RECEIVED_KEY_IN_THE_CLEAR*/, SLStatus.ZIGBEE_RECEIVED_KEY_IN_THE_CLEAR],
    [0xad /*NO_NETWORK_KEY_RECEIVED*/, SLStatus.ZIGBEE_NO_NETWORK_KEY_RECEIVED],
    [0xae /*NO_LINK_KEY_RECEIVED*/, SLStatus.ZIGBEE_NO_LINK_KEY_RECEIVED],
    [0xaf /*PRECONFIGURED_KEY_REQUIRED*/, SLStatus.ZIGBEE_PRECONFIGURED_KEY_REQUIRED],
    [0xb0 /*STACK_AND_HARDWARE_MISMATCH*/, SLStatus.ZIGBEE_STACK_AND_HARDWARE_MISMATCH],
    [0xb5 /*LIBRARY_NOT_PRESENT*/, SLStatus.NOT_AVAILABLE],
    [0xb8 /*TOO_SOON_FOR_SWITCH_KEY*/, SLStatus.ZIGBEE_TOO_SOON_FOR_SWITCH_KEY],
    [0xb9 /*SIGNATURE_VERIFY_FAILURE*/, SLStatus.ZIGBEE_SIGNATURE_VERIFY_FAILURE],
    [0xbb /*KEY_NOT_AUTHORIZED*/, SLStatus.ZIGBEE_KEY_NOT_AUTHORIZED],
    [0xbc /*TRUST_CENTER_EUI_HAS_CHANGED*/, SLStatus.ZIGBEE_TRUST_CENTER_SWAP_EUI_HAS_CHANGED],
    [0xbe /*IEEE_ADDRESS_DISCOVERY_IN_PROGRESS*/, SLStatus.ZIGBEE_IEEE_ADDRESS_DISCOVERY_IN_PROGRESS],
    [0xbf /*TRUST_CENTER_SWAPPED_OUT_EUI_HAS_NOT_CHANGED*/, SLStatus.ZIGBEE_TRUST_CENTER_SWAP_EUI_HAS_NOT_CHANGED],
]);

export class EzspBuffalo extends Buffalo {
    public getBufferLength(): number {
        return this.buffer.length;
    }

    /** Set the position of the internal position tracker. */
    public setPosition(position: number): void {
        this.position = position;
    }

    /**
     * Set the byte at given position without affecting the internal position tracker.
     * @param position
     * @param value
     */
    public setCommandByte(position: number, value: number): void {
        this.buffer.writeUInt8(value, position);
    }

    /**
     * Get the byte at given position without affecting the internal position tracker.
     * @param position
     * @returns
     */
    public getCommandByte(position: number): number {
        return this.buffer.readUInt8(position);
    }

    /**
     * Get the byte at given position without affecting the internal position tracker.
     * @param position
     * @returns
     */
    public getResponseByte(position: number): number {
        return this.buffer.readUInt8(position);
    }

    public getExtFrameControl(): number {
        return (this.getResponseByte(EZSP_EXTENDED_FRAME_CONTROL_HB_INDEX) << 8) | this.getResponseByte(EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX);
    }

    public getExtFrameId(): EzspFrameID {
        return (this.getResponseByte(EZSP_EXTENDED_FRAME_ID_HB_INDEX) << 8) | this.getResponseByte(EZSP_EXTENDED_FRAME_ID_LB_INDEX);
    }

    public getFrameId(): EzspFrameID {
        if (
            (this.getResponseByte(EZSP_EXTENDED_FRAME_CONTROL_HB_INDEX) & EZSP_EXTENDED_FRAME_FORMAT_VERSION_MASK) ===
            EZSP_EXTENDED_FRAME_FORMAT_VERSION
        ) {
            return this.getExtFrameId();
        } else {
            return this.getResponseByte(EZSP_FRAME_ID_INDEX) as EzspFrameID;
        }
    }

    /**
     * Get the frame control, ID and params index according to format version.
     * Throws if frame control is unsupported (using reserved).
     * @returns Anything but SUCCESS should stop further processing.
     */
    public getResponseMetadata(): [status: EzspStatus, frameControl: number, frameId: EzspFrameID, parametersIndex: number] {
        let status: EzspStatus = EzspStatus.SUCCESS;
        let frameControl: number;
        let frameId: EzspFrameID;
        let parametersIndex: number;

        if (
            (this.getResponseByte(EZSP_EXTENDED_FRAME_CONTROL_HB_INDEX) & EZSP_EXTENDED_FRAME_FORMAT_VERSION_MASK) ===
            EZSP_EXTENDED_FRAME_FORMAT_VERSION
        ) {
            // use extended ezsp frame format
            frameControl = this.getExtFrameControl();
            frameId = this.getExtFrameId();
            parametersIndex = EZSP_EXTENDED_PARAMETERS_INDEX;

            if (highByte(frameControl) & EZSP_EXTENDED_FRAME_CONTROL_RESERVED_MASK) {
                // reject if unsupported frame
                status = EzspStatus.ERROR_UNSUPPORTED_CONTROL;
            }
        } else {
            // use legacy ezsp frame format
            frameControl = this.getResponseByte(EZSP_FRAME_CONTROL_INDEX);
            frameId = this.getResponseByte(EZSP_FRAME_ID_INDEX) as EzspFrameID;
            parametersIndex = EZSP_PARAMETERS_INDEX;
        }

        return [status, frameControl, frameId, parametersIndex];
    }

    /**
     * Get a copy of the rest of the buffer (from current position to end).
     * WARNING: Make sure the length is appropriate, if alloc'ed longer, it will return everything until the end.
     * @returns
     */
    public readRest(): Buffer {
        return Buffer.from(this.buffer.subarray(this.position));
    }

    /**
     * This is mostly used for payload/encryption stuff.
     * Copies the buffer to avoid memory referencing issues since Ezsp has a single buffer allocated.
     * @param length
     * @returns
     */
    protected readBufferCopy(length: number): Buffer {
        return Buffer.from(this.readBuffer(length));
    }

    /**
     * Write a uint8_t for payload length, followed by payload buffer (copied at post-length position).
     *
     * WARNING: `payload` must have a valid length (as in, not a Buffer allocated to longer length).
     *          Should be passed with getWritten() in most cases.
     * @param payload
     */
    public writePayload(payload: Buffer): void {
        this.writeUInt8(payload.length);

        this.position += payload.copy(this.buffer, this.position);
    }

    /**
     * Read a uint8_t for payload length, followed by payload buffer (using post-length position).
     * @returns
     */
    public readPayload(): Buffer {
        const messageLength = this.readUInt8();

        return this.readBufferCopy(messageLength);
    }

    public writeEmberNetworkParameters(value: EmberNetworkParameters): void {
        this.writeListUInt8(value.extendedPanId);
        this.writeUInt16(value.panId);
        this.writeUInt8(value.radioTxPower);
        this.writeUInt8(value.radioChannel);
        this.writeUInt8(value.joinMethod);
        this.writeUInt16(value.nwkManagerId);
        this.writeUInt8(value.nwkUpdateId);
        this.writeUInt32(value.channels);
    }

    public readEmberNetworkParameters(): EmberNetworkParameters {
        const extendedPanId = this.readListUInt8(EXTENDED_PAN_ID_SIZE);
        const panId = this.readUInt16();
        const radioTxPower = this.readUInt8();
        const radioChannel = this.readUInt8();
        const joinMethod = this.readUInt8();
        const nwkManagerId = this.readUInt16();
        const nwkUpdateId = this.readUInt8();
        const channels = this.readUInt32();

        return {
            extendedPanId,
            panId,
            radioTxPower,
            radioChannel,
            joinMethod,
            nwkManagerId,
            nwkUpdateId,
            channels,
        };
    }

    public writeEmberMultiPhyRadioParameters(value: EmberMultiPhyRadioParameters): void {
        this.writeUInt8(value.radioTxPower);
        this.writeUInt8(value.radioPage);
        this.writeUInt8(value.radioChannel);
    }

    public readEmberMultiPhyRadioParameters(): EmberMultiPhyRadioParameters {
        const radioTxPower = this.readUInt8();
        const radioPage = this.readUInt8();
        const radioChannel = this.readUInt8();

        return {radioTxPower, radioPage, radioChannel};
    }

    public writeEmberApsFrame(value: EmberApsFrame): void {
        this.writeUInt16(value.profileId);
        this.writeUInt16(value.clusterId);
        this.writeUInt8(value.sourceEndpoint);
        this.writeUInt8(value.destinationEndpoint);
        this.writeUInt16(value.options);
        this.writeUInt16(value.groupId);
        this.writeUInt8(value.sequence);
        // this.writeUInt8(value.radius);// XXX: not in gecko_sdk, appended with separate param
    }

    public readEmberApsFrame(): EmberApsFrame {
        const profileId = this.readUInt16();
        const clusterId = this.readUInt16();
        const sourceEndpoint = this.readUInt8();
        const destinationEndpoint = this.readUInt8();
        const options = this.readUInt16();
        const groupId = this.readUInt16();
        const sequence = this.readUInt8();
        // const radius = this.readUInt8();// XXX: not in gecko_sdk, appended with separate param

        return {
            profileId,
            clusterId,
            sourceEndpoint,
            destinationEndpoint,
            options,
            groupId,
            sequence,
            // radius,
        };
    }

    public writeEmberBindingTableEntry(value: EmberBindingTableEntry): void {
        this.writeUInt8(value.type);
        this.writeUInt8(value.local);
        this.writeUInt16(value.clusterId);
        this.writeUInt8(value.remote);
        this.writeIeeeAddr(value.identifier);
        this.writeUInt8(value.networkIndex);
    }

    public readEmberBindingTableEntry(): EmberBindingTableEntry {
        const type = this.readUInt8();
        const local = this.readUInt8();
        const clusterId = this.readUInt16();
        const remote = this.readUInt8();
        const identifier = this.readIeeeAddr();
        const networkIndex = this.readUInt8();

        return {
            type,
            local,
            clusterId,
            remote,
            identifier,
            networkIndex,
        };
    }

    public writeEmberMulticastTableEntry(value: EmberMulticastTableEntry): void {
        this.writeUInt16(value.multicastId);
        this.writeUInt8(value.endpoint);
        this.writeUInt8(value.networkIndex);
    }

    public readEmberMulticastTableEntry(): EmberMulticastTableEntry {
        const multicastId = this.readUInt16();
        const endpoint = this.readUInt8();
        // XXX: not in gecko_sdk? as workaround check length for now since used at end in just one place
        const networkIndex = this.isMore() ? this.readUInt8() : 0x00;

        return {multicastId, endpoint, networkIndex};
    }

    public writeEmberBeaconClassificationParams(value: EmberBeaconClassificationParams): void {
        this.writeUInt8(value.minRssiForReceivingPkts);
        this.writeUInt16(value.beaconClassificationMask);
    }

    public readEmberBeaconClassificationParams(): EmberBeaconClassificationParams {
        const minRssiForReceivingPkts = this.readUInt8(); // Int8...
        const beaconClassificationMask = this.readUInt16();

        return {minRssiForReceivingPkts, beaconClassificationMask};
    }

    public writeEmberNeighborTableEntry(value: EmberNeighborTableEntry): void {
        this.writeUInt16(value.shortId);
        this.writeUInt8(value.averageLqi);
        this.writeUInt8(value.inCost);
        this.writeUInt8(value.outCost);
        this.writeUInt8(value.age);
        this.writeIeeeAddr(value.longId);
    }

    public readEmberNeighborTableEntry(): EmberNeighborTableEntry {
        const shortId = this.readUInt16();
        const averageLqi = this.readUInt8();
        const inCost = this.readUInt8();
        const outCost = this.readUInt8();
        const age = this.readUInt8();
        const longId = this.readIeeeAddr();

        return {
            shortId,
            averageLqi,
            inCost,
            outCost,
            age,
            longId,
        };
    }

    public writeEmberRouteTableEntry(value: EmberRouteTableEntry): void {
        this.writeUInt16(value.destination);
        this.writeUInt16(value.nextHop);
        this.writeUInt8(value.status);
        this.writeUInt8(value.age);
        this.writeUInt8(value.concentratorType);
        this.writeUInt8(value.routeRecordState);
    }

    public readEmberRouteTableEntry(): EmberRouteTableEntry {
        const destination = this.readUInt16();
        const nextHop = this.readUInt16();
        const status = this.readUInt8();
        const age = this.readUInt8();
        const concentratorType = this.readUInt8();
        const routeRecordState = this.readUInt8();

        return {
            destination,
            nextHop,
            status,
            age,
            concentratorType,
            routeRecordState,
        };
    }

    public writeEmberKeyData(value: EmberKeyData): void {
        this.writeBuffer(value.contents, EMBER_ENCRYPTION_KEY_SIZE);
    }

    public readEmberKeyData(): EmberKeyData {
        const contents = this.readBufferCopy(EMBER_ENCRYPTION_KEY_SIZE);

        return {contents};
    }

    public writeSecManKey(value: SecManKey): void {
        this.writeEmberKeyData(value);
    }

    public readSecManKey(): SecManKey {
        return this.readEmberKeyData();
    }

    public writeSecManContext(value: SecManContext): void {
        this.writeUInt8(value.coreKeyType);
        this.writeUInt8(value.keyIndex);
        this.writeUInt16(value.derivedType);
        this.writeIeeeAddr(value.eui64);
        this.writeUInt8(value.multiNetworkIndex);
        this.writeUInt8(value.flags);
        this.writeUInt32(value.psaKeyAlgPermission);
    }

    public readSecManContext(): SecManContext {
        const coreKeyType = this.readUInt8();
        const keyIndex = this.readUInt8();
        const derivedType = this.readUInt16();
        const eui64 = this.readIeeeAddr();
        const multiNetworkIndex = this.readUInt8();
        const flags = this.readUInt8();
        const psaKeyAlgPermission = this.readUInt32();

        return {
            coreKeyType,
            keyIndex,
            derivedType,
            eui64,
            multiNetworkIndex,
            flags,
            psaKeyAlgPermission,
        };
    }

    public writeSecManNetworkKeyInfo(value: SecManNetworkKeyInfo): void {
        this.writeUInt8(value.networkKeySet ? 1 : 0);
        this.writeUInt8(value.alternateNetworkKeySet ? 1 : 0);
        this.writeUInt8(value.networkKeySequenceNumber);
        this.writeUInt8(value.altNetworkKeySequenceNumber);
        this.writeUInt32(value.networkKeyFrameCounter);
    }

    public readSecManNetworkKeyInfo(): SecManNetworkKeyInfo {
        const networkKeySet = this.readUInt8() !== 0;
        const alternateNetworkKeySet = this.readUInt8() !== 0;
        const networkKeySequenceNumber = this.readUInt8();
        const altNetworkKeySequenceNumber = this.readUInt8();
        const networkKeyFrameCounter = this.readUInt32();

        return {
            networkKeySet: networkKeySet,
            alternateNetworkKeySet: alternateNetworkKeySet,
            networkKeySequenceNumber: networkKeySequenceNumber,
            altNetworkKeySequenceNumber: altNetworkKeySequenceNumber,
            networkKeyFrameCounter: networkKeyFrameCounter,
        };
    }

    public writeSecManAPSKeyMetadata(value: SecManAPSKeyMetadata): void {
        this.writeUInt16(value.bitmask);
        this.writeUInt32(value.outgoingFrameCounter);
        this.writeUInt32(value.incomingFrameCounter);
        this.writeUInt16(value.ttlInSeconds);
    }

    public readSecManAPSKeyMetadata(): SecManAPSKeyMetadata {
        const bitmask = this.readUInt16();
        const outgoingFrameCounter = this.readUInt32();
        const incomingFrameCounter = this.readUInt32();
        const ttlInSeconds = this.readUInt16();

        return {
            bitmask,
            outgoingFrameCounter,
            incomingFrameCounter,
            ttlInSeconds,
        };
    }

    public writeEmberInitialSecurityState(value: EmberInitialSecurityState): void {
        this.writeUInt16(value.bitmask);
        this.writeEmberKeyData(value.preconfiguredKey);
        this.writeEmberKeyData(value.networkKey);
        this.writeUInt8(value.networkKeySequenceNumber);
        this.writeIeeeAddr(value.preconfiguredTrustCenterEui64);
    }

    public readEmberInitialSecurityState(): EmberInitialSecurityState {
        const bitmask = this.readUInt16();
        const preconfiguredKey = this.readEmberKeyData();
        const networkKey = this.readEmberKeyData();
        const networkKeySequenceNumber = this.readUInt8();
        const preconfiguredTrustCenterEui64 = this.readIeeeAddr();

        return {
            bitmask,
            preconfiguredKey,
            networkKey,
            networkKeySequenceNumber,
            preconfiguredTrustCenterEui64,
        };
    }

    public writeEmberCurrentSecurityState(value: EmberCurrentSecurityState): void {
        this.writeUInt16(value.bitmask);
        this.writeIeeeAddr(value.trustCenterLongAddress);
    }

    public readEmberCurrentSecurityState(): EmberCurrentSecurityState {
        const bitmask = this.readUInt16();
        const trustCenterLongAddress = this.readIeeeAddr();

        return {bitmask, trustCenterLongAddress};
    }

    public writeEmberChildData(value: EmberChildData): void {
        this.writeIeeeAddr(value.eui64);
        this.writeUInt8(value.type);
        this.writeUInt16(value.id);
        this.writeUInt8(value.phy);
        this.writeUInt8(value.power);
        this.writeUInt8(value.timeout);
        this.writeUInt32(value.remainingTimeout);
    }

    public readEmberChildData(): EmberChildData {
        const eui64 = this.readIeeeAddr();
        const type = this.readUInt8();
        const id = this.readUInt16();
        const phy = this.readUInt8();
        const power = this.readUInt8();
        const timeout = this.readUInt8();
        const remainingTimeout = this.readUInt32();

        return {
            eui64,
            type,
            id,
            phy,
            power,
            timeout,
            remainingTimeout,
        };
    }

    public readEmberZigbeeNetwork(): EmberZigbeeNetwork {
        const channel = this.readUInt8();
        const panId = this.readUInt16();
        const extendedPanId = this.readListUInt8(EXTENDED_PAN_ID_SIZE);
        const allowingJoin = this.readUInt8() !== 0;
        const stackProfile = this.readUInt8();
        const nwkUpdateId = this.readUInt8();

        return {
            channel,
            panId,
            extendedPanId,
            allowingJoin,
            stackProfile,
            nwkUpdateId,
        };
    }

    public writeEmberZigbeeNetwork(value: EmberZigbeeNetwork): void {
        this.writeUInt8(value.channel);
        this.writeUInt16(value.panId);
        this.writeListUInt8(value.extendedPanId);
        this.writeUInt8(value.allowingJoin ? 1 : 0);
        this.writeUInt8(value.stackProfile);
        this.writeUInt8(value.nwkUpdateId);
    }

    public writeEmberCertificateData(value: EmberCertificateData): void {
        this.writeBuffer(value.contents, EMBER_CERTIFICATE_SIZE);
    }

    public readEmberCertificateData(): EmberCertificateData {
        const contents = this.readBufferCopy(EMBER_CERTIFICATE_SIZE);

        return {contents};
    }

    public writeEmberPublicKeyData(value: EmberPublicKeyData): void {
        this.writeBuffer(value.contents, EMBER_PUBLIC_KEY_SIZE);
    }

    public readEmberPublicKeyData(): EmberPublicKeyData {
        const contents = this.readBufferCopy(EMBER_PUBLIC_KEY_SIZE);

        return {contents};
    }

    public writeEmberPrivateKeyData(value: EmberPrivateKeyData): void {
        this.writeBuffer(value.contents, EMBER_PRIVATE_KEY_SIZE);
    }

    public readEmberPrivateKeyData(): EmberPrivateKeyData {
        const contents = this.readBufferCopy(EMBER_PRIVATE_KEY_SIZE);

        return {contents};
    }

    public writeEmberSmacData(value: EmberSmacData): void {
        this.writeBuffer(value.contents, EMBER_SMAC_SIZE);
    }

    public readEmberSmacData(): EmberSmacData {
        const contents = this.readBufferCopy(EMBER_SMAC_SIZE);

        return {contents};
    }

    public writeEmberSignatureData(value: EmberSignatureData): void {
        this.writeBuffer(value.contents, EMBER_SIGNATURE_SIZE);
    }

    public readEmberSignatureData(): EmberSignatureData {
        const contents = this.readBufferCopy(EMBER_SIGNATURE_SIZE);

        return {contents};
    }

    public writeEmberCertificate283k1Data(value: EmberCertificate283k1Data): void {
        this.writeBuffer(value.contents, EMBER_CERTIFICATE_283K1_SIZE);
    }

    public readEmberCertificate283k1Data(): EmberCertificate283k1Data {
        const contents = this.readBufferCopy(EMBER_CERTIFICATE_283K1_SIZE);

        return {contents};
    }

    public writeEmberPublicKey283k1Data(value: EmberPublicKey283k1Data): void {
        this.writeBuffer(value.contents, EMBER_PUBLIC_KEY_283K1_SIZE);
    }

    public readEmberPublicKey283k1Data(): EmberPublicKey283k1Data {
        const contents = this.readBufferCopy(EMBER_PUBLIC_KEY_283K1_SIZE);

        return {contents};
    }

    public writeEmberPrivateKey283k1Data(value: EmberPrivateKey283k1Data): void {
        this.writeBuffer(value.contents, EMBER_PRIVATE_KEY_283K1_SIZE);
    }

    public readEmberPrivateKey283k1Data(): EmberPrivateKey283k1Data {
        const contents = this.readBufferCopy(EMBER_PRIVATE_KEY_283K1_SIZE);

        return {contents};
    }

    public writeEmberSignature283k1Data(value: EmberSignature283k1Data): void {
        this.writeBuffer(value.contents, EMBER_SIGNATURE_283K1_SIZE);
    }

    public readEmberSignature283k1Data(): EmberSignature283k1Data {
        const contents = this.readBufferCopy(EMBER_SIGNATURE_283K1_SIZE);

        return {contents};
    }

    public writeEmberAesMmoHashContext(context: EmberAesMmoHashContext): void {
        this.writeBuffer(context.result, EMBER_AES_HASH_BLOCK_SIZE);
        this.writeUInt32(context.length);
    }

    public readEmberAesMmoHashContext(): EmberAesMmoHashContext {
        const result = this.readBufferCopy(EMBER_AES_HASH_BLOCK_SIZE);
        const length = this.readUInt32();

        return {result, length};
    }

    public writeEmberMessageDigest(value: EmberMessageDigest): void {
        this.writeBuffer(value.contents, EMBER_AES_HASH_BLOCK_SIZE);
    }

    public readEmberMessageDigest(): EmberMessageDigest {
        const contents = this.readBufferCopy(EMBER_AES_HASH_BLOCK_SIZE);

        return {contents};
    }

    public writeEmberNetworkInitStruct(networkInitStruct: EmberNetworkInitStruct): void {
        this.writeUInt16(networkInitStruct.bitmask);
    }

    public readEmberNetworkInitStruct(): EmberNetworkInitStruct {
        const bitmask = this.readUInt16();

        return {bitmask};
    }

    public writeEmberZllNetwork(network: EmberZllNetwork): void {
        this.writeEmberZigbeeNetwork(network.zigbeeNetwork);
        this.writeEmberZllSecurityAlgorithmData(network.securityAlgorithm);
        this.writeIeeeAddr(network.eui64);
        this.writeUInt16(network.nodeId);
        this.writeUInt16(network.state);
        this.writeUInt8(network.nodeType);
        this.writeUInt8(network.numberSubDevices);
        this.writeUInt8(network.totalGroupIdentifiers);
        this.writeUInt8(network.rssiCorrection);
    }

    public readEmberZllNetwork(): EmberZllNetwork {
        const zigbeeNetwork = this.readEmberZigbeeNetwork();
        const securityAlgorithm = this.readEmberZllSecurityAlgorithmData();
        const eui64 = this.readIeeeAddr();
        const nodeId = this.readUInt16();
        const state = this.readUInt16();
        const nodeType = this.readUInt8();
        const numberSubDevices = this.readUInt8();
        const totalGroupIdentifiers = this.readUInt8();
        const rssiCorrection = this.readUInt8();

        return {
            zigbeeNetwork,
            securityAlgorithm,
            eui64,
            nodeId,
            state,
            nodeType,
            numberSubDevices,
            totalGroupIdentifiers,
            rssiCorrection,
        };
    }

    public writeEmberZllSecurityAlgorithmData(data: EmberZllSecurityAlgorithmData): void {
        this.writeUInt32(data.transactionId);
        this.writeUInt32(data.responseId);
        this.writeUInt16(data.bitmask);
    }

    public readEmberZllSecurityAlgorithmData(): EmberZllSecurityAlgorithmData {
        const transactionId = this.readUInt32();
        const responseId = this.readUInt32();
        const bitmask = this.readUInt16();

        return {transactionId, responseId, bitmask};
    }

    public writeEmberZllInitialSecurityState(state: EmberZllInitialSecurityState): void {
        this.writeUInt32(state.bitmask);
        this.writeUInt8(state.keyIndex);
        this.writeEmberKeyData(state.encryptionKey);
        this.writeEmberKeyData(state.preconfiguredKey);
    }

    public writeEmberTokTypeStackZllData(data: EmberTokTypeStackZllData): void {
        this.writeUInt32(data.bitmask);
        this.writeUInt16(data.freeNodeIdMin);
        this.writeUInt16(data.freeNodeIdMax);
        this.writeUInt16(data.myGroupIdMin);
        this.writeUInt16(data.freeGroupIdMin);
        this.writeUInt16(data.freeGroupIdMax);
        this.writeUInt8(data.rssiCorrection);
    }

    public readEmberTokTypeStackZllData(): EmberTokTypeStackZllData {
        const bitmask = this.readUInt32();
        const freeNodeIdMin = this.readUInt16();
        const freeNodeIdMax = this.readUInt16();
        const myGroupIdMin = this.readUInt16();
        const freeGroupIdMin = this.readUInt16();
        const freeGroupIdMax = this.readUInt16();
        const rssiCorrection = this.readUInt8();

        return {
            bitmask,
            freeNodeIdMin,
            freeNodeIdMax,
            myGroupIdMin,
            freeGroupIdMin,
            freeGroupIdMax,
            rssiCorrection,
        };
    }

    public writeEmberTokTypeStackZllSecurity(security: EmberTokTypeStackZllSecurity): void {
        this.writeUInt32(security.bitmask);
        this.writeUInt8(security.keyIndex);
        this.writeBuffer(security.encryptionKey, EMBER_ENCRYPTION_KEY_SIZE);
        this.writeBuffer(security.preconfiguredKey, EMBER_ENCRYPTION_KEY_SIZE);
    }

    public readEmberTokTypeStackZllSecurity(): EmberTokTypeStackZllSecurity {
        const bitmask = this.readUInt32();
        const keyIndex = this.readUInt8();
        const encryptionKey = this.readBufferCopy(EMBER_ENCRYPTION_KEY_SIZE);
        const preconfiguredKey = this.readBufferCopy(EMBER_ENCRYPTION_KEY_SIZE);

        return {
            bitmask,
            keyIndex,
            encryptionKey,
            preconfiguredKey,
        };
    }

    public writeEmberGpAddress(value: EmberGpAddress): void {
        this.writeUInt8(value.applicationId);

        if (value.applicationId === EmberGpApplicationId.SOURCE_ID) {
            this.writeUInt32(value.sourceId);
            this.writeUInt32(value.sourceId); // filler
        } else if (value.applicationId === EmberGpApplicationId.IEEE_ADDRESS) {
            this.writeIeeeAddr(value.gpdIeeeAddress);
        }

        this.writeUInt8(value.endpoint);
    }

    public readEmberGpAddress(): EmberGpAddress {
        const applicationId = this.readUInt8();

        if (applicationId === EmberGpApplicationId.SOURCE_ID) {
            const sourceId = this.readUInt32();
            this.readUInt32(); // filler
            const endpoint = this.readUInt8();

            return {applicationId, sourceId, endpoint};
        } else if (applicationId === EmberGpApplicationId.IEEE_ADDRESS) {
            const gpdIeeeAddress = this.readIeeeAddr();
            const endpoint = this.readUInt8();

            return {applicationId, gpdIeeeAddress, endpoint};
        }

        throw new Error(`Invalid GP applicationId ${applicationId}.`);
    }

    public readEmberGpSinkList(): EmberGpSinkListEntry[] {
        const list: EmberGpSinkListEntry[] = [];

        for (let i = 0; i < GP_SINK_LIST_ENTRIES; i++) {
            const type: EmberGpSinkType = this.readUInt8();

            switch (type) {
                case EmberGpSinkType.FULL_UNICAST:
                case EmberGpSinkType.LW_UNICAST:
                case EmberGpSinkType.UNUSED:
                default: {
                    const sinkNodeId = this.readUInt16();
                    const sinkEUI = this.readIeeeAddr();

                    list.push({
                        type,
                        unicast: {
                            sinkNodeId,
                            sinkEUI,
                        },
                    });
                    break;
                }
                case EmberGpSinkType.D_GROUPCAST:
                case EmberGpSinkType.GROUPCAST: {
                    const alias = this.readUInt16();
                    const groupID = this.readUInt16();

                    // fillers
                    this.readUInt16();
                    this.readUInt16();
                    this.readUInt16();

                    list.push({
                        type,
                        groupcast: {
                            alias,
                            groupID,
                        },
                    });
                    break;
                }
            }
        }

        return list;
    }

    public writeEmberGpSinkList(value: EmberGpSinkListEntry[]): void {
        for (let i = 0; i < GP_SINK_LIST_ENTRIES; i++) {
            const entry = value[i];

            this.writeUInt8(entry.type);

            switch (entry.type) {
                case EmberGpSinkType.FULL_UNICAST:
                case EmberGpSinkType.LW_UNICAST:
                case EmberGpSinkType.UNUSED:
                default:
                    this.writeUInt16(entry.unicast.sinkNodeId);
                    this.writeIeeeAddr(entry.unicast.sinkEUI);

                    break;

                case EmberGpSinkType.D_GROUPCAST:
                case EmberGpSinkType.GROUPCAST:
                    this.writeUInt16(entry.groupcast.alias);
                    this.writeUInt16(entry.groupcast.groupID);
                    //fillers
                    this.writeUInt16(entry.groupcast.alias);
                    this.writeUInt16(entry.groupcast.groupID);
                    this.writeUInt16(entry.groupcast.alias);
                    break;
            }
        }
    }

    public readEmberGpProxyTableEntry(): EmberGpProxyTableEntry {
        const status = this.readUInt8();
        const options = this.readUInt32();
        const gpd = this.readEmberGpAddress();
        const assignedAlias = this.readUInt16();
        const securityOptions = this.readUInt8();
        const gpdSecurityFrameCounter = this.readUInt32();
        const gpdKey = this.readEmberKeyData();
        const sinkList = this.readEmberGpSinkList();
        const groupcastRadius = this.readUInt8();
        const searchCounter = this.readUInt8();

        return {
            status,
            options,
            gpd,
            assignedAlias,
            securityOptions,
            gpdSecurityFrameCounter,
            gpdKey,
            sinkList,
            groupcastRadius,
            searchCounter,
        };
    }

    public writeEmberGpProxyTableEntry(value: EmberGpProxyTableEntry): void {
        this.writeUInt8(value.status);
        this.writeUInt32(value.options);
        this.writeEmberGpAddress(value.gpd);
        this.writeUInt16(value.assignedAlias);
        this.writeUInt8(value.securityOptions);
        this.writeUInt32(value.gpdSecurityFrameCounter);
        this.writeEmberKeyData(value.gpdKey);
        this.writeEmberGpSinkList(value.sinkList);
        this.writeUInt8(value.groupcastRadius);
        this.writeUInt8(value.searchCounter);
    }

    public readEmberGpSinkTableEntry(): EmberGpSinkTableEntry {
        const status = this.readUInt8();
        const options = this.readUInt16();
        const gpd = this.readEmberGpAddress();
        const deviceId = this.readUInt8();
        const sinkList = this.readEmberGpSinkList();
        const assignedAlias = this.readUInt16();
        const groupcastRadius = this.readUInt8();
        const securityOptions = this.readUInt8();
        const gpdSecurityFrameCounter = this.readUInt32();
        const gpdKey = this.readEmberKeyData();

        return {
            status,
            options,
            gpd,
            deviceId,
            sinkList,
            assignedAlias,
            groupcastRadius,
            securityOptions,
            gpdSecurityFrameCounter,
            gpdKey,
        };
    }

    public writeEmberGpSinkTableEntry(value: EmberGpSinkTableEntry): void {
        this.writeUInt8(value.status);
        this.writeUInt16(value.options);
        this.writeEmberGpAddress(value.gpd);
        this.writeUInt8(value.deviceId);
        this.writeEmberGpSinkList(value.sinkList);
        this.writeUInt16(value.assignedAlias);
        this.writeUInt8(value.groupcastRadius);
        this.writeUInt8(value.securityOptions);
        this.writeUInt32(value.gpdSecurityFrameCounter);
        this.writeEmberKeyData(value.gpdKey);
    }

    public writeEmberDutyCycleLimits(limits: EmberDutyCycleLimits): void {
        this.writeUInt16(limits.limitThresh);
        this.writeUInt16(limits.critThresh);
        this.writeUInt16(limits.suspLimit);
    }

    public readEmberDutyCycleLimits(): EmberDutyCycleLimits {
        const limitThresh = this.readUInt16();
        const critThresh = this.readUInt16();
        const suspLimit = this.readUInt16();

        return {
            limitThresh,
            critThresh,
            suspLimit,
        };
    }

    public writeEmberPerDeviceDutyCycle(maxDevices: number, arrayOfDeviceDutyCycles: EmberPerDeviceDutyCycle[]): void {
        this.writeUInt16(maxDevices);

        for (let i = 0; i < maxDevices; i++) {
            this.writeUInt16(arrayOfDeviceDutyCycles[i].nodeId);
            this.writeUInt16(arrayOfDeviceDutyCycles[i].dutyCycleConsumed);
        }
    }

    public readEmberPerDeviceDutyCycle(): EmberPerDeviceDutyCycle[] {
        const maxDevices = this.readUInt8();
        const arrayOfDeviceDutyCycles: EmberPerDeviceDutyCycle[] = [];

        for (let i = 0; i < maxDevices; i++) {
            const nodeId = this.readUInt16();
            const dutyCycleConsumed = this.readUInt16();

            arrayOfDeviceDutyCycles.push({nodeId, dutyCycleConsumed});
        }

        return arrayOfDeviceDutyCycles;
    }

    public readEmberZllDeviceInfoRecord(): EmberZllDeviceInfoRecord {
        const ieeeAddress = this.readIeeeAddr();
        const endpointId = this.readUInt8();
        const profileId = this.readUInt16();
        const deviceId = this.readUInt16();
        const version = this.readUInt8();
        const groupIdCount = this.readUInt8();

        return {
            ieeeAddress,
            endpointId,
            profileId,
            deviceId,
            version,
            groupIdCount,
        };
    }

    public readEmberZllInitialSecurityState(): EmberZllInitialSecurityState {
        const bitmask = this.readUInt32();
        const keyIndex = this.readUInt8();
        const encryptionKey = this.readEmberKeyData();
        const preconfiguredKey = this.readEmberKeyData();

        return {
            bitmask,
            keyIndex,
            encryptionKey,
            preconfiguredKey,
        };
    }

    public readEmberZllAddressAssignment(): EmberZllAddressAssignment {
        const nodeId = this.readUInt16();
        const freeNodeIdMin = this.readUInt16();
        const freeNodeIdMax = this.readUInt16();
        const groupIdMin = this.readUInt16();
        const groupIdMax = this.readUInt16();
        const freeGroupIdMin = this.readUInt16();
        const freeGroupIdMax = this.readUInt16();

        return {
            nodeId,
            freeNodeIdMin,
            freeNodeIdMax,
            groupIdMin,
            groupIdMax,
            freeGroupIdMin,
            freeGroupIdMax,
        };
    }

    public writeEmberBeaconIterator(value: EmberBeaconIterator): void {
        this.writeUInt8(value.beacon.channel);
        this.writeUInt8(value.beacon.lqi);
        this.writeUInt8(value.beacon.rssi);
        this.writeUInt8(value.beacon.depth);
        this.writeUInt8(value.beacon.nwkUpdateId);
        this.writeUInt8(value.beacon.power);
        this.writeUInt8(value.beacon.parentPriority);
        this.writeUInt8(value.beacon.enhanced ? 1 : 0);
        this.writeUInt8(value.beacon.permitJoin ? 1 : 0);
        this.writeUInt8(value.beacon.hasCapacity ? 1 : 0);
        this.writeUInt16(value.beacon.panId);
        this.writeUInt16(value.beacon.sender);
        this.writeListUInt8(value.beacon.extendedPanId);
        this.writeUInt8(value.index);
    }

    public readEmberBeaconIterator(): EmberBeaconIterator {
        const channel = this.readUInt8();
        const lqi = this.readUInt8();
        const rssi = this.readUInt8();
        const depth = this.readUInt8();
        const nwkUpdateId = this.readUInt8();
        const power = this.readUInt8();
        const parentPriority = this.readUInt8();
        const enhanced = this.readUInt8() !== 0;
        const permitJoin = this.readUInt8() !== 0;
        const hasCapacity = this.readUInt8() !== 0;
        const panId = this.readUInt16();
        const sender = this.readUInt16();
        const extendedPanId = this.readListUInt8(EXTENDED_PAN_ID_SIZE);
        const index = this.readUInt8();

        return {
            beacon: {
                channel,
                lqi,
                rssi,
                depth,
                nwkUpdateId,
                power,
                parentPriority,
                enhanced,
                permitJoin,
                hasCapacity,
                panId,
                sender,
                extendedPanId,
                supportedKeyNegotiationMethods: 0,
                extended_beacon: false,
                tcConnectivity: true,
                longUptime: true,
                preferParent: true,
                macDataPollKeepalive: true,
                endDeviceKeepalive: true,
            },
            index,
        };
    }

    public writeEmberBeaconData(value: EmberBeaconData): void {
        this.writeUInt8(value.channel);
        this.writeUInt8(value.lqi);
        this.writeUInt8(value.rssi);
        this.writeUInt8(value.depth);
        this.writeUInt8(value.nwkUpdateId);
        this.writeUInt8(value.power);
        this.writeUInt8(value.parentPriority);
        this.writeUInt8(value.enhanced ? 1 : 0);
        this.writeUInt8(value.permitJoin ? 1 : 0);
        this.writeUInt8(value.hasCapacity ? 1 : 0);
        this.writeUInt16(value.panId);
        this.writeUInt16(value.sender);
        this.writeListUInt8(value.extendedPanId);
    }

    public readEmberBeaconData(): EmberBeaconData {
        const channel = this.readUInt8();
        const lqi = this.readUInt8();
        const rssi = this.readUInt8();
        const depth = this.readUInt8();
        const nwkUpdateId = this.readUInt8();
        const power = this.readUInt8();
        const parentPriority = this.readUInt8();
        const enhanced = this.readUInt8() !== 0;
        const permitJoin = this.readUInt8() !== 0;
        const hasCapacity = this.readUInt8() !== 0;
        const panId = this.readUInt16();
        const sender = this.readUInt16();
        const extendedPanId = this.readListUInt8(EXTENDED_PAN_ID_SIZE);

        return {
            channel,
            lqi,
            rssi,
            depth,
            nwkUpdateId,
            power,
            parentPriority,
            enhanced,
            permitJoin,
            hasCapacity,
            panId,
            sender,
            extendedPanId,
            supportedKeyNegotiationMethods: 0,
            extended_beacon: false,
            tcConnectivity: true,
            longUptime: true,
            preferParent: true,
            macDataPollKeepalive: true,
            endDeviceKeepalive: true,
        };
    }

    public writeEmberTokenData(tokenData: EmberTokenData): void {
        this.writeUInt32(tokenData.size);
        this.writeBuffer(tokenData.data, tokenData.size);
    }

    public readEmberTokenData(): EmberTokenData {
        const size = this.readUInt32();
        const data = this.readBufferCopy(size);

        return {size, data};
    }

    public readEmberTokenInfo(): EmberTokenInfo {
        const nvm3Key = this.readUInt32();
        const isCnt = this.readUInt8() !== 0;
        const isIdx = this.readUInt8() !== 0;
        const size = this.readUInt8();
        const arraySize = this.readUInt8();

        return {
            nvm3Key,
            isCnt,
            isIdx,
            size,
            arraySize,
        };
    }

    public writeEmberTokenInfo(tokenInfo: EmberTokenInfo): void {
        this.writeUInt32(tokenInfo.nvm3Key);
        this.writeUInt8(tokenInfo.isCnt ? 1 : 0);
        this.writeUInt8(tokenInfo.isIdx ? 1 : 0);
        this.writeUInt8(tokenInfo.size);
        this.writeUInt8(tokenInfo.arraySize);
    }

    /**
     * EZSP switched to using SLStatus for command returns from version 14.
     * @param version EZSP protocol version in use
     * @param mapFromEmber If true, map from EmberStatus, otherwise map from EzspStatus
     * @returns EzspStatus, EmberStatus or SLStatus as SLStatus
     */
    public readStatus(version: number, mapFromEmber: boolean = true): SLStatus {
        if (version < 0x0e) {
            const status = this.readUInt8();

            // skip lookup if SUCCESS (always zero)
            if (status === SLStatus.OK) {
                return status;
            }

            if (mapFromEmber) {
                // use mapped value, or pass as-is if none found
                return EMBER_TO_SL_STATUS_MAP.get(status) ?? status;
            }

            // EzspStatus mapping to SLStatus is always same code
            return SLStatus.ZIGBEE_EZSP_ERROR;
        } else {
            return this.readUInt32();
        }
    }

    public readEmberEndpointDescription(): EmberEndpointDescription {
        const profileId = this.readUInt16();
        const deviceId = this.readUInt16();
        const deviceVersion = this.readUInt8();
        const inputClusterCount = this.readUInt8();
        const outputClusterCount = this.readUInt8();

        return {
            profileId,
            deviceId,
            deviceVersion,
            inputClusterCount,
            outputClusterCount,
        };
    }

    /** @deprecated removed in EZSP v16 in favor of @see readEmber802154RadioPriorities */
    public readEmberMultiprotocolPriorities(): EmberMultiprotocolPriorities {
        const backgroundRx = this.readUInt8();
        const tx = this.readUInt8();
        const activeRx = this.readUInt8();

        return {backgroundRx, tx, activeRx};
    }

    /** @deprecated removed in EZSP v16 in favor of @see writeEmber802154RadioPriorities */
    public writeEmberMultiprotocolPriorities(priorities: EmberMultiprotocolPriorities): void {
        this.writeUInt8(priorities.backgroundRx);
        this.writeUInt8(priorities.tx);
        this.writeUInt8(priorities.activeRx);
    }

    public readEmber802154RadioPriorities(): Ember802154RadioPriorities {
        const backgroundRx = this.readUInt8();
        const minTxPriority = this.readUInt8();
        const txStep = this.readUInt8();
        const maxTxPriority = this.readUInt8();
        const activeRx = this.readUInt8();

        return {backgroundRx, minTxPriority, txStep, maxTxPriority, activeRx};
    }

    public writeEmber802154RadioPriorities(priorities: Ember802154RadioPriorities): void {
        this.writeUInt8(priorities.backgroundRx);
        this.writeUInt8(priorities.minTxPriority);
        this.writeUInt8(priorities.txStep);
        this.writeUInt8(priorities.maxTxPriority);
        this.writeUInt8(priorities.activeRx);
    }

    public readEmberRxPacketInfo(): EmberRxPacketInfo {
        const senderShortId = this.readUInt16();
        const senderLongId = this.readIeeeAddr();
        const bindingIndex = this.readUInt8();
        const addressIndex = this.readUInt8();
        const lastHopLqi = this.readUInt8();
        const lastHopRssi = this.readInt8(); // SDK: (int8_t)fetchInt8u();
        const lastHopTimestamp = this.readUInt32();

        return {
            senderShortId,
            senderLongId,
            bindingIndex,
            addressIndex,
            lastHopLqi,
            lastHopRssi,
            lastHopTimestamp,
        };
    }
}
