import DataType from './dataType';
import BuffaloZclDataType from './buffaloZclDataType';
import * as TsType from '../tstype';

interface ParameterDefinition extends TsType.Parameter {
    conditions?: {
        type: 'statusEquals' |
            'statusNotEquals' |
            'minimumRemainingBufferBytes' |
            'directionEquals' |
            'bitMaskSet' |
            'bitFieldEnum' |
            'dataTypeValueTypeEquals';
        param?: string;
        mask?: number;
        offset?: number;
        size?: number;
        value?: number | string;
    }[];
    name: string;
    type: DataType | BuffaloZclDataType;
}

interface AttributeDefinition {
    ID: number;
    type: DataType;
    manufacturerCode?: number;
}

interface ClusterDefinition {
    ID: number;
    manufacturerCode?: number;
    attributes: {[s: string]: AttributeDefinition};
    commands: {
        [s: string]: CommandDefinition;
    };
    commandsResponse: {
        [s: string]: CommandDefinition;
    };
}

interface CommandDefinition {
    ID: number;
    parameters: ParameterDefinition[];
    response?: number;
}

export {
    ParameterDefinition,
    ClusterDefinition
};