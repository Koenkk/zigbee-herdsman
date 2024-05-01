import DataType from './definition/dataType';
import BuffaloZclDataType from './definition/buffaloZclDataType';

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
    parameters: readonly Parameter[];
    response?: number;
}

interface Cluster {
    ID: number;
    name: string;
    manufacturerCode?: number;
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

interface BuffaloZclOptions {
    length?: number;
    payload?: {
        mode?: number;// used to read ListThermoTransitions
        numoftrans?: number;// used to read ListThermoTransitions
        commandID?: number;// used to read GdpFrame
        payloadSize?: number;// used to read GdpFrame
    } & {[key: string]: unknown};
    dataType?: DataType;
    attrId?: number;
}

interface ZclArray {
    elementType: DataType | keyof typeof DataType;
    elements: unknown[];
}

type DataTypeValueType = 'ANALOG' | 'DISCRETE';

/**
 * The upper 4 bits of the Indicator subfield for Attributes Structured commands.
 */
enum StructuredIndicatorType {
    /**
     * Write: Only for attributes of type other than array, structure, set or bag
     * 
     * Read: Only for attributes of type other than array or structure
     */
    Whole = 0x00,
    /** Add element to the set/bag */
    WriteAdd = 0x10,
    /** Remove element from the set/bag */
    WriteRemove = 0x20,
}

interface StructuredSelector {
    indexes?: number[],
    indicatorType?: StructuredIndicatorType,
}

export {
    Cluster, Attribute, Command, Parameter, DataTypeValueType, BuffaloZclOptions, ZclArray, StructuredIndicatorType,
    StructuredSelector,
};