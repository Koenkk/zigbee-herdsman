import SerialPort from 'serialport';
import {EqualsStringPropertyIgnoreCase} from '../utils';

interface PortInfoMatch {
    manufacturer: string;
    vendorId: string;
    productId: string;
}

async function find(matchers: PortInfoMatch[]): Promise<string[]> {
    let devices = await SerialPort.list();
    devices = devices.filter((device) => matchers.find(
        (matcher) => EqualsStringPropertyIgnoreCase(device, matcher as unknown as {[key: string]: string })) != null);
    
    return devices.map((device) => device.path);
}

async function is(path: string, matchers: PortInfoMatch[]): Promise<boolean> {
    const devices = await SerialPort.list();
    const device = devices.find((device) => device.path?.toLowerCase() === path?.toLowerCase());
    if (!device) {
        return false;
    }

    return !!matchers.find(matcher => 
        EqualsStringPropertyIgnoreCase(device, matcher as unknown as {[key: string]: string }));
}

export default {is, find};