import BTable from 'react-bootstrap/Table'
import {useTable} from 'react-table'
import {useMemo} from 'react'

const game_data_columns = [
    { Header: 'Health', accessor: 'game.health', },
    { Header: 'Died at', accessor: 'game.died_at_string', },
    { Header: 'Rank', accessor: 'game.rank', },
    { Header: 'Damage Dealt', accessor: 'game.damage_dealt', },
]

export function Table(props) {
    let stats = [...props.stats]

    let columns = useMemo( () => {
        const columns_copy = [...props.columns] // this is needed to prevent a bug where columns vanish, needs further investigation as to why
        if (props.columns === undefined) return []
        return [columns_copy[0], ...game_data_columns, ...columns_copy.splice(1) ]
    }, [props.columns])

    let rank = _rank_duplicate(stats.map(x => x.game ? -x.game.died_at : 0))

    for (var i=0; i < props.stats.length; i++) {
        if(props.game_data[i] === undefined) continue
        stats[i].game = {...props.game_data[i]}
        if(stats[i].game.died_at !== null)
            stats[i].game.died_at_string = ((stats[i].game.died_at - props.start_time)/1000).toFixed(1) + 's'
        stats[i].game.rank = rank[i]
    }


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
    } = useTable({columns: columns, data: stats})

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


function _rank_duplicate(arr) {
    const sorted = [...new Set(arr)].sort((a: any, b: any) => b - a);
    const rank = new Map(sorted.map((x, i) => [x, i + 1]));
    return arr.map((x) => rank.get(x));
}