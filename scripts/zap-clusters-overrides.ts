import ts from "typescript";
import type {XMLAttributeDefinition, XMLCluster, XMLCommandDefinition} from "./zap-update-clusters.js";

export type XmlOverride = {
    clusterId: number;
    attributes?: {
        id: number;
        new: Partial<XMLAttributeDefinition["$"]>;
    }[];
    commands?: {
        id: number;
        new: Partial<XMLCommandDefinition["$"]>;
    }[];
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
function expressionToValue(expr: ts.Expression): any {
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
                // biome-ignore lint/style/noNonNullAssertion: typed
                const clusterId = expressionToValue(props.get("clusterId")!);

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
                            // biome-ignore lint/style/noNonNullAssertion: typed
                            const id = expressionToValue(attrProps.get("id")!);
                            const newProps = attrProps.get("new");

                            if (id !== undefined && newProps && ts.isObjectLiteralExpression(newProps)) {
                                const newValues: Partial<XMLAttributeDefinition["$"]> = {};

                                for (const [key, val] of getObjectLiteralProperties(newProps)) {
                                    newValues[key as keyof typeof newValues] = expressionToValue(val);
                                }

                                override.attributes.push({id, new: newValues});
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
                            // biome-ignore lint/style/noNonNullAssertion: typed
                            const id = expressionToValue(cmdProps.get("id")!);
                            const newProps = cmdProps.get("new");

                            if (id !== undefined && newProps && ts.isObjectLiteralExpression(newProps)) {
                                const newValues: Partial<XMLCommandDefinition["$"]> = {};

                                for (const [key, val] of getObjectLiteralProperties(newProps)) {
                                    newValues[key as keyof typeof newValues] = expressionToValue(val);
                                }

                                override.commands.push({id, new: newValues});
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

    const overridesByCluster = new Map<number, XmlOverride[]>();

    for (const override of overrides) {
        if (!overridesByCluster.has(override.clusterId)) {
            overridesByCluster.set(override.clusterId, []);
        }

        // biome-ignore lint/style/noNonNullAssertion: set above
        overridesByCluster.get(override.clusterId)!.push(override);
    }

    for (const cluster of clusters) {
        const clusterId = Number.parseInt(cluster.$.id, 16);
        const clusterOverrides = overridesByCluster.get(clusterId);

        if (!clusterOverrides) {
            continue;
        }

        for (const override of clusterOverrides) {
            if (override.attributes && cluster.server?.[0]?.attributes?.[0]?.attribute) {
                for (const attrOverride of override.attributes) {
                    for (const attribute of cluster.server[0].attributes[0].attribute) {
                        const attributeId = Number.parseInt(attribute.$.id, 16);

                        if (attributeId === attrOverride.id) {
                            console.log(`Applying override to cluster 0x${clusterId.toString(16)}, attribute 0x${attributeId.toString(16)}`);
                            Object.assign(attribute.$, attrOverride.new);
                        }
                    }
                }
            }

            if (override.commands && cluster.server?.[0]?.commands?.[0]?.command) {
                for (const cmdOverride of override.commands) {
                    for (const command of cluster.server[0].commands[0].command) {
                        const commandId = Number.parseInt(command.$.id, 16);

                        if (commandId === cmdOverride.id) {
                            console.log(`Applying override to cluster 0x${clusterId.toString(16)}, command 0x${commandId.toString(16)}`);
                            Object.assign(command.$, cmdOverride.new);
                        }
                    }
                }
            }
        }
    }
}
