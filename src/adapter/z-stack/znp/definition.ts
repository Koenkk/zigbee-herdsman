import {Subsystem, Type as CommandType} from '../unpi/constants';
import ParameterType from './parameterType';
import {MtCmd} from './tstype';

const Definition: {
    [s: number]: MtCmd[];
}
= {
    [Subsystem.SYS]: [
        {
            name: 'resetReq',
            ID: 0,
            type: CommandType.AREQ,
            request: [
                {name: 'type', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'ping',
            ID: 1,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'capabilities', parameterType: ParameterType.UINT16},
            ],
        },
        {
            name: 'version',
            ID: 2,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'transportrev', parameterType: ParameterType.UINT8},
                {name: 'product', parameterType: ParameterType.UINT8},
                {name: 'majorrel', parameterType: ParameterType.UINT8},
                {name: 'minorrel', parameterType: ParameterType.UINT8},
                {name: 'maintrel', parameterType: ParameterType.UINT8},
                {name: 'revision', parameterType: ParameterType.UINT32},
            ],
        },
        {
            name: 'setExtAddr',
            ID: 3,
            type: CommandType.SREQ,
            request: [
                {name: 'extaddress', parameterType: ParameterType.IEEEADDR},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'getExtAddr',
            ID: 4,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'extaddress', parameterType: ParameterType.IEEEADDR},
            ],
        },
        {
            name: 'ramRead',
            ID: 5,
            type: CommandType.SREQ,
            request: [
                {name: 'address', parameterType: ParameterType.UINT16},
                {name: 'len', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'len', parameterType: ParameterType.UINT8},
                {name: 'value', parameterType: ParameterType.BUFFER},
            ],
        },
        {
            name: 'ramWrite',
            ID: 6,
            type: CommandType.SREQ,
            request: [
                {name: 'address', parameterType: ParameterType.UINT16},
                {name: 'len', parameterType: ParameterType.UINT8},
                {name: 'value', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'osalNvItemInit',
            ID: 7,
            type: CommandType.SREQ,
            request: [
                {name: 'id', parameterType: ParameterType.UINT16},
                {name: 'len', parameterType: ParameterType.UINT16},
                {name: 'initlen', parameterType: ParameterType.UINT8},
                {name: 'initvalue', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'osalNvRead',
            ID: 8,
            type: CommandType.SREQ,
            request: [
                {name: 'id', parameterType: ParameterType.UINT16},
                {name: 'offset', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'len', parameterType: ParameterType.UINT8},
                {name: 'value', parameterType: ParameterType.BUFFER},
            ],
        },
        {
            name: 'osalNvWrite',
            ID: 9,
            type: CommandType.SREQ,
            request: [
                {name: 'id', parameterType: ParameterType.UINT16},
                {name: 'offset', parameterType: ParameterType.UINT8},
                {name: 'len', parameterType: ParameterType.UINT8},
                {name: 'value', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'osalStartTimer',
            ID: 10,
            type: CommandType.SREQ,
            request: [
                {name: 'id', parameterType: ParameterType.UINT8},
                {name: 'timeout', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'osalStopTimer',
            ID: 11,
            type: CommandType.SREQ,
            request: [
                {name: 'id', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'random',
            ID: 12,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'value', parameterType: ParameterType.UINT16},
            ],
        },
        {
            name: 'adcRead',
            ID: 13,
            type: CommandType.SREQ,
            request: [
                {name: 'channel', parameterType: ParameterType.UINT8},
                {name: 'resolution', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'value', parameterType: ParameterType.UINT16},
            ],
        },
        {
            name: 'gpio',
            ID: 14,
            type: CommandType.SREQ,
            request: [
                {name: 'operation', parameterType: ParameterType.UINT8},
                {name: 'value', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'value', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'stackTune',
            ID: 15,
            type: CommandType.SREQ,
            request: [
                {name: 'operation', parameterType: ParameterType.UINT8},
                {name: 'value', parameterType: ParameterType.INT8},
            ],
            response: [
                {name: 'value', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'setTime',
            ID: 16,
            type: CommandType.SREQ,
            request: [
                {name: 'utc', parameterType: ParameterType.UINT32},
                {name: 'hour', parameterType: ParameterType.UINT8},
                {name: 'minute', parameterType: ParameterType.UINT8},
                {name: 'second', parameterType: ParameterType.UINT8},
                {name: 'month', parameterType: ParameterType.UINT8},
                {name: 'day', parameterType: ParameterType.UINT8},
                {name: 'year', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'getTime',
            ID: 17,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'utc', parameterType: ParameterType.UINT32},
                {name: 'hour', parameterType: ParameterType.UINT8},
                {name: 'minute', parameterType: ParameterType.UINT8},
                {name: 'second', parameterType: ParameterType.UINT8},
                {name: 'month', parameterType: ParameterType.UINT8},
                {name: 'day', parameterType: ParameterType.UINT8},
                {name: 'year', parameterType: ParameterType.UINT16},
            ],
        },
        {
            name: 'osalNvDelete',
            ID: 18,
            type: CommandType.SREQ,
            request: [
                {name: 'id', parameterType: ParameterType.UINT16},
                {name: 'len', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'osalNvLength',
            ID: 19,
            type: CommandType.SREQ,
            request: [
                {name: 'id', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'length', parameterType: ParameterType.UINT16},
            ],
        },
        {
            name: 'setTxPower',
            ID: 20,
            type: CommandType.SREQ,
            request: [
                {name: 'level', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'txpower', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'jammerParameters',
            ID: 21,
            type: CommandType.SREQ,
            request: [
                {name: 'jmrcntievents', parameterType: ParameterType.UINT16},
                {name: 'jmrhinoiselvl', parameterType: ParameterType.UINT8},
                {name: 'jmrdetectperiod', parameterType: ParameterType.UINT32},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'snifferParameters',
            ID: 22,
            type: CommandType.SREQ,
            request: [
                {name: 'param', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'zdiagsInitStats',
            ID: 23,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'zdiagsClearStats',
            ID: 24,
            type: CommandType.SREQ,
            request: [
                {name: 'clearnv', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'sysclock', parameterType: ParameterType.UINT32},
            ],
        },
        {
            name: 'zdiagsGetStats',
            ID: 25,
            type: CommandType.SREQ,
            request: [
                {name: 'attributeid', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'attributevalue', parameterType: ParameterType.UINT32},
            ],
        },
        {
            name: 'zdiagsRestoreStatsNv',
            ID: 26,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'zdiagsSaveStatsToNv',
            ID: 27,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'sysclock', parameterType: ParameterType.UINT32},
            ],
        },
        {
            name: 'osalNvReadExt',
            ID: 28,
            type: CommandType.SREQ,
            request: [
                {name: 'id', parameterType: ParameterType.UINT16},
                {name: 'offset', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'len', parameterType: ParameterType.UINT8},
                {name: 'value', parameterType: ParameterType.BUFFER},
            ],
        },
        {
            name: 'osalNvWriteExt',
            ID: 29,
            type: CommandType.SREQ,
            request: [
                {name: 'id', parameterType: ParameterType.UINT16},
                {name: 'offset', parameterType: ParameterType.UINT16},
                {name: 'len', parameterType: ParameterType.UINT16},
                {name: 'value', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'nvCreate',
            ID: 48,
            type: CommandType.SREQ,
            request: [
                {name: 'sysid', parameterType: ParameterType.UINT8},
                {name: 'itemid', parameterType: ParameterType.UINT16},
                {name: 'subid', parameterType: ParameterType.UINT16},
                {name: 'len', parameterType: ParameterType.UINT32},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'nvDelete',
            ID: 49,
            type: CommandType.SREQ,
            request: [
                {name: 'sysid', parameterType: ParameterType.UINT8},
                {name: 'itemid', parameterType: ParameterType.UINT16},
                {name: 'subid', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'nvLength',
            ID: 50,
            type: CommandType.SREQ,
            request: [
                {name: 'sysid', parameterType: ParameterType.UINT8},
                {name: 'itemid', parameterType: ParameterType.UINT16},
                {name: 'subid', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'len', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'nvRead',
            ID: 51,
            type: CommandType.SREQ,
            request: [
                {name: 'sysid', parameterType: ParameterType.UINT8},
                {name: 'itemid', parameterType: ParameterType.UINT16},
                {name: 'subid', parameterType: ParameterType.UINT16},
                {name: 'offset', parameterType: ParameterType.UINT16},
                {name: 'len', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'len', parameterType: ParameterType.UINT8},
                {name: 'value', parameterType: ParameterType.BUFFER},
            ],
        },
        {
            name: 'nvWrite',
            ID: 52,
            type: CommandType.SREQ,
            request: [
                {name: 'sysid', parameterType: ParameterType.UINT8},
                {name: 'itemid', parameterType: ParameterType.UINT16},
                {name: 'subid', parameterType: ParameterType.UINT16},
                {name: 'offset', parameterType: ParameterType.UINT16},
                {name: 'len', parameterType: ParameterType.UINT8},
                {name: 'value', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'nvUpdate',
            ID: 53,
            type: CommandType.SREQ,
            request: [
                {name: 'sysid', parameterType: ParameterType.UINT8},
                {name: 'itemid', parameterType: ParameterType.UINT16},
                {name: 'subid', parameterType: ParameterType.UINT16},
                {name: 'len', parameterType: ParameterType.UINT8},
                {name: 'value', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'nvCompact',
            ID: 54,
            type: CommandType.SREQ,
            request: [
                {name: 'threshold', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'resetInd',
            ID: 128,
            type: CommandType.AREQ,
            request: [
                {name: 'reason', parameterType: ParameterType.UINT8},
                {name: 'transportrev', parameterType: ParameterType.UINT8},
                {name: 'productid', parameterType: ParameterType.UINT8},
                {name: 'majorrel', parameterType: ParameterType.UINT8},
                {name: 'minorrel', parameterType: ParameterType.UINT8},
                {name: 'hwrev', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'osalTimerExpired',
            ID: 129,
            type: CommandType.AREQ,
            request: [
                {name: 'id', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'jammerInd',
            ID: 130,
            type: CommandType.AREQ,
            request: [
                {name: 'jammerind', parameterType: ParameterType.UINT8},
            ],
        },
    ],
    [Subsystem.MAC]: [
        {
            name: 'resetReq',
            ID: 1,
            type: CommandType.SREQ,
            request: [
                {name: 'setdefault', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'init',
            ID: 2,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'startReq',
            ID: 3,
            type: CommandType.SREQ,
            request: [
                {name: 'starttime', parameterType: ParameterType.UINT32},
                {name: 'panid', parameterType: ParameterType.UINT16},
                {name: 'logicalchannel', parameterType: ParameterType.UINT8},
                {name: 'channelpage', parameterType: ParameterType.UINT8},
                {name: 'beaconorder', parameterType: ParameterType.UINT8},
                {name: 'superframeorder', parameterType: ParameterType.UINT8},
                {name: 'pancoordinator', parameterType: ParameterType.UINT8},
                {name: 'batterylifeext', parameterType: ParameterType.UINT8},
                {name: 'coordrealignment', parameterType: ParameterType.UINT8},
                {name: 'realignkeysource', parameterType: ParameterType.BUFFER},
                {name: 'realignsecuritylevel', parameterType: ParameterType.UINT8},
                {name: 'realignkeyidmode', parameterType: ParameterType.UINT8},
                {name: 'realignkeyindex', parameterType: ParameterType.UINT8},
                {name: 'beaconkeysource', parameterType: ParameterType.BUFFER},
                {name: 'beaconsecuritylevel', parameterType: ParameterType.UINT8},
                {name: 'beaconkeyidmode', parameterType: ParameterType.UINT8},
                {name: 'beaconkeyindex', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'syncReq',
            ID: 4,
            type: CommandType.SREQ,
            request: [
                {name: 'logicalchannel', parameterType: ParameterType.UINT8},
                {name: 'channelpage', parameterType: ParameterType.UINT8},
                {name: 'trackbeacon', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'dataReq',
            ID: 5,
            type: CommandType.SREQ,
            request: [
                {name: 'destaddressmode', parameterType: ParameterType.UINT8},
                {name: 'destaddress', parameterType: ParameterType.IEEEADDR},
                {name: 'destpanid', parameterType: ParameterType.UINT16},
                {name: 'srcaddressmode', parameterType: ParameterType.UINT8},
                {name: 'handle', parameterType: ParameterType.UINT8},
                {name: 'txoption', parameterType: ParameterType.UINT8},
                {name: 'logicalchannel', parameterType: ParameterType.UINT8},
                {name: 'power', parameterType: ParameterType.UINT8},
                {name: 'keysource', parameterType: ParameterType.BUFFER},
                {name: 'securitylevel', parameterType: ParameterType.UINT8},
                {name: 'keyidmode', parameterType: ParameterType.UINT8},
                {name: 'keyindex', parameterType: ParameterType.UINT8},
                {name: 'msdulength', parameterType: ParameterType.UINT8},
                {name: 'msdu', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'associateReq',
            ID: 6,
            type: CommandType.SREQ,
            request: [
                {name: 'logicalchannel', parameterType: ParameterType.UINT8},
                {name: 'channelpage', parameterType: ParameterType.UINT8},
                {name: 'coordaddressmode', parameterType: ParameterType.UINT8},
                {name: 'coordaddress', parameterType: ParameterType.IEEEADDR},
                {name: 'coordpanid', parameterType: ParameterType.UINT16},
                {name: 'capabilityinformation', parameterType: ParameterType.UINT8},
                {name: 'keysource', parameterType: ParameterType.BUFFER},
                {name: 'securitylevel', parameterType: ParameterType.UINT8},
                {name: 'keyidmode', parameterType: ParameterType.UINT8},
                {name: 'keyindex', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'disassociateReq',
            ID: 7,
            type: CommandType.SREQ,
            request: [
                {name: 'deviceaddressmode', parameterType: ParameterType.UINT8},
                {name: 'deviceaddress', parameterType: ParameterType.IEEEADDR},
                {name: 'devicepanid', parameterType: ParameterType.UINT16},
                {name: 'disassociatereason', parameterType: ParameterType.UINT8},
                {name: 'txindirect', parameterType: ParameterType.UINT8},
                {name: 'keysource', parameterType: ParameterType.BUFFER},
                {name: 'securitylevel', parameterType: ParameterType.UINT8},
                {name: 'keyidmode', parameterType: ParameterType.UINT8},
                {name: 'keyindex', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'getReq',
            ID: 8,
            type: CommandType.SREQ,
            request: [
                {name: 'attribute', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'data', parameterType: ParameterType.BUFFER16},
            ],
        },
        {
            name: 'setReq',
            ID: 9,
            type: CommandType.SREQ,
            request: [
                {name: 'attribute', parameterType: ParameterType.UINT8},
                {name: 'attributevalue', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'scanReq',
            ID: 12,
            type: CommandType.SREQ,
            request: [
                {name: 'scanchannels', parameterType: ParameterType.UINT32},
                {name: 'scantype', parameterType: ParameterType.UINT8},
                {name: 'scanduration', parameterType: ParameterType.UINT8},
                {name: 'channelpage', parameterType: ParameterType.UINT8},
                {name: 'maxresults', parameterType: ParameterType.UINT8},
                {name: 'keysource', parameterType: ParameterType.BUFFER},
                {name: 'securitylevel', parameterType: ParameterType.UINT8},
                {name: 'keyidmode', parameterType: ParameterType.UINT8},
                {name: 'keyindex', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'pollReq',
            ID: 13,
            type: CommandType.SREQ,
            request: [
                {name: 'coordaddressmode', parameterType: ParameterType.UINT8},
                {name: 'coordaddress', parameterType: ParameterType.IEEEADDR},
                {name: 'coordpanid', parameterType: ParameterType.UINT16},
                {name: 'keysource', parameterType: ParameterType.BUFFER},
                {name: 'securitylevel', parameterType: ParameterType.UINT8},
                {name: 'keyidmode', parameterType: ParameterType.UINT8},
                {name: 'keyindex', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'purgeReq',
            ID: 14,
            type: CommandType.SREQ,
            request: [
                {name: 'msduhandle', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'setRxGainReq',
            ID: 15,
            type: CommandType.SREQ,
            request: [
                {name: 'mode', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'securityGetReq',
            ID: 48,
            type: CommandType.SREQ,
            request: [
                {name: 'attribute', parameterType: ParameterType.UINT8},
                {name: 'index1', parameterType: ParameterType.UINT8},
                {name: 'index2', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'securitySetReq',
            ID: 49,
            type: CommandType.SREQ,
            request: [
                {name: 'attribute', parameterType: ParameterType.UINT8},
                {name: 'attributevalue', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'associateRsp',
            ID: 80,
            type: CommandType.SREQ,
            request: [
                {name: 'extaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'assocshortaddress', parameterType: ParameterType.UINT16},
                {name: 'assocstatus', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'orphanRsp',
            ID: 81,
            type: CommandType.SREQ,
            request: [
                {name: 'extaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'assocshortaddress', parameterType: ParameterType.UINT16},
                {name: 'associatedmember', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'syncLossInd',
            ID: 128,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'panid', parameterType: ParameterType.UINT16},
                {name: 'logicalchannel', parameterType: ParameterType.UINT8},
                {name: 'channelpage', parameterType: ParameterType.UINT8},
                {name: 'keysource', parameterType: ParameterType.BUFFER8},
                {name: 'securitylevel', parameterType: ParameterType.UINT8},
                {name: 'keyidmode', parameterType: ParameterType.UINT8},
                {name: 'keyindex', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'associateInd',
            ID: 129,
            type: CommandType.AREQ,
            request: [
                {name: 'deviceextendedaddress', parameterType: ParameterType.IEEEADDR},
                {name: 'capabilities', parameterType: ParameterType.UINT8},
                {name: 'keysource', parameterType: ParameterType.BUFFER8},
                {name: 'securitylevel', parameterType: ParameterType.UINT8},
                {name: 'keyidmode', parameterType: ParameterType.UINT8},
                {name: 'keyindex', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'associateCnf',
            ID: 130,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'deviceshortaddress', parameterType: ParameterType.UINT16},
                {name: 'keysource', parameterType: ParameterType.BUFFER8},
                {name: 'securitylevel', parameterType: ParameterType.UINT8},
                {name: 'keyidmode', parameterType: ParameterType.UINT8},
                {name: 'keyindex', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'beaconNotifyInd',
            ID: 131,
            type: CommandType.AREQ,
            request: [
                {name: 'bsn', parameterType: ParameterType.UINT8},
                {name: 'timestamp', parameterType: ParameterType.UINT32},
                {name: 'coordinatoraddressmode', parameterType: ParameterType.UINT8},
                {name: 'coordinatorextendedaddress', parameterType: ParameterType.IEEEADDR},
                {name: 'panid', parameterType: ParameterType.UINT16},
                {name: 'superframespec', parameterType: ParameterType.UINT16},
                {name: 'logicalchannel', parameterType: ParameterType.UINT8},
                {name: 'gtspermit', parameterType: ParameterType.UINT8},
                {name: 'linkquality', parameterType: ParameterType.UINT8},
                {name: 'securityfailure', parameterType: ParameterType.UINT8},
                {name: 'keysource', parameterType: ParameterType.BUFFER8},
                {name: 'securitylevel', parameterType: ParameterType.UINT8},
                {name: 'keyidmode', parameterType: ParameterType.UINT8},
                {name: 'keyindex', parameterType: ParameterType.UINT8},
                {name: 'pendingaddrspec', parameterType: ParameterType.UINT8},
                {name: 'addresslist', parameterType: ParameterType.BUFFER32},
                {name: 'sdulength', parameterType: ParameterType.UINT8},
                {name: 'nsdu', parameterType: ParameterType.BUFFER},
            ],
        },
        {
            name: 'dataCnf',
            ID: 132,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'handle', parameterType: ParameterType.UINT8},
                {name: 'timestamp', parameterType: ParameterType.UINT32},
                {name: 'timestamp2', parameterType: ParameterType.UINT16},
            ],
        },
        {
            name: 'dataInd',
            ID: 133,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddrmode', parameterType: ParameterType.UINT8},
                {name: 'srcaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'dstaddrmode', parameterType: ParameterType.UINT8},
                {name: 'dstaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'timestamp', parameterType: ParameterType.UINT32},
                {name: 'timestamp2', parameterType: ParameterType.UINT16},
                {name: 'srcpanid', parameterType: ParameterType.UINT16},
                {name: 'dstpanid', parameterType: ParameterType.UINT16},
                {name: 'linkquality', parameterType: ParameterType.UINT8},
                {name: 'correlation', parameterType: ParameterType.UINT8},
                {name: 'rssi', parameterType: ParameterType.UINT8},
                {name: 'dsn', parameterType: ParameterType.UINT8},
                {name: 'keysource', parameterType: ParameterType.BUFFER8},
                {name: 'securitylevel', parameterType: ParameterType.UINT8},
                {name: 'keyidmode', parameterType: ParameterType.UINT8},
                {name: 'keyindex', parameterType: ParameterType.UINT8},
                {name: 'length', parameterType: ParameterType.UINT8},
                {name: 'data', parameterType: ParameterType.BUFFER},
            ],
        },
        {
            name: 'disassociateInd',
            ID: 134,
            type: CommandType.AREQ,
            request: [
                {name: 'extendedaddress', parameterType: ParameterType.IEEEADDR},
                {name: 'disassociatereason', parameterType: ParameterType.UINT8},
                {name: 'keysource', parameterType: ParameterType.BUFFER8},
                {name: 'securitylevel', parameterType: ParameterType.UINT8},
                {name: 'keyidmode', parameterType: ParameterType.UINT8},
                {name: 'keyindex', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'disassociateCnf',
            ID: 135,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'deviceaddrmode', parameterType: ParameterType.UINT8},
                {name: 'deviceaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'devicepanid', parameterType: ParameterType.UINT16},
            ],
        },
        {
            name: 'orphanInd',
            ID: 138,
            type: CommandType.AREQ,
            request: [
                {name: 'extendedaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'keysource', parameterType: ParameterType.BUFFER8},
                {name: 'securitylevel', parameterType: ParameterType.UINT8},
                {name: 'keyidmode', parameterType: ParameterType.UINT8},
                {name: 'keyindex', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'pollCnf',
            ID: 139,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'scanCnf',
            ID: 140,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'ed', parameterType: ParameterType.UINT8},
                {name: 'scantype', parameterType: ParameterType.UINT8},
                {name: 'channelpage', parameterType: ParameterType.UINT8},
                {name: 'unscannedchannellist', parameterType: ParameterType.UINT32},
                {name: 'resultlistcount', parameterType: ParameterType.UINT8},
                {name: 'resultlistmaxlength', parameterType: ParameterType.UINT8},
                {name: 'resultlist', parameterType: ParameterType.BUFFER},
            ],
        },
        {
            name: 'commStatusInd',
            ID: 141,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'srcaddrmode', parameterType: ParameterType.UINT8},
                {name: 'srcaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'dstaddrmode', parameterType: ParameterType.UINT8},
                {name: 'dstaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'devicepanid', parameterType: ParameterType.UINT16},
                {name: 'reason', parameterType: ParameterType.UINT8},
                {name: 'keysource', parameterType: ParameterType.BUFFER8},
                {name: 'securitylevel', parameterType: ParameterType.UINT8},
                {name: 'keyidmode', parameterType: ParameterType.UINT8},
                {name: 'keyindex', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'startCnf',
            ID: 142,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'rxEnableCnf',
            ID: 143,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'purgeCnf',
            ID: 144,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'handle', parameterType: ParameterType.UINT8},
            ],
        },
    ],
    [Subsystem.AF]: [
        {
            name: 'register',
            ID: 0,
            type: CommandType.SREQ,
            request: [
                {name: 'endpoint', parameterType: ParameterType.UINT8},
                {name: 'appprofid', parameterType: ParameterType.UINT16},
                {name: 'appdeviceid', parameterType: ParameterType.UINT16},
                {name: 'appdevver', parameterType: ParameterType.UINT8},
                {name: 'latencyreq', parameterType: ParameterType.UINT8},
                {name: 'appnuminclusters', parameterType: ParameterType.UINT8},
                {name: 'appinclusterlist', parameterType: ParameterType.LIST_UINT16},
                {name: 'appnumoutclusters', parameterType: ParameterType.UINT8},
                {name: 'appoutclusterlist', parameterType: ParameterType.LIST_UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'dataRequest',
            ID: 1,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'destendpoint', parameterType: ParameterType.UINT8},
                {name: 'srcendpoint', parameterType: ParameterType.UINT8},
                {name: 'clusterid', parameterType: ParameterType.UINT16},
                {name: 'transid', parameterType: ParameterType.UINT8},
                {name: 'options', parameterType: ParameterType.UINT8},
                {name: 'radius', parameterType: ParameterType.UINT8},
                {name: 'len', parameterType: ParameterType.UINT8},
                {name: 'data', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'dataRequestExt',
            ID: 2,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddrmode', parameterType: ParameterType.UINT8},
                {name: 'dstaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'destendpoint', parameterType: ParameterType.UINT8},
                {name: 'dstpanid', parameterType: ParameterType.UINT16},
                {name: 'srcendpoint', parameterType: ParameterType.UINT8},
                {name: 'clusterid', parameterType: ParameterType.UINT16},
                {name: 'transid', parameterType: ParameterType.UINT8},
                {name: 'options', parameterType: ParameterType.UINT8},
                {name: 'radius', parameterType: ParameterType.UINT8},
                {name: 'len', parameterType: ParameterType.UINT16},
                {name: 'data', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'dataRequestSrcRtg',
            ID: 3,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'destendpoint', parameterType: ParameterType.UINT8},
                {name: 'srcendpoint', parameterType: ParameterType.UINT8},
                {name: 'clusterid', parameterType: ParameterType.UINT16},
                {name: 'transid', parameterType: ParameterType.UINT8},
                {name: 'options', parameterType: ParameterType.UINT8},
                {name: 'radius', parameterType: ParameterType.UINT8},
                {name: 'relaycount', parameterType: ParameterType.UINT8},
                {name: 'relaylist', parameterType: ParameterType.LIST_UINT16},
                {name: 'len', parameterType: ParameterType.UINT8},
                {name: 'data', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'delete',
            ID: 4,
            type: CommandType.SREQ,
            request: [
                {name: 'endpoint', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'interPanCtl',
            ID: 16,
            type: CommandType.SREQ,
            request: [
                {name: 'cmd', parameterType: ParameterType.UINT8},
                {name: 'data', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'dataStore',
            ID: 17,
            type: CommandType.SREQ,
            request: [
                {name: 'index', parameterType: ParameterType.UINT16},
                {name: 'length', parameterType: ParameterType.UINT8},
                {name: 'data', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'dataRetrieve',
            ID: 18,
            type: CommandType.SREQ,
            request: [
                {name: 'timestamp', parameterType: ParameterType.UINT32},
                {name: 'index', parameterType: ParameterType.UINT16},
                {name: 'length', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'length', parameterType: ParameterType.UINT8},
                {name: 'data', parameterType: ParameterType.BUFFER},
            ],
        },
        {
            name: 'apsfConfigSet',
            ID: 19,
            type: CommandType.SREQ,
            request: [
                {name: 'endpoint', parameterType: ParameterType.UINT8},
                {name: 'framedelay', parameterType: ParameterType.UINT8},
                {name: 'windowsize', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'apsfConfigGet',
            ID: 20,
            type: CommandType.SREQ,
            request: [
                {name: 'endpoint', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'framedelay', parameterType: ParameterType.UINT8},
                {name: 'windowsize', parameterType: ParameterType.UINT8},
                {name: 'nomean', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'dataConfirm',
            ID: 128,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'endpoint', parameterType: ParameterType.UINT8},
                {name: 'transid', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'incomingMsg',
            ID: 129,
            type: CommandType.AREQ,
            request: [
                {name: 'groupid', parameterType: ParameterType.UINT16},
                {name: 'clusterid', parameterType: ParameterType.UINT16},
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'srcendpoint', parameterType: ParameterType.UINT8},
                {name: 'dstendpoint', parameterType: ParameterType.UINT8},
                {name: 'wasbroadcast', parameterType: ParameterType.UINT8},
                {name: 'linkquality', parameterType: ParameterType.UINT8},
                {name: 'securityuse', parameterType: ParameterType.UINT8},
                {name: 'timestamp', parameterType: ParameterType.UINT32},
                {name: 'transseqnumber', parameterType: ParameterType.UINT8},
                {name: 'len', parameterType: ParameterType.UINT8},
                {name: 'data', parameterType: ParameterType.BUFFER},
            ],
        },
        {
            name: 'incomingMsgExt',
            ID: 130,
            type: CommandType.AREQ,
            request: [
                {name: 'groupid', parameterType: ParameterType.UINT16},
                {name: 'clusterid', parameterType: ParameterType.UINT16},
                {name: 'srcaddrmode', parameterType: ParameterType.UINT8},
                {name: 'srcaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'srcendpoint', parameterType: ParameterType.UINT8},
                {name: 'srcpanid', parameterType: ParameterType.UINT16},
                {name: 'dstendpoint', parameterType: ParameterType.UINT8},
                {name: 'wasbroadcast', parameterType: ParameterType.UINT8},
                {name: 'linkquality', parameterType: ParameterType.UINT8},
                {name: 'securityuse', parameterType: ParameterType.UINT8},
                {name: 'timestamp', parameterType: ParameterType.UINT32},
                {name: 'transseqnumber', parameterType: ParameterType.UINT8},
                {name: 'len', parameterType: ParameterType.UINT16},
                {name: 'data', parameterType: ParameterType.BUFFER},
            ],
        },
        {
            name: 'reflectError',
            ID: 131,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'endpoint', parameterType: ParameterType.UINT8},
                {name: 'transid', parameterType: ParameterType.UINT8},
                {name: 'dstaddrmode', parameterType: ParameterType.UINT8},
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
            ],
        },
    ],
    [Subsystem.ZDO]: [
        {
            name: 'nwkAddrReq',
            ID: 0,
            type: CommandType.SREQ,
            request: [
                {name: 'ieeeaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'reqtype', parameterType: ParameterType.UINT8},
                {name: 'startindex', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'ieeeAddrReq',
            ID: 1,
            type: CommandType.SREQ,
            request: [
                {name: 'shortaddr', parameterType: ParameterType.UINT16},
                {name: 'reqtype', parameterType: ParameterType.UINT8},
                {name: 'startindex', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'nodeDescReq',
            ID: 2,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'nwkaddrofinterest', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'powerDescReq',
            ID: 3,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'nwkaddrofinterest', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'simpleDescReq',
            ID: 4,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'nwkaddrofinterest', parameterType: ParameterType.UINT16},
                {name: 'endpoint', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'activeEpReq',
            ID: 5,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'nwkaddrofinterest', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'matchDescReq',
            ID: 6,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'nwkaddrofinterest', parameterType: ParameterType.UINT16},
                {name: 'profileid', parameterType: ParameterType.UINT16},
                {name: 'numinclusters', parameterType: ParameterType.UINT8},
                {name: 'inclusterlist', parameterType: ParameterType.LIST_UINT16},
                {name: 'numoutclusters', parameterType: ParameterType.UINT8},
                {name: 'outclusterlist', parameterType: ParameterType.LIST_UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'complexDescReq',
            ID: 7,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'nwkaddrofinterest', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'userDescReq',
            ID: 8,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'nwkaddrofinterest', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'endDeviceAnnce',
            ID: 10,
            type: CommandType.SREQ,
            request: [
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'ieeeaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'capability', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'userDescSet',
            ID: 11,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'nwkaddrofinterest', parameterType: ParameterType.UINT16},
                {name: 'descriptor_len', parameterType: ParameterType.UINT8},
                {name: 'userdescriptor', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'serverDiscReq',
            ID: 12,
            type: CommandType.SREQ,
            request: [
                {name: 'servermask', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'endDeviceBindReq',
            ID: 32,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'localcoord', parameterType: ParameterType.UINT16},
                {name: 'localieee', parameterType: ParameterType.IEEEADDR},
                {name: 'endpoint', parameterType: ParameterType.UINT8},
                {name: 'profileid', parameterType: ParameterType.UINT16},
                {name: 'numinclusters', parameterType: ParameterType.UINT8},
                {name: 'inclusterlist', parameterType: ParameterType.LIST_UINT16},
                {name: 'numoutclusters', parameterType: ParameterType.UINT8},
                {name: 'outclusterlist', parameterType: ParameterType.LIST_UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'bindReq',
            ID: 33,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'srcaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'srcendpoint', parameterType: ParameterType.UINT8},
                {name: 'clusterid', parameterType: ParameterType.UINT16},
                {name: 'dstaddrmode', parameterType: ParameterType.UINT8},
                {name: 'dstaddress', parameterType: ParameterType.IEEEADDR},
                {name: 'dstendpoint', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'unbindReq',
            ID: 34,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'srcaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'srcendpoint', parameterType: ParameterType.UINT8},
                {name: 'clusterid', parameterType: ParameterType.UINT16},
                {name: 'dstaddrmode', parameterType: ParameterType.UINT8},
                {name: 'dstaddress', parameterType: ParameterType.IEEEADDR},
                {name: 'dstendpoint', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'setLinkKey',
            ID: 35,
            type: CommandType.SREQ,
            request: [
                {name: 'shortaddr', parameterType: ParameterType.UINT16},
                {name: 'ieeeaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'linkkey', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'removeLinkKey',
            ID: 36,
            type: CommandType.SREQ,
            request: [
                {name: 'ieeeaddr', parameterType: ParameterType.IEEEADDR},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'getLinkKey',
            ID: 37,
            type: CommandType.SREQ,
            request: [
                {name: 'ieeeaddr', parameterType: ParameterType.IEEEADDR},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'ieeeaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'linkkeydata', parameterType: ParameterType.BUFFER16},
            ],
        },
        {
            name: 'nwkDiscoveryReq',
            ID: 38,
            type: CommandType.SREQ,
            request: [
                {name: 'scanchannels', parameterType: ParameterType.UINT32},
                {name: 'scanduration', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'joinReq',
            ID: 39,
            type: CommandType.SREQ,
            request: [
                {name: 'logicalchannel', parameterType: ParameterType.UINT8},
                {name: 'panid', parameterType: ParameterType.UINT16},
                {name: 'extendedpanid', parameterType: ParameterType.IEEEADDR},
                {name: 'chosenparent', parameterType: ParameterType.UINT16},
                {name: 'parentdepth', parameterType: ParameterType.UINT8},
                {name: 'stackprofile', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'mgmtNwkDiscReq',
            ID: 48,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'scanchannels', parameterType: ParameterType.UINT32},
                {name: 'scanduration', parameterType: ParameterType.UINT8},
                {name: 'startindex', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'mgmtLqiReq',
            ID: 49,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'startindex', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'mgmtRtgReq',
            ID: 50,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'startindex', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'mgmtBindReq',
            ID: 51,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'startindex', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'mgmtLeaveReq',
            ID: 52,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'deviceaddress', parameterType: ParameterType.IEEEADDR},
                {name: 'removechildrenRejoin', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'mgmtDirectJoinReq',
            ID: 53,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'deviceaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'capinfo', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'mgmtPermitJoinReq',
            ID: 54,
            type: CommandType.SREQ,
            request: [
                {name: 'addrmode', parameterType: ParameterType.UINT8},
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'duration', parameterType: ParameterType.UINT8},
                {name: 'tcsignificance', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'mgmtNwkUpdateReq',
            ID: 55,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'dstaddrmode', parameterType: ParameterType.UINT8},
                {name: 'channelmask', parameterType: ParameterType.UINT32},
                {name: 'scanduration', parameterType: ParameterType.UINT8},
                {name: 'scancount', parameterType: ParameterType.UINT8},
                {name: 'nwkmanageraddr', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'msgCbRegister',
            ID: 62,
            type: CommandType.SREQ,
            request: [
                {name: 'clusterid', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'msgCbRemove',
            ID: 63,
            type: CommandType.SREQ,
            request: [
                {name: 'clusterid', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'startupFromApp',
            ID: 64,
            type: CommandType.SREQ,
            request: [
                {name: 'startdelay', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'autoFindDestination',
            ID: 65,
            type: CommandType.AREQ,
            request: [
                {name: 'endpoint', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'nwkAddrRsp',
            ID: 128,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'ieeeaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'startindex', parameterType: ParameterType.UINT8},
                {name: 'numassocdev', parameterType: ParameterType.UINT8},
                {name: 'assocdevlist', parameterType: ParameterType.LIST_ASSOC_DEV},
            ],
        },
        {
            name: 'ieeeAddrRsp',
            ID: 129,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'ieeeaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'startindex', parameterType: ParameterType.UINT8},
                {name: 'numassocdev', parameterType: ParameterType.UINT8},
                {name: 'assocdevlist', parameterType: ParameterType.LIST_ASSOC_DEV},
            ],
        },
        {
            name: 'nodeDescRsp',
            ID: 130,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'logicaltype_cmplxdescavai_userdescavai', parameterType: ParameterType.UINT8},
                {name: 'apsflags_freqband', parameterType: ParameterType.UINT8},
                {name: 'maccapflags', parameterType: ParameterType.UINT8},
                {name: 'manufacturercode', parameterType: ParameterType.UINT16},
                {name: 'maxbuffersize', parameterType: ParameterType.UINT8},
                {name: 'maxintransfersize', parameterType: ParameterType.UINT16},
                {name: 'servermask', parameterType: ParameterType.UINT16},
                {name: 'maxouttransfersize', parameterType: ParameterType.UINT16},
                {name: 'descriptorcap', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'powerDescRsp',
            ID: 131,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'currentpowermode_avaipowersrc', parameterType: ParameterType.UINT8},
                {name: 'currentpowersrc_currentpowersrclevel', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'simpleDescRsp',
            ID: 132,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'len', parameterType: ParameterType.UINT8},
                {name: 'endpoint', parameterType: ParameterType.UINT8},
                {name: 'profileid', parameterType: ParameterType.UINT16},
                {name: 'deviceid', parameterType: ParameterType.UINT16},
                {name: 'deviceversion', parameterType: ParameterType.UINT8},
                {name: 'numinclusters', parameterType: ParameterType.UINT8},
                {name: 'inclusterlist', parameterType: ParameterType.LIST_UINT16},
                {name: 'numoutclusters', parameterType: ParameterType.UINT8},
                {name: 'outclusterlist', parameterType: ParameterType.LIST_UINT16},
            ],
        },
        {
            name: 'activeEpRsp',
            ID: 133,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'activeepcount', parameterType: ParameterType.UINT8},
                {name: 'activeeplist', parameterType: ParameterType.LIST_UINT8},
            ],
        },
        {
            name: 'matchDescRsp',
            ID: 134,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'matchlength', parameterType: ParameterType.UINT8},
                {name: 'matchlist', parameterType: ParameterType.BUFFER},
            ],
        },
        {
            name: 'complexDescRsp',
            ID: 135,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'complexlength', parameterType: ParameterType.UINT8},
                {name: 'complexdesclist', parameterType: ParameterType.BUFFER},
            ],
        },
        {
            name: 'userDescRsp',
            ID: 136,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'userlength', parameterType: ParameterType.UINT8},
                {name: 'userdescriptor', parameterType: ParameterType.BUFFER},
            ],
        },
        {
            name: 'userDescConf',
            ID: 137,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
            ],
        },
        {
            name: 'serverDiscRsp',
            ID: 138,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'servermask', parameterType: ParameterType.UINT16},
            ],
        },
        {
            name: 'endDeviceBindRsp',
            ID: 160,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'bindRsp',
            ID: 161,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'unbindRsp',
            ID: 162,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'mgmtNwkDiscRsp',
            ID: 176,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'networkcount', parameterType: ParameterType.UINT8},
                {name: 'startindex', parameterType: ParameterType.UINT8},
                {name: 'networklistcount', parameterType: ParameterType.UINT8},
                {name: 'networklist', parameterType: ParameterType.LIST_NETWORK},
            ],
        },
        {
            name: 'mgmtLqiRsp',
            ID: 177,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'neighbortableentries', parameterType: ParameterType.UINT8},
                {name: 'startindex', parameterType: ParameterType.UINT8},
                {name: 'neighborlqilistcount', parameterType: ParameterType.UINT8},
                {name: 'neighborlqilist', parameterType: ParameterType.LIST_NEIGHBOR_LQI},
            ],
        },
        {
            name: 'mgmtRtgRsp',
            ID: 178,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'routingtableentries', parameterType: ParameterType.UINT8},
                {name: 'startindex', parameterType: ParameterType.UINT8},
                {name: 'routingtablelistcount', parameterType: ParameterType.UINT8},
                {name: 'routingtablelist', parameterType: ParameterType.LIST_ROUTING_TABLE},
            ],
        },
        {
            name: 'mgmtBindRsp',
            ID: 179,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'bindingtableentries', parameterType: ParameterType.UINT8},
                {name: 'startindex', parameterType: ParameterType.UINT8},
                {name: 'bindingtablelistcount', parameterType: ParameterType.UINT8},
                {name: 'bindingtablelist', parameterType: ParameterType.LIST_BIND_TABLE},
            ],
        },
        {
            name: 'mgmtLeaveRsp',
            ID: 180,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'mgmtDirectJoinRsp',
            ID: 181,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'mgmtPermitJoinRsp',
            ID: 182,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'mgmtNwkUpdateNotify',
            ID: 184,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'scannedchannels', parameterType: ParameterType.UINT32},
                {name: 'totaltrans', parameterType: ParameterType.UINT16},
                {name: 'transfails', parameterType: ParameterType.UINT16},
                {name: 'energylength', parameterType: ParameterType.UINT8},
                {name: 'energyvalues', parameterType: ParameterType.LIST_UINT8},
            ],
        },
        {
            name: 'stateChangeInd',
            ID: 192,
            type: CommandType.AREQ,
            request: [
                {name: 'state', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'endDeviceAnnceInd',
            ID: 193,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'ieeeaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'capabilities', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'matchDescRspSent',
            ID: 194,
            type: CommandType.AREQ,
            request: [
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'numinclusters', parameterType: ParameterType.UINT8},
                {name: 'inclusterlist', parameterType: ParameterType.LIST_UINT16},
                {name: 'numoutclusters', parameterType: ParameterType.UINT8},
                {name: 'outclusterlist', parameterType: ParameterType.LIST_UINT16},
            ],
        },
        {
            name: 'statusErrorRsp',
            ID: 195,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'srcRtgInd',
            ID: 196,
            type: CommandType.AREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'relaycount', parameterType: ParameterType.UINT8},
                {name: 'relaylist', parameterType: ParameterType.LIST_UINT16},
            ],
        },
        {
            name: 'beacon_notify_ind',
            ID: 197,
            type: CommandType.AREQ,
            request: [
                {name: 'beaconcount', parameterType: ParameterType.UINT8},
                {name: 'beaconlist', parameterType: ParameterType.BUFFER}, // FIXME
            ],
        },
        {
            name: 'joinCnf',
            ID: 198,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'deviceaddress', parameterType: ParameterType.UINT16},
                {name: 'parentaddress', parameterType: ParameterType.UINT16},
            ],
        },
        {
            name: 'nwkDiscoveryCnf',
            ID: 199,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'concentratorIndCb',
            ID: 200,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'extaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'pktCost', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'leaveInd',
            ID: 201,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'extaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'request', parameterType: ParameterType.UINT8},
                {name: 'removechildren', parameterType: ParameterType.UINT8},
                {name: 'rejoin', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'setRejoinParametersReq',
            ID: 204,
            type: CommandType.SREQ,
            request: [
                {name: 'backoffduration', parameterType: ParameterType.UINT32},
                {name: 'scanduration', parameterType: ParameterType.UINT32},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'msgCbIncoming',
            ID: 255,
            type: CommandType.AREQ,
            request: [
                {name: 'srcaddr', parameterType: ParameterType.UINT16},
                {name: 'wasbroadcast', parameterType: ParameterType.UINT8},
                {name: 'clusterid', parameterType: ParameterType.UINT16},
                {name: 'securityuse', parameterType: ParameterType.UINT8},
                {name: 'seqnum', parameterType: ParameterType.UINT8},
                {name: 'macdstaddr', parameterType: ParameterType.UINT16},
                {name: 'msgdata', parameterType: ParameterType.BUFFER}, // FIXME
            ],
        },
        {
            name: 'endDeviceTimeoutReq',
            ID: 13,
            type: CommandType.SREQ,
            request: [
                {name: 'parentaddr', parameterType: ParameterType.UINT16},
                {name: 'reqrimeout', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'sendData',
            ID: 40,
            type: CommandType.SREQ,
            request: [
                {name: 'shortaddr', parameterType: ParameterType.UINT16},
                {name: 'transseq', parameterType: ParameterType.UINT8},
                {name: 'cmd', parameterType: ParameterType.UINT16},
                {name: 'len', parameterType: ParameterType.UINT8},
                {name: 'buf', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'nwkAddrOfInterestReq',
            ID: 41,
            type: CommandType.SREQ,
            request: [
                {name: 'shortaddr', parameterType: ParameterType.UINT16},
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'cmd', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'secAddLinkKey',
            ID: 66,
            type: CommandType.SREQ,
            request: [
                {name: 'shortaddr', parameterType: ParameterType.UINT16},
                {name: 'extaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'linkkey', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'secEntryLookupExt',
            ID: 67,
            type: CommandType.SREQ,
            request: [
                {name: 'extaddr', parameterType: ParameterType.IEEEADDR},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'ami', parameterType: ParameterType.UINT16},
                {name: 'keynvid', parameterType: ParameterType.UINT16},
                {name: 'authenticateoption', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'secDeviceRemove',
            ID: 68,
            type: CommandType.SREQ,
            request: [
                {name: 'extaddr', parameterType: ParameterType.IEEEADDR},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'extRouteDisc',
            ID: 69,
            type: CommandType.SREQ,
            request: [
                {name: 'dstAddr', parameterType: ParameterType.UINT16},
                {name: 'options', parameterType: ParameterType.UINT8},
                {name: 'radius', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'extRouteCheck',
            ID: 70,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'rtstatus', parameterType: ParameterType.UINT8},
                {name: 'options', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'extRemoveGroup',
            ID: 71,
            type: CommandType.SREQ,
            request: [
                {name: 'endpoint', parameterType: ParameterType.UINT8},
                {name: 'groupid', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'extRemoveAllGroup',
            ID: 72,
            type: CommandType.SREQ,
            request: [
                {name: 'endpoint', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'extFindAllGroupsEndpoint',
            ID: 73,
            type: CommandType.SREQ,
            request: [
                {name: 'endpoint', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'groups', parameterType: ParameterType.UINT8},
                {name: 'grouplist', parameterType: ParameterType.LIST_UINT16},
            ],
        },
        {
            name: 'extFindGroup',
            ID: 74,
            type: CommandType.SREQ,
            request: [
                {name: 'endpoint', parameterType: ParameterType.UINT8},
                {name: 'groupid', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'groupid', parameterType: ParameterType.UINT16},
                {name: 'namelen', parameterType: ParameterType.UINT8},
                {name: 'groupname', parameterType: ParameterType.BUFFER},
            ],
        },
        {
            name: 'extAddGroup',
            ID: 75,
            type: CommandType.SREQ,
            request: [
                {name: 'endpoint', parameterType: ParameterType.UINT8},
                {name: 'groupid', parameterType: ParameterType.UINT16},
                {name: 'namelen', parameterType: ParameterType.UINT8},
                {name: 'groupname', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'extCountAllGroups',
            ID: 76,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'extRxIdle',
            ID: 77,
            type: CommandType.SREQ,
            request: [
                {name: 'setflag', parameterType: ParameterType.UINT8},
                {name: 'setvalue', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'extUpdateNwkKey',
            ID: 78,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'keyseqnum', parameterType: ParameterType.UINT8},
                {name: 'key', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'extSwitchNwkKey',
            ID: 79,
            type: CommandType.SREQ,
            request: [
                {name: 'dstaddr', parameterType: ParameterType.UINT16},
                {name: 'keyseqnum', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'extNwkInfo',
            ID: 80,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'shortaddr', parameterType: ParameterType.UINT16},
                {name: 'devstate', parameterType: ParameterType.UINT8},
                {name: 'panid', parameterType: ParameterType.UINT16},
                {name: 'parentaddr', parameterType: ParameterType.UINT16},
                {name: 'extendedpanid', parameterType: ParameterType.IEEEADDR},
                {name: 'parentextaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'channel', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'extSecApsRemoveReq',
            ID: 81,
            type: CommandType.SREQ,
            request: [
                {name: 'parentaddr', parameterType: ParameterType.UINT16},
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'extaddr', parameterType: ParameterType.IEEEADDR},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'forceConcentratorChange',
            ID: 82,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
            ],
        },
        {
            name: 'extSetParams',
            ID: 83,
            type: CommandType.SREQ,
            request: [
                {name: 'usemulticast', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'tcDeviceInd',
            ID: 202,
            type: CommandType.AREQ,
            request: [
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'extaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'parentaddr', parameterType: ParameterType.UINT16},
            ],
        },
        {
            name: 'permitJoinInd',
            ID: 203,
            type: CommandType.AREQ,
            request: [
                {name: 'duration', parameterType: ParameterType.UINT8},
            ],
        },
    ],
    [Subsystem.SAPI]: [
        {
            name: 'systemReset',
            ID: 9,
            type: CommandType.AREQ,
            request: [
            ],
        },
        {
            name: 'startRequest',
            ID: 0,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
            ],
        },
        {
            name: 'bindDevice',
            ID: 1,
            type: CommandType.SREQ,
            request: [
                {name: 'action', parameterType: ParameterType.UINT8},
                {name: 'commandid', parameterType: ParameterType.UINT16},
                {name: 'destination', parameterType: ParameterType.IEEEADDR},
            ],
            response: [
            ],
        },
        {
            name: 'allowBind',
            ID: 2,
            type: CommandType.SREQ,
            request: [
                {name: 'timeout', parameterType: ParameterType.UINT8},
            ],
            response: [
            ],
        },
        {
            name: 'sendDataRequest',
            ID: 3,
            type: CommandType.SREQ,
            request: [
                {name: 'destination', parameterType: ParameterType.UINT16},
                {name: 'commandid', parameterType: ParameterType.UINT16},
                {name: 'handle', parameterType: ParameterType.UINT8},
                {name: 'txoptions', parameterType: ParameterType.UINT8},
                {name: 'radius', parameterType: ParameterType.UINT8},
                {name: 'payloadlen', parameterType: ParameterType.UINT8},
                {name: 'payloadvalue', parameterType: ParameterType.BUFFER},
            ],
            response: [
            ],
        },
        {
            name: 'readConfiguration',
            ID: 4,
            type: CommandType.SREQ,
            request: [
                {name: 'configid', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'configid', parameterType: ParameterType.UINT8},
                {name: 'len', parameterType: ParameterType.UINT8},
                {name: 'value', parameterType: ParameterType.BUFFER},
            ],
        },
        {
            name: 'writeConfiguration',
            ID: 5,
            type: CommandType.SREQ,
            request: [
                {name: 'configid', parameterType: ParameterType.UINT8},
                {name: 'len', parameterType: ParameterType.UINT8},
                {name: 'value', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'getDeviceInfo',
            ID: 6,
            type: CommandType.SREQ,
            request: [
                {name: 'param', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'param', parameterType: ParameterType.UINT8},
                {name: 'value', parameterType: ParameterType.BUFFER8},
            ],
        },
        {
            name: 'findDeviceRequest',
            ID: 7,
            type: CommandType.SREQ,
            request: [
                {name: 'searchKey', parameterType: ParameterType.IEEEADDR},
            ],
            response: [
            ],
        },
        {
            name: 'permitJoiningRequest',
            ID: 8,
            type: CommandType.SREQ,
            request: [
                {name: 'destination', parameterType: ParameterType.UINT16},
                {name: 'timeout', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'startConfirm',
            ID: 128,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'bindConfirm',
            ID: 129,
            type: CommandType.AREQ,
            request: [
                {name: 'commandid', parameterType: ParameterType.UINT16},
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'allowBindConfirm',
            ID: 130,
            type: CommandType.AREQ,
            request: [
                {name: 'source', parameterType: ParameterType.UINT16},
            ],
        },
        {
            name: 'sendDataConfirm',
            ID: 131,
            type: CommandType.AREQ,
            request: [
                {name: 'handle', parameterType: ParameterType.UINT8},
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'findDeviceConfirm',
            ID: 133,
            type: CommandType.AREQ,
            request: [
                {name: 'searchtype', parameterType: ParameterType.UINT8},
                {name: 'searchkey', parameterType: ParameterType.UINT16},
                {name: 'result', parameterType: ParameterType.IEEEADDR},
            ],
        },
        {
            name: 'receiveDataIndication',
            ID: 135,
            type: CommandType.AREQ,
            request: [
                {name: 'source', parameterType: ParameterType.UINT16},
                {name: 'command', parameterType: ParameterType.UINT16},
                {name: 'len', parameterType: ParameterType.UINT16},
                {name: 'data', parameterType: ParameterType.BUFFER},
            ],
        },
    ],
    [Subsystem.UTIL]: [
        {
            name: 'getDeviceInfo',
            ID: 0,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'ieeeaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'shortaddr', parameterType: ParameterType.UINT16},
                {name: 'devicetype', parameterType: ParameterType.UINT8},
                {name: 'devicestate', parameterType: ParameterType.UINT8},
                {name: 'numassocdevices', parameterType: ParameterType.UINT8},
                {name: 'assocdeviceslist', parameterType: ParameterType.LIST_UINT16},
            ],
        },
        {
            name: 'getNvInfo',
            ID: 1,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'ieeeaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'scanchannels', parameterType: ParameterType.UINT32},
                {name: 'panid', parameterType: ParameterType.UINT16},
                {name: 'securitylevel', parameterType: ParameterType.UINT8},
                {name: 'preconfigkey', parameterType: ParameterType.BUFFER16},
            ],
        },
        {
            name: 'setPanid',
            ID: 2,
            type: CommandType.SREQ,
            request: [
                {name: 'panid', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'setChannels',
            ID: 3,
            type: CommandType.SREQ,
            request: [
                {name: 'channels', parameterType: ParameterType.UINT32},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'setSeclevel',
            ID: 4,
            type: CommandType.SREQ,
            request: [
                {name: 'securitylevel', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'setPrecfgkey',
            ID: 5,
            type: CommandType.SREQ,
            request: [
                {name: 'preconfigkey', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'callbackSubCmd',
            ID: 6,
            type: CommandType.SREQ,
            request: [
                {name: 'subsystemid', parameterType: ParameterType.UINT16},
                {name: 'action', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'keyEvent',
            ID: 7,
            type: CommandType.SREQ,
            request: [
                {name: 'keys', parameterType: ParameterType.UINT8},
                {name: 'shift', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'timeAlive',
            ID: 9,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'seconds', parameterType: ParameterType.UINT32},
            ],
        },
        {
            name: 'ledControl',
            ID: 10,
            type: CommandType.SREQ,
            request: [
                {name: 'ledid', parameterType: ParameterType.UINT8},
                {name: 'mode', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'testLoopback',
            ID: 16,
            type: CommandType.SREQ,
            request: [
                {name: 'data', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'data', parameterType: ParameterType.BUFFER},
            ],
        },
        {
            name: 'dataReq',
            ID: 17,
            type: CommandType.SREQ,
            request: [
                {name: 'securityuse', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'srcMatchEnable',
            ID: 32,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'srcMatchAddEntry',
            ID: 33,
            type: CommandType.SREQ,
            request: [
                {name: 'addressmode', parameterType: ParameterType.UINT8},
                {name: 'address', parameterType: ParameterType.IEEEADDR},
                {name: 'panid', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'srcMatchDelEntry',
            ID: 34,
            type: CommandType.SREQ,
            request: [
                {name: 'addressmode', parameterType: ParameterType.UINT8},
                {name: 'address', parameterType: ParameterType.IEEEADDR},
                {name: 'panid', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'srcMatchCheckSrcAddr',
            ID: 35,
            type: CommandType.SREQ,
            request: [
                {name: 'addressmode', parameterType: ParameterType.UINT8},
                {name: 'address', parameterType: ParameterType.IEEEADDR},
                {name: 'panid', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'srcMatchAckAllPending',
            ID: 36,
            type: CommandType.SREQ,
            request: [
                {name: 'option', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'srcMatchCheckAllPending',
            ID: 37,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'value', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'addrmgrExtAddrLookup',
            ID: 64,
            type: CommandType.SREQ,
            request: [
                {name: 'extaddr', parameterType: ParameterType.IEEEADDR},
            ],
            response: [
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
            ],
        },
        {
            name: 'addrmgrNwkAddrLookup',
            ID: 65,
            type: CommandType.SREQ,
            request: [
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'extaddr', parameterType: ParameterType.IEEEADDR},
            ],
        },
        {
            name: 'apsmeLinkKeyDataGet',
            ID: 68,
            type: CommandType.SREQ,
            request: [
                {name: 'extaddr', parameterType: ParameterType.IEEEADDR},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'seckey', parameterType: ParameterType.BUFFER16},
                {name: 'txfrmcntr', parameterType: ParameterType.UINT32},
                {name: 'rxfrmcntr', parameterType: ParameterType.UINT32},
            ],
        },
        {
            name: 'apsmeLinkKeyNvIdGet',
            ID: 69,
            type: CommandType.SREQ,
            request: [
                {name: 'extaddr', parameterType: ParameterType.IEEEADDR},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'linkkeynvid', parameterType: ParameterType.UINT16},
            ],
        },
        {
            name: 'assocCount',
            ID: 72,
            type: CommandType.SREQ,
            request: [
                {name: 'startrelation', parameterType: ParameterType.UINT8},
                {name: 'endrelation', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'count', parameterType: ParameterType.UINT16},
            ],
        },
        {
            name: 'assocFindDevice',
            ID: 73,
            type: CommandType.SREQ,
            request: [
                {name: 'number', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'device', parameterType: ParameterType.BUFFER18},
            ],
        },
        {
            name: 'assocGetWithAddress',
            ID: 74,
            type: CommandType.SREQ,
            request: [
                {name: 'extaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'addridx', parameterType: ParameterType.UINT16},
                {name: 'noderelation', parameterType: ParameterType.UINT8},
                // NOTE: this commmand returns more.
            ],
        },
        {
            name: 'apsmeRequestKeyCmd',
            ID: 75,
            type: CommandType.SREQ,
            request: [
                {name: 'partneraddr', parameterType: ParameterType.IEEEADDR},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            // Custom command
            name: 'assocRemove',
            ID: 99,
            type: CommandType.SREQ,
            request: [
                {name: 'ieeeadr', parameterType: ParameterType.IEEEADDR},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            // Custom command
            name: 'assocAdd',
            ID: 100,
            type: CommandType.SREQ,
            request: [
                {name: 'ieeeadr', parameterType: ParameterType.IEEEADDR},
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'noderelation', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'zclKeyEstInitEst',
            ID: 128,
            type: CommandType.SREQ,
            request: [
                {name: 'taskid', parameterType: ParameterType.UINT8},
                {name: 'seqnum', parameterType: ParameterType.UINT8},
                {name: 'endpoint', parameterType: ParameterType.UINT8},
                {name: 'addrmode', parameterType: ParameterType.UINT8},
                {name: 'extaddr', parameterType: ParameterType.IEEEADDR},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'zclKeyEstSign',
            ID: 129,
            type: CommandType.SREQ,
            request: [
                {name: 'inputlen', parameterType: ParameterType.UINT8},
                {name: 'input', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'key', parameterType: ParameterType.BUFFER42},
            ],
        },
        {
            name: 'syncReq',
            ID: 224,
            type: CommandType.AREQ,
            request: [
            ],
        },
        {
            name: 'zclKeyEstablishInd',
            ID: 225,
            type: CommandType.AREQ,
            request: [
                {name: 'taskid', parameterType: ParameterType.UINT8},
                {name: 'event', parameterType: ParameterType.UINT8},
                {name: 'status', parameterType: ParameterType.UINT8},
                {name: 'waittime', parameterType: ParameterType.UINT8},
                {name: 'suite', parameterType: ParameterType.UINT16},
            ],
        },
        {
            name: 'gpioSetDirection',
            ID: 20,
            type: CommandType.SREQ,
            request: [
                {name: 'port', parameterType: ParameterType.UINT8},
                {name: 'bit', parameterType: ParameterType.UINT8},
                {name: 'direction', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'oldp0dir', parameterType: ParameterType.UINT8},
                {name: 'oldp1dir', parameterType: ParameterType.UINT8},
                {name: 'oldp2dir', parameterType: ParameterType.UINT8},
                {name: 'p0dir', parameterType: ParameterType.UINT8},
                {name: 'p1dir', parameterType: ParameterType.UINT8},
                {name: 'p2dir', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'gpioRead',
            ID: 21,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'p0', parameterType: ParameterType.UINT8},
                {name: 'p1', parameterType: ParameterType.UINT8},
                {name: 'p2', parameterType: ParameterType.UINT8},
                {name: 'p0dir', parameterType: ParameterType.UINT8},
                {name: 'p1dir', parameterType: ParameterType.UINT8},
                {name: 'p2dir', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'gpioWrite',
            ID: 22,
            type: CommandType.SREQ,
            request: [
                {name: 'port', parameterType: ParameterType.UINT8},
                {name: 'bit', parameterType: ParameterType.UINT8},
                {name: 'value', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'oldp0', parameterType: ParameterType.UINT8},
                {name: 'oldp1', parameterType: ParameterType.UINT8},
                {name: 'oldp2', parameterType: ParameterType.UINT8},
                {name: 'p0', parameterType: ParameterType.UINT8},
                {name: 'p1', parameterType: ParameterType.UINT8},
                {name: 'p2', parameterType: ParameterType.UINT8},
                {name: 'p0dir', parameterType: ParameterType.UINT8},
                {name: 'p1dir', parameterType: ParameterType.UINT8},
                {name: 'p2dir', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'srngGen',
            ID: 76,
            type: CommandType.SREQ,
            request: [
            ],
            response: [
                {name: 'outrng', parameterType: ParameterType.BUFFER100},
            ],
        },
        {
            name: 'bindAddEntry',
            ID: 77,
            type: CommandType.SREQ,
            request: [
                {name: 'addrmode', parameterType: ParameterType.UINT8},
                {name: 'dstaddr', parameterType: ParameterType.IEEEADDR},
                {name: 'dstendpoint', parameterType: ParameterType.UINT8},
                {name: 'numclusterids', parameterType: ParameterType.UINT8},
                {name: 'clusterids', parameterType: ParameterType.LIST_UINT16},
            ],
            response: [
                {name: 'srcep', parameterType: ParameterType.UINT8},
                {name: 'dstgroupmode', parameterType: ParameterType.UINT8},
                {name: 'dstidx', parameterType: ParameterType.UINT16},
                {name: 'dstep', parameterType: ParameterType.UINT8},
                {name: 'numclusterids', parameterType: ParameterType.UINT8},
                {name: 'clusterids', parameterType: ParameterType.BUFFER8},
            ],
        },
    ],
    [Subsystem.DEBUG]: [
        {
            name: 'setThreshold',
            ID: 0,
            type: CommandType.SREQ,
            request: [
                {name: 'componentid', parameterType: ParameterType.UINT8},
                {name: 'threshold', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'msg',
            ID: 128,
            type: CommandType.AREQ,
            request: [
                {name: 'length', parameterType: ParameterType.UINT8},
                {name: 'string', parameterType: ParameterType.BUFFER},
            ],
        },
    ],
    [Subsystem.APP]: [
        {
            name: 'msg',
            ID: 0,
            type: CommandType.SREQ,
            request: [
                {name: 'appendpoint', parameterType: ParameterType.UINT8},
                {name: 'destaddress', parameterType: ParameterType.UINT16},
                {name: 'destendpoint', parameterType: ParameterType.UINT8},
                {name: 'clusterid', parameterType: ParameterType.UINT16},
                {name: 'msglen', parameterType: ParameterType.UINT8},
                {name: 'message', parameterType: ParameterType.BUFFER},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'userTest',
            ID: 1,
            type: CommandType.SREQ,
            request: [
                {name: 'srcep', parameterType: ParameterType.UINT8},
                {name: 'commandid', parameterType: ParameterType.UINT16},
                {name: 'param1', parameterType: ParameterType.UINT16},
                {name: 'param2', parameterType: ParameterType.UINT16},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'zllTlInd',
            ID: 129,
            type: CommandType.AREQ,
            request: [
                {name: 'nwkaddr', parameterType: ParameterType.UINT16},
                {name: 'endpoint', parameterType: ParameterType.UINT8},
                {name: 'profileid', parameterType: ParameterType.UINT16},
                {name: 'deviceid', parameterType: ParameterType.UINT16},
                {name: 'version', parameterType: ParameterType.UINT8},
            ],
        },
    ],
    [Subsystem.APP_CNF]: [
        {
            name: 'bdbStartCommissioning',
            ID: 5,
            type: CommandType.SREQ,
            request: [
                {name: 'mode', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'bdbSetChannel',
            ID: 8,
            type: CommandType.SREQ,
            request: [
                {name: 'isPrimary', parameterType: ParameterType.UINT8},
                {name: 'channel', parameterType: ParameterType.UINT32},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'bdbSetTcRequireKeyExchange',
            ID: 9,
            type: CommandType.SREQ,
            request: [
                {name: 'value', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ]
        },
        {
            name: 'bdbComissioningNotifcation',
            ID: 128,
            type: CommandType.AREQ,
            request: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
        {
            name: 'setNwkFrameCounter',
            ID: 255,
            type: CommandType.SREQ,
            request: [
                {name: 'value', parameterType: ParameterType.UINT32}
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8}
            ]
        },
    ],
    [Subsystem.GREENPOWER]: [
        {
            name: 'secReq',
            ID: 3,
            type: CommandType.SREQ,
            request: [
                {name: 'applicationID', parameterType: ParameterType.UINT8},
                {name: 'srcID', parameterType: ParameterType.UINT32},
                {name: 'gdpIeeeAddr', parameterType: ParameterType.IEEEADDR},
                {name: 'endpoint', parameterType: ParameterType.UINT8},
                {name: 'gpdfSecurityLevel', parameterType: ParameterType.UINT8},
                {name: 'gpdfSecurityFrameCounter', parameterType: ParameterType.UINT8},
                {name: 'dgpStubHandle', parameterType: ParameterType.UINT8},
            ],
            response: [
                {name: 'status', parameterType: ParameterType.UINT8},
            ],
        },
    ],
};


export default Definition;
