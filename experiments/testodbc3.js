/*
 * script testodbc3.js
 * teste différentes fonctions de DB2 for i
 */
 const odbc = require('odbc');

const config1 = require('../library/env0');

const iTools = require('../library/IBMiTools.js');

const {genListProfiles, genListMembers} = require('../library/IBMiTools.js');


async function connectToDatabase() {

    const dbcnx1 = await odbc.connect(iTools.getDSN(config1));

    try {
      // génération liste des profils utilisateurs dans une table temporaire
      let result1 = await dbcnx1.query(genListProfiles());
      console.log(result1);
      let query1 = 'SELECT UPUPRF, UPTEXT, UPLSTD, UPUEXD FROM QTEMP.TMPPROFILE LIMIT 10';
      let result2 = await dbcnx1.query(query1);
      console.log(result2);

      // génération liste des membres d'un fichier source dans une table temporaire
      let result3 = await dbcnx1.query(genListMembers("GCSRC/QCLSRC"));
      console.log(result3);
      let query4 = 'SELECT MLNAME, MLSEU, MLMTXT, MLCHGD FROM QTEMP.MBRLIST LIMIT 10';
      let result4 = await dbcnx1.query(query4);
      console.log(result4);

    } catch (err) {
      console.log(err);
    }

}

connectToDatabase();
