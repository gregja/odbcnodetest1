/*
 * script testodbc4.js
 * teste différentes fonctions de DB2 for i 
 */
const odbc = require('odbc');

const config1 = require('../library/env0');

const {getDSN, genOverlayDBFile, dropOverlayDBFile} = require('../library/IBMiTools');

async function connectToDatabase() {

    const dbcnx1 = await odbc.connect(getDSN(config1));

    try {
      // génération liste des profils utilisateurs dans une table temporaire
      let cmd1 = genOverlayDBFile('QCLSRC', 'GCSRC', 'CACHMEB7');
      let result1 = await dbcnx1.query(cmd1);
      console.log(result1);

      let query2 = 'SELECT * FROM QCLSRC LIMIT 10';
      let result2 = await dbcnx1.query(query2);
      console.log(result2);

      // 2ème exécution de la même requête sans problème
      let query2b = 'SELECT * FROM QCLSRC LIMIT 10';
      let result2b = await dbcnx1.query(query2b);
      console.log(result2b);

      // curieusement, le DLTOVR sur le membre d'origine renvoie une erreur -443 (susbstitution non trouvée au niveau indiqué)
      let cmd3 = dropOverlayDBFile('QCLSRC');
      console.log(cmd3);
      let result3 = await dbcnx1.query(cmd3);
      console.log(result3);

      // ... alors que le DLTOVR *ALL fonctionne sans problème
      let cmd3b = dropOverlayDBFile('*ALL');
      console.log(cmd3b);
      let result3b = await dbcnx1.query(cmd3b);
      console.log(result3b);

    } catch (err) {
      console.log(err);
    }

}

connectToDatabase();
