import EqualsStringPropertyIgnoreCase from './equalsStringPropertyIgnoreCase';

const autoDetectDefinitions = [
    {manufacturer: 'Texas Instruments', vendorId: '0451', productId: '16c8'}, // CC2538
    {manufacturer: 'Texas Instruments', vendorId: '0451', productId: '16a8'}, // CC2531
    {manufacturer: 'Texas Instruments', vendorId: '0451', productId: 'bef3'}, // CC1352P_2 and CC26X2R1
    {manufacturer: 'Electrolama', vendorId: '0403', productId: '6015'}, // ZZH
];


describe("equalsStringPropertyIgnoreCase", () => {
    it('matches objects with string properties', () => {
        const obj = {manufacturer: 'Texas Instruments', vendorId: '0451', productId: '16c8'};
        expect(EqualsStringPropertyIgnoreCase(obj, autoDetectDefinitions[0])).toBe(true);
        expect(EqualsStringPropertyIgnoreCase(obj, autoDetectDefinitions[1])).toBe(false);
    });

    it('ignores case', () => {
        const obj = {manufacturer: 'TEXAS Instruments', vendorId: '0451', productId: '16C8'};
        expect(EqualsStringPropertyIgnoreCase(obj, autoDetectDefinitions[0])).toBe(true);
        expect(EqualsStringPropertyIgnoreCase(obj, autoDetectDefinitions[1])).toBe(false);
    });

    it('allows extra properties', () => {
        const obj = {extra1: 'a', manufacturer: 'TEXAS Instruments', vendorId: '0451', productId: '16C8', extra2: 'b'};
        expect(EqualsStringPropertyIgnoreCase(obj, autoDetectDefinitions[0])).toBe(true);
    });

    it('disallows properties of wrong type', () => {
        const obj = {manufacturer: new Date(), vendorId: 23, productId: '16C8', extra2: 'b'};
        expect(EqualsStringPropertyIgnoreCase(obj, autoDetectDefinitions[0])).toBe(false);
    });
});