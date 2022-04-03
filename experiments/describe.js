/*
 * Produit le descriptif complet d'une table DB2, soit l'équivalent de l'ordre
 * SQL DESCRIBE sur certaines SGBD concurrents
 */
const odbc = require('odbc');

const config1 = require('../library/env0');

const {getDSN, describe} = require('../library/IBMiTools');

async function connectToDatabase() {

    const dbcnx1 = await odbc.connect(getDSN(config1));

    try {
      let query = describe();
      let result = await dbcnx1.query(query, ['GCDEB', 'SDONEP']);
      console.log(result);

    } catch (err) {
      console.log(err);
    }

}

connectToDatabase();
