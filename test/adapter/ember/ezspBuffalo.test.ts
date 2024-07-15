import {SLStatus} from '../../../src/adapter/ember/enums';
import {EzspBuffalo} from '../../../src/adapter/ember/ezsp/buffalo';
import {
    EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX,
    EZSP_FRAME_CONTROL_COMMAND,
    EZSP_FRAME_CONTROL_NETWORK_INDEX_MASK,
    EZSP_FRAME_CONTROL_NETWORK_INDEX_OFFSET,
    EZSP_FRAME_CONTROL_SLEEP_MODE_MASK,
    EZSP_FRAME_ID_INDEX,
    EZSP_MAX_FRAME_LENGTH,
    EZSP_PARAMETERS_INDEX,
    EZSP_SEQUENCE_INDEX,
} from '../../../src/adapter/ember/ezsp/consts';
import {EzspFrameID} from '../../../src/adapter/ember/ezsp/enums';
import {lowByte} from '../../../src/adapter/ember/utils/math';

describe('Ember EZSP Buffalo', () => {
    let buffalo: EzspBuffalo;

    beforeAll(async () => {});

    afterAll(async () => {});

    beforeEach(() => {
        buffalo = new EzspBuffalo(Buffer.alloc(EZSP_MAX_FRAME_LENGTH));
    });

    afterEach(() => {});

    it('Is empty after init', () => {
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from([]));
    });

    it('Writes & read at position without altering internal position tracker', () => {
        // mock send `version` command logic flow
        buffalo.setPosition(EZSP_PARAMETERS_INDEX);
        buffalo.setCommandByte(EZSP_FRAME_ID_INDEX, lowByte(EzspFrameID.VERSION));
        buffalo.setCommandByte(EZSP_SEQUENCE_INDEX, 0);
        buffalo.setCommandByte(
            EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX,
            EZSP_FRAME_CONTROL_COMMAND |
                (0x00 & EZSP_FRAME_CONTROL_SLEEP_MODE_MASK) |
                ((0x00 << EZSP_FRAME_CONTROL_NETWORK_INDEX_OFFSET) & EZSP_FRAME_CONTROL_NETWORK_INDEX_MASK),
        );
        buffalo.writeUInt8(12); // desiredProtocolVersion

        expect(buffalo.getWritten()).toStrictEqual(Buffer.from([0x00, 0x00, 0x00, 0x0c]));

        expect(buffalo.getCommandByte(EZSP_FRAME_ID_INDEX)).toStrictEqual(lowByte(EzspFrameID.VERSION));
        expect(buffalo.getCommandByte(EZSP_SEQUENCE_INDEX)).toStrictEqual(0);
        expect(buffalo.getCommandByte(EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX)).toStrictEqual(
            EZSP_FRAME_CONTROL_COMMAND |
                (0x00 & EZSP_FRAME_CONTROL_SLEEP_MODE_MASK) |
                ((0x00 << EZSP_FRAME_CONTROL_NETWORK_INDEX_OFFSET) & EZSP_FRAME_CONTROL_NETWORK_INDEX_MASK),
        );
    });

    it('Maps EmberStatus/EzspStatus to SLStatus', () => {
        buffalo.setCommandByte(0, 0x00);
        buffalo.setCommandByte(1, 0x00);
        buffalo.setCommandByte(2, 0x00);
        buffalo.setCommandByte(3, 0x00);
        // zero always zero
        buffalo.setPosition(0);
        expect(buffalo.readStatus(0x0d)).toStrictEqual(SLStatus.OK);
        buffalo.setPosition(0);
        expect(buffalo.readStatus(0x0d, false)).toStrictEqual(SLStatus.OK);
        buffalo.setPosition(0);
        expect(buffalo.readStatus(0x0e)).toStrictEqual(SLStatus.OK);
        buffalo.setPosition(0);
        expect(buffalo.readStatus(0x0e, false)).toStrictEqual(SLStatus.OK);

        buffalo.setCommandByte(0, 0x02);
        buffalo.setPosition(0);
        expect(buffalo.readStatus(0x0d)).toStrictEqual(SLStatus.INVALID_PARAMETER);
        buffalo.setPosition(0);
        expect(buffalo.readStatus(0x0d, false)).toStrictEqual(SLStatus.ZIGBEE_EZSP_ERROR);

        buffalo.setCommandByte(0, 0x9c);
        buffalo.setPosition(0);
        expect(buffalo.readStatus(0x0d)).toStrictEqual(SLStatus.ZIGBEE_NETWORK_OPENED);
        buffalo.setPosition(0);
        expect(buffalo.readStatus(0x0d, false)).toStrictEqual(SLStatus.ZIGBEE_EZSP_ERROR);

        // no mapped value
        buffalo.setCommandByte(0, 0x4b);
        buffalo.setPosition(0);
        expect(buffalo.readStatus(0x0d)).toStrictEqual(SLStatus.BUS_ERROR);
        buffalo.setPosition(0);
        expect(buffalo.readStatus(0x0d, false)).toStrictEqual(SLStatus.ZIGBEE_EZSP_ERROR);
    });
});
