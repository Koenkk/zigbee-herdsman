import json

tab = "    "
with open('zmt_defs.json', 'r') as infile:
    zmt_defs = json.load(infile)

with open('zpi_meta.json', 'r') as infile:
    zpi_meta = json.load(infile)

output = ""

def_type = ["POLL", "SREQ", "AREQ", "SRSP"]
def_parametertype = ["UINT8", "UINT16", "UINT32", "LONGADDR",
"ZDOMSGCB",
"DEVLISTBUFFER",
"NWKLISTBUFFER",
"_PRELENUINT8",
"_PRELENUINT16",
"PRELENLIST",
"PRELENBEACONLIST",
"DYNBUFFER",
"LISTBUFFER",
"BUFFER",
"BUFFER8",
"BUFFER16",
"BUFFER18",
"BUFFER32",
"BUFFER42",
"BUFFER100",
"UINT8ZDOIND",
"UINT32BE"
]

for subsystem, cmds in zmt_defs.items():
    output += (tab + "[Subsystem.%s]: [\n" % subsystem)

    for cmd in cmds:
        output += (tab + tab + "{\n")

        meta = zpi_meta[subsystem][cmd]
        output += tab + tab + tab + "name: '%s',\n" % cmd
        output += tab + tab + tab + "ID: %s,\n" % meta['cmdId']
        output += tab + tab + tab + "type: Type.%s,\n" % def_type[meta['type']]

        if 'req' in meta['params']:
            output += tab + tab + tab + "request: [\n"

            for t in meta['params']['req']:
                pname = list(t.keys())[0]
                ptype = t[pname]
                output += tab + tab + tab + tab
                output += "{name: '%s', parameterType: ParameterType.%s},\n" % (pname, def_parametertype[ptype])

            output += tab + tab + tab + "],\n"

        if 'rsp' in meta['params']:
            output += tab + tab + tab + "response: [\n"

            for t in meta['params']['rsp']:
                pname = list(t.keys())[0]
                ptype = t[pname]
                output += tab + tab + tab + tab
                output += "{name: '%s', parameterType: ParameterType.%s},\n" % (pname, def_parametertype[ptype])

            output += tab + tab + tab + "],\n"


        output += tab + tab + "},\n"

    output += (tab + "],\n")

text_file = open("Output.txt", "w")
text_file.write(output)
text_file.close()
