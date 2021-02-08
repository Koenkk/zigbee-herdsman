/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {nwkKeyDescriptor} from "./nwk-key-descriptor";
import {Struct} from "../struct";

/**
 * Creates a NIB (Network Information Base) struct.
 *
 * *Definition from Z-Stack 3.0.2 `nwk.h`*
 * 
 * @param data Data to initialize structure with.
 */
export const nib = (data?: Buffer) => {
    return Struct.new()
        .member("uint8", "SequenceNum")
        .member("uint8", "PassiveAckTimeout")
        .member("uint8", "MaxBroadcastRetries")
        .member("uint8", "MaxChildren")
        .member("uint8", "MaxDepth")
        .member("uint8", "MaxRouters")
        .member("uint8", "dummyNeighborTable")
        .member("uint8", "BroadcastDeliveryTime")
        .member("uint8", "ReportConstantCost")
        .member("uint8", "RouteDiscRetries")
        .member("uint8", "dummyRoutingTable")
        .member("uint8", "SecureAllFrames")
        .member("uint8", "SecurityLevel")
        .member("uint8", "SymLink")
        .member("uint8", "CapabilityFlags")
        .member("uint16", "TransactionPersistenceTime")
        .member("uint8", "nwkProtocolVersion")
        .member("uint8", "RouteDiscoveryTime")
        .member("uint8", "RouteExpiryTime")
        .member("uint16", "nwkDevAddress")
        .member("uint8", "nwkLogicalChannel")
        .member("uint16", "nwkCoordAddress")
        .member("uint8array-reversed", "nwkCoordExtAddress", 8)
        .member("uint16", "nwkPanId")
        .member("uint8", "nwkState")
        .member("uint32", "channelList")
        .member("uint8", "beaconOrder")
        .member("uint8", "superFrameOrder")
        .member("uint8", "scanDuration")
        .member("uint8", "battLifeExt")
        .member("uint32", "allocatedRouterAddresses")
        .member("uint32", "allocatedEndDeviceAddresses")
        .member("uint8", "nodeDepth")
        .member("uint8array-reversed", "extendedPANID", 8)
        .member("uint8", "nwkKeyLoaded")
        .member("struct", "spare1", nwkKeyDescriptor)
        .member("struct", "spare2", nwkKeyDescriptor)
        .member("uint8", "spare3")
        .member("uint8", "spare4")
        .member("uint8", "nwkLinkStatusPeriod")
        .member("uint8", "nwkRouterAgeLimit")
        .member("uint8", "nwkUseMultiCast")
        .member("uint8", "nwkIsConcentrator")
        .member("uint8", "nwkConcentratorDiscoveryTime")
        .member("uint8", "nwkConcentratorRadius")
        .member("uint8", "nwkAllFresh")
        .member("uint16", "nwkManagerAddr")
        .member("uint16", "nwkTotalTransmissions")
        .member("uint8", "nwkUpdateId")
        .build(data);
};
