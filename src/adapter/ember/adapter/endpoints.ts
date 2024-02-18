import Cluster from '../../../zcl/definition/cluster';
import {GP_ENDPOINT, GP_PROFILE_ID, HA_PROFILE_ID} from '../consts';
import {ClusterId, ProfileId} from '../types';


type FixedEndpointInfo = {
    /** Actual Zigbee endpoint number. uint8_t */
    endpoint: number,
    /** Profile ID of the device on this endpoint. */
    profileId: ProfileId,
    /** Device ID of the device on this endpoint. uint16_t*/
    deviceId: number,
    /** Version of the device. uint8_t */
    deviceVersion: number,
    /** List of server clusters. */
    inClusterList:  ClusterId[],
    /** List of client clusters. */
    outClusterList:  ClusterId[],
    /** Network index for this endpoint. uint8_t */
    networkIndex: number,
};


/**
 * List of endpoints to register.
 * 
 * Index 0 is used as default and expected to be the primary network.
 */
export const FIXED_ENDPOINTS: readonly FixedEndpointInfo[] = [
    {// primary network
        endpoint: 1,
        profileId: HA_PROFILE_ID,
        deviceId: 0x65,// ?
        deviceVersion: 1,
        inClusterList: [
            Cluster.genBasic.ID,// 0x0000,// Basic
            Cluster.genIdentify.ID,// 0x0003,// Identify
            Cluster.genOnOff.ID,// 0x0006,// On/off
            Cluster.genLevelCtrl.ID,// 0x0008,// Level Control
            Cluster.genTime.ID,// 0x000A,// Time
            Cluster.genOta.ID,// 0x0019,// Over the Air Bootloading
            // Cluster.genPowerProfile.ID,// 0x001A,// Power Profile XXX: missing ZCL cluster def in Z2M?
            Cluster.lightingColorCtrl.ID,// 0x0300,// Color Control
        ],
        outClusterList: [
            Cluster.genBasic.ID,// 0x0000,// Basic
            Cluster.genIdentify.ID,// 0x0003,// Identify
            Cluster.genGroups.ID,// 0x0004,// Groups
            Cluster.genScenes.ID,// 0x0005,// Scenes
            Cluster.genOnOff.ID,// 0x0006,// On/off
            Cluster.genLevelCtrl.ID,// 0x0008,// Level Control
            Cluster.genPollCtrl.ID,// 0x0020,// Poll Control
            Cluster.lightingColorCtrl.ID,// 0x0300,// Color Control
            Cluster.msIlluminanceMeasurement.ID,// 0x0400,// Illuminance Measurement
            Cluster.msTemperatureMeasurement.ID,// 0x0402,// Temperature Measurement
            Cluster.msRelativeHumidity.ID,// 0x0405,// Relative Humidity Measurement
            Cluster.msOccupancySensing.ID,// 0x0406,// Occupancy Sensing
            Cluster.ssIasZone.ID,// 0x0500,// IAS Zone
            Cluster.seMetering.ID,// 0x0702,// Simple Metering
            Cluster.haMeterIdentification.ID,// 0x0B01,// Meter Identification
            Cluster.haApplianceStatistics.ID,// 0x0B03,// Appliance Statistics
            Cluster.haElectricalMeasurement.ID,// 0x0B04,// Electrical Measurement
            Cluster.touchlink.ID,// 0x1000, // touchlink
        ],
        networkIndex: 0x00,
    },
    {// green power
        endpoint: GP_ENDPOINT,
        profileId: GP_PROFILE_ID,
        deviceId: 0x66,
        deviceVersion: 1,
        inClusterList: [
            Cluster.greenPower.ID,// 0x0021,// Green Power
        ],
        outClusterList: [
            Cluster.greenPower.ID,// 0x0021,// Green Power
        ],
        networkIndex: 0x00,
    },
];
