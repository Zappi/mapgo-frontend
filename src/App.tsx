import * as React from 'react';
import './App.css';
import { Layer, Line, Stage } from 'react-konva';
import * as io from 'socket.io-client';
import { Road, MinMaxData, AppState, AppResetState } from './interface/index';

class App extends React.Component<object, AppState> {

  // Websocket
  private ws: any;

  // Canvas height
  private canvasHeight: number = 500;

  // Canvas width
  private canvasWidth: number = Math.floor(screen.width * 0.8);

  constructor(props: object) {
    super(props);
    // App state
    this.state = {
      isConnected: false,
      disabled: false,
      drawing: false,
      stop: false,
      algorithm: "DIJKSTRA",
      minX: 9999,
      maxX: -9999,
      minY: 9999,
      maxY: -9999,
      width: this.canvasWidth,
      height: this.canvasHeight,
      lines: [],
      roads: [],
      index: 0
    }

    // Start websocket
    this.ws = io('ws://localhost:8081');
  }

  /**
   * Initial state of the application.
   */
  getInitialState(): AppResetState {
    return {
      disabled: false,
      drawing: false,
      stop: false,
      minX: 9999,
      maxX: -9999,
      minY: 9999,
      maxY: -9999,
      width: this.canvasWidth,
      height: this.canvasHeight,
      lines: [],
      roads: [],
      index: 0,
    }
  }

  /**
   * Delay function.
   * @param ms Milliseconds
   */
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Converts x value.
   * @param x X coordinate
   */
  private convertX(x: number): number {
    return this.state.width * this.percentangeOf(x, this.state.minX, this.state.maxX);
  }

  /**
   * Converts y value.
   * @param y Y coordinate
   */
  private convertY(y: number): number {
    return this.state.height * this.percentangeOf(y, this.state.minY, this.state.maxY);
  }

  /**
   * Returns how much percentange a number is between [min, max]
   * @param num Number
   * @param min Lower bound
   * @param max Upper bound
   */
  private percentangeOf(num: number, min: number, max: number) {

    let p: number = ((num - min)) / (max - min);

    if (p > 1) {
      p = 1;
    } else if (p < 0) {
      p = 0;
    }

    return p;
  }

  /**
   * Renders the map.
   */
  async renderMap() {
    var roads: Road[] = this.state.roads.slice();
    this.setState({ drawing: true });
    // Sort the roads by road id
    roads.sort(this.roadSort);
    // Loop through roads and add a line per road
    for (let i = 0; i < roads.length; i++) {
      // If user requests to stop
      if (this.state.stop) {
        break;
      }
      let r: Road = roads[i];
      var lines: any = this.state.lines.slice();
      // Create a new line, converting x and y values.
      let line: any = <Line key={this.state.index} points={[this.convertX(r.e.x), this.convertY(r.e.y), this.convertX(r.s.x), this.convertY(r.s.y)]} stroke="white" strokeWidth={1} />;
      lines.push(line);
      this.setState({ lines, index: this.state.index + 1 });
      // Delay to stop UI freezing
      await this.delay(2);
    }
  }

  /**
   * Sorts the roads by id.
   * @param a Road a
   * @param b Road b
   */
  private roadSort(a: Road, b: Road): number {
    if (a.r < b.r) {
      return -1;
    }
    if (a.r > b.r) {
      return 1;
    }
    return 0;
  }

  componentDidMount() {

    // When we connect
    this.ws.on('connect', () => {
      this.setState({ isConnected: true });
    });

    // When back end sends minimum and maximum x and y
    this.ws.on('sending_min_max_x_y', (data: string) => {
      let parsedData: MinMaxData = JSON.parse(data);
      // Calculate min and max longitudes
      let minX = parsedData.minX;
      let maxY = parsedData.maxY;
      let minY = parsedData.minY;
      let maxX = parsedData.maxX;
      // console.log("minX: %d, maxX: %d, minY: %d, maxY: %d", minX, maxX, minY, maxY);
      this.setState({ minX, minY, maxX, maxY });
    });

    // When a step is sent
    this.ws.on('calculating_sending_step', async (data: string) => {
      let parsedData: any = JSON.parse(data);

      let coords: Road[] = parsedData.payload;
      // For each coordinate
      for (let i = 0; i < coords.length; i++) {
        this.setState({ roads: [...this.state.roads, coords[i]] });
        await this.delay(2);
      }
      this.setState({ disabled: false });
    });

    // When calculating starts
    this.ws.on('calculating_started', (data: string) => {
      console.log(data);
    });

    // When calculation finishes
    this.ws.on('calculating_finished', (data: string) => {
      console.log(data);
    });

    // On disconnection
    this.ws.on('disconnect', () => {
      this.setState({ isConnected: false });
    });

  }

  /**
   * Requests back end to start calculating the graph with a defined algorithm.
   */
  startAlgo = (algo: string) => {
    this.setState(this.getInitialState());
    this.setState({ disabled: true });
    var data = {
      "status": "START_CALC",
      "algo": algo
    };
    this.ws.emit("command", JSON.stringify(data));
  }

  /**
   * Algorithm dropdown change
   */
  change = (event: any) => {
    this.setState({ algorithm: event.target.value });
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h1>Mapgo</h1>
          <h3>{this.state.isConnected ? <span style={{ color: "green" }}>Connected to back-end</span> : <span style={{ color: "red" }}>Not connected to back-end</span>}</h3>
          <div className="algoSelection">
            <select onChange={this.change} value={this.state.algorithm} disabled={this.state.disabled}>
              <option value="DIJKSTRA">Dijkstra's algorithm</option>
              <option value="ASTAR">AStar algorithm</option>
            </select>
            <button onClick={() => this.startAlgo((this.state.algorithm == undefined) ? "DIJKSTRA" : this.state.algorithm)} disabled={this.state.disabled}>Load map</button>
          </div>
          <div className="executeBtns">
            {!this.state.drawing ? <button onClick={() => this.renderMap()} disabled={this.state.disabled}>Start simulation ({this.state.index} / {this.state.roads.length})</button> :
              <button style={{ backgroundColor: "red", color: "white" }} onClick={() => this.setState({ stop: true })}>Stop simulation ({this.state.index} / {this.state.roads.length})</button>}
          </div>
        </div>
        <div className="map">
          <Stage width={this.state.width} height={this.state.height}>
            <Layer>
              {this.state.lines.map((line: any) => line)}
            </Layer>
          </Stage>
        </div>
      </div>
    );
  }
}

export default App;
