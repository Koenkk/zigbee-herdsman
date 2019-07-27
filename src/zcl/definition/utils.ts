import DataType from './dataType';

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
    } else if (DataTypeValueType.discrete.includes(dataType)) {
        return 'ANALOG';
    } else {
        throw new Error(`Don't know value type for '${DataType[dataType]}'`)
    }
}

export {
    IsDataTypeAnalogOrDiscrete,
}