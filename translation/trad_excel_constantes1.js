const FS = require('fs');
const ExcelJS = require('exceljs');
const alasql = require('alasql');
const config1 = require('./library/env1');
const path = config1.exportPath;

const {replaceAll, capitalize, cleanInput, deleteDoublons, formatage,
  dropAllNonAlphaChars, detectPatterns, isCentered} = require('../library/tools.js');
const conversions = require('../library/conversions_nl.js');
const {clean_before_trans} = require('../library/tradTools.js');

let excelfileori = 'datas/ConstantesND.xlsm';
let excelfiledes = 'datas/ConstantesND2.xlsx';

let expfile1 = 'constantesND_rebuts_v1.txt';
let expfile2 = 'constantesND_rebuts_v1.json';
let expfile3 = 'constantesND_rebuts_v2.txt';

const traductions1 = require(path+'Trad_finales.json');
const traductions2 = require(path+'Trad_reverso_all.json');
// Extrait les références programme et état, quand elles existent...
// stockées dans la colonne 14 sous cette forme : RPRTCERF2[Etat :PRTCE2]
let extractRef = function(param) {
  let data = String(param).trim();
  let ref = {
    pgm: '',
    prtf: ''
  }
  if (data != '') {
    let split_data = '[Etat :';
    if (data.includes(split_data)) {
      data = data.replace(']', ''); // suppression accolade fermante
      let tmp = data.split(split_data); // séparation Pgm/Etat
      ref.pgm = tmp[0];
      ref.prtf = tmp[1]+'PR';
    } else {
      ref.pgm = data;
    }
  }
  return ref;
}

async function manager() {
  let workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelfileori);
  let worksheet = workbook.getWorksheet("Export-Import");

  /* requête de recherche de constante basée sur le programme et l'état */
  const query1 = 'select dtades from ? where pgm = ? and src = ? and dtaori = ?';
  /* requête de recherche de constante basée sur le programme sans l'état */
  const query2 = 'select dtades from ? where pgm = ? and dtaori = ?';
  /* requête de recherche de constante basée sans réf. programme ni état */
  const query3 = 'select dtades from ? where dtaori = ?';
  /* requête de recherche dans la table de traduction sans les ornementations (.:) */
  const query4 = 'select traduction from ? where origine = ?';

  let count = {
    not_found: 0,
    found: 0,
    rattrapage: 0
  }

  let notrads1 = [];    // tableau simplifié des non traduits
  let notradsDet = [];  // tableau détaillé des non traduits
  let notradsConso = []; // tableau de consolidation des constantes sans fioritures

  for (let i=1, imax=worksheet.rowCount; i<imax; i++) {
    let row = worksheet.getRow(i);
    let constante = row.getCell(2).value;
    let cel14 = String(row.getCell(14).value).trim();
    let ref = extractRef(cel14);

    let trad = '';

    if (ref.prtf != '') {
      let dataset = alasql(query1, [traductions1, ref.pgm, ref.prtf, constante]);
      if (dataset.length > 0) {
        trad = dataset[0].dtades
        count.found++;
      } else {
        count.not_found++;
      }
    } else {
      let dataset = alasql(query2, [traductions1, ref.pgm, constante]);
      if (dataset.length > 0) {
        trad = dataset[0].dtades
        count.found++;
      } else {
        count.not_found++;
      }
    }
    if (trad == '') {
      let dataset = alasql(query3, [traductions1, constante]);
      if (dataset.length > 0) {
        trad = dataset[0].dtades
        count.not_found--;
        count.found++;
      }
    }

    if (trad == '') {
      let tmpclean = dropAllNonAlphaChars(constante);
      if (tmpclean != '') {
        let analysePatterns = detectPatterns(constante)

        let dataset = alasql(query4, [traductions2, analysePatterns.center]);
        if (dataset.length > 0) {
          let typcadrage = isCentered(analysePatterns.textori);
          let longmax = analysePatterns.textori.length;
          let endPattern = analysePatterns.after;
          let firstpart = analysePatterns.before + analysePatterns.center;
          trad = formatage(typcadrage, longmax, endPattern, firstpart)

          count.not_found--;
          count.found++;
          count.rattrapage++;
        } else {
          notradsConso.push(analysePatterns.center);
          notradsDet.push(analysePatterns);
          notrads1.push(constante);
        }

      }
    }

    if (trad != '') {
      row.getCell(4).value = trad;
    }
    row.commit();
  }
  console.log('traductions trouvées : ', count.found);
  console.log('traductions non trouvées : ', count.not_found);
  console.log('traductions rattrapées : ', count.rattrapage);
  await workbook.xlsx.writeFile(excelfiledes);

  let notrads2 = deleteDoublons(notrads1);
  let notrads3 = [];
  let depart = 3000;
  notrads2.forEach((item, i) => {
    //let item2 = replaceAll(item, '\n', ' ');
    notrads3.push(`${i+depart} | ${item}`);
  });

  let notradsConso2 = deleteDoublons(notradsConso);
  let notradsConso3 = [];
  notradsConso2.forEach((item, i) => {
    notradsConso3.push(`${i+1} | ${item}`)
  });


  console.log('enregistrement du fichier : '+expfile1);
  FS.writeFileSync( path+expfile1, notrads3.join('\n') );

  console.log('enregistrement du fichier : '+expfile2);
  FS.writeFileSync( path+expfile2, JSON.stringify(notradsDet) );

  console.log('enregistrement du fichier : '+expfile3);
  FS.writeFileSync( path+expfile3, notradsConso3.join('\n') );

  console.log('Nombre de constantes restant à traduire : ', notradsConso3.length);

}

manager();
