import * as m from '../../../src/adapter/ember/utils/math';

const ASH_CRC_INIT = 0xffff;
const B32 = 0xbeefface;

describe('Ember Math utils', () => {
    it('mod8', () => {
        let t = m.mod8(0x00);
        expect(t).toStrictEqual(0);
        t = m.mod8(0x03);
        expect(t).toStrictEqual(3);
        t = m.mod8(0x07);
        expect(t).toStrictEqual(7);
        t = m.mod8(0x08);
        expect(t).toStrictEqual(0);
        t = m.mod8(0x10);
        expect(t).toStrictEqual(0);
        t = m.mod8(0xfe);
        expect(t).toStrictEqual(6);
        t = m.mod8(0xff);
        expect(t).toStrictEqual(7);
    });
    it('inc8', () => {
        let t = m.inc8(0x00);
        expect(t).toStrictEqual(1);
        t = m.inc8(0x03);
        expect(t).toStrictEqual(4);
        t = m.inc8(0x07);
        expect(t).toStrictEqual(0);
        t = m.inc8(0x08);
        expect(t).toStrictEqual(1);
        t = m.inc8(0x10);
        expect(t).toStrictEqual(1);
        t = m.inc8(0xfe);
        expect(t).toStrictEqual(7);
        t = m.inc8(0xff);
        expect(t).toStrictEqual(0);
    });
    it('withinRange', () => {
        let t = m.withinRange(0x00, 0x04, 0x07);
        expect(t).toStrictEqual(true);
        t = m.withinRange(0x00, 0x04, 0x08);
        expect(t).toStrictEqual(false);
        t = m.withinRange(0xaa, 0xac, 0xfe);
        expect(t).toStrictEqual(true);
        t = m.withinRange(0x00, 0x04, 0xf8);
        expect(t).toStrictEqual(false);
    });
    it('halCommonCrc16', () => {
        let t = m.halCommonCrc16(0x00, ASH_CRC_INIT);
        expect(t).toStrictEqual(57840);
        t = m.halCommonCrc16(0x03, t);
        expect(t).toStrictEqual(11628);
        t = m.halCommonCrc16(0xfe, t);
        expect(t).toStrictEqual(38686);
        t = m.halCommonCrc16(0xa5, t);
        expect(t).toStrictEqual(2065);
    });
    it('lowBits', () => {
        let t = m.lowBits(10);
        expect(t).toStrictEqual(10);
        t = m.lowBits(100);
        expect(t).toStrictEqual(4);
    });
    it('highBits', () => {
        let t = m.highBits(10);
        expect(t).toStrictEqual(0);
        t = m.highBits(100);
        expect(t).toStrictEqual(6);
    });
    it('lowByte', () => {
        let t = m.lowByte(10);
        expect(t).toStrictEqual(10);
        t = m.lowByte(100);
        expect(t).toStrictEqual(100);
        t = m.lowByte(1000);
        expect(t).toStrictEqual(232);
        t = m.lowByte(255);
        expect(t).toStrictEqual(255);
        t = m.lowByte(1024);
        expect(t).toStrictEqual(0);
        t = m.lowByte(B32);
        expect(t).toStrictEqual(206);
    });
    it('highByte', () => {
        let t = m.highByte(10);
        expect(t).toStrictEqual(0);
        t = m.highByte(100);
        expect(t).toStrictEqual(0);
        t = m.highByte(1000);
        expect(t).toStrictEqual(3);
        t = m.highByte(255);
        expect(t).toStrictEqual(0);
        t = m.highByte(1024);
        expect(t).toStrictEqual(4);
        t = m.highByte(B32);
        expect(t).toStrictEqual(250);
    });
    it('highLowToInt', () => {
        let t = m.highLowToInt(254, 10);
        expect(t).toStrictEqual(65034);
        t = m.highLowToInt(10, 100);
        expect(t).toStrictEqual(2660);
        t = m.highLowToInt(1000, 2000);
        expect(t).toStrictEqual(256208);
        t = m.highLowToInt(355, 255);
        expect(t).toStrictEqual(91135);
        t = m.highLowToInt(123, 1024);
        expect(t).toStrictEqual(31488);
        t = m.highLowToInt(1, B32);
        expect(t).toStrictEqual(462);
        t = m.highLowToInt(B32, 1);
        expect(t).toStrictEqual(16436737);
    });
    it('bit', () => {
        let t = m.bit(11);
        expect(t).toStrictEqual(2048);
        t = m.bit(15);
        expect(t).toStrictEqual(32768);
        t = m.bit(26);
        expect(t).toStrictEqual(67108864);
        t = m.bit(11) | m.bit(15) | m.bit(20) | m.bit(25);
        expect(t).toStrictEqual(34637824);
        t =
            m.bit(12) |
            m.bit(13) |
            m.bit(14) |
            m.bit(16) |
            m.bit(17) |
            m.bit(18) |
            m.bit(19) |
            m.bit(21) |
            m.bit(22) |
            m.bit(23) |
            m.bit(24) |
            m.bit(26);
        expect(t).toStrictEqual(99577856);
        t = 53 & m.bit(0);
        expect(t).toStrictEqual(1);
        t = 53 & m.bit(3);
        expect(t).toStrictEqual(0);
        t = 53 | m.bit(0);
        expect(t).toStrictEqual(53);
        t = 53 | m.bit(3);
        expect(t).toStrictEqual(61);
    });
    it('bit32', () => {
        let t = m.bit32(11);
        expect(t).toStrictEqual(2048);
        t = m.bit32(15);
        expect(t).toStrictEqual(32768);
        t = m.bit32(26);
        expect(t).toStrictEqual(67108864);
        t = m.bit32(11) | m.bit32(15) | m.bit32(20) | m.bit32(25);
        expect(t).toStrictEqual(34637824);
        t =
            m.bit32(12) |
            m.bit32(13) |
            m.bit32(14) |
            m.bit32(16) |
            m.bit32(17) |
            m.bit32(18) |
            m.bit32(19) |
            m.bit32(21) |
            m.bit32(22) |
            m.bit32(23) |
            m.bit32(24) |
            m.bit32(26);
        expect(t).toStrictEqual(99577856);
        t = B32 & m.bit32(0);
        expect(t).toStrictEqual(0);
        t = B32 & m.bit32(3);
        expect(t).toStrictEqual(8);
        t = B32 | m.bit32(0);
        expect(t).toStrictEqual(-1091568945);
        t = B32 | m.bit32(3);
        expect(t).toStrictEqual(-1091568946);
    });
    it('lowHighBytes', () => {
        let [l, h] = m.lowHighBytes(1024);
        expect(l).toStrictEqual(0);
        expect(h).toStrictEqual(4);
        expect(l).toStrictEqual(m.lowByte(1024));
        expect(h).toStrictEqual(m.highByte(1024));
        [l, h] = m.lowHighBytes(255);
        expect(l).toStrictEqual(255);
        expect(h).toStrictEqual(0);
    });
    it('lowHighBits', () => {
        let [l, h] = m.lowHighBits(10);
        expect(l).toStrictEqual(10);
        expect(h).toStrictEqual(0);
        expect(l).toStrictEqual(m.lowBits(10));
        expect(h).toStrictEqual(m.highBits(0));
        [l, h] = m.lowHighBits(100);
        expect(l).toStrictEqual(4);
        expect(h).toStrictEqual(6);
    });
    it('byteToBits', () => {
        let t = m.byteToBits(2);
        expect(t).toStrictEqual('00000010');
        t = m.byteToBits(4);
        expect(t).toStrictEqual('00000100');
    });
});
