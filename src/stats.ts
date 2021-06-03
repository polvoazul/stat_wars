import * as dfd from "danfojs/src/index"
// @ts-ignore
window.dfd = dfd

class Normalizer {
    multipliers : {[key: string]: number} = {}
    normalize_stat(col, target) {
        let mean = col.mean()
        let multiplier = 10 ** Math.round(Math.log10(target / mean))
        this.multipliers[col.name] = multiplier
        return col.mul(multiplier)
    }
}

export function transform_stats_in_attributes(stats : Object[], stats_to_attributes: Object) {
    let attributes : Object[] = []
    for (let player of stats){
        let converted_player = {}
        for (let to in stats_to_attributes){
            let from = stats_to_attributes[to]
            converted_player[to] = player[from]
        }
        attributes.push(converted_player)
    }
    return normalize(attributes)
}
function normalize(attributes){
    let normalizer = new Normalizer()
    let df = new dfd.DataFrame(attributes)
    // @ts-ignore
    window.df = df
    let out
    out = {
        max_health: normalizer.normalize_stat(df.max_health, 100),
        name: df.name
    }
    for(let k in out) {out[k] = out[k].values}
    out = (new dfd.DataFrame(out))
    let columns = out.columns
    out = out.values //array of arrays
    out = out.map(row => zip_key_vals(columns, row))
    return [out as Object[] , normalizer.multipliers]
}

function zip_key_vals(keys, vals) {
  var rv = {};
  for (var i = 0; i < keys.length; ++i)
    rv[keys[i]] = vals[i];
  return rv;
}