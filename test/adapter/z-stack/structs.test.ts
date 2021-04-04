import * as Structs from "../../../src/adapter/z-stack/structs";

describe('Z-Stack Structs', () => {
    it('should export js object from structure', () => {
        const nib = Structs.nib();
        nib.extendedPANID = Buffer.alloc(8, 0x01);
        nib.nwkLogicalChannel = 21;

        const obj = nib.toJSON();
        expect(obj.extendedPANID.toString("hex")).toBe(Buffer.alloc(8, 0x01).toString("hex"));
        expect(obj.nwkLogicalChannel).toBe(21);
    });

    it('should properly serialize structure in different alignment modes', () => {
        const nib = Structs.nib(Buffer.from("fb050279147900640000000105018f000700020d1e000000150000000000000000000000ffff0800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000", "hex"));
        expect(nib.serialize().toString("hex")).toBe("fb050279147900640000000105018f0700020d1e00001500000000000000000000ffff08000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a010000060200");
        expect(nib.serialize("unaligned", true, 0).toString("hex")).toBe("fb050279147900640000000105018f0700020d1e00001500000000000000000000ffff08000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a010000060200");
        expect(nib.serialize("aligned", true, 0).toString("hex")).toBe("fb050279147900640000000105018f000700020d1e000000150000000000000000000000ffff0800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000");
        expect(nib.getLength("aligned")).toBe(116);
        expect(nib.getLength("aligned", false)).toBe(115);
        expect(nib.getLength("unaligned")).toBe(110);
    });

    it('should throw error on invalid uint8 array length', () => {
        const nib = Structs.nib();
        expect(() => nib.extendedPANID = Buffer.alloc(10, 0x01)).toThrowError("Invalid length for member extendedPANID (expected=8, got=10)");
    });

    it('should fail to initialize struct from invalid length source', () => {
        expect(() => { Structs.nib(Buffer.from("01020304", "hex")); }).toThrowError("Struct length mismatch (expected=110/116, got=4");
    });

    it('should fail if table entries are not the same length', () => {
        expect(() => {
            Structs.securityManagerTable([
                Buffer.alloc(12, 0x00),
                Buffer.alloc(17, 0x00)
            ], "unaligned");
        }).toThrowError("All table entries need to be the same length");
    });

    it('should fail if table initialization buffer is indivisible by entry length', () => {
        expect(() => {
            Structs.securityManagerTable(Buffer.alloc(91, 0x00));
        }).toThrowError("Table length not divisible by entry length (alignment=unaligned, data_length=91, entry_length=5)");
    });

    it('should fail if table initialization source is unsupported', () => {
        expect(() => {
            Structs.securityManagerTable("das_garbage" as any);
        }).toThrowError("Unsupported table data source");
    });

    it('should properly return table capacity metrics', () => {
        const table = Structs.securityManagerTable(8);
        expect(table.used.length).toBe(0);
        expect(table.free.length).toBe(8);
    });

    it('should properly serialize unaligned and aligned table - with inline occupancy', () => {
        const table = Structs.securityManagerTable(8);
        expect(table.serialize().toString("hex")).toBe("0000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000");
        expect(table.serialize("unaligned").toString("hex")).toBe("0000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000");
        expect(table.serialize("aligned").toString("hex")).toBe("0000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000");
    });

    it('should properly serialize unaligned and aligned table - without inline occupancy', () => {
        const table = Structs.nwkSecMaterialDescriptorTable(8);
        expect(table.serialize().toString("hex")).toBe("000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
        expect(table.serialize("unaligned").toString("hex")).toBe("000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
        expect(table.serialize("aligned").toString("hex")).toBe("000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
    });

    it('should evaluate table struct', () => {
        const table = Structs.nwkSecMaterialDescriptorTable(8);
        expect(table.capacity).toBe(8);
        expect(table.entries.length).toBe(8);
        expect(table.freeCount).toBe(8);
        expect(table.usedCount).toBe(0);
    });
});
