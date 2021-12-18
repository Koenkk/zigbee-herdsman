import {Buffalo, TsType} from '../buffalo';
import {DataType} from './definition';
import {BuffaloZclOptions, StructuredIndicatorType, StructuredSelector, ZclArray} from './tstype';

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
    numGdpCommands: number;
    gpdCommandIdList: Buffer;
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

    private readGdpFrame(options: TsType.Options): Gdp | {raw: Buffer} | Record<string, never> {
        // Commisioning
        if (options.payload.commandID === 224) {
            const frame =  {
                deviceID: this.readUInt8(),
                options: this.readUInt8(),
                extendedOptions: this.readUInt8(),
                securityKey: this.readBuffer(16),
                keyMic: this.readUInt32(),
                outgoingCounter: this.readUInt32(),
                applicationInfo: 0,
                numGdpCommands: 0,
                gpdCommandIdList: Buffer.alloc(0),
            };
            if (frame.options & 0x04) {
                frame.applicationInfo = this.readUInt8();
            }
            if (frame.applicationInfo & 0x04) {
                frame.numGdpCommands = this.readUInt8();
                frame.gpdCommandIdList = this.readBuffer(frame.numGdpCommands);
            }
            return frame;
        } else if (this.position != this.buffer.length) {
            return {raw: this.buffer.slice(this.position)};
        } else {
            return {};
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
        } else {
            // TODO: remove uppercase once dataTypes are snake case
            return super.read(type.toUpperCase(), options);
        }
    }
}

export default BuffaloZcl;
