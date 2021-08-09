import {TsType} from "../../";
import {ZnpVersion} from "../adapter/tstype";

/**
 * Startup options structure is used by `zStackAdapter` to pass configuration to adapter manager.
 */
export interface StartupOptions {
    version: ZnpVersion;
    networkOptions: TsType.NetworkOptions;
    greenPowerGroup: number;
    backupPath: string;
    adapterOptions: TsType.AdapterOptions;
}
