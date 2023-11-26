import {FrameControl} from './definition';

interface ZclHeader {
    frameControl: FrameControl;
    manufacturerCode: number;
    transactionSequenceNumber: number;
    commandIdentifier: number;
}

export default ZclHeader;
