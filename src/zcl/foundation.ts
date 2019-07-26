import DataType from './dataType';
import * as TsType from './tstype';

interface FoundationDefinition {
    ID: number;
    knownBufLen: number;
    parameters: TsType.Parameter[];
};

const Foundation: {
    [s: string]: FoundationDefinition;
}
= {
    read: {
        ID: 0,
        knownBufLen: 2,
        parameters: [
            {name: 'attrId', type: DataType.uint16},
        ],
    },
    readRsp: {
        ID: 1,
        knownBufLen: 3,
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'status', type: DataType.uint8},
            {name: 'extra', type: DataType.readRsp},
        ],
    },
    write: {
        ID: 2,
        knownBufLen: 3,
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'dataType', type: DataType.uint8},
            {name: 'attrData', type: DataType.variable},
        ],
    },
    writeUndiv: {
        ID: 3,
        knownBufLen: 3,
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'dataType', type: DataType.uint8},
            {name: 'attrData', type: DataType.variable},
        ],
    },
    writeRsp: {
        ID: 4,
        knownBufLen: 0,
        parameters: [
            {name: 'extra', type: DataType.writeRsp},
        ],
    },
    writeNoRsp: {
        ID: 5,
        knownBufLen: 3,
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'dataType', type: DataType.uint8},
            {name: 'attrData', type: DataType.variable},
        ],
    },
    configReport: {
        ID: 6,
        knownBufLen: 3,
        parameters: [
            {name: 'direction', type: DataType.uint8},
            {name: 'attrId', type: DataType.uint16},
            {name: 'extra', type: DataType.configReport},
        ],
    },
    configReportRsp: {
        ID: 7,
        knownBufLen: 0,
        parameters: [
            {name: 'extra', type: DataType.configReportRsp},
        ],
    },
    readReportConfig: {
        ID: 8,
        knownBufLen: 3,
        parameters: [
            {name: 'direction', type: DataType.uint8},
            {name: 'attrId', type: DataType.uint16},
        ],
    },
    readReportConfigRsp: {
        ID: 9,
        knownBufLen: 4,
        parameters: [
            {name: 'status', type: DataType.uint8},
            {name: 'direction', type: DataType.uint8},
            {name: 'attrId', type: DataType.uint16},
            {name: 'extra', type: DataType.readReportConfigRsp},
        ],
    },
    report: {
        ID: 10,
        knownBufLen: 3,
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'dataType', type: DataType.uint8},
            {name: 'attrData', type: DataType.variable},
        ],
    },
    defaultRsp: {
        ID: 11,
        knownBufLen: 2,
        parameters: [
            {name: 'cmdId', type: DataType.uint8},
            {name: 'statusCode', type: DataType.uint8},
        ],
    },
    discover: {
        ID: 12,
        knownBufLen: 3,
        parameters: [
            {name: 'startAttrId', type: DataType.uint16},
            {name: 'maxAttrIds', type: DataType.uint8},
        ],
    },
    discoverRsp: {
        ID: 13,
        knownBufLen: 3,
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'dataType', type: DataType.uint8},
        ],
    },
    readStruct: {
        ID: 14,
        knownBufLen: 2,
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'selector', type: DataType.selector},
        ],
    },
    writeStrcut: {
        ID: 15,
        knownBufLen: 3,
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'selector', type: DataType.selector},
            {name: 'dataType', type: DataType.uint8},
            {name: 'attrData', type: DataType.multi},
        ],
    },
    writeStrcutRsp: {
        ID: 16,
        knownBufLen: 3,
        parameters: [
            {name: 'status', type: DataType.uint8},
            {name: 'attrId', type: DataType.uint16},
            {name: 'selector', type: DataType.selector},
        ],
    },
}

export default Foundation;