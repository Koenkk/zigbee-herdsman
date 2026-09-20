import {Duplex} from "node:stream";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {ZBOSSUart} from "../../../src/adapter/zboss/uart";
import type {ZBOSSWriter} from "../../../src/adapter/zboss/writer";

// A two-sided stream standing in for `net.Socket`: bytes the UART layer sends
// end up in `sent`, bytes "from the radio" are injected with `push()`. A remote
// FIN is `push(null)` (emits `end` on the readable side) followed by `close`,
// exactly like a socket whose peer closed the connection.
class FakeSocket extends Duplex {
    public sent: Buffer[] = [];
    public setNoDelay = vi.fn();
    public setKeepAlive = vi.fn();
    public connect = vi.fn((_port: number, _host: string): void => {
        queueMicrotask(() => {
            this.emit("connect");
            this.emit("ready");
        });
    });

    public override _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        this.sent.push(chunk);
        callback();
    }

    public override _read(): void {}
}

const sockets: FakeSocket[] = [];

vi.mock("node:net", () => ({
    Socket: vi.fn(() => {
        const socket = new FakeSocket();
        sockets.push(socket);
        return socket;
    }),
}));

// A complete, valid frame as captured off the wire: link header + CRC8 + CRC16 +
// an NCP_RESET RESPONSE body (tsn 0xff, category 0, status 0). Injecting it must
// surface a `frame` event.
const BOOT_FRAME = Buffer.from("dead0e0006c05d50d400010200ff0000", "hex");

const flushMicrotasks = async (): Promise<void> => await new Promise((resolve) => setImmediate(resolve));

describe("ZBOSS uart port reopen stream plumbing", () => {
    let uart: ZBOSSUart;
    let frames: unknown[];

    beforeEach(() => {
        sockets.length = 0;
        frames = [];
        vi.useFakeTimers({toFake: ["setTimeout"]});
        uart = new ZBOSSUart({path: "tcp://localhost:6638"});
        uart.on("frame", (frame) => frames.push(frame));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const openPort = async (): Promise<FakeSocket> => {
        const opened = await uart.resetNcp();
        expect(opened).toStrictEqual(true);
        expect(sockets).toHaveLength(1);
        return sockets[0];
    };

    // Remote FIN (peer closed the TCP connection) followed by the in-place
    // reopen that `onPortClose` performs while `inReset` is set.
    const finAndReopen = async (socket: FakeSocket): Promise<FakeSocket> => {
        uart.inReset = true;
        socket.push(null);
        await flushMicrotasks();
        socket.emit("close", false);
        await vi.advanceTimersByTimeAsync(3000);
        await flushMicrotasks();
        expect(sockets).toHaveLength(2);
        expect(uart.inReset).toStrictEqual(false);
        return sockets[1];
    };

    it("keeps receiving after a remote FIN and in-place reopen", async () => {
        const first = await openPort();

        first.push(BOOT_FRAME);
        await flushMicrotasks();
        expect(frames).toHaveLength(1);

        const second = await finAndReopen(first);

        // Without `pipe(reader, {end: false})` the FIN has end()ed the reader
        // and everything the new port delivers is dropped silently.
        second.push(BOOT_FRAME);
        await flushMicrotasks();
        expect(frames).toHaveLength(2);
    });

    it("only feeds the live port after stop() and reopen", async () => {
        const first = await openPort();

        // stop() -> closePort(): destroy() schedules the socket's `close` event
        // for the NEXT tick, but removeAllListeners() runs synchronously right
        // after and strips the pipe machinery's own close-cleanup handler — so
        // Node never auto-unpipes the writer from the destroyed socket. Without
        // the explicit writer.unpipe() the writer is then piped to BOTH the dead
        // and the new port after a reconnect (stop() + resetNcp(), the restore
        // flow), and writes keep being directed at the dead one.
        await uart.stop();
        const reopened = await uart.resetNcp();
        expect(reopened).toStrictEqual(true);
        expect(sockets).toHaveLength(2);
        const second = sockets[1];

        const deadWrite = vi.spyOn(first, "write");
        const writer = (uart as unknown as {writer: ZBOSSWriter}).writer;
        writer.writeByte(0xde);
        writer.writeFlush();
        await flushMicrotasks();

        expect(deadWrite).not.toHaveBeenCalled();
        expect(second.sent.length).toStrictEqual(1);
        expect(second.sent[0]).toStrictEqual(Buffer.from([0xde]));
    });
});
