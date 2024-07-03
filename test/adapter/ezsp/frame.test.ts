import {EZSPFrameData} from '../../../src/adapter/ezsp/driver/ezsp';

describe('FRAME Parsing', () => {
    it('changeSourceRouteHandler', async () => {
        const frm = EZSPFrameData.createFrame(8, 0x00c4, false, Buffer.from('05e399a000', 'hex'));
        expect(frm._cls_).toBe('changeSourceRouteHandler');
        expect(frm._id_).toBe(0x00c4);
        expect(frm.newChildId).toBe(0xe305);
        expect(frm.newParentId).toBe(0xa099);
    });
    it('changeSourceRouteHandler', async () => {
        const frm = EZSPFrameData.createFrame(9, 0x00c4, false, Buffer.from('05e399a000', 'hex'));
        expect(frm._cls_).toBe('incomingNetworkStatusHandler');
        expect(frm._id_).toBe(0x00c4);
        expect(frm.errorCode).toBe(0x05);
        expect(frm.target).toBe(0x99e3);
    });
    it('incomingNetworkStatusHandler', async () => {
        const frm = EZSPFrameData.createFrame(9, 0x00c4, false, Buffer.from('0b044e', 'hex'));
        expect(frm._cls_).toBe('incomingNetworkStatusHandler');
        expect(frm._id_).toBe(0x00c4);
        expect(frm.errorCode).toBe(0x0b);
        expect(frm.target).toBe(0x4e04);
    });
    it('incomingNetworkStatusHandler', async () => {
        const frm = EZSPFrameData.createFrame(8, 0x00c4, false, Buffer.from('0b044e', 'hex'));
        expect(frm).toBe(undefined);
    });
});
