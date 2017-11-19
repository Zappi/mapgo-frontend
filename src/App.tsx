import * as React from 'react';
import './App.css';
import { Layer, Line, Stage } from 'react-konva';
import * as io from 'socket.io-client';

class App extends React.Component<any, any> {

  private ws: any;

  constructor(props: any) {
    super(props);
    this.state = {
      isConnected: false
    }

    this.ws = io('ws://localhost:8081');
  }

  componentDidMount() {
    this.ws.on('connect', () => {
      this.setState({isConnected: true});
    });
    this.ws.on('event', (data: any) => {
      console.log(data);
    });
    this.ws.on('disconnect', () => {
      this.setState({isConnected: false});
    });
  }

  startAlgo = () => {
    alert("Starting algo");
    var data = {
      "status": "START_CALC",
      "algo": "DIJKSTRA"
    };
    this.ws.emit("command", JSON.stringify(data));
  }
  
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>Mapgo</h2>
          <h3>{this.state.isConnected ? <span style={{color: "green"}}>Connected</span> : <span style={{color: "red"}}>Disconnected</span>}</h3>
          <button onClick={this.startAlgo}>Dijkstra test</button>
        </div>
        <div className="map">
          <Stage width={1200} height={1000}>
            <Layer>
              <Line points={[0, 23.51298, 250, 60, 300, 20]} stroke="green" strokeWidth={1} />
            </Layer>
          </Stage>
        </div>
      </div>
    );
  }
}

export default App;
