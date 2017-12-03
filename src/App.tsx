import * as React from 'react';
import './App.css';
import { Layer, Line, Stage } from 'react-konva';
import * as io from 'socket.io-client';
import { Road, MinMaxData, AppState, AppResetState, CommandData, AppConfig, AvailableAlgo } from './interface/index';
import Modal from './Modal';

let config: AppConfig;

if (process.env.NODE_ENV == "production") {
  config = require('./config/config.production.json');
} else if (process.env.NODE_ENV == "development") {
  config = require('./config/config.development.json');
} else {
  throw "NODE_ENV is not set";
}

class App extends React.Component<object, AppState> {

  // Websocket
  private ws: any;

  // Canvas height
  private canvasHeight: number = 600;

  // Canvas width
  private canvasWidth: number = Math.floor(screen.width * 0.8);

  // Algorithm step size
  private stepSize: number = config.stepSize;

  constructor(props: object) {
    super(props);
    // App state
    this.state = {
      isConnected: false,
      disabled: false,
      drawing: false,
      receivingSteps: false,
      availableAlgos: [],
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
      roadCount: 0,
      index: 0
    }

    // Start websocket
    this.ws = io(config.wsUrl);
  }

  /**
   * Initial state of the application.
   */
  getInitialState(): AppResetState {
    return {
      disabled: false,
      drawing: false,
      receivingSteps: false,
      stop: false,
      minX: 9999,
      maxX: -9999,
      minY: 9999,
      maxY: -9999,
      width: this.canvasWidth,
      height: this.canvasHeight,
      lines: [],
      roads: [],
      roadCount: 0,
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
    this.setState({ drawing: true });
    var roads: Road[] = this.state.roads.slice();
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
      let line: any = <Line key={this.state.index} points={[this.convertX(r.e.x), this.convertY(r.e.y), this.convertX(r.s.x), this.convertY(r.s.y)]} stroke="red" strokeWidth={1} />;
      lines.push(line);
      this.setState({ lines, index: this.state.index + 1 });
      // Delay to stop UI freezing
      await this.delay(2);
    }

    this.setState({ disabled: false });
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
      let roadCount = parsedData.roadCount;
      console.log("minX: %d, maxX: %d, minY: %d, maxY: %d, roadCount: %d", minX, maxX, minY, maxY, roadCount);
      this.setState({ minX, minY, maxX, maxY, roadCount });
    });

    // When a step is sent
    this.ws.on('calculating_sending_step', async (data: string) => {
      this.setState({ receivingSteps: true });
      let parsedData: any = JSON.parse(data);

      let tmpRoads: Road[] = parsedData.payload;

      // For each coordinate
      for (let i = 0; i < tmpRoads.length; i++) {
        this.setState({ roads: [...this.state.roads, tmpRoads[i]] });
        await this.delay(2);
      }
      //If we have received all roads, start drawing
      //console.log("roads: %d, total roads: %d", this.state.roadCount, this.state.roads.length);
      if (this.state.roadCount > 0 && this.state.roads.length == this.state.roadCount && !this.state.drawing) {
        this.setState({ receivingSteps: false });
        this.renderMap();
      }
    });

    // this.renderMap();

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

    // On algo list
    this.ws.on('algorithmList', (data: string) => {
      console.log(data);
      let parsedData: any = JSON.parse(data);
      let algoList: AvailableAlgo[] = parsedData.payload;
      this.setState({ availableAlgos: algoList });
    });
  }

  /**
   * Requests back end to start calculating the graph with a defined algorithm.
   */
  startAlgo = (algo: string) => {
    this.setState(this.getInitialState());
    this.setState({ disabled: true });
    var data: CommandData = {
      status: "START_CALC",
      algo: algo,
      stepSize: this.stepSize
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
          <div className="App-header-wrapper">
            <div className="App-title-desc">
              <div className="App-title">
                Map<span className="go">go</span>
              </div>
              <div className="App-description">
                Draw maps using graph algorithms
            </div>
            </div>
            <div className="App-algo-exc">
              <div className="algoSelection">
                <select onChange={this.change} value={this.state.algorithm} disabled={!this.state.isConnected || this.state.disabled}>
                  {this.state.availableAlgos.map((algo: AvailableAlgo) => <option value={algo.command}>{algo.displayName}</option>)}
                </select>
                <button className="btn btn-primary" onClick={() => this.startAlgo((this.state.algorithm == undefined) ? "DIJKSTRA" : this.state.algorithm)} disabled={!this.state.isConnected || this.state.disabled}>Draw map</button>
              </div>
            </div>
          </div>
        </div>
        {!this.state.isConnected ? <Modal>Connecting to server</Modal> : null}
        {this.state.isConnected && this.state.receivingSteps ? <Modal>Receiving graph data from server
          <progress className="prgress" max="100" value={((this.state.roads.length / this.state.roadCount) * 100).toFixed(0)} />
        </Modal> : null}
        <div className="map">
          <Stage width={this.state.width} height={this.state.height}>
            <Layer>
              {this.state.lines.map((line: any) => line)}
            </Layer>
          </Stage>
        </div>
        <div className="footer">
          Copyright &copy; 2017 <a href="https://github.com/alehuo" target="_blank">alehuo</a>. Mapgo is a course project on the university course Intermediate course studies: Data structures and algorithms.
        </div>
      </div>
    );
  }
}

export default App;
