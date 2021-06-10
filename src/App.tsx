import './App.css';
import React from 'react'
import {useState} from 'react'

import 'bootstrap/dist/css/bootstrap.min.css';


import { BrowserRouter as Router, Route, } from "react-router-dom";

import Debugger from "./Debugger"

import stats_with_metadata from './StatLoader'
import StatSelector from './StatSelector'
import { Game } from './Game';


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

export const stats_to_attributes = {
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



export default App;