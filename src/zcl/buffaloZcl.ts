import {Buffalo, TsType} from '../buffalo';
import {DataType} from './definition';
import {BuffaloZclOptions, StructuredIndicatorType, StructuredSelector, ZclArray} from './tstype';
import * as Utils from './utils';
import Debug from "debug";

const debug = {
    info: Debug('zigbee-herdsman:controller:buffaloZcl'),
    error: Debug('zigbee-herdsman:controller:buffaloZcl'),
};

interface KeyValue {[s: string | number]: number | string}

const aliases: {[s: string]: string} = {
    'boolean': 'uint8',
    'bitmap8': 'uint8',
    'enum8': 'uint8',
    'data8': 'uint8',
    'data16': 'uint16',
    'bitmap16': 'uint16',
    'uint16': 'uint16',
    'enum16': 'uint16',
    'clusterId': 'uint16',
    'attrId': 'uint16',
    'data24': 'uint24',
    'bitmap24': 'uint24',
    'data32': 'uint32',
    'bitmap32': 'uint32',
    'uint32': 'uint32',
    'tod': 'uint32',
    'date': 'uint32',
    'utc': 'uint32',
    'bacOid': 'uint32',
    'singlePrec': 'floatle',
    'doublePrec': 'doublele',
    'bitmap40': 'uint40',
    'data40': 'uint40',
    'bitmap48': 'uint48',
    'data48': 'uint48',
    'bitmap56': 'uint56',
    'data56': 'uint56',
    'bitmap64': 'uint64',
    'data64': 'uint64',
    'ieeeAddr': 'uint64',
    'longOctetStr': 'longCharStr',
    'secKey': 'buffer16',
    'noData': 'EMPTY',
    'unknown': 'EMPTY',
    'bag': 'array',
    'set': 'array',
};

const extensionFieldSetsDateTypeLookup: {[key: number]: string[]} = {
    6: ['uint8'],
    8: ['uint8'],
    258: ['uint8', 'unit8'],
    768: ['uint16', 'uint16', 'uint16', 'uint8', 'uint8', 'uint8', 'uint16', 'uint16'],
};

interface ThermoTransition {
    transitionTime: number;
    heatSetpoint?: number;
    coolSetpoint?: number;
}

interface Struct {
    elmType: number;
    elmVal: TsType.Value;
}

interface Gdp {
    deviceID: number;
    options: number;
    extendedOptions: number;
    securityKey: Buffer;
    keyMic: number;
    outgoingCounter: number;
    applicationInfo: number;
    manufacturerID: number;
    modelID: number;
    numGdpCommands: number;
    gpdCommandIdList: Buffer;
    numServerClusters: number;
    numClientClusters: number
    gpdServerClusters: Buffer;
    gpdClientClusters: Buffer;
}

interface GdpChannelRequest {
    nextChannel: number;
    nextNextChannel: number;
}

interface GdpChannelConfiguration {
    commandID: number;
    operationalChannel: number;
    basic: boolean;
}

interface GdpCommissioningReply {
    commandID: number;
    options: number;
    panID: number;
    securityKey: Buffer;
    keyMic: number;
    frameCounter: number;
}

interface GdpCustomReply {
    commandID: number;
    buffer: Buffer;
}

interface GdpAttributeReport {
    manufacturerCode: number;
    clusterID: number;
    attributes: KeyValue;
}

interface ExtensionFieldSet {
    clstId: number;
    len: number;
    extField: TsType.Value[];
}

interface TuyaDataPointValue {
    dp: number;
    datatype: number;
    data: Buffer;
}

interface MiboxerZone {
    zoneNum: number;
    groupId: number;
}

class BuffaloZcl extends Buffalo {
    private readUseDataType(options: BuffaloZclOptions): TsType.Value {
        return this.read(options.dataType, options);
    }

    private writeUseDataType(value: string, options: BuffaloZclOptions): void {
        this.write(options.dataType, value, options);
    }

    private readArray(): TsType.Value[] {
        const values: TsType.Value = [];

        const elementType = DataType[this.readUInt8()];
        const numberOfElements = this.readUInt16();

        for (let i = 0; i < numberOfElements; i++) {
            const value = this.read(elementType, {});
            values.push(value);
        }

        return values;
    }

    private writeArray(value: ZclArray): void {
        const elTypeNumeric = typeof value.elementType === 'number' ? value.elementType : DataType[value.elementType];
        this.writeUInt8(elTypeNumeric);
        this.writeUInt16(value.elements.length);
        value.elements.forEach(element => {
            this.write(DataType[elTypeNumeric], element, {});
        });
    }

    private readStruct(): Struct[] {
        const values = [];
        const numberOfElements = this.readUInt16();

        for (let i = 0; i < numberOfElements; i++) {
            const elementType = this.readUInt8();
            const value = this.read(DataType[elementType], {});
            values.push({elmType: elementType, elmVal: value});
        }

        return values;
    }

    private readOctetStr(): Buffer {
        const length = this.readUInt8();
        return this.readBuffer(length);
    }

    private readCharStr(options: BuffaloZclOptions): Record<number, number | number[]> | string {
        const length = this.readUInt8();

        if (options.attrId === 65281) {
            const value: Record<number, number | number[]> = {};

            // Xiaomi struct parsing
            for (let i = 0; i < length; i++) {
                const index = this.readUInt8();
                const dataType = DataType[this.readUInt8()];
                value[index] = this.read(dataType, {});

                if (this.position === this.buffer.length) {
                    break;
                }
            }

            return value;
        } else {
            return this.readUtf8String(length);
        }
    }

    private writeCharStr(value: string | number[]): void {
        if (typeof value === 'string') {
            this.writeUInt8(value.length);
            this.writeUtf8String(value);
        } else {
            this.writeBuffer(value, value.length);
        }
    }

    private readLongCharStr(): string {
        const length = this.readUInt16();
        return this.readUtf8String(length);
    }

    private writeLongCharStr(value: string): void {
        this.writeUInt16(value.length);
        this.writeUtf8String(value);
    }

    private writeOctetStr(value: number[]): void {
        this.writeUInt8(value.length);
        this.writeBuffer(value, value.length);
    }

    private readExtensionFieldSets(): ExtensionFieldSet[] {
        const value = [];

        while (this.isMore()) {
            const clstId = this.readUInt16();
            const len = this.readUInt8();
            const end = this.getPosition() + len;

            let index = 0;
            const extField = [];
            while (this.getPosition() < end) {
                extField.push(this.read(extensionFieldSetsDateTypeLookup[clstId][index], null));
                index++;
            }

            value.push({extField, clstId, len});
        }

        return value;
    }

    private writeExtensionFieldSets(values: {clstId: number; len: number; extField: number[]}[]): void {
        for (const value of values) {
            this.writeUInt16(value.clstId);
            this.writeUInt8(value.len);
            value.extField.forEach((entry, index) => {
                this.write(extensionFieldSetsDateTypeLookup[value.clstId][index], entry, null);
            });
        }
    }

    private writeListZoneInfo(values: {zoneID: number; zoneStatus: number}[]): void {
        for (const value of values) {
            this.writeUInt8(value.zoneID);
            this.writeUInt16(value.zoneStatus);
        }
    }

    private readListZoneInfo(options: TsType.Options): {zoneID: number, zoneStatus: number}[] {
        const value = [];
        for (let i = 0; i < options.length; i++) {
            value.push({
                zoneID: this.readUInt8(),
                zoneStatus: this.readUInt16(),
            });
        }

        return value;
    }

    private readListThermoTransitions(options: TsType.Options): ThermoTransition[] {
        const heat = options.payload['mode'] & 1;
        const cool = options.payload['mode'] & 2;
        const result = [];

        for (let i = 0; i < options.payload.numoftrans; i++) {
            const entry: ThermoTransition = {
                transitionTime: this.readUInt16()
            };

            if (heat) {
                entry.heatSetpoint = this.readUInt16();
            }

            if (cool) {
                entry.coolSetpoint = this.readUInt16();
            }

            result.push(entry);
        }

        return result;
    }

    private writeListThermoTransitions(value: ThermoTransition[]): void {
        for (const entry of value) {
            this.writeUInt16(entry.transitionTime);

            if (entry.hasOwnProperty('heatSetpoint')) {
                this.writeUInt16(entry.heatSetpoint);
            }

            if (entry.hasOwnProperty('coolSetpoint')) {
                this.writeUInt16(entry.coolSetpoint);
            }
        }
    }

    private readGdpFrame(options: TsType.Options): Gdp | GdpChannelRequest | GdpAttributeReport |
            {raw: Buffer} | Record<string, never> {
        // Commisioning
        if (options.payload.commandID === 0xE0) {
            const frame = {
                deviceID: this.readUInt8(),
                options: this.readUInt8(),
                extendedOptions: 0,
                securityKey: Buffer.alloc(16),
                keyMic: 0,
                outgoingCounter: 0,
                applicationInfo: 0,
                manufacturerID: 0,
                modelID: 0,
                numGdpCommands: 0,
                gpdCommandIdList: Buffer.alloc(0),
                numServerClusters: 0,
                numClientClusters: 0,
                gpdServerClusters: Buffer.alloc(0),
                gpdClientClusters: Buffer.alloc(0),
            };

            if (frame.options & 0x80) {
                frame.extendedOptions = this.readUInt8();
            }

            if (frame.extendedOptions & 0x20) {
                frame.securityKey = this.readBuffer(16);
            }

            if (frame.extendedOptions & 0x40) {
                frame.keyMic = this.readUInt32();
            }

            if (frame.extendedOptions & 0x80) {
                frame.outgoingCounter = this.readUInt32();
            }

            if (frame.options & 0x04) {
                frame.applicationInfo = this.readUInt8();
            }

            if (frame.applicationInfo & 0x01) {
                frame.manufacturerID = this.readUInt16();
            }

            if (frame.applicationInfo & 0x02) {
                frame.modelID = this.readUInt16();
            }

            if (frame.applicationInfo & 0x04) {
                frame.numGdpCommands = this.readUInt8();
                frame.gpdCommandIdList = this.readBuffer(frame.numGdpCommands);
            }

            if (frame.applicationInfo & 0x08) {
                const len = this.readUInt8();
                frame.numServerClusters = len & 0xF;
                frame.numClientClusters = (len >> 4) & 0xF;

                frame.gpdServerClusters = this.readBuffer(2 * frame.numServerClusters);
                frame.gpdClientClusters = this.readBuffer(2 * frame.numClientClusters);
            }

            return frame;
        // Channel Request
        } else if (options.payload.commandID === 0xE3) {
            const options = this.readUInt8();
            return {
                nextChannel: options & 0xF,
                nextNextChannel: options >> 4
            };
        // Manufacturer-specific Attribute Reporting
        } else if (options.payload.commandID == 0xA1) {
            const start = this.position;
            const frame = {
                manufacturerCode: this.readUInt16(),
                clusterID: this.readUInt16(),
                attributes: {} as KeyValue,
            };

            const cluster = Utils.getCluster(
                frame.clusterID,
                frame.manufacturerCode,
            );
            
            while (this.position - start < options.payload.payloadSize) {
                const attributeID = this.readUInt16();
                const type = this.readUInt8();


                let attribute: number | string = attributeID;
                try {
                    attribute = cluster.getAttribute(attributeID).name;
                } catch {
                    debug.info("Unknown attribute " + attributeID + " in cluster " + cluster.name);
                }

                frame.attributes[attribute] = this.read(DataType[type], options);
            }

            return frame;
        } else if (this.position != this.buffer.length) {
            return {raw: this.buffer.slice(this.position)};
        } else {
            return {};
        }
    }

    private writeGdpFrame(value: GdpCommissioningReply | GdpChannelConfiguration | GdpCustomReply): void{
        if (value.commandID == 0xF0) { // Commissioning Reply
            const v = <GdpCommissioningReply> value;

            const panIDPresent = v.options & (1 << 0);
            const gpdSecurityKeyPresent = v.options & (1 << 1);
            const gpdKeyEncryption = v.options & (1 << 2);
            const securityLevel = v.options & (3 << 3) >> 3;

            const hasGPDKeyMIC = gpdKeyEncryption && gpdSecurityKeyPresent;
            const hasFrameCounter = gpdSecurityKeyPresent &&
                    gpdKeyEncryption &&
                    (securityLevel === 0b10 || securityLevel === 0b11);

            this.writeUInt8(1 +
                    (panIDPresent ? 2 : 0) +
                    (gpdSecurityKeyPresent ? 16 : 0) +
                    (hasGPDKeyMIC ? 4 : 0) +
                    (hasFrameCounter ? 4 : 0)); // Length
            this.writeUInt8(v.options);

            if (panIDPresent) {
                this.writeUInt16(v.panID);
            }

            if (gpdSecurityKeyPresent) {
                this.writeBuffer(v.securityKey, 16);
            }

            if (hasGPDKeyMIC) {
                this.writeUInt32(v.keyMic);
            }

            if (hasFrameCounter) {
                this.writeUInt32(v.frameCounter);
            }
        } else if (value.commandID == 0xF3) { // Channel configuration
            const v = <GdpChannelConfiguration> value;
            this.writeUInt8(1);
            this.writeUInt8(v.operationalChannel & 0xF | ((v.basic ? 1 : 0) << 4));
        } else if (value.commandID == 0xF4 ||
                value.commandID == 0xF5 ||
                (value.commandID >= 0xF7 && value.commandID <= 0xFF)) {
            // Other commands sent to GPD
            const v = <GdpCustomReply> value;
            this.writeUInt8(v.buffer.length);
            this.writeBuffer(v.buffer, v.buffer.length);
        }
    }

    private readListTuyaDataPointValues(): TuyaDataPointValue[] {
        const value = [];

        while (this.isMore()) {
            try {
                const dp = this.readUInt8();
                const datatype = this.readUInt8();
                const len_hi = this.readUInt8();
                const len_lo = this.readUInt8();
                const data = this.readBuffer(len_lo + (len_hi << 8));
                value.push({dp, datatype, data});
            } catch (error) {
                break;
            }
        }
        return value;
    }

    private writeListTuyaDataPointValues(dpValues: TuyaDataPointValue[]): void {
        for (const dpValue of dpValues) {
            this.writeUInt8(dpValue.dp);
            this.writeUInt8(dpValue.datatype);
            const dataLen = dpValue.data.length;
            this.writeUInt8((dataLen >> 8) & 0xFF);
            this.writeUInt8(dataLen & 0xFF);
            this.writeBuffer(dpValue.data, dataLen);
        }
    }

    private readListMiboxerZones(): MiboxerZone[] {
        const value = [];
        const len = this.readUInt8();
        for (let i = 0; i < len; i++) {
            value.push({
                groupId: this.readUInt16(),
                zoneNum: this.readUInt8(),
            });
        }
        return value;
    }

    private readBigEndianUInt24(): number {
        return this.readBuffer(3).readUIntBE(0, 3);
    }

    private writeListMiboxerZones(values: MiboxerZone[]): void {
        this.writeUInt8(values.length);
        for (const value of values) {
            this.writeUInt16(value.groupId);
            this.writeUInt8(value.zoneNum);
        }
    }

    private writeBigEndianUInt24(value: number): void {
        const buffer = Buffer.alloc(3);
        buffer.writeUIntLE(value, 0, 3);
        this.writeBuffer(buffer.reverse(), 3);
    }

    private readUInt40(): [number, number] {
        const lsb = this.readUInt32();
        const msb = this.readUInt8();
        return [msb, lsb];
    }

    private writeUInt40(value: number[]): void {
        this.writeUInt32(value[1]);
        this.writeUInt8(value[0]);
    }

    private readUInt48(): [number, number] {
        const lsb = this.readUInt32();
        const msb = this.readUInt16();
        return [msb, lsb];
    }

    private writeUInt48(value: number[]): void {
        this.writeUInt32(value[1]);
        this.writeUInt16(value[0]);
    }

    private readUInt56(): [number, number, number] {
        const lsb = this.readUInt32();
        const xsb = this.readUInt16();
        const msb = this.readUInt8();
        return [msb, xsb, lsb];
    }

    private writeUInt56(value: number[]): void {
        const temp = Buffer.alloc(8);
        temp.writeUInt32LE(value[1], 0);
        temp.writeUInt32LE(value[0], 4);
        this.writeBuffer(temp.slice(0, 7), 7);
    }

    private readUInt64(): string {
        return this.readIeeeAddr();
    }

    private writeUInt64(value: string): void {
        const msb = parseInt(value.slice(2,10), 16);
        const lsb = parseInt(value.slice(10), 16);
        this.writeUInt32(lsb);
        this.writeUInt32(msb);
    }

    private writeStructuredSelector(
        value: StructuredSelector,
    ): void {
        if (value != null) {
            const indexes = value.indexes || [];
            const indicatorType = value.indicatorType || StructuredIndicatorType.WriteWhole;
            const indicator = indexes.length + indicatorType;
            this.writeUInt8(indicator);
            for (const index of indexes) {
                this.writeUInt16(index);
            }
        }
    }

    public write(type: string, value: TsType.Value, options: BuffaloZclOptions): void {
        // TODO: write for the following is missing: struct
        type = aliases[type] || type;

        if (type === 'uint40') {
            return this.writeUInt40(value);
        } else if (type === 'EXTENSION_FIELD_SETS') {
            return this.writeExtensionFieldSets(value);
        } else if (type === 'LIST_ZONEINFO') {
            return this.writeListZoneInfo(value);
        } else if (type === 'LIST_THERMO_TRANSITIONS') {
            return this.writeListThermoTransitions(value);
        } else if (type === 'LIST_TUYA_DATAPOINT_VALUES') {
            return this.writeListTuyaDataPointValues(value);
        } else if (type === 'LIST_MIBOXER_ZONES') {
            return this.writeListMiboxerZones(value);
        } else if (type === 'BIG_ENDIAN_UINT24') {
            return this.writeBigEndianUInt24(value);
        } else if (type === 'GDP_FRAME') {
            return this.writeGdpFrame(value);
        } else if (type === 'uint48') {
            return this.writeUInt48(value);
        } else if (type === 'uint56') {
            return this.writeUInt56(value);
        } else if (type === 'uint64') {
            return this.writeUInt64(value);
        } else if (type === 'charStr') {
            return this.writeCharStr(value);
        } else if (type === 'longCharStr') {
            return this.writeLongCharStr(value);
        } else if (type === 'octetStr') {
            return this.writeOctetStr(value);
        } else if (type === 'array') {
            return this.writeArray(value);
        } else if (type === 'USE_DATA_TYPE') {
            return this.writeUseDataType(value, options);
        } else if (type == 'STRUCTURED_SELECTOR') {
            return this.writeStructuredSelector(value);
        } else {
            // In case the type is undefined, write it as a buffer to easily allow for custom types
            // e.g. for https://github.com/Koenkk/zigbee-herdsman/issues/127
            type = type === undefined ? 'BUFFER' : type;

            // TODO: remove uppercase once dataTypes are snake case
            return super.write(type.toUpperCase(), value, options);
        }
    }

    public read(type: string, options: BuffaloZclOptions): TsType.Value {
        type = aliases[type] || type;
        if (type === 'USE_DATA_TYPE') {
            return this.readUseDataType(options);
        } else if (type === 'EXTENSION_FIELD_SETS') {
            return this.readExtensionFieldSets();
        } else if (type === 'LIST_ZONEINFO') {
            return this.readListZoneInfo(options);
        } else if (type === 'LIST_THERMO_TRANSITIONS') {
            return this.readListThermoTransitions(options);
        } else if (type === 'GDP_FRAME') {
            return this.readGdpFrame(options);
        } else if (type === 'LIST_TUYA_DATAPOINT_VALUES') {
            return this.readListTuyaDataPointValues();
        } else if (type === 'LIST_MIBOXER_ZONES') {
            return this.readListMiboxerZones();
        } else if (type === 'BIG_ENDIAN_UINT24') {
            return this.readBigEndianUInt24();
        } else if (type === 'uint40') {
            return this.readUInt40();
        } else if (type === 'uint48') {
            return this.readUInt48();
        } else if (type === 'uint56') {
            return this.readUInt56();
        } else if (type === 'uint64') {
            return this.readUInt64();
        } else if (type === 'octetStr') {
            return this.readOctetStr();
        } else if (type === 'charStr') {
            return this.readCharStr(options);
        } else if (type === 'longCharStr') {
            return this.readLongCharStr();
        } else if (type === 'array') {
            return this.readArray();
        } else if (type === 'struct') {
            return this.readStruct();
        } else if (type === 'BUFFER') {
            return this.readBuffer(this.buffer.length);
        } else {
            // TODO: remove uppercase once dataTypes are snake case
            return super.read(type.toUpperCase(), options);
        }
    }
}

export default BuffaloZcl;
