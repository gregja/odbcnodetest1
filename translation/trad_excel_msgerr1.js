/*
* Extraction des messages d'erreur, suppression des doublons, et génération
* d'un fichier texte prêt à transmettre à Reverso
*/

const FS = require('fs');
const ExcelJS = require('exceljs');
const config1 = require('./library/env1');
const path = config1.exportPath;

const {deleteDoublons, replaceAll} = require('../library/tools.js');

let excelfileori = 'datas/messagesND.xlsm';
let expfile1 = 'messagesND.txt';


async function manager() {

  let tmpmsg = [];

  let workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelfileori);
  let worksheet = workbook.getWorksheet("Export-Import");

  for (let i=1, imax=worksheet.rowCount; i<imax; i++) {
    let row = worksheet.getRow(i);
    let col1 = String(row.getCell(1).value).trim();
    let col2 = String(row.getCell(5).value).trim();
    if (col1 != '') {
      tmpmsg.push(col1)
    }
    if (col2 != '') {
      tmpmsg.push(col2)
    }
  }

  const separateur = ' | '; 
  let msgerr1 = deleteDoublons(tmpmsg);
  let msgerr2 = [];
  msgerr1.forEach((item, i) => {
    let item2 = replaceAll(item, '\n', ' ');
    // ajout d'un identifiant sur chaque ligne pour pouvoir "matcher" les
    //  textes d'origine et leurs traductions
    msgerr2.push(`${i+1}${separateur}${item2}`);
  });

  console.log('enregistrement du fichier : '+expfile1);
  FS.writeFileSync( path+expfile1, msgerr2.join('\n') );
  console.log('Nombre de messages à traduire : ', msgerr2.length);
}

manager();
