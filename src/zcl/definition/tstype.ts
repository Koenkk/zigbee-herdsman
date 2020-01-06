import DataType from './dataType';
import BuffaloZclDataType from './buffaloZclDataType';
import * as TsType from '../tstype';

interface FoundationParameterDefinition extends TsType.Parameter {
    conditions?: {
        type: 'statusEquals' |
            'statusNotEquals' |
            'minimumRemainingBufferBytes' |
            'directionEquals' |
            'dataTypeValueTypeEquals';
        value?: number | string;
    }[];
    name: string;
    type: DataType | BuffaloZclDataType;
}

export {
    FoundationParameterDefinition,
};