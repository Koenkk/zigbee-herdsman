/** The endpoint where the ZigBee Device Object (ZDO) resides. */
export const ZDO_ENDPOINT = 0;

/** The profile ID used by the ZigBee Device Object (ZDO). */
export const ZDO_PROFILE_ID = 0x0000;

/** ZDO messages start with a sequence number. */
export const ZDO_MESSAGE_OVERHEAD = 1;

export const MULTICAST_BINDING = 0x01;
export const UNICAST_BINDING = 0x03;

/** 64-bit challenge value used by CHALLENGE_REQUEST/CHALLENGE_RESPONSE clusters */
export const CHALLENGE_VALUE_SIZE = 8;
/** The 256-bit Curve 25519 public point. */
export const CURVE_PUBLIC_POINT_SIZE = 32;
