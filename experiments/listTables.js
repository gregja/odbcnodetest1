/*
 * Génère la liste des tables SQL contenues dans la bibliothèque GCDEB
 */
const odbc = require('odbc');

const config1 = require('../library/env0');

const {getDSN, getTablesFromLib} = require('../library/IBMiTools');

async function connectToDatabase() {

    const dbcnx1 = await odbc.connect(getDSN(config1));

    try {
      let query = getTablesFromLib();
      let result = await dbcnx1.query(query, ['GCDEB']);
      console.log(result);

    } catch (err) {
      console.log(err);
    }

}

connectToDatabase();
