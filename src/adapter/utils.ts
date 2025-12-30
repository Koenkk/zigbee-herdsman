import assert from "node:assert";
import {existsSync, readFileSync} from "node:fs";
import {urlToHttpOptions} from "node:url";
import type * as Models from "../models";

export function isTcpPath(path: string): boolean {
    try {
        // validation as side-effect
        new URL(path);

        return true;
    } catch {
        return false;
    }
}

export function parseTcpPath(path: string): {host: string; port: number} {
    const info = urlToHttpOptions(new URL(path));

    // urlToHttpOptions has a weird return type, extra validation doesn't hurt
    assert(info.hostname && info.port);

    return {
        host: info.hostname,
        port: Number(info.port),
    };
}

export function readBackup(path: string): Models.UnifiedBackupStorage | Models.LegacyBackupStorage | undefined {
    if (!existsSync(path)) {
        return undefined;
    }

    try {
        return JSON.parse(readFileSync(path).toString());
    } catch (error) {
        throw new Error(
            `[BACKUP] Coordinator backup is corrupted. This can happen due to filesystem corruption. To re-create the backup, delete '${path}' and start again. (${(error as Error).stack})`,
        );
    }
}
