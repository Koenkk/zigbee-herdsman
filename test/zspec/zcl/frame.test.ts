import * as Zcl from '../../../src/zspec/zcl';
import {BuffaloZcl} from '../../../src/zspec/zcl/buffaloZcl';
import {uint16To8Array, uint32To8Array, uint56To8Array} from '../../utils/math';

/** Header with Global frame type */
const GLOBAL_HEADER = new Zcl.Header(
    {
        frameType: Zcl.FrameType.GLOBAL,
        manufacturerSpecific: false,
        direction: Zcl.Direction.CLIENT_TO_SERVER,
        disableDefaultResponse: false,
        reservedBits: 0,
    },
    undefined,
    123,
    Zcl.Foundation.read.ID,
);
const GLOBAL_HEADER_BUFFER = Buffer.from([0, 123, Zcl.Foundation.read.ID]);

/** Header with Global frame type and server to client direction */
const GLOBAL_RSP_HEADER = new Zcl.Header(
    {
        frameType: Zcl.FrameType.GLOBAL,
        manufacturerSpecific: false,
        direction: Zcl.Direction.SERVER_TO_CLIENT,
        disableDefaultResponse: false,
        reservedBits: 0,
    },
    undefined,
    78,
    Zcl.Foundation.readRsp.ID,
);
const GLOBAL_RSP_HEADER_BUFFER = Buffer.from([8, 78, Zcl.Foundation.readRsp.ID]);

/** Header with Global frame type with command report */
const GLOBAL_HEADER_REPORT = new Zcl.Header(
    {
        frameType: Zcl.FrameType.GLOBAL,
        manufacturerSpecific: false,
        direction: Zcl.Direction.CLIENT_TO_SERVER,
        disableDefaultResponse: false,
        reservedBits: 0,
    },
    undefined,
    123,
    Zcl.Foundation.report.ID,
);
const GLOBAL_HEADER_REPORT_BUFFER = Buffer.from([0, 123, Zcl.Foundation.report.ID]);

/** Header with Global frame type and server to client direction including condition-based parameters */
const GLOBAL_CONDITION_HEADER = new Zcl.Header(
    {
        frameType: Zcl.FrameType.GLOBAL,
        manufacturerSpecific: false,
        direction: Zcl.Direction.SERVER_TO_CLIENT,
        disableDefaultResponse: false,
        reservedBits: 0,
    },
    undefined,
    78,
    Zcl.Foundation.configReport.ID,
);
const GLOBAL_CONDITION_HEADER_BUFFER = Buffer.from([8, 78, Zcl.Foundation.configReport.ID]);

/** Header with Specific frame type */
const SPECIFIC_HEADER = new Zcl.Header(
    {
        frameType: Zcl.FrameType.SPECIFIC,
        manufacturerSpecific: false,
        direction: Zcl.Direction.CLIENT_TO_SERVER,
        disableDefaultResponse: false,
        reservedBits: 0,
    },
    undefined,
    44,
    Zcl.Clusters.genAlarms.commands.getAlarm.ID,
);
const SPECIFIC_HEADER_BUFFER = Buffer.from([1, 44, Zcl.Clusters.genAlarms.commands.getAlarm.ID]);

/** Header with Specific frame type including condition-based parameters */
const SPECIFIC_CONDITION_HEADER = new Zcl.Header(
    {
        frameType: Zcl.FrameType.SPECIFIC,
        manufacturerSpecific: false,
        direction: Zcl.Direction.SERVER_TO_CLIENT,
        disableDefaultResponse: false,
        reservedBits: 0,
    },
    undefined,
    45,
    Zcl.Clusters.genOta.commandsResponse.queryNextImageResponse.ID,
);
const SPECIFIC_CONDITION_HEADER_BUFFER = Buffer.from([9, 45, Zcl.Clusters.genOta.commandsResponse.queryNextImageResponse.ID]);

/** Header with Specific frame type and server to client direction */
const SPECIFIC_RSP_HEADER = new Zcl.Header(
    {
        frameType: Zcl.FrameType.SPECIFIC,
        manufacturerSpecific: false,
        direction: Zcl.Direction.SERVER_TO_CLIENT,
        disableDefaultResponse: false,
        reservedBits: 0,
    },
    undefined,
    53,
    Zcl.Clusters.genAlarms.commandsResponse.alarm.ID,
);
const SPECIFIC_RSP_HEADER_BUFFER = Buffer.from([9, 53, Zcl.Clusters.genAlarms.commandsResponse.alarm.ID]);

/** Header with manufacturer-specific */
const MANUF_SPE_HEADER = new Zcl.Header(
    {
        frameType: Zcl.FrameType.GLOBAL,
        manufacturerSpecific: true,
        direction: Zcl.Direction.CLIENT_TO_SERVER,
        disableDefaultResponse: false,
        reservedBits: 0,
    },
    Zcl.ManufacturerCode.AAC_TECHNOLOGIES_HOLDING,
    234,
    Zcl.Foundation.read.ID,
);
const MANUF_SPE_HEADER_BUFFER = Buffer.from([4, ...uint16To8Array(Zcl.ManufacturerCode.AAC_TECHNOLOGIES_HOLDING), 234, Zcl.Foundation.read.ID]);

/** Frame of Global type */
const GLOBAL_FRAME = Zcl.Frame.create(
    GLOBAL_HEADER.frameControl.frameType,
    GLOBAL_HEADER.frameControl.direction,
    GLOBAL_HEADER.frameControl.disableDefaultResponse,
    GLOBAL_HEADER.manufacturerCode,
    GLOBAL_HEADER.transactionSequenceNumber,
    GLOBAL_HEADER.commandIdentifier,
    Zcl.Clusters.genBasic.ID,
    [{attrId: 256}] /*payload*/,
    {} /*custom clusters*/,
    GLOBAL_HEADER.frameControl.reservedBits,
);
const GLOBAL_FRAME_BUFFER = Buffer.concat([GLOBAL_HEADER_BUFFER, Buffer.from(uint16To8Array(256))]);
const GLOBAL_FRAME_STRING = `{"header":{"frameControl":{"reservedBits":0,"frameType":0,"direction":0,"disableDefaultResponse":false,"manufacturerSpecific":false},"transactionSequenceNumber":123,"commandIdentifier":0},"payload":[{"attrId":256}],"command":{"ID":0,"name":"read","parameters":[{"name":"attrId","type":33}],"response":1}}`;

/** Frame of Global type with BigInt */
const GLOBAL_FRAME_BIG_INT = Zcl.Frame.create(
    GLOBAL_HEADER_REPORT.frameControl.frameType,
    GLOBAL_HEADER_REPORT.frameControl.direction,
    GLOBAL_HEADER_REPORT.frameControl.disableDefaultResponse,
    GLOBAL_HEADER_REPORT.manufacturerCode,
    GLOBAL_HEADER_REPORT.transactionSequenceNumber,
    GLOBAL_HEADER_REPORT.commandIdentifier,
    Zcl.Clusters.haApplianceIdentification.ID,
    [{attrId: 0, dataType: Zcl.DataType.UINT56, attrData: 200n}] /*payload*/,
    {} /*custom clusters*/,
    GLOBAL_HEADER_REPORT.frameControl.reservedBits,
);
const GLOBAL_FRAME_BIG_INT_BUFFER = Buffer.concat([
    GLOBAL_HEADER_REPORT_BUFFER,
    Buffer.from(uint16To8Array(0)),
    Buffer.from([Zcl.DataType.UINT56]),
    Buffer.from(uint56To8Array(200n)),
]);
const GLOBAL_FRAME_BIG_INT_STRING = `{"header":{"frameControl":{"reservedBits":0,"frameType":0,"direction":0,"disableDefaultResponse":false,"manufacturerSpecific":false},"transactionSequenceNumber":123,"commandIdentifier":10},"payload":[{"attrId":0,"dataType":38,"attrData":"200"}],"command":{"ID":10,"name":"report","parameters":[{"name":"attrId","type":33},{"name":"dataType","type":32},{"name":"attrData","type":1000}]}}`;

/** Frame of Global type and response command */
const GLOBAL_RSP_FRAME = Zcl.Frame.create(
    GLOBAL_RSP_HEADER.frameControl.frameType,
    GLOBAL_RSP_HEADER.frameControl.direction,
    GLOBAL_RSP_HEADER.frameControl.disableDefaultResponse,
    GLOBAL_RSP_HEADER.manufacturerCode,
    GLOBAL_RSP_HEADER.transactionSequenceNumber,
    GLOBAL_RSP_HEADER.commandIdentifier,
    Zcl.Clusters.genPowerCfg.ID,
    [{attrId: 256, status: Zcl.Status.SUCCESS, dataType: Zcl.DataType.ENUM8, attrData: 127}] /*payload*/,
    {} /*custom clusters*/,
    GLOBAL_RSP_HEADER.frameControl.reservedBits,
);
const GLOBAL_RSP_FRAME_BUFFER = Buffer.concat([
    GLOBAL_RSP_HEADER_BUFFER,
    Buffer.from([...uint16To8Array(256), Zcl.Status.SUCCESS, Zcl.DataType.ENUM8, 127]),
]);
const GLOBAL_RSP_FRAME_STRING = `{"header":{"frameControl":{"reservedBits":0,"frameType":0,"direction":1,"disableDefaultResponse":false,"manufacturerSpecific":false},"transactionSequenceNumber":78,"commandIdentifier":1},"payload":[{"attrId":256,"status":0,"dataType":48,"attrData":127}],"command":{"ID":1,"name":"readRsp","parameters":[{"name":"attrId","type":33},{"name":"status","type":32},{"name":"dataType","type":32,"conditions":[{"type":"statusEquals","value":0}]},{"name":"attrData","type":1000,"conditions":[{"type":"statusEquals","value":0}]}]}}`;

/** Frame of Global type with no payload */
const GLOBAL_FRAME_NO_PAYLOAD = Zcl.Frame.create(
    GLOBAL_HEADER.frameControl.frameType,
    GLOBAL_HEADER.frameControl.direction,
    GLOBAL_HEADER.frameControl.disableDefaultResponse,
    GLOBAL_HEADER.manufacturerCode,
    GLOBAL_HEADER.transactionSequenceNumber,
    GLOBAL_HEADER.commandIdentifier,
    Zcl.Clusters.genBasic.ID,
    [] /*payload*/,
    {} /*custom clusters*/,
    GLOBAL_HEADER.frameControl.reservedBits,
);
const GLOBAL_FRAME_NO_PAYLOAD_BUFFER = Buffer.concat([GLOBAL_HEADER_BUFFER]);
const GLOBAL_FRAME_NO_PAYLOAD_STRING = `{"header":{"frameControl":{"reservedBits":0,"frameType":0,"direction":0,"disableDefaultResponse":false,"manufacturerSpecific":false},"transactionSequenceNumber":123,"commandIdentifier":0},"payload":[],"command":{"ID":0,"name":"read","parameters":[{"name":"attrId","type":33}],"response":1}}`;

/** Frame of Global type with condition-based parameters */
const GLOBAL_CONDITION_FRAME = Zcl.Frame.create(
    GLOBAL_CONDITION_HEADER.frameControl.frameType,
    GLOBAL_CONDITION_HEADER.frameControl.direction,
    GLOBAL_CONDITION_HEADER.frameControl.disableDefaultResponse,
    GLOBAL_CONDITION_HEADER.manufacturerCode,
    GLOBAL_CONDITION_HEADER.transactionSequenceNumber,
    GLOBAL_CONDITION_HEADER.commandIdentifier,
    Zcl.Clusters.genOnOff.ID,
    [{direction: Zcl.Direction.SERVER_TO_CLIENT, attrId: 256, timeout: 10000}] /*payload*/,
    {} /*custom clusters*/,
    GLOBAL_CONDITION_HEADER.frameControl.reservedBits,
);
const GLOBAL_CONDITION_FRAME_BUFFER = Buffer.concat([
    GLOBAL_CONDITION_HEADER_BUFFER,
    Buffer.from([Zcl.Direction.SERVER_TO_CLIENT, ...uint16To8Array(256), ...uint16To8Array(10000)]),
]);
const GLOBAL_CONDITION_FRAME_STRING = `{"header":{"frameControl":{"reservedBits":0,"frameType":0,"direction":1,"disableDefaultResponse":false,"manufacturerSpecific":false},"transactionSequenceNumber":78,"commandIdentifier":6},"payload":[{"direction":1,"attrId":256,"timeout":10000}],"command":{"ID":6,"name":"configReport","parameters":[{"name":"direction","type":32},{"name":"attrId","type":33},{"name":"dataType","type":32,"conditions":[{"type":"directionEquals","value":0}]},{"name":"minRepIntval","type":33,"conditions":[{"type":"directionEquals","value":0}]},{"name":"maxRepIntval","type":33,"conditions":[{"type":"directionEquals","value":0}]},{"name":"repChange","type":1000,"conditions":[{"type":"directionEquals","value":0},{"type":"dataTypeValueTypeEquals","value":"ANALOG"}]},{"name":"timeout","type":33,"conditions":[{"type":"directionEquals","value":1}]}],"response":7}}`;

/** Frame of Specific type */
const SPECIFIC_FRAME = Zcl.Frame.create(
    SPECIFIC_HEADER.frameControl.frameType,
    SPECIFIC_HEADER.frameControl.direction,
    SPECIFIC_HEADER.frameControl.disableDefaultResponse,
    SPECIFIC_HEADER.manufacturerCode,
    SPECIFIC_HEADER.transactionSequenceNumber,
    SPECIFIC_HEADER.commandIdentifier,
    Zcl.Clusters.genAlarms.ID,
    {} /*payload*/,
    {} /*custom clusters*/,
    SPECIFIC_HEADER.frameControl.reservedBits,
);
const SPECIFIC_FRAME_BUFFER = Buffer.concat([SPECIFIC_HEADER_BUFFER]);
const SPECIFIC_FRAME_STRING = `{"header":{"frameControl":{"reservedBits":0,"frameType":1,"direction":0,"disableDefaultResponse":false,"manufacturerSpecific":false},"transactionSequenceNumber":44,"commandIdentifier":2},"payload":{},"command":{"ID":2,"parameters":[],"name":"getAlarm"}}`;

/** Frame of Specific type and response command */
const SPECIFIC_RSP_FRAME = Zcl.Frame.create(
    SPECIFIC_RSP_HEADER.frameControl.frameType,
    SPECIFIC_RSP_HEADER.frameControl.direction,
    SPECIFIC_RSP_HEADER.frameControl.disableDefaultResponse,
    SPECIFIC_RSP_HEADER.manufacturerCode,
    SPECIFIC_RSP_HEADER.transactionSequenceNumber,
    SPECIFIC_RSP_HEADER.commandIdentifier,
    Zcl.Clusters.genAlarms.ID,
    {alarmcode: 246, clusterid: 3456} /*payload*/,
    {} /*custom clusters*/,
    SPECIFIC_RSP_HEADER.frameControl.reservedBits,
);
const SPECIFIC_RSP_FRAME_BUFFER = Buffer.concat([SPECIFIC_RSP_HEADER_BUFFER, Buffer.from([246, ...uint16To8Array(3456)])]);
const SPECIFIC_RSP_FRAME_STRING = `{"header":{"frameControl":{"reservedBits":0,"frameType":1,"direction":1,"disableDefaultResponse":false,"manufacturerSpecific":false},"transactionSequenceNumber":53,"commandIdentifier":0},"payload":{"alarmcode":246,"clusterid":3456},"command":{"ID":0,"parameters":[{"name":"alarmcode","type":32},{"name":"clusterid","type":33}],"name":"alarm"}}`;

/** Frame of Specific type with condition-based parameters */
const SPECIFIC_CONDITION_FRAME = Zcl.Frame.create(
    SPECIFIC_CONDITION_HEADER.frameControl.frameType,
    SPECIFIC_CONDITION_HEADER.frameControl.direction,
    SPECIFIC_CONDITION_HEADER.frameControl.disableDefaultResponse,
    SPECIFIC_CONDITION_HEADER.manufacturerCode,
    SPECIFIC_CONDITION_HEADER.transactionSequenceNumber,
    SPECIFIC_CONDITION_HEADER.commandIdentifier,
    Zcl.Clusters.genOta.ID,
    {status: Zcl.Status.ABORT} /*payload*/,
    {} /*custom clusters*/,
    SPECIFIC_CONDITION_HEADER.frameControl.reservedBits,
);
const SPECIFIC_CONDITION_FRAME_BUFFER = Buffer.concat([SPECIFIC_CONDITION_HEADER_BUFFER, Buffer.from([149])]);
const SPECIFIC_CONDITION_FRAME_STRING = `{"header":{"frameControl":{"reservedBits":0,"frameType":1,"direction":1,"disableDefaultResponse":false,"manufacturerSpecific":false},"transactionSequenceNumber":45,"commandIdentifier":2},"payload":{"status":149},"command":{"ID":2,"parameters":[{"name":"status","type":32},{"name":"manufacturerCode","type":33,"conditions":[{"type":"statusEquals","value":0}]},{"name":"imageType","type":33,"conditions":[{"type":"statusEquals","value":0}]},{"name":"fileVersion","type":35,"conditions":[{"type":"statusEquals","value":0}]},{"name":"imageSize","type":35,"conditions":[{"type":"statusEquals","value":0}]}],"name":"queryNextImageResponse"}}`;

/** Frame manufacturer-specific */
const MANUF_SPE_FRAME = Zcl.Frame.create(
    MANUF_SPE_HEADER.frameControl.frameType,
    MANUF_SPE_HEADER.frameControl.direction,
    MANUF_SPE_HEADER.frameControl.disableDefaultResponse,
    MANUF_SPE_HEADER.manufacturerCode,
    MANUF_SPE_HEADER.transactionSequenceNumber,
    MANUF_SPE_HEADER.commandIdentifier,
    Zcl.Foundation.read.ID,
    [{attrId: 256}] /*payload*/,
    {} /*custom clusters*/,
    MANUF_SPE_HEADER.frameControl.reservedBits,
);
const MANUF_SPE_FRAME_BUFFER = Buffer.concat([MANUF_SPE_HEADER_BUFFER, Buffer.from(uint16To8Array(256))]);
const MANUF_SPE_FRAME_STRING = `{"header":{"frameControl":{"reservedBits":0,"frameType":0,"direction":0,"disableDefaultResponse":false,"manufacturerSpecific":true},"manufacturerCode":4344,"transactionSequenceNumber":234,"commandIdentifier":0},"payload":[{"attrId":256}],"command":{"ID":0,"name":"read","parameters":[{"name":"attrId","type":33}],"response":1}}`;

describe('ZCL Frame', () => {
    describe('Validates Parameter Condition', () => {
        it('STATUS_EQUAL', () => {
            expect(Zcl.Frame.conditionsValid(Zcl.Foundation.readRsp.parameters[2], {status: 0}, null)).toBeTruthy();
            expect(Zcl.Frame.conditionsValid(Zcl.Foundation.readRsp.parameters[2], {status: 1}, null)).toBeFalsy();
        });

        it('STATUS_NOT_EQUAL', () => {
            expect(Zcl.Frame.conditionsValid(Zcl.Foundation.writeRsp.parameters[1], {status: 1}, null)).toBeTruthy();
            expect(Zcl.Frame.conditionsValid(Zcl.Foundation.writeRsp.parameters[1], {status: 0}, null)).toBeFalsy();
        });

        it('MINIMUM_REMAINING_BUFFER_BYTES', () => {
            expect(Zcl.Frame.conditionsValid(Zcl.Foundation.configReportRsp.parameters[1], {status: 1}, 3)).toBeTruthy();
            expect(Zcl.Frame.conditionsValid(Zcl.Foundation.configReportRsp.parameters[1], {status: 1}, 2)).toBeFalsy();
        });

        it('DIRECTION_EQUAL', () => {
            expect(
                Zcl.Frame.conditionsValid(Zcl.Foundation.configReport.parameters[2], {direction: Zcl.Direction.CLIENT_TO_SERVER}, null),
            ).toBeTruthy();
            expect(
                Zcl.Frame.conditionsValid(Zcl.Foundation.configReport.parameters[2], {direction: Zcl.Direction.SERVER_TO_CLIENT}, null),
            ).toBeFalsy();
            expect(
                Zcl.Frame.conditionsValid(Zcl.Foundation.configReport.parameters[6], {direction: Zcl.Direction.SERVER_TO_CLIENT}, null),
            ).toBeTruthy();
            expect(
                Zcl.Frame.conditionsValid(Zcl.Foundation.configReport.parameters[6], {direction: Zcl.Direction.CLIENT_TO_SERVER}, null),
            ).toBeFalsy();
        });

        it('BITMASK_SET', () => {
            expect(Zcl.Frame.conditionsValid(Zcl.Clusters.greenPower.commands.notification.parameters[8], {options: 0x4000}, null)).toBeTruthy();
            expect(Zcl.Frame.conditionsValid(Zcl.Clusters.greenPower.commands.notification.parameters[8], {options: 0x4150}, null)).toBeTruthy();
            expect(Zcl.Frame.conditionsValid(Zcl.Clusters.greenPower.commands.notification.parameters[8], {options: 0x0400}, null)).toBeFalsy();
            expect(Zcl.Frame.conditionsValid(Zcl.Clusters.greenPower.commands.notification.parameters[8], {options: 0x1400}, null)).toBeFalsy();
        });

        it('BITFIELD_ENUM', () => {
            // {param:'options', offset: 0, size: 3, value: 0b000}
            expect(Zcl.Frame.conditionsValid(Zcl.Clusters.greenPower.commands.notification.parameters[1], {options: 0b000}, null)).toBeTruthy();
            expect(Zcl.Frame.conditionsValid(Zcl.Clusters.greenPower.commands.notification.parameters[1], {options: 0b1000}, null)).toBeTruthy();
            expect(Zcl.Frame.conditionsValid(Zcl.Clusters.greenPower.commands.notification.parameters[1], {options: 0b001}, null)).toBeFalsy();
            expect(Zcl.Frame.conditionsValid(Zcl.Clusters.greenPower.commands.notification.parameters[1], {options: 0b011}, null)).toBeFalsy();
            expect(Zcl.Frame.conditionsValid(Zcl.Clusters.greenPower.commands.notification.parameters[1], {options: 0b100}, null)).toBeFalsy();
            expect(Zcl.Frame.conditionsValid(Zcl.Clusters.greenPower.commands.notification.parameters[1], {options: 0b1010}, null)).toBeFalsy();
        });

        it('multiple including DATA_TYPE_CLASS_EQUAL', () => {
            expect(
                Zcl.Frame.conditionsValid(
                    Zcl.Foundation.configReport.parameters[5],
                    {direction: Zcl.Direction.CLIENT_TO_SERVER, dataType: Zcl.DataType.UINT8},
                    null,
                ),
            ).toBeTruthy();
            expect(
                Zcl.Frame.conditionsValid(
                    Zcl.Foundation.configReport.parameters[5],
                    {direction: Zcl.Direction.CLIENT_TO_SERVER, dataType: Zcl.DataType.DATA8},
                    null,
                ),
            ).toBeFalsy();
            expect(
                Zcl.Frame.conditionsValid(
                    Zcl.Foundation.configReport.parameters[5],
                    {direction: Zcl.Direction.SERVER_TO_CLIENT, dataType: Zcl.DataType.UINT8},
                    null,
                ),
            ).toBeFalsy();
            expect(
                Zcl.Frame.conditionsValid(
                    Zcl.Foundation.configReport.parameters[5],
                    {direction: Zcl.Direction.SERVER_TO_CLIENT, dataType: Zcl.DataType.DATA8},
                    null,
                ),
            ).toBeFalsy();
        });

        it('FIELD_EQUAL', () => {
            expect(
                Zcl.Frame.conditionsValid(Zcl.Clusters.touchlink.commandsResponse.scanResponse.parameters[13], {numberOfSubDevices: 1}, null),
            ).toBeTruthy();
            expect(
                Zcl.Frame.conditionsValid(Zcl.Clusters.touchlink.commandsResponse.scanResponse.parameters[13], {numberOfSubDevices: 0}, null),
            ).toBeFalsy();
            expect(
                Zcl.Frame.conditionsValid(Zcl.Clusters.touchlink.commandsResponse.scanResponse.parameters[13], {numberOfSubDevices: 3}, null),
            ).toBeFalsy();
        });
    });

    describe('Header', () => {
        it.each([
            [
                'global',
                {
                    frameControl: GLOBAL_HEADER.frameControl,
                    manufacturerCode: GLOBAL_HEADER.manufacturerCode,
                    transactionSequenceNumber: GLOBAL_HEADER.transactionSequenceNumber,
                    commandId: GLOBAL_HEADER.commandIdentifier,
                },
                {written: GLOBAL_HEADER_BUFFER},
            ],
            [
                'global response',
                {
                    frameControl: GLOBAL_RSP_HEADER.frameControl,
                    manufacturerCode: GLOBAL_RSP_HEADER.manufacturerCode,
                    transactionSequenceNumber: GLOBAL_RSP_HEADER.transactionSequenceNumber,
                    commandId: GLOBAL_RSP_HEADER.commandIdentifier,
                },
                {written: GLOBAL_RSP_HEADER_BUFFER},
            ],
            [
                'specific',
                {
                    frameControl: SPECIFIC_HEADER.frameControl,
                    manufacturerCode: SPECIFIC_HEADER.manufacturerCode,
                    transactionSequenceNumber: SPECIFIC_HEADER.transactionSequenceNumber,
                    commandId: SPECIFIC_HEADER.commandIdentifier,
                },
                {written: SPECIFIC_HEADER_BUFFER},
            ],
            [
                'manufacturer-specific',
                {
                    frameControl: MANUF_SPE_HEADER.frameControl,
                    manufacturerCode: MANUF_SPE_HEADER.manufacturerCode,
                    transactionSequenceNumber: MANUF_SPE_HEADER.transactionSequenceNumber,
                    commandId: MANUF_SPE_HEADER.commandIdentifier,
                },
                {written: MANUF_SPE_HEADER_BUFFER},
            ],
            [
                'disable default response',
                {
                    frameControl: {
                        frameType: Zcl.FrameType.GLOBAL,
                        manufacturerSpecific: false,
                        direction: Zcl.Direction.CLIENT_TO_SERVER,
                        disableDefaultResponse: true,
                        reservedBits: 0,
                    },
                    manufacturerCode: undefined,
                    transactionSequenceNumber: 234,
                    commandId: 1,
                },
                {written: Buffer.from([16, 234, 1])},
            ],
            [
                'reserved bits - non-compliant use',
                {
                    frameControl: {
                        frameType: Zcl.FrameType.GLOBAL,
                        manufacturerSpecific: false,
                        direction: Zcl.Direction.CLIENT_TO_SERVER,
                        disableDefaultResponse: false,
                        reservedBits: 7,
                    },
                    manufacturerCode: undefined,
                    transactionSequenceNumber: 234,
                    commandId: 1,
                },
                {written: Buffer.from([224, 234, 1])},
            ],
            [
                'specific manufacturer-specific',
                {
                    frameControl: {
                        frameType: Zcl.FrameType.SPECIFIC,
                        manufacturerSpecific: true,
                        direction: Zcl.Direction.CLIENT_TO_SERVER,
                        disableDefaultResponse: false,
                        reservedBits: 0,
                    },
                    manufacturerCode: Zcl.ManufacturerCode.S3C,
                    transactionSequenceNumber: 234,
                    commandId: 1,
                },
                {written: Buffer.from([5, ...uint16To8Array(Zcl.ManufacturerCode.S3C), 234, 1])},
            ],
            [
                'all non-zero - non-compliant use of reservedBits',
                {
                    frameControl: {
                        frameType: Zcl.FrameType.SPECIFIC,
                        manufacturerSpecific: true,
                        direction: Zcl.Direction.SERVER_TO_CLIENT,
                        disableDefaultResponse: true,
                        reservedBits: 3,
                    },
                    manufacturerCode: Zcl.ManufacturerCode.BOSCH_SECURITY_SYSTEMS_INC,
                    transactionSequenceNumber: 234,
                    commandId: 1,
                },
                {written: Buffer.from([125, ...uint16To8Array(Zcl.ManufacturerCode.BOSCH_SECURITY_SYSTEMS_INC), 234, 1])},
            ],
        ])('Reads & Writes %s', (_name, payload, expected) => {
            // write
            {
                const header = new Zcl.Header(payload.frameControl, payload.manufacturerCode, payload.transactionSequenceNumber, payload.commandId);
                const buffer = Buffer.alloc(10);
                const buffalo = new BuffaloZcl(buffer);
                header.write(buffalo);

                expect(buffer.subarray(0, header.length)).toStrictEqual(expected.written);
                expect(header.length).toStrictEqual(expected.written.length);
                expect(header.isGlobal).toStrictEqual(payload.frameControl.frameType === Zcl.FrameType.GLOBAL);
                expect(header.isSpecific).toStrictEqual(payload.frameControl.frameType === Zcl.FrameType.SPECIFIC);
            }
            // read
            {
                const header = Zcl.Header.fromBuffer(expected.written)!;

                expect(header).toBeInstanceOf(Zcl.Header);
                expect(header.length).toStrictEqual(expected.written.length);
                expect(header.isGlobal).toStrictEqual(payload.frameControl.frameType === Zcl.FrameType.GLOBAL);
                expect(header.isSpecific).toStrictEqual(payload.frameControl.frameType === Zcl.FrameType.SPECIFIC);
                expect(header.frameControl).toStrictEqual(payload.frameControl);
                expect(header.manufacturerCode).toStrictEqual(payload.manufacturerCode);
                expect(header.transactionSequenceNumber).toStrictEqual(payload.transactionSequenceNumber);
                expect(header.commandIdentifier).toStrictEqual(payload.commandId);
            }
        });

        it.each([
            ['basic', {value: [0, 234]}],
            ['manufacturer specific', {value: [4, ...uint16To8Array(1234), 234]}],
        ])('Reads non-compliant header as undefined %s', (_name, payload) => {
            expect(Zcl.Header.fromBuffer(Buffer.from(payload.value))).toStrictEqual(undefined);
        });
    });

    it.each([
        ['global', GLOBAL_FRAME, {string: GLOBAL_FRAME_STRING, header: GLOBAL_HEADER, written: GLOBAL_FRAME_BUFFER}],
        [
            'global BigInt',
            GLOBAL_FRAME_BIG_INT,
            {string: GLOBAL_FRAME_BIG_INT_STRING, header: GLOBAL_HEADER_REPORT, written: GLOBAL_FRAME_BIG_INT_BUFFER},
        ],
        ['global response', GLOBAL_RSP_FRAME, {string: GLOBAL_RSP_FRAME_STRING, header: GLOBAL_RSP_HEADER, written: GLOBAL_RSP_FRAME_BUFFER}],
        [
            'global no payload',
            GLOBAL_FRAME_NO_PAYLOAD,
            {string: GLOBAL_FRAME_NO_PAYLOAD_STRING, header: GLOBAL_HEADER, written: GLOBAL_FRAME_NO_PAYLOAD_BUFFER},
        ],
        [
            'global with condition-based parameters',
            GLOBAL_CONDITION_FRAME,
            {string: GLOBAL_CONDITION_FRAME_STRING, header: GLOBAL_CONDITION_HEADER, written: GLOBAL_CONDITION_FRAME_BUFFER},
        ],
        ['specific', SPECIFIC_FRAME, {string: SPECIFIC_FRAME_STRING, header: SPECIFIC_HEADER, written: SPECIFIC_FRAME_BUFFER}],
        [
            'specific response',
            SPECIFIC_RSP_FRAME,
            {string: SPECIFIC_RSP_FRAME_STRING, header: SPECIFIC_RSP_HEADER, written: SPECIFIC_RSP_FRAME_BUFFER},
        ],
        [
            'specific with condition-based parameters',
            SPECIFIC_CONDITION_FRAME,
            {string: SPECIFIC_CONDITION_FRAME_STRING, header: SPECIFIC_CONDITION_HEADER, written: SPECIFIC_CONDITION_FRAME_BUFFER},
        ],
        ['manufacturer-specific', MANUF_SPE_FRAME, {string: MANUF_SPE_FRAME_STRING, header: MANUF_SPE_HEADER, written: MANUF_SPE_FRAME_BUFFER}],
    ])('Writes & Reads frame %s', (_name, frame, expected) => {
        expect(frame).toBeDefined();
        expect(frame.toString()).toStrictEqual(expected.string);
        expect(frame.header).toStrictEqual(expected.header);

        expect(frame.toBuffer()).toStrictEqual(expected.written);
        expect(Zcl.Frame.fromBuffer(frame.cluster.ID, frame.header, expected.written, {}).toString()).toStrictEqual(expected.string);
    });

    it('Writes & Reads repetitive strategy', () => {
        const expected = [{attrId: 256}, {attrId: 127}];
        const header = new Zcl.Header(
            {
                frameType: Zcl.FrameType.GLOBAL,
                manufacturerSpecific: false,
                direction: Zcl.Direction.CLIENT_TO_SERVER,
                disableDefaultResponse: false,
                reservedBits: 0,
            },
            undefined,
            123,
            Zcl.Foundation.read.ID,
        );
        const frame = Zcl.Frame.create(
            header.frameControl.frameType,
            header.frameControl.direction,
            header.frameControl.disableDefaultResponse,
            header.manufacturerCode,
            header.transactionSequenceNumber,
            header.commandIdentifier,
            Zcl.Foundation.read.ID,
            expected /*payload*/,
            {} /*custom clusters*/,
            header.frameControl.reservedBits,
        );

        expect(frame.payload).toStrictEqual(expected);

        const buffer = frame.toBuffer();
        const readHeader = Zcl.Header.fromBuffer(buffer)!;
        const readFrame = Zcl.Frame.fromBuffer(0 /*Foundation*/, readHeader, buffer, {} /*custom clusters*/);

        expect(readFrame.payload).toStrictEqual(expected);
    });

    it('Writes & Reads flat strategy', () => {
        const expected = {cmdId: 253, statusCode: 127};
        const header = new Zcl.Header(
            {
                frameType: Zcl.FrameType.GLOBAL,
                manufacturerSpecific: false,
                direction: Zcl.Direction.CLIENT_TO_SERVER,
                disableDefaultResponse: false,
                reservedBits: 0,
            },
            undefined,
            123,
            Zcl.Foundation.defaultRsp.ID,
        );
        const frame = Zcl.Frame.create(
            header.frameControl.frameType,
            header.frameControl.direction,
            header.frameControl.disableDefaultResponse,
            header.manufacturerCode,
            header.transactionSequenceNumber,
            header.commandIdentifier,
            Zcl.Foundation.defaultRsp.ID,
            expected /*payload*/,
            {} /*custom clusters*/,
            header.frameControl.reservedBits,
        );

        expect(frame.payload).toStrictEqual(expected);

        const buffer = frame.toBuffer();
        const readHeader = Zcl.Header.fromBuffer(buffer)!;
        const readFrame = Zcl.Frame.fromBuffer(0 /*Foundation*/, readHeader, buffer, {} /*custom clusters*/);

        expect(readFrame.payload).toStrictEqual(expected);
    });

    it('Writes & Reads oneof strategy', () => {
        const expected = {
            discComplete: 123,
            attrInfos: [
                {attrId: 32, dataType: Zcl.DataType.UINT16},
                {attrId: 67, dataType: Zcl.DataType.ARRAY},
            ],
        };
        const header = new Zcl.Header(
            {
                frameType: Zcl.FrameType.GLOBAL,
                manufacturerSpecific: false,
                direction: Zcl.Direction.CLIENT_TO_SERVER,
                disableDefaultResponse: false,
                reservedBits: 0,
            },
            undefined,
            123,
            Zcl.Foundation.discoverRsp.ID,
        );
        const frame = Zcl.Frame.create(
            header.frameControl.frameType,
            header.frameControl.direction,
            header.frameControl.disableDefaultResponse,
            header.manufacturerCode,
            header.transactionSequenceNumber,
            header.commandIdentifier,
            Zcl.Foundation.discoverRsp.ID,
            expected /*payload*/,
            {} /*custom clusters*/,
            header.frameControl.reservedBits,
        );

        expect(frame.payload).toStrictEqual(expected);

        const buffer = frame.toBuffer();
        const readHeader = Zcl.Header.fromBuffer(buffer)!;
        const readFrame = Zcl.Frame.fromBuffer(0 /*Foundation*/, readHeader, buffer, {} /*custom clusters*/);

        expect(readFrame.payload).toStrictEqual(expected);
    });

    it('Throws when writting invalid frame type', () => {
        expect(() => {
            const frame = Zcl.Frame.create(
                // @ts-expect-error invalid on purpose
                3,
                Zcl.Direction.CLIENT_TO_SERVER,
                false,
                null,
                123,
                Zcl.Clusters.genAlarms.commands.reset.ID,
                Zcl.Clusters.genAlarms.ID,
                {} /*payload*/,
                {} /*custom clusters*/,
                0 /*reserved bits*/,
            );

            frame.toBuffer();
        }).toThrow(`Frametype '3' not valid`);
    });

    it('Throws when reading invalid frame type', () => {
        expect(() => {
            Zcl.Frame.fromBuffer(
                Zcl.Clusters.genBasic.ID,
                Zcl.Header.fromBuffer(Buffer.from([2, 123, 0]))!,
                Buffer.from([]) /*payload*/,
                {} /*custom clusters*/,
            );
        }).toThrow(`Unsupported frameType '2'`);
    });

    it('Throws when reading frame without header', () => {
        expect(() => {
            Zcl.Frame.fromBuffer(
                Zcl.Clusters.genBasic.ID,
                // @ts-expect-error invalid of purpose
                null,
                Buffer.from([]) /*payload*/,
                {} /*custom clusters*/,
            );
        }).toThrow(`Invalid ZclHeader.`);
    });

    it('Throws when writting missing payload', () => {
        expect(() => {
            const frame = Zcl.Frame.create(
                SPECIFIC_RSP_HEADER.frameControl.frameType,
                SPECIFIC_RSP_HEADER.frameControl.direction,
                SPECIFIC_RSP_HEADER.frameControl.disableDefaultResponse,
                SPECIFIC_RSP_HEADER.manufacturerCode,
                SPECIFIC_RSP_HEADER.transactionSequenceNumber,
                SPECIFIC_RSP_HEADER.commandIdentifier,
                Zcl.Clusters.genAlarms.ID,
                {alarmcode: 246 /*clusterid: 3456*/} /*payload*/,
                {} /*custom clusters*/,
                SPECIFIC_RSP_HEADER.frameControl.reservedBits,
            );

            frame.toBuffer();
        }).toThrow(`Parameter 'clusterid' is missing`);
    });

    it('Checks cluster match by name', () => {
        expect(GLOBAL_FRAME.isCluster('genBasic')).toBeTruthy();
        expect(GLOBAL_FRAME.isCluster('discoverCommands')).toBeFalsy();
        // @ts-expect-error invalid on purpose
        expect(GLOBAL_FRAME.isCluster('notacluster')).toBeFalsy();
        expect(SPECIFIC_FRAME.isCluster('genAlarms')).toBeTruthy();
        expect(SPECIFIC_FRAME.isCluster('genAnalogInput')).toBeFalsy();
        // @ts-expect-error invalid on purpose
        expect(SPECIFIC_FRAME.isCluster('notacluster')).toBeFalsy();
    });

    it('Checks command match by name', () => {
        expect(GLOBAL_FRAME.isCommand('read')).toBeTruthy();
        expect(GLOBAL_FRAME.isCommand('discoverCommands')).toBeFalsy();
        // @ts-expect-error invalid on purpose
        expect(GLOBAL_FRAME.isCommand('notacommand')).toBeFalsy();
        expect(SPECIFIC_FRAME.isCommand('getAlarm')).toBeTruthy();
        expect(SPECIFIC_FRAME.isCommand('enrollReq')).toBeFalsy();
        // @ts-expect-error invalid on purpose
        expect(SPECIFIC_FRAME.isCommand('notacommand')).toBeFalsy();
    });

    it('[workaround] Reads Foundation char str as Mi struct for Xiaomi attridId=65281', () => {
        const expected = [
            {attrId: 5, dataType: Zcl.DataType.CHAR_STR, attrData: 'lumi.sensor_wleak.aq1'},
            {attrId: 65281, dataType: Zcl.DataType.CHAR_STR, attrData: {1: 3285, 3: 33, 4: 5032, 5: 43, 6: 327680, 8: 516, 10: 0, 100: 0}},
        ];
        const buffer = Buffer.from([
            28,
            ...uint16To8Array(Zcl.ManufacturerCode.LUMI_UNITED_TECHOLOGY_LTD_SHENZHEN),
            3,
            10 /*header*/,
            // regular attr parsing
            5,
            0,
            Zcl.DataType.CHAR_STR,
            21,
            108,
            117,
            109,
            105,
            46,
            115,
            101,
            110,
            115,
            111,
            114,
            95,
            119,
            108,
            101,
            97,
            107,
            46,
            97,
            113,
            49,
            // workaround parsing
            1,
            255,
            Zcl.DataType.CHAR_STR,
            34,
            1,
            Zcl.DataType.UINT16,
            ...uint16To8Array(3285),
            3,
            Zcl.DataType.INT8,
            33,
            4,
            Zcl.DataType.UINT16,
            ...uint16To8Array(5032),
            5,
            Zcl.DataType.UINT16,
            ...uint16To8Array(43),
            6,
            Zcl.DataType.UINT40,
            ...uint32To8Array(327680),
            0,
            8,
            Zcl.DataType.UINT16,
            ...uint16To8Array(516),
            10,
            Zcl.DataType.UINT16,
            ...uint16To8Array(0),
            100,
            Zcl.DataType.BOOLEAN,
            0,
        ]);
        const header = Zcl.Header.fromBuffer(buffer)!;
        const frame = Zcl.Frame.fromBuffer(0 /*Foundation*/, header, buffer, {});

        expect(frame.payload).toStrictEqual(expected);
    });

    it('[workaround] Reads Foundation struct with extra payload to match zcl-packet', () => {
        const expected = [
            {
                attrId: 65282,
                dataType: Zcl.DataType.STRUCT,
                numElms: 6,
                structElms: [
                    {elmType: Zcl.DataType.BOOLEAN, elmVal: 1},
                    {elmType: Zcl.DataType.UINT16, elmVal: 3022},
                    {elmType: Zcl.DataType.UINT16, elmVal: 17320},
                    {elmType: Zcl.DataType.UINT40, elmVal: 1},
                    {elmType: Zcl.DataType.UINT16, elmVal: 560},
                    {elmType: Zcl.DataType.UINT8, elmVal: 86},
                ],
                attrData: [
                    {elmType: Zcl.DataType.BOOLEAN, elmVal: 1},
                    {elmType: Zcl.DataType.UINT16, elmVal: 3022},
                    {elmType: Zcl.DataType.UINT16, elmVal: 17320},
                    {elmType: Zcl.DataType.UINT40, elmVal: 1},
                    {elmType: Zcl.DataType.UINT16, elmVal: 560},
                    {elmType: Zcl.DataType.UINT8, elmVal: 86},
                ],
            },
        ];
        const buffer = Buffer.from([
            28,
            ...uint16To8Array(Zcl.ManufacturerCode.DSR_CORPORATION),
            194,
            10 /*header*/,
            ...uint16To8Array(65282),
            Zcl.DataType.STRUCT,
            6,
            0,
            Zcl.DataType.BOOLEAN,
            1,
            Zcl.DataType.UINT16,
            ...uint16To8Array(3022),
            Zcl.DataType.UINT16,
            ...uint16To8Array(17320),
            Zcl.DataType.UINT40,
            ...uint32To8Array(1),
            0,
            Zcl.DataType.UINT16,
            ...uint16To8Array(560),
            Zcl.DataType.UINT8,
            86,
        ]);
        const header = Zcl.Header.fromBuffer(buffer)!;
        const frame = Zcl.Frame.fromBuffer(0 /*Foundation*/, header, buffer, {});

        expect(frame.payload).toStrictEqual(expected);
    });

    it('Reads/writes Touchlink Scan Response with different size payloads', () => {
        const full = Buffer.from([
            0x19, 0x0, 0x1, 0xe0, 0xde, 0x5e, 0x2f, 0xa, 0x5, 0x0, 0x12, 0x0, 0x3d, 0x30, 0x1d, 0x4a, 0x8f, 0xb7, 0xdc, 0x1c, 0x0, 0x4b, 0x12, 0x0,
            0x0, 0xf, 0x62, 0x1a, 0xb3, 0xaa, 0x1, 0x0, 0xb, 0x5e, 0xc0, 0x10, 0x2, 0x2, 0x0,
        ]);
        const short = Buffer.from([
            0x19, 0x0, 0x1, 0xe0, 0xde, 0x5e, 0x2f, 0xa, 0x5, 0x0, 0x12, 0x0, 0x3d, 0x30, 0x1d, 0x4a, 0x8f, 0xb7, 0xdc, 0x1c, 0x0, 0x4b, 0x12, 0x0,
            0x0, 0xf, 0x62, 0x1a, 0xb3, 0xaa, 0x0, 0x0,
        ]);
        const short2 = Buffer.from([
            0x19, 0x0, 0x1, 0xe0, 0xde, 0x5e, 0x2f, 0xa, 0x5, 0x0, 0x12, 0x0, 0x3d, 0x30, 0x1d, 0x4a, 0x8f, 0xb7, 0xdc, 0x1c, 0x0, 0x4b, 0x12, 0x0,
            0x0, 0xf, 0x62, 0x1a, 0xb3, 0xaa, 0x3, 0x0,
        ]);

        const fullZcl = Zcl.Frame.fromBuffer(0x1000, Zcl.Header.fromBuffer(full), full, {});
        expect(fullZcl.payload.numberOfSubDevices).toStrictEqual(1);
        expect(fullZcl.payload.endpointID).toStrictEqual(11);
        expect(fullZcl.payload.profileID).toStrictEqual(0xc05e);
        expect(fullZcl.payload.deviceID).toStrictEqual(0x0210);
        expect(fullZcl.payload.version).toStrictEqual(0x02);
        expect(fullZcl.payload.groupIDCount).toStrictEqual(0);

        const shortZcl = Zcl.Frame.fromBuffer(0x1000, Zcl.Header.fromBuffer(short), short, {});
        expect(shortZcl.payload.numberOfSubDevices).toStrictEqual(0);
        expect(shortZcl.payload.endpointID).toStrictEqual(undefined);
        expect(shortZcl.payload.profileID).toStrictEqual(undefined);
        expect(shortZcl.payload.deviceID).toStrictEqual(undefined);
        expect(shortZcl.payload.version).toStrictEqual(undefined);
        expect(shortZcl.payload.groupIDCount).toStrictEqual(undefined);

        const short2Zcl = Zcl.Frame.fromBuffer(0x1000, Zcl.Header.fromBuffer(short2), short2, {});
        expect(short2Zcl.payload.numberOfSubDevices).toStrictEqual(3);
        expect(short2Zcl.payload.endpointID).toStrictEqual(undefined);
        expect(short2Zcl.payload.profileID).toStrictEqual(undefined);
        expect(short2Zcl.payload.deviceID).toStrictEqual(undefined);
        expect(short2Zcl.payload.version).toStrictEqual(undefined);
        expect(short2Zcl.payload.groupIDCount).toStrictEqual(undefined);

        const fullNew = fullZcl.toBuffer();
        expect(fullNew).toStrictEqual(full);

        const shortNew = shortZcl.toBuffer();
        expect(shortNew).toStrictEqual(short);

        const short2New = short2Zcl.toBuffer();
        expect(short2New).toStrictEqual(short2);
    });
});
