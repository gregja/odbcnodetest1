/*
 * script testDspDbr.js
 * génération liste des indexs d'une librarie dans une table temporaire
 */
const odbc = require('odbc');

const config1 = require('../library/env0');

const {getDSN, genDspDbr} = require('../library/IBMiTools');

async function connectToDatabase() {

    const dbcnx1 = await odbc.connect(getDSN(config1));

    try {
      const mylib = 'GCPGM';
      let ref_dspdbr = genDspDbr(mylib);
      let query1 = ref_dspdbr.cmd; console.log(query1);
      let result1 = await dbcnx1.query(query1);
      console.log(result1);

      let query2 = "SELECT * FROM "+ ref_dspdbr.outfile;
      let result2 = await dbcnx1.query(query2);
      console.log(result2);
      if (result2.length > 0) {
        result2.forEach(item => {
          console.log(item);
        })
      } else {
        console.log('Aucun index référencé dans la bibliothèque '+mylib);
      }

    } catch (err) {
      console.log(err);
    }

}

connectToDatabase();
