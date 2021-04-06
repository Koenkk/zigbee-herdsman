import {Subsystem, Type, MaxDataSize} from '../unpi/constants';
import {Frame as UnpiFrame} from '../unpi';
import Definition from './definition';
import BuffaloZnp from './buffaloZnp';
import ParameterType from './parameterType';
import {MtParameter, MtCmd, ZpiObjectPayload, MtType, BuffaloZnpOptions} from './tstype';

const BufferAndListTypes = [
    ParameterType.BUFFER, ParameterType.BUFFER8, ParameterType.BUFFER16,
    ParameterType.BUFFER18, ParameterType.BUFFER32, ParameterType.BUFFER42,
    ParameterType.BUFFER100, ParameterType.LIST_UINT16, ParameterType.LIST_ROUTING_TABLE,
    ParameterType.LIST_BIND_TABLE, ParameterType.LIST_NEIGHBOR_LQI, ParameterType.LIST_NETWORK,
    ParameterType.LIST_ASSOC_DEV, ParameterType.LIST_UINT8,
];

class ZpiObject {
    public readonly subsystem: Subsystem;
    public readonly command: string;
    public readonly commandID: number;
    public readonly payload: ZpiObjectPayload;
    public readonly type: Type;

    private readonly parameters: MtParameter[];

    private constructor(
        type: Type, subsystem: Subsystem, command: string, commandID: number, payload: ZpiObjectPayload,
        parameters: MtParameter[],
    ) {
        this.subsystem = subsystem;
        this.command = command;
        this.commandID = commandID;
        this.payload = payload;
        this.type = type;
        this.parameters = parameters;
    }

    public static createRequest(subsystem: Subsystem, command: string, payload: ZpiObjectPayload): ZpiObject {
        if (!Definition[subsystem]) {
            throw new Error(`Subsystem '${subsystem}' does not exist`);
        }

        const cmd = Definition[subsystem].find((c: MtCmd): boolean => c.name === command);

        if (!cmd) {
            throw new Error(`Command '${command}' from subsystem '${subsystem}' not found`);
        }

        return new ZpiObject(cmd.type, subsystem, command, cmd.ID, payload, cmd.request);
    }

    public toUnpiFrame(): UnpiFrame {
        const buffer = this.createPayloadBuffer();
        return new UnpiFrame(this.type, this.subsystem, this.commandID, buffer);
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
                `${frame.type === Type.SRSP ? 'response' : 'request'}`
            );
        }

        const payload = this.readParameters(frame.data, parameters);
        return new ZpiObject(frame.type, frame.subsystem, cmd.name, cmd.ID, payload, parameters);
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

                if (parameter.parameterType === ParameterType.LIST_ASSOC_DEV) {
                    // For LIST_ASSOC_DEV, we also need to grab the startindex which is right before the length
                    const startIndexParameter = parameters[parameters.indexOf(parameter) - 2];
                    const startIndex: MtType = result[startIndexParameter.name];

                    /* istanbul ignore else */
                    if (typeof startIndex === 'number') {
                        options.startIndex = startIndex;
                    }
                }
            }

            result[parameter.name] = buffalo.read(ParameterType[parameter.parameterType], options);
        }

        return result;
    }

    private createPayloadBuffer(): Buffer {
        const buffalo = new BuffaloZnp(Buffer.alloc(MaxDataSize));

        for (const parameter of this.parameters) {
            const value = this.payload[parameter.name];
            buffalo.write(ParameterType[parameter.parameterType], value, {});
        }

        return buffalo.getWritten();
    }

    public isResetCommand(): boolean {
        return (this.command === 'resetReq' && this.subsystem === Subsystem.SYS) ||
            (this.command === 'systemReset' && this.subsystem === Subsystem.SAPI);
    }
}

export default ZpiObject;