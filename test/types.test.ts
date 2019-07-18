import {Parser, Type} from '../src/types';

const ieeeaAddr1 = {
    string: '0xae440112004b1200',
    hex: [0x00, 0x12, 0x4b, 0x00, 0x12, 0x01, 0x44, 0xae],
};

const ieeeaAddr2 = {
    string: '0xaf440112005b1200',
    hex: [0x00, 0x12, 0x5b, 0x00, 0x12, 0x01, 0x44, 0xaf],
};

const duplicateArray = (amount, value) => {
    let result = [];
    for (let i = 0; i < amount; i++) {
        result = result.concat(value);
    }

    return result;
}

describe('Parser', () => {
    it('UINT8 write', () => {
        const parser = Parser[Type.UINT8];
        const buffer = Buffer.alloc(3);
        const length = parser.write(buffer, 1, 240);
        expect(length).toStrictEqual(1);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0xF0, 0x00]))
    });

    it('UINT8 read', () => {
        const parser = Parser[Type.UINT8];
        const buffer = Buffer.from([0x00, 0x03, 0x00, 0x00]);
        const result = parser.read(buffer, 1, {});
        expect(result.length).toStrictEqual(1);
        expect(result.value).toStrictEqual(3);
    });

    it('UINT16 write', () => {
        const parser = Parser[Type.UINT16];
        const buffer = Buffer.alloc(3);
        const length = parser.write(buffer, 1, 1020);
        expect(length).toStrictEqual(2);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0xFC, 0x03]))
    });

    it('UINT16 read', () => {
        const parser = Parser[Type.UINT16];
        const buffer = Buffer.from([0x00, 0x03, 0xFF, 0x00]);
        const result = parser.read(buffer, 1, {});
        expect(result.length).toStrictEqual(2);
        expect(result.value).toStrictEqual(65283);
    });

    it('UINT32 write', () => {
        const parser = Parser[Type.UINT32];
        const buffer = Buffer.alloc(6);
        const length = parser.write(buffer, 2, 1065283);
        expect(length).toStrictEqual(4);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0x00, 0x43, 0x41, 0x10, 0x00]))
    });

    it('UINT32 read', () => {
        const parser = Parser[Type.UINT32];
        const buffer = Buffer.from([0x01, 0x03, 0xFF, 0xFF]);
        const result = parser.read(buffer, 0, {});
        expect(result.length).toStrictEqual(4);
        expect(result.value).toStrictEqual(4294902529);
    });

    it('IEEEADDR write', () => {
        const parser = Parser[Type.IEEEADDR];
        const buffer = Buffer.alloc(8);
        const length = parser.write(buffer, 0, ieeeaAddr1.string);
        expect(length).toStrictEqual(8);
        expect(buffer).toStrictEqual(Buffer.from(ieeeaAddr1.hex))
    });

    it('IEEEADDR read', () => {
        const parser = Parser[Type.IEEEADDR];
        const buffer = Buffer.from(ieeeaAddr2.hex);
        const result = parser.read(buffer, 0, {});
        expect(result.length).toStrictEqual(8);
        expect(result.value).toStrictEqual(ieeeaAddr2.string);
    });

    it('BUFFER write', () => {
        const parser = Parser[Type.BUFFER];
        const buffer = Buffer.alloc(5);
        const payload = Buffer.from([0x00, 0x01, 0x02]);
        const length = parser.write(buffer, 1, payload);
        expect(length).toStrictEqual(3);
        expect(buffer).toStrictEqual(Buffer.from([0x00, ...payload, 0x00]))
    });

    it('BUFFER read', () => {
        const parser = Parser[Type.BUFFER];
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);
        const result = parser.read(payload, 2, {length: 5});
        expect(result.length).toStrictEqual(5);
        expect(result.value).toStrictEqual(Buffer.from([0x02, 0x03, 0x04, 0x05, 0x06]));
    });

    it('BUFFER8 write', () => {
        const parser = Parser[Type.BUFFER8];
        const buffer = Buffer.alloc(9);
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
        const length = parser.write(buffer, 1, payload);
        expect(length).toStrictEqual(8);
        expect(buffer).toStrictEqual(Buffer.from([0x00, ...payload]))
    });

    it('BUFFER8 write length consistent', () => {
        const parser = Parser[Type.BUFFER8];
        const buffer = Buffer.alloc(9);
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
        expect(() => {
            parser.write(buffer, 1, payload);
        }).toThrow();
    });

    it('BUFFER8 read', () => {
        const parser = Parser[Type.BUFFER8];
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);
        const result = parser.read(payload, 2, {});
        expect(result.length).toStrictEqual(8);
        expect(result.value).toStrictEqual(payload.slice(2, 11));
    });

    it('BUFFER16 write', () => {
        const parser = Parser[Type.BUFFER16];
        const buffer = Buffer.alloc(20);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const length = parser.write(buffer, 1, Buffer.from([...payload, ...payload]));
        expect(length).toStrictEqual(16);
        expect(buffer).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, 0x00, 0x00, 0x00]))
    });

    it('BUFFER16 read', () => {
        const parser = Parser[Type.BUFFER16];
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const result = parser.read(Buffer.from([0x00, ...payload, ...payload]), 1, {});
        expect(result.length).toStrictEqual(16);
        expect(result.value).toStrictEqual(Buffer.from([...payload, ...payload]));
    });

    it('BUFFER18 write', () => {
        const parser = Parser[Type.BUFFER18];
        const buffer = Buffer.alloc(20);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
        const length = parser.write(buffer, 1, Buffer.from([...payload, ...payload]));
        expect(length).toStrictEqual(18);
        expect(buffer).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, 0x00]))
    });

    it('BUFFER18 read', () => {
        const parser = Parser[Type.BUFFER18];
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
        const result = parser.read(Buffer.from([0x00, ...payload, ...payload]), 1, {});
        expect(result.length).toStrictEqual(18);
        expect(result.value).toStrictEqual(Buffer.from([...payload, ...payload]));
    });

    it('BUFFER32 write', () => {
        const parser = Parser[Type.BUFFER32];
        const buffer = Buffer.alloc(34);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const length = parser.write(buffer, 1, Buffer.from([...payload, ...payload, ...payload, ...payload]));
        expect(length).toStrictEqual(32);
        expect(buffer).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, 0x00]))
    });

    it('BUFFER32 read', () => {
        const parser = Parser[Type.BUFFER32];
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const result = parser.read(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload]), 1, {});
        expect(result.length).toStrictEqual(32);
        expect(result.value).toStrictEqual(Buffer.from([...payload, ...payload, ...payload, ...payload]));
    });

    it('BUFFER42 write', () => {
        const parser = Parser[Type.BUFFER42];
        const buffer = Buffer.alloc(44);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const length = parser.write(buffer, 1, Buffer.from([...payload, ...payload, ...payload, ...payload, ...payload, 0x01, 0xFF]));
        expect(length).toStrictEqual(42);
        expect(buffer).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, ...payload, 0x01, 0xFF, 0x00]))
    });

    it('BUFFER42 read', () => {
        const parser = Parser[Type.BUFFER42];
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const result = parser.read(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, ...payload, 0x08, 0x09]), 1, {});
        expect(result.length).toStrictEqual(42);
        expect(result.value).toStrictEqual(Buffer.from([...payload, ...payload, ...payload, ...payload, ...payload, 0x08, 0x09]));
    });

    it('BUFFER100 write', () => {
        const parser = Parser[Type.BUFFER100];
        const buffer = Buffer.alloc(100);
        let payload = duplicateArray(20, [0x00, 0x01, 0x02, 0x03, 0x04]);

        const length = parser.write(buffer, 0, Buffer.from(payload));
        expect(length).toStrictEqual(100);
        expect(buffer).toStrictEqual(Buffer.from(payload))
    });

    it('BUFFER100 read', () => {
        const parser = Parser[Type.BUFFER100];
        let payload = duplicateArray(20, [0x00, 0x01, 0x02, 0x03, 0x04]);

        const result = parser.read(Buffer.from([0x00, ...payload]), 1, {});
        expect(result.length).toStrictEqual(100);
        expect(result.value).toStrictEqual(Buffer.from(payload));
    });

    it('LIST_UINT16 write', () => {
        const parser = Parser[Type.LIST_UINT16];
        const buffer = Buffer.alloc(5);
        const payload = [1024, 2048];
        const length = parser.write(buffer, 1, payload);
        expect(length).toStrictEqual(4);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0x00, 0x04, 0x00, 0x08]));
    });

    it('LIST_UINT16 read', () => {
        const parser = Parser[Type.LIST_UINT16];
        const result = parser.read(Buffer.from([0x00, 0x00, 0x04, 0x00, 0x08]), 1, {length: 2});
        expect(result.length).toStrictEqual(4);
        expect(result.value).toStrictEqual([1024, 2048]);
    });

    it('LIST_ROUTING_TABLE write', () => {
        const parser = Parser[Type.LIST_ROUTING_TABLE];
        expect(() => {
            parser.write(Buffer.alloc(10), 1, [])
        }).toThrow();
    });

    it('LIST_ROUTING_TABLE read', () => {
        const parser = Parser[Type.LIST_ROUTING_TABLE];
        const buffer = Buffer.from([
            0x00,
            0x10, 0x27, 0x00, 0x11, 0x27,
            0x10, 0x29, 0x01, 0x11, 0x23,
        ]);

        const result = parser.read(buffer, 1, {length: 2});
        expect(result.length).toStrictEqual(10);
        expect(result.value).toStrictEqual([
            {
                "destNwkAddr": 10000,
                "nextHopNwkAddr": 10001,
                "routeStatus": "ACTIVE",
            },
            {
                "destNwkAddr": 10512,
                "nextHopNwkAddr": 8977,
                "routeStatus": "DISCOVERY_UNDERWAY",
            },
        ]);
    });

    it('LIST_BIND_TABLE write', () => {
        const parser = Parser[Type.LIST_BIND_TABLE];
        expect(() => {
            parser.write(Buffer.alloc(10), 1, [])
        }).toThrow();
    });

    it('LIST_BIND_TABLE read', () => {
        const parser = Parser[Type.LIST_BIND_TABLE];
        const buffer = Buffer.from([
            0x00,
            ...ieeeaAddr1.hex, 0x02, 0x01, 0x00, 0x02, ...ieeeaAddr2.hex,
            ...ieeeaAddr2.hex, 0x02, 0x01, 0x00, 0x03, ...ieeeaAddr1.hex, 0x04,
            0x01,
        ]);

        const result = parser.read(buffer, 1, {length: 2});
        expect(result.length).toStrictEqual(41);
        expect(result.value).toStrictEqual([
           {
                "clusterId": 1,
                "dstAddr": ieeeaAddr2.string,
                "dstAddrMode": 2,
                "srcAddr": ieeeaAddr1.string,
                "srcEp": 2,
            },
               {
                "clusterId": 1,
                "dstAddr": ieeeaAddr1.string,
                "dstAddrMode": 3,
                "dstEp": 4,
                "srcAddr": ieeeaAddr2.string,
                "srcEp": 2,
            },
        ]);
    });

    it('LIST_NEIGHBOR_LQI write', () => {
        const parser = Parser[Type.LIST_NEIGHBOR_LQI];
        expect(() => {
            parser.write(Buffer.alloc(10), 1, [])
        }).toThrow();
    });

    it('LIST_NEIGHBOR_LQI read', () => {
        const parser = Parser[Type.LIST_NEIGHBOR_LQI];
        const buffer = Buffer.from([
            0x00,
            ...ieeeaAddr1.hex, ...ieeeaAddr2.hex, 0x10, 0x10, 0x44, 0x01, 0x02, 0x09,
            ...ieeeaAddr2.hex, ...ieeeaAddr1.hex, 0x10, 0x10, 0x44, 0x00, 0x10, 0x08,
            0x01,
        ]);

        const result = parser.read(buffer, 1, {length: 2});
        expect(result.length).toStrictEqual(44);
        expect(result.value).toStrictEqual([
            {
                "depth": 2,
                "deviceType": 0,
                "extAddr": "0xaf440112005b1200",
                "extPandId": "0xae440112004b1200",
                "lqi": 9,
                "nwkAddr": 4112,
                "permitJoin": 1,
                "relationship": 4,
                "rxOnWhenIdle": 1,
            },
            {
                "depth": 16,
                "deviceType": 0,
                "extAddr": "0xae440112004b1200",
                "extPandId": "0xaf440112005b1200",
                "lqi": 8,
                "nwkAddr": 4112,
                "permitJoin": 0,
                "relationship": 4,
                "rxOnWhenIdle": 1,
            },
        ]);
    });

    it('LIST_NETWORK write', () => {
        const parser = Parser[Type.LIST_NETWORK];
        expect(() => {
            parser.write(Buffer.alloc(10), 1, [])
        }).toThrow();
    });

    it('LIST_NETWORK read', () => {
        const parser = Parser[Type.LIST_NETWORK];
        const buffer = Buffer.from([
            0x05,
            0x10, 0x10, 0x09, 0x31, 0x13, 0x01,
            0x10, 0x10, 0x09, 0x31, 0x13, 0x00,
            0x01,
        ]);

        const result = parser.read(buffer, 1, {length: 2});
        expect(result.length).toStrictEqual(12);
        expect(result.value).toStrictEqual([
            {
                "beaconOrder": 3,
                "logicalChannel": 9,
                "neightborPanId": 4112,
                "permitJoin": 1,
                "stackProfile": 1,
                "superFrameOrder": 1,
                "zigbeeVersion": 3,
            },
            {
                "beaconOrder": 3,
                "logicalChannel": 9,
                "neightborPanId": 4112,
                "permitJoin": 0,
                "stackProfile": 1,
                "superFrameOrder": 1,
                "zigbeeVersion": 3,
            },
        ]);
    });

    it('LIST_ASSOC_DEV write', () => {
        const parser = Parser[Type.LIST_ASSOC_DEV];
        expect(() => {
            parser.write(Buffer.alloc(10), 1, [])
        }).toThrow();
    });

    it('LIST_ASSOC_DEV read 3', () => {
        const parser = Parser[Type.LIST_ASSOC_DEV];
        const buffer = Buffer.from([
            0x05, 0x10,
            0x10, 0x09,
            0x31, 0x13,
        ]);

        const result = parser.read(buffer, 0, {length: 3, startIndex: 0});
        expect(result.length).toStrictEqual(6);
        expect(result.value).toStrictEqual([
            4101,
            2320,
            4913,
        ]);
    });

    it('LIST_ASSOC_DEV read 75', () => {
        const parser = Parser[Type.LIST_ASSOC_DEV];
        const payload35 = duplicateArray(35, [0x10, 0x10]);
        const payload5 = duplicateArray(5, [0x10, 0x10]);

        const result1 = parser.read(Buffer.from(payload35), 0, {length: 40, startIndex: 0});
        expect(result1.length).toStrictEqual(70);
        expect(result1.value).toStrictEqual(duplicateArray(35, [4112]));

        const result2 = parser.read(Buffer.from(payload5), 0, {length: 40, startIndex: 35});
        expect(result2.length).toStrictEqual(10);
        expect(result2.value).toStrictEqual(duplicateArray(5, [4112]));
    });
});