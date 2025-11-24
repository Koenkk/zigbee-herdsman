import {logger} from "../../utils/logger";
import * as Zcl from "../../zspec/zcl";
import type {TFoundation} from "../../zspec/zcl/definition/clusters-types";
import type {Cluster, CustomClusters, ExtensionFieldSet} from "../../zspec/zcl/definition/tstype";
import type {Scene} from "../model/endpoint";
import type {ClusterOrRawWriteAttributes, TCustomCluster} from "../tstype";

const NS = "zh:controller:zcl";

// Legrand devices (e.g. 4129) fail to set the manufacturerSpecific flag and
// manufacturerCode in the frame header, despite using specific attributes.
// This leads to incorrect reported attribute names.
// Remap the attributes using the target device's manufacturer ID
// if the header is lacking the information.
function getCluster(frame: Zcl.Frame, deviceManufacturerID: number | undefined, customClusters: CustomClusters): Cluster {
    let cluster = frame.cluster;
    if (!frame?.header?.manufacturerCode && frame?.cluster && deviceManufacturerID === Zcl.ManufacturerCode.LEGRAND_GROUP) {
        cluster = Zcl.Utils.getCluster(frame.cluster.ID, deviceManufacturerID, customClusters);
    }
    return cluster;
}

function attributeKeyValue<Cl extends number | string, Custom extends TCustomCluster | undefined = undefined>(
    frame: Zcl.Frame,
    deviceManufacturerID: number | undefined,
    customClusters: CustomClusters,
): ClusterOrRawWriteAttributes<Cl, Custom> {
    const payload: Record<string | number, unknown> = {};
    const cluster = getCluster(frame, deviceManufacturerID, customClusters);

    // TODO: remove this type once Zcl.Frame is typed
    for (const item of frame.payload as TFoundation["report" | "write" | "readRsp"]) {
        const attribute = cluster.getAttribute(item.attrId);

        if (attribute) {
            try {
                const attrData = Zcl.Utils.processAttributePostRead(attribute, item.attrData);

                payload[attribute.name] = attrData;
            } catch (error) {
                logger.debug(`Ignoring attribute ${attribute.name} from response: ${error}`, NS);
            }
        } else {
            payload[item.attrId] = item.attrData;
        }
    }

    return payload as ClusterOrRawWriteAttributes<Cl, Custom>;
}

function attributeList(frame: Zcl.Frame, deviceManufacturerID: number | undefined, customClusters: CustomClusters): Array<string | number> {
    const payload: Array<string | number> = [];
    const cluster = getCluster(frame, deviceManufacturerID, customClusters);

    // TODO: remove this type once Zcl.Frame is typed
    for (const item of frame.payload as TFoundation["read"]) {
        const attribute = cluster.getAttribute(item.attrId);

        payload.push(attribute?.name ?? item.attrId);
    }

    return payload;
}

// to/from: first in list is always expected, after can be omitted but has to remain sequentially valid, hence stop on first undefined
//          we expect that if a cluster is present, at least one value should be too (though use fallback just in case)
// XXX: use non-value instead of `0` for fallback? (edge-case)
function sceneFromExtensionFieldSets(extFieldSets: ExtensionFieldSet[]): Scene["state"] {
    const sceneState: Scene["state"] = {};

    for (const set of extFieldSets) {
        const clusterId = set.clstId;

        switch (clusterId) {
            case Zcl.Clusters.genOnOff.ID: {
                sceneState.genOnOff = {onOff: (set.extField[0] as number | undefined) ?? 0};

                break;
            }

            case Zcl.Clusters.genLevelCtrl.ID: {
                sceneState.genLevelCtrl = {currentLevel: (set.extField[0] as number | undefined) ?? 0};

                break;
            }

            case Zcl.Clusters.closuresWindowCovering.ID: {
                const state: Scene["state"]["closuresWindowCovering"] = {currentPositionLiftPercentage: (set.extField[0] as number | undefined) ?? 0};
                const currentPositionTiltPercentage = set.extField[1] as number | undefined;

                if (currentPositionTiltPercentage !== undefined) {
                    state.currentPositionTiltPercentage = currentPositionTiltPercentage;
                }

                sceneState.closuresWindowCovering = state;

                break;
            }

            case Zcl.Clusters.barrierControl.ID: {
                sceneState.barrierControl = {barrierPosition: (set.extField[0] as number | undefined) ?? 0};

                break;
            }

            case Zcl.Clusters.hvacThermostat.ID: {
                const state: Scene["state"]["hvacThermostat"] = {occupiedCoolingSetpoint: (set.extField[0] as number | undefined) ?? 0};
                const occupiedHeatingSetpoint = set.extField[1] as number | undefined;

                if (occupiedHeatingSetpoint !== undefined) {
                    state.occupiedHeatingSetpoint = occupiedHeatingSetpoint;
                    const systemMode = set.extField[2] as number | undefined;

                    if (systemMode !== undefined) {
                        state.systemMode = systemMode;
                    }
                }

                sceneState.hvacThermostat = state;

                break;
            }

            case Zcl.Clusters.lightingColorCtrl.ID: {
                const state: Scene["state"]["lightingColorCtrl"] = {currentX: (set.extField[0] as number | undefined) ?? 0};
                const currentY = set.extField[1] as number | undefined;

                if (currentY !== undefined) {
                    state.currentY = currentY;
                    const enhancedCurrentHue = set.extField[2] as number | undefined;

                    if (enhancedCurrentHue !== undefined) {
                        state.enhancedCurrentHue = enhancedCurrentHue;
                        const currentSaturation = set.extField[3] as number | undefined;

                        if (currentSaturation !== undefined) {
                            state.currentSaturation = currentSaturation;
                            const colorLoopActive = set.extField[4] as number | undefined;

                            if (colorLoopActive !== undefined) {
                                state.colorLoopActive = colorLoopActive;
                                const colorLoopDirection = set.extField[5] as number | undefined;

                                if (colorLoopDirection !== undefined) {
                                    state.colorLoopDirection = colorLoopDirection;
                                    const colorLoopTime = set.extField[6] as number | undefined;

                                    if (colorLoopTime !== undefined) {
                                        state.colorLoopTime = colorLoopTime;
                                        const colorTemperature = set.extField[7] as number | undefined;

                                        if (colorTemperature !== undefined) {
                                            state.colorTemperature = colorTemperature;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                sceneState.lightingColorCtrl = state;

                break;
            }
        }
    }

    return sceneState;
}

export {attributeKeyValue, attributeList, sceneFromExtensionFieldSets};
