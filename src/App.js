import './App.css';
import * as env from './env.js'
import {React, useEffect, useMemo} from 'react'
import {Table} from './table.js'

import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button'

function App() {

  useEffect(() => {
      env.restart()
  })


  return (
    <div className="App">
        <Button onClick={window.restart}> RESTART </Button>
        <Info/>
        <div id='canvas'> </div>
    </div>
  );
}


function Info() {
    const stats = useMemo(() => [
        {
            name: 'Team1',
            goals: 2
        },
        {
            name: 'Team2',
            goals: 5
        },
    ], [])
    const columns = useMemo(() => [
        {
            Header: 'Nome | Player',
            accessor: 'name', // accessor is the "key" in the data
        }, {
            Header: 'Gols | Max Health',
            accessor: 'goals',
        },
    ], [])
    return ( <Table data={stats} columns={columns}/>
        /*
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Username</th>
          </tr>
        </thead>
        <tbody>
            <tr>
                <td>1</td>
                <td>Mark</td>
                <td>Otto</td>
                <td>@mdo</td>
            </tr>
            <tr>
                <td>2</td>
                <td>Jacob</td>
                <td>Thornton</td>
                <td>@fat</td>
            </tr>
        </tbody>
        </Table>
        //*/
    )

}
export default App;
