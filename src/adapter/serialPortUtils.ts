import SerialPort from 'serialport';
import {EqualsPartial} from '../utils';

interface PortInfoMatch {
    manufacturer: string;
    vendorId: string;
    productId: string;
}

async function find(matchers: PortInfoMatch[]): Promise<string[]> {
    let devices = await SerialPort.list();
    devices = devices.filter((device) => matchers.find((matcher) => EqualsPartial(device, matcher)) != null);
    // @ts-ignore; not sure why this is needed as path exists (definition is wrong?)
    return devices.map((device) => device.path);
}

async function is(path: string, matchers: PortInfoMatch[]): Promise<boolean> {
    const devices = await SerialPort.list();
    // @ts-ignore; not sure why this is needed as path exists (definition is wrong?)
    const device = devices.find((device) => device.path === path);
    return matchers.find((matcher) => EqualsPartial(device, matcher)) != null;
}

export default {is, find};