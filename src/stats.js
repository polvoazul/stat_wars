import * as dfd from "danfojs/src/index"
window.dfd = dfd

function find_multiplier(mean, target){
    let multiplier = 10**Math.round(Math.log10(target / mean))
    console.log([mean, target, multiplier] )
    return multiplier
}

export function transform_stats_in_game_init_data(stats) {
    // @ts-ignore
    let df = new dfd.DataFrame(stats)
    window.df = df
    let out : any = {
        max_health: df.goals.mul(find_multiplier(df.goals.mean(), 100)).values,
        name: df.name.values
    }
    out = (new dfd.DataFrame(out))
    let columns = out.columns
    out = out.values //array of arrays
    out = out.map(row => zip_key_vals(columns, row))
    console.log(out)
    return out
}

function zip_key_vals(keys, vals) {
  var rv = {};
  for (var i = 0; i < keys.length; ++i)
    rv[keys[i]] = vals[i];
  return rv;
}