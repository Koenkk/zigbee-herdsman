import {existsSync, readFileSync} from "node:fs";
import type * as Models from "../models";

export function isTcpPath(path: string): boolean {
    // tcp path must be:
    // tcp://<host>:<port>
    const regex = /^(?:tcp:\/\/)[\w.-]+[:][\d]+$/gm;
    return regex.test(path);
}

export function parseTcpPath(path: string): {host: string; port: number} {
    // built-in extra validation
    const info = new URL(path);

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
