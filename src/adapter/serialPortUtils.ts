import {SerialPort} from './serialPort'
import {EqualsPartial} from '../utils';

interface PortInfoMatch {
    manufacturer: string;
    vendorId: string;
    productId: string;
}

async function find(matchers: PortInfoMatch[]): Promise<string[]> {
    let devices = await SerialPort.list();
    devices = devices.filter((device) => matchers.find((matcher) => EqualsPartial(device, matcher)) != null);
    return devices.map((device) => device.path);
}

async function is(path: string, matchers: PortInfoMatch[]): Promise<boolean> {
    const devices = await SerialPort.list();
    const device = devices.find((device) => device.path === path);
    if (!device) {
        return false;
    }

    return matchers.find((matcher) => EqualsPartial(device, matcher)) != null;
}

export default {is, find};
