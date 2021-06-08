import * as dfd from "danfojs/src/index"
import {Attributes} from './App'

export class Normalizer {
    multipliers : {[key: string]: number} = {}
    normalize_stat(col: dfd.Series, target) : dfd.Series {
        let mean = col.mean()
        let multiplier = 10 ** Math.round(Math.log10(target / mean))
        let adjusts = [0.2, 0.5, 1, 2, 5]
        let errors = adjusts.map( (adjust) => 
            Math.abs(target - (mean * multiplier * adjust))) // to think: treat errors in log?
        //if(target === 33) { debugger}
        multiplier *= adjusts[argMin(errors)]
        this.multipliers[col.column_names] = multiplier
        const n_decimals = 2 - Math.floor(Math.log10(target)) + 1 //TODO: test this better 
        return col.mul(multiplier).round(n_decimals)
    }
}

export function transform_stats_in_attributes(stats : Object[], stats_to_attributes: Object) : [Attributes, {[key: string]: number}] {
    let attributes : Object[] = []
    for (let player of stats){
        let converted_player = {}
        for (let to in stats_to_attributes){
            let from = stats_to_attributes[to]
            if(player[from] === undefined) throw new Error(`${from} not found in stats: ${JSON.stringify(player)}`);
            
            converted_player[to] = player[from]
        }
        attributes.push(converted_player)
    }
    return normalize(attributes)
}
function normalize(attributes) : [Attributes, {[key: string]: number}] {
    let normalizer = new Normalizer()
    let df = new dfd.DataFrame(attributes)
    // @ts-ignore
    window.df = df
    let out
    out = {
        damage_per_ball: normalizer.normalize_stat(df.damage_per_ball, 20)
        ,max_health: normalizer.normalize_stat(df.max_health, 100)
        ,balls_per_second: normalizer.normalize_stat(df.balls_per_second, 1)
        ,name: df.name
    }
    for(let k in out) {out[k] = out[k].values}
    out = (new dfd.DataFrame(out))
    let columns = out.columns
    out = out.values //array of arrays
    out = out.map(row => zip_key_vals(columns, row))
    return [out as Attributes, normalizer.multipliers]
}

export function dfToNative(df){
    return df.values.map(row => zip_key_vals(df.columns, row))
}

function zip_key_vals(keys, vals) {
  var rv = {};
  for (var i = 0; i < keys.length; ++i)
    rv[keys[i]] = vals[i];
  return rv;
}




const argFact = (compareFn) => (array) => array.map((el, idx) => [el, idx]).reduce(compareFn)[1]
//const argMax = argFact((min, el) => (el[0] > min[0] ? el : min))
const argMin = argFact((max, el) => (el[0] < max[0] ? el : max))