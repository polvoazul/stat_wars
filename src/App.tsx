import './App.css';
import * as Env from './env'
import React, {useEffect} from 'react'
import {useState} from 'react'
import {Table} from './Table'

import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button'

import {transform_stats_in_attributes} from "./stats"

import { BrowserRouter as Router, Route, } from "react-router-dom";

import Debugger from "./Debugger"


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

const stats: Stats = [
    { team: 'Vasco', goals: 52, victories: 22 },
    { team: 'Botafogo', goals: 65, victories: 22},
]
 
const stats_to_attributes = {
    name: 'team',
    max_health: 'goals',
    damage_per_ball: 'victories'
}


const [attributes, multipliers]: [Attributes, {[key: string]: number}] = transform_stats_in_attributes(stats, stats_to_attributes)

function App() {
    let [game_state, set_game_state] = useState(null);
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
        <Router>
            <Route path="/debug">
                <Debugger/>
            </Route>
            <Route path="/">
            <div className="App">
                <Button onClick={restart}> RESTART </Button>
                <Table stats={stats} attributes={attributes} 
                        stats_to_attributes={stats_to_attributes}
                        game_state={game_state} start_time={start_time}
                        multipliers={multipliers} 
                />
            </div>
            </Route>
        </Router>
    );
}

export default App;