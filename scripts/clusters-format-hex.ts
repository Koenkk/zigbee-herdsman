/**
 * Script: Format numeric IDs to hexadecimal in src/zspec/zcl/definition/cluster.ts
 *
 * Usage:
 *    tsx scripts/hex-id-formatter.ts
 */

import {promises as fs} from "node:fs";
import process from "node:process";
import ts from "typescript";
import {createHexIdTransformer} from "./utils.js";

async function main(): Promise<void> {
    const clusterFile = "src/zspec/zcl/definition/cluster.ts";

    console.log(`Formatting IDs in ${clusterFile} to hexadecimal...`);

    const fileContent = await fs.readFile(clusterFile, "utf8");
    const sourceFile = ts.createSourceFile(clusterFile, fileContent, ts.ScriptTarget.Latest, true);
    const hexTransformer = createHexIdTransformer();
    const result = ts.transform(sourceFile, [hexTransformer]);
    const finalSourceFile = result.transformed[0];
    const printer = ts.createPrinter({newLine: ts.NewLineKind.LineFeed, removeComments: false});
    let newContent = printer.printFile(finalSourceFile);
    // help biome re-format
    newContent = newContent.replaceAll("{\n                ID:", "{ID:");
    newContent = newContent.replaceAll("{\n                        name:", "{name:");

    await fs.writeFile(clusterFile, newContent, "utf8");

    console.log(`Successfully formatted IDs in ${clusterFile}.`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
