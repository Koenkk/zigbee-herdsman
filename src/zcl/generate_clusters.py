import json

SPACE4 = "    "
SPACE8 = SPACE4 + SPACE4
SPACE12 = SPACE8 + SPACE4
SPACE16 = SPACE8 + SPACE8
SPACE20 = SPACE16 + SPACE4

with open('../zcl-id/definitions/cluster_defs.json') as data_file:
    data = json.load(data_file)

with open('../zcl-id/definitions/common.json') as data_file:
    datak = json.load(data_file)
    clusterId = datak['clusterId']
    foundationId = datak['foundation']

with open('../zcl-packet/lib/defs/zcl_meta.json') as data_file:
    zclMetaD = json.load(data_file)
    zclMeta = zclMetaD['functional']
    zclMetaFoundation = zclMetaD['foundation']

file = open("cluster.ts", "w")

file.write("""import DataType from './dataType';
import * as TsType from './tstype';

interface ClusterDefinition {
    ID: number;
    attributes: {[s: string]: TsType.Attribute};
    commands: {
        [s: string]: TsType.Command;
    };
    commandsResponse: {
        [s: string]: TsType.Command;
    };
};

const Cluster: {
    [s: string]: ClusterDefinition;
}
= {\n""")

for cluster, definition in data.items():
    file.write(SPACE4 + "%s: {\n" % (cluster))

    file.write(SPACE8 + "ID: %s,\n" % clusterId[cluster])

    # Attributes
    file.write(SPACE8 + "attributes: {\n")
    if definition['attrId'] != None:
        for key, attr in definition['attrId'].items():
            attrtype = "DataType." + attr['type']
            file.write(SPACE12 + "%s: {ID: %s, type: %s},\n" % (key, attr['id'], attrtype))

    file.write(SPACE8 + "},\n")

    # Commands
    file.write(SPACE8 + "commands: {\n")
    if definition['cmd'] != None:
        for key, ID in definition['cmd'].items():
            if not cluster in zclMeta:
                continue

            meta = zclMeta[cluster][key]
            file.write(SPACE12 + "%s: {\n" % key)

            file.write(SPACE16 + "ID: %s,\n" % ID)

            file.write(SPACE16 + 'parameters: [\n')
            for parameter in meta['params']:

                file.write(SPACE20 + "{name: '%s', type: DataType.%s},\n" % (list(parameter.keys())[0], list(parameter.values())[0]))

            file.write(SPACE16 + "],\n")

            file.write(SPACE12 + "},\n")

    file.write(SPACE8 + "},\n")

    # Commands response
    file.write(SPACE8 + "commandsResponse: {\n")
    if definition['cmdRsp'] != None:
        for key, ID in definition['cmdRsp'].items():
            if not cluster in zclMeta:
                continue

            meta = zclMeta[cluster][key]
            file.write(SPACE12 + "%s: {\n" % key)

            file.write(SPACE16 + "ID: %s,\n" % ID)

            file.write(SPACE16 + 'parameters: [\n')
            for parameter in meta['params']:

                file.write(SPACE20 + "{name: '%s', type: DataType.%s},\n" % (list(parameter.keys())[0], list(parameter.values())[0]))

            file.write(SPACE16 + "],\n")

            file.write(SPACE12 + "},\n")

    file.write(SPACE8 + "},\n")

    file.write(SPACE4 + "},\n")

file.write("}\n\n")
file.write("export default Cluster;")
file.close()





file = open("foundation.ts", "w")

file.write("""import DataType from './dataType';
import * as TsType from './tstype';

interface FoundationDefinition {
    ID: number;
    knownBufLen: number;
    parameters: TsType.Parameter[];
};

const Foundation: {
    [s: string]: FoundationDefinition;
}
= {\n""")

for key, id in foundationId.items():
    file.write(SPACE4 + "%s: {\n" % (key))

    file.write(SPACE8 + "ID: %s,\n" % id)


    meta = zclMetaFoundation[key]
    file.write(SPACE8 + 'knownBufLen: %s,\n' % meta['knownBufLen'])

    file.write(SPACE8 + 'parameters: [\n')
    for parameter in meta['params']:

        file.write(SPACE12 + "{name: '%s', type: DataType.%s},\n" % (list(parameter.keys())[0], list(parameter.values())[0]))

    file.write(SPACE8 + "],\n")

    file.write(SPACE4 + "},\n")

file.write("}\n\n")
file.write("export default Foundation;")
file.close()