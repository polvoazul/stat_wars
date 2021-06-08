import './App.css';
import * as Env from './env'
import React, {useEffect, useMemo, useRef} from 'react'
import {useState} from 'react'
import {Table} from './Table'

import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button'

import {transform_stats_in_attributes} from "./stats"

import { BrowserRouter as Router, Route, } from "react-router-dom";

import Debugger from "./Debugger"

import stats_with_metadata from './StatLoader'
import StatSelector from './StatSelector'


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





const stats_to_attributes = {
    name: 'time',
    max_health: 'defesas_total',
    balls_per_second: 'gols_total',
    damage_per_ball: 'vitorias_total'
}

export const attribute_labels = {
    name: 'Player Name',
    max_health: 'Max Health',
    balls_per_second: 'Balls per Second',
    damage_per_ball: 'Damage per Ball'
}

let all_stats : Stats = stats_with_metadata.data

function App() {
    let [filtered_stats, set_filtered_stats] = useState(null);
    let [is_simulating, set_is_simulating] = useState(false);
    return (
        <Router>
            <Route path="*#debug">
                <Debugger env={window.env}/>
            </Route>
            <Route path="/">
            <div className="App">
                <StatSelector {...{is_simulating}} filtered_stats={filtered_stats} all_stats={all_stats}
                        set_filtered_stats={set_filtered_stats} set_is_simulating={set_is_simulating}/>
                { is_simulating ? 
                    (filtered_stats ? 
                        <Game stats={filtered_stats}/>
                    :
                        'No data to sim'
                    )
                  : null
                }
            </div>
            </Route>
        </Router>
    )
}

declare global { interface Window {
    env: Env.Env
} }

function rebuild_canvas(canvas, attributes, set_game_state) {
    if (canvas.current === undefined) return
    window.env?.destroy()
    window.env = new Env.Env(set_game_state, )
    canvas.current.innerHTML = ""
    window.env.setup("canvas", attributes);
    console.log('rebuilding canvas')
}

function Game({stats, }) {
    const [attributes, multipliers]: [Attributes, {[key: string]: number}] = useMemo(
         ()=>transform_stats_in_attributes(stats, stats_to_attributes), [stats])
    let [game_state, set_game_state] = useState(null);
    let [start_time, set_start_time] = useState(new Date());
    let canvas = useRef<any>()


    function restart_sim() {
        rebuild_canvas(canvas, attributes, set_game_state)
        set_start_time(new Date())
    }

    useEffect(() => {
        rebuild_canvas(canvas, attributes, set_game_state)
        return window.env.destroy
    }, [attributes])

    return (<div className="container">
        <div style={{overflowY: 'scroll'}}>
            <Table stats={stats} attributes={attributes} 
                    stats_to_attributes={stats_to_attributes}
                    game_state={game_state} start_time={start_time}
                    multipliers={multipliers} 
            />
        </div>
        <Button onClick={restart_sim}> Restart Simulation </Button>
        <div className="mt-1"></div>
        <div id="canvas" ref={canvas}></div>
    </div>)
}


export default App;