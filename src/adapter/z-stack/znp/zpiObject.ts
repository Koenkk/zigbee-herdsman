import {Frame as UnpiFrame} from '../unpi';
import {MaxDataSize, Subsystem, Type} from '../unpi/constants';
import BuffaloZnp from './buffaloZnp';
import Definition from './definition';
import ParameterType from './parameterType';
import {BuffaloZnpOptions, MtCmd, MtCmdZdoResp, MtParameter, MtType, ZpiObjectPayload} from './tstype';

const BufferAndListTypes = [
    ParameterType.BUFFER,
    ParameterType.BUFFER8,
    ParameterType.BUFFER16,
    ParameterType.BUFFER18,
    ParameterType.BUFFER32,
    ParameterType.BUFFER42,
    ParameterType.BUFFER100,
    ParameterType.LIST_UINT16,
    ParameterType.LIST_ROUTING_TABLE,
    ParameterType.LIST_BIND_TABLE,
    ParameterType.LIST_NEIGHBOR_LQI,
    ParameterType.LIST_NETWORK,
    ParameterType.LIST_UINT8,
];

class ZpiObject {
    public readonly subsystem: Subsystem;
    public readonly command: MtCmd | MtCmdZdoResp;
    public readonly payload: ZpiObjectPayload;
    public readonly unpiFrame: UnpiFrame;

    private constructor(subsystem: Subsystem, command: MtCmd, payload: ZpiObjectPayload, unpiFrame: UnpiFrame) {
        this.subsystem = subsystem;
        this.command = command;
        this.payload = payload;
        this.unpiFrame = unpiFrame;
    }

    public static createRequest(subsystem: Subsystem, command: string, payload: ZpiObjectPayload): ZpiObject {
        if (!Definition[subsystem]) {
            throw new Error(`Subsystem '${subsystem}' does not exist`);
        }

        const cmd = Definition[subsystem].find((c: MtCmd): boolean => c.name === command);
        if (cmd?.request === undefined) {
            throw new Error(`Command request '${command}' from subsystem '${subsystem}' not found`);
        }

        const upiFrame = this.createUnpiFrame(cmd, subsystem, payload);
        return new ZpiObject(subsystem, cmd, payload, upiFrame);
    }

    private static createUnpiFrame(command: MtCmd, subsystem: Subsystem, payload: ZpiObjectPayload): UnpiFrame {
        const buffalo = new BuffaloZnp(Buffer.alloc(MaxDataSize));

        for (const parameter of command.request) {
            const value = payload[parameter.name];
            buffalo.write(parameter.parameterType, value, {});
        }

        const buffer = buffalo.getWritten();
        return new UnpiFrame(command.type, subsystem, command.ID, buffer);
    }

    public static fromUnpiFrame(frame: UnpiFrame): ZpiObject {
        const cmd = Definition[frame.subsystem].find((c: MtCmd): boolean => c.ID === frame.commandID);

        if (!cmd) {
            throw new Error(`CommandID '${frame.commandID}' from subsystem '${frame.subsystem}' not found`);
        }

        const parameters = frame.type === Type.SRSP ? cmd.response : cmd.request;

        if (parameters === undefined) {
            /* istanbul ignore next */
            throw new Error(
                `CommandID '${frame.commandID}' from subsystem '${frame.subsystem}' cannot be a ` +
                    `${frame.type === Type.SRSP ? 'response' : 'request'}`,
            );
        }

        const payload = this.readParameters(frame.data, parameters);
        return new ZpiObject(frame.subsystem, cmd, payload, frame);
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
            (this.command.name === 'systemReset' && this.subsystem === Subsystem.SAPI)
        );
    }
}

export default ZpiObject;
