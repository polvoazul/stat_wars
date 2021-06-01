import './App.css';
import * as env from './env.js'
import {useEffect} from 'react'

function App() {

  useEffect(() => {
      env.restart()
  })


  return (
    <div className="App">
        <button onClick={window.restart}> RESTART </button>
        <div id="info"></div>
        <div id='canvas'> </div>
    </div>
  );
}

export default App;
