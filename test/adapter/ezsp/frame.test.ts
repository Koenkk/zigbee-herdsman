import {EZSPFrameData} from '../../../src/adapter/ezsp/driver/ezsp';

describe('FRAME Parsing', () => {
    it('changeSourceRouteHandler', async () => {
        const frm = EZSPFrameData.createFrame(0x00C4, false, Buffer.from('05e399a000', 'hex'));
        expect(frm._cls_).toBe('changeSourceRouteHandler');
        expect(frm._id_).toBe(0x00C4);
        expect(frm.newChildId).toBe(0xe305);
        expect(frm.newParentId).toBe(0xa099);
    });
    it('incomingNetworkStatusHandler', async () => {
        const frm = EZSPFrameData.createFrame(0x00C4, false, Buffer.from('0b044e', 'hex'));
        expect(frm._cls_).toBe('incomingNetworkStatusHandler');
        expect(frm._id_).toBe(0x00C4);
        expect(frm.errorCode).toBe(0x0b);
        expect(frm.target).toBe(0x4e04);
    });
});