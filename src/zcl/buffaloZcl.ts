
import {Buffalo, TsType} from '../buffalo';
import DataType from './dataType';

const arraySetBag = [DataType[DataType.array], DataType[DataType.set], DataType[DataType.bag]];

class BuffaloZcl extends Buffalo {
    private static readAttrData(buffer: Buffer, offset: number, options: TsType.Options): TsType.ReadResult {
        if (typeof options.dataType !== 'string') {
            throw new Error(`Data type should be a string`);
        }

        if (arraySetBag.includes(options.dataType)) {
            // TODO: remove
            console.log("\n\n\n\nRead attr data arraysetbag", buffer, "\n\n\n\n");

            const values: TsType.Value = [];
            let position = 0;

            const elementType = DataType[buffer.readUInt8(offset + position)];
            position++;

            const numberOfElements = buffer.readUInt16LE(offset + position);
            position += 2;

            for (let i = 0; i < numberOfElements; i++) {
                const result = this.read(elementType, buffer, offset + position, {});
                position += result.length;
                values.push(result.value);
            }

            return {value: values, length: position};
        } else if (options.dataType === DataType[DataType.struct]) {
            // TODO: remove
            console.log("\n\n\n\nRead attr data struct", buffer, "\n\n\n\n");

            const values: TsType.Value = {};
            let position = 0;

            const numberOfElements = buffer.readUInt16LE(offset + position);
            position += 2;

            for (let i = 0; i < numberOfElements; i++) {
                const elementType = DataType[buffer.readUInt8(offset + position)];
                position++;

                const result = this.read(elementType, buffer, offset + position, {});
                position += result.length;
                values[i] = result.value;
            }

            return {value: values, length: position};
        } else {
            return this.read(options.dataType, buffer, offset, options);
        }
    }

    public static write(type: string, buffer: Buffer, offset: number, value: TsType.Value): number {
        // TODO: remove lowercase once dataTypes are snake case
        return super.write(type.toLowerCase(), buffer, offset, value);
    }

    public static read(type: string, buffer: Buffer, offset: number, options: TsType.Options): TsType.ReadResult {
        if (type === 'attrData') {
            return this.readAttrData(buffer, offset, options);
        } else {
            // TODO: remove lowercase once dataTypes are snake case
            return super.read(type.toLowerCase(), buffer, offset, options);
        }
    }
}

export default BuffaloZcl;
