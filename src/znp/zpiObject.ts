import {Subsystem, Type} from '../unpi/constants';
import {Frame as UnpiFrame} from '../unpi';
import {MtCmds, MtCmd, MtParameter} from './constants';

class ZpiObject {
    public readonly subsystem: Subsystem;
    public readonly command: string;
    public readonly commandID: number;
    public readonly payload: {};
    public readonly type: Type;

    private readonly parameters: MtParameter[];

    private constructor(
        type: Type, subsystem: Subsystem, command: string, commandID: number, payload: object,
        parameters: MtParameter[],
    ) {
        this.subsystem = subsystem;
        this.command = command;
        this.commandID = commandID;
        this.payload = payload;
        this.type = type;
        this.parameters = parameters;
    }

    public static createRequest(subsystem: Subsystem, command: string, payload: object): ZpiObject {
        const cmd = MtCmds[subsystem].find((c: MtCmd): boolean => c.name === command);

        if (!cmd) {
            throw new Error(`Command '${command}' from subsystem '${subsystem}' not found`);
        }

        if (cmd.request === undefined) {
            throw new Error(`Command '${command}' from subsystem '${subsystem}' cannot be a request`);
        }

        return new ZpiObject(cmd.type, subsystem, command, cmd.ID, payload, cmd.request);
    }

    public toUnpiFrame(): UnpiFrame {
        const buffer: number[] = [];
        for (let parameter of this.parameters) {
            console.log(parameter);
        }

        return new UnpiFrame(this.type, this.subsystem, this.commandID, buffer);
    }

    public static fromUnpiFrame(frame: UnpiFrame): ZpiObject {
        console.log(Subsystem.SYS);
        const cmd = MtCmds[frame.subsystem].find((c: MtCmd): boolean => c.ID === frame.commandID);

        if (!cmd) {
            throw new Error(`CommandID '${frame.commandID}' from subsystem '${frame.subsystem}' not found`);
        }

        const parameters = frame.type === Type.SRSP ? cmd.response : cmd.request;

        if (parameters === undefined) {
            throw new Error(
                `CommandID '${frame.commandID}' from subsystem '${frame.subsystem}' cannot be a ` +
                `${frame.type === Type.SRSP ? 'response' : 'request'}`
            );
        }
        console.log(frame, parameters);
        return new ZpiObject();
    }
}

export default ZpiObject;