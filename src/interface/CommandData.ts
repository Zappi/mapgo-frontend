interface CommandData {
    status: string;
    algo: string;
    stepSize: number;
    startingNode: number;
    endingNode?: number;
}

export default CommandData;