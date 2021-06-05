/* istanbul ignore file */
/* eslint-disable */
import ZiGateFrame from './frame';
import BuffaloZiGate, {BuffaloZiGateOptions} from './buffaloZiGate';
import {ZiGateCommandCode, ZiGateMessageCode, ZiGateObjectPayload} from "./constants";
import {ZiGateMessage, ZiGateMessageParameter} from "./messageType";
import {ZiGateCommand, ZiGateCommandParameter, ZiGateCommandType} from "./commandType";
import {Debug} from '../debug';

type ZiGateCode = ZiGateCommandCode | ZiGateMessageCode;
type ZiGateParameter = ZiGateCommandParameter | ZiGateMessageParameter;


const debug = Debug('driver:ziGateObject');

const BufferAndListTypes = [
    'BUFFER', 'BUFFER8', 'BUFFER16',
    'BUFFER18', 'BUFFER32', 'BUFFER42',
    'BUFFER100', 'LIST_UINT16', 'LIST_ROUTING_TABLE',
    'LIST_BIND_TABLE', 'LIST_NEIGHBOR_LQI', 'LIST_NETWORK',
    'LIST_ASSOC_DEV', 'LIST_UINT8',
];

class ZiGateObject {
    private readonly _code: ZiGateCode;
    private readonly _payload: ZiGateObjectPayload;
    private readonly _parameters: ZiGateParameter[];
    private readonly _frame: ZiGateFrame;

    private constructor(
        code: ZiGateCode,
        payload: ZiGateObjectPayload,
        parameters: ZiGateParameter[],
        frame?: ZiGateFrame
    ) {
        this._code = code;
        this._payload = payload;
        this._parameters = parameters;
        this._frame = frame;
    }

    get code(): ZiGateCode {
        return this._code;
    }

    get frame(): ZiGateFrame {
        return this._frame;
    }

    get payload(): ZiGateObjectPayload {
        return this._payload;
    }

    get command(): ZiGateCommandType {
        return ZiGateCommand[this._code];
    }

    public static createRequest(
        commandCode: ZiGateCommandCode,
        payload: ZiGateObjectPayload
    ): ZiGateObject {
        const cmd = ZiGateCommand[commandCode];

        if (!cmd) {
            throw new Error(`Command '${commandCode}' not found`);
        }

        return new ZiGateObject(commandCode, payload, cmd.request);
    }

    public static fromZiGateFrame(frame: ZiGateFrame): ZiGateObject {
        const code = frame.readMsgCode();
        return ZiGateObject.fromBufer(code, frame.msgPayloadBytes, frame);
    }

    public static fromBufer(code: number, buffer: Buffer, frame?: ZiGateFrame): ZiGateObject {
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
            } catch (e) {
                debug.error(e.stack);
            }
        }

        if (buffalo.isMore()) {
            let bufferString = buffalo.getBuffer().toString('hex');
            debug.error(
                "Last bytes of data were not parsed \x1b[32m%s\x1b[31m%s\x1b[0m ",
                bufferString.slice(0, (buffalo.getPosition() * 2)).replace(/../g, "$& "),
                bufferString.slice(buffalo.getPosition() * 2).replace(/../g, "$& ")
            )
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
