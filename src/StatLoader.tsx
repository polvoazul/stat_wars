// import {Stats} from './App'
import * as dfd from "danfojs/src/index"

function obj_map(obj, fun) {
    return Object.fromEntries(Object.entries(obj).map(fun))
}

let json = require("./brasileirao_stats.json");
let columns = Object.fromEntries(Object.keys(json[0]).map(k => {
    let name, params
    [name, ...params] = k.split('|')
    let out = {name: name}
    params = Object.fromEntries(params.map(x=>x.split('=')))
    if(params.bigger_is_better !== undefined)
        params.bigger_is_better = JSON.parse(params.bigger_is_better)
    return [k, {...out, ...params}]
})
)

let data = json.map(player => obj_map(player, ([k, v]) => [columns[k].name, v]))
data = new dfd.DataFrame(data)

var stats_with_metadata = {data: data, columns: columns}
// var stats: Stats = [
//     { team: 'Vasco', goals: 52, victories: 22 },
//     { team: 'Botafogo', goals: 65, victories: 22},
// ]

export default stats_with_metadata