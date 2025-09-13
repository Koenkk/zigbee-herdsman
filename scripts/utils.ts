import ts from "typescript";

export function createHexIdTransformer(): ts.TransformerFactory<ts.SourceFile> {
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
