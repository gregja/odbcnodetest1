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

const {replaceAll} = require('../library/tools.js');
const {conversions_sigles} = require('../library/conversions_nl.js');

let file_xls_ori = 'datas/constantesND3.xlsx';
let file_xls_tra = 'datas/constantesND4.xlsx';

async function manager() {

  let compteur_depassements = 0;

  let workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file_xls_ori);
  let worksheet = workbook.getWorksheet("Export-Import");

  for (let i=1, imax=worksheet.rowCount; i<imax; i++) {
    let row = worksheet.getRow(i);
    let txttra = new String(row.getCell(4).value);
    txttra = replaceAll(txttra, '\n', ''); // suppression de quelques sauts de ligne parasites
    row.getCell(4).value = txttra;  // mise à jour cellule (sans sauts de ligne)
    let lngori = parseInt(row.getCell(5).value);
    if (txttra.length > lngori) {
      row.getCell(4).font = {
        color: { argb: 'FFFF0000' }, // red
      //  name: 'Arial Black',
      //  family: 2,
      //  size: 14,
      //  italic: true
      };
    } else {
      //console.log(txttra.length, lngori)
      row.getCell(4).font = {
        color: { argb: 'FF000000' }, // black
      };
    }

    row.commit();
  }


  console.log('enregistrement du fichier : '+file_xls_tra);
  await workbook.xlsx.writeFile(file_xls_tra);

  console.log('Nombre de cellules en dépassement de longueur : '+ compteur_depassements);

}

manager();
