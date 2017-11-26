import { Road } from "./index";

interface AppState {
    isConnected?: boolean,
    disabled: boolean,
    drawing: boolean,
    stop: boolean,
    algorithm?: string,
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

export default AppState;