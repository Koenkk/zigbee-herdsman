import DataType from './definition/dataType';
import BuffaloZclDataType from './definition/buffaloZclDataType';
import {TsType as BuffaloTsType} from '../buffalo';

interface Attribute {
    ID: number;
    name: string;
    type: DataType;
    manufacturerCode?: number;
}

interface Parameter {
    name: string;
    type: DataType | BuffaloZclDataType;
}

interface Command {
    ID: number;
    name: string;
    parameters: Parameter[];
    response?: number;
}

interface Cluster {
    ID: number;
    name: string;
    attributes: {[s: string]: Attribute};
    commands: {
        [s: string]: Command;
    };
    commandsResponse: {
        [s: string]: Command;
    };
    getAttribute: (key: number | string) => Attribute;
    hasAttribute: (key: number | string) => boolean;
    getCommand: (key: number | string) => Command;
    getCommandResponse: (key: number | string) => Command;
}

interface BuffaloZclOptions extends BuffaloTsType.Options {
    dataType?: string;
    attrId?: number;
}

type DataTypeValueType = 'ANALOG' | 'DISCRETE';

export {
    Cluster, Attribute, Command, Parameter, DataTypeValueType, BuffaloZclOptions,
};