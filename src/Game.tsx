import React, { useEffect, useMemo, useRef } from 'react';
import { useState } from 'react';
import { Table } from './Table';
import Button from 'react-bootstrap/Button';
import { transform_stats_in_attributes } from "./stats";
import { Attributes, stats_to_attributes, } from './App';
import * as Env from './env'

declare global { interface Window {
    env: Env.Env
} }

export function Game({ stats, }) {
    const [attributes, multipliers]: [Attributes, { [key: string]: number; }] = useMemo(
        () => transform_stats_in_attributes(stats, stats_to_attributes), [stats]);
    let [game_state, set_game_state] = useState(null);
    let [start_time, set_start_time] = useState(new Date());
    let canvas = useRef<any>();


    function restart_sim() {
        rebuild_canvas(canvas, attributes, set_game_state);
        set_start_time(new Date());
    }

    useEffect(() => {
        rebuild_canvas(canvas, attributes, set_game_state);
        return () => window.env.destroy();
    }, [attributes]);

    return (<div className="container">
        <div style={{ overflowY: 'scroll' }}>
            <Table stats={stats} attributes={attributes}
                stats_to_attributes={stats_to_attributes}
                game_state={game_state} start_time={start_time}
                multipliers={multipliers} />
        </div>
        <Button onClick={restart_sim}> Restart Simulation </Button>
        <div className="mt-1"></div>
        <div id="canvas" ref={canvas}></div>
    </div>);
}

function rebuild_canvas(canvas, attributes, set_game_state) {
    if (canvas.current === undefined) return
    window.env?.destroy()
    window.env = new Env.Env(set_game_state, )
    canvas.current.innerHTML = ""
    window.env.setup("canvas", attributes);
    console.log('rebuilding canvas')
}