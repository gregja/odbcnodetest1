/*
 * script export_traductions2a.js
 * Convertit le fichier des traductions finales du JSON vers le CSV
 */
const FS = require("fs");
const fastcsv = require("fast-csv");
const utf8 = require('utf8');

const {dropAccents} = require('../library/tools.js');

const config1 = require('./library/env1');
const path = config1.exportPath;

const fichier_original = "Trad_finales.json";
const fichier_final = "Trad_finales.csv";

const jsonData = require(path + fichier_original);

function nettoyage(data) {
//  return utf8.decode(dropAccents(data));
  return dropAccents(data);
}

let jsonData2 = [];
jsonData.forEach((item, i) => {
  let clone = {...item};
//  clone.dtaori = '"'+nettoyage(clone.dtaori)+'"';
//  clone.dtades = '"'+nettoyage(clone.dtades)+'"';
  clone.dtaori = nettoyage(clone.dtaori);
  clone.dtades = nettoyage(clone.dtades);
  jsonData2.push(clone);
});


const ws = FS.createWriteStream(path + fichier_final);

fastcsv
  .write(jsonData2, { headers: true, delimiter: ';' })
  .on("finish", function() {
    console.log("Write to CSV successfully! => " + fichier_final);
  })
  .pipe(ws);
