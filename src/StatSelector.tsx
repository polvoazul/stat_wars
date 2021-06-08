import Select from 'react-select'
import Button from 'react-bootstrap/Button'
import {dfToNative} from './stats'
import { useRef, useState } from 'react'
import { Stats } from './App'
import { MyTable } from './Table'

export default function StatSelector({all_stats, filtered_stats, set_filtered_stats,
        is_simulating, set_is_simulating}){
    let s1 : any = useRef(), s2 : any = useRef()
    let p1 : any = useRef(null)
    let p2 : any = useRef(null)
    const [players_selected, set_players_selected] = useState(false)
    all_stats = dfToNative(all_stats)
    let teams = all_stats.map((x, idx) => ({value: idx, label: `${x.ano_campeonato}/${x.time}`}))
    function update(p){
        return (e) => {
            p.current = e?.value
            update_parent_state()
    }}
    function update_parent_state() {
        set_players_selected(p1.current !== null && p2.current !== null)
        if(!(p1.current && p2.current)) return
        let out: Stats = []
        out.push(all_stats[p1.current])
        out.push(all_stats[p2.current])
        set_filtered_stats(out)
    }
    function reset(){
        //s1.current.select.clearValue();
        //s2.current.select.clearValue();
        set_filtered_stats(null)
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
            <Select ref={s1} name="Player 1" isDisabled={is_simulating} onChange={update(p1)} options={teams} />
                </div>
                <div> Player 2:
            <Select ref={s2} name="Player 2" isDisabled={is_simulating} onChange={update(p2)} options={teams} />
                </div>
                {players_selected && is_simulating ? <Button onClick={reset}> RESET </Button> : null}
                {players_selected && !is_simulating ? <Button onClick={go}> Start Simulation </Button> : null}
            </div>
            <div className='col' style={{overflowY: 'scroll'}}>
                {   columns
                    ? <MyTable columns={columns} data={filtered_stats} />
                    : null
                }
            </div>
        </div>
        </div>
    )
}