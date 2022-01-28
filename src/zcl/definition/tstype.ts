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

export {
    ParameterDefinition,
};