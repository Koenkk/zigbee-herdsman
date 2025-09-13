import type {XmlOverride} from "./zap-clusters-overrides.js";

/**
 * This file contains overrides for the raw XML data before it is parsed into the ZCL format.
 * Use this to correct errors in the source XML files.
 */
export const OVERRIDES: XmlOverride[] = [
    {
        clusterId: 0x0102, // Closures
        attributes: [
            // Original incorrect ID for "InstalledOpenLimitLift"
            {id: 0x0100, new: {id: "0010"}},
            // Original incorrect ID for "InstalledClosedLimitLift"
            {id: 0x0101, new: {id: "0011"}},
            // Original incorrect ID for "InstalledOpenLimitTilt"
            {id: 0x0102, new: {id: "0012"}},
            // Original incorrect ID for "InstalledClosedLimitTilt"
            {id: 0x0103, new: {id: "0013"}},
            // Original incorrect ID for "VelocityLift"
            {id: 0x0104, new: {id: "0014"}},
            // Original incorrect ID for "AccelerationTimeLift"
            {id: 0x0105, new: {id: "0015"}},
            // Original incorrect ID for "DecelerationTimeLift"
            {id: 0x0106, new: {id: "0016"}},
            // Original incorrect ID for "Mode"
            {id: 0x0107, new: {id: "0017"}},
            // Original incorrect ID for "IntermediateSetpointsLift"
            {id: 0x0108, new: {id: "0018"}},
            // Original incorrect ID for "IntermediateSetpointsTilt"
            {id: 0x0109, new: {id: "0019"}},
        ],
    },
];
