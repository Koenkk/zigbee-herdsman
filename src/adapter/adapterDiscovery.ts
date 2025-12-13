import assert from "node:assert";
import {platform} from "node:os";
import type {PortInfo} from "@serialport/bindings-cpp";
import {Bonjour, type Service} from "bonjour-service";
import {wait} from "../utils";
import {logger} from "../utils/logger";
import type {TsType} from ".";
import {SerialPort} from "./serialPort";
import type {Adapter, DiscoverableUsbAdapter, UsbAdapterFingerprint} from "./tstype";

const NS = "zh:adapter:discovery";

const enum UsbFingerprintMatchScore {
    None = 0,
    VidPid = 1,
    VidPidManuf = 2,
    VidPidPath = 3,
    VidPidManufPath = 4,
}

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
const USB_FINGERPRINTS: Record<DiscoverableUsbAdapter, UsbAdapterFingerprint[]> = {
    deconz: [
        {
            // Conbee II
            vendorId: "1cf1",
            productId: "0030",
            manufacturer: "dresden elektronik ingenieurtechnik GmbH",
            // /dev/serial/by-id/usb-dresden_elektronik_ingenieurtechnik_GmbH_ConBee_II_DE2132111-if00
            pathRegex: ".*conbee.*",
        },
        {
            // Conbee III
            vendorId: "0403",
            productId: "6015",
            manufacturer: "dresden elektronik ingenieurtechnik GmbH",
            // /dev/serial/by-id/usb-dresden_elektronik_ConBee_III_DE03188111-if00-port0
            pathRegex: ".*conbee.*",
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
            // Home Assistant Connect ZBT-1
            vendorId: "10c4",
            productId: "ea60",
            manufacturer: "Nabu Casa",
            // /dev/serial/by-id/usb-Nabu_Casa_SkyConnect_v1.0_3abe54797c91ed118fc3cad13b20a111-if00-port0
            pathRegex: ".*Nabu_Casa_SkyConnect.*",
            options: {rtscts: true},
        },
        {
            // Home Assistant Connect ZBT-2
            vendorId: "303a",
            productId: "4001",
            manufacturer: "Nabu Casa",
            // /dev/serial/by-id/usb-Nabu_Casa_ZBT-2_10B41DE58D6C-if00
            pathRegex: ".*Nabu_Casa_ZBT-2.*",
            options: {baudRate: 460800, rtscts: true},
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
            // SMLight slzb-06m* (all variants) USB-mode
            vendorId: "10c4",
            productId: "ea60",
            manufacturer: "SMLIGHT",
            pathRegex: ".*slzb-06m.*",
            options: {rtscts: false},
        },
        {
            // SMLight slzb-07
            vendorId: "10c4",
            productId: "ea60",
            manufacturer: "SMLIGHT",
            // /dev/serial/by-id/usb-SMLIGHT_SMLIGHT_SLZB-07_be9faa0786e1ea11bd68dc2d9a583111-if00-port0
            // /dev/serial/by-id/usb-Silicon_Labs_CP2102N_USB_to_UART_Bridge_Controller_a215650c853bec119a079e957a0af111-if00-port0
            pathRegex: ".*slzb-07_.*", // `_` to not match 07p7
            options: {rtscts: true},
        },
        {
            // SMLight slzb-07mg24
            vendorId: "10c4",
            productId: "ea60",
            manufacturer: "SMLIGHT",
            pathRegex: ".*slzb-07mg24.*",
            options: {rtscts: true},
        },
        {
            // Sonoff ZBDongle-E V2 (CH variant)
            vendorId: "1a86",
            productId: "55d4",
            manufacturer: "ITEAD",
            // /dev/serial/by-id/usb-ITEAD_SONOFF_Zigbee_3.0_USB_Dongle_Plus_V2_20240122184111-if00
            // /dev/serial/by-id/usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_186ff44314e2ed11b891eb5162c61111-if00-port0
            pathRegex: ".*sonoff.*plus.*",
            options: {rtscts: false},
        },
        {
            // Sonoff ZBDongle-E V2 (CP variant)
            vendorId: "10c4",
            productId: "ea60",
            manufacturer: "ITEAD",
            // /dev/serial/by-id/usb-Itead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_V2_a6ee897e4d1fef11aa004ad0639e525b-if00-port0
            pathRegex: ".*sonoff.*plus_v2_.*",
            options: {rtscts: false},
        },
        {
            // Sonoff ZBDongle-M
            vendorId: "10c4",
            productId: "ea60",
            manufacturer: "SONOFF",
            // /dev/serial/by-id/usb-SONOFF_SONOFF_Dongle_Max_MG24_08965d6b0674ef11b2f4e61e313510fd-if00-port0
            pathRegex: ".*sonoff.*max.*",
            options: {rtscts: false},
        },
        {
            // SONOFF Dongle Plus MG24
            vendorId: "10c4",
            productId: "ea60",
            manufacturer: "SONOFF",
            // /dev/serial/by-id/usb-SONOFF_SONOFF_Dongle_Plus_MG24_b023a583a66bef118e30a3adc169b110-if00-port0
            pathRegex: ".*sonoff.*plus.*mg24.*",
            options: {rtscts: false},
        },
        {
            // SONOFF Dongle Lite MG21
            vendorId: "10c4",
            productId: "ea60",
            manufacturer: "SONOFF",
            // /dev/serial/by-id/usb-SONOFF_SONOFF_Dongle_Lite_MG21_c82fc0a1a36bef11a026a1adc169b110-if00-port0
            pathRegex: ".*sonoff.*lite.*mg21.*",
            options: {rtscts: false},
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
            vendorId: "0403",
            productId: "6015",
            manufacturer: "Electrolama",
            pathRegex: ".*electrolama.*",
        },
        {
            // slae.sh cc2652rb
            vendorId: "10c4",
            productId: "ea60",
            manufacturer: "Silicon Labs",
            // /dev/serial/by-id/usb-Silicon_Labs_slae.sh_cc2652rb_stick_-_slaesh_s_iot_stuff_00_12_4B_00_21_A8_EC_79-if00-port0
            pathRegex: ".*slae\\.sh_cc2652rb.*",
        },
        {
            // Sonoff ZBDongle-P (CC2652P)
            vendorId: "10c4",
            productId: "ea60",
            manufacturer: "ITEAD",
            // /dev/serial/by-id/usb-Silicon_Labs_Sonoff_Zigbee_3.0_USB_Dongle_Plus_0111-if00-port0
            // /dev/serial/by-id/usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_b8b49abd27a6ed11a280eba32981d111-if00-port0
            pathRegex: ".*sonoff.*plus(?!_v2_).*",
        },
        {
            // CC2538
            vendorId: "0451",
            productId: "16c8",
            manufacturer: "Texas Instruments",
            // zStack30x: /dev/serial/by-id/usb-Texas_Instruments_CC2538_USB_CDC-if00
            pathRegex: ".*CC2538.*",
        },
        {
            // CC2531
            vendorId: "0451",
            productId: "16a8",
            manufacturer: "Texas Instruments",
            // /dev/serial/by-id/usb-Texas_Instruments_TI_CC2531_USB_CDC___0X00124B0018ED1111-if00
            pathRegex: ".*CC2531.*",
        },
        {
            // Texas instruments launchpads
            vendorId: "0451",
            productId: "bef3",
            manufacturer: "Texas Instruments",
            pathRegex: ".*Texas_Instruments.*",
        },
        {
            // SMLight slzb-07p7
            vendorId: "10c4",
            productId: "ea60",
            manufacturer: "SMLIGHT",
            // /dev/serial/by-id/usb-SMLIGHT_SMLIGHT_SLZB-07p7_be9faa0786e1ea11bd68dc2d9a583111-if00-port0
            pathRegex: ".*SLZB-07p7.*",
        },
        {
            // SMLight slzb-06p7
            vendorId: "10c4",
            productId: "ea60",
            manufacturer: "SMLIGHT",
            // /dev/serial/by-id/usb-SMLIGHT_SMLIGHT_SLZB-06p7_82e43faf9872ed118bb924f3fdf7b791-if00-port0
            pathRegex: ".*SMLIGHT_SLZB-06p7_.*",
        },
        {
            // SMLight slzb-06p10
            vendorId: "10c4",
            productId: "ea60",
            manufacturer: "SMLIGHT",
            // /dev/serial/by-id/usb-SMLIGHT_SMLIGHT_SLZB-06p10_40df2f3e3977ed11b142f6fafdf7b791-if00-port0
            pathRegex: ".*SMLIGHT_SLZB-06p10_.*",
        },
        {
            // TubesZB ?
            vendorId: "10c4",
            productId: "ea60",
            // manufacturer: '',
            pathRegex: ".*tubeszb.*",
        },
        {
            // TubesZB ?
            vendorId: "1a86",
            productId: "7523",
            // manufacturer: '',
            pathRegex: ".*tubeszb.*",
        },
        {
            // ZigStar
            vendorId: "1a86",
            productId: "7523",
            // manufacturer: '',
            pathRegex: ".*zigstar.*",
        },
    ],
    zboss: [
        {
            // Nordic Zigbee NCP
            vendorId: "2fe3",
            productId: "0100",
            manufacturer: "ZEPHYR",
            // /dev/serial/by-id/usb-ZEPHYR_Zigbee_NCP_54ACCFAFA6DAD111-if00
            pathRegex: ".*ZEPHYR.*",
        },
    ],
    zigate: [
        {
            // ZiGate PL2303HX (blue)
            vendorId: "067b",
            productId: "2303",
            manufacturer: "zigate_PL2303",
            pathRegex: ".*zigate.*",
        },
        {
            // ZiGate CP2102 (red)
            vendorId: "10c4",
            productId: "ea60",
            manufacturer: "zigate_cp2102",
            pathRegex: ".*zigate.*",
        },
        {
            // ZiGate+ V2 CDM_21228
            vendorId: "0403",
            productId: "6015",
            // manufacturer: '',
            // /dev/serial/by-id/usb-FTDI_ZiGate_ZIGATE+-if00-port0
            pathRegex: ".*zigate.*",
        },
    ],
};

/**
 * Vendor and Product IDs that are prone to conflict if only matching on vendorId+productId.
 */
const USB_FINGERPRINTS_CONFLICT_IDS: ReadonlyArray<string /* vendorId:productId */> = ["10c4:ea60"];

/** Time allotted for mDNS scanning */
const MDNS_SCAN_TIME = 2000;

async function getSerialPortList(): Promise<PortInfo[]> {
    const portInfos = await SerialPort.list();

    // TODO: can sorting be removed in favor of `path` regex matching?

    // CC1352P_2 and CC26X2R1 lists as 2 USB devices with same manufacturer, productId and vendorId
    // one is the actual chip interface, other is the XDS110.
    // The chip is always exposed on the first one after alphabetical sorting.
    /* v8 ignore next */
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
    return str1.localeCompare(str2, undefined, {sensitivity: "base"}) === 0;
}

/**
 * Case insensitive regex matching.
 * @param regexStr Passed to RegExp constructor.
 * @param str Always returns false if undefined.
 * @returns
 */
function matchRegex(regexStr: string, str?: string): boolean {
    return str !== undefined && new RegExp(regexStr, "i").test(str);
}

function matchUsbFingerprint(
    portInfo: PortInfo,
    entries: UsbAdapterFingerprint[],
    isWindows: boolean,
    conflictProne: boolean,
): [path: PortInfo["path"], score: number, fingerprint: UsbAdapterFingerprint] | undefined {
    if (!portInfo.vendorId || !portInfo.productId) {
        // port info is missing essential information for proper matching, ignore it
        return undefined;
    }

    let match: UsbAdapterFingerprint | undefined;
    let score: number = UsbFingerprintMatchScore.None;

    for (const entry of entries) {
        if (!matchString(portInfo.vendorId, entry.vendorId) || !matchString(portInfo.productId, entry.productId)) {
            continue;
        }

        // allow matching on vendorId+productId only on Windows
        if (score < UsbFingerprintMatchScore.VidPid && isWindows) {
            match = entry;
            score = UsbFingerprintMatchScore.VidPid;
        }

        if (
            score < UsbFingerprintMatchScore.VidPidManuf &&
            entry.manufacturer &&
            portInfo.manufacturer &&
            matchString(portInfo.manufacturer, entry.manufacturer)
        ) {
            match = entry;
            score = UsbFingerprintMatchScore.VidPidManuf;

            if (isWindows && !conflictProne) {
                // path will never match on Windows (COMx), assume vendor+product+manufacturer is "exact match"
                // except for conflict-prone, since it could easily return a mismatch (better to return no match and force manual config)
                return [portInfo.path, score, match];
            }
        }

        if (
            score < UsbFingerprintMatchScore.VidPidPath &&
            entry.pathRegex &&
            (matchRegex(entry.pathRegex, portInfo.path) || matchRegex(entry.pathRegex, portInfo.pnpId))
        ) {
            if (score === UsbFingerprintMatchScore.VidPidManuf) {
                // best possible match, return early
                return [portInfo.path, UsbFingerprintMatchScore.VidPidManufPath, entry];
            }

            match = entry;
            score = UsbFingerprintMatchScore.VidPidPath;
        }
    }

    // poor match only returned if port info not conflict-prone
    if (match) {
        if (score > UsbFingerprintMatchScore.VidPid) {
            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            if (conflictProne && score < UsbFingerprintMatchScore.VidPidPath && matchString(match.manufacturer!, "itead")) {
                // can't trust metadata "only" on sonoff dongles with conflicts
                return undefined;
            }

            return [portInfo.path, score, match];
        }

        if (!conflictProne) {
            return [portInfo.path, score, match];
        }
    }

    return undefined;
}

export async function matchUsbAdapter(adapter: Adapter, path: string): Promise<UsbAdapterFingerprint | false> {
    // no point in matching this
    if (adapter === "zoh") {
        return false;
    }

    const isWindows = platform() === "win32";
    const portList = await getSerialPortList();

    logger.debug(() => `Connected devices: ${JSON.stringify(portList)}`, NS);

    for (const portInfo of portList) {
        if (portInfo.path !== path) {
            continue;
        }

        const conflictProne = USB_FINGERPRINTS_CONFLICT_IDS.includes(`${portInfo.vendorId}:${portInfo.productId}`);
        const match = matchUsbFingerprint(portInfo, USB_FINGERPRINTS[adapter === "ezsp" ? "ember" : adapter], isWindows, conflictProne);

        if (match) {
            logger.info(() => `Matched adapter: ${JSON.stringify(portInfo)} => ${adapter}: ${JSON.stringify(match[1])}`, NS);
            return match[2];
        }
    }

    return false;
}

export function findUsbAdapterBestMatch(
    adapter: Adapter | undefined,
    portInfo: PortInfo,
    isWindows: boolean,
    conflictProne: boolean,
): [DiscoverableUsbAdapter, NonNullable<ReturnType<typeof matchUsbFingerprint>>] | undefined {
    let bestMatch: [DiscoverableUsbAdapter, NonNullable<ReturnType<typeof matchUsbFingerprint>>] | undefined;

    for (const key in USB_FINGERPRINTS) {
        if (adapter && adapter !== key) {
            continue;
        }

        // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
        const match = matchUsbFingerprint(portInfo, USB_FINGERPRINTS[key as DiscoverableUsbAdapter]!, isWindows, conflictProne);

        // register the match if no previous or better score
        if (match && (!bestMatch || bestMatch[1][1] < match[1])) {
            bestMatch = [key as DiscoverableUsbAdapter, match];

            if (match[1] === UsbFingerprintMatchScore.VidPidManufPath) {
                // got best possible match, exit loop
                break;
            }
        }
    }

    return bestMatch;
}

export async function findUsbAdapter(adapter?: Adapter, path?: string): Promise<TsType.SerialPortOptions | undefined> {
    const isWindows = platform() === "win32";
    // refine to DiscoverableUSBAdapter
    adapter = adapter && adapter === "ezsp" ? "ember" : adapter;
    const portList = await getSerialPortList();

    logger.debug(() => `Connected devices: ${JSON.stringify(portList)}`, NS);

    let bestMatch: ReturnType<typeof findUsbAdapterBestMatch> | undefined;

    for (const portInfo of portList) {
        if (path && portInfo.path !== path) {
            continue;
        }

        const conflictProne = USB_FINGERPRINTS_CONFLICT_IDS.includes(`${portInfo.vendorId}:${portInfo.productId}`);
        const match = findUsbAdapterBestMatch(adapter, portInfo, isWindows, conflictProne);

        if (match && (!bestMatch || bestMatch[1][1] < match[1][1])) {
            bestMatch = match;

            if (match[1][1] === UsbFingerprintMatchScore.VidPidManufPath) {
                // got best possible match, exit loop
                break;
            }
        }
    }

    if (bestMatch) {
        logger.info(() => `Matched adapter=${bestMatch[0]} path=${bestMatch[1][0]}, score=${bestMatch[1][1]}`, NS);
        return {
            adapter: bestMatch[0],
            path: bestMatch[1][0],
            rtscts: bestMatch[1][2].options?.rtscts,
            baudRate: bestMatch[1][2].options?.baudRate,
        };
    }
}

function getMdnsRadioAdapter(radio: string): Adapter {
    switch (radio) {
        case "znp":
            return "zstack";
        case "ezsp":
            return "ember";
        default:
            return radio as Adapter;
    }
}

export async function findMdnsAdapter(path: string): Promise<TsType.SerialPortOptions> {
    const mdnsDevice = path.substring(7);

    if (mdnsDevice.length === 0) {
        throw new Error("No mdns device specified. You must specify the coordinator mdns service type after mdns://, e.g. mdns://my-adapter");
    }

    const bj = new Bonjour();

    logger.info(`Starting mdns discovery for coordinator: ${mdnsDevice}`, NS);

    return await new Promise((resolve, reject) => {
        bj.findOne({type: mdnsDevice}, MDNS_SCAN_TIME, (service: Service) => {
            if (service) {
                if (service.txt?.radio_type && service.port) {
                    const mdnsAddress = service.addresses?.[0] ?? service.host;
                    const mdnsPort = service.port;
                    const mdnsAdapter = getMdnsRadioAdapter(service.txt.radio_type);

                    logger.info(`Coordinator Address: ${mdnsAddress}`, NS);
                    logger.info(`Coordinator Port: ${mdnsPort}`, NS);
                    logger.info(`Coordinator Radio: ${mdnsAdapter}`, NS);
                    bj.destroy();

                    resolve({adapter: mdnsAdapter, path: `tcp://${mdnsAddress}:${mdnsPort}`});
                } else {
                    bj.destroy();
                    reject(
                        new Error(
                            `Coordinator returned wrong Zeroconf format! The following values are expected:\ntxt.radio_type, got: ${service.txt?.radio_type}\nport, got: ${service.port}`,
                        ),
                    );
                }
            } else {
                bj.destroy();
                reject(new Error(`Coordinator [${mdnsDevice}] not found after timeout of ${MDNS_SCAN_TIME}ms!`));
            }
        });
    });
}

export function findTcpAdapter(path: string, adapter?: Adapter): TsType.SerialPortOptions {
    try {
        const url = new URL(path);
        assert(url.port !== "");
    } catch {
        throw new Error("Invalid TCP path, expected format: tcp://<host>:<port>");
    }

    if (!adapter) {
        throw new Error(`Cannot discover TCP adapters at this time. Specify valid 'adapter' and 'port' in your configuration.`);
    }

    // always use `tcp://` format
    return {adapter, path: path.replace(/^socket/, "tcp")};
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
 */
export async function discoverAdapter(adapter?: Adapter, path?: string): Promise<TsType.SerialPortOptions> {
    if (path) {
        if (path.startsWith("mdns://")) {
            return await findMdnsAdapter(path);
        }

        if (path.startsWith("tcp://") || path.startsWith("socket://")) {
            return findTcpAdapter(path, adapter);
        }

        if (adapter) {
            const result: TsType.SerialPortOptions = {adapter, path};
            try {
                const matched = await matchUsbAdapter(adapter, path);

                if (!matched) {
                    logger.debug(`Unable to match USB adapter: ${adapter} | ${path}`, NS);
                } else {
                    result.rtscts = matched.options?.rtscts;
                    result.baudRate = matched.options?.baudRate;
                }
            } catch (error) {
                logger.debug(`Error while trying to match USB adapter (${(error as Error).message}).`, NS);
            }

            return result;
        }
    }

    try {
        // default to matching USB
        const match = await findUsbAdapter(adapter, path);

        if (!match) {
            throw new Error("No valid USB adapter found");
        }

        // keep adapter if `ezsp` since findUSBAdapter returns DiscoverableUSBAdapter
        return adapter && adapter === "ezsp" ? {adapter, path: match.path, baudRate: match.baudRate, rtscts: match.rtscts} : match;
    } catch (error) {
        throw new Error(`USB adapter discovery error (${(error as Error).message}). Specify valid 'adapter' and 'port' in your configuration.`);
    }
}

/**
 * @returns List of all serial and mDNS devices found, with matching `adapter` if available
 */
export async function findAllDevices(): Promise<{name: string; path: string; adapter?: Adapter}[]> {
    const devices: {name: string; path: string; adapter?: Adapter}[] = [];
    const isWindows = platform() === "win32";

    try {
        const portList = await getSerialPortList();

        for (const portInfo of portList) {
            // override matching on Windows, too many chances of mismatch due to lacking data
            const bestMatch = isWindows
                ? undefined
                : findUsbAdapterBestMatch(
                      undefined,
                      portInfo,
                      isWindows,
                      USB_FINGERPRINTS_CONFLICT_IDS.includes(`${portInfo.vendorId}:${portInfo.productId}`),
                  );
            // @ts-expect-error friendlyName Windows only
            const friendlyName = portInfo.friendlyName ?? portInfo.pnpId;

            devices.push({
                name: `${friendlyName} (${portInfo.manufacturer})`,
                path: portInfo.path,
                adapter: bestMatch ? bestMatch[0] : undefined,
            });
        }
        /* v8 ignore start */
    } catch (error) {
        logger.debug(`Failed to retrieve serial list ${(error as Error).message}.`, NS);
    }
    /* v8 ignore stop */

    try {
        const bonjour = new Bonjour();
        const browser = bonjour.find(null, (service) => {
            if (service.txt?.radio_type) {
                const path = `tcp://${service.addresses?.[0] ?? service.host}:${service.port}`;

                devices.push({
                    name: `${service.name ?? service.txt.name ?? "Unknown"} (${path})`,
                    path,
                    adapter: getMdnsRadioAdapter(service.txt.radio_type),
                });
            }
        });

        browser.start();
        await wait(MDNS_SCAN_TIME);
        browser.stop();
        bonjour.destroy();
        /* v8 ignore start */
    } catch (error) {
        logger.debug(`Failed to retrieve mDNS list ${(error as Error).message}.`, NS);
    }
    /* v8 ignore stop */

    return devices;
}
