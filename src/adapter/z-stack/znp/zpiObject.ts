import {BuffaloZdo} from '../../../zspec/zdo/buffaloZdo';
import {Frame as UnpiFrame} from '../unpi';
import {MaxDataSize, Subsystem, Type} from '../unpi/constants';
import BuffaloZnp from './buffaloZnp';
import Definition from './definition';
import ParameterType from './parameterType';
import {BuffaloZnpOptions, MtCmd, MtParameter, MtType, ZpiObjectPayload} from './tstype';
import {assertIsMtCmdAreqZdo, isMtCmdAreqZdo} from './utils';

const BufferAndListTypes = [
    ParameterType.BUFFER,
    ParameterType.BUFFER8,
    ParameterType.BUFFER16,
    ParameterType.BUFFER18,
    ParameterType.BUFFER32,
    ParameterType.BUFFER42,
    ParameterType.BUFFER100,
    ParameterType.LIST_UINT16,
    ParameterType.LIST_NETWORK,
    ParameterType.LIST_UINT8,
];

class ZpiObject {
    public readonly type: Type;
    public readonly subsystem: Subsystem;
    public readonly command: MtCmd;
    public readonly payload: ZpiObjectPayload;
    public readonly unpiFrame: UnpiFrame;

    private constructor(type: Type, subsystem: Subsystem, command: MtCmd, payload: ZpiObjectPayload, unpiFrame: UnpiFrame) {
        this.type = type;
        this.subsystem = subsystem;
        this.command = command;
        this.payload = payload;
        this.unpiFrame = unpiFrame;
    }

    public static createRequest(subsystem: Subsystem, command: string, payload: ZpiObjectPayload): ZpiObject {
        if (!Definition[subsystem]) {
            throw new Error(`Subsystem '${subsystem}' does not exist`);
        }

        const cmd = Definition[subsystem].find((c) => c.name === command);
        if (cmd === undefined || isMtCmdAreqZdo(cmd) || cmd?.request === undefined) {
            throw new Error(`Command request '${command}' from subsystem '${subsystem}' not found`);
        }

        // Create the UnpiFrame
        const buffalo = new BuffaloZnp(Buffer.alloc(MaxDataSize));
        for (const parameter of cmd.request) {
            const value = payload[parameter.name];
            buffalo.write(parameter.parameterType, value, {});
        }
        const buffer = buffalo.getWritten();
        const upiFrame = new UnpiFrame(cmd.type, subsystem, cmd.ID, buffer);

        return new ZpiObject(cmd.type, subsystem, cmd, payload, upiFrame);
    }

    public static fromUnpiFrame(frame: UnpiFrame): ZpiObject {
        const cmd = Definition[frame.subsystem].find((c) => c.ID === frame.commandID);

        if (!cmd) {
            throw new Error(`CommandID '${frame.commandID}' from subsystem '${frame.subsystem}' not found`);
        }

        let payload: ZpiObjectPayload = {};
        if (!isMtCmdAreqZdo(cmd)) {
            const parameters = frame.type === Type.SRSP && cmd.type !== Type.AREQ ? cmd.response : cmd.request;
            /* istanbul ignore if */
            if (parameters === undefined) {
                throw new Error(
                    `CommandID '${frame.commandID}' from subsystem '${frame.subsystem}' cannot be a ` +
                        `${frame.type === Type.SRSP ? 'response' : 'request'}`,
                );
            }

            payload = this.readParameters(frame.data, parameters);
        }

        return new ZpiObject(frame.type, frame.subsystem, cmd, payload, frame);
    }

    private static readParameters(buffer: Buffer, parameters: MtParameter[]): ZpiObjectPayload {
        const buffalo = new BuffaloZnp(buffer);
        const result: ZpiObjectPayload = {};

        for (const parameter of parameters) {
            const options: BuffaloZnpOptions = {};

            if (BufferAndListTypes.includes(parameter.parameterType)) {
                // When reading a buffer, assume that the previous parsed parameter contains
                // the length of the buffer
                const lengthParameter = parameters[parameters.indexOf(parameter) - 1];
                const length: MtType = result[lengthParameter.name];

                /* istanbul ignore else */
                if (typeof length === 'number') {
                    options.length = length;
                }
            }

            result[parameter.name] = buffalo.read(parameter.parameterType, options);
        }

        return result;
    }

    public isResetCommand(): boolean {
        return (
            (this.command.name === 'resetReq' && this.subsystem === Subsystem.SYS) ||
            // istanbul ignore next
            (this.command.name === 'systemReset' && this.subsystem === Subsystem.SAPI)
        );
    }

    public parseZdoPayload<T>(): T {
        assertIsMtCmdAreqZdo(this.command);
        const data = this.command.zdo.convert(this.unpiFrame.data);
        return BuffaloZdo.readResponse(this.command.zdo.cluterId, data, false) as T;
    }
}

export default ZpiObject;
