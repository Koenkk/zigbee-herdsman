import assert from 'assert';

import {ClusterId as ZdoClusterId} from '../../../zspec/zdo';
import {MtCmd, MtCmdAreqZdo} from './tstype';

export const ZDO_CLUSTER_ID_TO_ZSTACK_SREQ_ID: Readonly<Partial<Record<ZdoClusterId, number>>> = {
    [ZdoClusterId.NETWORK_ADDRESS_REQUEST]: 0,
    [ZdoClusterId.IEEE_ADDRESS_REQUEST]: 1,
    [ZdoClusterId.NODE_DESCRIPTOR_REQUEST]: 2,
    [ZdoClusterId.POWER_DESCRIPTOR_REQUEST]: 3,
    [ZdoClusterId.SIMPLE_DESCRIPTOR_REQUEST]: 4,
    [ZdoClusterId.ACTIVE_ENDPOINTS_REQUEST]: 5,
    [ZdoClusterId.MATCH_DESCRIPTORS_REQUEST]: 6,
    [ZdoClusterId.SYSTEM_SERVER_DISCOVERY_REQUEST]: 12,
    [ZdoClusterId.BIND_REQUEST]: 33,
    [ZdoClusterId.UNBIND_REQUEST]: 34,
    [ZdoClusterId.LQI_TABLE_REQUEST]: 49,
    [ZdoClusterId.ROUTING_TABLE_REQUEST]: 50,
    [ZdoClusterId.BINDING_TABLE_REQUEST]: 51,
    [ZdoClusterId.LEAVE_REQUEST]: 52,
    [ZdoClusterId.PERMIT_JOINING_REQUEST]: 54,
    [ZdoClusterId.NWK_UPDATE_REQUEST]: 55,
};
// TODO refactor to ID when waitFor supports it
export const ZDO_CLUSTER_ID_TO_ZSTACK_AREQ_NAME: Readonly<Partial<Record<ZdoClusterId, string>>> = {
    [ZdoClusterId.NETWORK_ADDRESS_RESPONSE]: 'nwkAddrRsp', // 128,
    [ZdoClusterId.IEEE_ADDRESS_RESPONSE]: 'ieeeAddrRsp', // 129,
    [ZdoClusterId.NODE_DESCRIPTOR_RESPONSE]: 'nodeDescRsp', // 130,
    [ZdoClusterId.POWER_DESCRIPTOR_RESPONSE]: 'powerDescRsp', // 131,
    [ZdoClusterId.SIMPLE_DESCRIPTOR_RESPONSE]: 'simpleDescRsp', // 132,
    [ZdoClusterId.ACTIVE_ENDPOINTS_RESPONSE]: 'activeEpRsp', // 133,
    [ZdoClusterId.MATCH_DESCRIPTORS_RESPONSE]: 'matchDescRsp', // 134,
    [ZdoClusterId.SYSTEM_SERVER_DISCOVERY_RESPONSE]: 'serverDiscRsp', // 138,
    [ZdoClusterId.BIND_RESPONSE]: 'bindRsp', // 161,
    [ZdoClusterId.UNBIND_RESPONSE]: 'unbindRsp', // 162,
    [ZdoClusterId.LQI_TABLE_RESPONSE]: 'mgmtLqiRsp', // 177,
    [ZdoClusterId.ROUTING_TABLE_RESPONSE]: 'mgmtRtgRsp', // 178,
    [ZdoClusterId.BINDING_TABLE_RESPONSE]: 'mgmtBindRsp', // 179,
    [ZdoClusterId.LEAVE_RESPONSE]: 'mgmtLeaveRsp', // 180,
    [ZdoClusterId.PERMIT_JOINING_RESPONSE]: 'mgmtPermitJoinRsp', // 182,
    [ZdoClusterId.NWK_UPDATE_RESPONSE]: 'mgmtNwkUpdateNotify', // 184,
    [ZdoClusterId.END_DEVICE_ANNOUNCE]: 'endDeviceAnnceInd', // 193,
};

export function isMtCmdAreqZdo(cmd: MtCmd): cmd is MtCmdAreqZdo {
    return 'zdoClusterId' in cmd;
}

export function getSREQId(clusterId: ZdoClusterId): number {
    const id = ZDO_CLUSTER_ID_TO_ZSTACK_SREQ_ID[clusterId];
    assert(id, `ZDO cluster ID '${clusterId} has no supported SREQ.`);
    return id;
}

export function getAREQName(clusterId: ZdoClusterId): string {
    const name = ZDO_CLUSTER_ID_TO_ZSTACK_AREQ_NAME[clusterId];
    assert(name, `ZDO cluster ID '${clusterId} has no supported AREQ.`);
    return name;
}
