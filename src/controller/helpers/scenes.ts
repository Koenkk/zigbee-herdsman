import {Zcl} from "src";
import type {ExtensionFieldSet} from "../../zspec/zcl/definition/tstype";
import type {Clusters, Scene} from "../model/endpoint";
import type {Immutable, ImmutableArray} from "../tstype";

/**
 * Deep-clone a Scene object
 */
export function cloneScene(existing: Scene): Scene {
    const clonedScene: Scene = {name: existing.name, state: {}, enhanced: existing.enhanced, transitionTime: existing.transitionTime};

    for (const cluster in existing.state) {
        // @ts-expect-error dynamic cloning
        clonedScene.state[cluster as keyof typeof existing.state] = {
            ...existing.state[cluster as keyof typeof existing.state],
        };
    }

    return clonedScene;
}

export function makeSceneState(extFieldSets: ImmutableArray<ExtensionFieldSet>): Scene["state"] {
    const sceneState: Scene["state"] = {};

    // first in list is always expected, after can be omitted but has to remain sequentially valid, hence stop on first undefined
    // we expect that if a cluster is present, at least one value should be too (though use fallback just in case)
    for (const set of extFieldSets) {
        const clusterId = set.clstId;

        switch (clusterId) {
            case Zcl.Clusters.genOnOff.ID: {
                sceneState.genOnOff = {onOff: set.extField[0] ?? 0};

                break;
            }

            case Zcl.Clusters.genLevelCtrl.ID: {
                sceneState.genLevelCtrl = {currentLevel: set.extField[0] ?? 0};

                break;
            }

            case Zcl.Clusters.closuresWindowCovering.ID: {
                const state: Scene["state"]["closuresWindowCovering"] = {currentPositionLiftPercentage: set.extField[0] ?? 0};
                const currentPositionTiltPercentage = set.extField[1];

                if (currentPositionTiltPercentage !== undefined) {
                    state.currentPositionTiltPercentage = currentPositionTiltPercentage;
                }

                sceneState.closuresWindowCovering = state;

                break;
            }

            case Zcl.Clusters.barrierControl.ID: {
                sceneState.barrierControl = {barrierPosition: set.extField[0] ?? 0};

                break;
            }

            case Zcl.Clusters.hvacThermostat.ID: {
                const state: Scene["state"]["hvacThermostat"] = {occupiedCoolingSetpoint: set.extField[0] ?? 0};
                const occupiedHeatingSetpoint = set.extField[1];

                if (occupiedHeatingSetpoint !== undefined) {
                    state.occupiedHeatingSetpoint = occupiedHeatingSetpoint;
                    const systemMode = set.extField[2];

                    if (systemMode !== undefined) {
                        state.systemMode = systemMode;
                    }
                }

                sceneState.hvacThermostat = state;

                break;
            }

            case Zcl.Clusters.lightingColorCtrl.ID: {
                const state: Scene["state"]["lightingColorCtrl"] = {currentX: set.extField[0] ?? 0};
                const currentY = set.extField[1];

                if (currentY !== undefined) {
                    state.currentY = currentY;
                    const enhancedCurrentHue = set.extField[2];

                    if (enhancedCurrentHue !== undefined) {
                        state.enhancedCurrentHue = enhancedCurrentHue;
                        const currentSaturation = set.extField[3];

                        if (currentSaturation !== undefined) {
                            state.currentSaturation = currentSaturation;
                            const colorLoopActive = set.extField[4];

                            if (colorLoopActive !== undefined) {
                                state.colorLoopActive = colorLoopActive;
                                const colorLoopDirection = set.extField[5];

                                if (colorLoopDirection !== undefined) {
                                    state.colorLoopDirection = colorLoopDirection;
                                    const colorLoopTime = set.extField[6];

                                    if (colorLoopTime !== undefined) {
                                        state.colorLoopTime = colorLoopTime;
                                        const colorTemperature = set.extField[7];

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

export function makeExtensionFieldSets(clusters: Immutable<Clusters>): ExtensionFieldSet[] {
    const extensionFieldSets: ExtensionFieldSet[] = [];

    if (clusters.genOnOff?.attributes !== undefined) {
        extensionFieldSets.push({
            clstId: Zcl.Clusters.genOnOff.ID,
            len: 1,
            extField: [clusters.genOnOff.attributes.onOff ?? 0],
        });
    }

    if (clusters.genLevelCtrl?.attributes !== undefined) {
        extensionFieldSets.push({
            clstId: Zcl.Clusters.genLevelCtrl.ID,
            len: 1,
            extField: [clusters.genLevelCtrl.attributes.currentLevel ?? 0],
        });
    }

    if (clusters.closuresWindowCovering?.attributes !== undefined) {
        const fieldSet: ExtensionFieldSet = {
            clstId: Zcl.Clusters.closuresWindowCovering.ID,
            len: 1,
            extField: [clusters.closuresWindowCovering.attributes.currentPositionLiftPercentage ?? 0],
        };

        const currentPositionTiltPercentage = clusters.closuresWindowCovering.attributes.currentPositionTiltPercentage;

        if (currentPositionTiltPercentage !== undefined) {
            fieldSet.extField.push(currentPositionTiltPercentage);
            fieldSet.len += 1;
        }

        extensionFieldSets.push(fieldSet);
    }

    if (clusters.barrierControl?.attributes !== undefined) {
        extensionFieldSets.push({
            clstId: Zcl.Clusters.barrierControl.ID,
            len: 1,
            extField: [clusters.barrierControl.attributes.barrierPosition ?? 0],
        });
    }

    if (clusters.hvacThermostat?.attributes !== undefined) {
        const fieldSet: ExtensionFieldSet = {
            clstId: Zcl.Clusters.hvacThermostat.ID,
            len: 2,
            extField: [clusters.hvacThermostat.attributes.occupiedCoolingSetpoint ?? 0],
        };
        const occupiedHeatingSetpoint = clusters.hvacThermostat.attributes.occupiedHeatingSetpoint;

        if (occupiedHeatingSetpoint !== undefined) {
            fieldSet.extField.push(occupiedHeatingSetpoint);
            fieldSet.len += 2;
            const systemMode = clusters.hvacThermostat.attributes.systemMode;

            if (systemMode !== undefined) {
                fieldSet.extField.push(systemMode);
                fieldSet.len += 1;
            }
        }

        extensionFieldSets.push(fieldSet);
    }

    if (clusters.lightingColorCtrl?.attributes !== undefined) {
        const fieldSet: ExtensionFieldSet = {
            clstId: Zcl.Clusters.lightingColorCtrl.ID,
            len: 2,
            extField: [clusters.lightingColorCtrl.attributes.currentX ?? 0],
        };
        const currentY = clusters.lightingColorCtrl.attributes.currentY;

        if (currentY !== undefined) {
            fieldSet.extField.push(currentY);
            fieldSet.len += 2;
            const enhancedCurrentHue = clusters.lightingColorCtrl.attributes.enhancedCurrentHue;

            if (enhancedCurrentHue !== undefined) {
                fieldSet.extField.push(enhancedCurrentHue);
                fieldSet.len += 2;
                const currentSaturation = clusters.lightingColorCtrl.attributes.currentSaturation;

                if (currentSaturation !== undefined) {
                    fieldSet.extField.push(currentSaturation);
                    fieldSet.len += 1;
                    const colorLoopActive = clusters.lightingColorCtrl.attributes.colorLoopActive;

                    if (colorLoopActive !== undefined) {
                        fieldSet.extField.push(colorLoopActive);
                        fieldSet.len += 1;
                        const colorLoopDirection = clusters.lightingColorCtrl.attributes.colorLoopDirection;

                        if (colorLoopDirection !== undefined) {
                            fieldSet.extField.push(colorLoopDirection);
                            fieldSet.len += 1;
                            const colorLoopTime = clusters.lightingColorCtrl.attributes.colorLoopTime;

                            if (colorLoopTime !== undefined) {
                                fieldSet.extField.push(colorLoopTime);
                                fieldSet.len += 2;
                                const colorTemperature = clusters.lightingColorCtrl.attributes.colorTemperature;

                                if (colorTemperature !== undefined) {
                                    fieldSet.extField.push(colorTemperature);
                                    fieldSet.len += 2;
                                }
                            }
                        }
                    }
                }
            }
        }

        extensionFieldSets.push(fieldSet);
    }

    return extensionFieldSets;
}
