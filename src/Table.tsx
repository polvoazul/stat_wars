import BTable from 'react-bootstrap/Table'
import {useTable} from 'react-table'
import {useMemo} from 'react'
import {Attributes} from './App'
import clone from 'just-clone'

const game_state_columns = [
    { Header: 'Health', accessor: 'game.health', },
    { Header: 'Died at', accessor: 'game.died_at_string', },
    { Header: 'Rank', accessor: 'game.rank', },
    { Header: 'Damage Dealt', accessor: 'game.damage_dealt', },
]
const attribute_labels = {
    max_health: 'Max Health',
    name: 'Player Name',
    damage_per_ball: 'Damage per Ball'
}

function mount_column(attribute, stat, multiplier ): {Header: string, accessor: string} {
    return {
        Header: `${attribute_labels[attribute]} = ${stat} ${multiplier ? ` x ` + multiplier : ''}`,
        accessor: attribute
    }
}
function mount_columns(attributes: Attributes, stats_to_attributes, multipliers) {
    return Object.entries(stats_to_attributes).map(([k, _]) => {
        return mount_column(k, stats_to_attributes[k], multipliers[k])
    })
}

export function Table({stats, attributes, stats_to_attributes, game_state,
        start_time, multipliers}) {
    let all_columns = useMemo( () => {
        const columns = mount_columns(attributes, stats_to_attributes, multipliers)
        return [columns[0], ...game_state_columns, ...columns.splice(1) ] // putting name first
    }, [attributes, multipliers, stats_to_attributes])

    let final_data = mount_final_data(game_state, attributes, start_time)

    //return <div><p>{JSON.stringify(stats)}</p><p>{JSON.stringify(columns)}</p></div>
    // return (<BTable>
    //         <thead>{JSON.stringify(stats)}
    //     <tr {...columns}/></thead></BTable>)

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow
    } = useTable({columns: all_columns, data: final_data})

   return (
     <BTable {...getTableProps()} striped bordered hover >
       <thead>
         {headerGroups.map(headerGroup => (
           <tr {...headerGroup.getHeaderGroupProps()}>
             {headerGroup.headers.map(column => (
               <th {...column.getHeaderProps()} >
                 {column.render('Header')}
               </th>
             ))}
           </tr>
         ))}
       </thead>
       <tbody {...getTableBodyProps()}>
         {rows.map(row => {
           prepareRow(row)
           return (
             <tr {...row.getRowProps()}>
               {row.cells.map(cell => {
                 return (
                   <td
                     {...cell.getCellProps()}
                   >
                     {cell.render('Cell')}
                   </td>
                 )
               })}
             </tr>
           )
         })}
       </tbody>
     </BTable>
   )
}

function mount_final_data(game_state, attributes, start_time){
    if(game_state === null) {// game hasn't started
        return attributes
    }

    let rank = _rank_duplicate(game_state.map((x: { died_at: number } ) => x.died_at !== null ? -x.died_at : 0))

    let final_data = clone(attributes)
    for (var i=0; i < final_data.length; i++) {
        final_data[i].game = {...game_state[i]}
        if(final_data[i].game.died_at !== null)
            final_data[i].game.died_at_string = ((final_data[i].game.died_at - start_time)/1000).toFixed(1) + 's'
        if(rank !== null)
            final_data[i].game.rank = rank[i]
    }
    return final_data

}


function _rank_duplicate(arr: number[]) {
    const sorted = [...new Set(arr)].sort((a: number, b: number) => b - a);
    const rank = new Map(sorted.map((x, i) => [x, i + 1]));
    return arr.map((x) => rank.get(x) as number);
}