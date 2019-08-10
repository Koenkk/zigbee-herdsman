enum Events {
    message = "message",
}

interface MessagePayload {
    data: any;
}

export {
    Events, MessagePayload,
}