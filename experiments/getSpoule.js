/*
 * script testodbc4.js
 * teste différentes fonctions de DB2 for i
 */
const odbc = require('odbc');
const FS = require('fs');

const config1 = require('../library/env0');

const {getDSN, genCmdSys} = require('../library/IBMiTools');

const {rtrim} = require('../library/tools.js');

const path = config1.exportPath;
const expfile = 'exportSpoule.txt';

const spoule = {
  splname: 'PGMPGMPR',
  jobnumber: '520482',
  splowner: 'JARRIGE',
  jobname: 'INFDBGM236',
  splnumber: '0000013'
}


async function connectToDatabase() {

    const dbcnx1 = await odbc.connect(getDSN(config1));

    try {
      let query1 = 'CREATE TABLE QTEMP.SPOULE (FILLER CHAR (199 ) NOT NULL WITH DEFAULT) ';
      let result1 = await dbcnx1.query(query1);
      console.log(result1);

      // génération liste des profils utilisateurs dans une table temporaire
      let cmd1 = `CPYSPLF FILE(${spoule.splname}) TOFILE(QTEMP/SPOULE) `+
                `JOB(${spoule.jobnumber}/${spoule.splowner}/${spoule.jobname}) ` +
                `SPLNBR(${spoule.splnumber}) MBROPT(*REPLACE) `;
      let cmd1exe = genCmdSys(cmd1);
      let rescmd1 = await dbcnx1.query(cmd1exe);
      console.log(cmd1exe, rescmd1);

      // 2ème exécution de la même requête sans problème
      let query2 = 'SELECT * FROM QTEMP.SPOULE';
      let result2 = await dbcnx1.query(query2);
      let output = [];
      result2.forEach((item, i) => {
        output.push(rtrim(item.FILLER))
      });
      let datasfinal = '';
      if (output.length > 0) {
        datasfinal = output.join('\n');
      }

      console.log('enregistrement du fichier : '+expfile);
      FS.writeFileSync( path+expfile, datasfinal );

    } catch (err) {
      console.log(err);
    }

}

connectToDatabase();
