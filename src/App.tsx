import './App.css';
import * as Env from './env'
import React, {useEffect} from 'react'
import {useState} from 'react'
import {Table} from './Table'

import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button'

import {transform_stats_in_game_init_data} from "./stats"


declare global { interface Window {
    env: Env.Env
} }

window.env = new Env.Env()

const stats = [ { name: 'Vasco', goals: 2 }, { name: 'Botafogo', goals: 5 }, ]
const columns = [
    { Header: 'Nome | Player', accessor: 'name', },
    { Header: 'Gols | Max Health', accessor: 'goals', },
]


const game_init_data : Array<Object> = transform_stats_in_game_init_data(stats)

function App() {
    let [game_data, set_game_data_state] = useState([]);
    let [start_time, set_start_time] = useState(new Date());
    window.env.game_data_callback = set_game_data_state


    function restart() {
        window.env = new Env.Env(set_game_data_state)
        window.document.getElementById("canvas")!.innerHTML = ""
        window.env.setup("canvas", game_init_data);
        set_start_time(new Date())
    }

    useEffect(() => {
        window.document.getElementById("canvas")!.innerHTML = ""
        window.env.setup("canvas", game_init_data);
    }, [])


    return (
        <div className="App">
            <Button onClick={restart}> RESTART </Button>
            <Table stats={stats} columns={columns} game_data={game_data} start_time={start_time}/>
        </div>
    );
}

export default App;
