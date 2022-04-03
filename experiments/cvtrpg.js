/*
script cvtrpg.js   TODO : à finaliser
Convertit les membres RPG 3 d'un fichier source en leur équivalent RPG 4, via la
commande ci-dessous :

CVTRPGSRC FROMFILE(SOLSRCTST/SOLRPGSRC)
          FROMMBR(SCO10D)
          TOFILE(SOLSRCTST/SOLRPGLSRC)
*/

const odbc = require('odbc');

const config1 = require('../library/env0');

const {getDSN, genCmdSys, genListMembers} = require('../library/IBMiTools');

const sources_2_convert = 'SOLSRCTST/SOLRPGSRC';
const temp_table = 'QTEMP/MBRLIST';

/*
Commande de création du fichier source de destination :
    CRTSRCPF FILE(xxxxx/XRPGSRC) RCDLEN(112) TEXT('new sources')
*/
const sources_new_file = config1.dbq + '/XRPGSRC'

async function connectToDatabase() {

    const dbcnx1 = await odbc.connect(getDSN(config1));

    try {
      // génération liste des membres de sources à convertir en RPG ILE
      //  dans la table <temp_table>
      let result1 = await dbcnx1.query(genListMembers(sources_2_convert));

      let limit = 'LIMIT 3' ; // TODO : limite provisoire pour tests, à fixer à blanc pour traiter tous les membres
      let query2 = `SELECT TRIM(MLNAME) AS MLNAME FROM ${temp_table} WHERE TRIM(MLSEU) = 'RPG' ${limit}`;
      let result2 = await dbcnx1.query(query2);

      result2.forEach(async function(data, i) {
        let cvtRpgCmd = `CVTRPGSRC FROMFILE(${sources_2_convert}) FROMMBR(${data['MLNAME']})` +
                  ` TOFILE(${sources_new_file})`;
        console.log(cvtRpgCmd);

        //let cvtCmd = genCmdSys(cvtRpgCmd);
        //console.log(cvtCmd);

        //let result1 = await dbcnx1.query(cvtCmd);
        //console.log(result1); //=> erreur DB2 -443

        // Appel de l'API QCMDEXC pour exécuter la commande CVTRPGSRC
        const result = await dbcnx1.callProcedure(null, null, 'QCMDEXC', [cvtRpgCmd, cvtRpgCmd.length]);
        console.log(result);
      });

    } catch (err) {
      console.log(err);
    }

}

connectToDatabase();
