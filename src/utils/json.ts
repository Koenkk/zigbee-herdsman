/**
 * JSON replacer that turns BigInt into string.
 * Can be passed into JSON.stringify(obj, jsonReplacer, space)
 */
export function jsonReplacer(_key: string, value: unknown): unknown {
    return typeof value === "bigint" ? value.toString() : value;
}
