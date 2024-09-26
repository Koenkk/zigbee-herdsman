import {platform} from 'os';

import {PortInfo} from '@serialport/bindings-cpp';
import {Bonjour, Service} from 'bonjour-service';

import {logger} from '../utils/logger';
import {SerialPort} from './serialPort';
import {Adapter, DiscoverableUSBAdapter, USBAdapterFingerprint, ValidAdapter} from './tstype';

const NS = 'zh:adapter:discovery';

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
const USB_FINGERPRINTS: Record<DiscoverableUSBAdapter, USBAdapterFingerprint[]> = {
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
            manufacturer: 'SMLIGHT',
            // /dev/serial/by-id/usb-SMLIGHT_SMLIGHT_SLZB-07_be9faa0786e1ea11bd68dc2d9a583111-if00-port0
            // /dev/serial/by-id/usb-Silicon_Labs_CP2102N_USB_to_UART_Bridge_Controller_a215650c853bec119a079e957a0af111-if00-port0
            pathRegex: '.*slzb-07_.*', // `_` to not match 07p7
        },
        {
            // Sonoff ZBDongle-E V2
            vendorId: '1a86',
            productId: '55d4',
            manufacturer: 'ITEAD',
            // /dev/serial/by-id/usb-ITEAD_SONOFF_Zigbee_3.0_USB_Dongle_Plus_V2_20240122184111-if00
            // /dev/serial/by-id/usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_186ff44314e2ed11b891eb5162c61111-if00-port0
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
            pathRegex: '.*electrolame.*', // TODO
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
            manufacturer: 'ITEAD',
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
            // CC1352P_2
            vendorId: '0451',
            productId: 'bef3',
            manufacturer: 'Texas Instruments',
            pathRegex: '.*CC1352P_2.*', // TODO
        },
        {
            // CC26X2R1
            vendorId: '0451',
            productId: 'bef3',
            manufacturer: 'Texas Instruments',
            pathRegex: '.*CC26X2R1.*', // TODO
        },
        {
            // SMLight slzb-07p7
            vendorId: '10c4',
            productId: 'ea60',
            manufacturer: 'SMLIGHT',
            // /dev/serial/by-id/usb-SMLIGHT_SMLIGHT_SLZB-07p7_be9faa0786e1ea11bd68dc2d9a583111-if00-port0
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
            // /dev/serial/by-id/usb-ZEPHYR_Zigbee_NCP_54ACCFAFA6DAD111-if00
            pathRegex: '.*ZEPHYR.*',
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

/**
 * Vendor and Product IDs that are prone to conflict if only matching on vendorId+productId.
 */
const USB_FINGERPRINTS_CONFLICT_IDS: ReadonlyArray<string /* vendorId:productId */> = ['10c4:ea60'];

async function getSerialPortList(): Promise<PortInfo[]> {
    const portInfos = await SerialPort.list();

    // TODO: can sorting be removed in favor of `path` regex matching?

    // CC1352P_2 and CC26X2R1 lists as 2 USB devices with same manufacturer, productId and vendorId
    // one is the actual chip interface, other is the XDS110.
    // The chip is always exposed on the first one after alphabetical sorting.
    /* istanbul ignore next */
    portInfos.sort((a, b) => (a.path < b.path ? -1 : 1));

    return portInfos;
}

/**
 * Case insensitive string matching.
 * @param str1
 * @param str2
 * @returns
 */
function matchString(str1: string, str2: string): boolean {
    return str1.localeCompare(str2, undefined, {sensitivity: 'base'}) === 0;
}

/**
 * Case insensitive regex matching.
 * @param regexStr Passed to RegExp constructor.
 * @param str Always returns false if undefined.
 * @returns
 */
function matchRegex(regexStr: string, str?: string): boolean {
    return str !== undefined && new RegExp(regexStr, 'i').test(str);
}

function matchUSBFingerprint(
    portInfo: PortInfo,
    entries: USBAdapterFingerprint[],
    isWindows: boolean,
    conflictProne: boolean,
): [PortInfo['path'], USBAdapterFingerprint] | undefined {
    if (!portInfo.vendorId || !portInfo.productId) {
        // port info is missing essential information for proper matching, ignore it
        return;
    }

    for (const entry of entries) {
        if (!matchString(portInfo.vendorId, entry.vendorId) || !matchString(portInfo.productId, entry.productId)) {
            continue;
        }

        if (conflictProne) {
            // if vendor+product combo is conflict prone, enforce at least one of manufacturer or pathRegex to match to avoid false positive
            if (
                (entry.manufacturer && portInfo.manufacturer && matchString(portInfo.manufacturer, entry.manufacturer)) ||
                (entry.pathRegex && (matchRegex(entry.pathRegex, portInfo.path) || matchRegex(entry.pathRegex, portInfo.pnpId)))
            ) {
                return [portInfo.path, entry];
            }
        } else if (
            (!entry.manufacturer || !portInfo.manufacturer || matchString(portInfo.manufacturer, entry.manufacturer) || isWindows) &&
            (!entry.pathRegex || matchRegex(entry.pathRegex, portInfo.path) || matchRegex(entry.pathRegex, portInfo.pnpId) || isWindows)
        ) {
            // if entry has either manufacturer or pathRegex, match as much as possible:
            //   - match manufacturer if available
            //   - try to match pathRegex against path or pnpId
            // on Windows, allow fuzzier match, since manufacturer can get overridden by OS driver and path is COM
            return [portInfo.path, entry];
        }
    }
}

export async function matchUSBAdapter(adapter: ValidAdapter, path: string): Promise<boolean> {
    const isWindows = platform() === 'win32';
    const portList = await getSerialPortList();

    logger.debug(() => `Connected devices: ${JSON.stringify(portList)}`, NS);

    for (const portInfo of portList) {
        /* istanbul ignore else */
        if (portInfo.path !== path) {
            continue;
        }

        const conflictProne = USB_FINGERPRINTS_CONFLICT_IDS.includes(`${portInfo.vendorId}:${portInfo.productId}`);
        const match = matchUSBFingerprint(portInfo, USB_FINGERPRINTS[adapter === 'ezsp' ? 'ember' : adapter], isWindows, conflictProne);

        /* istanbul ignore else */
        if (match) {
            logger.info(() => `Matched adapter: ${JSON.stringify(portInfo)} => ${adapter}: ${JSON.stringify(match[1])}`, NS);
            return true;
        }
    }

    return false;
}

export async function findUSBAdapter(
    adapter?: ValidAdapter,
    path?: string,
): Promise<[adapter: DiscoverableUSBAdapter, path: PortInfo['path']] | undefined> {
    const isWindows = platform() === 'win32';
    // refine to DiscoverableUSBAdapter
    adapter = adapter && adapter === 'ezsp' ? 'ember' : adapter;
    const portList = await getSerialPortList();

    logger.debug(() => `Connected devices: ${JSON.stringify(portList)}`, NS);

    for (const portInfo of portList) {
        if (path && portInfo.path !== path) {
            continue;
        }

        const conflictProne = USB_FINGERPRINTS_CONFLICT_IDS.includes(`${portInfo.vendorId}:${portInfo.productId}`);

        for (const key in USB_FINGERPRINTS) {
            if (adapter && adapter !== key) {
                continue;
            }

            const match = matchUSBFingerprint(portInfo, USB_FINGERPRINTS[key as DiscoverableUSBAdapter]!, isWindows, conflictProne);

            if (match) {
                logger.info(() => `Matched adapter: ${JSON.stringify(portInfo)} => ${key}: ${JSON.stringify(match[1])}`, NS);
                return [key as DiscoverableUSBAdapter, match[0]];
            }
        }
    }
}

export async function findmDNSAdapter(path: string): Promise<[adapter: ValidAdapter, path: string, baudRate: number]> {
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

export async function findTCPAdapter(path: string, adapter?: Adapter): Promise<[adapter: ValidAdapter, path: string]> {
    const regex = /^tcp:\/\/(?:[0-9]{1,3}\.){3}[0-9]{1,3}:\d{1,5}$/gm;

    if (!regex.test(path)) {
        throw new Error(`Invalid TCP path, expected format: tcp://<host>:<port>`);
    }

    if (!adapter || adapter === 'auto') {
        throw new Error(`Cannot discover TCP adapters at this time. Specify valid 'adapter' and 'port' in your configuration.`);
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
export async function discoverAdapter(
    adapter?: Adapter,
    path?: string,
): Promise<[adapter: ValidAdapter, path: string, baudRate?: number | undefined]> {
    if (path) {
        if (path.startsWith('mdns://')) {
            return await findmDNSAdapter(path);
        } else if (path.startsWith('tcp://')) {
            return await findTCPAdapter(path, adapter);
        } else if (adapter && adapter !== 'auto') {
            try {
                const matched = await matchUSBAdapter(adapter, path);

                /* istanbul ignore else */
                if (!matched) {
                    logger.debug(`Unable to match USB adapter: ${adapter} | ${path}`, NS);
                }
            } catch (error) {
                logger.debug(`Error while trying to match USB adapter (${(error as Error).message}).`, NS);
            }

            return [adapter, path];
        }
    }

    try {
        // default to matching USB
        const match = await findUSBAdapter(adapter && adapter !== 'auto' ? adapter : undefined, path);

        if (!match) {
            throw new Error(`No valid USB adapter found`);
        }

        // keep adapter if `ezsp` since findUSBAdapter returns DiscoverableUSBAdapter
        return adapter && adapter === 'ezsp' ? [adapter, match[1]] : match;
    } catch (error) {
        throw new Error(`USB adapter discovery error (${(error as Error).message}). Specify valid 'adapter' and 'port' in your configuration.`);
    }
}
