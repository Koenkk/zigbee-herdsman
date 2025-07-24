/* v8 ignore start */
/**
 * How to run:
 * ```bash
 * npm i -g ts-node
 * ts-node ./src/zspec/zcl/definition/clusters-typegen.ts
 * ```
 * or with compiled:
 * ```bash
 * pnpm run prepack
 * node ./dist/zspec/zcl/definition/clusters-typegen.js
 * ```
 */
import {writeFileSync} from "node:fs";
import ts from "typescript";
import {Clusters} from "./cluster";
import {BuffaloZclDataType, DataType} from "./enums";
import {Foundation, type FoundationCommandName, type FoundationDefinition} from "./foundation";
import {ManufacturerCode} from "./manufacturerCode";
import type {AttributeDefinition, ClusterName, CommandDefinition} from "./tstype";

const FILENAME = "clusters-types.ts";

const file = ts.createSourceFile(FILENAME, "", ts.ScriptTarget.ES2022, false, ts.ScriptKind.TS);
const printer = ts.createPrinter({newLine: ts.NewLineKind.LineFeed});

const emptyObject = ts.factory.createTypeReferenceNode("Record", [
    ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
    ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword),
]);

const namedImports = ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(
        true,
        undefined,
        ts.factory.createNamedImports([
            // sorted by name
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("ExtensionFieldSet")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("GPDAttributeReport")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("GPDChannelRequest")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("Gpd")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("MiboxerZone")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("Struct")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("StructuredSelector")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("ThermoTransition")),
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("TuyaDataPointValue")),
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
            return ts.factory.createArrayTypeNode(ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword));
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
                ts.factory.createTypeReferenceNode("GPDChannelRequest"),
                ts.factory.createTypeReferenceNode("GPDAttributeReport"),
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

const addAttributes = (attributes: Readonly<Record<string, Readonly<AttributeDefinition>>>): ts.TypeNode => {
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
        // elements.push(
        //     ts.factory.createPropertySignature(
        //         undefined,
        //         attribute.ID.toString(),
        //         // always optional if manuf-specific
        //         attribute.manufacturerCode ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
        //         getTypeFromDataType(attribute.type),
        //     ),
        // );

        let comment = `* ID: ${attribute.ID} | Type: ${DataType[attribute.type] ?? BuffaloZclDataType[attribute.type]} `;

        if (attribute.manufacturerCode !== undefined) {
            comment += `| Specific to manufacturer: ${ManufacturerCode[attribute.manufacturerCode]} (${attribute.manufacturerCode}) `;
        }

        ts.addSyntheticLeadingComment(element, ts.SyntaxKind.MultiLineCommentTrivia, comment, true);
    }

    return elements.length > 0 ? ts.factory.createTypeLiteralNode(elements) : emptyObject;
};

const addCommands = (commands: Readonly<Record<string, Readonly<CommandDefinition>>>): ts.TypeNode => {
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

                cmdElements.push(cmdElement);
                ts.addSyntheticLeadingComment(
                    cmdElement,
                    ts.SyntaxKind.MultiLineCommentTrivia,
                    `* Type: ${DataType[parameter.type] ?? BuffaloZclDataType[parameter.type]} `,
                    true,
                );
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
        // elements.push(
        //     ts.factory.createPropertySignature(
        //         undefined,
        //         command.ID.toString(),
        //         undefined,
        //         cmdElements.length > 0 ? ts.factory.createTypeLiteralNode(cmdElements) : emptyObject,
        //     ),
        // );

        let comment = `* ID: ${command.ID} `;

        if (command.response !== undefined) {
            comment += `| Response ID: ${command.response} `;
        }

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

const addParameters = (foundation: Readonly<FoundationDefinition>): ts.TypeNode => {
    const elements: ts.PropertySignature[] = [];

    for (const parameter of foundation.parameters) {
        const element = ts.factory.createPropertySignature(undefined, parameter.name, undefined, getTypeFromDataType(parameter.type));

        elements.push(element);

        ts.addSyntheticLeadingComment(
            element,
            ts.SyntaxKind.MultiLineCommentTrivia,
            `* Type: ${DataType[parameter.type] ?? BuffaloZclDataType[parameter.type]} `,
            true,
        );
    }

    if (elements.length === 0) {
        return emptyObject;
    }

    switch (foundation.parseStrategy) {
        case "oneof": {
            const discComplete = ts.factory.createPropertySignature(
                undefined,
                "discComplete",
                undefined,
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
            );

            ts.addSyntheticLeadingComment(discComplete, ts.SyntaxKind.MultiLineCommentTrivia, `* Type: ${DataType[DataType.UINT8]} `, true);

            return ts.factory.createTypeLiteralNode([
                discComplete,
                ts.factory.createPropertySignature(
                    undefined,
                    "attrInfos",
                    undefined,
                    ts.factory.createArrayTypeNode(ts.factory.createTypeLiteralNode(elements)),
                ),
            ]);
        }
        case "flat": {
            return ts.factory.createTypeLiteralNode(elements);
        }
        case "repetitive": {
            return ts.factory.createArrayTypeNode(ts.factory.createTypeLiteralNode(elements));
        }
    }
};

const foundationElements: ts.TypeElement[] = [];

for (const foundationName in Foundation) {
    const foundation = Foundation[foundationName as FoundationCommandName];
    const element = ts.factory.createPropertySignature(undefined, foundationName, undefined, addParameters(foundation));

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

const result = `${printer.printNode(ts.EmitHint.Unspecified, namedImports, file)}

${printer.printNode(ts.EmitHint.Unspecified, clustersDecl, file)}

${printer.printNode(ts.EmitHint.Unspecified, foundationDecl, file)}
`;

writeFileSync(`./src/zspec/zcl/definition/${FILENAME}`, result, {encoding: "utf8"});
