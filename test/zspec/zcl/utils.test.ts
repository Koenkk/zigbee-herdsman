import {describe, expect, it} from "vitest";
import * as Zcl from "../../../src/zspec/zcl";
import {ZCL_TYPE_INVALID_BY_TYPE} from "../../../src/zspec/zcl/definition/datatypes";
import type {Attribute, Command, CustomClusters, Parameter} from "../../../src/zspec/zcl/definition/tstype";

const CUSTOM_CLUSTERS: CustomClusters = {
    genBasic: {ID: Zcl.Clusters.genBasic.ID, commands: {}, commandsResponse: {}, attributes: {myCustomAttr: {ID: 65533, type: Zcl.DataType.UINT8}}},
    myCustomCluster: {ID: 65534, commands: {}, commandsResponse: {}, attributes: {myCustomAttr: {ID: 65533, type: Zcl.DataType.UINT8}}},
    myCustomClusterManuf: {
        ID: 65533,
        manufacturerCode: 65534,
        commands: {},
        commandsResponse: {},
        attributes: {myCustomAttr: {ID: 65533, type: Zcl.DataType.UINT8}},
    },
    manuSpecificProfalux1NoManuf: {
        ID: Zcl.Clusters.manuSpecificProfalux1.ID,
        commands: {},
        commandsResponse: {},
        attributes: {myCustomAttr: {ID: 65533, type: Zcl.DataType.UINT8}},
    },
};

describe("ZCL Utils", () => {
    it("Creates status error", () => {
        const zclError = new Zcl.StatusError(Zcl.Status.ABORT);

        expect(zclError).toBeInstanceOf(Zcl.StatusError);
        expect(zclError.code).toStrictEqual(Zcl.Status.ABORT);
        expect(zclError.message).toStrictEqual(`Status '${Zcl.Status[Zcl.Status.ABORT]}'`);
    });

    it("Gets data type class", () => {
        expect(Zcl.Utils.getDataTypeClass(Zcl.DataType.UINT16)).toStrictEqual(Zcl.DataTypeClass.ANALOG);
        expect(Zcl.Utils.getDataTypeClass(Zcl.DataType.DATA16)).toStrictEqual(Zcl.DataTypeClass.DISCRETE);
        expect(() => {
            Zcl.Utils.getDataTypeClass(Zcl.DataType.NO_DATA);
        }).toThrow();
    });

    it.each([
        [
            "by ID",
            {key: Zcl.Clusters.genBasic.ID, manufacturerCode: undefined, customClusters: {}},
            {cluster: Zcl.Clusters.genBasic, name: "genBasic"},
        ],
        ["by name", {key: "genAlarms", manufacturerCode: undefined, customClusters: {}}, {cluster: Zcl.Clusters.genAlarms, name: "genAlarms"}],
        [
            "by ID with no manufacturer code",
            {key: Zcl.Clusters.genAlarms.ID, manufacturerCode: 123, customClusters: {}},
            {cluster: Zcl.Clusters.genAlarms, name: "genAlarms"},
        ],
        [
            "by ID with non-matching manufacturer code",
            {key: Zcl.Clusters.manuSpecificSinope.ID, manufacturerCode: 123, customClusters: {}},
            {cluster: Zcl.Clusters.manuSpecificSinope, name: "manuSpecificSinope"},
        ],
        [
            "by ID with matching manufacturer code",
            {key: Zcl.Clusters.manuSpecificSinope.ID, manufacturerCode: Zcl.Clusters.manuSpecificSinope.manufacturerCode!, customClusters: {}},
            {cluster: Zcl.Clusters.manuSpecificSinope, name: "manuSpecificSinope"},
        ],
        [
            "custom by ID",
            {key: CUSTOM_CLUSTERS.myCustomCluster.ID, manufacturerCode: undefined, customClusters: CUSTOM_CLUSTERS},
            {cluster: CUSTOM_CLUSTERS.myCustomCluster, name: "myCustomCluster"},
        ],
        [
            "custom by name",
            {key: "myCustomCluster", manufacturerCode: undefined, customClusters: CUSTOM_CLUSTERS},
            {cluster: CUSTOM_CLUSTERS.myCustomCluster, name: "myCustomCluster"},
        ],
        [
            "custom by ID with no manufacturer code",
            {key: CUSTOM_CLUSTERS.myCustomCluster.ID, manufacturerCode: 123, customClusters: CUSTOM_CLUSTERS},
            {cluster: CUSTOM_CLUSTERS.myCustomCluster, name: "myCustomCluster"},
        ],
        [
            "custom by ID with non-matching manufacturer code",
            {key: CUSTOM_CLUSTERS.myCustomClusterManuf.ID, manufacturerCode: 123, customClusters: CUSTOM_CLUSTERS},
            {cluster: CUSTOM_CLUSTERS.myCustomClusterManuf, name: "myCustomClusterManuf"},
        ],
        [
            "custom by ID with matching manufacturer code",
            {
                key: CUSTOM_CLUSTERS.myCustomClusterManuf.ID,
                manufacturerCode: CUSTOM_CLUSTERS.myCustomClusterManuf.manufacturerCode!,
                customClusters: CUSTOM_CLUSTERS,
            },
            {cluster: CUSTOM_CLUSTERS.myCustomClusterManuf, name: "myCustomClusterManuf"},
        ],
        [
            "custom by ID overriding same Zcl ID entirely",
            {key: CUSTOM_CLUSTERS.genBasic.ID, manufacturerCode: undefined, customClusters: CUSTOM_CLUSTERS},
            {cluster: CUSTOM_CLUSTERS.genBasic, name: "genBasic"},
        ],
        [
            "by ID ignoring same custom ID if Zcl is better match with manufacturer code",
            {
                key: CUSTOM_CLUSTERS.manuSpecificProfalux1NoManuf.ID,
                manufacturerCode: Zcl.ManufacturerCode.PROFALUX,
                customClusters: CUSTOM_CLUSTERS,
            },
            {cluster: Zcl.Clusters.manuSpecificProfalux1, name: "manuSpecificProfalux1"},
        ],
    ])("Gets cluster %s", (_name, payload, expected) => {
        const cluster = Zcl.Utils.getCluster(payload.key, payload.manufacturerCode, payload.customClusters);

        expect(cluster.ID).toStrictEqual(expected.cluster.ID);
        expect(cluster.name).toStrictEqual(expected.name);

        for (const k in expected.cluster.attributes) {
            expect(cluster.attributes[k]).toBeDefined();
            expect(cluster.attributes[k].name).toStrictEqual(k);
        }

        expect(cluster.manufacturerCode).toStrictEqual(expected.cluster.manufacturerCode);
        expect(cluster.getAttribute).toBeInstanceOf(Function);
        expect(cluster.getCommand).toBeInstanceOf(Function);
        expect(cluster.getCommandResponse).toBeInstanceOf(Function);
    });

    it("Creates empty cluster when getting by invalid ID", () => {
        const cluster = Zcl.Utils.getCluster(99999, undefined, {});
        expect(cluster.ID).toStrictEqual(99999);
        expect(cluster.name).toStrictEqual("99999");
        expect(cluster.manufacturerCode).toStrictEqual(undefined);
        expect(cluster.attributes).toStrictEqual({});
        expect(cluster.commands).toStrictEqual({});
        expect(cluster.commandsResponse).toStrictEqual({});
        expect(cluster.getAttribute).toBeInstanceOf(Function);
        expect(cluster.getCommand).toBeInstanceOf(Function);
        expect(cluster.getCommandResponse).toBeInstanceOf(Function);
    });

    it("Throws when getting invalid cluster name", () => {
        expect(() => {
            Zcl.Utils.getCluster("invalid", undefined, {});
        }).toThrow();
    });

    it.each([
        [
            "by ID",
            {key: Zcl.Clusters.genBasic.attributes.zclVersion.ID, manufacturerCode: undefined, customClusters: {}},
            {cluster: Zcl.Clusters.genBasic, name: "zclVersion"},
        ],
        ["by name", {key: "alarmCount", manufacturerCode: undefined, customClusters: {}}, {cluster: Zcl.Clusters.genAlarms, name: "alarmCount"}],
        [
            "by ID with no manufacturer code",
            {key: Zcl.Clusters.genAlarms.attributes.alarmCount.ID, manufacturerCode: 123, customClusters: {}},
            {cluster: Zcl.Clusters.genAlarms, name: "alarmCount"},
        ],
        [
            "by ID with matching manufacturer code",
            {
                key: Zcl.Clusters.haDiagnostic.attributes.danfossSystemStatusCode.ID,
                manufacturerCode: Zcl.ManufacturerCode.DANFOSS_A_S,
                customClusters: {},
            },
            {cluster: Zcl.Clusters.haDiagnostic, name: "danfossSystemStatusCode"},
        ],
        [
            "custom by ID",
            {key: CUSTOM_CLUSTERS.genBasic.attributes.myCustomAttr.ID, manufacturerCode: undefined, customClusters: CUSTOM_CLUSTERS},
            {cluster: Zcl.Clusters.genBasic, name: "myCustomAttr"},
        ],
        [
            "custom by name",
            {key: "myCustomAttr", manufacturerCode: undefined, customClusters: CUSTOM_CLUSTERS},
            {cluster: Zcl.Clusters.genBasic, name: "myCustomAttr"},
        ],
    ])("Gets and checks cluster attribute %s", (_name, payload, expected) => {
        const cluster = Zcl.Utils.getCluster(expected.cluster.ID, payload.manufacturerCode, payload.customClusters);
        const attribute = cluster.getAttribute(payload.key);
        expect(attribute).not.toBeUndefined();
        expect(attribute).toStrictEqual(cluster.attributes[expected.name]);
    });

    it("Returns undefined when getting invalid attribute", () => {
        const cluster = Zcl.Utils.getCluster(Zcl.Clusters.genAlarms.ID, undefined, {});
        expect(cluster.getAttribute("abcd")).toBeUndefined();
        expect(cluster.getAttribute(99999)).toBeUndefined();
    });

    it("Returns undefined when getting attribute with invalid manufacturer code", () => {
        const cluster = Zcl.Utils.getCluster(Zcl.Clusters.haDiagnostic.ID, 123, {});
        expect(cluster.getAttribute(Zcl.Clusters.haDiagnostic.attributes.danfossSystemStatusCode.ID)).toBeUndefined();
    });

    it.each([
        ["by ID", {key: Zcl.Clusters.genBasic.commands.resetFactDefault.ID}, {cluster: Zcl.Clusters.genBasic, name: "resetFactDefault"}],
        ["by name", {key: "resetAll"}, {cluster: Zcl.Clusters.genAlarms, name: "resetAll"}],
    ])("Gets cluster command %s", (_name, payload, expected) => {
        const cluster = Zcl.Utils.getCluster(expected.cluster.ID, undefined, {});
        const command = cluster.getCommand(payload.key);
        expect(command).toStrictEqual(cluster.commands[expected.name]);
    });

    it("Throws when getting invalid command", () => {
        const cluster = Zcl.Utils.getCluster(Zcl.Clusters.genAlarms.ID, undefined, {});
        expect(() => {
            cluster.getCommand("abcd");
        }).toThrow();
        expect(() => {
            cluster.getCommand(99999);
        }).toThrow();
    });

    it.each([
        [
            "by ID",
            {key: Zcl.Clusters.genIdentify.commandsResponse.identifyQueryRsp.ID},
            {cluster: Zcl.Clusters.genIdentify, name: "identifyQueryRsp"},
        ],
        ["by name", {key: "getEventLog"}, {cluster: Zcl.Clusters.genAlarms, name: "getEventLog"}],
    ])("Gets cluster command response %s", (_name, payload, expected) => {
        const cluster = Zcl.Utils.getCluster(expected.cluster.ID, undefined, {});
        const commandResponse = cluster.getCommandResponse(payload.key);
        expect(commandResponse).toStrictEqual(cluster.commandsResponse[expected.name]);
    });

    it("Throws when getting invalid command response", () => {
        const cluster = Zcl.Utils.getCluster(Zcl.Clusters.genAlarms.ID, undefined, {});
        expect(() => {
            cluster.getCommandResponse("abcd");
        }).toThrow();
        expect(() => {
            cluster.getCommandResponse(99999);
        }).toThrow();
    });

    it.each([
        ["by ID", {key: Zcl.Foundation.writeUndiv.ID}, {cluster: Zcl.Foundation.writeUndiv, name: "writeUndiv"}],
        ["by name", {key: "read"}, {cluster: Zcl.Foundation.read, name: "read"}],
    ])("Gets global command %s", (_name, payload, expected) => {
        const command: Command = {
            ID: expected.cluster.ID,
            name: expected.name,
            parameters: expected.cluster.parameters,
        };

        if (expected.cluster.response) {
            command.response = expected.cluster.response;
        }

        expect(Zcl.Utils.getGlobalCommand(payload.key)).toStrictEqual(command);
    });

    it("Throws when getting invalid global command", () => {
        expect(() => {
            Zcl.Utils.getGlobalCommand(99999);
        }).toThrow();
        expect(() => {
            Zcl.Utils.getGlobalCommand("abcd");
        }).toThrow();
    });

    it("Checks cluster name", () => {
        expect(Zcl.Utils.isClusterName("genBasic")).toBeTruthy();
        expect(Zcl.Utils.isClusterName("genAlarms")).toBeTruthy();
        expect(Zcl.Utils.isClusterName("invalid")).toBeFalsy();
    });

    it("Gets Foundation command", () => {
        expect(Zcl.Utils.getFoundationCommand(0)).toStrictEqual(Zcl.Foundation.read);
    });

    it("Throws when getting invalid Foundation command ID", () => {
        expect(() => {
            Zcl.Utils.getFoundationCommand(9999);
        }).toThrow(`Foundation command '9999' does not exist.`);
    });

    function createAttribute(overrides: Partial<Attribute> = {}): Attribute {
        // Provide a minimal, structurally valid Attribute (add fields here if the real type requires more)
        const base: Attribute = {
            ID: 0x0001,
            name: "testAttr",
            type: Zcl.DataType.UINT8,
            // Optional fields spread afterwards
            ...overrides,
        };
        return base;
    }

    function createParameter(overrides: Partial<Parameter> = {}): Parameter {
        const base: Parameter = {
            name: "testParam",
            type: Zcl.DataType.UINT8,
            ...overrides,
        };
        return base;
    }

    describe("processAttributeWrite specific", () => {
        it("throws when attribute not writable", () => {
            const attr = createAttribute();
            expect(() => Zcl.Utils.processAttributeWrite(attr, 1)).toThrow(/not writable/i);
        });

        it("returns default when value is null and default exists", () => {
            const attr = createAttribute({writable: true, default: 42});
            expect(Zcl.Utils.processAttributeWrite(attr, null)).toStrictEqual(42);
        });

        it("NaN with default -> returns default", () => {
            const attr = createAttribute({writable: true, default: 7});
            expect(Zcl.Utils.processAttributeWrite(attr, Number.NaN)).toStrictEqual(7);
        });

        it("NaN with default ref -> returns ref value", () => {
            const attr = createAttribute({writable: true, defaultRef: "myRef"});
            expect(Zcl.Utils.processAttributeWrite(attr, Number.NaN, {myRef: 9})).toStrictEqual(9);
        });

        it("NaN without default -> returns non-value sentinel", () => {
            const type = Zcl.DataType.UINT8;
            const sentinel = ZCL_TYPE_INVALID_BY_TYPE[type];
            expect(sentinel).not.toBeUndefined();
            const attr = createAttribute({writable: true, type, default: undefined});
            expect(Zcl.Utils.processAttributeWrite(attr, Number.NaN)).toStrictEqual(sentinel);
        });

        it("NaN with default ref value not available -> returns non-value sentinel", () => {
            const type = Zcl.DataType.UINT8;
            const sentinel = ZCL_TYPE_INVALID_BY_TYPE[type];
            expect(sentinel).not.toBeUndefined();
            const attr = createAttribute({writable: true, type, defaultRef: "myRef"});
            expect(Zcl.Utils.processAttributeWrite(attr, Number.NaN, {notMyRef: 9})).toStrictEqual(sentinel);
            expect(Zcl.Utils.processAttributeWrite(attr, Number.NaN)).toStrictEqual(sentinel);
        });
    });

    describe("processAttributePreRead specific", () => {
        it("throws when attribute not writable", () => {
            const attr = createAttribute({readable: false});
            expect(() => Zcl.Utils.processAttributePreRead(attr)).toThrow(/not readable/i);
        });
    });

    describe("processAttributePostRead specific", () => {
        it("maps invalid sentinel to NaN", () => {
            const type = Zcl.DataType.UINT16;
            const sentinel = ZCL_TYPE_INVALID_BY_TYPE[type];
            expect(sentinel).not.toBeUndefined();
            const attr = createAttribute({writable: true, type});
            const result = Zcl.Utils.processAttributePostRead(attr, sentinel);
            expect(Number.isNaN(result)).toStrictEqual(true);
        });

        it("maps invalid sentinel to NaN with different min", () => {
            const type = Zcl.DataType.INT16;
            const sentinel = ZCL_TYPE_INVALID_BY_TYPE[type];
            expect(sentinel).not.toBeUndefined();
            const attr = createAttribute({writable: true, type, min: (sentinel as number) + 1});
            const result = Zcl.Utils.processAttributePostRead(attr, sentinel);
            expect(Number.isNaN(result)).toStrictEqual(true);
        });

        it("returns value unchanged if same as min (skips invalid sentinel)", () => {
            const type = Zcl.DataType.INT16;
            const sentinel = ZCL_TYPE_INVALID_BY_TYPE[type];
            expect(sentinel).not.toBeUndefined();
            const attr = createAttribute({writable: true, type, min: sentinel as number});
            const result = Zcl.Utils.processAttributePostRead(attr, sentinel);
            expect(result).toStrictEqual(sentinel);
        });

        it("maps invalid sentinel to NaN with different max", () => {
            const type = Zcl.DataType.UINT16;
            const sentinel = ZCL_TYPE_INVALID_BY_TYPE[type];
            expect(sentinel).not.toBeUndefined();
            const attr = createAttribute({writable: true, type, max: (sentinel as number) - 1});
            const result = Zcl.Utils.processAttributePostRead(attr, sentinel);
            expect(Number.isNaN(result)).toStrictEqual(true);
        });

        it("returns value unchanged if same as max (skips invalid sentinel)", () => {
            const type = Zcl.DataType.UINT16;
            const sentinel = ZCL_TYPE_INVALID_BY_TYPE[type];
            expect(sentinel).not.toBeUndefined();
            const attr = createAttribute({writable: true, type, max: sentinel as number});
            const result = Zcl.Utils.processAttributePostRead(attr, sentinel);
            expect(result).toStrictEqual(sentinel);
        });
    });

    describe("processParameterRead specific", () => {
        it("maps invalid sentinel to NaN", () => {
            const type = Zcl.DataType.UINT16;
            const sentinel = ZCL_TYPE_INVALID_BY_TYPE[type];
            expect(sentinel).not.toBeUndefined();
            const attr = createParameter({type});
            const result = Zcl.Utils.processParameterRead(attr, sentinel);
            expect(Number.isNaN(result)).toStrictEqual(true);
        });

        it("maps invalid sentinel to NaN with different min", () => {
            const type = Zcl.DataType.INT16;
            const sentinel = ZCL_TYPE_INVALID_BY_TYPE[type];
            expect(sentinel).not.toBeUndefined();
            const attr = createParameter({type, min: (sentinel as number) + 1});
            const result = Zcl.Utils.processParameterRead(attr, sentinel);
            expect(Number.isNaN(result)).toStrictEqual(true);
        });

        it("returns value unchanged if same as min (skips invalid sentinel)", () => {
            const type = Zcl.DataType.INT16;
            const sentinel = ZCL_TYPE_INVALID_BY_TYPE[type];
            expect(sentinel).not.toBeUndefined();
            const attr = createParameter({type, min: sentinel as number});
            const result = Zcl.Utils.processParameterRead(attr, sentinel);
            expect(result).toStrictEqual(sentinel);
        });

        it("maps invalid sentinel to NaN with different max", () => {
            const type = Zcl.DataType.UINT16;
            const sentinel = ZCL_TYPE_INVALID_BY_TYPE[type];
            expect(sentinel).not.toBeUndefined();
            const attr = createParameter({type, max: (sentinel as number) - 1});
            const result = Zcl.Utils.processParameterRead(attr, sentinel);
            expect(Number.isNaN(result)).toStrictEqual(true);
        });

        it("returns value unchanged if same as max (skips invalid sentinel)", () => {
            const type = Zcl.DataType.UINT16;
            const sentinel = ZCL_TYPE_INVALID_BY_TYPE[type];
            expect(sentinel).not.toBeUndefined();
            const attr = createParameter({type, max: sentinel as number});
            const result = Zcl.Utils.processParameterRead(attr, sentinel);
            expect(result).toStrictEqual(sentinel);
        });
    });

    describe.each([
        ["write", Zcl.Utils.processAttributeWrite],
        ["post read", Zcl.Utils.processAttributePostRead],
    ])("process attribute for %s", (_name, fn) => {
        it("returns null when value is null and no default", () => {
            const attr = createAttribute({writable: true});
            expect(fn(attr, null)).toBeNull();
        });

        it("returns value unchanged when it equals default (skips restrictions)", () => {
            const attr = createAttribute({writable: true, default: 50, min: 60});
            expect(fn(attr, 50)).toStrictEqual(50);
        });

        it("returns value unchanged when it equals ref default (skips restrictions)", () => {
            const attr = createAttribute({writable: true, defaultRef: "myRef", min: 60});
            expect(fn(attr, 50, {myRef: 50})).toStrictEqual(50);
        });

        it("throws below min", () => {
            const attr = createAttribute({writable: true, min: 10});
            expect(() => fn(attr, 5)).toThrow(/requires min/i);
        });

        it("throws below minExcl", () => {
            const attr = createAttribute({writable: true, minExcl: 10});
            expect(() => fn(attr, 5)).toThrow(/requires min exclusive/i);
        });

        it("throws at minExcl", () => {
            const attr = createAttribute({writable: true, minExcl: 10});
            expect(() => fn(attr, 10)).toThrow(/requires min exclusive/i);
        });

        it("throws above max", () => {
            const attr = createAttribute({writable: true, max: 20});
            expect(() => fn(attr, 30)).toThrow(/requires max/i);
        });

        it("throws above maxExcl", () => {
            const attr = createAttribute({writable: true, maxExcl: 20});
            expect(() => fn(attr, 30)).toThrow(/requires max exclusive/i);
        });

        it("throws at maxExcl", () => {
            const attr = createAttribute({writable: true, maxExcl: 20});
            expect(() => fn(attr, 20)).toThrow(/requires max exclusive/i);
        });

        it("throws below min ref value", () => {
            const attr = createAttribute({writable: true, minRef: "myRef"});
            expect(() => fn(attr, 5, {myRef: 10})).toThrow(/requires min.*from ref/i);
        });

        it("throws below minExcl ref value", () => {
            const attr = createAttribute({writable: true, minExclRef: "myRef"});
            expect(() => fn(attr, 5, {myRef: 10})).toThrow(/requires min exclusive.*from ref/i);
        });

        it("throws at minExcl ref value", () => {
            const attr = createAttribute({writable: true, minExclRef: "myRef"});
            expect(() => fn(attr, 10, {myRef: 10})).toThrow(/requires min exclusive.*from ref/i);
        });

        it("throws above max ref value", () => {
            const attr = createAttribute({writable: true, maxRef: "myRef"});
            expect(() => fn(attr, 30, {myRef: 20})).toThrow(/requires max.*from ref/i);
        });

        it("throws above maxExcl ref value", () => {
            const attr = createAttribute({writable: true, maxExclRef: "myRef"});
            expect(() => fn(attr, 30, {myRef: 20})).toThrow(/requires max exclusive.*from ref/i);
        });

        it("throws at maxExcl ref value", () => {
            const attr = createAttribute({writable: true, maxExclRef: "myRef"});
            expect(() => fn(attr, 20, {myRef: 20})).toThrow(/requires max exclusive.*from ref/i);
        });

        it("throws on non-ref even if ok with ref value", () => {
            const attr = createAttribute({writable: true, min: 10, minRef: "myRef"});
            expect(() => fn(attr, 5, {myRef: 4})).toThrow(/requires min of 10/i);
        });

        it("throws not length", () => {
            const attr = createAttribute({writable: true, length: 10});
            expect(() => fn(attr, "abcde")).toThrow(/requires length/i);
        });

        it("throws below minLen", () => {
            const attr = createAttribute({writable: true, minLen: 10});
            expect(() => fn(attr, "abcde")).toThrow(/requires min length/i);
        });

        it("throws above maxLen", () => {
            const attr = createAttribute({writable: true, maxLen: 2});
            expect(() => fn(attr, "xyz")).toThrow(/requires max length/i);
        });
    });

    describe.each([
        ["write", Zcl.Utils.processParameterWrite],
        ["read", Zcl.Utils.processParameterRead],
    ])("process parameter for %s", (_name, fn) => {
        it("returns value when null", () => {
            const p = createParameter();
            expect(fn(p, null)).toBeNull();
        });

        it("throws below min", () => {
            const attr = createParameter({min: 10});
            expect(() => fn(attr, 5)).toThrow(/requires min/i);
        });

        it("throws below minExcl", () => {
            const attr = createParameter({minExcl: 10});
            expect(() => fn(attr, 5)).toThrow(/requires min exclusive/i);
        });

        it("throws at minExcl", () => {
            const attr = createParameter({minExcl: 10});
            expect(() => fn(attr, 10)).toThrow(/requires min exclusive/i);
        });

        it("throws above max", () => {
            const attr = createParameter({max: 20});
            expect(() => fn(attr, 30)).toThrow(/requires max/i);
        });

        it("throws above maxExcl", () => {
            const attr = createParameter({maxExcl: 20});
            expect(() => fn(attr, 30)).toThrow(/requires max exclusive/i);
        });

        it("throws at maxExcl", () => {
            const attr = createParameter({maxExcl: 20});
            expect(() => fn(attr, 20)).toThrow(/requires max exclusive/i);
        });

        it("throws below min ref value", () => {
            const attr = createParameter({minRef: "myRef"});
            expect(() => fn(attr, 5, {myRef: 10})).toThrow(/requires min.*from ref/i);
        });

        it("throws below minExcl ref value", () => {
            const attr = createParameter({minExclRef: "myRef"});
            expect(() => fn(attr, 5, {myRef: 10})).toThrow(/requires min exclusive.*from ref/i);
        });

        it("throws at minExcl ref value", () => {
            const attr = createParameter({minExclRef: "myRef"});
            expect(() => fn(attr, 10, {myRef: 10})).toThrow(/requires min exclusive.*from ref/i);
        });

        it("throws above max ref value", () => {
            const attr = createParameter({maxRef: "myRef"});
            expect(() => fn(attr, 30, {myRef: 20})).toThrow(/requires max.*from ref/i);
        });

        it("throws above maxExcl ref value", () => {
            const attr = createParameter({maxExclRef: "myRef"});
            expect(() => fn(attr, 30, {myRef: 20})).toThrow(/requires max exclusive.*from ref/i);
        });

        it("throws at maxExcl ref value", () => {
            const attr = createParameter({maxExclRef: "myRef"});
            expect(() => fn(attr, 20, {myRef: 20})).toThrow(/requires max exclusive.*from ref/i);
        });

        it("throws on non-ref even if ok with ref value", () => {
            const attr = createParameter({min: 10, minRef: "myRef"});
            expect(() => fn(attr, 5, {myRef: 4})).toThrow(/requires min of 10/i);
        });

        it("throws not length", () => {
            const attr = createParameter({length: 10});
            expect(() => fn(attr, "abcde")).toThrow(/requires length/i);
        });

        it("throws below minLen", () => {
            const attr = createParameter({minLen: 10});
            expect(() => fn(attr, "abcde")).toThrow(/requires min length/i);
        });

        it("throws above maxLen", () => {
            const attr = createParameter({maxLen: 2});
            expect(() => fn(attr, "xyz")).toThrow(/requires max length/i);
        });
    });
});
