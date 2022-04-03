/*
 * script testodbc2.js
 * teste différentes fonctions de DB2 for i 
 */
const odbc = require('odbc');

const config1 = require('../library/env0');
// const config2 = require('./library/env2');

function getDSN(config) {
  let driver = config.driver || '{iSeries Access ODBC Driver}';
  let ccsid = config.ccsid || '1208'; // 1208 => UTF-8 sur IBMi
  let port = config.port || '1234';
  let dsn = `DRIVER=${driver};SYSTEM=${config.system};DBQ=${config.dbq};UID=${config.user};PWD=${config.pwd};CCSID=${ccsid};Port=${port};CMT=0;DFT=5;NAM=1;DSP=1;DEC=0;TFT=0;TSP=0`;
  return dsn;
}

//let dsn = 'DSN=*LOCAL';

async function connectToDatabase() {

    const dbcnx1 = await odbc.connect(getDSN(config1));
    // dbcnx1 is now an open Connection

    // const dbcnx2 = await odbc.connect(getDSN(config2));
    // dbcnx2 is now an open Connection

    let query1 = `
    select table_name, table_type, table_owner, column_count, system_table_name
    from qsys2.systables
    where TABLE_SCHEMA = 'GCFIC' and table_type in ('P', 'T')
    limit 5 offset 10
    `;

    try {
      let result1 = await dbcnx1.query(query1);
      console.log(result1);
    } catch (err) {
      console.log(err);
    }

}

connectToDatabase();
