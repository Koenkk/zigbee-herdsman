/* v8 ignore start */

import {logger} from '../../../utils/logger';
import {BLANK_EUI64} from '../../../zspec';
import {SecManFlag, SecManKeyType, SLStatus} from '../enums';
import {EMBER_ENCRYPTION_KEY_SIZE, EUI64_SIZE} from '../ezsp/consts';
import {EzspValueId} from '../ezsp/enums';
import {Ezsp} from '../ezsp/ezsp';
import {EmberTokenData, SecManKey} from '../types';
import {initSecurityManagerContext} from '../utils/initters';

const NS = 'zh:ember:tokens';

/* eslint-disable @typescript-eslint/no-unused-vars */
//------------------------------------------------------------------------------
// Definitions for stack tokens.
// protocol\zigbee\stack\config\token-stack.h

/**
 * Creator Codes
 *
 * The CREATOR is used as a distinct identifier tag for the token.
 *
 * The CREATOR is necessary because the token name is defined differently depending on the hardware platform.
 * Therefore, the CREATOR ensures that token definitions and data stay tagged and known.
 * The only requirement is that each creator definition must be unique.
 * See hal/micro/token.h for a more complete explanation.
 *
 */
// STACK CREATORS
const CREATOR_STACK_NVDATA_VERSION = 0xff01;
const CREATOR_STACK_BOOT_COUNTER = 0xe263;
const CREATOR_STACK_NONCE_COUNTER = 0xe563;
const CREATOR_STACK_ANALYSIS_REBOOT = 0xe162;
const CREATOR_STACK_KEYS = 0xeb79;
const CREATOR_STACK_NODE_DATA = 0xee64;
const CREATOR_STACK_CLASSIC_DATA = 0xe364;
const CREATOR_STACK_ALTERNATE_KEY = 0xe475;
const CREATOR_STACK_APS_FRAME_COUNTER = 0xe123;
const CREATOR_STACK_TRUST_CENTER = 0xe124;
const CREATOR_STACK_NETWORK_MANAGEMENT = 0xe125;
const CREATOR_STACK_PARENT_INFO = 0xe126;
const CREATOR_STACK_PARENT_ADDITIONAL_INFO = 0xe127;
const CREATOR_STACK_MULTI_PHY_NWK_INFO = 0xe128;
const CREATOR_STACK_MIN_RECEIVED_RSSI = 0xe129;
// Restored EUI64
const CREATOR_STACK_RESTORED_EUI64 = 0xe12a;

// MULTI-NETWORK STACK CREATORS
const CREATOR_MULTI_NETWORK_STACK_KEYS = 0xe210;
const CREATOR_MULTI_NETWORK_STACK_NODE_DATA = 0xe211;
const CREATOR_MULTI_NETWORK_STACK_ALTERNATE_KEY = 0xe212;
const CREATOR_MULTI_NETWORK_STACK_TRUST_CENTER = 0xe213;
const CREATOR_MULTI_NETWORK_STACK_NETWORK_MANAGEMENT = 0xe214;
const CREATOR_MULTI_NETWORK_STACK_PARENT_INFO = 0xe215;

// A temporary solution for multi-network nwk counters:
// This counter will be used on the network with index 1.
const CREATOR_MULTI_NETWORK_STACK_NONCE_COUNTER = 0xe220;
const CREATOR_MULTI_NETWORK_STACK_PARENT_ADDITIONAL_INFO = 0xe221;

// GP stack tokens.
const CREATOR_STACK_GP_DATA = 0xe258;
const CREATOR_STACK_GP_PROXY_TABLE = 0xe259;
const CREATOR_STACK_GP_SINK_TABLE = 0xe25a;
const CREATOR_STACK_GP_INCOMING_FC = 0xe25b;
const CREATOR_STACK_GP_INCOMING_FC_IN_SINK = 0xe25c;
// APP CREATORS
const CREATOR_STACK_BINDING_TABLE = 0xe274;
const CREATOR_STACK_CHILD_TABLE = 0xff0d;
const CREATOR_STACK_KEY_TABLE = 0xe456;
const CREATOR_STACK_CERTIFICATE_TABLE = 0xe500;
const CREATOR_STACK_ZLL_DATA = 0xe501;
const CREATOR_STACK_ZLL_SECURITY = 0xe502;
const CREATOR_STACK_ADDITIONAL_CHILD_DATA = 0xe503;

/**
 * NVM3 Object Keys
 *
 * The NVM3 object key is used as a distinct identifier tag for a token stored in NVM3.
 *
 * Every token must have a defined NVM3 object key and the object key must be unique.
 * The object key defined must be in the following format:
 *
 * NVM3KEY_tokenname where tokenname is the name of the token without NVM3KEY_ or TOKEN_ prefix.
 *
 */
// NVM3KEY domain base keys
const NVM3KEY_DOMAIN_USER = 0x00000;
const NVM3KEY_DOMAIN_ZIGBEE = 0x10000;
const NVM3KEY_DOMAIN_COMMON = 0x80000;

// STACK KEYS
const NVM3KEY_STACK_NVDATA_VERSION = NVM3KEY_DOMAIN_ZIGBEE | 0xff01;
const NVM3KEY_STACK_BOOT_COUNTER = NVM3KEY_DOMAIN_ZIGBEE | 0xe263;
const NVM3KEY_STACK_NONCE_COUNTER = NVM3KEY_DOMAIN_ZIGBEE | 0xe563;
const NVM3KEY_STACK_ANALYSIS_REBOOT = NVM3KEY_DOMAIN_ZIGBEE | 0xe162;
const NVM3KEY_STACK_KEYS = NVM3KEY_DOMAIN_ZIGBEE | 0xeb79;
const NVM3KEY_STACK_NODE_DATA = NVM3KEY_DOMAIN_ZIGBEE | 0xee64;
const NVM3KEY_STACK_CLASSIC_DATA = NVM3KEY_DOMAIN_ZIGBEE | 0xe364;
const NVM3KEY_STACK_ALTERNATE_KEY = NVM3KEY_DOMAIN_ZIGBEE | 0xe475;
const NVM3KEY_STACK_APS_FRAME_COUNTER = NVM3KEY_DOMAIN_ZIGBEE | 0xe123;
const NVM3KEY_STACK_TRUST_CENTER = NVM3KEY_DOMAIN_ZIGBEE | 0xe124;
const NVM3KEY_STACK_NETWORK_MANAGEMENT = NVM3KEY_DOMAIN_ZIGBEE | 0xe125;
const NVM3KEY_STACK_PARENT_INFO = NVM3KEY_DOMAIN_ZIGBEE | 0xe126;
const NVM3KEY_STACK_PARENT_ADDITIONAL_INFO = NVM3KEY_DOMAIN_ZIGBEE | 0xe127;
const NVM3KEY_STACK_MULTI_PHY_NWK_INFO = NVM3KEY_DOMAIN_ZIGBEE | 0xe128;
const NVM3KEY_STACK_MIN_RECEIVED_RSSI = NVM3KEY_DOMAIN_ZIGBEE | 0xe129;
// Restored EUI64
const NVM3KEY_STACK_RESTORED_EUI64 = NVM3KEY_DOMAIN_ZIGBEE | 0xe12a;

// MULTI-NETWORK STACK KEYS
// This key is used for an indexed token and the subsequent 0x7F keys are also reserved.
const NVM3KEY_MULTI_NETWORK_STACK_KEYS = NVM3KEY_DOMAIN_ZIGBEE | 0x0000;
// This key is used for an indexed token and the subsequent 0x7F keys are also reserved.
const NVM3KEY_MULTI_NETWORK_STACK_NODE_DATA = NVM3KEY_DOMAIN_ZIGBEE | 0x0080;
// This key is used for an indexed token and the subsequent 0x7F keys are also reserved.
const NVM3KEY_MULTI_NETWORK_STACK_ALTERNATE_KEY = NVM3KEY_DOMAIN_ZIGBEE | 0x0100;
// This key is used for an indexed token and the subsequent 0x7F keys are also reserved.
const NVM3KEY_MULTI_NETWORK_STACK_TRUST_CENTER = NVM3KEY_DOMAIN_ZIGBEE | 0x0180;
// This key is used for an indexed token and the subsequent 0x7F keys are also reserved.
const NVM3KEY_MULTI_NETWORK_STACK_NETWORK_MANAGEMENT = NVM3KEY_DOMAIN_ZIGBEE | 0x0200;
// This key is used for an indexed token and the subsequent 0x7F keys are also reserved.
const NVM3KEY_MULTI_NETWORK_STACK_PARENT_INFO = NVM3KEY_DOMAIN_ZIGBEE | 0x0280;

// Temporary solution for multi-network nwk counters:
// This counter will be used on the network with index 1.
const NVM3KEY_MULTI_NETWORK_STACK_NONCE_COUNTER = NVM3KEY_DOMAIN_ZIGBEE | 0xe220;
// This key is used for an indexed token and the subsequent 0x7F keys are also reserved
const NVM3KEY_MULTI_NETWORK_STACK_PARENT_ADDITIONAL_INFO = NVM3KEY_DOMAIN_ZIGBEE | 0x0300;

// GP stack tokens.
const NVM3KEY_STACK_GP_DATA = NVM3KEY_DOMAIN_ZIGBEE | 0xe258;
// This key is used for an indexed token and the subsequent 0x7F keys are also reserved.
const NVM3KEY_STACK_GP_PROXY_TABLE = NVM3KEY_DOMAIN_ZIGBEE | 0x0380;
// This key is used for an indexed token and the subsequent 0x7F keys are also reserved.
const NVM3KEY_STACK_GP_SINK_TABLE = NVM3KEY_DOMAIN_ZIGBEE | 0x0400;
// This key is used for an indexed token and the subsequent 0x7F keys are also reserved
const NVM3KEY_STACK_GP_INCOMING_FC = NVM3KEY_DOMAIN_ZIGBEE | 0x0480;

// APP KEYS
// This key is used for an indexed token and the subsequent 0x7F keys are also reserved.
const NVM3KEY_STACK_BINDING_TABLE = NVM3KEY_DOMAIN_ZIGBEE | 0x0500;
// This key is used for an indexed token and the subsequent 0x7F keys are also reserved.
const NVM3KEY_STACK_CHILD_TABLE = NVM3KEY_DOMAIN_ZIGBEE | 0x0580;
// This key is used for an indexed token and the subsequent 0x7F keys are also reserved.
const NVM3KEY_STACK_KEY_TABLE = NVM3KEY_DOMAIN_ZIGBEE | 0x0600;
// This key is used for an indexed token and the subsequent 0x7F keys are also reserved.
const NVM3KEY_STACK_CERTIFICATE_TABLE = NVM3KEY_DOMAIN_ZIGBEE | 0x0680;
const NVM3KEY_STACK_ZLL_DATA = NVM3KEY_DOMAIN_ZIGBEE | 0xe501;
const NVM3KEY_STACK_ZLL_SECURITY = NVM3KEY_DOMAIN_ZIGBEE | 0xe502;
// This key is used for an indexed token and the subsequent 0x7F keys are also reserved.
const NVM3KEY_STACK_ADDITIONAL_CHILD_DATA = NVM3KEY_DOMAIN_ZIGBEE | 0x0700;

// This key is used for an indexed token and the subsequent 0x7F keys are also reserved
const NVM3KEY_STACK_GP_INCOMING_FC_IN_SINK = NVM3KEY_DOMAIN_ZIGBEE | 0x0780;

// XXX: comment out in prod, along with debug token prints
// const DEBUG_TOKEN_STRINGS = {
//     [NVM3KEY_STACK_NVDATA_VERSION]: 'NVM3KEY_STACK_NVDATA_VERSION',
//     [NVM3KEY_STACK_BOOT_COUNTER]: 'NVM3KEY_STACK_BOOT_COUNTER',
//     [NVM3KEY_STACK_NONCE_COUNTER]: 'NVM3KEY_STACK_NONCE_COUNTER',
//     [NVM3KEY_STACK_ANALYSIS_REBOOT]: 'NVM3KEY_STACK_ANALYSIS_REBOOT',
//     [NVM3KEY_STACK_KEYS]: 'NVM3KEY_STACK_KEYS',
//     [NVM3KEY_STACK_NODE_DATA]: 'NVM3KEY_STACK_NODE_DATA',
//     [NVM3KEY_STACK_CLASSIC_DATA]: 'NVM3KEY_STACK_CLASSIC_DATA',
//     [NVM3KEY_STACK_ALTERNATE_KEY]: 'NVM3KEY_STACK_ALTERNATE_KEY',
//     [NVM3KEY_STACK_APS_FRAME_COUNTER]: 'NVM3KEY_STACK_APS_FRAME_COUNTER',
//     [NVM3KEY_STACK_TRUST_CENTER]: 'NVM3KEY_STACK_TRUST_CENTER',
//     [NVM3KEY_STACK_NETWORK_MANAGEMENT]: 'NVM3KEY_STACK_NETWORK_MANAGEMENT',
//     [NVM3KEY_STACK_PARENT_INFO]: 'NVM3KEY_STACK_PARENT_INFO',
//     [NVM3KEY_STACK_PARENT_ADDITIONAL_INFO]: 'NVM3KEY_STACK_PARENT_ADDITIONAL_INFO',
//     [NVM3KEY_STACK_MULTI_PHY_NWK_INFO]: 'NVM3KEY_STACK_MULTI_PHY_NWK_INFO',
//     [NVM3KEY_STACK_MIN_RECEIVED_RSSI]: 'NVM3KEY_STACK_MIN_RECEIVED_RSSI',
//     [NVM3KEY_STACK_RESTORED_EUI64]: 'NVM3KEY_STACK_RESTORED_EUI64',
//     [NVM3KEY_MULTI_NETWORK_STACK_KEYS]: 'NVM3KEY_MULTI_NETWORK_STACK_KEYS',
//     [NVM3KEY_MULTI_NETWORK_STACK_NODE_DATA]: 'NVM3KEY_MULTI_NETWORK_STACK_NODE_DATA',
//     [NVM3KEY_MULTI_NETWORK_STACK_ALTERNATE_KEY]: 'NVM3KEY_MULTI_NETWORK_STACK_ALTERNATE_KEY',
//     [NVM3KEY_MULTI_NETWORK_STACK_TRUST_CENTER]: 'NVM3KEY_MULTI_NETWORK_STACK_TRUST_CENTER',
//     [NVM3KEY_MULTI_NETWORK_STACK_NETWORK_MANAGEMENT]: 'NVM3KEY_MULTI_NETWORK_STACK_NETWORK_MANAGEMENT',
//     [NVM3KEY_MULTI_NETWORK_STACK_PARENT_INFO]: 'NVM3KEY_MULTI_NETWORK_STACK_PARENT_INFO',
//     [NVM3KEY_MULTI_NETWORK_STACK_NONCE_COUNTER]: 'NVM3KEY_MULTI_NETWORK_STACK_NONCE_COUNTER',
//     [NVM3KEY_MULTI_NETWORK_STACK_PARENT_ADDITIONAL_INFO]: 'NVM3KEY_MULTI_NETWORK_STACK_PARENT_ADDITIONAL_INFO',
//     [NVM3KEY_STACK_GP_DATA]: 'NVM3KEY_STACK_GP_DATA',
//     [NVM3KEY_STACK_GP_PROXY_TABLE]: 'NVM3KEY_STACK_GP_PROXY_TABLE',
//     [NVM3KEY_STACK_GP_SINK_TABLE]: 'NVM3KEY_STACK_GP_SINK_TABLE',
//     [NVM3KEY_STACK_GP_INCOMING_FC]: 'NVM3KEY_STACK_GP_INCOMING_FC',
//     [NVM3KEY_STACK_BINDING_TABLE]: 'NVM3KEY_STACK_BINDING_TABLE',
//     [NVM3KEY_STACK_CHILD_TABLE]: 'NVM3KEY_STACK_CHILD_TABLE',
//     [NVM3KEY_STACK_KEY_TABLE]: 'NVM3KEY_STACK_KEY_TABLE',
//     [NVM3KEY_STACK_CERTIFICATE_TABLE]: 'NVM3KEY_STACK_CERTIFICATE_TABLE',
//     [NVM3KEY_STACK_ZLL_DATA]: 'NVM3KEY_STACK_ZLL_DATA',
//     [NVM3KEY_STACK_ZLL_SECURITY]: 'NVM3KEY_STACK_ZLL_SECURITY',
//     [NVM3KEY_STACK_ADDITIONAL_CHILD_DATA]: 'NVM3KEY_STACK_ADDITIONAL_CHILD_DATA',
//     [NVM3KEY_STACK_GP_INCOMING_FC_IN_SINK]: 'NVM3KEY_STACK_GP_INCOMING_FC_IN_SINK',
// };

/**
 * The current version number of the stack tokens.
 * MSB is the version, LSB is a complement.
 *
 * See hal/micro/token.h for a more complete explanation.
 */
const CURRENT_STACK_TOKEN_VERSION = 0x03fc;

/** 8-byte IEEE + 16-byte Key + 1-byte info */
const KEY_TABLE_ENTRY_SIZE = 25;
const KEY_ENTRY_IEEE_OFFSET = 0;
/** first 4 bytes may point to PSA ID if data[KEY_ENTRY_INFO_OFFSET] & KEY_TABLE_ENTRY_HAS_PSA_ID */
const KEY_ENTRY_KEY_DATA_OFFSET = 8;
const KEY_ENTRY_INFO_OFFSET = 24;
/* eslint-enable @typescript-eslint/no-unused-vars */

/** uint16_t */
const CREATORS: number[] = [
    CREATOR_STACK_NVDATA_VERSION,
    CREATOR_STACK_BOOT_COUNTER,
    CREATOR_STACK_NONCE_COUNTER,
    CREATOR_STACK_ANALYSIS_REBOOT,
    CREATOR_STACK_KEYS,
    CREATOR_STACK_NODE_DATA,
    CREATOR_STACK_CLASSIC_DATA,
    CREATOR_STACK_ALTERNATE_KEY,
    CREATOR_STACK_APS_FRAME_COUNTER,
    CREATOR_STACK_TRUST_CENTER,
    CREATOR_STACK_NETWORK_MANAGEMENT,
    CREATOR_STACK_PARENT_INFO,
    CREATOR_STACK_PARENT_ADDITIONAL_INFO,
    CREATOR_STACK_MULTI_PHY_NWK_INFO,
    CREATOR_STACK_MIN_RECEIVED_RSSI,
    CREATOR_STACK_RESTORED_EUI64,
    CREATOR_MULTI_NETWORK_STACK_KEYS,
    CREATOR_MULTI_NETWORK_STACK_NODE_DATA,
    CREATOR_MULTI_NETWORK_STACK_ALTERNATE_KEY,
    CREATOR_MULTI_NETWORK_STACK_TRUST_CENTER,
    CREATOR_MULTI_NETWORK_STACK_NETWORK_MANAGEMENT,
    CREATOR_MULTI_NETWORK_STACK_PARENT_INFO,
    CREATOR_MULTI_NETWORK_STACK_NONCE_COUNTER,
    CREATOR_MULTI_NETWORK_STACK_PARENT_ADDITIONAL_INFO,
    CREATOR_STACK_GP_DATA,
    CREATOR_STACK_GP_PROXY_TABLE,
    CREATOR_STACK_GP_SINK_TABLE,
    CREATOR_STACK_GP_INCOMING_FC,
    CREATOR_STACK_GP_INCOMING_FC_IN_SINK,
    CREATOR_STACK_BINDING_TABLE,
    CREATOR_STACK_CHILD_TABLE,
    CREATOR_STACK_KEY_TABLE,
    CREATOR_STACK_CERTIFICATE_TABLE,
    CREATOR_STACK_ZLL_DATA,
    CREATOR_STACK_ZLL_SECURITY,
    CREATOR_STACK_ADDITIONAL_CHILD_DATA,
];

/** uint32_t */
const NVM3KEYS: number[] = [
    NVM3KEY_STACK_NVDATA_VERSION,
    NVM3KEY_STACK_BOOT_COUNTER,
    NVM3KEY_STACK_NONCE_COUNTER,
    NVM3KEY_STACK_ANALYSIS_REBOOT,
    NVM3KEY_STACK_KEYS,
    NVM3KEY_STACK_NODE_DATA,
    NVM3KEY_STACK_CLASSIC_DATA,
    NVM3KEY_STACK_ALTERNATE_KEY,
    NVM3KEY_STACK_APS_FRAME_COUNTER,
    NVM3KEY_STACK_TRUST_CENTER,
    NVM3KEY_STACK_NETWORK_MANAGEMENT,
    NVM3KEY_STACK_PARENT_INFO,
    NVM3KEY_STACK_PARENT_ADDITIONAL_INFO,
    NVM3KEY_STACK_MULTI_PHY_NWK_INFO,
    NVM3KEY_STACK_MIN_RECEIVED_RSSI,
    NVM3KEY_STACK_RESTORED_EUI64,
    NVM3KEY_MULTI_NETWORK_STACK_KEYS,
    NVM3KEY_MULTI_NETWORK_STACK_NODE_DATA,
    NVM3KEY_MULTI_NETWORK_STACK_ALTERNATE_KEY,
    NVM3KEY_MULTI_NETWORK_STACK_TRUST_CENTER,
    NVM3KEY_MULTI_NETWORK_STACK_NETWORK_MANAGEMENT,
    NVM3KEY_MULTI_NETWORK_STACK_PARENT_INFO,
    NVM3KEY_MULTI_NETWORK_STACK_NONCE_COUNTER,
    NVM3KEY_MULTI_NETWORK_STACK_PARENT_ADDITIONAL_INFO,
    NVM3KEY_STACK_GP_DATA,
    NVM3KEY_STACK_GP_PROXY_TABLE,
    NVM3KEY_STACK_GP_SINK_TABLE,
    NVM3KEY_STACK_GP_INCOMING_FC,
    NVM3KEY_STACK_BINDING_TABLE,
    NVM3KEY_STACK_CHILD_TABLE,
    NVM3KEY_STACK_KEY_TABLE,
    NVM3KEY_STACK_CERTIFICATE_TABLE,
    NVM3KEY_STACK_ZLL_DATA,
    NVM3KEY_STACK_ZLL_SECURITY,
    NVM3KEY_STACK_ADDITIONAL_CHILD_DATA,
    NVM3KEY_STACK_GP_INCOMING_FC_IN_SINK,
];

const BLANK_EUI64_BUF = Buffer.from(BLANK_EUI64.substring(2) /*take out 0x*/, 'hex');

export class EmberTokensManager {
    /**
     * Host-only API to check whether the NCP uses key storage.
     *
     * @returns false if keys are in classic key storage, and true if they are located in PSA key storage.
     */
    public static async ncpUsesPSAKeyStorage(ezsp: Ezsp): Promise<boolean> {
        const [status, valueLength, value] = await ezsp.ezspGetValue(EzspValueId.KEY_STORAGE_VERSION, 1);

        if (status !== SLStatus.OK || valueLength < 1) {
            throw new Error(`[TOKENS] Error retrieving key storage version, status=${SLStatus[status]}.`);
        }

        return value[0] === 1;
    }

    /**
     * Matcher for Zigbeed tokens.
     * @param nvm3Key
     * @returns
     */
    public static getCreatorFromNvm3Key(nvm3Key: number): number {
        for (let i = 0; i < NVM3KEYS.length; i++) {
            if (NVM3KEYS[i] === nvm3Key) {
                return CREATORS[i];
            }
        }

        return 0xffff;
    }

    /**
     * Saves tokens. Only for NVM3-based NCP.
     *
     * The binary file format to save the tokens are
     *
     * Number of Tokens (1 byte)
     * Token0 (4 bytes) Token0Size(1 byte) Token0ArraySize(1 byte) Token0Data(Token0Size * Token0ArraySize)
     * :
     * :
     * TokenM (4 bytes) TokenMSize(1 byte) TokenMArraySize(1 byte) TokenMData(TokenMSize * TokenMArraySize)
     *
     * @param localEui64 Used in place of blank `restoredEui64` keys
     *
     * @return Saved tokens buffer or null.
     */
    public static async saveTokens(ezsp: Ezsp, localEui64: Buffer): Promise<Buffer | undefined> {
        logger.info(`[TOKENS] Saving tokens...`, NS);
        const tokenCount = await ezsp.ezspGetTokenCount();

        if (tokenCount) {
            const chunks: Buffer[] = [Buffer.from([tokenCount])]; // 1 byte
            // returns 1 if NCP has secure key storage (where these tokens do not store the key data).
            // Don't compile for scripted test or any non-host code due to linker issues.
            const hasSecureStorage: boolean = await EmberTokensManager.ncpUsesPSAKeyStorage(ezsp);

            logger.debug(`[TOKENS] Saving ${tokenCount} tokens, ${hasSecureStorage ? 'with' : 'without'} secure storage.`, NS);

            for (let i = 0; i < tokenCount; i++) {
                const [tiStatus, tokenInfo] = await ezsp.ezspGetTokenInfo(i);
                let writeOffset: number = 0;

                if (tiStatus === SLStatus.OK) {
                    const outputToken = Buffer.alloc(4 + 1 + 1 + tokenInfo.size * tokenInfo.arraySize);
                    outputToken.writeUInt32LE(tokenInfo.nvm3Key, writeOffset); // 4 bytes
                    writeOffset += 4;
                    outputToken.writeUInt8(tokenInfo.size, writeOffset++); // 1 byte
                    outputToken.writeUInt8(tokenInfo.arraySize, writeOffset++); // 1 byte

                    for (let arrayIndex = 0; arrayIndex < tokenInfo.arraySize; arrayIndex++) {
                        const [tdStatus, tokenData] = await ezsp.ezspGetTokenData(tokenInfo.nvm3Key, arrayIndex);

                        if (tdStatus === SLStatus.OK) {
                            if (hasSecureStorage) {
                                // Populate keys into tokenData because tokens do not contain them with secure key storage
                                await EmberTokensManager.saveKeysToData(ezsp, tokenData, tokenInfo.nvm3Key, arrayIndex);

                                // ensure the token data was retrieved properly, length should match the size announced by the token info
                                if (tokenData.data.length !== tokenInfo.size) {
                                    logger.error(
                                        `[TOKENS] Mismatch in token data size; got ${tokenData.data.length}, expected ${tokenInfo.size}.`,
                                        NS,
                                    );
                                }
                            }

                            // logger.debug(`[TOKENS] TOKEN nvm3Key=${DEBUG_TOKEN_STRINGS[tokenInfo.nvm3Key]} size=${tokenInfo.size} `
                            //     + `arraySize=${tokenInfo.arraySize} token=${tokenData.data.toString('hex')}`, NS);

                            // Check the Key to see if the token to save is restoredEui64, in that case
                            // check if it is blank, then save the node EUI64 in its place, else save the value
                            // received from the API. Once it saves, during restore process the set token will
                            // simply write the restoredEUI64 and the node will start to use that.
                            if (
                                tokenInfo.nvm3Key === NVM3KEY_STACK_RESTORED_EUI64 &&
                                tokenData.size === EUI64_SIZE &&
                                tokenData.data.equals(BLANK_EUI64_BUF)
                            ) {
                                // Special case : Save the node EUI64 on the restoredEui64 token while saving.
                                tokenData.data.set(localEui64);
                                logger.debug(`[TOKENS] Saved node EUI64 in place of blank RESTORED EUI64.`, NS);
                            }

                            outputToken.set(tokenData.data, writeOffset);
                            writeOffset += tokenData.size;
                        } else {
                            logger.error(`[TOKENS] Failed to get token data at index ${arrayIndex} with status=${SLStatus[tdStatus]}.`, NS);
                        }
                    }

                    chunks.push(outputToken);
                } else {
                    logger.error(`[TOKENS] Failed to get token info at index ${i} with status=${SLStatus[tiStatus]}.`, NS);
                }
            }

            return Buffer.concat(chunks);
        } else {
            // ezspGetTokenCount == 0 OR (ezspGetTokenInfo|ezspGetTokenData|ezspSetTokenData return LIBRARY_NOT_PRESENT)
            // ezspTokenFactoryReset will do nothing.
            logger.error(`[TOKENS] Saving tokens not supported by adapter (not NVM3-based).`, NS);
        }

        return undefined;
    }

    /**
     * Restores tokens. Only for NVM3-based NCP.
     * XXX: If a previous backup from an NVM3 NCP is attempted on a non-NVM3 NCP,
     *      it should just fail (LIBRARY_NOT_PRESENT all on token-related functions).
     *
     * @see EmberTokensManager.saveTokens() for format
     *
     * @return SLStatus status code
     */
    public static async restoreTokens(ezsp: Ezsp, inBuffer: Buffer): Promise<SLStatus> {
        if (!inBuffer?.length) {
            throw new Error(`[TOKENS] Restore tokens buffer empty.`);
        }

        logger.info(`[TOKENS] Restoring tokens...`, NS);

        let readOffset: number = 0;
        const inTokenCount = inBuffer.readUInt8(readOffset++);
        const hasSecureStorage: boolean = await EmberTokensManager.ncpUsesPSAKeyStorage(ezsp);

        logger.debug(`[TOKENS] Restoring ${inTokenCount} tokens, ${hasSecureStorage ? 'with' : 'without'} secure storage.`, NS);

        for (let i = 0; i < inTokenCount; i++) {
            const [tiStatus, tokenInfo] = await ezsp.ezspGetTokenInfo(i);

            if (tiStatus === SLStatus.OK) {
                const nvm3Key = inBuffer.readUInt32LE(readOffset); // 4 bytes Token Key/Creator
                readOffset += 4;
                const size = inBuffer.readUInt8(readOffset++); // 1 byte token size
                const arraySize = inBuffer.readUInt8(readOffset++); // 1 byte array size.

                for (let arrayIndex = 0; arrayIndex < arraySize; arrayIndex++) {
                    const tokenData: EmberTokenData = {
                        data: inBuffer.subarray(readOffset, readOffset + size),
                        size,
                    };

                    if (hasSecureStorage) {
                        // do not keep keys in classic key storage upon restoration
                        await EmberTokensManager.restoreKeysFromData(ezsp, tokenData, tokenInfo.nvm3Key, arrayIndex);
                    }

                    const status = await ezsp.ezspSetTokenData(nvm3Key, arrayIndex, tokenData);

                    if (status !== SLStatus.OK) {
                        logger.error(`[TOKENS] Failed to set token data for key "${nvm3Key}" with status=${SLStatus[status]}.`, NS);
                    }

                    readOffset += tokenData.size;
                }
            } else {
                logger.error(`[TOKENS] Failed to get token info at index ${i} with status=${SLStatus[tiStatus]}.`, NS);
            }
        }

        return SLStatus.OK;
    }

    /**
     * Secure key storage needs to export the keys first so backup file has them.
     *
     * @param tokenData EmberTokenData* [IN/OUT]
     * @param nvm3Key uint32_t
     * @param index uint8_t
     * @returns
     */
    public static async saveKeysToData(ezsp: Ezsp, tokenData: EmberTokenData, nvm3Key: number, index: number): Promise<SLStatus> {
        let status: SLStatus = SLStatus.OK;
        const context = initSecurityManagerContext();
        let plaintextKey: SecManKey;

        if (nvm3Key === NVM3KEY_STACK_KEYS) {
            // typedef struct {
            //     uint8_t networkKey[16]; // ignored if using Secure Key Storage (but moved to PSA and cleared if upgrade code is run)
            //     uint8_t activeKeySeqNum;
            // } tokTypeStackKeys;

            context.coreKeyType = SecManKeyType.NETWORK;
            context.keyIndex = 0;

            [status, plaintextKey] = await ezsp.ezspExportKey(context);

            tokenData.data.set(plaintextKey.contents, 0); // at beginning
        } else if (nvm3Key === NVM3KEY_STACK_ALTERNATE_KEY) {
            // typedef struct {
            //     uint8_t networkKey[16]; // ignored if using Secure Key Storage (but moved to PSA and cleared if upgrade code is run)
            //     uint8_t activeKeySeqNum;
            // } tokTypeStackKeys;

            context.coreKeyType = SecManKeyType.NETWORK;
            context.keyIndex = 1;

            [status, plaintextKey] = await ezsp.ezspExportKey(context);

            tokenData.data.set(plaintextKey.contents, 0); // at beginning
        } else if (nvm3Key === NVM3KEY_STACK_TRUST_CENTER) {
            // typedef struct {
            //     uint16_t mode;
            //     uint8_t eui64[8];
            //     uint8_t key[16];  // ignored if (mode & TRUST_CENTER_KEY_LIVES_IN_PSA)
            // } tokTypeStackTrustCenter;

            context.coreKeyType = SecManKeyType.TC_LINK;

            [status, plaintextKey] = await ezsp.ezspExportKey(context);

            tokenData.data.set(plaintextKey.contents, 2 + EUI64_SIZE); // uint16_t+uint8_t[8]
        } else if (nvm3Key === NVM3KEY_STACK_KEY_TABLE) {
            // typedef uint8_t tokTypeStackKeyTable[25];

            context.coreKeyType = SecManKeyType.APP_LINK;
            context.keyIndex = index;
            //this must be set to export a specific link key from table
            context.flags |= SecManFlag.KEY_INDEX_IS_VALID;

            [status, plaintextKey] = await ezsp.ezspExportKey(context);

            tokenData.data.set(plaintextKey.contents, KEY_ENTRY_KEY_DATA_OFFSET); // end part of uint8_t[25]
        } else if (nvm3Key === NVM3KEY_STACK_GP_PROXY_TABLE) {
            // typedef struct {
            //     uint8_t status;
            //     uint32_t options;
            //     //EmberGpAddress gpd;
            //     uint8_t gpAddress[8];
            //     uint8_t endpoint;
            //     //uint16_t assignedAlias;
            //     uint8_t securityOptions;
            //     uint8_t gpdKey[16]; // ignored if using Secure Key Storage (but moved to PSA and cleared if upgrade code is run)
            //     //EmberGpSinkListEntry sinkList[2];
            //     uint8_t sinkType[2];
            //     uint8_t sinkEUI[2][8];
            //     //uint16_t sinkNodeId[2];
            // } tokTypeStackGpProxyTableEntry;

            context.coreKeyType = SecManKeyType.GREEN_POWER_PROXY_TABLE_KEY;
            context.keyIndex = index;

            [status, plaintextKey] = await ezsp.ezspExportKey(context);

            tokenData.data.set(plaintextKey.contents, 1 + 4 + 8 + 1 + 1); // uint8_t+uint32_t+uint8_t[8]+uint8_t+uint8_t
        } else if (nvm3Key === NVM3KEY_STACK_GP_SINK_TABLE) {
            // typedef struct {
            //     uint8_t status;
            //     uint16_t options;
            //     //EmberGpAddress gpd;
            //     uint8_t gpAddress[8];
            //     uint8_t endpoint;
            //     uint8_t securityOptions;
            //     uint8_t gpdKey[16]; // ignored if using Secure Key Storage (but moved to PSA and cleared if upgrade code is run)
            //     uint8_t sinkType[2];
            //     uint16_t groupList[2][2];
            //     uint32_t securityFrameCounter; // This is no more used, Incoming FC for gpd in a separate Token to control its update.
            //     uint16_t assignedAlias;
            //     uint8_t deviceId;
            //     uint8_t groupcastRadius;
            // } tokTypeStackGpSinkTableEntry;

            context.coreKeyType = SecManKeyType.GREEN_POWER_SINK_TABLE_KEY;
            context.keyIndex = index;

            [status, plaintextKey] = await ezsp.ezspExportKey(context);

            tokenData.data.set(plaintextKey.contents, 1 + 2 + 8 + 1 + 1); // uint8_t+uint16_t+uint8_t[8]+uint8_t+uint8_t
        } else if (nvm3Key === NVM3KEY_STACK_ZLL_SECURITY) {
            // typedef struct {
            //     uint32_t bitmask;
            //     uint8_t keyIndex;
            //     uint8_t encryptionKey[EMBER_ENCRYPTION_KEY_SIZE];
            //     uint8_t preconfiguredKey[EMBER_ENCRYPTION_KEY_SIZE];
            // } EmberTokTypeStackZllSecurity;

            context.coreKeyType = SecManKeyType.ZLL_ENCRYPTION_KEY;

            [status, plaintextKey] = await ezsp.ezspExportKey(context);

            tokenData.data.set(plaintextKey.contents, 4 + 1); // uint32_t+uint8_t

            context.coreKeyType = SecManKeyType.ZLL_PRECONFIGURED_KEY;

            [status, plaintextKey] = await ezsp.ezspExportKey(context);

            tokenData.data.set(plaintextKey.contents, 4 + 1 + EMBER_ENCRYPTION_KEY_SIZE); // uint32_t+uint8_t+uint8_t[EMBER_ENCRYPTION_KEY_SIZE]
        } else {
            //nothing needs to be done for non-key tokens
        }

        return status;
    }

    /**
     *
     * @param data_s EmberTokenData*
     * @param nvm3Key uint32_t
     * @param index uint8_t
     * @returns
     *
     * @from sli_zigbee_af_trust_center_backup_restore_keys_from_data
     */
    public static async restoreKeysFromData(ezsp: Ezsp, tokenData: EmberTokenData, nvm3Key: number, index: number): Promise<SLStatus> {
        let status: SLStatus = SLStatus.OK;
        const context = initSecurityManagerContext();

        const plaintextKey: SecManKey = {contents: Buffer.alloc(0)};

        if (nvm3Key === NVM3KEY_STACK_KEYS) {
            // typedef struct {
            //     uint8_t networkKey[16]; // ignored if using Secure Key Storage (but moved to PSA and cleared if upgrade code is run)
            //     uint8_t activeKeySeqNum;
            // } tokTypeStackKeys;

            context.coreKeyType = SecManKeyType.NETWORK;
            context.keyIndex = 0;
            plaintextKey.contents = tokenData.data.subarray(0, EMBER_ENCRYPTION_KEY_SIZE); // at beginning

            status = await ezsp.ezspImportKey(context, plaintextKey);
        } else if (nvm3Key === NVM3KEY_STACK_ALTERNATE_KEY) {
            // typedef struct {
            //     uint8_t networkKey[16]; // ignored if using Secure Key Storage (but moved to PSA and cleared if upgrade code is run)
            //     uint8_t activeKeySeqNum;
            // } tokTypeStackKeys;

            context.coreKeyType = SecManKeyType.NETWORK;
            context.keyIndex = 1;
            plaintextKey.contents = tokenData.data.subarray(0, EMBER_ENCRYPTION_KEY_SIZE); // at beginning

            status = await ezsp.ezspImportKey(context, plaintextKey);
        } else if (nvm3Key === NVM3KEY_STACK_TRUST_CENTER) {
            // typedef struct {
            //     uint16_t mode;
            //     uint8_t eui64[8];
            //     uint8_t key[16];  // ignored if (mode & TRUST_CENTER_KEY_LIVES_IN_PSA)
            // } tokTypeStackTrustCenter;

            context.coreKeyType = SecManKeyType.TC_LINK;
            const s = 2 + EUI64_SIZE;
            plaintextKey.contents = tokenData.data.subarray(s, s + EMBER_ENCRYPTION_KEY_SIZE); // uint16_t+uint8_t[8]

            status = await ezsp.ezspImportKey(context, plaintextKey);
        } else if (nvm3Key === NVM3KEY_STACK_KEY_TABLE) {
            // typedef uint8_t tokTypeStackKeyTable[25];

            context.coreKeyType = SecManKeyType.APP_LINK;
            context.keyIndex = index;
            context.flags |= SecManFlag.KEY_INDEX_IS_VALID;
            plaintextKey.contents = tokenData.data.subarray(KEY_ENTRY_KEY_DATA_OFFSET, KEY_ENTRY_KEY_DATA_OFFSET + EMBER_ENCRYPTION_KEY_SIZE); // end part of uint8_t[25]

            status = await ezsp.ezspImportKey(context, plaintextKey);
        } else if (nvm3Key === NVM3KEY_STACK_GP_PROXY_TABLE) {
            // typedef struct {
            //     uint8_t status;
            //     uint32_t options;
            //     //EmberGpAddress gpd;
            //     uint8_t gpAddress[8];
            //     uint8_t endpoint;
            //     //uint16_t assignedAlias;
            //     uint8_t securityOptions;
            //     uint8_t gpdKey[16]; // ignored if using Secure Key Storage (but moved to PSA and cleared if upgrade code is run)
            //     //EmberGpSinkListEntry sinkList[2];
            //     uint8_t sinkType[2];
            //     uint8_t sinkEUI[2][8];
            //     //uint16_t sinkNodeId[2];
            // } tokTypeStackGpProxyTableEntry;

            context.coreKeyType = SecManKeyType.GREEN_POWER_PROXY_TABLE_KEY;
            context.keyIndex = index;
            const s = 1 + 4 + 8 + 1 + 1;
            plaintextKey.contents = tokenData.data.subarray(s, s + EMBER_ENCRYPTION_KEY_SIZE); // uint8_t+uint32_t+uint8_t[8]+uint8_t+uint8_t

            status = await ezsp.ezspImportKey(context, plaintextKey);
        } else if (nvm3Key === NVM3KEY_STACK_GP_SINK_TABLE) {
            // typedef struct {
            //     uint8_t status;
            //     uint16_t options;
            //     //EmberGpAddress gpd;
            //     uint8_t gpAddress[8];
            //     uint8_t endpoint;
            //     uint8_t securityOptions;
            //     uint8_t gpdKey[16]; // ignored if using Secure Key Storage (but moved to PSA and cleared if upgrade code is run)
            //     uint8_t sinkType[2];
            //     uint16_t groupList[2][2];
            //     uint32_t securityFrameCounter; // This is no more used, Incoming FC for gpd in a separate Token to control its update.
            //     uint16_t assignedAlias;
            //     uint8_t deviceId;
            //     uint8_t groupcastRadius;
            // } tokTypeStackGpSinkTableEntry;

            context.coreKeyType = SecManKeyType.GREEN_POWER_SINK_TABLE_KEY;
            context.keyIndex = index;
            const s = 1 + 2 + 8 + 1 + 1;
            plaintextKey.contents = tokenData.data.subarray(s, s + EMBER_ENCRYPTION_KEY_SIZE); // uint8_t+uint16_t+uint8_t[8]+uint8_t+uint8_t

            status = await ezsp.ezspImportKey(context, plaintextKey);
        } else if (nvm3Key === NVM3KEY_STACK_ZLL_SECURITY) {
            // typedef struct {
            //     uint32_t bitmask;
            //     uint8_t keyIndex;
            //     uint8_t encryptionKey[EMBER_ENCRYPTION_KEY_SIZE];
            //     uint8_t preconfiguredKey[EMBER_ENCRYPTION_KEY_SIZE];
            // } EmberTokTypeStackZllSecurity;

            context.coreKeyType = SecManKeyType.ZLL_ENCRYPTION_KEY;
            let s = 4 + 1;
            plaintextKey.contents = tokenData.data.subarray(s, s + EMBER_ENCRYPTION_KEY_SIZE); // uint32_t+uint8_t

            status = await ezsp.ezspImportKey(context, plaintextKey);

            context.coreKeyType = SecManKeyType.ZLL_PRECONFIGURED_KEY;
            s += EMBER_ENCRYPTION_KEY_SIZE; // after `encryptionKey`
            plaintextKey.contents = tokenData.data.subarray(s, s + EMBER_ENCRYPTION_KEY_SIZE); // uint32_t+uint8_t+uint8_t[EMBER_ENCRYPTION_KEY_SIZE]

            status = await ezsp.ezspImportKey(context, plaintextKey);
        } else {
            // unknown key
        }

        return status;
    }

    /**
     * Updates zigbeed tokens from a backup of NCP tokens.
     *
     * @return SLStatus status code
     */
    public static async writeNcpTokensToZigbeedTokens(ezsp: Ezsp, inBuffer: Buffer): Promise<SLStatus> {
        if (!inBuffer?.length) {
            throw new Error(`[TOKENS] Restore tokens buffer empty.`);
        }

        logger.info(`[TOKENS] Restoring tokens to Zigbeed...`, NS);

        let readOffset: number = 0;
        const inTokenCount = inBuffer.readUInt8(readOffset++);

        for (let i = 0; i < inTokenCount; i++) {
            const nvm3Key = inBuffer.readUInt32LE(readOffset); // 4 bytes Token Key/Creator
            readOffset += 4;
            const size = inBuffer.readUInt8(readOffset++); // 1 byte token size
            const arraySize = inBuffer.readUInt8(readOffset++); // 1 byte array size.

            for (let arrayIndex = 0; arrayIndex < arraySize; arrayIndex++) {
                const tokenData: EmberTokenData = {
                    data: inBuffer.subarray(readOffset, readOffset + size),
                    size,
                };

                const creator = EmberTokensManager.getCreatorFromNvm3Key(nvm3Key); // uint16_t
                const status = await ezsp.ezspSetTokenData(creator, arrayIndex, tokenData);

                if (status !== SLStatus.OK) {
                    logger.error(
                        `[TOKENS] Failed to set Zigbeed token data for key "${nvm3Key}" creator "${creator}" with status=${SLStatus[status]}.`,
                        NS,
                    );
                }

                readOffset += tokenData.size;
            }
        }

        return SLStatus.OK;
    }
}
