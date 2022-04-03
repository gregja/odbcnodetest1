/*
 * script traduc01.js
 * amélioration de la structure du fichier des constantes pour identifier
 *  les masques de saisie et éliminer les doublons avant traduction
 * le fichier DDS_application.json a été produit par un script de parsing se
 *  trouvant dans le projet nodetest01
 *
 * Produit 2 fichiers en sortie :
 * - DDS_application_plus.json : constantes enrichies de leurs masques de
 *          saisie respectifs
 * - Constantes_uniques.json : liste des constantes uniques, débarassées de leurs
 *          masques (ce qui permet de réduire le Nombre de constantes à traduire)
 */
const FS = require('fs');
const config1 = require('./library/env1');
const {replaceAll, detectPatterns, deleteDoublons} = require('../library/tools.js');
const {urlAPIs} = require('../library/constants.js');

const path = config1.exportPath;

let datas_a_enrichir = require('./datas/DDS_application.json');

// nom des fichiers d'export
const expfile1 = 'DDS_application_plus.json';
const expfile2 = 'Constantes_uniques.json';

// tableaux des données finales
let fichier_final = [];
let consolidation = [];

for (let i=0, imax=datas_a_enrichir.length; i<imax; i++) {
  let main_item = datas_a_enrichir[i];
  let new_dta = [];
  for (let j=0, jmax=main_item['datas'].length; j<jmax; j++) {
    let tmp = main_item['datas'][j];
    let res = detectPatterns(tmp.str);
    main_item['datas'][j]['plus'] = res;
    consolidation.push(res.center);
    console.log("i => ", i, " | j =>", j);
  }
}

console.log('enregistrement du fichier : '+expfile1);
FS.writeFileSync( path+expfile1, JSON.stringify(datas_a_enrichir) );

let uniqueArray = deleteDoublons(consolidation);
console.log('Nombre de constantes uniques : ', uniqueArray.length);

console.log('enregistrement du fichier : '+expfile2);
FS.writeFileSync( path+expfile2, JSON.stringify(uniqueArray) );
