/*
Conversion des constantes applicatives en RPG Free
  constantes déclarées dans la RG TRV_CONSTANTES
 => exporte une table de correspondances "noms courts/noms longs" en JSON

Rappel : déclaration de constantes en RPG :
  dcl-c majuscules 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  dcl-c euro 6,55957;
*/

const path = __dirname;
const srcfile = 'datas/decl_constantes_adelia.txt';
const expfile = 'exports/export_const_adelia1.json';

const FS = require('fs');
FS.readFile(path+srcfile, (err, data) => {
 if (err) {
   throw err;
 }
 result = data.toString();
 // data étant un objet, on le convertir en Chaîne, puis en tableau...
 let lignes = result.split('\n');
 // ... avant de récupérer le nombre de lignes
 console.log('Nombre de lignes : ' + lignes.length);
 var exportdatas = [];
 lignes.forEach(ligne => {
   let tmp1 = ligne.replace('\r', '').split(' ');
   let tmp2 = String(tmp1[1]).split(';');
   exportdatas.push({ short: tmp2[0], long:tmp2[1]});
 })
 console.log('enregistrement du fichier : '+expfile);
 FS.writeFileSync( path+expfile, JSON.stringify(exportdatas) );
});
