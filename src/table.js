import BTable from 'react-bootstrap/Table'
import {useTable} from 'react-table'

export function Table(props) {

    const game_data_columns = [ { Header: 'health', accessor: 'game.health', } ]
    let columns = [...props.columns, ...game_data_columns ]
    let stats = [...props.stats]
    for (var i=0; i < props.stats.length; i++) {
        const default_ = {health: NaN}
        stats[i].game = props.game_data[i] || default_
    }

    return <div><p>{JSON.stringify(stats)}</p><p>{JSON.stringify(columns)}</p></div>
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow
    } = useTable({columns: columns, data: stats})
   return (<div/>)

    console.log(stats)
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
