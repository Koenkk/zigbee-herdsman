import assert from 'node:assert';

import {ClusterId as ZdoClusterId} from '../../../zspec/zdo';
import {BuffaloZdo} from '../../../zspec/zdo/buffaloZdo';
import {Frame as UnpiFrame} from '../unpi';
import {MaxDataSize, Subsystem, Type} from '../unpi/constants';
import BuffaloZnp from './buffaloZnp';
import Definition from './definition';
import ParameterType from './parameterType';
import {BuffaloZnpOptions, MtCmd, MtParameter, MtType, ZpiObjectPayload} from './tstype';
import {isMtCmdAreqZdo, isMtCmdSreqZdo} from './utils';

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

type ZpiObjectType = 'Request' | 'Response';

export class ZpiObject<T extends ZpiObjectType = 'Response'> {
    public readonly type: Type;
    public readonly subsystem: Subsystem;
    public readonly command: MtCmd;
    public readonly payload: ZpiObjectPayload;
    public readonly unpiFrame: T extends 'Request' ? UnpiFrame : undefined;

    private constructor(
        type: Type,
        subsystem: Subsystem,
        command: MtCmd,
        payload: ZpiObjectPayload,
        unpiFrame: T extends 'Request' ? UnpiFrame : undefined,
    ) {
        this.type = type;
        this.subsystem = subsystem;
        this.command = command;
        this.payload = payload;
        this.unpiFrame = unpiFrame;
    }

    public static createRequest(subsystem: Subsystem, command: string, payload: ZpiObjectPayload): ZpiObject<'Request'> {
        if (!Definition[subsystem]) {
            throw new Error(`Subsystem '${subsystem}' does not exist`);
        }

        const cmd = Definition[subsystem].find((c) => c.name === command);

        if (cmd === undefined || isMtCmdAreqZdo(cmd) || isMtCmdSreqZdo(cmd) || cmd.request === undefined) {
            throw new Error(`Command request '${command}' from subsystem '${subsystem}' not found`);
        }

        // Create the UnpiFrame
        const buffalo = new BuffaloZnp(Buffer.alloc(MaxDataSize));

        for (const parameter of cmd.request) {
            const value = payload[parameter.name];
            buffalo.write(parameter.parameterType, value, {});
        }

        const buffer = buffalo.getWritten();
        const unpiFrame = new UnpiFrame(cmd.type, subsystem, cmd.ID, buffer);

        return new ZpiObject(cmd.type, subsystem, cmd, payload, unpiFrame);
    }

    public static fromUnpiFrame(frame: UnpiFrame): ZpiObject<'Response'> {
        const cmd = Definition[frame.subsystem].find((c) => c.ID === frame.commandID);

        if (!cmd) {
            throw new Error(`CommandID '${frame.commandID}' from subsystem '${frame.subsystem}' not found`);
        }

        let payload: ZpiObjectPayload = {};

        // hotpath AREQ & SREQ ZDO since payload is identical (no need to instantiate BuffaloZnp or parse generically)
        if (isMtCmdAreqZdo(cmd)) {
            if (cmd.zdoClusterId === ZdoClusterId.NETWORK_ADDRESS_RESPONSE || cmd.zdoClusterId === ZdoClusterId.IEEE_ADDRESS_RESPONSE) {
                // ZStack swaps the `startindex` and `numassocdev` compared to ZDO swap them back before handing to ZDO
                const startIndex = frame.data[11];
                const assocDevCount = frame.data[12];
                frame.data[11] = assocDevCount;
                frame.data[12] = startIndex;
                payload.zdo = BuffaloZdo.readResponse(false, cmd.zdoClusterId, frame.data);
            } else {
                payload.srcaddr = frame.data.readUInt16LE(0);
                payload.zdo = BuffaloZdo.readResponse(false, cmd.zdoClusterId, frame.data.subarray(2));
            }
        } else if (isMtCmdSreqZdo(cmd)) {
            payload.status = frame.data.readUInt8(0);
        } else {
            const parameters = frame.type === Type.SRSP && cmd.type !== Type.AREQ ? cmd.response : cmd.request;
            assert(
                parameters,
                `CommandID '${frame.commandID}' from subsystem '${frame.subsystem}' cannot be a ` +
                    `${frame.type === Type.SRSP ? 'response' : 'request'}`,
            );
            payload = this.readParameters(frame.data, parameters);
        }

        // GC UnpiFrame as early as possible, no longer needed
        return new ZpiObject(frame.type, frame.subsystem, cmd, payload, undefined);
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
            /* v8 ignore next */
            (this.command.name === 'systemReset' && this.subsystem === Subsystem.SAPI)
        );
    }

    public toString(includePayload = true): string {
        const baseStr = `${Type[this.type]}: ${Subsystem[this.subsystem]} - ${this.command.name}`;
        return includePayload ? baseStr + ` - ${JSON.stringify(this.payload)}` : baseStr;
    }
}
