/*
 * script testodbc1.js
 * teste différentes fonctions de DB2 for i 
 */
const odbc = require('odbc');

const config1 = require('../library/env0');

//let dsn = 'DSN=*LOCAL';
let dsn = `DRIVER={iSeries Access ODBC Driver};SYSTEM=${config1.system};NAM=1;DBQ=${config1.dbq};CMT=0;DFT=5;DSP=1;DEC=0;TFT=0;TSP=0;Port=1234;CCSID=${config1.ccsid};UID=${config1.user};PWD=${config1.pwd}`;

odbc.connect(dsn, (error, connection) => {
  if (error) { throw error; }
  // now have an open connection to IBM i from any Linux or Windows machine
  // let query = 'select 1 as resultat from sysibm.sysdummy1';
  // let query = 'select * from QSYS2.TCPIP_INFO';
  let query = 'SELECT * FROM SYSIBMADM.ENV_SYS_INFO';
  connection.query(query, (error, result) => {
    if (error) { throw error; }
    console.log(result);
  })
});

let query1 = `
select table_name, table_type, table_owner, column_count, system_table_name
from qsys2.systables
where TABLE_SCHEMA = ? and table_type in ('P', 'T')
FETCH FIRST 5 ROWS ONLY
`;

odbc.connect(dsn, (error, connection) => {
  if (error) { throw error; }
  // now have an open connection to IBM i from any Linux or Windows machine
  connection.query(query1, ['GCFIC'], (error, result) => {
    if (error) { throw error; }
    console.log(result.count);
    /*
      statement: 'select * from xxx.pgmref limit 10',
      parameters: [],
      return: undefined,
      count: 10,
      columns:
    */
    result.forEach(item => console.log(item)); // itère directement sur le result set
    //  console.log(result);
  })
});
