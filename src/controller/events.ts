import { Device, Endpoint } from "./model";
import { KeyValue } from "./tstype";

enum Events {
    message = "message",
}

type MessagePayloadType = 'deviceJoined' | 'attributeReport' | 'readResponse';

interface MessagePayload {
    type: MessagePayloadType;
    device: Device;
    endpoint?: Endpoint;
    linkQuality?: number;
    // eslint-disable-next-line
    data?: KeyValue;
}

export {
    Events, MessagePayload, MessagePayloadType,
}