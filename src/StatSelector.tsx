import Select from 'react-select'
import Button from 'react-bootstrap/Button'
import { dfToNative } from './stats'
import { useRef, } from 'react'
import { Stats } from './App'
import { DataTable } from "./DataTable"

export default function StatSelector({all_stats, filtered_stats, set_filtered_stats,
        is_simulating, set_is_simulating}){
    let select : any = useRef()
    let players : any = useRef([])
    all_stats = dfToNative(all_stats)
    let teams = all_stats.map((x, idx) => ({value: idx, label: `${x.ano_campeonato}/${x.time}`}))
    function update(e){
        if(! (e instanceof Array) )
            e = []
        players.current = e.map(x => x.value)
        update_parent_state()
    }
    function update_parent_state() {
        if(players.current.length < 2) return
        let out: Stats = []
        for (let p of players.current)
            out.push(all_stats[p])
        set_filtered_stats(out)
    }
    function reset(){
        //s1.current.select.clearValue();
        //s2.current.select.clearValue();
        set_is_simulating(false)
    }
    function go() {
        update_parent_state()
        set_is_simulating(true)
    }
    let columns = filtered_stats ? Object.keys(filtered_stats[0]).map(c => ({Header: c, accessor: c})) : null
    return (
        <div className='container'>
        <div className='row'>
            <div className='col-4' style={{ maxWidth: "3000px" }}>
                <div> Player 1:
                    <Select ref={select} name="Player 1" isMulti isDisabled={is_simulating} onChange={update} options={teams} />
                </div>
                {is_simulating ? <Button onClick={reset}> RESET </Button> : null}
                {players.current.length >= 2 && !is_simulating ? <Button onClick={go}> Start Simulation </Button> : null}
            </div>
            <div className='col' style={{overflowY: 'scroll'}}>
                {   columns
                    ? <DataTable columns={columns} data={filtered_stats} />
                    : null
                }
            </div>
        </div>
        </div>
    )
}