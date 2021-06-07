import Select from 'react-select'
import Button from 'react-bootstrap/Button'
import {dfToNative} from './stats'
import { useRef } from 'react'
import { Stats } from './App'

export default function StatSelector({all_stats, filtered_stats, set_filtered_stats}){
    let p1 : any = useRef(null)
    let p2 : any = useRef(null)
    const players_selected = Boolean(filtered_stats)
    all_stats = dfToNative(all_stats)
    let teams = all_stats.map((x, idx) => ({value: idx, label: `${x.ano_campeonato}/${x.time}`}))
    function update(p){
        return (e) => {
            p.current = e?.value
            update_parent_state()
    }}
    function update_parent_state() {
        if(!(p1.current && p2.current)) return
        let out: Stats = []
        out.push(all_stats[p1.current])
        out.push(all_stats[p2.current])
        set_filtered_stats(out)
    }
    let s1 :any = useRef(), s2 :any = useRef()
    function reset(){
        s1.current.select.clearValue();
        s2.current.select.clearValue();
        set_filtered_stats(null)
    }
    return (
        <div className='container'>
        <div className='row'>
            <div className='col-4' style={{ maxWidth: "3000px" }}>
                <div> Player 1:
            <Select ref={s1} name="Player 1" isDisabled={players_selected} onChange={update(p1)} options={teams} />
                </div>
                <div> Player 2:
            <Select ref={s2} name="Player 2" isDisabled={players_selected} onChange={update(p2)} options={teams} />
                </div>
                {players_selected ? <Button onClick={reset}> RESET </Button> : null}
            </div>
            <div className='col'>
                INFO
            </div>
        </div>
        </div>
    )
}