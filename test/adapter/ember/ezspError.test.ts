import {EzspError} from '../../../src/adapter/ember/ezspError';
import {EzspStatus} from '../../../src/adapter/ezsp/driver/types';

describe(`Ezsp Error`, () => {
    it(`Creates error`, () => {
        const error = new EzspError(EzspStatus.ASH_ACK_TIMEOUT);

        expect(error.message).toStrictEqual('ASH_ACK_TIMEOUT');
        expect(error.code).toStrictEqual(EzspStatus.ASH_ACK_TIMEOUT);
    });
});
