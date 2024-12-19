/* v8 ignore start */

import {logger} from '../../../utils/logger';
import BuffaloZiGate, {BuffaloZiGateOptions} from './buffaloZiGate';
import {ZiGateCommand, ZiGateCommandParameter, ZiGateCommandType} from './commandType';
import {ZiGateCommandCode, ZiGateMessageCode, ZiGateObjectPayload} from './constants';
import ZiGateFrame from './frame';
import {ZiGateMessage, ZiGateMessageParameter} from './messageType';
import ParameterType from './parameterType';

type ZiGateCode = ZiGateCommandCode | ZiGateMessageCode;
type ZiGateParameter = ZiGateCommandParameter | ZiGateMessageParameter;

const NS = 'zh:zigate:object';

const BufferAndListTypes: ParameterType[] = [
    ParameterType.BUFFER,
    ParameterType.BUFFER8,
    ParameterType.BUFFER16,
    ParameterType.BUFFER18,
    ParameterType.BUFFER32,
    ParameterType.BUFFER42,
    ParameterType.BUFFER100,
    ParameterType.LIST_UINT16,
    ParameterType.LIST_UINT8,
];

class ZiGateObject {
    private readonly _code: ZiGateCode;
    private readonly _payload: ZiGateObjectPayload;
    private readonly _parameters: ZiGateParameter[];
    private readonly _frame?: ZiGateFrame;

    private constructor(code: ZiGateCode, payload: ZiGateObjectPayload, parameters: ZiGateParameter[], frame?: ZiGateFrame) {
        this._code = code;
        this._payload = payload;
        this._parameters = parameters;
        this._frame = frame;
    }

    get code(): ZiGateCode {
        return this._code;
    }

    get frame(): ZiGateFrame | undefined {
        return this._frame;
    }

    get payload(): ZiGateObjectPayload {
        return this._payload;
    }

    get command(): ZiGateCommandType {
        return ZiGateCommand[this._code];
    }

    public static createRequest(commandCode: ZiGateCommandCode, payload: ZiGateObjectPayload): ZiGateObject {
        const cmd = ZiGateCommand[commandCode];

        if (!cmd) {
            throw new Error(`Command '${commandCode}' not found`);
        }

        return new ZiGateObject(commandCode, payload, cmd.request);
    }

    public static fromZiGateFrame(frame: ZiGateFrame): ZiGateObject {
        const code = frame.readMsgCode();
        return ZiGateObject.fromBuffer(code, frame.msgPayloadBytes, frame);
    }

    public static fromBuffer(code: number, buffer: Buffer, frame: ZiGateFrame): ZiGateObject {
        const msg = ZiGateMessage[code];

        if (!msg) {
            throw new Error(`Message '${code.toString(16)}' not found`);
        }

        const parameters = msg.response;
        if (parameters === undefined) {
            throw new Error(`Message '${code.toString(16)}' cannot be a response`);
        }

        const payload = this.readParameters(buffer, parameters);

        return new ZiGateObject(code, payload, parameters, frame);
    }

    private static readParameters(buffer: Buffer, parameters: ZiGateParameter[]): ZiGateObjectPayload {
        const buffalo = new BuffaloZiGate(buffer);
        const result: ZiGateObjectPayload = {};

        for (const parameter of parameters) {
            const options: BuffaloZiGateOptions = {};

            if (BufferAndListTypes.includes(parameter.parameterType)) {
                // When reading a buffer, assume that the previous parsed parameter contains
                // the length of the buffer
                const lengthParameter = parameters[parameters.indexOf(parameter) - 1];
                const length = result[lengthParameter.name];

                if (typeof length === 'number') {
                    options.length = length;
                }
            }

            try {
                result[parameter.name] = buffalo.read(parameter.parameterType, options);
            } catch (error) {
                logger.error((error as Error).stack!, NS);
            }
        }

        if (buffalo.isMore()) {
            const bufferString = buffalo.getBuffer().toString('hex');
            logger.debug(
                `Last bytes of data were not parsed \x1b[32m${bufferString.slice(0, buffalo.getPosition() * 2).replace(/../g, '$& ')}` +
                    `\x1b[31m${bufferString.slice(buffalo.getPosition() * 2).replace(/../g, '$& ')}\x1b[0m `,
                NS,
            );
        }

        return result;
    }

    public toZiGateFrame(): ZiGateFrame {
        const buffer = this.createPayloadBuffer();
        const frame = new ZiGateFrame();
        frame.writeMsgCode(this._code as number);
        frame.writeMsgPayload(buffer);
        return frame;
    }

    private createPayloadBuffer(): Buffer {
        const buffalo = new BuffaloZiGate(Buffer.alloc(256)); // hardcode @todo

        for (const parameter of this._parameters) {
            const value = this._payload[parameter.name];
            buffalo.write(parameter.parameterType, value, {});
        }
        return buffalo.getWritten();
    }
}

export default ZiGateObject;
