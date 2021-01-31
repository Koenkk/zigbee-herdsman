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
    coordinator_ieee: string;
    pan_id: number;
    extended_pan_id: string;
    nwk_update_id: number;
    security_level: number;
    channel_list: number[];
    network_key: string;
    frame_counters: {
        extended_pan_id: string;
        value: number;
    }[];
    tc_link_key_table?: {
        extended_address: string;
        tx_frame_counter: number;
        rx_frame_counter: number;
        key_attributes?: number;
        key_type?: number;
        seed_shift?: number;
    }[];
}
