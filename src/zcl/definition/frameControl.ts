import Direction from './direction';
import FrameType from './frameType';

interface FrameControl {
    frameType: FrameType;
    manufacturerSpecific: boolean;
    direction: Direction;
    disableDefaultResponse: boolean;
}

export default FrameControl;