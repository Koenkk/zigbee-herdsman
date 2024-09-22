import assert from 'assert';
import {platform} from 'os';

import {PortInfo} from '@serialport/bindings-cpp';
import Bonjour, {Service} from 'bonjour-service';

import {logger} from '../utils/logger';
import {SerialPort} from './serialPort';
import {SerialPortOptions} from './tstype';

const NS = 'zh:adapter:discovery';

type Adapter = NonNullable<SerialPortOptions['adapter']>;
type DiscoverableUSBAdapter = 'deconz' | 'ember' | 'zstack' | 'zboss' | 'zigate';
type USBFootprint = {
    vendorId: string;
    productId: string;
    manufacturer?: string;
    pathRegex?: string;
};

/**
 * @see https://serialport.io/docs/api-bindings-cpp#list
 *
 * On Windows, there are occurrences where `manufacturer` is replaced by the OS driver. Example: `ITEAD` => `wch.cn`.
 *
 * In virtualized environments, the passthrough mechanism can affect the `path`.
 * Example:
 *   Linux: /dev/serial/by-id/usb-ITEAD_SONOFF_Zigbee_3.0_USB_Dongle_Plus_V2_20240122184111-if00
 *   Windows host => Linux guest: /dev/serial/by-id/usb-1a86_USB_Single_Serial_54DD002111-if00
 *
 * XXX: vendorId `10c4` + productId `ea60` is a problem on Windows since can't match `path` and possibly can't match `manufacturer` to refine properly
 */
const USB_FOOTPRINTS: Record<DiscoverableUSBAdapter, USBFootprint[]> = {
    deconz: [
        {
            // Conbee II
            vendorId: '1cf1',
            productId: '0030',
            manufacturer: 'dresden elektronik ingenieurtechnik GmbH',
            // /dev/serial/by-id/usb-dresden_elektronik_ingenieurtechnik_GmbH_ConBee_II_DE2132111-if00
            pathRegex: '.*conbee.*',
        },
        {
            // Conbee III
            vendorId: '0403',
            productId: '6015',
            manufacturer: 'dresden elektronik ingenieurtechnik GmbH',
            // /dev/serial/by-id/usb-dresden_elektronik_ConBee_III_DE03188111-if00-port0
            pathRegex: '.*conbee.*',
        },
    ],
    ember: [
        // {
        //     // TODO: Easyiot ZB-GW04 (v1.1)
        //     vendorId: '',
        //     productId: '',
        //     manufacturer: '',
        //     pathRegex: '.*.*',
        // },
        // {
        //     // TODO: Easyiot ZB-GW04 (v1.2)
        //     vendorId: '1a86',
        //     productId: '',
        //     manufacturer: '',
        //     // /dev/serial/by-id/usb-1a86_USB_Serial-if00-port0
        //     pathRegex: '.*.*',
        // },
        {
            // Home Assistant SkyConnect
            vendorId: '10c4',
            productId: 'ea60',
            manufacturer: 'Nabu Casa',
            // /dev/serial/by-id/usb-Nabu_Casa_SkyConnect_v1.0_3abe54797c91ed118fc3cad13b20a111-if00-port0
            pathRegex: '.*Nabu_Casa_SkyConnect.*',
        },
        // {
        //     // TODO: Home Assistant Yellow
        //     vendorId: '',
        //     productId: '',
        //     manufacturer: '',
        //     // /dev/ttyAMA1
        //     pathRegex: '.*.*',
        // },
        {
            // SMLight slzb-07
            vendorId: '10c4',
            productId: 'ea60',
            // manufacturer: '',
            // /dev/serial/by-id/usb-Silicon_Labs_CP2102N_USB_to_UART_Bridge_Controller_a215650c853bec119a079e957a0af111-if00-port0
            pathRegex: '.*slzb-07.*',
        },
        {
            // Sonoff ZBDongle-E V2
            vendorId: '1a86',
            productId: '55d4',
            manufacturer: 'ITEAD',
            // /dev/serial/by-id/usb-ITEAD_SONOFF_Zigbee_3.0_USB_Dongle_Plus_V2_20240122184111-if00
            pathRegex: '.*sonoff.*plus.*',
        },
        // {
        //     // TODO: Z-station by z-wave.me (EFR32MG21A020F1024IM32)
        //     vendorId: '',
        //     productId: '',
        //     // manufacturer: '',
        //     // /dev/serial/by-id/usb-Silicon_Labs_CP2105_Dual_USB_to_UART_Bridge_Controller_012BA111-if01-port0
        //     pathRegex: '.*CP2105.*',
        // },
    ],
    zstack: [
        {
            // ZZH
            vendorId: '0403',
            productId: '6015',
            manufacturer: 'Electrolama',
            // pathRegex: '.*.*',
        },
        {
            // slae.sh cc2652rb
            vendorId: '10c4',
            productId: 'ea60',
            // manufacturer: '',
            pathRegex: '.*2652.*',
        },
        {
            // Sonoff ZBDongle-P (CC2652P)
            vendorId: '10c4',
            productId: 'ea60',
            // manufacturer: '',
            // /dev/serial/by-id/usb-Silicon_Labs_Sonoff_Zigbee_3.0_USB_Dongle_Plus_0111-if00-port0
            // /dev/serial/by-id/usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_b8b49abd27a6ed11a280eba32981d111-if00-port0
            pathRegex: '.*sonoff.*plus.*',
        },
        {
            // CC2538
            vendorId: '0451',
            productId: '16c8',
            manufacturer: 'Texas Instruments',
            // zStack30x: /dev/serial/by-id/usb-Texas_Instruments_CC2538_USB_CDC-if00
            pathRegex: '.*CC2538.*',
        },
        {
            // CC2531
            vendorId: '0451',
            productId: '16a8',
            manufacturer: 'Texas Instruments',
            // /dev/serial/by-id/usb-Texas_Instruments_TI_CC2531_USB_CDC___0X00124B0018ED1111-if00
            pathRegex: '.*CC2531.*',
        },
        {
            // CC1352P_2 and CC26X2R1
            vendorId: '0451',
            productId: 'bef3',
            manufacturer: 'Texas Instruments',
            // pathRegex: '.*.*',
        },
        {
            // SMLight slzb-07p7
            vendorId: '',
            productId: '',
            // manufacturer: '',
            // /dev/serial/by-id/usb-SMLIGHT_SMLIGHT_SLZB-07p7_be9faa0786e1ea11bd68dc2d9a583cc7-if00-port0
            pathRegex: '.*SLZB-07p7.*',
        },
        {
            // TubesZB ?
            vendorId: '10c4',
            productId: 'ea60',
            // manufacturer: '',
            pathRegex: '.*tubeszb.*',
        },
        {
            // TubesZB ?
            vendorId: '1a86',
            productId: '7523',
            // manufacturer: '',
            pathRegex: '.*tubeszb.*',
        },
        {
            // ZigStar
            vendorId: '1a86',
            productId: '7523',
            // manufacturer: '',
            pathRegex: '.*zigstar.*',
        },
    ],
    zboss: [
        {
            // Nordic Zigbee NCP
            vendorId: '2fe3',
            productId: '0100',
            manufacturer: 'ZEPHYR',
            // pathRegex: '.*.*',
        },
    ],
    zigate: [
        {
            // ZiGate PL2303HX (blue)
            vendorId: '067b',
            productId: '2303',
            manufacturer: 'zigate_PL2303',
            pathRegex: '.*zigate.*',
        },
        {
            // ZiGate CP2102 (red)
            vendorId: '10c4',
            productId: 'ea60',
            manufacturer: 'zigate_cp2102',
            pathRegex: '.*zigate.*',
        },
        {
            // ZiGate+ V2 CDM_21228
            vendorId: '0403',
            productId: '6015',
            // manufacturer: '',
            // /dev/serial/by-id/usb-FTDI_ZiGate_ZIGATE+-if00-port0
            pathRegex: '.*zigate.*',
        },
    ],
};

function matchUSBFootprint(portInfo: PortInfo, isWindows: boolean, entries: USBFootprint[]): [PortInfo['path'], USBFootprint] | undefined {
    if (!portInfo.vendorId || !portInfo.productId) {
        // port info is missing essential information for proper matching, ignore it
        return;
    }

    for (const entry of entries) {
        if (
            portInfo.vendorId.localeCompare(entry.vendorId, undefined, {sensitivity: 'base'}) === 0 &&
            portInfo.productId.localeCompare(entry.productId, undefined, {sensitivity: 'base'}) === 0 &&
            (!entry.manufacturer ||
                !portInfo.manufacturer ||
                portInfo.manufacturer.localeCompare(entry.manufacturer, undefined, {sensitivity: 'base'}) === 0 ||
                isWindows) &&
            (!entry.pathRegex || new RegExp(entry.pathRegex, 'i').test(portInfo.path) || isWindows)
        ) {
            return [portInfo.path, entry];
        }
    }
}

export async function findUSBAdapter(adapter?: Adapter, path?: string): Promise<[adapter: Adapter, path: PortInfo['path']] | undefined> {
    assert(adapter !== 'auto' && adapter !== 'ezsp', `Cannot discover USB adapter for '${adapter}'.`);

    const isWindows = platform() === 'win32';

    for (const portInfo of await SerialPort.list()) {
        if (path && portInfo.path !== path) {
            continue;
        }

        if (adapter) {
            const match = matchUSBFootprint(portInfo, isWindows, USB_FOOTPRINTS[adapter]);

            if (match) {
                logger.info(`Matched adapter: ${JSON.stringify(portInfo)} => ${adapter}: ${JSON.stringify(match[1])}`, NS);
                return [adapter, match[0]];
            }

            continue;
        }

        for (const key in USB_FOOTPRINTS) {
            const match = matchUSBFootprint(portInfo, isWindows, USB_FOOTPRINTS[key as DiscoverableUSBAdapter]!);

            if (match) {
                logger.info(`Matched adapter: ${JSON.stringify(portInfo)} => ${key}: ${JSON.stringify(match[1])}`, NS);
                return [key as Adapter, match[0]];
            }
        }
    }
}

export async function findmDNSAdapter(path: string): Promise<[adapter: string, path: string, baudRate: number]> {
    const mdnsDevice = path.substring(7);

    if (mdnsDevice.length == 0) {
        throw new Error(`No mdns device specified. You must specify the coordinator mdns service type after mdns://, e.g. mdns://my-adapter`);
    }

    const bj = new Bonjour();
    const mdnsTimeout = 2000; // timeout for mdns scan

    logger.info(`Starting mdns discovery for coordinator: ${mdnsDevice}`, NS);

    return await new Promise((resolve, reject) => {
        bj.findOne({type: mdnsDevice}, mdnsTimeout, function (service: Service) {
            if (service) {
                if (service.txt?.radio_type && service.txt?.baud_rate && service.addresses && service.port) {
                    const mdnsIp = service.addresses[0];
                    const mdnsPort = service.port;
                    const mdnsAdapter = (service.txt.radio_type == 'znp' ? 'zstack' : service.txt.radio_type) as Adapter;
                    const mdnsBaud = parseInt(service.txt.baud_rate);

                    logger.info(`Coordinator Ip: ${mdnsIp}`, NS);
                    logger.info(`Coordinator Port: ${mdnsPort}`, NS);
                    logger.info(`Coordinator Radio: ${mdnsAdapter}`, NS);
                    logger.info(`Coordinator Baud: ${mdnsBaud}\n`, NS);
                    bj.destroy();

                    path = `tcp://${mdnsIp}:${mdnsPort}`;
                    const adapter = mdnsAdapter;
                    const baudRate = mdnsBaud;

                    if (adapter && adapter !== 'auto') {
                        resolve([adapter, path, baudRate]);
                    } else {
                        reject(new Error(`Adapter ${adapter} is not supported.`));
                    }
                } else {
                    bj.destroy();
                    reject(
                        new Error(
                            `Coordinator returned wrong Zeroconf format! The following values are expected:\n` +
                                `txt.radio_type, got: ${service.txt?.radio_type}\n` +
                                `txt.baud_rate, got: ${service.txt?.baud_rate}\n` +
                                `address, got: ${service.addresses?.[0]}\n` +
                                `port, got: ${service.port}`,
                        ),
                    );
                }
            } else {
                bj.destroy();
                reject(new Error(`Coordinator [${mdnsDevice}] not found after timeout of ${mdnsTimeout}ms!`));
            }
        });
    });
}

export async function findTCPAdapter(path: string, adapter?: Adapter): Promise<[adapter: string, path: string]> {
    const regex = /^(?:tcp:\/\/)[\w.-]+[:][\d]+$/gm;

    if (!regex.test(path) || !adapter || adapter === 'auto') {
        throw new Error(`Cannot discover TCP adapters at this time. Please specify valid 'adapter' and 'path' manually.`);
    }

    return [adapter, path];
}

/**
 * Discover adapter using mDNS, TCP or USB.
 *
 * @param adapter The adapter type.
 *   - mDNS: Unused.
 *   - TCP: Required, cannot discover at this time.
 *   - USB: Optional, limits the discovery to the specified adapter type.
 * @param path The path to the adapter.
 *   - mDNS: Required, serves to initiate the discovery.
 *   - TCP: Required, cannot discover at this time.
 *   - USB: Optional, limits the discovery to the specified path.
 * @returns adapter An adapter type supported by Z2M. While result is TS-typed, this should be validated against actual values before use.
 * @returns path Path to adapter.
 * @returns baudRate [optional] Discovered baud rate of the adapter. Valid only for mDNS discovery at the moment.
 */
export async function discoverAdapter(adapter?: Adapter, path?: string): Promise<[adapter: string, path: string, baudRate?: number | undefined]> {
    if (path) {
        if (path.startsWith('mdns://')) {
            return await findmDNSAdapter(path);
        } else if (path.startsWith('tcp://')) {
            return await findTCPAdapter(path, adapter);
        }
    }

    // default to matching USB
    const match = await findUSBAdapter(adapter === 'auto' ? undefined : adapter, path);

    if (!match) {
        throw new Error(`Unable to find matching USB adapter.`);
    }

    return match;
}
