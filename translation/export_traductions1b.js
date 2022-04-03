/*
* reporting sur les traductions finales (effectives et en anomalie)
 */
 const config1 = require('./library/env1');
 const path = config1.exportPath;

const {detectPatterns, deleteDoublons, consoleObject} = require('../library/tools.js');

const expfile1 = 'Trad_finales.json';

let trads = require(path+expfile1);

let warnings = {
  'NO_ERROR' : 0
};

var mouchard = [];

trads.forEach((item) => {
  if (item.warn != '') {
    if (warnings.hasOwnProperty(item.warn)) {
      warnings[item.warn]++;
    } else {
      warnings[item.warn] = 1;
    }
  } else {
    warnings['NO_ERROR']++;
  }
  if (item.warn == 'NO_TRANSLATION') {
    let tmp = detectPatterns(item.dtaori)
    mouchard.push(tmp.center);
  }
});

console.log('Reporting => ');
consoleObject(warnings);

const uniqueValues = deleteDoublons(mouchard); // [...new Set(mouchard)]
console.log("Nombre de constantes uniques non traduites : "+ uniqueValues.length);

/*
// affichage des constantes non traduites (à activer au cas par cas)
uniqueValues.forEach((item, i) => {
  console.log(item);
});
*/
