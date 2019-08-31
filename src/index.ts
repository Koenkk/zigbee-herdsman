import {Controller} from "./controller";
import {Events} from "./controller/events";
export {Controller, Events};

import {
    MessagePayload,
    DeviceAnnouncePayload,
    DeviceJoinedPayload,
    DeviceInterviewPayload,
    DeviceLeavePayload
} from "./controller/events";

export type MessageEvent = MessagePayload;
export type AnnounceEvent = DeviceAnnouncePayload;
export type JoinedEvent = DeviceJoinedPayload;
export type InterviewEvent = DeviceInterviewPayload;
export type LeaveEvent = DeviceLeavePayload;

