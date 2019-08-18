import DataType from './dataType';
import BuffaloZclDataType from './buffaloZclDataType';
import Status from './status';
import Direction from './direction';
import {FoundationParameterDefinition} from './tstype';

interface FoundationDefinition {
    ID: number;
    parseStrategy: 'repetitive' | 'flat' | 'oneof';
    parameters: FoundationParameterDefinition[];
};

const Foundation: {
    [s: string]: FoundationDefinition;
}
= {
    read: {
        ID: 0,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'attrId', type: DataType.uint16},
        ],
    },
    readRsp: {
        ID: 1,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'status', type: DataType.uint8},
            {name: 'dataType', type: DataType.uint8, conditions: [{type: 'statusEquals', value: Status.SUCCESS}]},
            {name: 'attrData', type: BuffaloZclDataType.USE_DATA_TYPE, conditions: [{type: 'statusEquals', value: Status.SUCCESS}]},
        ],
    },
    write: {
        ID: 2,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'dataType', type: DataType.uint8},
            {name: 'attrData', type: BuffaloZclDataType.USE_DATA_TYPE},
        ],
    },
    writeUndiv: {
        ID: 3,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'dataType', type: DataType.uint8},
            {name: 'attrData', type: BuffaloZclDataType.USE_DATA_TYPE},
        ],
    },
    writeRsp: {
        ID: 4,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'status', type: DataType.uint8},
            {name: 'attrId', type: DataType.uint16, conditions: [{type: 'statusNotEquals', value: Status.SUCCESS}]},
        ],
    },
    writeNoRsp: {
        ID: 5,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'dataType', type: DataType.uint8},
            {name: 'attrData', type: BuffaloZclDataType.USE_DATA_TYPE},
        ],
    },
    configReport: {
        ID: 6,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'direction', type: DataType.uint8},
            {name: 'attrId', type: DataType.uint16},
            {name: 'dataType', type: DataType.uint8, conditions: [{type: 'directionEquals', value: Direction.CLIENT_TO_SERVER}]},
            {name: 'minRepIntval', type: DataType.uint16, conditions: [{type: 'directionEquals', value: Direction.CLIENT_TO_SERVER}]},
            {name: 'maxRepIntval', type: DataType.uint16, conditions: [{type: 'directionEquals', value: Direction.CLIENT_TO_SERVER}]},
            {name: 'repChange', type: BuffaloZclDataType.USE_DATA_TYPE, conditions: [{type: 'directionEquals', value: Direction.CLIENT_TO_SERVER}, {type: 'dataTypeValueTypeEquals', value: 'ANALOG'}]},
            {name: 'timeout', type: DataType.uint16, conditions: [{type: 'directionEquals', value: Direction.SERVER_TO_CLIENT}]},
        ],
    },
    configReportRsp: {
        ID: 7,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'status', type: DataType.uint8},
            {name: 'direction', type: DataType.uint8, conditions: [{type: 'statusNotEquals', value: Status.SUCCESS}]},
            {name: 'attrId', type: DataType.uint16, conditions: [{type: 'statusNotEquals', value: Status.SUCCESS}]},
        ],
    },
    readReportConfig: {
        ID: 8,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'direction', type: DataType.uint8},
            {name: 'attrId', type: DataType.uint16},
        ],
    },
    readReportConfigRsp: {
        ID: 9,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'direction', type: DataType.uint8},
            {name: 'attrId', type: DataType.uint16},
            {name: 'dataType', type: DataType.uint8, conditions: [{type: 'directionEquals', value: Direction.CLIENT_TO_SERVER}]},
            {name: 'minRepIntval', type: DataType.uint16, conditions: [{type: 'directionEquals', value: Direction.CLIENT_TO_SERVER}]},
            {name: 'maxRepIntval', type: DataType.uint16, conditions: [{type: 'directionEquals', value: Direction.CLIENT_TO_SERVER}]},
            {name: 'repChange', type: BuffaloZclDataType.USE_DATA_TYPE, conditions: [{type: 'directionEquals', value: Direction.CLIENT_TO_SERVER}, {type: 'dataTypeValueTypeEquals', value: 'ANALOG'}]},
            {name: 'timeout', type: DataType.uint16, conditions: [{type: 'directionEquals', value: Direction.SERVER_TO_CLIENT}]},
        ],
    },
    report: {
        ID: 10,
        parseStrategy: 'repetitive',
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'dataType', type: DataType.uint8},
            {name: 'attrData', type: BuffaloZclDataType.USE_DATA_TYPE},
        ],
    },
    defaultRsp: {
        ID: 11,
        parseStrategy: 'flat',
        parameters: [
            {name: 'cmdId', type: DataType.uint8},
            {name: 'statusCode', type: DataType.uint8},
        ],
    },
    discover: {
        ID: 12,
        parseStrategy: 'flat',
        parameters: [
            {name: 'startAttrId', type: DataType.uint16},
            {name: 'maxAttrIds', type: DataType.uint8},
        ],
    },
    discoverRsp: {
        ID: 13,
        parseStrategy: 'oneof',
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'dataType', type: DataType.uint8},
        ],
    },

    /**
     * TODO: not all commands are supported yet, missing:
     * - 14: readStruct
     * - 15: writeStruct
     * - 16: writeStructRsp
     * - 17: discoverCommandsReceived
     * - 18: discoverCommandsReceivedResponse
     * - 19: discoverCommandsGenerated
     * - 20: discoverCommandsGeneratedResponse
     * - 21: discoverAttributesExtended
     * - 22: discoverAttributesExtendedResponse
     */
};

export default Foundation;