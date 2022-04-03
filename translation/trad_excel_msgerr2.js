/*
* Extraction des messages d'erreur, suppression des doublons, et génération
* d'un fichier texte prêt à transmettre à Reverso
*/

const FS = require('fs');
const alasql = require('alasql');
const ExcelJS = require('exceljs');
const config1 = require('./library/env1');
const path = config1.exportPath;

const {deleteDoublons, replaceAll, capitalize} = require('../library/tools.js');

let file_msgerr_ori = 'datas/messagesND-fr.txt';
let file_msgerr_tra = 'datas/messagesND-nl.txt'; // traductions réalisées avec Reverso

let file_xls_ori = 'datas/messagesND.xlsm';
let file_xls_tra = 'datas/messagesND2.xlsx';


function loadTxtFile(filepath, split_option='\n') {
  const separateur = ' | ';
  const datas = FS.readFileSync(filepath, {encoding:'utf8'});
  const lines = datas.split(split_option);

  let res = [];
  for (let i=1, imax=lines.length; i<imax; i++) {
    let columns = lines[i].split(separateur);
    let id = 0;
    let constante = '';
    if (columns == 0 || columns == 1) {
      console.log('warning : anomalie sur ligne (ignorée) '+i, columns)
    } else {
      if (columns == 2) {
        id = parseInt(columns[0]);
        constante = columns[1];
      } else {
        id = parseInt(columns.shift());
        constante = columns.join(' ');
      }
    }
    if (id > 0) {
      res.push({
        id, constante
      })
    }
  }

  return res;
}

// chargement des messages d'erreur (en version originale et en version traduite)
let msg_ori = loadTxtFile(file_msgerr_ori);
let msg_tra = loadTxtFile(file_msgerr_tra, '<br/>');

// agrégation des messages d'erreur sous forme d'une seule table
//  pour faciliter l'appariement ultérieur avec le fichier Excel
let query_agrega = `select a.constante as msgvo, b.constante as msgtra
  FROM ? a inner join ? b on a.id = b.id`;
let tmp_traducs = alasql(query_agrega, [msg_ori, msg_tra]);

let traductions = [];
tmp_traducs.forEach((item, i) => {
  // Reverso ayant perdu la plupart des majuscules, forçage en majuscule
  // du premier caractère de chaque traduction
  traductions.push({
    msgvo: item.msgvo,
    msgtra: capitalize(item.msgtra)
  })
});

//console.log(traductions);


async function manager() {
  const query_search = 'select msgtra from ? where msgvo = ?';
  let tmpmsg = [];
  let compteur_non_trad = 0;

  let workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file_xls_ori);
  let worksheet = workbook.getWorksheet("Export-Import");

  for (let i=1, imax=worksheet.rowCount; i<imax; i++) {
    let row = worksheet.getRow(i);
    let col1 = String(row.getCell(1).value).trim();
    if (col1 != '') {
      let search = alasql(query_search, [traductions, col1]);
      if (search.length > 0) {
        row.getCell(2).value = search[0].msgtra;
      } else {
        //row.getCell(2).value = row.getCell(1).value;
        compteur_non_trad ++;
      }
    }

    let col5 = String(row.getCell(5).value).trim();
    if (col5 != '') {
      let search = alasql(query_search, [traductions, col5]);
      if (search.length > 0) {
        row.getCell(6).value = search[0].msgtra;
      } else {
        //row.getCell(6).value = row.getCell(5).value;
        compteur_non_trad ++;
      }
    }

    row.commit();
  }

  console.log('enregistrement du fichier : '+file_xls_tra);
  await workbook.xlsx.writeFile(file_xls_tra);

  console.log('Nombre de messages non traduits : '+ compteur_non_trad);

}

manager();
