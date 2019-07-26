import DataType from './dataType';
import * as TsType from './tstype';

interface FoundationDefinition {
    ID: number;
    meta: {
        type: 'repetitive' | 'flat' | 'oneof';
        statusBehaviour?: 'SkipIfSucess' | 'SkipIfFailure';
    }
    parameters: TsType.Parameter[];
};

const Foundation: {
    [s: string]: FoundationDefinition;
}
= {
    read: {
        ID: 0,
        meta: {type: 'repetitive'},
        parameters: [
            {name: 'attrId', type: DataType.uint16},
        ],
    },
    readRsp: {
        ID: 1,
        meta: {type: 'repetitive', statusBehaviour: 'SkipIfFailure'},
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'status', type: DataType.uint8},
            {name: 'dataType', type: DataType.uint8},
            {name: 'attrData', type: DataType.attrData},
        ],
    },
    write: {
        ID: 2,
        meta: {type: 'repetitive'},
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'dataType', type: DataType.uint8},
            {name: 'attrData', type: DataType.attrData},
        ],
    },
    writeUndiv: {
        ID: 3,
        meta: {type: 'repetitive'},
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'dataType', type: DataType.uint8},
            {name: 'attrData', type: DataType.attrData},
        ],
    },
    writeRsp: {
        ID: 4,
        meta: {type: 'repetitive', statusBehaviour: 'SkipIfSucess'},
        parameters: [
            {name: 'status', type: DataType.uint8},
            {name: 'attrId', type: DataType.uint16},
        ],
    },
    writeNoRsp: {
        ID: 5,
        meta: {type: 'repetitive'},
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'dataType', type: DataType.uint8},
            {name: 'attrData', type: DataType.attrData},
        ],
    },
    configReport: {
        ID: 6,
        meta: {type: 'repetitive'},
        parameters: [
            {name: 'direction', type: DataType.uint8},
            {name: 'attrId', type: DataType.uint16},
            {name: 'extra', type: DataType.configReport}, // TODO
        ],
    },
    configReportRsp: {
        ID: 7,
        meta: {type: 'repetitive', statusBehaviour: 'SkipIfSucess'},
        parameters: [
            {name: 'status', type: DataType.uint8},
            {name: 'direction', type: DataType.uint8},
            {name: 'attrId', type: DataType.uint16},
        ],
    },
    readReportConfig: {
        ID: 8,
        meta: {type: 'repetitive'},
        parameters: [
            {name: 'direction', type: DataType.uint8},
            {name: 'attrId', type: DataType.uint16},
        ],
    },
    readReportConfigRsp: {
        ID: 9,
        meta: {type: 'repetitive'},
        parameters: [
            {name: 'status', type: DataType.uint8},
            {name: 'direction', type: DataType.uint8},
            {name: 'attrId', type: DataType.uint16},
            {name: 'extra', type: DataType.readReportConfigRsp}, // TODO same as configReport?
        ],
    },
    report: {
        ID: 10,
        meta: {type: 'repetitive'},
        parameters: [
            {name: 'attrId', type: DataType.uint16},
            {name: 'dataType', type: DataType.uint8},
            {name: 'attrData', type: DataType.attrData},
        ],
    },
    defaultRsp: {
        ID: 11,
        meta: {type: 'flat'},
        parameters: [
            {name: 'cmdId', type: DataType.uint8},
            {name: 'statusCode', type: DataType.uint8},
        ],
    },
    discover: {
        ID: 12,
        meta: {type: 'flat'},
        parameters: [
            {name: 'startAttrId', type: DataType.uint16},
            {name: 'maxAttrIds', type: DataType.uint8},
        ],
    },
    discoverRsp: {
        ID: 13,
        meta: {type: 'oneof'},
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
}

export default Foundation;