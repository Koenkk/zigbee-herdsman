import DataType from './dataType';

interface Attribute {
    ID: number;
    type: DataType;
}

interface Parameter {
    name: string;
    type: DataType;
}

interface Command {
    ID: number;
    parameters: Parameter[];
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
};

export {
    Cluster, Attribute, Command, Parameter,
}