import * as React from 'react';
import './App.css';
import {Layer, Line, Stage} from 'react-konva';


class App extends React.Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>Mapgo</h2>
        </div>
        <div className="map">
          <Stage width={1200} height={1000}>
            <Layer>
              <Line points={[0, 23.51298, 250, 60, 300, 20]} stroke="green" strokeWidth={1}/>
            </Layer>
          </Stage>
        </div>
      </div>
    );
  }
}

export default App;
