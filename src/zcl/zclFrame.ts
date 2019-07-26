import Direction from './direction';
import Foundation from './foundation';
import BuffaloZcl from './buffaloZcl';
import DataType from './dataType';
import {TsType as BuffaloTsType} from '../buffalo';
import Status from './status'

const MINIMAL_FRAME_LENGTH = 3;

enum FrameType {
    GLOBAL = 0,
    SPECIFIC = 1,
}

interface FrameControl {
    frameType: FrameType;
    manufacturerSpecific: boolean;
    direction: Direction;
    disableDefaultResponse: boolean;
}

type ZclPayload = number[];

interface ZclHeader {
    frameControl: FrameControl;
    manufacturerCode: number;
    transactionSequenceNumber: number;
    commandIdentifier: number;
}

class ZclFrame {
    public readonly Header: ZclHeader;
    public readonly Payload: ZclPayload;

    private constructor(header: ZclHeader, payload: ZclPayload) {
        this.Header = header;
        this.Payload = payload;
    }

    public fromBuffer(buffer: Buffer): ZclFrame {
        if (buffer.length < MINIMAL_FRAME_LENGTH) {
            throw new Error("ZclFrame length is lower than minimal length");
        }

        const {position, header} = this.parseHeader(buffer);

        const payloadBuffer = buffer.slice(position, buffer.length);
        const payload = this.parsePayload(header, payloadBuffer);

        return new ZclFrame(header, payload);
    }

    private parseHeader(buffer: Buffer): {position: number; header: ZclHeader} {
        let position = 0;

        const frameControlValue = buffer.readUInt8(position);
        position++;
        const frameControl = {
            frameType: frameControlValue & 0x03,
            manufacturerSpecific: ((frameControlValue >> 2) & 0x01) === 1,
            direction: (frameControlValue >> 3) & 0x01,
            disableDefaultResponse: ((frameControlValue >> 4) & 0x01) === 1,
        }

        let manufacturerCode = null;
        if (frameControl.manufacturerSpecific) {
            manufacturerCode = buffer.readUInt16LE(position);
            position += 2;
        }

        const transactionSequenceNumber = buffer.readUInt8(position);
        position++;

        const commandIdentifier = buffer.readUInt8(position);
        position++;

        const header = {frameControl, transactionSequenceNumber, manufacturerCode, commandIdentifier};
        return {position, header};
    }

    private parsePayload(header: ZclHeader, buffer: Buffer): ZclPayload {
        if (header.frameControl.frameType === FrameType.GLOBAL) {
            return this.parsePayloadGlobal(header, buffer);
        } else if (header.frameControl.frameType === FrameType.SPECIFIC) {
            return this.parsePayloadCluster(header, buffer);
        } else {
            throw new Error(`Unsupported frameType '${header.frameControl.frameType}'`);
        }
    }

    private parsePayloadGlobal(header: ZclHeader, buffer: Buffer): any {
        if (header.frameControl.manufacturerSpecific) {
            throw new Error(`Global commands are not supported for manufacturer specific commands`);
        }

        const command = Object.values(Foundation).find((c): boolean => c.ID === header.commandIdentifier);

        if (command.meta.type === 'repetitive') {
            const payload = [];

            for (let position = 0; position < buffer.length; position) {
                const entry: {[s: string]: BuffaloTsType.Value} = {};

                for (let parameter of command.parameters) {
                    const options: BuffaloTsType.Options = {};

                    if (parameter.name === 'attrData' && typeof entry.dataType === 'number') {
                        // We need to grab the dataType to parse attrData
                        options.dataType = DataType[entry.dataType];
                    }

                    const result = BuffaloZcl.read(DataType[parameter.type], buffer, position, options);
                    entry[parameter.name] = result.value;
                    position += result.length;

                    // If we see a status paramater we need to stop parsing in some cases
                    if (parameter.name === 'status' && command.meta.statusBehaviour) {
                        if (command.meta.statusBehaviour === 'SkipIfFailure' && result.value !== Status.SUCCESS) {
                            break;
                        } else if (command.meta.statusBehaviour === 'SkipIfSucess' && result.value === Status.SUCCESS) {
                            break;
                        }
                    }
                }

                payload.push(entry);
            }

            return payload;
        } else if (command.meta.type === 'flat') {
            const payload: {[s: string]: BuffaloTsType.Value} = {};
            let position = 0;

            for (let parameter of command.parameters) {
                const result = BuffaloZcl.read(DataType[parameter.type], buffer, position, {});
                payload[parameter.name] = result.value;
                position += result.length;
            }
        } else if (command.meta.type === 'oneof') {
            if (command === Foundation.discoverRsp) {
                const payload: {[s: string]: BuffaloTsType.Value} = {};
                payload.discComplete = buffer.readUInt8(0);
                payload.attrInfos = [];

                for (let position = 1; position < buffer.length; position) {
                    const entry: {[s: string]: BuffaloTsType.Value} = {};

                    for (let parameter of command.parameters) {
                        const result = BuffaloZcl.read(DataType[parameter.type], buffer, position, {});
                        entry[parameter.name] = result.value;
                        position += result.length;
                    }

                    payload.attrInfos.push(entry);
                }

                return payload;
            }
        }
    }
}

export default ZclFrame;