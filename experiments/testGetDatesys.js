/*
 * script testGetDatesys.js
 * teste la récupération de la date système IBMi
 */
const odbc = require('odbc');

const config1 = require('../library/env0');

const {getDSN, getSysDate, getEnvSysInfo} = require('../library/IBMiTools');

async function connectToDatabase() {

    const dbcnx1 = await odbc.connect(getDSN(config1));

    try {
      // génération liste des profils utilisateurs dans une table temporaire
      let result1 = await dbcnx1.query(getSysDate());
      console.log(result1);
      /*
        [
          { NOW: '2022-03-11 10:04:13.539211' },
          statement: 'SELECT now() as now FROM sysibm.sysdummy1',
          parameters: [],
          return: undefined,
          count: 1,
          columns: [
            {
              name: 'NOW',
              dataType: 93,
              columnSize: 26,
              decimalDigits: 6,
              nullable: false
            }
          ]
        ]
      */

      console.log(result1[0].NOW); //=> 2022-03-11 10:04:13.539211

      let result2 = await dbcnx1.query(getEnvSysInfo());
      console.log(result2[0]);
      /*
        {
          OS_NAME: 'IBM i',
          OS_VERSION: '7',
          OS_RELEASE: '3',
          HOST_NAME: 'dev.masocietebidon.com',
          TOTAL_CPUS: 1,
          CONFIGURED_CPUS: 1,
          CONFIGURED_MEMORY: 24576n,
          TOTAL_MEMORY: 49152
        }
      */

    } catch (err) {
      console.log(err);
    }

}

connectToDatabase();
