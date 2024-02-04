import {FRAMES} from '../../../src/adapter/ezsp/driver/commands';
import {
    EZSP_EXTENDED_FRAME_CONTROL_HB_INDEX,
    EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX,
    EZSP_EXTENDED_FRAME_ID_LB_INDEX,
    EZSP_EXTENDED_PARAMETERS_INDEX,
    EZSP_FRAME_CONTROL_INDEX,
    EZSP_FRAME_ID_INDEX,
    EZSP_PARAMETERS_INDEX,
    EZSP_SEQUENCE_INDEX
} from '../../../src/adapter/ezsp/driver/consts';
import {EZSPFrameData} from '../../../src/adapter/ezsp/driver/ezsp';
import {EzspStatus} from '../../../src/adapter/ezsp/driver/types';
import {DATA_FRAME} from './ashFrame.test';

/**
 * Frame Control Low Byte bits [LSB... MSB]
 * 
 * Command: [sleepMode: 2] [reserved: 3] [networkIndex: 2] [0]
 * 
 * Response: [overflow: 1] [truncated: 1] [callbackPending: 1] [callbackType: 2] [networkIndex: 2] [1]
 * 
 * sleepMode:
 *     [0, 0] == Idle
 *     [1, 0] == Deep Sleep
 *     [0, 1] == Power Down
 *     [1, 1] == Reserved
 * overflow:
 *     0 == No memory shortage since the previous response.
 *     1 == The NCP ran out of memory since the previous response.
 * truncated:
 *     0 == The current response was not truncated.
 *     1 == The NCP truncated the current response to avoid exceeding the maximum EZSP frame length.
 * callbackPending:
 *     0 == All callbacks have been delivered to the host.
 *     1 == A callback is pending on the NCP. If this response is a callback, at least one more callback is available.
 * callbackType:
 *     [0, 0] == This response is not a callback.
 *     [1, 0] == This response is a synchronous callback. It was sent in response to a callback command.
 *     [0, 1] == (UART interface only) This response is an asynchronous callback. It was not sent in response to a callback command.
 *     [1, 1] == Reserved.
 * 
 * 
 * Frame Control High Byte bits [LSB... MSB]
 * 
 * Command: [frameFormatVersion: 2] [reserved: 4] [paddingEnabled: 1] [securityEnabled: 1]
 * 
 * Response: [frameFormatVersion: 2] [reserved: 4] [paddingEnabled: 1] [securityEnabled: 1]
 * 
 * frameFormatVersion:
 *     [0, 0] == Version 0
 *     [1, 0] == Version 1
 *     [0, 1] == Reserved
 *     [1, 1] == Reserved
 * paddingEnabled:
 *     0 == Padding is not enabled.
 *     1 == Padding is enabled.
 * securityEnabled:
 *     0 == Security is not enabled.
 *     1 == Security is enabled.
 */
// a bit of play ;-)
const FRAME_CONTROL_LB_CMD_OK = 0b00000000;
const FRAME_CONTROL_LB_RSP_OK = 0b10000000;
const FRAME_CONTROL_LB_RSP_OVERFLOW = 0b10000001;
const FRAME_CONTROL_LB_RSP_TRUNCATED = 0b10000010;
const FRAME_CONTROL_LB_RSP_CB_PENDING = 0b10000100;
const FRAME_CONTROL_LB_RSP_CB_TYPE = 0b10001000;

const FRAME_CONTROL_HB_CMD_OK = 0b00000001;
const FRAME_CONTROL_HB_RSP_OK = 0b00000001;
const FRAME_CONTROL_HB_RSP_PADDING = 0b01000001;
const FRAME_CONTROL_HB_RSP_SECURITY = 0b10000001;
const FRAME_CONTROL_HB_RSP_RESERVED = 0b00100101;

const LEG_DATA_FRAME_RSP: readonly number[] = DATA_FRAME.slice(1, -3);
const EXT_DATA_FRAME_RSP: readonly number[] = [
    LEG_DATA_FRAME_RSP[EZSP_SEQUENCE_INDEX],
    LEG_DATA_FRAME_RSP[EZSP_FRAME_CONTROL_INDEX],
    FRAME_CONTROL_HB_RSP_OK,
    LEG_DATA_FRAME_RSP[EZSP_FRAME_ID_INDEX],
    LEG_DATA_FRAME_RSP[EZSP_FRAME_ID_INDEX],// 0x0000 for ext "version"
    ...LEG_DATA_FRAME_RSP.slice(EZSP_PARAMETERS_INDEX)
];

// LEGACY
const LEG_DATA_FRAME_RSP_DIRECTION = [...LEG_DATA_FRAME_RSP];
LEG_DATA_FRAME_RSP_DIRECTION[EZSP_FRAME_CONTROL_INDEX] = FRAME_CONTROL_LB_CMD_OK;// CMD not OK in RSP

const LEG_DATA_FRAME_RSP_OVERFLOW = [...LEG_DATA_FRAME_RSP];
LEG_DATA_FRAME_RSP_OVERFLOW[EZSP_FRAME_CONTROL_INDEX] = FRAME_CONTROL_LB_RSP_OVERFLOW;

const LEG_DATA_FRAME_RSP_TRUNCATED = [...LEG_DATA_FRAME_RSP];
LEG_DATA_FRAME_RSP_TRUNCATED[EZSP_FRAME_CONTROL_INDEX] = FRAME_CONTROL_LB_RSP_TRUNCATED;

const LEG_DATA_FRAME_RSP_CB_PENDING = [...LEG_DATA_FRAME_RSP];
LEG_DATA_FRAME_RSP_CB_PENDING[EZSP_FRAME_CONTROL_INDEX] = FRAME_CONTROL_LB_RSP_CB_PENDING;

const LEG_DATA_FRAME_RSP_CB_TYPE = [...LEG_DATA_FRAME_RSP];
LEG_DATA_FRAME_RSP_CB_TYPE[EZSP_FRAME_CONTROL_INDEX] = FRAME_CONTROL_LB_RSP_CB_TYPE;

const LEG_DATA_FRAME_RSP_INVALID_CMD = [...LEG_DATA_FRAME_RSP];
LEG_DATA_FRAME_RSP_INVALID_CMD[EZSP_FRAME_ID_INDEX] = FRAMES.invalidCommand.ID;
LEG_DATA_FRAME_RSP_INVALID_CMD[EZSP_PARAMETERS_INDEX] = EzspStatus.SPI_ERR_FATAL;

// EXTENDED
const EXT_DATA_FRAME_RSP_DIRECTION = [...EXT_DATA_FRAME_RSP];
EXT_DATA_FRAME_RSP_DIRECTION[EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX] = FRAME_CONTROL_LB_CMD_OK;// CMD not OK in RSP

const EXT_DATA_FRAME_RSP_OVERFLOW = [...EXT_DATA_FRAME_RSP];
EXT_DATA_FRAME_RSP_OVERFLOW[EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX] = FRAME_CONTROL_LB_RSP_OVERFLOW;

const EXT_DATA_FRAME_RSP_TRUNCATED = [...EXT_DATA_FRAME_RSP];
EXT_DATA_FRAME_RSP_TRUNCATED[EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX] = FRAME_CONTROL_LB_RSP_TRUNCATED;

const EXT_DATA_FRAME_RSP_CB_PENDING = [...EXT_DATA_FRAME_RSP];
EXT_DATA_FRAME_RSP_CB_PENDING[EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX] = FRAME_CONTROL_LB_RSP_CB_PENDING;

const EXT_DATA_FRAME_RSP_CB_TYPE = [...EXT_DATA_FRAME_RSP];
EXT_DATA_FRAME_RSP_CB_TYPE[EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX] = FRAME_CONTROL_LB_RSP_CB_TYPE;

const EXT_DATA_FRAME_RSP_RESERVED = [...EXT_DATA_FRAME_RSP];
EXT_DATA_FRAME_RSP_RESERVED[EZSP_EXTENDED_FRAME_CONTROL_HB_INDEX] = FRAME_CONTROL_HB_RSP_RESERVED;

const EXT_DATA_FRAME_RSP_INVALID_CMD = [...EXT_DATA_FRAME_RSP];
EXT_DATA_FRAME_RSP_INVALID_CMD[EZSP_EXTENDED_FRAME_ID_LB_INDEX] = FRAMES.invalidCommand.ID;
EXT_DATA_FRAME_RSP_INVALID_CMD[EZSP_EXTENDED_PARAMETERS_INDEX] = EzspStatus.SPI_ERR_FATAL;


describe('EZSP Frame Parsing', () => {
    beforeAll(async () => {
    });

    afterAll(async () => {
    });

    describe('LEGACY format', () => {
        it('Validates and parses received frame', async () => {
            const [status, frm] = EZSPFrameData.createValidReceivedFrame(2, Buffer.from(LEG_DATA_FRAME_RSP));

            expect(status).toStrictEqual(EzspStatus.SUCCESS);
            expect(frm.id).toStrictEqual(0);
            expect(frm.name).toStrictEqual("version");
        });
        it('Identifies wrong direction in received frame', async () => {
            const [status, frm] = EZSPFrameData.createValidReceivedFrame(2, Buffer.from(LEG_DATA_FRAME_RSP_DIRECTION));

            expect(status).toStrictEqual(EzspStatus.ERROR_WRONG_DIRECTION);
            expect(frm).toBeNull();
        });
        it('Identifies overflow status in received frame', async () => {
            const [status, frm] = EZSPFrameData.createValidReceivedFrame(2, Buffer.from(LEG_DATA_FRAME_RSP_OVERFLOW));

            expect(status).toStrictEqual(EzspStatus.ERROR_OVERFLOW);
            expect(frm).toBeNull();
        });
        it('Identifies truncated status in received frame', async () => {
            const [status, frm] = EZSPFrameData.createValidReceivedFrame(2, Buffer.from(LEG_DATA_FRAME_RSP_TRUNCATED));

            expect(status).toStrictEqual(EzspStatus.ERROR_TRUNCATED);
            expect(frm).toBeNull();
        });
        // it('Identifies callback pending in received frame', async () => {
        //     const [status, frm] = EZSPFrameData.validateAndCreateReceivedFrame(2, Buffer.from(LEG_DATA_FRAME_RSP_CB_PENDING));
        // });
        // it('Identifies callback type in received frame', async () => {
        //     const [status, frm] = EZSPFrameData.validateAndCreateReceivedFrame(2, Buffer.from(LEG_DATA_FRAME_RSP_CB_TYPE));
        // });
        it('Rejects invalid received frame', async () => {
            // take out one byte for no other reason than fail
            const [status, frm] = EZSPFrameData.createValidReceivedFrame(2, Buffer.from(LEG_DATA_FRAME_RSP).subarray(1));

            expect(status).not.toStrictEqual(EzspStatus.SUCCESS);
            expect(frm).toBeNull();
        });
        it('Identifies invalidCommand with its status in received frame', async () => {
            const [status, frm] = EZSPFrameData.createValidReceivedFrame(2, Buffer.from(LEG_DATA_FRAME_RSP_INVALID_CMD));

            expect(status).toStrictEqual(EzspStatus.SPI_ERR_FATAL);
            expect(frm).toBeNull();
        });
    });
    describe('EXTENDED format', () => {
        it('Validates and parses received frame', async () => {
            const [status, frm] = EZSPFrameData.createValidReceivedFrame(2, Buffer.from(EXT_DATA_FRAME_RSP));

            expect(status).toStrictEqual(EzspStatus.SUCCESS);
            expect(frm.id).toStrictEqual(0);
            expect(frm.name).toStrictEqual("version");
        });
        it('Identifies wrong direction in received frame', async () => {
            const [status, frm] = EZSPFrameData.createValidReceivedFrame(2, Buffer.from(EXT_DATA_FRAME_RSP_DIRECTION));

            expect(status).toStrictEqual(EzspStatus.ERROR_WRONG_DIRECTION);
            expect(frm).toBeNull();
        });
        it('Identifies overflow status in received frame', async () => {
            const [status, frm] = EZSPFrameData.createValidReceivedFrame(2, Buffer.from(EXT_DATA_FRAME_RSP_OVERFLOW));

            expect(status).toStrictEqual(EzspStatus.ERROR_OVERFLOW);
            expect(frm).toBeNull();
        });
        it('Identifies truncated status in received frame', async () => {
            const [status, frm] = EZSPFrameData.createValidReceivedFrame(2, Buffer.from(EXT_DATA_FRAME_RSP_TRUNCATED));

            expect(status).toStrictEqual(EzspStatus.ERROR_TRUNCATED);
            expect(frm).toBeNull();
        });
        // it('Identifies callback pending in received frame', async () => {
        //     const [status, frm] = EZSPFrameData.validateAndCreateReceivedFrame(2, Buffer.from(EXT_DATA_FRAME_RSP_CB_PENDING));
        // });
        // it('Identifies callback type in received frame', async () => {
        //     const [status, frm] = EZSPFrameData.validateAndCreateReceivedFrame(2, Buffer.from(EXT_DATA_FRAME_RSP_CB_TYPE));
        // });
        it('Identifies reserved (invalid) in received frame', async () => {
            const [status, frm] = EZSPFrameData.createValidReceivedFrame(2, Buffer.from(EXT_DATA_FRAME_RSP_RESERVED));

            expect(status).toStrictEqual(EzspStatus.ERROR_UNSUPPORTED_CONTROL);
            expect(frm).toBeNull();
        });
        it('Rejects invalid received frame', async () => {
            // take out one byte for no other reason than fail
            const [status, frm] = EZSPFrameData.createValidReceivedFrame(2, Buffer.from(EXT_DATA_FRAME_RSP).subarray(1));
    
            expect(status).not.toStrictEqual(EzspStatus.SUCCESS);
            expect(frm).toBeNull();
        });
        it('Identifies invalidCommand with its status in received frame', async () => {
            const [status, frm] = EZSPFrameData.createValidReceivedFrame(2, Buffer.from(EXT_DATA_FRAME_RSP_INVALID_CMD));

            expect(status).toStrictEqual(EzspStatus.SPI_ERR_FATAL);
            expect(frm).toBeNull();
        });
    });
    it('changeSourceRouteHandler', async () => {
        const frm = EZSPFrameData.createFrame(8, 0x00C4, false, Buffer.from('05e399a000', 'hex'));
        expect(frm._cls_).toBe('changeSourceRouteHandler');
        expect(frm._id_).toBe(0x00C4);
        expect(frm.newChildId).toBe(0xe305);
        expect(frm.newParentId).toBe(0xa099);
    });
    it('changeSourceRouteHandler', async () => {
        const frm = EZSPFrameData.createFrame(9, 0x00C4, false, Buffer.from('05e399a000', 'hex'));
        expect(frm._cls_).toBe('incomingNetworkStatusHandler');
        expect(frm._id_).toBe(0x00C4);
        expect(frm.errorCode).toBe(0x05);
        expect(frm.target).toBe(0x99e3);
    });
    it('incomingNetworkStatusHandler', async () => {
        const frm = EZSPFrameData.createFrame(9, 0x00C4, false, Buffer.from('0b044e', 'hex'));
        expect(frm._cls_).toBe('incomingNetworkStatusHandler');
        expect(frm._id_).toBe(0x00C4);
        expect(frm.errorCode).toBe(0x0b);
        expect(frm.target).toBe(0x4e04);
    });
    it('incomingNetworkStatusHandler', async () => {
        const frm = EZSPFrameData.createFrame(8, 0x00C4, false, Buffer.from('0b044e', 'hex'));
        expect(frm).toBe(undefined);
    });
});