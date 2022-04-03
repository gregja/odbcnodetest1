/*
 * Script utilitaire pour convertir le fichier des rebuts du JSON vers le CSV
 */

const fastcsv = require("fast-csv");
const fs = require("fs");

const config1 = require('./library/env1');
const path = config1.exportPath;

const origfile = require(path+'Trad_rebuts.json');

const ws = fs.createWriteStream(path+"rebuts.csv");

let jsonData = [];

origfile.forEach((item, i) => {
  jsonData.push({
    id: i+1,
    constante: item
  })
});

fastcsv
  .write(jsonData, { headers: true })
  .on("finish", function() {
    console.log("Write to CSV successfully!");
  })
  .pipe(ws);
