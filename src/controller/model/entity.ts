import events from "node:events";

import type {Adapter} from "../../adapter";
import {instrumentSend, metrics} from "../../utils/metrics.js";
import type Database from "../database";

// biome-ignore lint/suspicious/noExplicitAny: API
type EventMap<T> = Record<keyof T, any[]> | DefaultEventMap;
type DefaultEventMap = [never];

export abstract class Entity<T extends EventMap<T> = DefaultEventMap> extends events.EventEmitter<T> {
    protected static database: Database;
    protected static adapter: Adapter;

    public static injectDatabase(database: Database): void {
        Entity.database = database;
    }

    public static injectAdapter(adapter: Adapter): void {
        // Instrument the adapter's send methods for metrics. This is the single real chokepoint:
        // every outbound path (model `Entity.adapter.send*` calls and the controller's own
        // `this.adapter.send*` calls, which share this same instance) is measured here.
        // Guarded with `typeof ... === "function"` since some tests inject partial adapter stubs;
        // a real adapter from `Adapter.create` always provides all four methods.
        if (typeof adapter.sendZclFrameToEndpoint === "function") {
            const sendZclFrameToEndpoint = adapter.sendZclFrameToEndpoint.bind(adapter);
            adapter.sendZclFrameToEndpoint = (ieeeAddr, ...rest) =>
                instrumentSend(
                    () => sendZclFrameToEndpoint(ieeeAddr, ...rest),
                    (status, durationSeconds) => metrics.emit("adapterSendZclUnicast", {ieeeAddr, status, durationSeconds}),
                );
        }

        if (typeof adapter.sendZdo === "function") {
            const sendZdo = adapter.sendZdo.bind(adapter);
            // biome-ignore lint/suspicious/noExplicitAny: `sendZdo` is overloaded; a single wrapper can't satisfy the overload set, so cast back to its type.
            adapter.sendZdo = ((ieeeAddr: string, networkAddress: number, clusterId: number, ...rest: any[]) =>
                instrumentSend(
                    // biome-ignore lint/suspicious/noExplicitAny: forwarding overloaded args through the wrapper.
                    () => (sendZdo as (...args: any[]) => Promise<any>)(ieeeAddr, networkAddress, clusterId, ...rest),
                    (status, durationSeconds) => metrics.emit("adapterSendZdo", {ieeeAddr, clusterId, status, durationSeconds}),
                )) as typeof adapter.sendZdo;
        }

        if (typeof adapter.sendZclFrameToGroup === "function") {
            const sendZclFrameToGroup = adapter.sendZclFrameToGroup.bind(adapter);
            adapter.sendZclFrameToGroup = (groupId, ...rest) =>
                instrumentSend(
                    () => sendZclFrameToGroup(groupId, ...rest),
                    (status, durationSeconds) => metrics.emit("adapterSendZclGroup", {groupId, status, durationSeconds}),
                );
        }

        if (typeof adapter.sendZclFrameToAll === "function") {
            const sendZclFrameToAll = adapter.sendZclFrameToAll.bind(adapter);
            adapter.sendZclFrameToAll = (...rest) =>
                instrumentSend(
                    () => sendZclFrameToAll(...rest),
                    (status, durationSeconds) => metrics.emit("adapterSendZclBroadcast", {status, durationSeconds}),
                );
        }

        Entity.adapter = adapter;
    }
}

export default Entity;
