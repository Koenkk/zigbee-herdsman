export interface UnifiedBackupStorage {
    metadata: {
        version: [0, 1];
        source: string;
        internal: {
            zhFormat: 2;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            [key: string]: any;
        };
    };
    stack_specific?: {
        zstack?: {
            tclk_seed?: string;
        };
    };
    coordinator_ieee: string;
    pan_id: number;
    extended_pan_id: string;
    nwk_update_id: number;
    security_level: number;
    channel: number;
    channel_mask: number[];
    network_key: {
        key: string;
        sequence_number: number;
        frame_counter: number;
    };
    devices: {
        nwk_address: number;
        ieee_address: string;
        link_key: {
            key: string;
            rx_counter: number;
            tx_counter: number;
        } | null;
    }[];
}
