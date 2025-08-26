import {bench, describe} from "vitest";
import Adapter from "../src/adapter/adapter";
import {FIXED_ENDPOINTS} from "../src/adapter/ember/adapter/endpoints";
import type {ZclPayload} from "../src/adapter/events";
import {Controller} from "../src/controller";
import Database from "../src/controller/database";
import {setLogger} from "../src/utils/logger";
import * as Zcl from "../src/zspec/zcl";
import * as Zdo from "../src/zspec/zdo";
import {BENCH_OPTIONS} from "./benchOptions";

// mock necessary functions to avoid system calls / adapter interactions

// no-op, makes up for too much of the perf loss (with console logging by default)
setLogger({
    debug: () => {},
    info: () => {},
    warning: () => {},
    error: () => {},
});

const NETWORK_OPTIONS = {
    panID: 0x1a62,
    extendedPanID: [0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd],
    channelList: [11],
    networkKey: [1, 3, 5, 7, 9, 11, 13, 15, 0, 2, 4, 6, 8, 10, 12, 13],
    // networkKeyDistribute?: boolean;
};
const COORD_IEEE = "0x1234567812345678";

let controller: Controller;
let adapter: Adapter;

const makeController = () => {
    controller = new Controller({
        network: NETWORK_OPTIONS,
        serialPort: {
            baudRate: 115200,
            rtscts: false,
            path: "/dev/ttyDummy0",
            adapter: "ember",
        },
        databasePath: "database.db",
        databaseBackupPath: "database.db.backup",
        backupPath: "coordinator_backup.json",
        adapter: {
            // concurrent?: number;
            // delay?: number;
            disableLED: false,
            // transmitPower?: number;
            // forceStartWithInconsistentAdapterConfiguration?: boolean;
        },
        acceptJoiningDeviceHandler: async () => true,
    });
    controller.backup = async () => {};

    const dbOpen = Database.open;
    Database.open = (path) => {
        const db = dbOpen(path);
        // no-op
        db.write = () => {};

        return db;
    };
    const adapterCreate = Adapter.create;
    Adapter.create = async (networkOptions, serialPortOptions, backupPath, adapterOptions) => {
        adapter = await adapterCreate(networkOptions, serialPortOptions, backupPath, adapterOptions);
        adapter.start = async () => await Promise.resolve("resumed");
        adapter.getCoordinatorIEEE = async () => await Promise.resolve(COORD_IEEE);
        adapter.getNetworkParameters = async () =>
            await Promise.resolve({
                panID: NETWORK_OPTIONS.panID,
                extendedPanID: `${Buffer.from(NETWORK_OPTIONS.extendedPanID!).toString("hex")}`,
                channel: NETWORK_OPTIONS.channelList[0],
                nwkUpdateID: 1,
            });
        // @ts-expect-error ignore overrides typing
        adapter.sendZdo = async (
            _ieeeAddress: string,
            networkAddress: number,
            clusterId: Zdo.ClusterId,
            payload: Buffer,
            _disableResponse: boolean,
        ) => {
            if (networkAddress === 0x0000) {
                switch (clusterId) {
                    case Zdo.ClusterId.ACTIVE_ENDPOINTS_REQUEST: {
                        return await Promise.resolve([
                            Zdo.Status.SUCCESS,
                            {
                                nwkAddress: 0x0000,
                                endpointList: [FIXED_ENDPOINTS[0].endpoint, FIXED_ENDPOINTS[1].endpoint],
                            },
                        ]);
                    }
                    case Zdo.ClusterId.SIMPLE_DESCRIPTOR_REQUEST: {
                        if (payload.readUInt8(3) === FIXED_ENDPOINTS[0].endpoint) {
                            return await Promise.resolve([
                                Zdo.Status.SUCCESS,
                                {
                                    nwkAddress: 0x0000,
                                    length: 1, // unused
                                    ...FIXED_ENDPOINTS[0],
                                },
                            ]);
                        }

                        if (payload.readUInt8(3) === FIXED_ENDPOINTS[1].endpoint) {
                            return await Promise.resolve([
                                Zdo.Status.SUCCESS,
                                {
                                    nwkAddress: 0x0000,
                                    length: 1, // unused
                                    ...FIXED_ENDPOINTS[1],
                                },
                            ]);
                        }
                    }
                }
            }

            return await Promise.resolve([Zdo.Status.NOT_SUPPORTED]);
        };

        return adapter;
    };

    return controller;
};

const BASIC_RESP = Zcl.Frame.create(
    0,
    1,
    true,
    undefined,
    10,
    "readRsp",
    0,
    [
        {
            attrId: 5,
            dataType: Zcl.DataType.CHAR_STR,
            attrData: "Herd-01",
            status: 0,
        },
        {
            attrId: 4,
            dataType: Zcl.DataType.CHAR_STR,
            attrData: "Herdsman",
            status: 0,
        },
    ],
    {},
).toBuffer();

describe("Controller", () => {
    bench(
        "Startup with dummy adapter",
        async () => {
            makeController(); // always use brand new Controller for this bench

            await controller.start();
        },
        BENCH_OPTIONS,
    );

    bench(
        "Receive ZCL message",
        () => {
            adapter.emit("zclPayload", {
                clusterID: Zcl.Clusters.genBasic.ID,
                header: Zcl.Header.fromBuffer(BASIC_RESP),
                address: 0x0000,
                data: BASIC_RESP,
                endpoint: 1,
                linkquality: 200,
                groupID: 0,
                wasBroadcast: false,
                destinationEndpoint: 1,
            } satisfies ZclPayload);
        },
        {
            ...BENCH_OPTIONS,
            setup: async (task, mode) => {
                await BENCH_OPTIONS.setup!(task, mode);
                makeController();
                await controller.start();
            },
        },
    );

    bench(
        "Receive ZDO message",
        () => {
            adapter.emit("zdoResponse", Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE, [
                Zdo.Status.SUCCESS,
                {
                    eui64: COORD_IEEE,
                    nwkAddress: 0x0000,
                    startIndex: 1,
                    assocDevList: [],
                },
            ]);
        },
        {
            ...BENCH_OPTIONS,
            setup: async (task, mode) => {
                await BENCH_OPTIONS.setup!(task, mode);
                makeController();
                await controller.start();
            },
        },
    );
});
