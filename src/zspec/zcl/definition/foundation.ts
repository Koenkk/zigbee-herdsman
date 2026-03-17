import type {BuffaloZcl} from "../buffaloZcl";
import {isAnalogDataType} from "../utils";
import {ZclStatusError} from "../zclStatusError";
import {BuffaloZclDataType, DataType, Direction} from "./enums";
import {Status} from "./status";
import type {Command, StructuredSelector} from "./tstype";

export type FoundationCommandName =
    | "read"
    | "readRsp"
    | "write"
    | "writeUndiv"
    | "writeRsp"
    | "writeNoRsp"
    | "configReport"
    | "configReportRsp"
    | "readReportConfig"
    | "readReportConfigRsp"
    | "report"
    | "defaultRsp"
    | "discover"
    | "discoverRsp"
    | "readStructured"
    | "writeStructured"
    | "writeStructuredRsp"
    | "discoverCommands"
    | "discoverCommandsRsp"
    | "discoverCommandsGen"
    | "discoverCommandsGenRsp"
    | "discoverExt"
    | "discoverExtRsp";

export interface FoundationDefinition<
    // biome-ignore lint/suspicious/noExplicitAny: TODO: currently low level ZCL payloads are typed `any` which makes a mess
    T extends Record<string, any> | Record<string, any>[] = Record<string, any> | Record<string, any>[],
> extends Pick<Command, "ID" | "name" | "response"> {
    parse: (buffalo: BuffaloZcl) => T;
    write: (buffalo: BuffaloZcl, payload: T) => void;
}

export const Foundation = {
    /** Read Attributes */
    read: {
        name: "read",
        ID: 0x00,
        response: 0x01, // readRsp
        parse(buffalo) {
            const payload: {attrId: number}[] = [];

            do {
                const attrId = buffalo.readUInt16();

                payload.push({attrId});
            } while (buffalo.isMore());

            return payload;
        },
        write(buffalo, payload) {
            if (!Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            for (const entry of payload) {
                buffalo.writeUInt16(entry.attrId);
            }
        },
    },
    /** Read Attributes Response */
    readRsp: {
        name: "readRsp",
        ID: 0x01,
        parse(buffalo) {
            const payload: {attrId: number; status: number; dataType?: number; attrData?: unknown}[] = [];

            do {
                const attrId = buffalo.readUInt16();
                const status = buffalo.readUInt8();
                const rec: (typeof payload)[number] = {attrId, status};

                if (status === Status.SUCCESS) {
                    const dataType = buffalo.readUInt8();
                    rec.dataType = dataType;
                    // [workaround] parse char str as Xiaomi struct for attribute 0xff01 (65281)
                    rec.attrData = buffalo.read(attrId === 0xff01 && dataType === DataType.CHAR_STR ? BuffaloZclDataType.MI_STRUCT : dataType, {});
                }

                payload.push(rec);
            } while (buffalo.isMore());

            return payload;
        },
        write(buffalo, payload) {
            if (!Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            for (const entry of payload) {
                buffalo.writeUInt16(entry.attrId);
                buffalo.writeUInt8(entry.status);

                if (entry.status === Status.SUCCESS) {
                    buffalo.writeUInt8(entry.dataType);
                    buffalo.write(entry.dataType, entry.attrData, {});
                }
            }
        },
    },
    /** Write Attributes */
    write: {
        name: "write",
        ID: 0x02,
        response: 0x04, // writeRsp
        parse(buffalo) {
            const payload: {attrId: number; dataType: number; attrData: unknown}[] = [];

            do {
                const attrId = buffalo.readUInt16();
                const dataType = buffalo.readUInt8();
                const attrData = buffalo.read(dataType, {});

                payload.push({attrId, dataType, attrData});
            } while (buffalo.isMore());

            return payload;
        },
        write(buffalo, payload) {
            if (!Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            for (const entry of payload) {
                buffalo.writeUInt16(entry.attrId);
                buffalo.writeUInt8(entry.dataType);
                buffalo.write(entry.dataType, entry.attrData, {});
            }
        },
    },
    /** Write Attributes Undivided */
    writeUndiv: {
        name: "writeUndiv",
        ID: 0x03,
        parse(buffalo) {
            const payload: {attrId: number; dataType: number; attrData: unknown}[] = [];

            do {
                const attrId = buffalo.readUInt16();
                const dataType = buffalo.readUInt8();
                const attrData = buffalo.read(dataType, {});

                payload.push({attrId, dataType, attrData});
            } while (buffalo.isMore());

            return payload;
        },
        write(buffalo, payload) {
            if (!Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            for (const entry of payload) {
                buffalo.writeUInt16(entry.attrId);
                buffalo.writeUInt8(entry.dataType);
                buffalo.write(entry.dataType, entry.attrData, {});
            }
        },
    },
    /** Write Attributes Response */
    writeRsp: {
        name: "writeRsp",
        ID: 0x04,
        /**
         * Note that write attribute status records are not included for successfully written attributes, to save bandwidth.
         * In the case of successful writing of all attributes, only a single write attribute status record SHALL be included in the command,
         * with the status field set to SUCCESS and the attribute identifier field omitted.
         */
        parse(buffalo) {
            const firstStatus = buffalo.readUInt8();

            if (firstStatus === Status.SUCCESS) {
                return [{status: firstStatus}];
            }

            const payload: {status: number; attrId?: number}[] = [];
            const attrId = buffalo.readUInt16();

            payload.push({status: firstStatus, attrId});

            while (buffalo.isMore()) {
                const status = buffalo.readUInt8();
                const attrId = buffalo.readUInt16();

                payload.push({status, attrId});
            }

            return payload;
        },
        write(buffalo, payload) {
            if (!Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            const nonSuccessPayload = payload.filter((entry) => entry.status !== Status.SUCCESS);

            if (nonSuccessPayload.length === 0) {
                buffalo.writeUInt8(Status.SUCCESS);
            } else {
                for (const entry of nonSuccessPayload) {
                    buffalo.writeUInt8(entry.status);
                    buffalo.writeUInt16(entry.attrId);
                }
            }
        },
    },
    /** Write Attributes No Response */
    writeNoRsp: {
        name: "writeNoRsp",
        ID: 0x05,
        parse(buffalo) {
            const payload: {attrId: number; dataType: number; attrData: unknown}[] = [];

            do {
                const attrId = buffalo.readUInt16();
                const dataType = buffalo.readUInt8();
                const attrData = buffalo.read(dataType, {});

                payload.push({attrId, dataType, attrData});
            } while (buffalo.isMore());

            return payload;
        },
        write(buffalo, payload) {
            if (!Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            for (const entry of payload) {
                buffalo.writeUInt16(entry.attrId);
                buffalo.writeUInt8(entry.dataType);
                buffalo.write(entry.dataType, entry.attrData, {});
            }
        },
    },
    /** Configure Reporting */
    configReport: {
        name: "configReport",
        ID: 0x06,
        response: 0x07, // configReportRsp
        parse(buffalo) {
            const payload: {
                direction: number;
                attrId: number;
                dataType?: number;
                /**
                 * - If this value is set to 0x0000, then there is no minimum limit,
                 *   unless one is imposed by the specification of the cluster using this reporting mechanism or by the application.
                 */
                minRepIntval?: number;
                /**
                 * - If this value is set to 0xffff, then the device SHALL not issue reports for the specified attribute,
                 *   and the configuration information for that attribute need not be maintained.
                 * - If this value is set to 0x0000, and the minimum reporting interval field does not equal 0xffff
                 *   there SHALL be no periodic reporting, but change based reporting SHALL still be operational.
                 * - If this value is set to 0x0000 and the Minimum Reporting Interval Field equals 0xffff,
                 *   then the device SHALL revert to its default reporting configuration.
                 *   The reportable change field, if present, SHALL be set to zero.
                 */
                maxRepIntval?: number;
                /**
                 * - If the Maximum Reporting Interval Field is set to 0xffff (terminate reporting configuration),
                 *   or the Maximum Reporting Interval Field is set to 0x0000 and the Minimum Reporting Interval Field equals 0xffff,
                 *   indicating a (default reporting configuration) then if this field is present,
                 *   it SHALL be set to zero upon transmission and ignored upon reception.
                 */
                repChange?: number;
                /**
                 * - If this value is set to 0x0000, reports of the attribute are not subject to timeout.
                 */
                timeout?: number;
            }[] = [];

            do {
                const direction = buffalo.readUInt8();
                const attrId = buffalo.readUInt16();
                const rec: (typeof payload)[number] = {direction, attrId};

                if (direction === Direction.CLIENT_TO_SERVER) {
                    const dataType = buffalo.readUInt8();
                    rec.dataType = dataType;
                    rec.minRepIntval = buffalo.readUInt16();
                    rec.maxRepIntval = buffalo.readUInt16();

                    if (isAnalogDataType(dataType)) {
                        rec.repChange = buffalo.read(dataType, {});
                    }
                } else if (direction === Direction.SERVER_TO_CLIENT) {
                    rec.timeout = buffalo.readUInt16();
                }

                payload.push(rec);
            } while (buffalo.isMore());

            return payload;
        },
        write(buffalo, payload) {
            if (!Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            for (const entry of payload) {
                buffalo.writeUInt8(entry.direction);
                buffalo.writeUInt16(entry.attrId);

                if (entry.direction === Direction.CLIENT_TO_SERVER) {
                    buffalo.writeUInt8(entry.dataType);
                    buffalo.writeUInt16(entry.minRepIntval);
                    buffalo.writeUInt16(entry.maxRepIntval);

                    if (isAnalogDataType(entry.dataType)) {
                        buffalo.write(entry.dataType, entry.repChange, {});
                    }
                } else if (entry.direction === Direction.SERVER_TO_CLIENT) {
                    buffalo.writeUInt16(entry.timeout);
                }
            }
        },
    },
    /** Configure Reporting Response */
    configReportRsp: {
        name: "configReportRsp",
        ID: 0x07,
        /**
         * Note that attribute status records are not included for successfully configured attributes, to save bandwidth.
         * In the case of successful configuration of all attributes, only a single attribute status record SHALL be included in the command,
         * with the status field set to SUCCESS and the direction and attribute identifier fields omitted.
         */
        parse(buffalo) {
            const firstStatus = buffalo.readUInt8();

            if (firstStatus === Status.SUCCESS) {
                return [{status: firstStatus}];
            }

            const payload: {status: number; direction?: number; attrId?: number}[] = [];
            const direction = buffalo.readUInt8();
            const attrId = buffalo.readUInt16();

            payload.push({status: firstStatus, direction, attrId});

            while (buffalo.isMore()) {
                const status = buffalo.readUInt8();
                const direction = buffalo.readUInt8();
                const attrId = buffalo.readUInt16();

                payload.push({status, direction, attrId});
            }

            return payload;
        },
        write(buffalo, payload) {
            if (!Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            const nonSuccessPayload = payload.filter((entry) => entry.status !== Status.SUCCESS);

            if (nonSuccessPayload.length === 0) {
                buffalo.writeUInt8(Status.SUCCESS);
            } else {
                for (const entry of nonSuccessPayload) {
                    buffalo.writeUInt8(entry.status);
                    buffalo.writeUInt8(entry.direction);
                    buffalo.writeUInt16(entry.attrId);
                }
            }
        },
    },
    /** Read Reporting Configuration */
    readReportConfig: {
        name: "readReportConfig",
        ID: 0x08,
        response: 0x09, // readReportConfigRsp
        parse(buffalo) {
            const payload: {direction: number; attrId: number}[] = [];

            do {
                const direction = buffalo.readUInt8();
                const attrId = buffalo.readUInt16();

                payload.push({direction, attrId});
            } while (buffalo.isMore());

            return payload;
        },
        write(buffalo, payload) {
            if (!Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            for (const entry of payload) {
                buffalo.writeUInt8(entry.direction);
                buffalo.writeUInt16(entry.attrId);
            }
        },
    },
    /** Read Reporting Configuration Response */
    readReportConfigRsp: {
        name: "readReportConfigRsp",
        ID: 0x09,
        parse(buffalo) {
            const payload: {
                status: number;
                direction: number;
                attrId: number;
                dataType?: number;
                minRepIntval?: number;
                maxRepIntval?: number;
                repChange?: number;
                timeout?: number;
            }[] = [];

            do {
                const status = buffalo.readUInt8();
                const direction = buffalo.readUInt8();
                const attrId = buffalo.readUInt16();
                const rec: (typeof payload)[number] = {status, direction, attrId};

                if (status === Status.SUCCESS) {
                    if (direction === Direction.CLIENT_TO_SERVER) {
                        const dataType = buffalo.readUInt8();
                        rec.dataType = dataType;
                        rec.minRepIntval = buffalo.readUInt16();
                        rec.maxRepIntval = buffalo.readUInt16();

                        if (isAnalogDataType(dataType)) {
                            rec.repChange = buffalo.read(dataType, {});
                        }
                    } else if (direction === Direction.SERVER_TO_CLIENT) {
                        rec.timeout = buffalo.readUInt16();
                    }
                }

                payload.push(rec);
            } while (buffalo.isMore());

            return payload;
        },
        write(buffalo, payload) {
            if (!Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            for (const entry of payload) {
                buffalo.writeUInt8(entry.status);
                buffalo.writeUInt8(entry.direction);
                buffalo.writeUInt16(entry.attrId);

                if (entry.status === Status.SUCCESS) {
                    if (entry.direction === Direction.CLIENT_TO_SERVER) {
                        buffalo.writeUInt8(entry.dataType);
                        buffalo.writeUInt16(entry.minRepIntval);
                        buffalo.writeUInt16(entry.maxRepIntval);

                        if (isAnalogDataType(entry.dataType)) {
                            buffalo.write(entry.dataType, entry.repChange, {});
                        }
                    } else if (entry.direction === Direction.SERVER_TO_CLIENT) {
                        buffalo.writeUInt16(entry.timeout);
                    }
                }
            }
        },
    },
    /** Report attributes */
    report: {
        name: "report",
        ID: 0x0a,
        parse(buffalo) {
            const payload: {attrId: number; dataType: number; attrData: unknown}[] = [];

            do {
                const attrId = buffalo.readUInt16();
                const dataType = buffalo.readUInt8();
                // [workaround] parse char str as Xiaomi struct for attribute 0xff01 (65281)
                const attrData = buffalo.read(attrId === 0xff01 && dataType === DataType.CHAR_STR ? BuffaloZclDataType.MI_STRUCT : dataType, {});

                payload.push({attrId, dataType, attrData});
            } while (buffalo.isMore());

            return payload;
        },
        write(buffalo, payload) {
            if (!Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            for (const entry of payload) {
                buffalo.writeUInt16(entry.attrId);
                buffalo.writeUInt8(entry.dataType);
                buffalo.write(entry.dataType, entry.attrData, {});
            }
        },
    },
    /** Default Response */
    defaultRsp: {
        name: "defaultRsp",
        ID: 0x0b,
        parse(buffalo) {
            const cmdId = buffalo.readUInt8();
            const statusCode = buffalo.readUInt8();

            return {cmdId, statusCode};
        },
        write(buffalo, payload) {
            if (Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            buffalo.writeUInt8(payload.cmdId);
            buffalo.writeUInt8(payload.statusCode);
        },
    },
    /** Discover Attributes */
    discover: {
        name: "discover",
        ID: 0x0c,
        parse(buffalo) {
            const startAttrId = buffalo.readUInt16();
            const maxAttrIds = buffalo.readUInt8();

            return {startAttrId, maxAttrIds};
        },
        write(buffalo, payload) {
            if (Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            buffalo.writeUInt16(payload.startAttrId);
            buffalo.writeUInt8(payload.maxAttrIds);
        },
    },
    /** Discover Attributes Response */
    discoverRsp: {
        name: "discoverRsp",
        ID: 0x0d,
        parse(buffalo) {
            const discComplete = buffalo.readUInt8();
            const attrInfos: {attrId: number; dataType: number}[] = [];
            const payload: {discComplete: number; attrInfos: typeof attrInfos} = {discComplete, attrInfos};

            do {
                const attrId = buffalo.readUInt16();
                const dataType = buffalo.readUInt8();

                attrInfos.push({attrId, dataType});
            } while (buffalo.isMore());

            return payload;
        },
        write(buffalo, payload) {
            if (Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            buffalo.writeUInt8(payload.discComplete);

            for (const entry of payload.attrInfos) {
                buffalo.writeUInt16(entry.attrId);
                buffalo.writeUInt8(entry.dataType);
            }
        },
    },
    /** Read Attributes Structured */
    readStructured: {
        name: "readStructured",
        ID: 0x0e,
        parse(buffalo) {
            const payload: {attrId: number; selector: StructuredSelector}[] = [];

            do {
                const attrId = buffalo.readUInt16();
                const selector = buffalo.readStructuredSelector();

                payload.push({attrId, selector});
            } while (buffalo.isMore());

            return payload;
        },
        write(buffalo, payload) {
            if (!Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            for (const entry of payload) {
                buffalo.writeUInt16(entry.attrId);
                buffalo.writeStructuredSelector(entry.selector);
            }
        },
    },
    /** Write Attributes Structured */
    writeStructured: {
        name: "writeStructured",
        ID: 0x0f,
        response: 0x10, // writeStructuredRsp
        parse(buffalo) {
            const payload: {attrId: number; selector: StructuredSelector; dataType: number; elementData: unknown}[] = [];

            do {
                const attrId = buffalo.readUInt16();
                const selector = buffalo.readStructuredSelector();
                const dataType = buffalo.readUInt8();
                const elementData = buffalo.read(dataType, {});

                payload.push({attrId, selector, dataType, elementData});
            } while (buffalo.isMore());

            return payload;
        },
        write(buffalo, payload) {
            if (!Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            for (const entry of payload) {
                buffalo.writeUInt16(entry.attrId);
                buffalo.writeStructuredSelector(entry.selector);
                buffalo.writeUInt8(entry.dataType);
                buffalo.write(entry.dataType, entry.elementData, {});
            }
        },
    },
    /** Write Attributes Structured response */
    writeStructuredRsp: {
        name: "writeStructuredRsp",
        ID: 0x10,
        /**
         * Note that write attribute status records are not included for successfully written attributes, to save bandwidth.
         * In the case of successful writing of all attributes, only a single write attribute status record SHALL be included in the command,
         * with the status field set to SUCCESS and the attribute identifier and selector fields omitted.
         */
        parse(buffalo) {
            const firstStatus = buffalo.readUInt8();

            if (firstStatus === Status.SUCCESS) {
                return [{status: firstStatus}];
            }

            const payload: {status: number; attrId?: number; selector?: StructuredSelector}[] = [];
            const attrId = buffalo.readUInt16();
            const selector = buffalo.readStructuredSelector();

            payload.push({status: firstStatus, attrId, selector});

            while (buffalo.isMore()) {
                const status = buffalo.readUInt8();
                const attrId = buffalo.readUInt16();
                const selector = buffalo.readStructuredSelector();

                payload.push({status, attrId, selector});
            }

            return payload;
        },
        write(buffalo, payload) {
            if (!Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            const nonSuccessPayload = payload.filter((entry) => entry.status !== Status.SUCCESS);

            if (nonSuccessPayload.length === 0) {
                buffalo.writeUInt8(Status.SUCCESS);
            } else {
                for (const entry of nonSuccessPayload) {
                    buffalo.writeUInt8(entry.status);
                    buffalo.writeUInt16(entry.attrId);
                    buffalo.writeStructuredSelector(entry.selector);
                }
            }
        },
    },
    /** Discover Commands Received */
    discoverCommands: {
        name: "discoverCommands",
        ID: 0x11,
        parse(buffalo) {
            const startCmdId = buffalo.readUInt8();
            const maxCmdIds = buffalo.readUInt8();

            return {startCmdId, maxCmdIds};
        },
        write(buffalo, payload) {
            if (Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            buffalo.writeUInt8(payload.startCmdId);
            buffalo.writeUInt8(payload.maxCmdIds);
        },
    },
    /** Discover Commands Received Response */
    discoverCommandsRsp: {
        name: "discoverCommandsRsp",
        ID: 0x12,
        parse(buffalo) {
            const discComplete = buffalo.readUInt8();
            const commandIds: number[] = [];
            const payload: {discComplete: number; commandIds: typeof commandIds} = {discComplete, commandIds};

            do {
                const commandId = buffalo.readUInt8();

                commandIds.push(commandId);
            } while (buffalo.isMore());

            return payload;
        },
        write(buffalo, payload) {
            if (Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            buffalo.writeUInt8(payload.discComplete);

            for (const commandId of payload.commandIds) {
                buffalo.writeUInt8(commandId);
            }
        },
    },
    /** Discover Commands Generated */
    discoverCommandsGen: {
        name: "discoverCommandsGen",
        ID: 0x13,
        parse(buffalo) {
            const startCmdId = buffalo.readUInt8();
            const maxCmdIds = buffalo.readUInt8();

            return {startCmdId, maxCmdIds};
        },
        write(buffalo, payload) {
            if (Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            buffalo.writeUInt8(payload.startCmdId);
            buffalo.writeUInt8(payload.maxCmdIds);
        },
    },
    /** Discover Commands Generated Response */
    discoverCommandsGenRsp: {
        name: "discoverCommandsGenRsp",
        ID: 0x14,
        parse(buffalo) {
            const discComplete = buffalo.readUInt8();
            const commandIds: number[] = [];
            const payload: {discComplete: number; commandIds: typeof commandIds} = {discComplete, commandIds};

            do {
                const commandId = buffalo.readUInt8();

                commandIds.push(commandId);
            } while (buffalo.isMore());

            return payload;
        },
        write(buffalo, payload) {
            if (Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            buffalo.writeUInt8(payload.discComplete);

            for (const commandId of payload.commandIds) {
                buffalo.writeUInt8(commandId);
            }
        },
    },
    /** Discover Attributes Extended */
    discoverExt: {
        name: "discoverExt",
        ID: 0x15,
        parse(buffalo) {
            const startAttrId = buffalo.readUInt16();
            const maxAttrIds = buffalo.readUInt8();

            return {startAttrId, maxAttrIds};
        },
        write(buffalo, payload) {
            if (Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            buffalo.writeUInt16(payload.startAttrId);
            buffalo.writeUInt8(payload.maxAttrIds);
        },
    },
    /** Discover Attributes Extended Response */
    discoverExtRsp: {
        name: "discoverExtRsp",
        ID: 0x16,
        parse(buffalo) {
            const discComplete = buffalo.readUInt8();
            const attrInfos: {attrId: number; dataType: number; access: number}[] = [];
            const payload: {discComplete: number; attrInfos: typeof attrInfos} = {discComplete, attrInfos};

            do {
                const attrId = buffalo.readUInt16();
                const dataType = buffalo.readUInt8();
                const access = buffalo.readUInt8();

                attrInfos.push({attrId, dataType, access});
            } while (buffalo.isMore());

            return payload;
        },
        write(buffalo, payload) {
            if (Array.isArray(payload)) {
                throw new ZclStatusError(Status.MALFORMED_COMMAND);
            }

            buffalo.writeUInt8(payload.discComplete);

            for (const entry of payload.attrInfos) {
                buffalo.writeUInt16(entry.attrId);
                buffalo.writeUInt8(entry.dataType);
                buffalo.writeUInt8(entry.access);
            }
        },
    },
} satisfies Readonly<Record<FoundationCommandName, Readonly<FoundationDefinition>>>;
