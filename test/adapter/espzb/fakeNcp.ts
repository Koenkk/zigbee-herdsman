import type {EspZbAdapter} from "../../../src/adapter/espzb/adapter/espzbAdapter";
import {CommandId, EspZbStatus, FrameType, NetworkState} from "../../../src/adapter/espzb/consts";
import {type EspZbFrame, encodeFrame, FrameDecoder} from "../../../src/adapter/espzb/frame";

export interface ApsRequestRecord {
    sn: number;
    dstMode: number;
    dst: number;
    dstEndpoint: number;
    srcEndpoint: number;
    profileId: number;
    clusterId: number;
    txOptions: number;
    asdu: Buffer;
}

export const COORD_IEEE_LE = Buffer.from("7cdfa1fffe5a31c0", "hex").reverse();

/**
 * Minimal scripted espzb NCP for unit tests: speaks the real frame format through the driver's I/O hooks and keeps
 * just enough network state for the adapter's startup / backup paths.
 */
export class FakeNcp {
    state: NetworkState = NetworkState.NOT_STARTED;
    factoryNew = true;
    role = 0;
    panId = 0xffff;
    extPanId = Buffer.alloc(8);
    channel = 0;
    primaryMask = 0;
    key = Buffer.alloc(16);
    ieee = Buffer.from(COORD_IEEE_LE);
    updateId = 0;
    frameCounter = 100;
    keySeq = 0;
    txPower = 10;
    extMajor = 1;
    capabilities = 0x1df;
    /** network parameters used when the stack "resumes" a stored network at NETWORK_START */
    stored?: {panId: number; extPanId: Buffer; channel: number; key: Buffer};

    readonly requests: EspZbFrame[] = [];
    readonly aps: ApsRequestRecord[] = [];
    /** override the response status for a command id (once) */
    readonly statusOverride = new Map<number, EspZbStatus>();
    /** drop the next N responses (host must retransmit) */
    dropResponses = 0;
    /** called after an APS request is accepted; default: success confirm */
    onAps: (req: ApsRequestRecord) => void = (req) => this.confirm(req.sn, 0);
    installCodes: Buffer[] = [];
    /** do not send NETWORK_STACK_STATUS_HANDLER notifications (host must poll) */
    silentState = false;
    /** formation outcome */
    formResult: "ok" | "fail" | "wrongChannel" = "ok";
    /** persistent status for APS_DATA_REQUEST (undefined = accept) */
    apsStatus?: EspZbStatus;
    /** send EXT_GET_INFO without the trailing strings */
    infoTruncated = false;
    /** NETWORK_START: state notifications overtake the response (fast stack start) */
    fastStart = false;

    #adapter?: EspZbAdapter;
    #ntfSn = 0;
    readonly #decoder = new FrameDecoder(
        (f) => this.#onFrame(f),
        () => {},
    );

    attach(adapter: EspZbAdapter): void {
        this.#adapter = adapter;
        adapter.driver.writer = (data: Buffer): void => this.#decoder.push(data);
    }

    send(type: number, id: number, sn: number, payload: Buffer): void {
        const wire = encodeFrame({version: 0, type: type as 0 | 1 | 2, id, sn, payload});
        queueMicrotask(() => this.#adapter?.driver.receive(wire));
    }

    notify(id: number, payload: Buffer, sn?: number): void {
        const frameSn = sn ?? this.#ntfSn;
        if (sn === undefined) this.#ntfSn = (this.#ntfSn + 1) % 255;
        this.send(FrameType.NOTIFY, id, frameSn, payload);
    }

    setState(state: NetworkState, bdbStatus = 0): void {
        this.state = state;
        if (this.silentState) return;
        this.notify(CommandId.NETWORK_STACK_STATUS_HANDLER, Buffer.from([state, bdbStatus]));
    }

    confirm(sn: number, status: number): void {
        const p = Buffer.alloc(21);
        p[0] = 0x04;
        p[1] = 2;
        p[16] = status;
        this.notify(CommandId.APS_DATA_CONFIRM, p, sn);
    }

    indication(opts: {
        src: number;
        srcEp: number;
        dstEp: number;
        profile: number;
        cluster: number;
        asdu: Buffer;
        dstMode?: number;
        dst?: number;
    }): void {
        const p = Buffer.alloc(36 + opts.asdu.length);
        p[0] = 0x05;
        p[1] = opts.dstMode ?? 2;
        p.writeUInt16LE(opts.dst ?? 0, 2);
        p[10] = opts.dstEp;
        p[11] = 2;
        p.writeUInt16LE(opts.src, 12);
        p[20] = opts.srcEp;
        p.writeUInt16LE(opts.profile, 21);
        p.writeUInt16LE(opts.cluster, 23);
        p[27] = 180;
        p.writeInt8(-50, 28);
        p.writeUInt32LE(opts.asdu.length, 32);
        opts.asdu.copy(p, 36);
        this.notify(CommandId.APS_DATA_INDICATION, p);
    }

    appSignal(signal: number, params: Buffer): void {
        const p = Buffer.alloc(3);
        p.writeUInt16LE(signal, 0);
        p[2] = params.length;
        this.notify(CommandId.EXT_APP_SIGNAL, Buffer.concat([p, params]));
    }

    ids(): number[] {
        return this.requests.map((r) => r.id);
    }

    #respond(req: EspZbFrame, status: EspZbStatus, payload: Buffer = Buffer.alloc(0)): boolean {
        if (this.dropResponses > 0) {
            this.dropResponses--;
            return true;
        }
        this.send(
            FrameType.RESPONSE,
            req.id,
            req.sn,
            Buffer.concat([Buffer.from([status]), status === EspZbStatus.SUCCESS ? payload : Buffer.alloc(0)]),
        );

        return true;
    }

    #onFrame(req: EspZbFrame): boolean {
        this.requests.push(req);
        const override = this.statusOverride.get(req.id);
        if (override !== undefined) {
            this.statusOverride.delete(req.id);
            return this.#respond(req, override);
        }
        const p = req.payload;
        const u16 = (v: number): Buffer => Buffer.from([v & 0xff, v >> 8]);
        const u32 = (v: number): Buffer => {
            const b = Buffer.alloc(4);
            b.writeUInt32LE(v >>> 0);
            return b;
        };
        const ok = (payload?: Buffer): boolean => this.#respond(req, EspZbStatus.SUCCESS, payload);

        switch (req.id) {
            case CommandId.EXT_GET_INFO: {
                const str8 = (s: string): Buffer => Buffer.concat([Buffer.from([s.length]), Buffer.from(s)]);
                return ok(
                    Buffer.concat([
                        Buffer.from([this.extMajor, 0]),
                        u32(this.capabilities),
                        u16(1024),
                        Buffer.from([16, 0, 1, 0, 2, 0, 4]),
                        u16(0),
                        Buffer.from([0]),
                        this.infoTruncated ? Buffer.alloc(0) : Buffer.concat([str8("esp32s31"), str8("espzb-ncp"), str8("v6.1")]),
                    ]),
                );
            }
            case CommandId.NETWORK_STATE:
                return ok(Buffer.from([this.state, this.factoryNew ? 1 : 0]));
            case CommandId.ZCL_ENDPOINT_ADD:
                return ok();
            case CommandId.NETWORK_START: {
                if (this.fastStart) {
                    this.setState(NetworkState.JOINING);
                    this.setState(NetworkState.OFFLINE);
                    return ok();
                }
                ok();
                this.setState(NetworkState.JOINING);
                setTimeout(() => {
                    if (this.stored) {
                        Object.assign(this, this.stored);
                        this.factoryNew = false;
                        this.setState(NetworkState.CONNECTED);
                    } else {
                        this.setState(NetworkState.OFFLINE);
                    }
                }, 5);
                return true;
            }
            case CommandId.NETWORK_FORM: {
                this.setState(NetworkState.JOINING);
                ok();
                setTimeout(() => {
                    if (this.formResult === "fail") {
                        this.setState(NetworkState.OFFLINE, 5);
                        return;
                    }
                    this.channel = [...Array(16).keys()].map((i) => i + 11).find((c) => this.primaryMask & (1 << c)) ?? 11;
                    if (this.formResult === "wrongChannel") this.channel = 25;
                    this.factoryNew = false;
                    const n = Buffer.concat([this.extPanId, u16(this.panId), Buffer.from([this.channel])]);
                    this.notify(CommandId.NETWORK_FORM, n);
                    this.setState(NetworkState.CONNECTED);
                }, 5);
                return true;
            }
            case CommandId.NETWORK_LEAVE: {
                this.setState(NetworkState.LEAVING);
                ok();
                setTimeout(() => {
                    this.factoryNew = true;
                    this.setState(NetworkState.OFFLINE);
                }, 5);
                return true;
            }
            case CommandId.NETWORK_ROLE_GET:
                return ok(Buffer.from([this.role]));
            case CommandId.NETWORK_PAN_ID_GET:
                return ok(u16(this.panId));
            case CommandId.NETWORK_PAN_ID_SET:
                this.panId = p.readUInt16LE(0);
                return ok();
            case CommandId.NETWORK_EXTENDED_PAN_ID_GET:
                return ok(this.extPanId);
            case CommandId.NETWORK_EXTENDED_PAN_ID_SET:
                this.extPanId = Buffer.from(p.subarray(0, 8));
                return ok();
            case CommandId.NETWORK_PRIMARY_CHANNEL_SET:
                this.primaryMask = p.readUInt32LE(0);
                return ok();
            case CommandId.NETWORK_SECONDARY_CHANNEL_SET:
                return ok();
            case CommandId.NETWORK_CHANNEL_GET:
                return ok(Buffer.from([this.channel]));
            case CommandId.NETWORK_PRIMARY_KEY_GET:
                return ok(this.key);
            case CommandId.NETWORK_PRIMARY_KEY_SET:
                this.key = Buffer.from(p.subarray(0, 16));
                return ok();
            case CommandId.NETWORK_LONG_ADDRESS_GET:
                return ok(this.ieee);
            case CommandId.NETWORK_LONG_ADDRESS_SET:
                this.ieee = Buffer.from(p.subarray(0, 8));
                return ok();
            case CommandId.NETWORK_FRAME_COUNT_SET:
                this.frameCounter = p.readUInt32LE(0);
                return ok();
            case CommandId.NETWORK_UPDATE_ID_GET:
                return ok(Buffer.from([this.updateId]));
            case CommandId.NETWORK_UPDATE_ID_SET:
                this.updateId = p[0];
                return ok();
            case CommandId.EXT_NWK_KEY_SEQ_SET:
                this.keySeq = p[0];
                return ok();
            case CommandId.NETWORK_TXPOWER_SET:
                this.txPower = Math.min(p.readInt8(0), 19);
                return ok(Buffer.from([this.txPower & 0xff]));
            case CommandId.NETWORK_PERMIT_JOINING:
                return ok();
            case CommandId.EXT_NWK_KEY_INFO_GET:
                return ok(Buffer.concat([this.key, Buffer.from([this.keySeq]), u32(this.frameCounter)]));
            case CommandId.NETWORK_IEEE_TO_SHORT:
                return p.readUInt8(0) === 0x01 ? ok(u16(0x1234)) : this.#respond(req, EspZbStatus.NOT_FOUND);
            case CommandId.EXT_IC_ADD:
                this.installCodes.push(Buffer.from(p));
                return ok();
            case CommandId.EXT_CHANNEL_CHANGE:
                this.channel = p[0];
                this.updateId = p[1];
                return ok();
            case CommandId.EXT_PING:
                return ok(p);
            case CommandId.APS_DATA_REQUEST: {
                if (this.apsStatus !== undefined) return this.#respond(req, this.apsStatus);
                const rec: ApsRequestRecord = {
                    sn: req.sn,
                    dst: p.readUInt16LE(0),
                    dstEndpoint: p[8],
                    srcEndpoint: p[9],
                    dstMode: p[10],
                    profileId: p.readUInt16LE(11),
                    clusterId: p.readUInt16LE(13),
                    txOptions: p[15],
                    asdu: Buffer.from(p.subarray(31, 31 + p.readUInt32LE(27))),
                };
                this.aps.push(rec);
                ok();
                queueMicrotask(() => this.onAps(rec));
                return true;
            }
            default:
                return this.#respond(req, EspZbStatus.NOT_SUPPORTED);
        }
    }
}
