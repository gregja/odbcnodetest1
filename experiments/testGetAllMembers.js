// génération liste des membres d'un fichier source 
const odbc = require('odbc');

const config1 = require('../library/env0');

const {getDSN, genListMembers} = require('../library/IBMiTools');

async function connectToDatabase() {

    const dbcnx1 = await odbc.connect(getDSN(config1));

    try {
      let ref_listmembers = genListMembers('GCSRC', 'QDDSSRC');

      let result1 = await dbcnx1.query(ref_listmembers.cmd);
      let limit = ''; // 'LIMIT 3'; // limite à utiliser uniquement en phase de test
      let query2 = `SELECT TRIM(MLNAME) AS MLNAME FROM ${ref_listmembers.outfile} WHERE TRIM(MLSEU) = ? ${limit}`;
      let result2 = await dbcnx1.query(query2, ['PF']);
      console.log(result2);
      /*
        [
          { MLNAME: 'FPEDIT' }
          { MLNAME: 'FPELFA' }
          { MLNAME: 'FPENSE' }
          { MLNAME: 'FPENTIC' }
          ...
        ]
      */

      result2.forEach(item => {
        console.log(item);
      });

    } catch (err) {
      console.log(err);
    }

}

connectToDatabase();
