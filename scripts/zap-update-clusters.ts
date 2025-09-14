/**
 * Script: Update cluster.ts with data from ZCL XML files.
 *
 * Goals:
 *  - Parse XML cluster definition files (Basic.xml, Time.xml, ElectricalMeasurement.xml, etc.)
 *  - Respect XSD-described structure (cluster.xsd, type.xsd)
 *  - Map <type:type> definitions (with inheritsFrom chains) to base ZCL primitive types
 *  - Merge new attributes/commands into existing cluster definitions in src/zspec/zcl/definition/cluster.ts
 *  - Do NOT overwrite existing attributes (comparison by numeric ID)
 *  - Do NOT overwrite existing command parameters at existing indices (only append missing tail params)
 *  - Add missing commands (decide placement: commands vs commandsResponse)
 *  - Preserve existing formatting of cluster.ts as much as possible
 *
 * Requirements:
 *   pnpm i xml2js @types/xml2js
 *
 * Usage:
 *    tsx scripts/zap-update-clusters.ts ../zap/zcl-builtin/dotdot
 */

import {promises as fs} from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";
import {parseStringPromise} from "xml2js";
// biome-ignore lint/correctness/noUnusedImports: reference names (not executed in script context, but helps validation if compiled in-project)
import {BuffaloZclDataType, DataType} from "../src/zspec/zcl/definition/enums.js";
import {fuzzyMatch} from "./utils.js";
import {applyXmlOverrides, parseOverrides} from "./zap-xml-clusters-overrides.js";

/* ------------------------------------------------------------------------------------------------
 * XML Type Definitions
 * ----------------------------------------------------------------------------------------------*/
export interface XMLAttr<T> {
    // biome-ignore lint/style/useNamingConvention: API
    $: T;
}

interface XMLClusterRoot {
    "zcl:cluster"?: XMLCluster | XMLCluster[];
    "zcl:derivedCluster"?: XMLDerivedCluster | XMLDerivedCluster[];
    "zcl:library"?: XMLLibrary | XMLLibrary[];
}

interface XMLLibrary {
    "xi:include"?: XMLAttr<{href: string; parse?: string}>[];
    "type:type"?: XMLTypeType[];
}

export interface XMLCluster
    extends XMLAttr<{
        id: string;
        revision: string;
        name: string;
        manufacturer?: string;
    }> {
    classification: XMLAttr<{role?: string; picsCode: string; primaryTransaction?: string}>[];
    server?: XMLClusterSide[];
    client?: XMLClusterSide[];
    "type:type"?: XMLTypeType[];
}

interface XMLDerivedCluster extends XMLCluster {
    // biome-ignore lint/style/useNamingConvention: API
    $: {
        inheritsFrom: string;
    } & XMLCluster["$"];
}

interface XMLClusterSide {
    attributes?: {attribute: XMLAttributeDefinition[]}[];
    commands?: {command: XMLCommandDefinition[]}[];
}

export interface XMLRestriction {
    "type:length"?: XMLAttr<{value: string}>[];
    "type:minLength"?: XMLAttr<{value: string}>[];
    "type:maxLength"?: XMLAttr<{value: string}>[];
    "type:minExclusive"?: XMLAttr<{value: string}>[];
    "type:minInclusive"?: XMLAttr<{value: string}>[];
    "type:maxExclusive"?: XMLAttr<{value: string}>[];
    "type:maxInclusive"?: XMLAttr<{value: string}>[];
    /** only used for `type:type` (data type non-value) */
    "type:invalid"?: XMLAttr<{value: string}>[];
    "type:minInclusiveRef"?: XMLAttr<{ref: string}>[];
    "type:minExclusiveRef"?: XMLAttr<{ref: string}>[];
    "type:maxInclusiveRef"?: XMLAttr<{ref: string}>[];
    "type:maxExclusiveRef"?: XMLAttr<{ref: string}>[];
    "type:special"?: XMLAttr<{name: string; value: string}>[];
}

export interface XMLAttributeDefinition
    extends XMLAttr<{
        id: string;
        name: string;
        type: string;
        readable?: string; // default="true"
        writable?: string; // default="false"
        writeOptional?: string; // default="false"
        writableIf?: string; // DependencyExpression
        reportRequired?: string; // default="false"
        sceneRequired?: string; // default="false"
        required?: string; // default="false"
        requiredIf?: string; // DependencyExpression
        min?: string; // default="0"
        max?: string;
        default?: string;
        defaultRef?: string; // NamedElement
        deprecated?: string; // default="false"
    }> {
    restriction?: XMLRestriction[];
    bitmap?: unknown[];
}

export interface XMLCommandDefinition
    extends XMLAttr<{
        id: string;
        name: string;
        required?: string; // default="false"
        requiredIf?: string; // DependencyExpression
        deprecated?: string; // default="false"
    }> {
    fields?: {field: XMLFieldDefinition[]}[];
}

export interface XMLFieldDefinition
    extends XMLAttr<{
        name: string;
        type: string;
        array?: string;
        arrayLengthSize?: string;
        arrayLengthField?: string;
        presentIf?: string;
        deprecated?: string;
    }> {
    restriction?: XMLRestriction[];
    bitmap?: unknown[];
}

interface XMLTypeType
    extends XMLAttr<{
        id: string;
        name: string;
        short: string;
        inheritsFrom?: string;
        discrete?: string;
    }> {
    restriction?: XMLRestriction[];
    bitmap?: unknown[];
}

/* ------------------------------------------------------------------------------------------------
 * Library / XML loading
 * ----------------------------------------------------------------------------------------------*/
async function collectFromLibrary(libraryFile: string): Promise<{includeFiles: string[]; libraryTypes: XMLTypeType[]}> {
    const txt = await fs.readFile(libraryFile, "utf8");

    const parsed = (await parseStringPromise(txt, {
        explicitArray: true,
        preserveChildrenOrder: true,
        mergeAttrs: false,
        explicitRoot: true,
    })) as XMLClusterRoot;

    const includeFiles: string[] = [];
    const libraryTypes: XMLTypeType[] = [];
    const libs = parsed["zcl:library"];

    if (libs) {
        const libsArray = Array.isArray(libs) ? libs : [libs];

        for (const lib of libsArray) {
            if (lib["type:type"]) {
                for (const t of lib["type:type"]) {
                    libraryTypes.push(t);
                }
            }

            if (lib["xi:include"]) {
                const baseDir = path.dirname(libraryFile);

                for (const inc of lib["xi:include"]) {
                    const parse = inc.$.parse;
                    const href = inc.$.href;

                    if (parse === "xml" && href.toLowerCase().endsWith(".xml")) {
                        const full = path.resolve(baseDir, href);
                        includeFiles.push(full);
                    }
                }
            }
        }
    }

    return {includeFiles, libraryTypes};
}

async function parseXMLCluster(file: string): Promise<XMLCluster[]> {
    const text = await fs.readFile(file, "utf8");

    const parsed = (await parseStringPromise(text, {
        explicitArray: true,
        preserveChildrenOrder: true,
        mergeAttrs: false,
        explicitRoot: true,
    })) as XMLClusterRoot;

    const clusters: XMLCluster[] = [];
    const baseClusters = parsed["zcl:cluster"];
    const derivedClusters = parsed["zcl:derivedCluster"];

    if (baseClusters) {
        const baseClustersArray = Array.isArray(baseClusters) ? baseClusters : [baseClusters];
        clusters.push(...baseClustersArray);
    }

    if (derivedClusters) {
        const derivedClustersArray = Array.isArray(derivedClusters) ? derivedClusters : [derivedClusters];
        clusters.push(...derivedClustersArray);
    }

    return clusters;
}

/* ------------------------------------------------------------------------------------------------
 * Type resolution
 * ----------------------------------------------------------------------------------------------*/
class TypeResolver {
    #map: Map<string, string | undefined /* inheritsFrom */>;
    #parent?: TypeResolver;

    constructor(parent?: TypeResolver) {
        this.#map = new Map();
        this.#parent = parent;
    }

    add(types: XMLTypeType[] | undefined): void {
        if (!types) {
            return;
        }

        for (const t of types) {
            const short = t.$.short.trim().toLowerCase();
            const inheritsFrom = t.$.inheritsFrom ? t.$.inheritsFrom.trim().toLowerCase() : undefined;

            if (!this.#map.has(short)) {
                this.#map.set(short, inheritsFrom);
            }
        }
    }

    resolve(short: string): string {
        if (this.#map.has(short)) {
            return this.#map.get(short) ?? short;
        }

        return this.#parent?.resolve(short) ?? "unk";
    }
}

/* ------------------------------------------------------------------------------------------------
 * Mapping types
 * ----------------------------------------------------------------------------------------------*/
function mapZclTypeToDataType(base: string): string {
    const t = base.toLowerCase();

    if (t === "data8") return "DataType.DATA8";
    if (t === "data16") return "DataType.DATA16";
    if (t === "data24") return "DataType.DATA24";
    if (t === "data32") return "DataType.DATA32";
    if (t === "data40") return "DataType.DATA40";
    if (t === "data48") return "DataType.DATA48";
    if (t === "data56") return "DataType.DATA56";
    if (t === "data64") return "DataType.DATA64";

    if (t === "bool") return "DataType.BOOLEAN";

    if (t === "map8") return "DataType.BITMAP8";
    if (t === "map16") return "DataType.BITMAP16";
    if (t === "map24") return "DataType.BITMAP24";
    if (t === "map32") return "DataType.BITMAP32";
    if (t === "map40") return "DataType.BITMAP40";
    if (t === "map48") return "DataType.BITMAP48";
    if (t === "map56") return "DataType.BITMAP56";
    if (t === "map64") return "DataType.BITMAP64";

    if (t === "uint8") return "DataType.UINT8";
    if (t === "uint16") return "DataType.UINT16";
    if (t === "uint24") return "DataType.UINT24";
    if (t === "uint32") return "DataType.UINT32";
    if (t === "uint40") return "DataType.UINT40";
    if (t === "uint48") return "DataType.UINT48";
    if (t === "uint56") return "DataType.UINT56";
    if (t === "uint64") return "DataType.UINT64";

    if (t === "int8") return "DataType.INT8";
    if (t === "int16") return "DataType.INT16";
    if (t === "int24") return "DataType.INT24";
    if (t === "int32") return "DataType.INT32";
    if (t === "int40") return "DataType.INT40";
    if (t === "int48") return "DataType.INT48";
    if (t === "int56") return "DataType.INT56";
    if (t === "int64") return "DataType.INT64";

    if (t === "enum8") return "DataType.ENUM8";
    if (t === "enum16") return "DataType.ENUM16";

    if (t === "semi") return "DataType.SEMI_PREC";
    if (t === "single") return "DataType.SINGLE_PREC";
    if (t === "double") return "DataType.DOUBLE_PREC";

    if (t === "octstr") return "DataType.OCTET_STR";
    if (t === "string") return "DataType.CHAR_STR";
    if (t === "octstr16") return "DataType.LONG_OCTET_STR";
    if (t === "string16") return "DataType.LONG_CHAR_STR";

    if (t === "array") return "DataType.ARRAY";
    if (t === "struct") return "DataType.STRUCT";

    if (t === "set") return "DataType.SET";
    if (t === "bag") return "DataType.BAG";

    if (t === "tod") return "DataType.TOD";
    if (t === "date") return "DataType.DATE";
    if (t === "utc") return "DataType.UTC";

    if (t === "clusterid") return "DataType.CLUSTER_ID";
    if (t === "attribid") return "DataType.ATTR_ID";
    if (t === "bacoid") return "DataType.BAC_OID";

    if (t === "eui64") return "DataType.IEEE_ADDR";
    if (t === "key128") return "DataType.SEC_KEY";

    if (t === "unk") return "DataType.UNKNOWN";
    if (t === "zcltype") return "DataType.ZCLTYPE";
    if (t === "attributereportingstatus") return "DataType.ENUM8";
    if (t === "zclstatus") return "DataType.ENUM8";
    if (t === "profileintervalperiod") return "DataType.ENUM8";
    if (t === "iaszonetype") return "DataType.ENUM16";
    if (t === "iaszonestatus") return "DataType.BITMAP16";

    if (t === "sextensionfieldsetlist") return "BuffaloZclDataType.EXTENSION_FIELD_SETS";
    if (t === "transitiontype") return "BuffaloZclDataType.LIST_THERMO_TRANSITIONS";

    return "DataType.UNKNOWN";
}

function isNumericDataType(dataTypeExpr: string): boolean {
    switch (dataTypeExpr) {
        case "DataType.DATA8":
        case "DataType.DATA16":
        case "DataType.DATA24":
        case "DataType.DATA32":
        case "DataType.DATA40":
        case "DataType.DATA48":
        case "DataType.DATA56":
        case "DataType.DATA64":
        case "DataType.BOOLEAN":
        case "DataType.BITMAP8":
        case "DataType.BITMAP16":
        case "DataType.BITMAP24":
        case "DataType.BITMAP32":
        case "DataType.BITMAP40":
        case "DataType.BITMAP48":
        case "DataType.BITMAP56":
        case "DataType.BITMAP64":
        case "DataType.UINT8":
        case "DataType.UINT16":
        case "DataType.UINT24":
        case "DataType.UINT32":
        case "DataType.UINT40":
        case "DataType.UINT48":
        case "DataType.UINT56":
        case "DataType.UINT64":
        case "DataType.INT8":
        case "DataType.INT16":
        case "DataType.INT24":
        case "DataType.INT32":
        case "DataType.INT40":
        case "DataType.INT48":
        case "DataType.INT56":
        case "DataType.INT64":
        case "DataType.ENUM8":
        case "DataType.ENUM16":
        case "DataType.SEMI_PREC":
        case "DataType.SINGLE_PREC":
        case "DataType.DOUBLE_PREC":
        case "DataType.CLUSTER_ID":
        case "DataType.ATTR_ID":
        case "DataType.BAC_OID":
        case "DataType.UTC":
            return true;
        default:
            return false;
    }
}

/* ------------------------------------------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------------------------------------------*/
function parseAttributeOrCommandId(hexId: string): number {
    const clean = hexId.trim().toLowerCase();

    return Number.parseInt(clean, 16);
}

function findBestFuzzyAttrMatch(
    refName: string,
    candidates: ParsedXMLAttribute[],
    existingTsNames: Map<number, string>,
    factory: ts.NodeFactory,
): ts.StringLiteral | undefined {
    if (candidates.length === 0) {
        return undefined;
    }

    let bestMatch: {score: number; attribute: ParsedXMLAttribute | undefined} = {score: -1, attribute: undefined};
    const normalizedRefName = normalizeAttributeName(refName);

    for (const candidate of candidates) {
        const score = fuzzyMatch(normalizedRefName, candidate.name);

        if (score > bestMatch.score) {
            bestMatch = {score, attribute: candidate};
        }
    }

    if (bestMatch.attribute && bestMatch.score > 0.7) {
        // If a match is found, check if it has a corresponding name in the existing TS file.
        // If so, use that name. Otherwise, fall back to the normalized XML name.
        const tsName = existingTsNames.get(bestMatch.attribute.id);
        const finalName = tsName || bestMatch.attribute.name;

        return factory.createStringLiteral(finalName);
    }

    return undefined;
}

function findBestFuzzyParamMatch(
    refName: string,
    candidates: ParsedXMLCommandParameter[],
    existingTsParamNames: Map<string, string>,
    factory: ts.NodeFactory,
): ts.StringLiteral | undefined {
    if (candidates.length === 0) {
        return undefined;
    }

    let bestMatch: {score: number; parameter: ParsedXMLCommandParameter | undefined} = {score: -1, parameter: undefined};
    const normalizedRefName = normalizeAttributeName(refName);

    for (const candidate of candidates) {
        const score = fuzzyMatch(normalizedRefName, candidate.name);

        if (score > bestMatch.score) {
            bestMatch = {score, parameter: candidate};
        }
    }

    if (bestMatch.parameter && bestMatch.score > 0.7) {
        // If a match is found, check if it has a corresponding name in the existing TS file.
        // If so, use that name. Otherwise, fall back to the normalized XML name.
        const tsName = existingTsParamNames.get(bestMatch.parameter.name);
        const finalName = tsName || bestMatch.parameter.name;

        return factory.createStringLiteral(finalName);
    }

    return undefined;
}

/* ------------------------------------------------------------------------------------------------
 * Parsed representations
 * ----------------------------------------------------------------------------------------------*/
interface ParsedXMLClusterData {
    id: number;
    name: string;
    attributes: ParsedXMLAttribute[];
    serverCommands: ParsedXMLCommand[];
    clientCommands: ParsedXMLCommand[];
}

interface ParsedXMLAttribute {
    id: number;
    name: string;
    dataTypeExpr: string;
    meta?: XMLAttributeDefinition;
    client?: boolean;
}

interface ParsedXMLCommand {
    id: number;
    name: string;
    isResponse: boolean;
    parameters: ParsedXMLCommandParameter[];
    meta?: XMLCommandDefinition;
    client?: boolean;
}

interface ParsedXMLCommandParameter {
    name: string;
    dataTypeExpr: string;
    meta?: XMLFieldDefinition;
    isLength?: boolean;
}

function normalizeAttributeName(name: string): string {
    if (!name) {
        return name;
    }

    const first = name[0].toLowerCase();

    return `${first}${name.slice(1)}`.replace(/[^A-Za-z0-9]/g, "");
}

/* ------------------------------------------------------------------------------------------------
 * Validation
 * ----------------------------------------------------------------------------------------------*/
interface ValidationRecord {
    warnings: string[];
    errors: string[];
    unknownTypes: Set<string>;
    addedAttributes: string[];
    addedCommands: string[];
    addedParameters: string[];
    scannedClusters: string[];
    changedClusters: string[];
    xmlClustersMissingFromTs: Map<string, string>;
    tsClustersMissingFromXml: string[];
}

function processClusterSide(
    side: XMLClusterSide | undefined,
    isClient: boolean,
    resolver: TypeResolver,
    validation: ValidationRecord,
): {attributes: ParsedXMLAttribute[]; commands: ParsedXMLCommand[]} {
    const attributes: ParsedXMLAttribute[] = [];
    const commands: ParsedXMLCommand[] = [];

    if (!side) {
        return {attributes, commands};
    }

    if (side.attributes && side.attributes.length > 0) {
        const attrs = side.attributes[0].attribute;

        if (attrs) {
            for (const a of attrs) {
                if (!a?.$?.id) {
                    continue;
                }

                const attrId = parseAttributeOrCommandId(a.$.id);
                const attrTypeShortRaw = a.$.type.trim().toLowerCase();
                const baseShort = resolver.resolve(attrTypeShortRaw);
                const mappedDataType = mapZclTypeToDataType(baseShort);

                if (mappedDataType === "DataType.UNKNOWN" && attrTypeShortRaw !== "unk") {
                    validation.unknownTypes.add(attrTypeShortRaw);
                }

                const attrName = normalizeAttributeName(a.$.name);
                const attribute: ParsedXMLAttribute = {id: attrId, name: attrName, dataTypeExpr: mappedDataType, meta: a};

                if (isClient) {
                    attribute.client = true;
                }

                attributes.push(attribute);
            }
        }
    }

    if (side.commands && side.commands.length > 0) {
        const cmds = side.commands[0].command;

        if (cmds) {
            for (const cmd of cmds) {
                if (!cmd?.$?.id) {
                    continue;
                }

                const cmdId = parseAttributeOrCommandId(cmd.$.id);
                const cmdNameRaw = cmd.$.name;
                const cmdName = normalizeAttributeName(cmdNameRaw);
                const parameters: ParsedXMLCommandParameter[] = [];

                if (cmd.fields && cmd.fields.length > 0) {
                    const fields = cmd.fields[0].field;

                    if (fields) {
                        for (const [paramIndex, fld] of fields.entries()) {
                            const paramName = normalizeAttributeName(fld.$.name);
                            const typeShortRaw = fld.$.type.trim().toLowerCase();
                            const baseShort = resolver.resolve(typeShortRaw);
                            let mapped = mapZclTypeToDataType(baseShort);
                            const arrayFlag = fld.$.array === "true";

                            if (mapped === "DataType.UNKNOWN" && typeShortRaw !== "unk") {
                                validation.unknownTypes.add(typeShortRaw);
                            }

                            if (arrayFlag && !fld.$.arrayLengthSize && !fld.$.arrayLengthField) {
                                // This field represents an array with an implicit count.
                                // Create the count parameter.
                                parameters.push({
                                    name: `${paramName}Count`,
                                    dataTypeExpr: "DataType.UINT8", // The implicit count is usually UINT8
                                    meta: fld, // Carry over meta for context, but it's for the count
                                    isLength: true,
                                });

                                // Now, create the actual array parameter.
                                if (mapped === "DataType.UINT16") {
                                    mapped = "BuffaloZclDataType.LIST_UINT16";
                                } else if (mapped === "DataType.UINT8") {
                                    mapped = "BuffaloZclDataType.LIST_UINT8";
                                } else {
                                    mapped = "BuffaloZclDataType.BUFFER";
                                }

                                parameters.push({
                                    name: paramName,
                                    dataTypeExpr: mapped,
                                    meta: fld,
                                });
                            } else {
                                // Original logic for non-arrays or arrays with explicit length fields.
                                if (arrayFlag) {
                                    if (mapped === "DataType.UINT16") {
                                        mapped = "BuffaloZclDataType.LIST_UINT16";
                                    } else if (mapped === "DataType.UINT8") {
                                        mapped = "BuffaloZclDataType.LIST_UINT8";
                                    } else if (mapped.startsWith("DataType")) {
                                        mapped = "BuffaloZclDataType.BUFFER";
                                    }
                                }

                                parameters.push({
                                    name: paramName || `param${paramIndex}`,
                                    dataTypeExpr: mapped,
                                    meta: fld,
                                });
                            }
                        }
                    }
                }

                const command: ParsedXMLCommand = {id: cmdId, name: cmdName, isResponse: isClient, parameters, meta: cmd};

                if (isClient) {
                    command.client = true;
                }

                commands.push(command);
            }
        }
    }

    return {attributes, commands};
}

function parseClustersFromXML(list: XMLCluster[], globalResolver: TypeResolver, validation: ValidationRecord): ParsedXMLClusterData[] {
    const out: ParsedXMLClusterData[] = [];

    for (const cluster of list) {
        const idHex = cluster.$.id;

        if (!idHex) {
            continue;
        }

        // Create a new resolver for this specific cluster, with the global resolver as its parent.
        const clusterResolver = new TypeResolver(globalResolver);

        // Add only this cluster's local types to it.
        clusterResolver.add(cluster["type:type"]);

        const idNum = parseAttributeOrCommandId(idHex);
        const idHexStr = `0x${idNum.toString(16).padStart(4, "0")}`;
        const name = cluster.$.name;

        validation.scannedClusters.push(`${idHexStr} ${name}`);
        validation.xmlClustersMissingFromTs.set(idHexStr, `${idHexStr} ${name}`);

        // Process the cluster using its own scoped resolver.
        const serverData = processClusterSide(cluster.server?.[0], false, clusterResolver, validation);
        const clientData = processClusterSide(cluster.client?.[0], true, clusterResolver, validation);

        out.push({
            id: idNum,
            name,
            attributes: [...serverData.attributes, ...clientData.attributes],
            serverCommands: serverData.commands,
            clientCommands: clientData.commands,
        });
    }

    return out;
}

/* ------------------------------------------------------------------------------------------------
 * AST Transformer
 * ----------------------------------------------------------------------------------------------*/
const findProperty = (obj: ts.ObjectLiteralExpression, name: string): ts.PropertyAssignment | undefined => {
    for (const p of obj.properties) {
        if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === name) {
            return p;
        }
    }

    return undefined;
};

const extractNumericId = (node: ts.Node): number | undefined => {
    if (!ts.isPropertyAssignment(node)) {
        return undefined;
    }

    if (!ts.isObjectLiteralExpression(node.initializer)) {
        return undefined;
    }

    const idProp = findProperty(node.initializer, "ID");

    if (!idProp) {
        return undefined;
    }

    const initializer = idProp.initializer;

    if (ts.isNumericLiteral(initializer)) {
        const text = initializer.text;

        return text.startsWith("0x") ? Number.parseInt(text, 16) : Number(text);
    }

    if (ts.isPrefixUnaryExpression(initializer) && ts.isNumericLiteral(initializer.operand)) {
        const text = initializer.operand.text;
        const num = text.startsWith("0x") ? Number.parseInt(text, 16) : Number(text);

        return -num;
    }

    return undefined;
};

function createSafeNumericLiteral(value: string | number, factory: ts.NodeFactory): ts.Expression {
    const num = Number(value);

    if (Number.isNaN(num)) {
        // Fallback for invalid numbers, though this case should be rare.
        return factory.createNumericLiteral(0);
    }

    if (num < 0) {
        return factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, factory.createNumericLiteral(Math.abs(num)));
    }

    return factory.createNumericLiteral(num);
}

function createUpdateTransformer(
    xmlClusterData: Map<number, ParsedXMLClusterData>,
    validation: ValidationRecord,
): ts.TransformerFactory<ts.SourceFile> {
    return (context) => {
        const factory = context.factory;

        const visitor: ts.Visitor = (node) => {
            if (
                ts.isVariableDeclaration(node) &&
                ts.isIdentifier(node.name) &&
                node.name.text === "Clusters" &&
                node.initializer &&
                ts.isObjectLiteralExpression(node.initializer)
            ) {
                const tsClusterIds = new Set<number>();
                const newClusterProps: ts.ObjectLiteralElementLike[] = [];

                for (const prop of node.initializer.properties) {
                    if (!ts.isPropertyAssignment(prop) || !ts.isObjectLiteralExpression(prop.initializer)) {
                        newClusterProps.push(prop);

                        continue;
                    }

                    const clusterId = extractNumericId(prop);

                    if (clusterId !== undefined) {
                        tsClusterIds.add(clusterId);
                    } else {
                        newClusterProps.push(prop);

                        continue;
                    }

                    const xmlCluster = xmlClusterData.get(clusterId);

                    if (!xmlCluster) {
                        newClusterProps.push(prop);

                        continue;
                    }

                    const clusterIdHexStr = `0x${clusterId.toString(16).padStart(4, "0")}`;

                    validation.xmlClustersMissingFromTs.delete(clusterIdHexStr); // Found it

                    let changed = false;
                    const newSubProps: ts.ObjectLiteralElementLike[] = [];

                    for (const subProp of prop.initializer.properties) {
                        if (!ts.isPropertyAssignment(subProp) || !ts.isIdentifier(subProp.name)) {
                            newSubProps.push(subProp);

                            continue;
                        }

                        if (!ts.isObjectLiteralExpression(subProp.initializer)) {
                            newSubProps.push(subProp);

                            continue;
                        }

                        const subPropName = subProp.name.text;
                        let updatedProp: ts.PropertyAssignment | undefined;

                        if (subPropName === "attributes") {
                            updatedProp = updateAttributes(subProp, xmlCluster.attributes, factory, validation);
                        } else if (subPropName === "commands") {
                            updatedProp = updateCommands(subProp, xmlCluster.serverCommands, false, factory, validation);
                        } else if (subPropName === "commandsResponse") {
                            updatedProp = updateCommands(subProp, xmlCluster.clientCommands, true, factory, validation);
                        }

                        if (updatedProp && updatedProp !== subProp) {
                            changed = true;

                            newSubProps.push(updatedProp);
                        } else {
                            newSubProps.push(subProp);
                        }
                    }

                    if (changed) {
                        validation.changedClusters.push(`${clusterIdHexStr} ${xmlCluster.name}`);
                        const updatedInitializer = factory.updateObjectLiteralExpression(prop.initializer, newSubProps);
                        const updatedProperty = factory.updatePropertyAssignment(prop, prop.name, updatedInitializer);

                        newClusterProps.push(updatedProperty);
                    } else {
                        newClusterProps.push(prop);
                    }
                }

                // Populate clusters present in TS but not in XML
                for (const id of tsClusterIds) {
                    if (!xmlClusterData.has(id) && id <= 0x7fff /* std cluster */) {
                        validation.tsClustersMissingFromXml.push(`0x${id.toString(16).padStart(4, "0")}`);
                    }
                }

                const updatedInitializer = factory.updateObjectLiteralExpression(node.initializer, newClusterProps);

                return factory.updateVariableDeclaration(node, node.name, node.exclamationToken, node.type, updatedInitializer);
            }

            return ts.visitEachChild(node, visitor, context);
        };

        return (sourceFile) => ts.visitNode(sourceFile, visitor) as ts.SourceFile;
    };
}

function createHexIdTransformer(): ts.TransformerFactory<ts.SourceFile> {
    return (context) => {
        const factory = context.factory;

        const visitor: ts.Visitor = (node) => {
            if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === "ID" && ts.isNumericLiteral(node.initializer)) {
                const num = Number(node.initializer.text);

                if (!Number.isNaN(num) && !node.initializer.text.startsWith("0x")) {
                    let pad = 4; // Default to 4 for clusters and attributes
                    let current: ts.Node = node.parent;

                    // Traverse up to find if the ID is inside a `commands` or `commandsResponse` block.
                    while (current?.parent) {
                        if (ts.isPropertyAssignment(current.parent) && ts.isIdentifier(current.parent.name)) {
                            const parentName = current.parent.name.text;
                            if (parentName === "commands" || parentName === "commandsResponse") {
                                pad = 2;
                                break;
                            }
                        }
                        current = current.parent;
                    }

                    const hex = `0x${num.toString(16).padStart(pad, "0")}`;

                    return factory.updatePropertyAssignment(node, node.name, factory.createNumericLiteral(hex));
                }
            }
            return ts.visitEachChild(node, visitor, context);
        };

        return (sourceFile) => ts.visitNode(sourceFile, visitor) as ts.SourceFile;
    };
}

function updateAttributes(
    attributesProp: ts.PropertyAssignment,
    xmlAttributes: ParsedXMLAttribute[],
    factory: ts.NodeFactory,
    validation: ValidationRecord,
): ts.PropertyAssignment {
    const initializer = attributesProp.initializer as ts.ObjectLiteralExpression;
    const existingTsAttributes = new Map<number, ts.PropertyAssignment[]>();
    const existingTsNames = new Map<number, string>();

    for (const attr of initializer.properties) {
        if (ts.isPropertyAssignment(attr)) {
            const id = extractNumericId(attr);

            if (id !== undefined) {
                if (!existingTsAttributes.has(id)) {
                    existingTsAttributes.set(id, []);
                }

                // biome-ignore lint/style/noNonNullAssertion: set above if not exist
                existingTsAttributes.get(id)!.push(attr);

                if (ts.isIdentifier(attr.name) && !existingTsNames.has(id)) {
                    existingTsNames.set(id, attr.name.text);
                }
            }
        }
    }

    const finalAttributes: ts.PropertyAssignment[] = [];
    const processedTsNodes = new Set<ts.PropertyAssignment>();

    for (const xmlAttr of xmlAttributes) {
        const existingNodesWithId = existingTsAttributes.get(xmlAttr.id) || [];
        let existingAttrNode: ts.PropertyAssignment | undefined;

        for (const node of existingNodesWithId) {
            const initializer = node.initializer as ts.ObjectLiteralExpression;
            const manuCodeProp = findProperty(initializer, "manufacturerCode");

            if (!manuCodeProp) {
                existingAttrNode = node;

                break;
            }
        }

        const attributeName = existingAttrNode ? (existingAttrNode.name as ts.Identifier) : factory.createIdentifier(xmlAttr.name);
        const existingProps =
            existingAttrNode && ts.isObjectLiteralExpression(existingAttrNode.initializer) ? [...existingAttrNode.initializer.properties] : [];
        const existingPropNames = new Set<string>();

        for (const p of existingProps) {
            if (p.name && ts.isIdentifier(p.name)) {
                existingPropNames.add(p.name.text);
            }
        }

        const propsToAdd: ts.PropertyAssignment[] = [];

        // Unified logic to build required properties
        if (xmlAttr.meta) {
            const meta = xmlAttr.meta.$;

            if (xmlAttr.client && !existingPropNames.has("client")) {
                propsToAdd.push(factory.createPropertyAssignment("client", factory.createTrue()));
            }

            if (meta.readable === "false" && !existingPropNames.has("readable")) {
                propsToAdd.push(factory.createPropertyAssignment("readable", factory.createFalse()));
            }

            if (meta.writable === "true" && !existingPropNames.has("writable")) {
                propsToAdd.push(factory.createPropertyAssignment("writable", factory.createTrue()));
            }

            if (meta.reportRequired === "true" && !existingPropNames.has("reportRequired")) {
                propsToAdd.push(factory.createPropertyAssignment("reportRequired", factory.createTrue()));
            }

            if (meta.min && meta.min !== "0" && !existingPropNames.has("min")) {
                // skip when too long for number format (not especially useful anyway)
                if (xmlAttr.dataTypeExpr !== "DataType.IEEE_ADDR" && xmlAttr.dataTypeExpr !== "DataType.SEC_KEY") {
                    propsToAdd.push(factory.createPropertyAssignment("min", createSafeNumericLiteral(meta.min, factory)));
                }
            }

            if (meta.max && !existingPropNames.has("max")) {
                // skip when too long for number format (not especially useful anyway)
                if (xmlAttr.dataTypeExpr !== "DataType.IEEE_ADDR" && xmlAttr.dataTypeExpr !== "DataType.SEC_KEY") {
                    propsToAdd.push(factory.createPropertyAssignment("max", createSafeNumericLiteral(meta.max, factory)));
                }
            }

            if (meta.default != null && !existingPropNames.has("default")) {
                if (isNumericDataType(xmlAttr.dataTypeExpr)) {
                    propsToAdd.push(factory.createPropertyAssignment("default", createSafeNumericLiteral(meta.default, factory)));
                } else {
                    propsToAdd.push(factory.createPropertyAssignment("default", factory.createStringLiteral(meta.default)));
                }
            }

            if (meta.defaultRef && !existingPropNames.has("defaultRef")) {
                const otherAttributes = xmlAttributes.filter((a) => a.id !== xmlAttr.id);
                const matched = findBestFuzzyAttrMatch(meta.defaultRef, otherAttributes, existingTsNames, factory);

                if (matched) {
                    propsToAdd.push(factory.createPropertyAssignment("defaultRef", matched));
                }
            }
        }

        if (xmlAttr.meta?.restriction?.[0]) {
            const restriction = xmlAttr.meta.restriction[0];
            const otherAttributes = xmlAttributes.filter((a) => a.id !== xmlAttr.id);
            const restrictionFacets: {name: string; value: string | {name: string; value: string}[] | undefined; isRef?: boolean}[] = [
                {name: "length", value: restriction["type:length"]?.[0]?.$?.value},
                {name: "minLength", value: restriction["type:minLength"]?.[0]?.$?.value},
                {name: "maxLength", value: restriction["type:maxLength"]?.[0]?.$?.value},
                {name: "minExclusive", value: restriction["type:minExclusive"]?.[0]?.$?.value},
                {name: "minInclusive", value: restriction["type:minInclusive"]?.[0]?.$?.value},
                {name: "maxExclusive", value: restriction["type:maxExclusive"]?.[0]?.$?.value},
                {name: "maxInclusive", value: restriction["type:maxInclusive"]?.[0]?.$?.value},
                {name: "minInclusiveRef", value: restriction["type:minInclusiveRef"]?.[0]?.$?.ref, isRef: true},
                {name: "minExclusiveRef", value: restriction["type:minExclusiveRef"]?.[0]?.$?.ref, isRef: true},
                {name: "maxInclusiveRef", value: restriction["type:maxInclusiveRef"]?.[0]?.$?.ref, isRef: true},
                {name: "maxExclusiveRef", value: restriction["type:maxExclusiveRef"]?.[0]?.$?.ref, isRef: true},
                {name: "special", value: restriction["type:special"]?.map((s) => s.$)},
            ];

            for (const facet of restrictionFacets) {
                if (facet.value && !existingPropNames.has(facet.name)) {
                    if (facet.name === "special" && Array.isArray(facet.value)) {
                        const specialArray = factory.createArrayLiteralExpression(
                            facet.value.map((s) =>
                                factory.createArrayLiteralExpression([factory.createStringLiteral(s.name), factory.createStringLiteral(s.value)]),
                            ),
                            true,
                        );

                        propsToAdd.push(factory.createPropertyAssignment(facet.name, specialArray));
                    } else if (typeof facet.value === "string") {
                        if (facet.isRef) {
                            const matched = findBestFuzzyAttrMatch(facet.value, otherAttributes, existingTsNames, factory);
                            if (matched) {
                                propsToAdd.push(factory.createPropertyAssignment(facet.name, matched));
                            }
                        } else {
                            if (facet.name === "minLength" && facet.value === "0") {
                                continue;
                            }

                            propsToAdd.push(factory.createPropertyAssignment(facet.name, createSafeNumericLiteral(facet.value, factory)));
                        }
                    }
                }
            }
        }

        let finalNode: ts.PropertyAssignment;

        if (existingAttrNode) {
            processedTsNodes.add(existingAttrNode);
            const finalProps = [...existingProps, ...propsToAdd];
            const finalInitializer = factory.updateObjectLiteralExpression(existingAttrNode.initializer as ts.ObjectLiteralExpression, finalProps);
            finalNode = factory.updatePropertyAssignment(existingAttrNode, attributeName, finalInitializer);
        } else {
            validation.addedAttributes.push(`0x${xmlAttr.id.toString(16).padStart(4, "0")} ${xmlAttr.name}`);
            const typeIdentifierParts = xmlAttr.dataTypeExpr.split(".");
            const typeIdentifier =
                typeIdentifierParts.length > 1
                    ? factory.createPropertyAccessExpression(factory.createIdentifier(typeIdentifierParts[0]), typeIdentifierParts[1])
                    : factory.createIdentifier(xmlAttr.dataTypeExpr);
            const finalProps = [
                factory.createPropertyAssignment("ID", factory.createNumericLiteral(String(xmlAttr.id))),
                factory.createPropertyAssignment("type", typeIdentifier),
                ...propsToAdd,
            ];
            const finalInitializer = factory.createObjectLiteralExpression(finalProps, true);
            finalNode = factory.createPropertyAssignment(attributeName, finalInitializer);
        }

        finalAttributes.push(finalNode);
    }

    // Add back any TS-only attributes that were not processed
    for (const nodes of existingTsAttributes.values()) {
        for (const node of nodes) {
            if (!processedTsNodes.has(node)) {
                finalAttributes.push(node);
            }
        }
    }

    finalAttributes.sort((a, b) => {
        const idA = extractNumericId(a) ?? -1;
        const idB = extractNumericId(b) ?? -1;

        if (idA !== idB) {
            return idA - idB;
        }

        // If IDs are the same, check for manufacturerCode to sort standard attributes first
        const initA = a.initializer as ts.ObjectLiteralExpression;
        const initB = b.initializer as ts.ObjectLiteralExpression;
        const hasManuA = findProperty(initA, "manufacturerCode") !== undefined;
        const hasManuB = findProperty(initB, "manufacturerCode") !== undefined;

        if (hasManuA && !hasManuB) {
            return 1;
        }

        if (!hasManuA && hasManuB) {
            return -1;
        }

        return 0;
    });

    const updatedInitializer = factory.updateObjectLiteralExpression(initializer, finalAttributes);

    return factory.updatePropertyAssignment(attributesProp, attributesProp.name, updatedInitializer);
}

function updateCommands(
    commandsProp: ts.PropertyAssignment,
    xmlCommands: ParsedXMLCommand[],
    isResponse: boolean,
    factory: ts.NodeFactory,
    validation: ValidationRecord,
): ts.PropertyAssignment {
    const initializer = commandsProp.initializer as ts.ObjectLiteralExpression;
    const existingCommandIds = new Map<number, ts.PropertyAssignment[]>();

    for (const cmd of initializer.properties) {
        if (ts.isPropertyAssignment(cmd)) {
            const id = extractNumericId(cmd);

            if (id !== undefined) {
                if (!existingCommandIds.has(id)) {
                    existingCommandIds.set(id, []);
                }

                // biome-ignore lint/style/noNonNullAssertion: set above if not exist
                existingCommandIds.get(id)!.push(cmd);
            }
        }
    }

    const finalCommands: ts.PropertyAssignment[] = [];
    const xmlCommandsForScope: ParsedXMLCommand[] = [];

    for (const cmd of xmlCommands) {
        if (cmd.isResponse === isResponse) {
            xmlCommandsForScope.push(cmd);
        }
    }

    for (const xmlCmd of xmlCommandsForScope) {
        const existingCmdNodes = existingCommandIds.get(xmlCmd.id);
        let existingCmdNode: ts.PropertyAssignment | undefined;

        if (existingCmdNodes) {
            if (existingCmdNodes.length === 1) {
                existingCmdNode = existingCmdNodes[0];
            } else if (existingCmdNodes.length > 1) {
                let bestMatch: {score: number; node: ts.PropertyAssignment | undefined} = {score: -1, node: undefined};

                for (const node of existingCmdNodes) {
                    const nodeName = ts.isIdentifier(node.name) ? node.name.text : "";
                    const score = fuzzyMatch(xmlCmd.name, nodeName);

                    if (score > bestMatch.score) {
                        bestMatch = {score, node};
                    }
                }

                existingCmdNode = bestMatch.node;
            }
        }

        const commandName = existingCmdNode ? existingCmdNode.name : factory.createIdentifier(xmlCmd.name);
        let finalNode: ts.PropertyAssignment;

        if (existingCmdNode) {
            // An existing command was found. Preserve its properties.
            const existingCmdInitializer = existingCmdNode.initializer as ts.ObjectLiteralExpression;
            const newProps = new Map<string, ts.PropertyAssignment>();

            for (const prop of existingCmdInitializer.properties) {
                if (ts.isPropertyAssignment(prop) && prop.name && ts.isIdentifier(prop.name)) {
                    newProps.set(prop.name.text, prop);
                }
            }

            // Find and update only the 'parameters' property if it exists.
            const paramsProp = newProps.get("parameters");
            const existingParamsArray: ts.ObjectLiteralExpression[] = [];
            const existingTsParamNames = new Map<string, string>(); // Map from normalized XML name to TS name

            if (paramsProp && ts.isArrayLiteralExpression(paramsProp.initializer)) {
                for (const [i, el] of paramsProp.initializer.elements.entries()) {
                    if (ts.isObjectLiteralExpression(el)) {
                        existingParamsArray.push(el);
                        const nameProp = findProperty(el, "name");

                        if (nameProp && ts.isStringLiteral(nameProp.initializer) && xmlCmd.parameters[i]) {
                            existingTsParamNames.set(xmlCmd.parameters[i].name, nameProp.initializer.text);
                        }
                    }
                }
            }

            const newParams: ts.Expression[] = [];
            const maxParams = Math.max(xmlCmd.parameters.length, existingParamsArray.length);

            for (let i = 0; i < maxParams; i++) {
                const xmlParam = xmlCmd.parameters[i];
                const existingParamExpr = existingParamsArray[i];

                if (existingParamExpr) {
                    // Keep existing param, but ensure name and type are there if missing from TS but present in XML
                    const existingParamProps = new Map<string, ts.PropertyAssignment>();
                    const existingParamPropNames = new Set<string>();

                    if (ts.isObjectLiteralExpression(existingParamExpr)) {
                        for (const prop of existingParamExpr.properties) {
                            if (ts.isPropertyAssignment(prop) && prop.name && ts.isIdentifier(prop.name)) {
                                existingParamProps.set(prop.name.text, prop);
                                existingParamPropNames.add(prop.name.text);
                            }
                        }
                    }

                    if (xmlParam) {
                        if (!existingParamProps.has("name")) {
                            existingParamProps.set("name", factory.createPropertyAssignment("name", factory.createStringLiteral(xmlParam.name)));
                        }

                        if (!existingParamProps.has("type")) {
                            const typeIdentifierParts = xmlParam.dataTypeExpr.split(".");
                            const typeIdentifier =
                                typeIdentifierParts.length > 1
                                    ? factory.createPropertyAccessExpression(factory.createIdentifier(typeIdentifierParts[0]), typeIdentifierParts[1])
                                    : factory.createIdentifier(xmlParam.dataTypeExpr);

                            existingParamProps.set("type", factory.createPropertyAssignment("type", typeIdentifier));
                        }

                        // Add restrictions for existing params
                        if (xmlParam.meta?.restriction?.[0]) {
                            const restriction = xmlParam.meta.restriction[0];
                            const otherParams = xmlCmd.parameters.filter((_p, index) => index !== i);
                            const restrictionFacets: {
                                name: string;
                                value: string | {name: string; value: string}[] | undefined;
                                isRef?: boolean;
                            }[] = [
                                {name: "length", value: restriction["type:length"]?.[0]?.$?.value},
                                {name: "minLength", value: restriction["type:minLength"]?.[0]?.$?.value},
                                {name: "maxLength", value: restriction["type:maxLength"]?.[0]?.$?.value},
                                {name: "minExclusive", value: restriction["type:minExclusive"]?.[0]?.$?.value},
                                {name: "minInclusive", value: restriction["type:minInclusive"]?.[0]?.$?.value},
                                {name: "maxExclusive", value: restriction["type:maxExclusive"]?.[0]?.$?.value},
                                {name: "maxInclusive", value: restriction["type:maxInclusive"]?.[0]?.$?.value},
                                {name: "minInclusiveRef", value: restriction["type:minInclusiveRef"]?.[0]?.$?.ref, isRef: true},
                                {name: "minExclusiveRef", value: restriction["type:minExclusiveRef"]?.[0]?.$?.ref, isRef: true},
                                {name: "maxInclusiveRef", value: restriction["type:maxInclusiveRef"]?.[0]?.$?.ref, isRef: true},
                                {name: "maxExclusiveRef", value: restriction["type:maxExclusiveRef"]?.[0]?.$?.ref, isRef: true},
                                {name: "special", value: restriction["type:special"]?.map((s) => s.$)},
                            ];

                            for (const facet of restrictionFacets) {
                                if (facet.value && !existingParamPropNames.has(facet.name)) {
                                    if (facet.name === "special" && Array.isArray(facet.value)) {
                                        const specialArray = factory.createArrayLiteralExpression(
                                            facet.value.map((s) =>
                                                factory.createArrayLiteralExpression([
                                                    factory.createStringLiteral(s.name),
                                                    factory.createStringLiteral(s.value),
                                                ]),
                                            ),
                                            true,
                                        );

                                        existingParamProps.set(facet.name, factory.createPropertyAssignment(facet.name, specialArray));
                                    } else if (typeof facet.value === "string") {
                                        if (facet.isRef) {
                                            const matched = findBestFuzzyParamMatch(facet.value, otherParams, existingTsParamNames, factory);
                                            if (matched) {
                                                existingParamProps.set(facet.name, factory.createPropertyAssignment(facet.name, matched));
                                            }
                                        } else {
                                            // a few entries are in hex form like "fd", this is obviously flawed, entries that are too complex should be overriden instead
                                            if (facet.value.match(/^[0-9]+$/)) {
                                                existingParamProps.set(
                                                    facet.name,
                                                    factory.createPropertyAssignment(facet.name, createSafeNumericLiteral(facet.value, factory)),
                                                );
                                            } else if (facet.value.match(/^[0-9a-fA-F]+$/)) {
                                                console.log(`Writing ${JSON.stringify(facet)} as hex number`);
                                                existingParamProps.set(
                                                    facet.name,
                                                    factory.createPropertyAssignment(
                                                        facet.name,
                                                        createSafeNumericLiteral(`0x${facet.value}`, factory),
                                                    ),
                                                );
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    newParams.push(factory.createObjectLiteralExpression(Array.from(existingParamProps.values()), true));
                } else if (xmlParam) {
                    // Add new param from XML that was not in the TS file
                    validation.addedParameters.push(`0x${xmlCmd.id.toString(16).padStart(2, "0")} ${xmlCmd.name} > ${xmlParam.name}`);
                    const typeIdentifierParts = xmlParam.dataTypeExpr.split(".");
                    const typeIdentifier =
                        typeIdentifierParts.length > 1
                            ? factory.createPropertyAccessExpression(factory.createIdentifier(typeIdentifierParts[0]), typeIdentifierParts[1])
                            : factory.createIdentifier(xmlParam.dataTypeExpr);
                    const paramProps = [
                        factory.createPropertyAssignment("name", factory.createStringLiteral(xmlParam.name)),
                        factory.createPropertyAssignment("type", typeIdentifier),
                    ];

                    newParams.push(factory.createObjectLiteralExpression(paramProps, true));
                }
            }

            const newParamsArrayLiteral = factory.createArrayLiteralExpression(newParams, true);

            if (paramsProp) {
                // Update the existing 'parameters' property
                newProps.set("parameters", factory.updatePropertyAssignment(paramsProp, paramsProp.name, newParamsArrayLiteral));
            } else if (newParams.length > 0) {
                // Add 'parameters' property if it was missing and we have params
                newProps.set("parameters", factory.createPropertyAssignment("parameters", newParamsArrayLiteral));
            }

            // Rebuild the command with the preserved and updated properties.
            const updatedInitializer = factory.updateObjectLiteralExpression(existingCmdInitializer, Array.from(newProps.values()));
            finalNode = factory.updatePropertyAssignment(existingCmdNode, commandName, updatedInitializer);

            const nodesForId = existingCommandIds.get(xmlCmd.id);

            if (nodesForId) {
                const index = nodesForId.indexOf(existingCmdNode);

                if (index > -1) {
                    nodesForId.splice(index, 1);
                }
            }
        } else {
            // A new command is being added. Build it from scratch.
            validation.addedCommands.push(`0x${xmlCmd.id.toString(16).padStart(2, "0")} ${xmlCmd.name}`);
            const newParams: ts.ObjectLiteralExpression[] = [];

            for (const xmlParam of xmlCmd.parameters) {
                validation.addedParameters.push(`0x${xmlCmd.id.toString(16).padStart(2, "0")} ${xmlCmd.name} > ${xmlParam.name}`);
                const typeIdentifierParts = xmlParam.dataTypeExpr.split(".");
                const typeIdentifier =
                    typeIdentifierParts.length > 1
                        ? factory.createPropertyAccessExpression(factory.createIdentifier(typeIdentifierParts[0]), typeIdentifierParts[1])
                        : factory.createIdentifier(xmlParam.dataTypeExpr);

                const paramProps = [
                    factory.createPropertyAssignment("name", factory.createStringLiteral(xmlParam.name)),
                    factory.createPropertyAssignment("type", typeIdentifier),
                ];

                if (xmlParam.meta?.$.arrayLengthSize) {
                    paramProps.push(
                        factory.createPropertyAssignment("arrayLengthSize", factory.createNumericLiteral(xmlParam.meta.$.arrayLengthSize)),
                    );
                }

                newParams.push(factory.createObjectLiteralExpression(paramProps, true));
            }

            const cmdProps = [
                factory.createPropertyAssignment("ID", factory.createNumericLiteral(String(xmlCmd.id))),
                factory.createPropertyAssignment("parameters", factory.createArrayLiteralExpression(newParams, true)),
            ];

            if (xmlCmd.meta?.$.required === "true") {
                cmdProps.push(factory.createPropertyAssignment("required", factory.createTrue()));
            }

            finalNode = factory.createPropertyAssignment(commandName, factory.createObjectLiteralExpression(cmdProps, true));
        }

        finalCommands.push(finalNode);
    }

    // Add back any TS-only commands
    for (const tsOnlyCmds of existingCommandIds.values()) {
        for (const tsOnlyCmd of tsOnlyCmds) {
            finalCommands.push(tsOnlyCmd);
        }
    }

    finalCommands.sort((a, b) => {
        const idA = extractNumericId(a) ?? -1;
        const idB = extractNumericId(b) ?? -1;

        return idA - idB;
    });

    const updatedInitializer = factory.updateObjectLiteralExpression(initializer, finalCommands);

    return factory.updatePropertyAssignment(commandsProp, commandsProp.name, updatedInitializer);
}

/* ------------------------------------------------------------------------------------------------
 * Main
 * ----------------------------------------------------------------------------------------------*/
async function main(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.length !== 1) {
        throw new Error("Usage: tsx scripts/zap-update-clusters.ts <path-to-xml-files>");
    }

    const xmlPath = args[0];
    const clusterFile = "src/zspec/zcl/definition/cluster.ts";
    const overridesFile = "scripts/zap-xml-clusters-overrides-data.ts";
    const validation: ValidationRecord = {
        warnings: [],
        errors: [],
        unknownTypes: new Set(),
        addedAttributes: [],
        addedCommands: [],
        addedParameters: [],
        scannedClusters: [],
        changedClusters: [],
        xmlClustersMissingFromTs: new Map(),
        tsClustersMissingFromXml: [],
    };
    const allXmlClusters: XMLCluster[] = [];

    const globalResolver = new TypeResolver();
    const libraryPath = path.join(xmlPath, "library.xml");

    try {
        // Collect all data and types first.
        const {includeFiles, libraryTypes} = await collectFromLibrary(libraryPath);

        globalResolver.add(libraryTypes); // Populate the global resolver.

        for (const f of includeFiles) {
            if (!f.toLowerCase().endsWith(".xml")) {
                continue;
            }
            try {
                const clusters = await parseXMLCluster(f);
                allXmlClusters.push(...clusters);
            } catch (e) {
                validation.errors.push(`Failed parsing XML ${f}: ${(e as Error).message}`);
            }
        }
    } catch (e) {
        throw new Error(`Unable to process library file at ${libraryPath}: ${(e as Error).message}`);
    }

    const overridesFileContent = await fs.readFile(overridesFile, "utf8");
    const overridesSourceFile = ts.createSourceFile(overridesFile, overridesFileContent, ts.ScriptTarget.Latest, true);
    const overrides = parseOverrides(overridesSourceFile);

    applyXmlOverrides(allXmlClusters, overrides);

    // Pass the prepared globalResolver to the parsing function.
    const parsedData = parseClustersFromXML(allXmlClusters, globalResolver, validation);
    const xmlClusterDataMap = new Map<number, ParsedXMLClusterData>();

    for (const d of parsedData) {
        const existing = xmlClusterDataMap.get(d.id);

        if (existing) {
            // This is a derived cluster, merge its data with the base cluster.
            existing.attributes.push(...d.attributes);
            existing.serverCommands.push(...d.serverCommands);
            existing.clientCommands.push(...d.clientCommands);
        } else {
            xmlClusterDataMap.set(d.id, d);
        }
    }

    const clusterFileContent = await fs.readFile(clusterFile, "utf8");
    const sourceFile = ts.createSourceFile(clusterFile, clusterFileContent, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const updateTransformer = createUpdateTransformer(xmlClusterDataMap, validation);
    const hexTransformer = createHexIdTransformer();
    const result1 = ts.transform(sourceFile, [updateTransformer]);
    const updatedSourceFile = result1.transformed[0];
    const result3 = ts.transform(updatedSourceFile, [hexTransformer]);
    const finalSourceFile = result3.transformed[0];
    const printer = ts.createPrinter({newLine: ts.NewLineKind.LineFeed, removeComments: false});
    let newContent = printer.printFile(finalSourceFile);
    // help biome re-format
    newContent = newContent.replaceAll("{\n                ID:", "{ID:");
    newContent = newContent.replaceAll("{\n                        name:", "{name:");

    await fs.writeFile(clusterFile, newContent, "utf8");

    console.log(
        `Successfully updated ${clusterFile}. Changes: ${validation.changedClusters} clusters, ${validation.addedAttributes} attributes, ${validation.addedCommands} commands, ${validation.addedParameters} parameters.`,
    );

    if (validation.warnings.length > 0) {
        console.log("Warnings:");

        for (const w of validation.warnings) {
            console.log(`  - ${w}`);
        }
    }

    if (validation.errors.length > 0) {
        console.log("Errors:");

        for (const e of validation.errors) {
            console.log(`  - ${e}`);
        }
    }

    const report = {
        scannedClusters: validation.scannedClusters,
        changedClusters: validation.changedClusters,
        addedAttributes: validation.addedAttributes,
        addedCommands: validation.addedCommands,
        addedParameters: validation.addedParameters,
        unknownTypes: Array.from(validation.unknownTypes.values()),
        xmlClustersMissingFromTs: Array.from(validation.xmlClustersMissingFromTs.values()),
        tsClustersMissingFromXml: validation.tsClustersMissingFromXml,
        warnings: validation.warnings,
        errors: validation.errors,
    };

    await fs.writeFile("scripts/zap-update-clusters-report.json", JSON.stringify(report, null, 2), "utf8");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
