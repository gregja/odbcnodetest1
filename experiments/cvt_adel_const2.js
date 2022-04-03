/*
Conversion des constantes applicatives en RPG Free
  constantes déclarées dans la RG TRV_CONSTANTES
 => exporte un source RPG Free préformaté avec constantes en "noms longs"

Rappel : exemple de déclaration de constantes en RPG :

dcl-c majuscules 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
dcl-c euro 6,55957;
*/

const path = __dirname;
const srcfile = 'datas/constantes_adelia.txt';
const expfile = 'exports/export_const_adelia2.txt';

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
    let tmp1 = ligne.replace('\r', '').trim();
    let tmp2 = '';
    if (tmp1.substr(0, 1) == '*') {
      if (tmp1.substr(1, 1) == '*') {
        tmp2 = '//' + tmp1.substring(2);
      } else {
        tmp2 = '//' + tmp1.substring(1);
      }
    } else {
      if (tmp1.length > 1) {
        tmp2 = 'dcl-c '+tmp1.replace('=', '') + ';'
      } else {
        tmp2 = tmp1;
      }
    }
    exportdatas.push(tmp2);
 })
 let tmp2 = exportdatas.join('\n');

 console.log('enregistrement du fichier : '+expfile);
 FS.writeFileSync( path+expfile, tmp2 );
});
