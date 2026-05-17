/**
 * Usage:
 *   tsx scripts/clusters-typegen.ts && pnpm run check:w
 */
import {writeFileSync} from "node:fs";
import ts from "typescript";
import {Clusters} from "../src/zspec/zcl/definition/cluster";
import {BuffaloZclDataType, DataType} from "../src/zspec/zcl/definition/enums";
import {Foundation, type FoundationCommandName} from "../src/zspec/zcl/definition/foundation";
import {ManufacturerCode} from "../src/zspec/zcl/definition/manufacturerCode";
import type {Attribute, ClusterName, Command, Parameter} from "../src/zspec/zcl/definition/tstype";

const FILENAME = "clusters-types.ts";

const file = ts.createSourceFile(FILENAME, "", ts.ScriptTarget.ESNext, false, ts.ScriptKind.TS);
const printer = ts.createPrinter({newLine: ts.NewLineKind.LineFeed});

const emptyObject = ts.factory.createTypeReferenceNode("Record", [
    ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
    ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword),
]);

const foundationImport = ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(
        ts.SyntaxKind.TypeKeyword,
        undefined,
        ts.factory.createNamedImports([ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("Foundation"))]),
    ),
    ts.factory.createStringLiteral("./foundation"),
    undefined,
);
const namedImports = ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(
        ts.SyntaxKind.TypeKeyword,
        undefined,
        ts.factory.createNamedImports([
            // sorted by name
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("ExtensionFieldSet")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("Gpd")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("GpdAttributeReporting")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("GpdChannelConfiguration")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("GpdChannelRequest")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("GpdCommissioningReply")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("GpdCustomReply")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("GpdReadAttributeResponse")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("GpdRequestAttribute")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("Struct")),
            // ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("StructuredSelector")), // XXX: currently unused
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("ThermoTransition")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("TuyaDataPointValue")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("ZclArray")),
            // ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("ZclDate")), // XXX: currently unused
            // ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("ZclTimeOfDay")), // XXX: currently unused
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("ZoneInfo")),
        ]),
    ),
    ts.factory.createStringLiteral("./tstype"),
    undefined,
);

const getTypeFromDataType = (dataType: DataType | BuffaloZclDataType): ts.TypeNode => {
    switch (dataType) {
        case DataType.NO_DATA:
        case DataType.UNKNOWN: {
            return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword);
        }
        case DataType.DATA56:
        case DataType.BITMAP56:
        case DataType.UINT56:
        case DataType.DATA64:
        case DataType.BITMAP64:
        case DataType.UINT64:
        case DataType.INT56:
        case DataType.INT64: {
            return ts.factory.createKeywordTypeNode(ts.SyntaxKind.BigIntKeyword);
        }
        case DataType.OCTET_STR:
        case DataType.LONG_OCTET_STR:
        case DataType.SEC_KEY: {
            return ts.factory.createTypeReferenceNode("Buffer");
        }
        case DataType.CHAR_STR:
        case DataType.LONG_CHAR_STR:
        case DataType.IEEE_ADDR: {
            return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
        }
        case DataType.ARRAY:
        case DataType.SET:
        case DataType.BAG: {
            // mismatch on read vs write, have to union
            return ts.factory.createUnionTypeNode([
                ts.factory.createTypeReferenceNode("ZclArray"),
                ts.factory.createArrayTypeNode(ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)),
            ]);
        }
        case DataType.STRUCT: {
            return ts.factory.createTypeReferenceNode("Struct");
        }
        case DataType.TOD: {
            return ts.factory.createTypeReferenceNode("ZclTimeOfDay");
        }
        case DataType.DATE: {
            return ts.factory.createTypeReferenceNode("ZclDate");
        }
        case BuffaloZclDataType.USE_DATA_TYPE: {
            return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
        }
        case BuffaloZclDataType.LIST_UINT8:
        case BuffaloZclDataType.LIST_UINT16:
        case BuffaloZclDataType.LIST_UINT24:
        case BuffaloZclDataType.LIST_UINT32: {
            return ts.factory.createArrayTypeNode(ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword));
        }
        case BuffaloZclDataType.LIST_ZONEINFO: {
            return ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode("ZoneInfo"));
        }
        case BuffaloZclDataType.EXTENSION_FIELD_SETS: {
            return ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode("ExtensionFieldSet"));
        }
        case BuffaloZclDataType.LIST_THERMO_TRANSITIONS: {
            return ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode("ThermoTransition"));
        }
        case BuffaloZclDataType.BUFFER: {
            return ts.factory.createTypeReferenceNode("Buffer");
        }
        case BuffaloZclDataType.GPD_FRAME: {
            return ts.factory.createUnionTypeNode([
                ts.factory.createTypeReferenceNode("Gpd"),
                ts.factory.createTypeReferenceNode("GpdChannelRequest"),
                ts.factory.createTypeReferenceNode("GpdAttributeReporting"),
                ts.factory.createTypeReferenceNode("GpdCommissioningReply"),
                ts.factory.createTypeReferenceNode("GpdChannelConfiguration"),
                ts.factory.createTypeReferenceNode("GpdCustomReply"),
                ts.factory.createTypeReferenceNode("GpdReadAttributeResponse"),
                ts.factory.createTypeReferenceNode("GpdRequestAttribute"),
                ts.factory.createTypeLiteralNode([
                    ts.factory.createPropertySignature(undefined, "raw", undefined, ts.factory.createTypeReferenceNode("Buffer")),
                ]),
                ts.factory.createTypeReferenceNode("Record<string, never>"),
            ]);
        }
        case BuffaloZclDataType.STRUCTURED_SELECTOR: {
            return ts.factory.createTypeReferenceNode("StructuredSelector");
        }
        case BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES: {
            return ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode("TuyaDataPointValue"));
        }
        case BuffaloZclDataType.LIST_MIBOXER_ZONES: {
            return ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode("MiboxerZone"));
        }
        default: {
            return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
        }
    }
};

const getPropertyStr = (key: string, val: unknown, padId = 4) => {
    let valStr = `${val}`;

    if (key === "ID") {
        valStr = `0x${Number(val).toString(16).padStart(padId, "0")}`;
    } else if (key === "type") {
        valStr = `${DataType[val as number] ?? BuffaloZclDataType[val as number]}`;
    } else if (key === "manufacturerCode") {
        valStr = `${ManufacturerCode[val as number]}(0x${Number(val).toString(16).padStart(4, "0")})`;
    }

    return valStr;
};

const getConditionStr = (conditions: Parameter["conditions"]): string | undefined => {
    if (conditions) {
        let str = "conditions=[";

        for (const condition of conditions) {
            str += `{${condition.type}`;

            for (const key in condition) {
                if (key === "type") {
                    continue;
                }

                str += ` ${key}=${condition[key as keyof typeof condition]}`;
            }

            str += "}";
        }

        return `${str}]`;
    }
};

const addAttributes = (attributes: Readonly<Record<string, Readonly<Attribute>>>): ts.TypeNode => {
    const elements: ts.PropertySignature[] = [];

    for (const attributeName in attributes) {
        const attribute = attributes[attributeName];

        const element = ts.factory.createPropertySignature(
            undefined,
            attributeName,
            // always optional if manuf-specific
            attribute.manufacturerCode ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
            getTypeFromDataType(attribute.type),
        );

        elements.push(element);

        const commentChunks: string[] = [];

        for (const key in attribute) {
            if (key === "name") {
                continue;
            }

            commentChunks.push(`${key}=${getPropertyStr(key, attribute[key as keyof typeof attribute], 4)}`);
        }

        const comment = `* ${commentChunks.join(" | ")} `;

        ts.addSyntheticLeadingComment(element, ts.SyntaxKind.MultiLineCommentTrivia, comment, true);
    }

    return elements.length > 0 ? ts.factory.createTypeLiteralNode(elements) : ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword);
};

const addCommands = (commands: Readonly<Record<string, Readonly<Command>>>): ts.TypeNode => {
    const elements: ts.PropertySignature[] = [];

    for (const commandName in commands) {
        const command = commands[commandName];
        const cmdElements: ts.PropertySignature[] = [];

        for (const parameter of command.parameters) {
            // @ts-expect-error bad typing?
            const existing = cmdElements.find((element) => element.name.escapedText === parameter.name);
            const paramType = getTypeFromDataType(parameter.type);

            if (!existing) {
                const cmdElement = ts.factory.createPropertySignature(
                    undefined,
                    parameter.name,
                    parameter.conditions ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
                    paramType,
                );

                const conditionComment = getConditionStr(parameter.conditions);
                const commentChunks: string[] = [];

                for (const key in parameter) {
                    if (key === "name" || key === "conditions") {
                        continue;
                    }

                    commentChunks.push(`${key}=${getPropertyStr(key, parameter[key as keyof typeof parameter])}`);
                }

                const comment = `* ${commentChunks.join(" | ")}${conditionComment ? ` | ${conditionComment}` : ""} `;

                cmdElements.push(cmdElement);
                ts.addSyntheticLeadingComment(cmdElement, ts.SyntaxKind.MultiLineCommentTrivia, comment, true);
            } else if (
                // @ts-expect-error bad typing?
                existing.type?.typeName?.escapedText &&
                // @ts-expect-error bad typing?
                paramType.typeName?.escapedText &&
                // @ts-expect-error bad typing?
                existing.type.typeName.escapedText !== paramType.typeName.escapedText
            ) {
                // XXX: not currently used, untested
                ts.factory.updatePropertySignature(
                    existing,
                    existing.modifiers,
                    existing.name,
                    existing.questionToken,
                    ts.factory.createUnionTypeNode([existing.type, paramType]),
                );
            } else if (!parameter.conditions) {
                throw new Error(`Two or more cluster command parameters have identical name without conditions. ${JSON.stringify(parameter)}`);
            }
        }

        const element = ts.factory.createPropertySignature(
            undefined,
            commandName,
            undefined,
            cmdElements.length > 0 ? ts.factory.createTypeLiteralNode(cmdElements) : emptyObject,
        );

        elements.push(element);

        const commentChunks: string[] = [];

        for (const key in command) {
            if (key === "name" || key === "parameters") {
                continue;
            }

            commentChunks.push(`${key}=${getPropertyStr(key, command[key as keyof typeof command], 2)}`);
        }

        const comment = `* ${commentChunks.join(" | ")} `;

        ts.addSyntheticLeadingComment(element, ts.SyntaxKind.MultiLineCommentTrivia, comment, true);
    }

    return elements.length > 0 ? ts.factory.createTypeLiteralNode(elements) : ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword);
};

const clusterElements: ts.TypeElement[] = [];

for (const clusterName in Clusters) {
    const cluster = Clusters[clusterName as ClusterName];

    const attributesProp = ts.factory.createPropertySignature(undefined, "attributes", undefined, addAttributes(cluster.attributes));
    const commandsProp = ts.factory.createPropertySignature(undefined, "commands", undefined, addCommands(cluster.commands));
    const commandResponsesProp = ts.factory.createPropertySignature(undefined, "commandResponses", undefined, addCommands(cluster.commandsResponse));

    clusterElements.push(
        ts.factory.createPropertySignature(
            undefined,
            clusterName,
            undefined,
            ts.factory.createTypeLiteralNode([attributesProp, commandsProp, commandResponsesProp]),
        ),
    );
}

const clustersDecl = ts.factory.createInterfaceDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    "TClusters",
    undefined,
    undefined,
    clusterElements,
);

const foundationElements: ts.TypeElement[] = [];

for (const foundationName in Foundation) {
    const foundation = Foundation[foundationName as FoundationCommandName];
    const typeQuery = ts.factory.createTypeQueryNode(
        ts.factory.createQualifiedName(
            ts.factory.createQualifiedName(ts.factory.createIdentifier("Foundation"), ts.factory.createIdentifier(foundationName)),
            ts.factory.createIdentifier("parse"),
        ),
    );
    const element = ts.factory.createPropertySignature(
        undefined,
        foundationName,
        undefined,
        ts.factory.createTypeReferenceNode("ReturnType", [typeQuery]),
    );

    foundationElements.push(element);
    ts.addSyntheticLeadingComment(element, ts.SyntaxKind.MultiLineCommentTrivia, `* ID: ${foundation.ID} `, true);
}

const foundationDecl = ts.factory.createInterfaceDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    "TFoundation",
    undefined,
    undefined,
    foundationElements,
);

const clDecl = ts.factory.createTypeParameterDeclaration(
    undefined,
    "Cl",
    ts.factory.createUnionTypeNode([
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
    ]),
);
const coDecl = ts.factory.createTypeParameterDeclaration(
    undefined,
    "Co",
    ts.factory.createUnionTypeNode([
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
    ]),
);
const clusterAttributeKeysDecl = ts.factory.createTypeAliasDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    "TClusterAttributeKeys",
    [clDecl],
    ts.factory.createTypeReferenceNode(
        `Cl extends keyof ${clustersDecl.name.escapedText} ? (keyof ${clustersDecl.name.escapedText}[Cl]["attributes"])[] : (string | number)[];`,
    ),
);
const clusterAttributesDecl = ts.factory.createTypeAliasDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    "TClusterAttributes",
    [clDecl],
    ts.factory.createTypeReferenceNode(
        `Cl extends keyof ${clustersDecl.name.escapedText} ? ${clustersDecl.name.escapedText}[Cl]["attributes"] : never`,
    ),
);
const partialClusterAttributesDecl = ts.factory.createTypeAliasDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    "TPartialClusterAttributes",
    [clDecl],
    ts.factory.createTypeReferenceNode(
        `Cl extends keyof ${clustersDecl.name.escapedText} ? Partial<${clustersDecl.name.escapedText}[Cl]["attributes"]> : never`,
    ),
);
const clusterCommandKeysDecl = ts.factory.createTypeAliasDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    "TClusterCommandKeys",
    [clDecl],
    ts.factory.createTypeReferenceNode(
        `Cl extends keyof ${clustersDecl.name.escapedText} ? (keyof ${clustersDecl.name.escapedText}[Cl]["commands"])[] : (string | number)[];`,
    ),
);
const clusterCommandResponseKeysDecl = ts.factory.createTypeAliasDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    "TClusterCommandResponseKeys",
    [clDecl],
    ts.factory.createTypeReferenceNode(
        `Cl extends keyof ${clustersDecl.name.escapedText} ? (keyof ${clustersDecl.name.escapedText}[Cl]["commandResponses"])[] : (string | number)[];`,
    ),
);
const clusterCommandsDecl = ts.factory.createTypeAliasDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    "TClusterCommands",
    [clDecl],
    ts.factory.createTypeReferenceNode(
        `Cl extends keyof ${clustersDecl.name.escapedText} ? ${clustersDecl.name.escapedText}[Cl]["commands"] : never`,
    ),
);
const clusterCommandResponsesDecl = ts.factory.createTypeAliasDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    "TClusterCommandResponses",
    [clDecl],
    ts.factory.createTypeReferenceNode(
        `Cl extends keyof ${clustersDecl.name.escapedText} ? ${clustersDecl.name.escapedText}[Cl]["commandResponses"] : never`,
    ),
);
const clusterCommandPayloadDecl = ts.factory.createTypeAliasDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    "TClusterCommandPayload",
    [clDecl, coDecl],
    ts.factory.createTypeReferenceNode(
        `Cl extends keyof ${clustersDecl.name.escapedText} ? Co extends keyof ${clustersDecl.name.escapedText}[Cl]["commands"] ? ${clustersDecl.name.escapedText}[Cl]["commands"][Co] : never : never;`,
    ),
);
const clusterCommandResponsePayloadDecl = ts.factory.createTypeAliasDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    "TClusterCommandResponsePayload",
    [clDecl, coDecl],
    ts.factory.createTypeReferenceNode(
        `Cl extends keyof ${clustersDecl.name.escapedText} ? Co extends keyof ${clustersDecl.name.escapedText}[Cl]["commandResponses"] ? ${clustersDecl.name.escapedText}[Cl]["commandResponses"][Co] : never : never;`,
    ),
);
const clusterPayloadDecl = ts.factory.createTypeAliasDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    "TClusterPayload",
    [clDecl, coDecl],
    ts.factory.createTypeReferenceNode(
        `Cl extends keyof ${clustersDecl.name.escapedText} ? ${clustersDecl.name.escapedText}[Cl]["commands"] extends never ? ${clustersDecl.name.escapedText}[Cl]["commandResponses"] extends never ? never : Co extends keyof ${clustersDecl.name.escapedText}[Cl]["commandResponses"] ? ${clustersDecl.name.escapedText}[Cl]["commandResponses"][Co] : never : Co extends keyof ${clustersDecl.name.escapedText}[Cl]["commands"] ? ${clustersDecl.name.escapedText}[Cl]["commands"][Co] : Co extends keyof ${clustersDecl.name.escapedText}[Cl]["commandResponses"] ? ${clustersDecl.name.escapedText}[Cl]["commandResponses"][Co] : never : never;`,
    ),
);
const foundationGenericPayloadDecl = ts.factory.createTypeAliasDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    "TFoundationGenericPayload",
    undefined,
    ts.factory.createTypeReferenceNode(`${foundationDecl.name.escapedText}[keyof ${foundationDecl.name.escapedText}]`),
);
const foundationPayloadDecl = ts.factory.createTypeAliasDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    "TFoundationPayload",
    [coDecl],
    ts.factory.createTypeReferenceNode(
        `Co extends keyof ${foundationDecl.name.escapedText} ? ${foundationDecl.name.escapedText}[Co] : ${foundationGenericPayloadDecl.name.escapedText}`,
    ),
);

const result = `${printer.printNode(ts.EmitHint.Unspecified, foundationImport, file)}
${printer.printNode(ts.EmitHint.Unspecified, namedImports, file)}

${printer.printNode(ts.EmitHint.Unspecified, clustersDecl, file)}

${printer.printNode(ts.EmitHint.Unspecified, foundationDecl, file)}

// Clusters
${printer.printNode(ts.EmitHint.Unspecified, clusterAttributeKeysDecl, file)}

${printer.printNode(ts.EmitHint.Unspecified, clusterAttributesDecl, file)}

${printer.printNode(ts.EmitHint.Unspecified, partialClusterAttributesDecl, file)}

${printer.printNode(ts.EmitHint.Unspecified, clusterCommandKeysDecl, file)}

${printer.printNode(ts.EmitHint.Unspecified, clusterCommandResponseKeysDecl, file)}

${printer.printNode(ts.EmitHint.Unspecified, clusterCommandsDecl, file)}

${printer.printNode(ts.EmitHint.Unspecified, clusterCommandResponsesDecl, file)}

${printer.printNode(ts.EmitHint.Unspecified, clusterCommandPayloadDecl, file)}

${printer.printNode(ts.EmitHint.Unspecified, clusterCommandResponsePayloadDecl, file)}

${printer.printNode(ts.EmitHint.Unspecified, clusterPayloadDecl, file)}

// Foundation
${printer.printNode(ts.EmitHint.Unspecified, foundationGenericPayloadDecl, file)}

${printer.printNode(ts.EmitHint.Unspecified, foundationPayloadDecl, file)}
`;

writeFileSync(`./src/zspec/zcl/definition/${FILENAME}`, result, {encoding: "utf8"});
