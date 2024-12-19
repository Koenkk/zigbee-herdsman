/* v8 ignore start */

import * as ZSpec from '../../../zspec';
import {NetworkCache} from '../adapter/emberAdapter';
import {INVALID_RADIO_CHANNEL, ZB_PSA_ALG} from '../consts';
import {EmberJoinMethod, SecManDerivedKeyType, SecManFlag, SecManKeyType} from '../enums';
import {EMBER_AES_HASH_BLOCK_SIZE} from '../ezsp/consts';
import {EmberAesMmoHashContext, SecManContext} from '../types';

/**
 * Initialize a network cache index with proper "invalid" values.
 * @returns
 */
export const initNetworkCache = (): NetworkCache => {
    return {
        eui64: ZSpec.BLANK_EUI64,
        parameters: {
            extendedPanId: ZSpec.BLANK_EXTENDED_PAN_ID.slice(), // copy
            panId: ZSpec.INVALID_PAN_ID,
            radioTxPower: 0,
            radioChannel: INVALID_RADIO_CHANNEL,
            joinMethod: EmberJoinMethod.MAC_ASSOCIATION,
            nwkManagerId: ZSpec.NULL_NODE_ID,
            nwkUpdateId: 0,
            channels: ZSpec.ALL_802_15_4_CHANNELS_MASK,
        },
    };
};

/**
 * This routine will initialize a Security Manager context correctly for use in subsequent function calls.
 * @returns
 */
export const initSecurityManagerContext = (): SecManContext => {
    return {
        coreKeyType: SecManKeyType.NONE,
        keyIndex: 0,
        derivedType: SecManDerivedKeyType.NONE,
        eui64: `0x0000000000000000`,
        multiNetworkIndex: 0,
        flags: SecManFlag.NONE,
        psaKeyAlgPermission: ZB_PSA_ALG, // unused for classic key storage
    };
};

/**
 *  This routine clears the passed context so that a new hash calculation
 *  can be performed.
 *
 *  @returns context A pointer to the location of hash context to clear.
 */
export const aesMmoHashInit = (): EmberAesMmoHashContext => {
    // MEMSET(context, 0, sizeof(EmberAesMmoHashContext));
    return {
        result: Buffer.alloc(EMBER_AES_HASH_BLOCK_SIZE), // uint8_t[EMBER_AES_HASH_BLOCK_SIZE]
        length: 0x00000000, // uint32_t
    };
};
