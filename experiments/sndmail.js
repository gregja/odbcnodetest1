/*
 * Script d'envoi de mail à partir des fonctions natives de l'IBM i
 *  ajoute au mail une pièce jointe zippée 
 */
const odbc = require('odbc');

const config1 = require('../library/env0');

const {getDSN, genCmdSys} = require('../library/IBMiTools');
const {replaceAll} = require('../library/tools');

/*
 * Génère la commande IBMi de copie d'une table SQL DB2 vers un fichier de l'IFS
 */
function prepareCpyToImpf (library, file, member, stmf) {
  library = String(library).trim();
  let cmd = `CPYTOIMPF FROMFILE(${library}/${file} ${member}) TOSTMF('${stmf}') `+
               "MBROPT(*REPLACE) FROMCCSID(297) " +
               "STMFCCSID(1208) RCDDLM(*CRLF) DTAFMT(*FIXED) "+
               "STRDLM(*NONE) FLDDLM('')" ;
  // les apostrophes doivent être doublées dans la commande finale
  cmd = replaceAll(cmd, "'", "''");
  return cmd;
}

/*
 * Prépare le chemin d'accès complet d'un fichier dans sa version
 * initiale (stmf), et dans sa version zippée (stmz)
 */
function preparePJ(ficpj, extension='txt', path='/tmp/') {
  const stmf = `${path}${ficpj}.${extension}`;
  const stmz = `${path}${ficpj}.zip`;
  return {stmf, stmz};
}

/*
 * Prépare la commande IBMi qui a pour effet de zipper un fichier de l'IFS
 * (s'appuie sur QSHELL et Java pour IBMi)
 */
function prepareZip(stmf, stmz) {
  const ziplink = `Jar cfM ${stmz} ${stmf}`;
  let cmd = `STRQSH CMD('${ziplink}')`;
  cmd = replaceAll(cmd, "'", "''");
  return cmd;
}

/*
 * Prépare la commande d'envoi de mail native de l'IBMi
 */
function prepareSendMail (emailAddr, subject, note) {
  let cmd = `SNDSMTPEMM RCP(('${emailAddr}')) SUBJECT('${subject}') NOTE('${note}') `;
  cmd = replaceAll(cmd, "'", "''");
  return cmd;
}

async function connectToDatabase() {

    const dbcnx1 = await odbc.connect(getDSN(config1));

    try {

      /* préparation du mail */
      const emailAddr = config1.email;
      const emailSubj = 'test envoie de mail';
      const emailBody = 'test envoie de mail, test envoie de mail, test envoi..';
      let emailCmd = prepareSendMail(emailAddr, emailSubj, emailBody);

      /* préparation chemins vers PJ non zippé et zippé */
      const {stmf, stmz} = preparePJ('pgmref');
      console.log(stmf, stmz);

      /* export table DB2 et préparation pièce jointe */
      const library = config1.dbq;
      const file = 'PGMREF2';
      const member = 'PGMREF2';
      const exportCmd = prepareCpyToImpf (library, file, member, stmf);

      // ajout pièce jointe zippée à la fin de la commande d'envoi de mail
      emailCmd += replaceAll(` ATTACH(('${stmz}' *ZIP))`, "'", "''");

      const zipCmd = prepareZip(stmf, stmz);

      /* exécution commande d'export de la table DB2 vers l'IFS */
      let query1 = genCmdSys(exportCmd);
      console.log(query1)
      let result1 = await dbcnx1.query(query1, []);

      /* exécution commande de zippage du fichier dans l'IFS */
      let query2 = genCmdSys(zipCmd);
      console.log(query2);
      let result2 = await dbcnx1.query(query2, []);

      /* exécution commande d'envoi du mail */
      let query3 = genCmdSys(emailCmd);
      console.log(query3);
      let result3 = await dbcnx1.query(query3, []);

    } catch (err) {
      console.log(err);
    }

}

connectToDatabase();
