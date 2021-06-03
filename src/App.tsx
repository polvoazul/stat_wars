import './App.css';
import * as Env from './env'
import React, {useEffect} from 'react'
import {useState} from 'react'
import {Table} from './Table'

import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button'

import {transform_stats_in_attributes} from "./stats"

/*
* stats: real life stats
* attributes: game initial attributes 
* game_state: game current state
*/
type _StringKeyObject = {[key: string]: any}
type Stat = _StringKeyObject
export type Stats = Stat[]
export type Attributes = _StringKeyObject[]
// type GameState = _StringKeyObject


declare global { interface Window {
    env: Env.Env
} }

window.env = new Env.Env()

const stats: Stats = [ { team: 'Vasco', goals: 2 }, { team: 'Botafogo', goals: 5 }, ]
 
const stats_to_attributes = {
    name: 'team',
    max_health: 'goals'
}


const [attributes, multipliers]: [Attributes, {[key: string]: number}] = transform_stats_in_attributes(stats, stats_to_attributes)

function App() {
    let [game_state, set_game_state] = useState([]);
    let [start_time, set_start_time] = useState(new Date());
    window.env.game_state_callback = set_game_state


    function restart() {
        window.env = new Env.Env(set_game_state)
        window.document.getElementById("canvas")!.innerHTML = ""
        window.env.setup("canvas", attributes);
        set_start_time(new Date())
    }

    useEffect(() => {
        window.document.getElementById("canvas")!.innerHTML = ""
        window.env.setup("canvas", attributes);
    }, [])


    return (
        <div className="App">
            <Button onClick={restart}> RESTART </Button>
            <Table stats={stats} attributes={attributes} 
                    stats_to_attributes={stats_to_attributes}
                    game_state={game_state} start_time={start_time}
                    multipliers={multipliers} 
            />
        </div>
    );
}

export default App;