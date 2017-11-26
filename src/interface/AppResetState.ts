import { Road } from "./index";

interface AppResetState {
    disabled: boolean,
    drawing: boolean,
    stop: boolean,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    width: number,
    height: number,
    lines: any[],
    roads: Road[],
    index: number
}

export default AppResetState;