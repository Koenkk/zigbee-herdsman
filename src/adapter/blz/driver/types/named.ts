/* istanbul ignore file */

import * as basic from './basic';
import {fixed_list} from './basic';

const NS = 'zh:blz:named';

export class BlzNodeId extends basic.uint16_t {}
export class BlzEUI64 extends fixed_list(8, basic.uint8_t) {
    constructor(private _value: ArrayLike<number> | string) {
        super();
        if (typeof _value === 'string') {
            if (_value.startsWith('0x')) _value = _value.slice(2);
            if ((_value as string).length !== 16) {
                throw new Error('Incorrect value passed');
            }
            this._value = Buffer.from(_value, 'hex');
        } else {
            if (_value.length !== 8) {
                throw new Error('Incorrect value passed');
            }
            this._value = _value;
        }
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static deserialize(cls: any, data: Buffer): any[] {
        const arr = super.deserialize(cls, data);
        const r = arr[0];
        data = arr[1] as Buffer;
        return [Buffer.from(r).reverse(), data];
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static serialize(cls: any, value: number[] | BlzEUI64): Buffer {
        if (value instanceof BlzEUI64) {
            value = (value as BlzEUI64).value as number[];
        }
        const val = Buffer.from(value)
            .reverse()
            .map((i) => basic.uint8_t.serialize(basic.uint8_t, i)[0]);
        return Buffer.from(val);
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    public get value(): any {
        return this._value;
    }

    public toString(): string {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
        return Buffer.from(this._value as any).toString('hex');
    }
}
export class Bool extends basic.uint8_t {
    static false = 0x00; // An alias for zero, used for clarity.
    static true = 0x01; // An alias for one, used for clarity.
}

export class BlzValueId extends basic.uint8_t {
    // BLZ Value ID enumeration.

    // BLZ version
    static BLZ_VALUE_ID_BLZ_VERSION = 0x00;
    // Stack version
    static BLZ_VALUE_ID_STACK_VERSION = 0x01;
    // Neighbor table size
    static BLZ_VALUE_ID_NEIGHBOR_TABLE_SIZE = 0x02;
    // Source route table size
    static BLZ_VALUE_ID_SOURCE_ROUTE_TABLE_SIZE = 0x03;
    // Routing table size
    static BLZ_VALUE_ID_ROUTE_TABLE_SIZE = 0x04;
    // Route discovery table size
    static BLZ_VALUE_ID_DISCOVERY_TABLE_SIZE = 0x05;
    // Address map table size
    static BLZ_VALUE_ID_ADDRESS_TABLE_SIZE = 0x06;
    // Group table size
    static BLZ_VALUE_ID_MULTICAST_TABLE_SIZE = 0x07;
    // Broadcast table size
    static BLZ_VALUE_ID_BROADCAST_TABLE_SIZE = 0x08;
    // Binding table size
    static BLZ_VALUE_ID_BINDING_TABLE_SIZE = 0x09;
    // Max end device supported
    static BLZ_VALUE_ID_MAX_END_DEVICE_CHILDREN = 0x0A;
    // Indirect message timeout value
    static BLZ_VALUE_ID_INDIRECT_TRANSMISSION_TIMEOUT = 0x0B;
    // End device timeout value
    static BLZ_VALUE_ID_END_DEVICE_BIND_TIMEOUT = 0x0C;
    // Device Unique TC Link key table size
    static BLZ_VALUE_ID_UNIQUE_TC_LINK_KEY_TABLE_SIZE = 0x0D;
    // Trust center address
    static BLZ_VALUE_ID_TRUST_CENTER_ADDRESS = 0x0F;
    // MAC address of NCP
    static BLZ_VALUE_ID_MAC_ADDRESS = 0x20;
}

export class BlzStatus extends basic.uint8_t {
    // Success.
    static SUCCESS = 0x00;
    // TODO: General error.
    static GENERAL_ERROR = 0x01;
}

export class BlzNodeType extends basic.uint8_t {
    // The type of the node.
    static COORDINATOR = 0x00;
    // Will relay messages and can act as a parent to other nodes.
    static ROUTER = 0x01;
    // Communicates only with its parent and will not relay messages.
    static END_DEVICE = 0x02;
}

export class BlzOutgoingMessageType extends basic.uint8_t {
    // Message types.
    // Unicast message type.
    static BLZ_MSG_TYPE_UNICAST = 0x01;
    // Multicast message type.
    static BLZ_MSG_TYPE_MULTICAST = 0x02;
    // Broadcast message type.
    static BLZ_MSG_TYPE_BROADCAST = 0x03;
}

// Options to use when sending a message.
export class BlzApsOption extends basic.uint16_t {

    // No options.
    static ZB_APS_TX_OPTIONS_NONE = 0x00;
    // Send the message using APS Encryption, using the Link Key shared with the
    // destination node to encrypt the data at the APS Level.
    static ZB_APS_TX_OPTIONS_SEC_EN_TRANS = 0x01;
    // Use the network key to encrypt the data at the APS Level.
    static ZB_APS_TX_OPTIONS_USE_NWK_KEY = 0x02;
    // Use the APS ACK mechanism to confirm that the message was received.
    static ZB_APS_TX_OPTIONS_ACK_TRANS = 0x04;
    static ZB_APS_TX_OPTIONS_FRAG_PERMIT = 0x08;
    static ZB_APS_TX_OPTIONS_EXT_NONCE = 0x10;
}


export class BlzZDOCmd extends basic.uint16_t {
    // Device and Service Discovery Server Requests
    static NWK_addr_req = 0x0000;
    static IEEE_addr_req = 0x0001;
    static Node_Desc_req = 0x0002;
    static Power_Desc_req = 0x0003;
    static Simple_Desc_req = 0x0004;
    static Active_EP_req = 0x0005;
    static Match_Desc_req = 0x0006;
    static Complex_Desc_req = 0x0010;
    static User_Desc_req = 0x0011;
    static Discovery_Cache_req = 0x0012;
    static Device_annce = 0x0013;
    static User_Desc_set = 0x0014;
    static System_Server_Discovery_req = 0x0015;
    static Discovery_store_req = 0x0016;
    static Node_Desc_store_req = 0x0017;
    static Active_EP_store_req = 0x0019;
    static Simple_Desc_store_req = 0x001a;
    static Remove_node_cache_req = 0x001b;
    static Find_node_cache_req = 0x001c;
    static Extended_Simple_Desc_req = 0x001d;
    static Extended_Active_EP_req = 0x001e;
    static Parent_annce = 0x001f;
    //  Bind Management Server Services Responses
    static End_Device_Bind_req = 0x0020;
    static Bind_req = 0x0021;
    static Unbind_req = 0x0022;
    // Network Management Server Services Requests
    // ... TODO optional stuff ...
    static Mgmt_Lqi_req = 0x0031;
    static Mgmt_Rtg_req = 0x0032;
    // ... TODO optional stuff ...
    static Mgmt_Leave_req = 0x0034;
    static Mgmt_Permit_Joining_req = 0x0036;
    static Mgmt_NWK_Update_req = 0x0038;
    // ... TODO optional stuff ...

    // Responses
    // Device and Service Discovery Server Responses
    static NWK_addr_rsp = 0x8000;
    static IEEE_addr_rsp = 0x8001;
    static Node_Desc_rsp = 0x8002;
    static Power_Desc_rsp = 0x8003;
    static Simple_Desc_rsp = 0x8004;
    static Active_EP_rsp = 0x8005;
    static Match_Desc_rsp = 0x8006;
    static Complex_Desc_rsp = 0x8010;
    static User_Desc_rsp = 0x8011;
    static Discovery_Cache_rsp = 0x8012;
    static User_Desc_conf = 0x8014;
    static System_Server_Discovery_rsp = 0x8015;
    static Discovery_Store_rsp = 0x8016;
    static Node_Desc_store_rsp = 0x8017;
    static Power_Desc_store_rsp = 0x8018;
    static Active_EP_store_rsp = 0x8019;
    static Simple_Desc_store_rsp = 0x801a;
    static Remove_node_cache_rsp = 0x801b;
    static Find_node_cache_rsp = 0x801c;
    static Extended_Simple_Desc_rsp = 0x801d;
    static Extended_Active_EP_rsp = 0x801e;
    static Parent_annce_rsp = 0x801f;
    //  Bind Management Server Services Responses
    static End_Device_Bind_rsp = 0x8020;
    static Bind_rsp = 0x8021;
    static Unbind_rsp = 0x8022;
    // ... TODO optional stuff ...
    // Network Management Server Services Responses
    static Mgmt_Lqi_rsp = 0x8031;
    static Mgmt_Rtg_rsp = 0x8032;
    // ... TODO optional stuff ...
    static Mgmt_Leave_rsp = 0x8034;
    static Mgmt_Permit_Joining_rsp = 0x8036;
    // ... TODO optional stuff ...
    static Mgmt_NWK_Update_rsp = 0x8038;
}