/* eslint max-len: 0 */

import DataType from './dataType';
import BuffaloZclDataType from './buffaloZclDataType';
import Status from './status';
import Direction from './direction';
import {ParameterDefinition} from './tstype';

export type FoundationCommandName = (
    'read' | 'readRsp' | 'write' | 'writeUndiv' | 'writeRsp' | 'writeNoRsp' | 'configReport' | 'configReportRsp' |
    'readReportConfig' | 'readReportConfigRsp' | 'report' | 'defaultRsp' | 'discover' | 'discoverRsp' | 'readStructured' |
    'writeStructured' | 'writeStructuredRsp' | 'discoverCommands' | 'discoverCommandsRsp' | 'discoverCommandsGen' |
    'discoverCommandsGenRsp' | 'discoverExt' | 'discoverExtRsp'
);

interface FoundationDefinition {
    ID: number;
    parseStrategy: 'repetitive' | 'flat' | 'oneof';
    parameters: readonly ParameterDefinition[];
    response?: number;
}

const Foundation: Readonly<Record<FoundationCommandName, Readonly<FoundationDefinition>>> = {
    /** Read Attributes */
    read: {
        ID: 0x00,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'attrId', type: DataType.UINT16},
        ],
        response: 0x01, // readRsp
    },
    /** Read Attributes Response */
    readRsp: {
        ID: 0x01,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'attrId', type: DataType.UINT16},
            {name: 'status', type: DataType.UINT8},
            {name: 'dataType', type: DataType.UINT8, conditions: [{type: 'statusEquals', value: Status.SUCCESS}]},
            {name: 'attrData', type: BuffaloZclDataType.USE_DATA_TYPE, conditions: [{type: 'statusEquals', value: Status.SUCCESS}]},
        ],
    },
    /** Write Attributes */
    write: {
        ID: 0x02,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'attrId', type: DataType.UINT16},
            {name: 'dataType', type: DataType.UINT8},
            {name: 'attrData', type: BuffaloZclDataType.USE_DATA_TYPE},
        ],
        response: 0x04, // writeRsp
    },
    /** Write Attributes Undivided */
    writeUndiv: {
        ID: 0x03,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'attrId', type: DataType.UINT16},
            {name: 'dataType', type: DataType.UINT8},
            {name: 'attrData', type: BuffaloZclDataType.USE_DATA_TYPE},
        ],
    },
    /** Write Attributes Response */
    writeRsp: {
        ID: 0x04,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'status', type: DataType.UINT8},
            {name: 'attrId', type: DataType.UINT16, conditions: [{type: 'statusNotEquals', value: Status.SUCCESS}]},
        ],
    },
    /** Write Attributes No Response */
    writeNoRsp: {
        ID: 0x05,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'attrId', type: DataType.UINT16},
            {name: 'dataType', type: DataType.UINT8},
            {name: 'attrData', type: BuffaloZclDataType.USE_DATA_TYPE},
        ],
    },
    /** Configure Reporting */
    configReport: {
        ID: 0x06,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'direction', type: DataType.UINT8},
            {name: 'attrId', type: DataType.UINT16},
            {name: 'dataType', type: DataType.UINT8, conditions: [{type: 'directionEquals', value: Direction.CLIENT_TO_SERVER}]},
            {name: 'minRepIntval', type: DataType.UINT16, conditions: [{type: 'directionEquals', value: Direction.CLIENT_TO_SERVER}]},
            {name: 'maxRepIntval', type: DataType.UINT16, conditions: [{type: 'directionEquals', value: Direction.CLIENT_TO_SERVER}]},
            {name: 'repChange', type: BuffaloZclDataType.USE_DATA_TYPE, conditions: [{type: 'directionEquals', value: Direction.CLIENT_TO_SERVER}, {type: 'dataTypeValueTypeEquals', value: 'ANALOG'}]},
            {name: 'timeout', type: DataType.UINT16, conditions: [{type: 'directionEquals', value: Direction.SERVER_TO_CLIENT}]},
        ],
        response: 0x07, // configReportRsp
    },
    /** Configure Reporting Response */
    configReportRsp: {
        ID: 0x07,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'status', type: DataType.UINT8},
            // minimumRemainingBufferBytes: if direction is present, attrId is also present
            // https://github.com/Koenkk/zigbee-herdsman/pull/115
            {name: 'direction', type: DataType.UINT8, conditions: [{type: 'minimumRemainingBufferBytes', value: 3}]},
            {name: 'attrId', type: DataType.UINT16, conditions: [{type: 'minimumRemainingBufferBytes', value: 2}]},
        ],
    },
    /** Read Reporting Configuration */
    readReportConfig: {
        ID: 0x08,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'direction', type: DataType.UINT8},
            {name: 'attrId', type: DataType.UINT16},
        ],
    },
    /** Read Reporting Configuration Response */
    readReportConfigRsp: {
        ID: 0x09,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'direction', type: DataType.UINT8},
            {name: 'attrId', type: DataType.UINT16},
            {name: 'dataType', type: DataType.UINT8, conditions: [{type: 'directionEquals', value: Direction.CLIENT_TO_SERVER}]},
            {name: 'minRepIntval', type: DataType.UINT16, conditions: [{type: 'directionEquals', value: Direction.CLIENT_TO_SERVER}]},
            {name: 'maxRepIntval', type: DataType.UINT16, conditions: [{type: 'directionEquals', value: Direction.CLIENT_TO_SERVER}]},
            {name: 'repChange', type: BuffaloZclDataType.USE_DATA_TYPE, conditions: [{type: 'directionEquals', value: Direction.CLIENT_TO_SERVER}, {type: 'dataTypeValueTypeEquals', value: 'ANALOG'}]},
            {name: 'timeout', type: DataType.UINT16, conditions: [{type: 'directionEquals', value: Direction.SERVER_TO_CLIENT}]},
        ],
    },
    /** Report attributes */
    report: {
        ID: 0x0A,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'attrId', type: DataType.UINT16},
            {name: 'dataType', type: DataType.UINT8},
            {name: 'attrData', type: BuffaloZclDataType.USE_DATA_TYPE},
        ],
    },
    /** Default Response */
    defaultRsp: {
        ID: 0x0B,
        parseStrategy: 'flat',
        parameters: [
            {name: 'cmdId', type: DataType.UINT8},
            {name: 'statusCode', type: DataType.UINT8},
        ],
    },
    /** Discover Attributes */
    discover: {
        ID: 0x0C,
        parseStrategy: 'flat',
        parameters: [
            {name: 'startAttrId', type: DataType.UINT16},
            {name: 'maxAttrIds', type: DataType.UINT8},
        ],
    },
    /** Discover Attributes Response */
    discoverRsp: {
        ID: 0x0D,
        parseStrategy: 'oneof',
        parameters: [
            {name: 'attrId', type: DataType.UINT16},
            {name: 'dataType', type: DataType.UINT8},
        ],
    },
    /** Read Attributes Structured */
    readStructured: {
        ID: 0x0E,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'attrId', type: DataType.UINT16},
            {name: 'selector', type: BuffaloZclDataType.STRUCTURED_SELECTOR},
        ],
    },
    /** Write Attributes Structured */
    writeStructured: {
        ID: 0x0F,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'attrId', type: DataType.UINT16},
            {name: 'selector', type: BuffaloZclDataType.STRUCTURED_SELECTOR},
            {name: 'dataType', type: DataType.UINT8},
            {name: 'elementData', type: BuffaloZclDataType.USE_DATA_TYPE},
        ],
        response: 0x10,// writeStructuredRsp
    },
    /** Write Attributes Structured response */
    writeStructuredRsp: {
        ID: 0x10,
        parseStrategy: 'repetitive',
        // contains only one SUCCESS record for all written attributes if all written successfully
        parameters: [
            {name: 'status', type: DataType.UINT8},
            {name: 'attrId', type: DataType.UINT16, conditions: [{type: 'statusNotEquals', value: Status.SUCCESS}]},
            // always one zero-octet if failed attribute not of type array or structure, otherwise can also be zero if no info on which element caused failure
            {name: 'selector', type: BuffaloZclDataType.STRUCTURED_SELECTOR, conditions: [{type: 'statusNotEquals', value: Status.SUCCESS}]},
        ],
    },
    /** Discover Commands Received */
    discoverCommands: {
        ID: 0x11,
        parseStrategy: 'flat',
        parameters: [
            {name: 'startCmdId', type: DataType.UINT8},
            {name: 'maxCmdIds', type: DataType.UINT8},
        ],
    },
    /** Discover Commands Received Response */
    discoverCommandsRsp: {
        ID: 0x12,
        parseStrategy: 'oneof',
        parameters: [
            {name: 'cmdId', type: DataType.UINT8},
        ],
    },
    /** Discover Commands Generated */
    discoverCommandsGen: {
        ID: 0x13,
        parseStrategy: 'flat',
        parameters: [
            {name: 'startCmdId', type: DataType.UINT8},
            {name: 'maxCmdIds', type: DataType.UINT8},
        ],
    },
    /** Discover Commands Generated Response */
    discoverCommandsGenRsp: {
        ID: 0x14,
        parseStrategy: 'oneof',
        parameters: [
            {name: 'cmdId', type: DataType.UINT8},
        ],
    },
    /** Discover Attributes Extended */
    discoverExt: {
        ID: 0x15,
        parseStrategy: 'flat',
        parameters: [
            {name: 'startAttrId', type: DataType.UINT16},
            {name: 'maxAttrIds', type: DataType.UINT8},
        ],
    },
    /** Discover Attributes Extended Response */
    discoverExtRsp: {
        ID: 0x16,
        parseStrategy: 'oneof',
        parameters: [
            {name: 'attrId', type: DataType.UINT16},
            {name: 'dataType', type: DataType.UINT8},
            {name: 'access', type: DataType.UINT8},
        ],
    },
};

export default Foundation;
