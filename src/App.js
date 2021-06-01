import './App.css';
import * as Env from './env.js'
import {React, useEffect} from 'react'
import {useState} from 'react'
import {Table} from './table.js'

import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button'


let env = new Env.Env()

const stats = [ { name: 'Team1', goals: 2 }, { name: 'Team2', goals: 5 }, ]
const columns = [ { Header: 'Nome | Player', accessor: 'name', }, { Header: 'Gols | Max Health', accessor: 'goals', }, ]

const game_init_data = stats

function App() {
    let [game_data, set_game_data_state] = useState([]);
    env.game_data_callback = set_game_data_state


    function restart() {
        env = new Env.Env(set_game_data_state)
        window.document.getElementById("canvas").innerHTML = ""
        env.setup("canvas", game_init_data);
    }

    useEffect(() => {
        window.document.getElementById("canvas").innerHTML = ""
        env.setup("canvas", game_init_data);
    }, [])


    return (
        <div className="App">
            <Button onClick={restart}> RESTART </Button>
            <Table stats={stats} columns={columns} game_data={game_data}/>
        </div>
    );
}

export default App;
