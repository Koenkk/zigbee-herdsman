import type {TClusterAttributes, TClusters, TPartialClusterAttributes} from "../zspec/zcl/definition/clusters-types";
import type {DataType} from "../zspec/zcl/definition/enums";

export interface KeyValue {
    // biome-ignore lint/suspicious/noExplicitAny: API
    [s: string]: any;
}

/**
 * Send request policies:
 * - 'bulk':           Message must be sent together with other messages in the correct sequence.
 *                     No immediate delivery required.
 * - 'queue':          Request shall be sent 'as-is' as soon as possible.
 *                     Multiple identical requests shall be delivered multiple times.
 *                     Not strict ordering required.
 * - 'immediate':      Request shall be sent immediately and not be kept for later retries (e.g. response message).
 * - 'keep-payload':   Request shall be sent as soon as possible.
 *                     If immediate delivery fails, the exact same payload is only sent once, even if there were
 *                     multiple requests.
 * - 'keep-command':   Request shall be sent as soon as possible.
 *                     If immediate delivery fails, only the latest command for each command ID is kept for delivery.
 * - 'keep-cmd-undiv': Request shall be sent as soon as possible.
 *                     If immediate delivery fails, only the latest undivided set of commands is sent for each unique
 *                     set of command IDs.
 */
export type SendPolicy = "bulk" | "queue" | "immediate" | "keep-payload" | "keep-command" | "keep-cmd-undiv";
export type DeviceType = "Coordinator" | "Router" | "EndDevice" | "Unknown" | "GreenPower";

export type EntityType = DeviceType | "Group";

export interface DatabaseEntry {
    id: number;
    type: EntityType;
    // biome-ignore lint/suspicious/noExplicitAny: API
    [s: string]: any;
}

export interface GreenPowerDeviceJoinedPayload {
    sourceID: number;
    deviceID: number;
    networkAddress: number;
    securityKey?: Buffer;
}

export interface TCustomCluster {
    attributes: Record<string, unknown> | never;
    commands: Record<string, Record<string, unknown | never>> | never;
    commandResponses: Record<string, Record<string, unknown | never>> | never;
}

export type RawClusterAttribute = {value: unknown; type: DataType};

export type RawClusterAttributes = Record<number, RawClusterAttribute>;

// below Cluster types follow roughly the same logic:
//   - if cluster has attributes/commands/commandsResponse
//     - if Custom is defined and has attributes/commands/commandsResponse, use Custom and/or raw
//     - else use raw
//   - else
//     - if cluster is ZCL
//       - if Custom is defined and has attributes/commands/commandsResponse, use Custom and/or ZCL and/or raw
//       - else use ZCL and/or raw
//     - else
//       - if Custom is defined, use Custom and/or raw
//       - else use raw
//
// where `raw` represents the type used for full manual input (usually using ID)

export type ClusterOrRawAttributeKeys<
    Cl extends string | number,
    Custom extends TCustomCluster | undefined = undefined,
> = TClusterAttributes<Cl> extends never
    ? Custom extends TCustomCluster
        ? Custom["attributes"] extends never
            ? number[]
            : (keyof Custom["attributes"] | number)[]
        : number[]
    : Cl extends keyof TClusters
      ? Custom extends TCustomCluster
          ? Custom["attributes"] extends never
              ? // don't use `TClusterAttributeKeys<Cl>` as that allows "symbol"
                (keyof TClusters[Cl]["attributes"] | number)[]
              : (keyof Custom["attributes"] | keyof TClusters[Cl]["attributes"] | number)[]
          : (keyof TClusters[Cl]["attributes"] | number)[]
      : Custom extends TCustomCluster
        ? Custom["attributes"] extends never
            ? number[]
            : (keyof Custom["attributes"] | number)[]
        : number[];

export type ClusterOrRawWriteAttributes<
    Cl extends string | number,
    Custom extends TCustomCluster | undefined = undefined,
> = TClusterAttributes<Cl> extends never
    ? Custom extends TCustomCluster
        ? Custom["attributes"] extends never
            ? RawClusterAttributes
            : Custom["attributes"] & RawClusterAttributes
        : RawClusterAttributes
    : Cl extends keyof TClusters
      ? (Custom extends TCustomCluster
            ? Custom["attributes"] extends never
                ? TClusterAttributes<Cl>
                : Custom["attributes"] & TClusterAttributes<Cl>
            : TClusterAttributes<Cl>) &
            RawClusterAttributes
      : Custom extends TCustomCluster
        ? Custom["attributes"] extends never
            ? RawClusterAttributes
            : Custom["attributes"] & RawClusterAttributes
        : RawClusterAttributes;

export type PartialClusterOrRawWriteAttributes<
    Cl extends string | number,
    Custom extends TCustomCluster | undefined = undefined,
> = TClusterAttributes<Cl> extends never
    ? Custom extends TCustomCluster
        ? Custom["attributes"] extends never
            ? RawClusterAttributes
            : Partial<Custom["attributes"]> & RawClusterAttributes
        : RawClusterAttributes
    : Cl extends keyof TClusters
      ? (Custom extends TCustomCluster
            ? Custom["attributes"] extends never
                ? TPartialClusterAttributes<Cl>
                : Partial<Custom["attributes"]> & TPartialClusterAttributes<Cl>
            : TPartialClusterAttributes<Cl>) &
            RawClusterAttributes
      : Custom extends TCustomCluster
        ? Custom["attributes"] extends never
            ? RawClusterAttributes
            : Partial<Custom["attributes"]> & RawClusterAttributes
        : RawClusterAttributes;

export type ClusterOrRawAttributes<
    Cl extends string | number,
    Custom extends TCustomCluster | undefined = undefined,
> = TClusterAttributes<Cl> extends never
    ? Custom extends TCustomCluster
        ? Custom["attributes"] extends never
            ? Record<number, unknown>
            : Custom["attributes"] & Record<number, unknown>
        : Record<number, unknown>
    : Cl extends keyof TClusters
      ? (Custom extends TCustomCluster
            ? Custom["attributes"] extends never
                ? TClusterAttributes<Cl>
                : Custom["attributes"] & TClusterAttributes<Cl>
            : TClusterAttributes<Cl>) &
            Record<number, unknown>
      : Custom extends TCustomCluster
        ? Custom["attributes"] extends never
            ? Record<number, unknown>
            : Custom["attributes"] & Record<number, unknown>
        : Record<number, unknown>;

export type PartialClusterOrRawAttributes<
    Cl extends string | number,
    Custom extends TCustomCluster | undefined = undefined,
> = TClusterAttributes<Cl> extends never
    ? Custom extends TCustomCluster
        ? Custom["attributes"] extends never
            ? Record<number, unknown>
            : Partial<Custom["attributes"]> & Record<number, unknown>
        : Record<number, unknown>
    : Cl extends keyof TClusters
      ? (Custom extends TCustomCluster
            ? Custom["attributes"] extends never
                ? TPartialClusterAttributes<Cl>
                : Partial<Custom["attributes"]> & TPartialClusterAttributes<Cl>
            : TPartialClusterAttributes<Cl>) &
            Record<number, unknown>
      : Custom extends TCustomCluster
        ? Custom["attributes"] extends never
            ? Record<number, unknown>
            : Partial<Custom["attributes"]> & Record<number, unknown>
        : Record<number, unknown>;
