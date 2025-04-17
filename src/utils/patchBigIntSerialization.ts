// Patch BigInt serialization which is used in e.g. Zcl payloads.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#use_within_json
// biome-ignore lint/suspicious/noExplicitAny: API
(BigInt.prototype as any).toJSON = function (): string {
    return this.toString();
};

export {};
