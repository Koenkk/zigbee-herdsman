import {TsType} from "../../";
import {ZnpVersion} from "../adapter/tstype";

export interface StartupOptions {
    version: ZnpVersion;
    networkOptions: TsType.NetworkOptions;
    greenPowerGroup: number;
    backupPath: string;
}
