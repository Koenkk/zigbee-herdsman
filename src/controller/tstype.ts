// eslint-disable-next-line
interface KeyValue {[s: string]: any};

/* Send request policies:
'bulk':             Message must be sent together with other messages in the correct sequence.
                    No immediate delivery required.
'queue':            Request shall be sent 'as-is' as soon as possible.
                    Multiple identical requests shall be delivered multiple times.
                    Not strict ordering required.
'immediate':        Request shall be sent immediately and not be kept for later retries (e.g. response message).
'keep-payload':     Request shall be sent as soon as possible.
                    If immediate delivery fails, the exact same payload is only sent once, even if there were
                    multiple requests.
'keep-command':     Request shall be sent as soon as possible.
                    If immediate delivery fails, only the latest command for each command ID is kept for delivery.
'keep-cmd-undiv':   Request shall be sent as soon as possible.
                    If immediate delivery fails, only the latest undivided set of commands is sent for each unique
                    set of command IDs.
*/
type SendPolicy = 'bulk' | 'queue' | 'immediate' | 'keep-payload' | 'keep-command' | 'keep-cmd-undiv';
type DeviceType = 'Coordinator' | 'Router' | 'EndDevice' | 'Unknown' | 'GreenPower';

type EntityType = DeviceType | 'Group';

interface DatabaseEntry {
    id: number;
    type: EntityType;
    // eslint-disable-next-line
    [s: string]: any;
}

enum GreenPowerEvents {
    deviceJoined = "deviceJoined",
}

interface GreenPowerDeviceJoinedPayload {
    sourceID: number;
    deviceID: number;
    networkAddress: number;
}

export {
    KeyValue, DatabaseEntry, EntityType, DeviceType, GreenPowerEvents, GreenPowerDeviceJoinedPayload,
    SendPolicy
};