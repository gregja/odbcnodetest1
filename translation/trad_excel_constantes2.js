/*
* Identification des constantes non traduites par trad_excel_constantes1.js
* on essaie d'effectuer un rattrapage des traductions manquantes sur la base
* d'un fichier produit par le script précédent.
*/

const FS = require('fs');
const alasql = require('alasql');
const ExcelJS = require('exceljs');
const config1 = require('./library/env1');
const path = config1.exportPath;

const {deleteDoublons, replaceAll, capitalize, formatage,
  detectPatterns, isCentered} = require('../library/tools.js');
const {conversions_sigles} = require('../library/conversions_nl.js');

let file_msgerr_ori = 'datas/constantesND_rebuts_fr.txt';
let file_msgerr_tra = 'datas/constantesND_rebuts_nl.txt'; // traductions réalisées avec Reverso

let file_xls_ori = 'datas/constantesND2.xlsx';
let file_xls_tra = 'datas/constantesND3.xlsx';

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
let msg_tra = loadTxtFile(file_msgerr_tra);

// agrégation des messages d'erreur sous forme d'une seule table
//  pour faciliter l'appariement ultérieur avec le fichier Excel
let query_agrega = `select a.constante as msgvo, b.constante as msgtra
  FROM ? a inner join ? b on a.id = b.id`;
let tmp_traducs = alasql(query_agrega, [msg_ori, msg_tra]);

let traductions = [];
tmp_traducs.forEach((item, i) => {
  // Reverso ayant perdu la plupart des majuscules, forçage en majuscule
  // du premier caractère de chaque traduction
  let msgtra = item.msgtra;
  for (let key in conversions_sigles) {
    if (conversions_sigles.hasOwnProperty(key)) {
      msgtra = replaceAll(msgtra, key, conversions_sigles[key])
    }
  }
  traductions.push({
    msgvo: item.msgvo,
    msgtra: capitalize(msgtra)
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
    let txtori = new String(row.getCell(2).value);
    let typori = new String(row.getCell(3).value);
    let txttra = new String(row.getCell(4).value);
    let lngori = parseInt(row.getCell(5).value);

    if (txtori != '' && txttra.trim() == '') {
      let decomp = detectPatterns(txtori);
      decomp['cad'] = isCentered(txtori);
      // if (decomp['cad'] == 'c') console.log(decomp);
//console.log(decomp)
      let search = alasql(query_search, [traductions, decomp.center]);
      if (search.length > 0) {
        let msgtra = search[0].msgtra;
        let firstpart = String(decomp.before + msgtra);
        //console.log(firstpart);
        let tmptra = formatage(decomp.cad, lngori, decomp.after, firstpart);
        console.log(msgtra);
        row.getCell(4).value = tmptra;
      } else {
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
