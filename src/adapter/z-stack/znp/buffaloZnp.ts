import {Buffalo} from "../../../buffalo";
import ParameterType from "./parameterType";
import type {BuffaloZnpOptions} from "./tstype";

interface Network {
    neightborPanId: number;
    logicalChannel: number;
    stackProfile: number;
    zigbeeVersion: number;
    beaconOrder: number;
    superFrameOrder: number;
    permitJoin: number;
}

class BuffaloZnp extends Buffalo {
    private readListNetwork(length: number): Network[] {
        const value: Network[] = [];
        for (let i = 0; i < length; i++) {
            const neightborPanId = this.readUInt16();
            const logicalChannel = this.readUInt8();
            const value1 = this.readUInt8();
            const value2 = this.readUInt8();
            const permitJoin = this.readUInt8();

            value.push({
                neightborPanId,
                logicalChannel,
                stackProfile: value1 & 0x0f,
                zigbeeVersion: (value1 & 0xf0) >> 4,
                beaconOrder: value2 & 0x0f,
                superFrameOrder: (value2 & 0xf0) >> 4,
                permitJoin,
            });
        }

        return value;
    }
    // biome-ignore lint/suspicious/noExplicitAny: API
    public write(type: ParameterType, value: any, options: BuffaloZnpOptions): void {
        switch (type) {
            case ParameterType.UINT8: {
                this.writeUInt8(value);
                break;
            }
            case ParameterType.UINT16: {
                this.writeUInt16(value);
                break;
            }
            case ParameterType.UINT32: {
                this.writeUInt32(value);
                break;
            }
            case ParameterType.IEEEADDR: {
                this.writeIeeeAddr(value);
                break;
            }
            case ParameterType.BUFFER: {
                this.writeBuffer(value, options.length ?? value.length);
                break;
            }
            case ParameterType.BUFFER8: {
                this.writeBuffer(value, 8);
                break;
            }
            case ParameterType.BUFFER16: {
                this.writeBuffer(value, 16);
                break;
            }
            case ParameterType.BUFFER18: {
                this.writeBuffer(value, 18);
                break;
            }
            case ParameterType.BUFFER32: {
                this.writeBuffer(value, 32);
                break;
            }
            case ParameterType.BUFFER42: {
                this.writeBuffer(value, 42);
                break;
            }
            case ParameterType.BUFFER100: {
                this.writeBuffer(value, 100);
                break;
            }
            case ParameterType.LIST_UINT8: {
                this.writeListUInt8(value);
                break;
            }
            case ParameterType.LIST_UINT16: {
                this.writeListUInt16(value);
                break;
            }
            // NOTE: not writable
            // case ParameterType.LIST_NETWORK:
            case ParameterType.INT8: {
                this.writeInt8(value);
                break;
            }
            default: {
                throw new Error(`Write for '${type}' not available`);
            }
        }
    }
    // biome-ignore lint/suspicious/noExplicitAny: API
    public read(type: ParameterType, options: BuffaloZnpOptions): any {
        switch (type) {
            case ParameterType.UINT8: {
                return this.readUInt8();
            }
            case ParameterType.UINT16: {
                return this.readUInt16();
            }
            case ParameterType.UINT32: {
                return this.readUInt32();
            }
            case ParameterType.IEEEADDR: {
                return this.readIeeeAddr();
            }
            case ParameterType.BUFFER: {
                if (options.length == null) {
                    throw new Error("Cannot read BUFFER without length option specified");
                }

                return this.readBuffer(options.length);
            }
            case ParameterType.BUFFER8: {
                return this.readBuffer(8);
            }
            case ParameterType.BUFFER16: {
                return this.readBuffer(16);
            }
            case ParameterType.BUFFER18: {
                return this.readBuffer(18);
            }
            case ParameterType.BUFFER32: {
                return this.readBuffer(32);
            }
            case ParameterType.BUFFER42: {
                return this.readBuffer(42);
            }
            case ParameterType.BUFFER100: {
                return this.readBuffer(100);
            }
            case ParameterType.LIST_UINT8: {
                if (options.length == null) {
                    throw new Error("Cannot read LIST_UINT8 without length option specified");
                }

                return this.readListUInt8(options.length);
            }
            case ParameterType.LIST_UINT16: {
                if (options.length == null) {
                    throw new Error("Cannot read LIST_UINT16 without length option specified");
                }

                return this.readListUInt16(options.length);
            }
            case ParameterType.LIST_NETWORK: {
                if (options.length == null) {
                    throw new Error("Cannot read LIST_NETWORK without length option specified");
                }

                return this.readListNetwork(options.length);
            }
            case ParameterType.INT8: {
                return this.readInt8();
            }
            default: {
                throw new Error(`Read for '${type}' not available`);
            }
        }
    }
}

export default BuffaloZnp;
