import {Buffalo} from '../../../buffalo';
import ParameterType from './parameterType';
import {BuffaloZnpOptions} from './tstype';

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public write(type: ParameterType, value: any, options: BuffaloZnpOptions): void {
        switch (type) {
            case ParameterType.UINT8: {
                return this.writeUInt8(value);
            }
            case ParameterType.UINT16: {
                return this.writeUInt16(value);
            }
            case ParameterType.UINT32: {
                return this.writeUInt32(value);
            }
            case ParameterType.IEEEADDR: {
                return this.writeIeeeAddr(value);
            }
            case ParameterType.BUFFER: {
                return this.writeBuffer(value, options.length ?? value.length);
            }
            case ParameterType.BUFFER8: {
                return this.writeBuffer(value, 8);
            }
            case ParameterType.BUFFER16: {
                return this.writeBuffer(value, 16);
            }
            case ParameterType.BUFFER18: {
                return this.writeBuffer(value, 18);
            }
            case ParameterType.BUFFER32: {
                return this.writeBuffer(value, 32);
            }
            case ParameterType.BUFFER42: {
                return this.writeBuffer(value, 42);
            }
            case ParameterType.BUFFER100: {
                return this.writeBuffer(value, 100);
            }
            case ParameterType.LIST_UINT8: {
                return this.writeListUInt8(value);
            }
            case ParameterType.LIST_UINT16: {
                return this.writeListUInt16(value);
            }
            // NOTE: not writable
            // case ParameterType.LIST_NETWORK:
            case ParameterType.INT8: {
                return this.writeInt8(value);
            }
            default: {
                throw new Error(`Write for '${type}' not available`);
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    throw new Error('Cannot read BUFFER without length option specified');
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
                    throw new Error('Cannot read LIST_UINT8 without length option specified');
                }

                return this.readListUInt8(options.length);
            }
            case ParameterType.LIST_UINT16: {
                if (options.length == null) {
                    throw new Error('Cannot read LIST_UINT16 without length option specified');
                }

                return this.readListUInt16(options.length);
            }
            case ParameterType.LIST_NETWORK: {
                if (options.length == null) {
                    throw new Error('Cannot read LIST_NETWORK without length option specified');
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
