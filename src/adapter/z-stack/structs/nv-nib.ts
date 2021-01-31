/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {nwkKeyDescriptor} from "./nwk-key-descriptor";
import {Struct} from "./struct";

/**
 * Due to platform memory alignment NIB size may differ. For 8-bit platforms (CC2530, CC2531) the NIB length
 * is 110 bytes (which is the actual struct size). For newer platforms (CC2538, CC1352, CC2652) which use 16-bit
 * addressing the size is 116 bytes due to memory alignment. These are offsets on which an extra 0x00 byte needs
 * to be added to apply padding equivalent to newer platforms padding - bumping the structure to 116 bytes.
 */
const NIB_16BIT_ALIGNMENT_OFFSETS = [15, 21, 25, 39, 109, 115];

/**
 * Creates a NIB (Network Information Base) struct.
 * 
 * Struct provides 2 custom methods for aligned and unaligned data fetch.
 * `getUnaligned()` returns the raw structure (suitable for 8-bit MCUs - CC2530/CC2531).
 * `getAligned()` method returns the data aligned for 16-bit memory addressing.
 *
 * *Definition from Z-Stack 3.0.2 `nwk.h`*
 * 
 * @param data Data to initialize structure with.
 */
export const nvNIB = (data?: Buffer) => {
    if (data && data.length === 116) {
        data = data.slice();
        if (data.length === 116) {
            const slices: Buffer[] = [];
            for (const [i, offset] of NIB_16BIT_ALIGNMENT_OFFSETS.entries()) {
                slices.push(
                    data.slice(
                        i === 0 ? 0 : NIB_16BIT_ALIGNMENT_OFFSETS[i - 1] + 1,
                        i === 0 ? offset : i === NIB_16BIT_ALIGNMENT_OFFSETS.length - 1 ? data.length - 1 : offset
                    )
                );
            }
            data = Buffer.concat(slices);
        }
    }
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
        .method("getUnaligned", Buffer.prototype, nib => nib.getRaw())
        .method("getAligned", Buffer.prototype, nib => {
            let alignedBuffer = nib.getRaw().slice();
            for (const offset of NIB_16BIT_ALIGNMENT_OFFSETS) {
                alignedBuffer = Buffer.concat([
                    alignedBuffer.slice(0, offset),
                    Buffer.from([0x00]),
                    alignedBuffer.slice(offset)
                ]);
            }
            return alignedBuffer;
        })
        .build(data);
};
