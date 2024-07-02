import {GP_ENDPOINT, GP_PROFILE_ID, HA_PROFILE_ID} from '../../../zspec/consts';
import {Clusters} from '../../../zspec/zcl/definition/cluster';
import {ClusterId, EmberMulticastId, ProfileId} from '../types';

type FixedEndpointInfo = {
    /** Actual Zigbee endpoint number. uint8_t */
    endpoint: number;
    /** Profile ID of the device on this endpoint. */
    profileId: ProfileId;
    /** Device ID of the device on this endpoint. uint16_t*/
    deviceId: number;
    /** Version of the device. uint8_t */
    deviceVersion: number;
    /** List of server clusters. */
    inClusterList: readonly ClusterId[];
    /** List of client clusters. */
    outClusterList: readonly ClusterId[];
    /** Network index for this endpoint. uint8_t */
    networkIndex: number;
    /** Multicast group IDs to register in the multicast table */
    multicastIds: readonly EmberMulticastId[];
};

/**
 * List of endpoints to register.
 *
 * Index 0 is used as default and expected to be the primary network.
 */
export const FIXED_ENDPOINTS: readonly FixedEndpointInfo[] = [
    {
        // primary network
        endpoint: 1,
        profileId: HA_PROFILE_ID,
        deviceId: 0x65, // ?
        deviceVersion: 1,
        inClusterList: [
            Clusters.genBasic.ID, // 0x0000,// Basic
            Clusters.genIdentify.ID, // 0x0003,// Identify
            Clusters.genOnOff.ID, // 0x0006,// On/off
            Clusters.genLevelCtrl.ID, // 0x0008,// Level Control
            Clusters.genTime.ID, // 0x000A,// Time
            Clusters.genOta.ID, // 0x0019,// Over the Air Bootloading
            // Cluster.genPowerProfile.ID,// 0x001A,// Power Profile XXX: missing ZCL cluster def in Z2M?
            Clusters.lightingColorCtrl.ID, // 0x0300,// Color Control
        ],
        outClusterList: [
            Clusters.genBasic.ID, // 0x0000,// Basic
            Clusters.genIdentify.ID, // 0x0003,// Identify
            Clusters.genGroups.ID, // 0x0004,// Groups
            Clusters.genScenes.ID, // 0x0005,// Scenes
            Clusters.genOnOff.ID, // 0x0006,// On/off
            Clusters.genLevelCtrl.ID, // 0x0008,// Level Control
            Clusters.genPollCtrl.ID, // 0x0020,// Poll Control
            Clusters.lightingColorCtrl.ID, // 0x0300,// Color Control
            Clusters.msIlluminanceMeasurement.ID, // 0x0400,// Illuminance Measurement
            Clusters.msTemperatureMeasurement.ID, // 0x0402,// Temperature Measurement
            Clusters.msRelativeHumidity.ID, // 0x0405,// Relative Humidity Measurement
            Clusters.msOccupancySensing.ID, // 0x0406,// Occupancy Sensing
            Clusters.ssIasZone.ID, // 0x0500,// IAS Zone
            Clusters.seMetering.ID, // 0x0702,// Simple Metering
            Clusters.haMeterIdentification.ID, // 0x0B01,// Meter Identification
            Clusters.haApplianceStatistics.ID, // 0x0B03,// Appliance Statistics
            Clusters.haElectricalMeasurement.ID, // 0x0B04,// Electrical Measurement
            Clusters.touchlink.ID, // 0x1000, // touchlink
        ],
        networkIndex: 0x00,
        // - Cluster spec 3.7.2.4.1: group identifier 0x0000 is reserved for the global scene used by the OnOff cluster.
        // - 901: defaultBindGroup
        multicastIds: [0, 901],
    },
    {
        // green power
        endpoint: GP_ENDPOINT,
        profileId: GP_PROFILE_ID,
        deviceId: 0x66,
        deviceVersion: 1,
        inClusterList: [
            Clusters.greenPower.ID, // 0x0021,// Green Power
        ],
        outClusterList: [
            Clusters.greenPower.ID, // 0x0021,// Green Power
        ],
        networkIndex: 0x00,
        multicastIds: [0x0b84],
    },
];
