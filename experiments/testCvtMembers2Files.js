/*
CVTRPGSRC FROMFILE(SOLSRCTST/SOLRPGSRC)
          FROMMBR(SCO10D)
          TOFILE(SOLSRCTST/SOLRPGLSRC)
*/
// TODO : script à finaliser

const odbc = require('odbc');

const config1 = require('../library/env0');

const {getDSN, genListMembers} = require('../library/IBMiTools');

const expdir = '/qrpglesrc';

const sources_2_convert = config1.dbq + expdir.toUpperCase();

const path = path.join(config1.exportPath, expdir);


async function connectToDatabase() {

    const dbcnx1 = await odbc.connect(getDSN(config1));

    try {
      // génération liste des membres de sources à convertir en RPG ILE
      //  dans la table <temp_table>
      let ref_listmembers = genListMembers(sources_2_convert);

      let result1 = await dbcnx1.query(ref_listmembers.cmd);
      let limit = 'LIMIT 3';  // TODO : limite à supprimer une fois les tests terminés
      let query2 = `SELECT TRIM(MLNAME) AS MLNAME FROM ${ref_listmembers.outfile} WHERE TRIM(MLSEU) = ? ${limit}`;
      let result2 = await dbcnx1.query(query2, ['RPG']);
      //console.log(result2);

      result2.forEach(async function(data, i) {
        let cvtRpgCmd = `CVTRPGSRC FROMFILE(${sources_2_convert}) FROMMBR(${data['MLNAME']}) TOFILE(${sources_new_file})`;
        console.log(cvtRpgCmd);

        //let cvtCmd = genCmdSys(cvtRpgCmd);
        //console.log(cvtCmd);

        //let result1 = await dbcnx1.query(cvtCmd);
        //console.log(result1); //=> erreur DB2 -443

        const result = await dbcnx1.callProcedure(null, null, 'QCMDEXC', [cvtRpgCmd, cvtRpgCmd.length]);
        console.log(result);
      });

    } catch (err) {
      console.log(err);
    }

}

connectToDatabase();
