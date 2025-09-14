/**
 * Script: Generate enums and interfaces from ZCL XML data type definitions.
 *
 * Goals:
 *  - Parse XML cluster definition files (library.xml and its includes).
 *  - Respect XSD-described structure (type.xsd).
 *  - For <type:type> with <restriction><type:enumeration>, create a TS enum.
 *  - For <type:type> with <bitmap><element>, create a TS enum (for flags).
 *  - For <type:type> with <restriction><sequence>, create a TS interface.
 *  - Parse inline type definitions within attributes and command fields.
 *  - Write the generated code to a new file.
 *
 * Requirements:
 *   pnpm i xml2js @types/xml2js
 *
 * Usage:
 *    tsx scripts/zap-update-types.ts ../zap/zcl-builtin/dotdot
 */

import {promises as fs} from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";
import {parseStringPromise} from "xml2js";
import type {XMLAttr, XMLBitmapDefinition, XMLClusterSide, XMLEnumeration, XMLRestriction, XMLRoot, XMLSequence, XMLTypeType} from "./zap-xml-types";

// #region Type Definitions

interface ParsedXMLTypeType extends XMLTypeType {
    clusterName?: string;
}

interface ParsedType {
    name: string;
    node: ts.EnumDeclaration | ts.InterfaceDeclaration | ts.TypeAliasDeclaration;
}

// #endregion

// #region Helpers

const NUMBER_TO_WORD: Record<string, string> = {
    "0": "Zero",
    "1": "One",
    "2": "Two",
    "3": "Three",
    "4": "Four",
    "5": "Five",
    "6": "Six",
    "7": "Seven",
    "8": "Eight",
    "9": "Nine",
};

const NAME_OVERRIDES: Record<string, string> = {
    CCColorOptions: "ColorControlColorOptions",
    CCDirection: "ColorControlDirection",
    CCMoveMode: "ColorControlMoveMode",
    CCStepMode: "ColorControlStepMode",
    CCColorLoopDirection: "ColorControlColorLoopDirection",
};

/**
 * Converts a string to PascalCase.
 * Handles various delimiters like spaces, hyphens, and underscores.
 * Sanitizes names that start with a number.
 * @param str The input string.
 * @returns The PascalCased string.
 */
function pascalCase(str: string): string {
    if (!str) {
        return "";
    }

    let sanitized = str.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[^0-9a-zA-Z]/g, " ");
    const firstChar = sanitized.charAt(0);

    if (NUMBER_TO_WORD[firstChar]) {
        sanitized = `${NUMBER_TO_WORD[firstChar]}${sanitized.slice(1)}`;
    }

    return sanitized
        .trim()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("");
}

/** Only uppercase first char after sanitized */
function simplePascalCase(str: string): string {
    if (!str) {
        return "";
    }

    const override = NAME_OVERRIDES[str];

    if (override) {
        return override;
    }

    const sanitized = str.replace(/[^0-9a-zA-Z]/g, "");

    return `${sanitized.charAt(0).toUpperCase()}${sanitized.slice(1)}`;
}

/**
 * Converts a string to camelCase.
 * @param str The input string.
 * @returns The camelCased string.
 */
function camelCase(str: string): string {
    if (!str) {
        return "";
    }

    const pascal = simplePascalCase(str);

    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Converts a hex or decimal string to a 0x-prefixed hex string.
 * @param value The input string (e.g., "01", "ff", "255").
 * @param pad4 If true pad to 4-digit instead of 2.
 * @returns The formatted hex string (e.g., "0x01", "0xFF").
 */
function toHex(value: string, pad4 = false): string {
    if (!value) {
        return "0x00";
    }

    const num = Number.parseInt(value, 16);

    if (Number.isNaN(num)) {
        return "0x00";
    }

    return `0x${num.toString(16).padStart(pad4 ? 4 : 2, "0")}`;
}

// #endregion

// #region XML Parsing and Type Collection

async function collectAllTypes(startFile: string): Promise<ParsedXMLTypeType[]> {
    const allTypes: ParsedXMLTypeType[] = [];
    const visitedFiles = new Set<string>();
    const filesToProcess: string[] = [startFile];

    while (filesToProcess.length > 0) {
        const currentFile = filesToProcess.shift();

        if (!currentFile || visitedFiles.has(currentFile)) {
            continue;
        }

        visitedFiles.add(currentFile);

        try {
            const xmlContent = await fs.readFile(currentFile, "utf-8");
            const parsed = (await parseStringPromise(xmlContent, {
                explicitArray: true,
                mergeAttrs: false,
                explicitRoot: true,
            })) as XMLRoot;
            const libraries = parsed["zcl:library"];
            const clusters = parsed["zcl:cluster"];

            if (libraries) {
                for (const lib of Array.isArray(libraries) ? libraries : [libraries]) {
                    if (lib["type:type"]) {
                        allTypes.push(...lib["type:type"]);
                    }

                    if (lib["xi:include"]) {
                        const baseDir = path.dirname(currentFile);

                        for (const include of lib["xi:include"]) {
                            if (include.$.href && include.$.parse === "xml") {
                                filesToProcess.push(path.resolve(baseDir, include.$.href));
                            }
                        }
                    }
                }
            }

            const createSyntheticType = (
                clusterName: string,
                name: string,
                parent: XMLAttr<{type: string}> & {restriction?: XMLRestriction[]; bitmap?: XMLBitmapDefinition[]},
            ): ParsedXMLTypeType | undefined => {
                if (parent.restriction || parent.bitmap) {
                    return {
                        // biome-ignore lint/style/useNamingConvention: API
                        $: {id: "", name: name, short: name, inheritsFrom: parent.$.type},
                        clusterName: clusterName,
                        restriction: parent.restriction,
                        bitmap: parent.bitmap,
                    };
                }

                return undefined;
            };

            if (clusters) {
                for (const cluster of Array.isArray(clusters) ? clusters : [clusters]) {
                    if (cluster["type:type"]) {
                        for (const type of cluster["type:type"]) {
                            allTypes.push({...type, clusterName: cluster.$.name});
                        }
                    }

                    const processSide = (side: XMLClusterSide | undefined) => {
                        if (!side) {
                            return;
                        }

                        if (side.attributes) {
                            for (const attr of side.attributes[0].attribute) {
                                const synthetic = createSyntheticType(cluster.$.name, attr.$.name, attr);

                                if (synthetic) {
                                    allTypes.push(synthetic);
                                }
                            }
                        }

                        if (side.commands) {
                            for (const cmd of side.commands[0].command) {
                                if (cmd.fields) {
                                    for (const field of cmd.fields[0].field) {
                                        const synthetic = createSyntheticType(cluster.$.name, field.$.name, field);

                                        if (synthetic) {
                                            allTypes.push(synthetic);
                                        }
                                    }
                                }
                            }
                        }
                    };

                    if (cluster.server) {
                        processSide(cluster.server[0]);
                    }

                    if (cluster.client) {
                        processSide(cluster.client[0]);
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing file ${currentFile}:`, error);
        }
    }

    return allTypes;
}

class TypeResolver {
    #typesByShort = new Map<string, ParsedXMLTypeType>();

    add(types: ParsedXMLTypeType[]): void {
        for (const type of types) {
            const short = type.$.short.toLowerCase();

            if (!this.#typesByShort.has(short)) {
                this.#typesByShort.set(short, type);
            }
        }
    }

    resolve(short: string, factory: ts.NodeFactory): ts.TypeNode {
        const type = this.#typesByShort.get(short.toLowerCase());

        if (type?.$.inheritsFrom) {
            return this.resolve(type.$.inheritsFrom, factory);
        }

        switch (short.toLowerCase()) {
            case "data8":
            case "data16":
            case "data24":
            case "data32":
            case "data40":
            case "data48":
            case "data56":
            case "data64":
            case "bool":
            case "map8":
            case "map16":
            case "map24":
            case "map32":
            case "map40":
            case "map48":
            case "map56":
            case "map64":
            case "uint8":
            case "uint16":
            case "uint24":
            case "uint32":
            case "uint40":
            case "uint48":
            case "uint56":
            case "uint64":
            case "int8":
            case "int16":
            case "int24":
            case "int32":
            case "int40":
            case "int48":
            case "int56":
            case "int64":
            case "enum8":
            case "enum16":
            case "semi":
            case "single":
            case "double":
            case "utc":
            case "clusterid":
            case "attribid":
            case "bacoid":
                return factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);

            case "octstr":
            case "string":
            case "octstr16":
            case "string16":
                return factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);

            case "array":
            case "set":
            case "bag":
                return factory.createArrayTypeNode(factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword));

            case "eui64":
                return factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
            case "key128":
                return factory.createTypeReferenceNode("Buffer");

            default:
                if (type) {
                    return factory.createTypeReferenceNode(simplePascalCase(type.$.short));
                }

                return factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
        }
    }
}

// #endregion

// #region AST Generation

function addComments(_factory: ts.NodeFactory, node: ts.Node, type: ParsedXMLTypeType, noType = false): void {
    const comments: string[] = [];

    if (type.clusterName) {
        comments.push(`@cluster ${type.clusterName}`);
    }

    if (type.$.inheritsFrom && !noType) {
        comments.push(`@type ${type.$.inheritsFrom}`);
    }

    if (comments.length > 0) {
        const commentText = `*\n * ${comments.join("\n * ")}\n `;

        ts.addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, commentText, true);
    }
}

function createEnumFromEnumeration(factory: ts.NodeFactory, type: ParsedXMLTypeType, enumerations: XMLEnumeration[]): ts.EnumDeclaration {
    const memberNames = new Map<string, number>();
    const members: ts.EnumMember[] = [];

    for (const e of enumerations) {
        let memberName = pascalCase(e.$.name);
        const count = memberNames.get(memberName);

        if (count !== undefined) {
            memberNames.set(memberName, count + 1);

            memberName = `${memberName}${count + 1}`;
        } else {
            memberNames.set(memberName, 1);
        }

        const memberValue = factory.createNumericLiteral(toHex(e.$.value, type.$.inheritsFrom?.endsWith("16")));

        members.push(factory.createEnumMember(memberName, memberValue));
    }

    const enumDeclaration = factory.createEnumDeclaration(
        [factory.createToken(ts.SyntaxKind.ExportKeyword)],
        simplePascalCase(type.$.short),
        members,
    );

    addComments(factory, enumDeclaration, type);

    return enumDeclaration;
}

function createEnumFromBitmap(factory: ts.NodeFactory, type: ParsedXMLTypeType, bitmap: XMLBitmapDefinition, shiftRight = false): ts.EnumDeclaration {
    const memberNames = new Map<string, number>();
    const members: ts.EnumMember[] = [];

    for (const e of bitmap.element) {
        if (shiftRight && !e.$.shiftRight) {
            continue;
        }

        let memberName = pascalCase(e.$.name);
        const count = memberNames.get(memberName);

        if (count !== undefined) {
            memberNames.set(memberName, count + 1);

            memberName = `${memberName}${count + 1}`;
        } else {
            memberNames.set(memberName, 1);
        }

        const memberValue = factory.createNumericLiteral(
            // biome-ignore lint/style/noNonNullAssertion: valid from top of loop
            toHex(shiftRight ? e.$.shiftRight! : e.$.mask, !shiftRight && type.$.inheritsFrom?.endsWith("16")),
        );

        members.push(factory.createEnumMember(memberName, memberValue));
    }

    const enumDeclaration = factory.createEnumDeclaration(
        [factory.createToken(ts.SyntaxKind.ExportKeyword)],
        simplePascalCase(
            shiftRight
                ? type.$.short.endsWith("ShiftRight")
                    ? type.$.short
                    : `${type.$.short.endsWith("Mask") ? type.$.short.slice(0, -4) : type.$.short}ShiftRight`
                : type.$.short.endsWith("Mask")
                  ? type.$.short
                  : `${type.$.short}Mask`,
        ),
        members,
    );

    addComments(factory, enumDeclaration, type, shiftRight);

    return enumDeclaration;
}

function createInterfaceFromSequence(
    factory: ts.NodeFactory,
    type: ParsedXMLTypeType,
    sequence: XMLSequence,
    resolver: TypeResolver,
): ts.InterfaceDeclaration {
    const memberNames = new Map<string, number>();
    const members: ts.PropertySignature[] = [];

    for (const f of sequence.field) {
        let propertyName = camelCase(f.$.name);
        const count = memberNames.get(propertyName);

        if (count !== undefined) {
            memberNames.set(propertyName, count + 1);

            propertyName = `${propertyName}${count + 1}`;
        } else {
            memberNames.set(propertyName, 1);
        }

        const propertyType = resolver.resolve(f.$.type, factory);

        members.push(factory.createPropertySignature(undefined, propertyName, undefined, propertyType));
    }

    const interfaceDeclaration = factory.createInterfaceDeclaration(
        [factory.createToken(ts.SyntaxKind.ExportKeyword)],
        simplePascalCase(type.$.short),
        undefined,
        undefined,
        members,
    );

    addComments(factory, interfaceDeclaration, type);

    return interfaceDeclaration;
}

function processTypes(factory: ts.NodeFactory, types: ParsedXMLTypeType[], resolver: TypeResolver): ParsedType[] {
    const processed: ParsedType[] = [];
    const processedNames = new Set<string>();

    for (const type of types) {
        const name = simplePascalCase(type.$.short);

        if (processedNames.has(name)) {
            continue;
        }

        const restriction = type.restriction?.[0];
        const bitmap = type.bitmap?.[0];

        if (restriction?.["type:enumeration"]) {
            const createdNode = createEnumFromEnumeration(factory, type, restriction["type:enumeration"]);

            if (createdNode.members.length > 0) {
                processed.push({name, node: createdNode});
                processedNames.add(name);
            }
        } else if (bitmap?.element) {
            const createdNode = createEnumFromBitmap(factory, type, bitmap);

            if (createdNode.members.length > 0) {
                processed.push({name: `${name}Mask`, node: createdNode});
                processedNames.add(name);
            }

            const createdNodeShiftRight = createEnumFromBitmap(factory, type, bitmap, true);

            if (createdNodeShiftRight.members.length > 0) {
                processed.push({name: `${name}ShiftRight`, node: createdNodeShiftRight});
                processedNames.add(name);
            }
        } else if (restriction?.["type:sequence"]) {
            const createdNode = createInterfaceFromSequence(factory, type, restriction["type:sequence"][0], resolver);

            if (createdNode.members.length > 0) {
                processed.push({name, node: createdNode});
                processedNames.add(name);
            }
        }
    }

    return processed;
}

// #endregion

// #region Main

async function main(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.length !== 1) {
        throw new Error("Usage: tsx scripts/zap-update-types.ts <path-to-xml-files>");
    }

    const xmlPath = args[0];
    const libraryFile = path.join(xmlPath, "library.xml");
    const outputFile = "src/zspec/zcl/definition/datatypes.ts";

    console.log(`Starting type generation from ${libraryFile}...`);

    const allTypes = await collectAllTypes(libraryFile);

    if (allTypes.length === 0) {
        console.log("No types found to process.");

        return;
    }

    const resolver = new TypeResolver();

    resolver.add(allTypes);

    const factory = ts.factory;
    const processedTypes = processTypes(factory, allTypes, resolver);
    const nodesToPrint = processedTypes.map((p) => p.node);
    const sourceFile = ts.createSourceFile(outputFile, "", ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
    const printer = ts.createPrinter({newLine: ts.NewLineKind.LineFeed, removeComments: false});
    const content = nodesToPrint.map((node) => printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)).join("\n\n");
    const fileHeader = `/**
 * This file was automatically generated by scripts/zap-update-types.ts. Do NOT edit manually.
 *
 * ZCL data type definitions.
 */\n\n`;

    await fs.writeFile(outputFile, `${fileHeader + content}\n`, "utf8");

    console.log(`Successfully generated ${processedTypes.length} types to ${outputFile}.`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

// #endregion
