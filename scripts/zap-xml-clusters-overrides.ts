import ts from "typescript";
import type {XMLAttributeDefinition, XMLCluster, XMLCommandDefinition, XMLFieldDefinition, XMLRestriction} from "./zap-update-clusters.js";

type RestrictionOverride = {
    type: string;
    index?: number;
    new: Record<string, string>;
};

type CommandParameterOverride = {
    name: string;
    new?: Partial<XMLFieldDefinition["$"]>;
    restrictions?: RestrictionOverride[];
};

type AttributeOverride = {
    id: number;
    new?: Partial<XMLAttributeDefinition["$"]>;
    restrictions?: RestrictionOverride[];
};

type CommandOverride = {
    id: number;
    new?: Partial<XMLCommandDefinition["$"]>;
    parameters?: CommandParameterOverride[];
};

export type XmlOverride = {
    clusterId: number;
    attributes?: AttributeOverride[];
    commands?: CommandOverride[];
};

function getObjectLiteralProperties(node: ts.ObjectLiteralExpression): Map<string, ts.Expression> {
    const props = new Map<string, ts.Expression>();

    for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
            props.set(prop.name.text, prop.initializer);
        }
    }

    return props;
}

// biome-ignore lint/suspicious/noExplicitAny: generic
function expressionToValue(expr: ts.Expression | undefined): any {
    if (!expr) {
        return undefined;
    }

    if (ts.isStringLiteral(expr)) {
        return expr.text;
    }

    if (ts.isNumericLiteral(expr)) {
        const text = expr.text;
        return text.startsWith("0x") ? Number.parseInt(text, 16) : Number(text);
    }

    if (expr.kind === ts.SyntaxKind.TrueKeyword) {
        return true;
    }

    if (expr.kind === ts.SyntaxKind.FalseKeyword) {
        return false;
    }

    return undefined;
}

function parseRestrictionOverrides(restrictionsProp: ts.Expression | undefined): RestrictionOverride[] | undefined {
    if (!restrictionsProp || !ts.isArrayLiteralExpression(restrictionsProp)) {
        return undefined;
    }

    const restrictions: RestrictionOverride[] = [];

    for (const r of restrictionsProp.elements) {
        if (ts.isObjectLiteralExpression(r)) {
            const rProps = getObjectLiteralProperties(r);
            const rTypeExpr = rProps.get("type");
            const rNewExpr = rProps.get("new");

            if (rTypeExpr && rNewExpr && ts.isObjectLiteralExpression(rNewExpr)) {
                const rType = expressionToValue(rTypeExpr);
                const rIndex = expressionToValue(rProps.get("index"));
                const newValues: Record<string, string> = {};

                for (const [key, val] of getObjectLiteralProperties(rNewExpr).entries()) {
                    newValues[key] = expressionToValue(val);
                }

                restrictions.push({type: rType, index: rIndex, new: newValues});
            }
        }
    }

    return restrictions.length > 0 ? restrictions : undefined;
}

export function parseOverrides(sourceFile: ts.SourceFile): XmlOverride[] {
    const overrides: XmlOverride[] = [];
    let overridesVariable: ts.VariableDeclaration | undefined;

    ts.forEachChild(sourceFile, (node) => {
        if (ts.isVariableStatement(node)) {
            for (const decl of node.declarationList.declarations) {
                if (ts.isIdentifier(decl.name) && decl.name.text === "OVERRIDES") {
                    overridesVariable = decl;

                    break;
                }
            }
        }
    });

    if (overridesVariable?.initializer && ts.isArrayLiteralExpression(overridesVariable.initializer)) {
        for (const element of overridesVariable.initializer.elements) {
            if (ts.isObjectLiteralExpression(element)) {
                const props = getObjectLiteralProperties(element);
                const clusterIdExpr = props.get("clusterId");

                if (!clusterIdExpr) {
                    continue;
                }

                const clusterId = expressionToValue(clusterIdExpr);

                if (clusterId === undefined) {
                    continue;
                }

                const override: XmlOverride = {clusterId};
                const attributesProp = props.get("attributes");

                if (attributesProp && ts.isArrayLiteralExpression(attributesProp)) {
                    override.attributes = [];

                    for (const attrElement of attributesProp.elements) {
                        if (ts.isObjectLiteralExpression(attrElement)) {
                            const attrProps = getObjectLiteralProperties(attrElement);
                            const idExpr = attrProps.get("id");

                            if (!idExpr) {
                                continue;
                            }

                            const id = expressionToValue(idExpr);
                            const attrOverride: AttributeOverride = {id};
                            const newPropsExpr = attrProps.get("new");

                            if (newPropsExpr && ts.isObjectLiteralExpression(newPropsExpr)) {
                                const newValues: Partial<XMLAttributeDefinition["$"]> = {};

                                for (const [key, val] of getObjectLiteralProperties(newPropsExpr).entries()) {
                                    newValues[key as keyof typeof newValues] = expressionToValue(val);
                                }

                                attrOverride.new = newValues;
                            }

                            attrOverride.restrictions = parseRestrictionOverrides(attrProps.get("restrictions"));

                            if (Object.keys(attrOverride).length > 1) {
                                override.attributes.push(attrOverride);
                            }
                        }
                    }
                }

                const commandsProp = props.get("commands");

                if (commandsProp && ts.isArrayLiteralExpression(commandsProp)) {
                    override.commands = [];

                    for (const cmdElement of commandsProp.elements) {
                        if (ts.isObjectLiteralExpression(cmdElement)) {
                            const cmdProps = getObjectLiteralProperties(cmdElement);
                            const idExpr = cmdProps.get("id");

                            if (!idExpr) {
                                continue;
                            }

                            const id = expressionToValue(idExpr);
                            const cmdOverride: CommandOverride = {id};
                            const newPropsExpr = cmdProps.get("new");

                            if (newPropsExpr && ts.isObjectLiteralExpression(newPropsExpr)) {
                                const newValues: Partial<XMLCommandDefinition["$"]> = {};

                                for (const [key, val] of getObjectLiteralProperties(newPropsExpr).entries()) {
                                    newValues[key as keyof typeof newValues] = expressionToValue(val);
                                }

                                cmdOverride.new = newValues;
                            }

                            const paramsProp = cmdProps.get("parameters");

                            if (paramsProp && ts.isArrayLiteralExpression(paramsProp)) {
                                cmdOverride.parameters = [];

                                for (const p of paramsProp.elements) {
                                    if (ts.isObjectLiteralExpression(p)) {
                                        const pProps = getObjectLiteralProperties(p);
                                        const pNameExpr = pProps.get("name");

                                        if (!pNameExpr) {
                                            continue;
                                        }

                                        const pName = expressionToValue(pNameExpr);
                                        const pOverride: CommandParameterOverride = {name: pName};
                                        const pNewExpr = pProps.get("new");

                                        if (pNewExpr && ts.isObjectLiteralExpression(pNewExpr)) {
                                            const newValues: Partial<XMLFieldDefinition["$"]> = {};

                                            for (const [key, val] of getObjectLiteralProperties(pNewExpr).entries()) {
                                                newValues[key as keyof typeof newValues] = expressionToValue(val);
                                            }

                                            pOverride.new = newValues;
                                        }

                                        pOverride.restrictions = parseRestrictionOverrides(pProps.get("restrictions"));

                                        if (Object.keys(pOverride).length > 1) {
                                            cmdOverride.parameters.push(pOverride);
                                        }
                                    }
                                }
                            }

                            if (Object.keys(cmdOverride).length > 1) {
                                override.commands.push(cmdOverride);
                            }
                        }
                    }
                }

                overrides.push(override);
            }
        }
    }

    return overrides;
}

export function applyXmlOverrides(clusters: XMLCluster[], overrides: XmlOverride[]): void {
    if (overrides.length === 0) {
        return;
    }

    const overridesByCluster = new Map<number, XmlOverride>();

    for (const override of overrides) {
        overridesByCluster.set(override.clusterId, override);
    }

    const applyRestrictionOverrides = (
        target: {restriction?: XMLRestriction[]},
        restrictions: RestrictionOverride[] | undefined,
        logPrefix: string,
    ): void => {
        if (!restrictions) {
            return;
        }

        // 1. Ensure the base restriction object exists.
        if (!target.restriction) {
            target.restriction = [{}];
        }

        // biome-ignore lint/style/noNonNullAssertion: set above
        const targetRestriction = target.restriction[0]!;

        for (const r of restrictions) {
            const key = r.type as keyof XMLRestriction;

            // 2. Reflect on the target to see if the restriction key (e.g., "type:maxInclusive") already exists.
            if (Object.hasOwn(targetRestriction, key)) {
                // The restriction key exists, so we update it.
                // biome-ignore lint/style/noNonNullAssertion: checked with hasOwnProperty
                const existing = targetRestriction[key]!;

                if (existing.length > 1 && r.index === undefined) {
                    throw new Error(`${logPrefix}, restriction type '${r.type}' has multiple entries but no index was provided in override.`);
                }

                const index = r.index ?? 0;
                if (index >= existing.length) {
                    throw new Error(
                        `${logPrefix}, restriction type '${r.type}' override index ${index} is out of bounds for length ${existing.length}.`,
                    );
                }

                console.log(`${logPrefix}, restriction type '${r.type}[${index}]'`);
                Object.assign(existing[index].$, r.new);
            } else {
                // 3. The restriction key does NOT exist, so we create it.
                // This is a type-safe way to create the property with the correct structure.
                console.log(`${logPrefix}, restriction type '${r.type}': creating new`);
                targetRestriction[key] = [
                    {
                        // The 'new' object from the override becomes the content of the '$' property.
                        // biome-ignore lint/style/useNamingConvention: API
                        $: r.new,
                    },
                    // biome-ignore lint/suspicious/noExplicitAny: dynamically creating a known-good structure.
                ] as any;
            }
        }

        console.log(targetRestriction["type:maxInclusive"]);
    };

    for (const cluster of clusters) {
        const clusterId = Number.parseInt(cluster.$.id, 16);
        const override = overridesByCluster.get(clusterId);

        if (!override) {
            continue;
        }

        const sides = [
            {side: cluster.server, name: "server"},
            {side: cluster.client, name: "client"},
        ];

        for (const {side, name} of sides) {
            if (!side?.[0]) {
                continue;
            }

            if (override.attributes && side[0].attributes?.[0]?.attribute) {
                for (const attr of side[0].attributes[0].attribute) {
                    const attrId = Number.parseInt(attr.$.id, 16);
                    const attrOverride = override.attributes.find((a) => a.id === attrId);

                    if (!attrOverride) {
                        continue;
                    }

                    const logPrefix = `Applying override to cluster 0x${clusterId.toString(16).padStart(4, "0")}, ${name} attribute 0x${attrId
                        .toString(16)
                        .padStart(4, "0")}`;

                    if (attrOverride.new) {
                        console.log(`${logPrefix} (props)`);
                        Object.assign(attr.$, attrOverride.new);
                    }

                    applyRestrictionOverrides(attr, attrOverride.restrictions, logPrefix);
                }
            }

            if (override.commands && side[0].commands?.[0]?.command) {
                for (const cmd of side[0].commands[0].command) {
                    const cmdId = Number.parseInt(cmd.$.id, 16);
                    const cmdOverride = override.commands.find((c) => c.id === cmdId);

                    if (!cmdOverride) {
                        continue;
                    }

                    const logPrefix = `Applying override to cluster 0x${clusterId.toString(16).padStart(4, "0")}, ${name} command 0x${cmdId
                        .toString(16)
                        .padStart(2, "0")}`;

                    if (cmdOverride.new) {
                        console.log(`${logPrefix} (props)`);
                        Object.assign(cmd.$, cmdOverride.new);
                    }

                    if (cmdOverride.parameters && cmd.fields?.[0]?.field) {
                        for (const field of cmd.fields[0].field) {
                            const paramOverride = cmdOverride.parameters.find((p) => p.name === field.$.name);

                            if (!paramOverride) {
                                continue;
                            }

                            const paramLogPrefix = `${logPrefix}, parameter '${paramOverride.name}'`;

                            if (paramOverride.new) {
                                console.log(`${paramLogPrefix} (props)`);
                                Object.assign(field.$, paramOverride.new);
                            }

                            applyRestrictionOverrides(field, paramOverride.restrictions, paramLogPrefix);
                        }
                    }
                }
            }
        }
    }
}
