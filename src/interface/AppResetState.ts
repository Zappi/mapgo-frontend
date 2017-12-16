import { Road } from './index';

interface AppResetState {
    disabled: boolean;
    drawing: boolean;
    stop: boolean;
    receivingSteps: boolean;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    startingX: number;
    startingY: number;
    endingX: number;
    endingY: number;
    startingPoint: any;
    endingPoint: any;
    width: number;
    height: number;
    lines: any[];
    roads: Road[];
    roadCount: number;
    index: number;
}

export default AppResetState;