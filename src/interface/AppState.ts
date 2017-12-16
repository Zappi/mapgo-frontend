import { Road, AvailableAlgo } from './index';

interface AppState {
    isConnected?: boolean;
    disabled: boolean;
    drawing: boolean;
    stop: boolean;
    receivingSteps: boolean;
    algorithm?: string;
    availableAlgos: AvailableAlgo[];
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

export default AppState;