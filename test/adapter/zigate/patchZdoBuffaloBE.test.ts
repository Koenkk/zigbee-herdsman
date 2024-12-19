import * as Zdo from '../../../src/zspec/zdo';

describe('ZiGate Patch BuffaloZdo to use BE variants when writing', () => {
    let BuffaloZdo: typeof Zdo.Buffalo;

    beforeAll(async () => {
        vi.resetModules();

        const buf = await import('../../../src/zspec/zdo/buffaloZdo');
        BuffaloZdo = buf.BuffaloZdo;
        const {ZiGateAdapter} = await import('../../../src/adapter/zigate/adapter/zigateAdapter');
        // @ts-expect-error bogus, just need to trigger constructor
        const adapter = new ZiGateAdapter({}, {}, '', {});
    });

    it('writeUInt16', async () => {
        expect(BuffaloZdo.buildRequest(false, Zdo.ClusterId.IEEE_ADDRESS_REQUEST, 0x1234, false, 0)).toStrictEqual(
            Buffer.from([0x12, 0x34, 0x00, 0x00]),
        );

        // ensure regular parsing OK
        expect(Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.IEEE_ADDRESS_REQUEST, 0x1234, false, 0)).toStrictEqual(
            Buffer.from([0x34, 0x12, 0x00, 0x00]),
        );
    });

    it('writeUInt32', async () => {
        expect(BuffaloZdo.buildRequest(false, Zdo.ClusterId.NWK_UPDATE_REQUEST, [15], 0xfe, undefined, undefined, undefined)).toStrictEqual(
            Buffer.from([0x00, 0x00, 0x80, 0x00, 0xfe]),
        );

        // ensure regular parsing OK
        expect(Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NWK_UPDATE_REQUEST, [15], 0xfe, undefined, undefined, undefined)).toStrictEqual(
            Buffer.from([0x00, 0x80, 0x00, 0x00, 0xfe]),
        );
    });

    it('readUInt16 + readUInt32 - LE', async () => {
        expect(
            BuffaloZdo.readResponse(
                true,
                Zdo.ClusterId.NWK_UPDATE_RESPONSE,
                Buffer.from([0x01, 0x00, 0x00, 0x00, 0x80, 0x00, 0x12, 0x34, 0x00, 0x01, 0x01, 0x12]),
            ),
        ).toStrictEqual(
            Zdo.Buffalo.readResponse(
                true,
                Zdo.ClusterId.NWK_UPDATE_RESPONSE,
                Buffer.from([0x01, 0x00, 0x00, 0x00, 0x80, 0x00, 0x12, 0x34, 0x00, 0x01, 0x01, 0x12]),
            ),
        );
    });

    it('writeIeeeAddr', async () => {
        expect(BuffaloZdo.buildRequest(false, Zdo.ClusterId.NETWORK_ADDRESS_REQUEST, '0x1122334455667788', false, 0)).toStrictEqual(
            Buffer.from([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x00, 0x00]),
        );

        // ensure regular parsing OK
        expect(Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NETWORK_ADDRESS_REQUEST, '0x1122334455667788', false, 0)).toStrictEqual(
            Buffer.from([0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11, 0x00, 0x00]),
        );
    });

    it('readIeeeAddr - LE', async () => {
        expect(
            BuffaloZdo.readResponse(
                true,
                Zdo.ClusterId.IEEE_ADDRESS_RESPONSE,
                Buffer.from([0x01, 0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x12, 0x34]),
            ),
        ).toStrictEqual(
            Zdo.Buffalo.readResponse(
                true,
                Zdo.ClusterId.IEEE_ADDRESS_RESPONSE,
                Buffer.from([0x01, 0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x12, 0x34]),
            ),
        );
    });
});
