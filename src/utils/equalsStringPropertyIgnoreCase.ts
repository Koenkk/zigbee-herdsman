function equalsStringPropertyIgnoreCase<T>(object: unknown, expected: {[key: string]: string }): boolean {
    const entries = Object.entries(expected) as [keyof T, unknown][];
    return entries.every(([key, value]) => 
        typeof(object[key]) === "string" && typeof(value) === "string" &&
        (object[key] as string).toLowerCase() === value.toLowerCase());
}

export default equalsStringPropertyIgnoreCase;