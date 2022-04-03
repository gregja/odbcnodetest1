/*
Conversion des variables d'environnement en RPG Free
  variable déclarées dans la RG TRV_LCT_DTA
  => exporte un source RPG Free préformaté avec variables en "noms longs"
     + un fichier JSON

Rappel : exemple de déclaration de variables en RPG :

dcl-s z1n packed(4:0);
dcl-s z2n zoned(4:0);
dcl-s z3n int(3);
dcl-s z1a char(40);
dcl-s z2a like(z1a);
dcl-s z3a char(40) inz('cours RPG');
dcl-s z4a varchar(40) inz('cours RPG');
dcl-s z1d date(*eur);
dcl-s z1t time;
dcl-s z1z timestamp;
dcl-s z1i ind;
dcl-s ventes zoned(6:0) dim(12);
dcl-s mois char(10) dim(12) ctdata; // chargé à la compil

=> déclaration de tableau à la fin d'un source RPG :
**cdtata mois
Janvier
Février
...
Décembre

*/

const path = __dirname;
const srcfile = 'datas/adel_var_envir.txt';
const expfile1 = 'exports/export_varenv_adelia1.json';
const expfile2 = 'exports/export_varenv_adelia1.txt';

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
 var exportsrc = [];
 lignes.forEach(ligne => {
    let tmp1 = ligne.replace('\r', '').split(' ');
    let item = false;
    if (tmp1[0] == 'DECLARER') {
      let tmp2 = String(tmp1[1]).split(';');
      let datatype = String(tmp1[2]);
      item = { short: tmp2[0], long:tmp2[1], type:"CHAR", size:datatype};
      exportdatas.push(item);
    }
    if (ligne.substr(0, 1) == '*') {
      if (ligne.substr(1, 1) == '*') {
        exportsrc.push( '//' + ligne.substring(2) );
      } else {
        exportsrc.push( '//' + ligne.substring(1) );
      }
    } else {
      if (item) {
        exportsrc.push( `dcl-s ${item.long} CHAR(${item.size});` );
      }
    }

 })
 console.log('enregistrement du fichier : '+expfile1);
 FS.writeFileSync( path+expfile1, JSON.stringify(exportdatas) );
 console.log('enregistrement du fichier : '+expfile2);
 FS.writeFileSync( path+expfile2, exportsrc.join('\n') );
});
