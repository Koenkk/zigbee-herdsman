
import {DataType, Cluster, Direction, Foundation} from './definition';
import * as TsType from './tstype';

const DataTypeValueType = {
    discrete: [
        DataType.data8, DataType.data16, DataType.data24, DataType.data32, DataType.data40,
        DataType.data48, DataType.data56, DataType.data64, DataType.boolean,
        DataType.bitmap8, DataType.bitmap16, DataType.bitmap24, DataType.bitmap32, DataType.bitmap40,
        DataType.bitmap48, DataType.bitmap56, DataType.bitmap64, DataType.enum8, DataType.enum16,
        DataType.octetStr, DataType.charStr, DataType.longOctetStr, DataType.longCharStr, DataType.array,
        DataType.struct, DataType.set, DataType.bag, DataType.clusterId, DataType.attrId, DataType.bacOid,
        DataType.ieeeAddr, DataType.secKey,
    ],
    analog:[
        DataType.uint8, DataType.uint16, DataType.uint24, DataType.uint32, DataType.uint40,
        DataType.uint48, DataType.uint56,
        DataType.int8, DataType.int16, DataType.int24, DataType.int32, DataType.int40,
        DataType.int48, DataType.int56, DataType.semiPrec, DataType.singlePrec, DataType.doublePrec,
        DataType.tod, DataType.date, DataType.utc,
    ],
};

function IsDataTypeAnalogOrDiscrete(dataType: DataType): 'ANALOG' | 'DISCRETE' {
    if (DataTypeValueType.discrete.includes(dataType)) {
        return 'DISCRETE';
    } else if (DataTypeValueType.analog.includes(dataType)) {
        return 'ANALOG';
    } else {
        throw new Error(`Don't know value type for '${DataType[dataType]}'`)
    }
}

function getCluster(key: string | number): TsType.Cluster {
    let name;

    if (typeof key === 'number') {
        for (let clusterName in Cluster) {
            if (Cluster[clusterName].ID === key) {
                name = clusterName;
                break;
            }
        }
    } else {
        name = key;
    }

    const cluster = Cluster[name];

    if (!cluster) {
        throw new Error(`Cluster with key '${key}' does not exist`)
    }

    // eslint-disable-next-line
    const attributes: {[s: string]: TsType.Attribute} = Object.assign({}, ...Object.entries(cluster.attributes).map(([k, v]): any => ({[k]: {...v, name: k}})));

    const getAttributeByID = (ID: number): TsType.Attribute => {
        return Object.values(attributes).find((a): boolean => a.ID === ID);
    }

    return {
        ID: cluster.ID,
        attributes,
        name,
        // eslint-disable-next-line
        commands: Object.assign({}, ...Object.entries(cluster.commands).map(([k, v]): any => ({[k]: {...v, name: k}}))),
        // eslint-disable-next-line
        commandsResponse: Object.assign({}, ...Object.entries(cluster.commandsResponse).map(([k, v]): any => ({[k]: {...v, name: k}}))),
        getAttributeByID,
    };
}

function getGlobalCommand(key: number | string): TsType.Command {
    let name;

    if (typeof key === 'number') {
        for (let commandName in Foundation) {
            if (Foundation[commandName].ID === key) {
                name = commandName;
                break;
            }
        }
    } else {
        name = key;
    }

    const command = Foundation[name];

    if (!command) {
        throw new Error(`Global command with key '${key}' does not exist`)
    }

    return {
        ID: command.ID,
        name,
        parameters: command.parameters,
    };
}

function getSpecificCommand(clusterKey: number | string, direction: Direction, key: number | string): TsType.Command {
    const cluster = getCluster(clusterKey);
    const commands = direction === Direction.CLIENT_TO_SERVER ? cluster.commands : cluster.commandsResponse;
    let name;

    if (typeof key === 'number') {
        for (let commandName in commands) {
            if (commands[commandName].ID === key) {
                name = commandName;
                break;
            }
        }
    } else {
        name = key;
    }

    const command = commands[name];

    if (!command) {
        throw new Error(`Cluster command with key '${key}' and direction '${Direction[direction]}' does not exist for cluster '${clusterKey}'`)
    }

    return command;
}

export {
    getCluster,
    getSpecificCommand,
    getGlobalCommand,
    IsDataTypeAnalogOrDiscrete,
}