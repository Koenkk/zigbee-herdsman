/**
 * Usage:
 *   tsx scripts/check-zcl-clusters-changes.ts
 */

import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import type {ClusterDefinition, ClusterName} from "../src/zspec/zcl/definition/tstype";

// #region Types

type Loggable = string | number | undefined;

type ChangeType = "added" | "removed" | "changed";

type Change = {
    type: ChangeType;
    path: Loggable[];
    from?: Loggable;
    to?: Loggable;
};

// #endregion

// #region Config

const SCRIPT_DIR = fileURLToPath(new URL(".", import.meta.url));
const LOG_FILE = path.resolve(SCRIPT_DIR, "clusters-changes.log");
const CURRENT_FILE = path.resolve(SCRIPT_DIR, "../src/zspec/zcl/definition/cluster.ts");

// #endregion

// #region Helpers

/**
 * Creates a map from a name to an ID for a given record.
 */
function createIdMap<T extends {ID: number}>(record: Readonly<Record<string, T>>): Map<string, number> {
    const map = new Map<string, number>();

    for (const name in record) {
        map.set(name, record[name].ID);
    }

    return map;
}

/**
 * Creates a reverse map from an ID to a name for a given record.
 */
function createReverseIdMap<T extends {ID: number}>(record: Readonly<Record<string, T>>): Map<number, string> {
    const map = new Map<number, string>();

    for (const name in record) {
        map.set(record[name].ID, name);
    }

    return map;
}

function toHex(value: number, pad: number): string {
    return `0x${value.toString(16).padStart(pad, "0")}`;
}

/**
 * Formats a log entry for display.
 */
function formatChange(change: Change): string {
    const path = change.path.join(" > ");
    const hexTo = typeof change.to === "number" ? ` (${toHex(change.to, 4)})` : "";
    const hexFrom = typeof change.from === "number" ? ` (${toHex(change.from, 4)})` : "";

    switch (change.type) {
        case "added": {
            return `[ADDED]   ${path}: ${change.to}${hexTo}`;
        }
        case "removed": {
            return `[REMOVED] ${path}: ${change.from}${hexFrom}`;
        }
        case "changed": {
            return `[CHANGED] ${path}: ${change.from}${hexFrom} -> ${change.to}${hexTo}`;
        }
    }
}

// #endregion

// #region Comparison logic

class ClusterComparator {
    readonly #changes: Change[] = [];

    /**
     * Compares two records (like `attributes`, `commands`, etc.)
     */
    #compareRecords<T extends {ID: number; type?: unknown; parameters?: readonly {name: string; type: unknown}[]}>(
        oldRecord: Readonly<Record<string, T>> | undefined,
        newRecord: Readonly<Record<string, T>> | undefined,
        currentPath: Loggable[],
    ): void {
        oldRecord ??= {};
        newRecord ??= {};

        const oldIdMap = createIdMap(oldRecord);
        const newIdMap = createIdMap(newRecord);
        // const oldReverseIdMap = createReverseIdMap(oldRecord);
        const newReverseIdMap = createReverseIdMap(newRecord);

        // Check for removed and changed items
        for (const oldName of oldIdMap.keys()) {
            // biome-ignore lint/style/noNonNullAssertion: loop
            const oldId = oldIdMap.get(oldName)!;
            const oldItem = oldRecord[oldName];

            if (!newIdMap.has(oldName)) {
                const newNameForOldId = newReverseIdMap.get(oldId);

                if (newNameForOldId) {
                    // Renamed item
                    this.#changes.push({
                        type: "changed",
                        path: [...currentPath, "name", oldId],
                        from: oldName,
                        to: newNameForOldId,
                    });

                    // Continue comparison with the new name
                    this.#compareItems(oldItem, newRecord[newNameForOldId], [...currentPath, newNameForOldId]);
                } else {
                    // Removed item
                    this.#changes.push({type: "removed", path: [...currentPath, oldName], from: oldId});
                }
            } else {
                // Item exists in both, compare details
                this.#compareItems(oldItem, newRecord[oldName], [...currentPath, oldName]);
            }
        }

        // Check for added items
        for (const newName of newIdMap.keys()) {
            if (!oldIdMap.has(newName)) {
                // biome-ignore lint/style/noNonNullAssertion: checked above
                const newId = newIdMap.get(newName)!;

                // if (!oldReverseIdMap.has(newId)) {
                // Added item
                this.#changes.push({type: "added", path: [...currentPath, newName], to: newId});
                // }
            }
        }
    }

    /**
     * Compares two individual items (e.g., a specific attribute or command).
     */
    // biome-ignore lint/suspicious/noExplicitAny: dynamic
    #compareItems(oldItem: any, newItem: any, currentPath: Loggable[]): void {
        // Check ID change
        if (oldItem.ID !== newItem.ID) {
            this.#changes.push({type: "changed", path: [...currentPath, "ID"], from: oldItem.ID, to: newItem.ID});
        }

        // Check type change (for attributes)
        if ("type" in oldItem && "type" in newItem && oldItem.type !== newItem.type) {
            this.#changes.push({type: "changed", path: [...currentPath, "type"], from: oldItem.type, to: newItem.type});
        }

        // Check parameters (for commands)
        if ("parameters" in oldItem || "parameters" in newItem) {
            this.#compareParameters(oldItem.parameters, newItem.parameters, currentPath);
        }
    }

    /**
     * Compares the `parameters` array of two commands.
     */
    #compareParameters(
        oldParams: readonly {name: string; type: unknown}[] | undefined,
        newParams: readonly {name: string; type: unknown}[] | undefined,
        currentPath: Loggable[],
    ): void {
        oldParams ??= [];
        newParams ??= [];

        const oldParamsMap = new Map(oldParams.map((p) => [p.name, p]));
        const newParamsMap = new Map(newParams.map((p) => [p.name, p]));

        for (const [oldName, oldParam] of oldParamsMap) {
            const newParam = newParamsMap.get(oldName);
            const paramPath = [...currentPath, "parameters", oldName];

            if (newParam) {
                // Parameter exists in both, check type
                if (oldParam.type !== newParam.type) {
                    this.#changes.push({
                        type: "changed",
                        path: [...paramPath, "type"],
                        from: oldParam.type as string | number | undefined,
                        to: newParam.type as string | number | undefined,
                    });
                }
            } else {
                // Parameter removed
                this.#changes.push({type: "removed", path: paramPath});
            }
        }

        for (const newName of newParamsMap.keys()) {
            if (!oldParamsMap.has(newName)) {
                // Parameter added
                this.#changes.push({type: "added", path: [...currentPath, "parameters", newName]});
            }
        }
    }

    /**
     * Runs the full comparison between two `Clusters` definitions.
     */
    public run(
        oldClusters: Readonly<Record<ClusterName, Readonly<ClusterDefinition>>>,
        newClusters: Readonly<Record<ClusterName, Readonly<ClusterDefinition>>>,
    ): Change[] {
        this.#changes.length = 0;
        const rootPath: Loggable[] = ["Clusters"];

        this.#compareRecords(oldClusters, newClusters, rootPath);

        // After the main comparison based on names, check for deeper changes in matching clusters
        for (const clusterName in newClusters) {
            if (clusterName in oldClusters) {
                const oldCluster = oldClusters[clusterName as ClusterName];
                const newCluster = newClusters[clusterName as ClusterName];
                const clusterPath = [...rootPath, clusterName];

                // Attributes
                this.#compareRecords(oldCluster.attributes, newCluster.attributes, [...clusterPath, "attributes"]);

                // Commands
                this.#compareRecords(oldCluster.commands, newCluster.commands, [...clusterPath, "commands"]);

                // Command Responses
                this.#compareRecords(oldCluster.commandsResponse, newCluster.commandsResponse, [...clusterPath, "commandsResponse"]);
            }
        }

        return this.#changes;
    }
}

// #endregion

// #region Main

async function main(): Promise<void> {
    console.log("Starting ZCL cluster definition comparison...");

    const oldFilePathArg = process.argv[2];

    if (!oldFilePathArg) {
        console.error("ERROR: Missing required argument.");
        console.error("Usage: tsx scripts/check-zcl-clusters-changes.ts <path-to-old-cluster-file>");
        process.exit(1);
    }

    const oldFilePath = path.resolve(process.cwd(), oldFilePathArg);

    try {
        await fs.access(oldFilePath);
    } catch {
        console.error(`ERROR: Old file not found at: ${oldFilePath}`);
        process.exit(1);
    }

    // Dynamically import both files using file:// URLs to ensure Windows compatibility
    const {Clusters: newClusters} = await import(pathToFileURL(CURRENT_FILE).href);
    const {Clusters: oldClusters} = await import(pathToFileURL(oldFilePath).href);

    // Perform comparison
    const comparator = new ClusterComparator();
    const changes = comparator.run(oldClusters, newClusters);

    // Output results
    if (changes.length === 0) {
        const message = "No changes detected between the two cluster definition files.";
        console.log(message);
        await fs.writeFile(LOG_FILE, `${message}\n`, "utf8");
        return;
    }

    const logHeader = `Comparison complete. Found ${changes.length} changes.
Compared:
  - OLD: ${oldFilePath}
  - NEW: ${CURRENT_FILE}
--------------------------------------------------\n\n`;

    const formattedChanges: string[] = [];

    for (const change of changes) {
        if (change.type !== "added") {
            formattedChanges.push(formatChange(change));
        }
    }

    formattedChanges.push("");

    for (const change of changes) {
        if (change.type === "added") {
            formattedChanges.push(formatChange(change));
        }
    }

    const logContent = [logHeader, ...formattedChanges].join("\n");

    await fs.writeFile(LOG_FILE, logContent, "utf8");

    console.log(`\nComparison complete. Found ${changes.length} changes.`);
    console.log(`See the full report in: ${LOG_FILE}`);
}

main().catch((error) => {
    console.error("An unexpected error occurred:", error);
    process.exit(1);
});

// #endregion
