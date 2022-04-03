/*
Script de regénération de sources DSPF (écrans) et PRTF (éditions)
à partir d'un fichier JSON exporté préalablement par le script gen_DDS_List_part3.js

Types de données DDS prises en compte (const, format, field) :
{
  typ: 'const',
  lig: null,
  pos: ' 2',
  val: '----------------------------------------------------------------------------------------------------------------------------------',
  lng: 130,
  cad: 'g',
  attributes: [{"fnc":"SFLNXTCHG","indic_list":" 08      ", "flag_OrAnd":"O"}]
}
{
  typ: 'format',
  nam: 'SORDE',
  functions: '                                    ',
  attributes: [ { fnc: 'SPACEB(1)' } ]
}
{
  typ: 'field',
  nam: 'ZWCDSO',
  lig: null,
  pos: ' 2',
  ref: ' ',
  lng: '    3',
  tyf: ' ',
  dec: '  ',
  usg: ' ',
  functions: '                                    ',
  attributes: []
}
*/

const alasql = require('alasql');
const FS = require('fs');
const odbc = require('odbc');

const config1 = require('../library/env0');

const {replaceAll, genFilledArray, cloneArray, chunk, formatOn2Digits} = require('../library/tools.js');
const {getDSN, genOverlayDBFile, dropOverlayDBFile, formatsDDS, genAddPFM} = require('../library/IBMiTools');

const mabib = config1.dbq;

const flag_access_IBMi = true; // fixer à true quand on souhaite réinjecter les sources sur l'IBMi

/////////////////////
// constantes utilisées uniquement pour la mise à jour des sources en BD
const lib_sandbox = 'JARRIGE'; // bibliothèque dans laquelle les sources seront insérées
const srcfile = 'QDDSSRC';
const insertQry = `INSERT INTO ${srcfile} (SRCSEQ, SRCDAT, SRCDTA) VALUES (?, ?, ?) `;
const newdate = new Date();
const insertDate = formatOn2Digits(newdate.getYear()-100) +
                   formatOn2Digits(newdate.getMonth()) +
                   formatOn2Digits(newdate.getDay()) ;
//////////////////////

const path = config1.exportPath;
const impfile = 'DDS_application_test.json';
const expfile = 'DDS_';

function cadrageGauche(tableau, data, position) {
  var value = new String(data);
  var line = cloneArray(tableau);
  if (value.trim() == '') {
    return line;
  }
  if (position.hasOwnProperty('pos')) {
    line[position.pos] = value;
  } else {
      if (position.hasOwnProperty('beg') && position.hasOwnProperty('end')) {
        let tmpval = String(value).split('');
        for (let i=position.beg, imax=position.end, j=0; i<imax; i++, j++) {
          if (tmpval[j]) {
            line[i] = tmpval[j];
          }
        }
      } else {
        console.log('Erreur sur propriétés positionnelles => ', position);
      }
  }
  return line;
}

function formatage(datas, memberType) {
   let xlines = []; // tableau final (certaines lignes pouvant en générer plusieurs à cause des attributs)
   let line = [];

   let newline = function() {
     let line = genFilledArray(81, ' ');
     line[5] = 'A';  // toutes les lignes ont cet attribut en position 5
     return line;
   }

   line = newline(); // ligne courante (tableau de 81 caractères)

   let addLine = function(line) {
     // clonage et stockage de la ligne courante
     xlines.push(cloneArray(line.join('')));
   }

   let addAttributes = function(attributes, dtatype="") {
     if (attributes.length == 0) {
       addLine(line); // on stocke la ligne courante et on reste là
     } else {
       if (dtatype == 'const') {
         // dans le cas des constantes, les attributs ne doivent surtout pas
         // écraser la valeur de la constante elle-même, elle doit donc être
         // sauvegardée, et les attributs doivent être placés sur les lignes
         // en dessous
         addLine(line); // on stocke la ligne courante et on reste là
       } else {
          // traitement spécifique du premier poste où l'on applique le premier
          // attribut directement sur la ligne courante
          let attribute = attributes.shift();
          line = cadrageGauche(line, attribute.fnc, formatsDDS.att);
          addLine(line); // on stocke la ligne courante pour s'occuper des suivantes (s'il y en a)
       }
       while (attributes.length > 0) {
         let attribute = attributes.shift();
         line = newline(); // création d'une nouvelle ligne
         line = cadrageGauche(line, attribute.fnc, formatsDDS.att);
         if (attribute.hasOwnProperty('indic_list')) {
           line = cadrageGauche(line, attribute.indic_list, formatsDDS.indic_list);
         }
         if (attribute.hasOwnProperty('flag_OrAnd')) {
           line = cadrageGauche(line, attribute.flag_OrAnd, formatsDDS.flag_OrAnd);
         }
         addLine(line); // on stocke la ligne courante pour s'occuper des suivantes
       }
     }
   }

   switch (datas.typ) {
    case 'format': {
      line[16] = 'R';
      line = cadrageGauche(line, datas.nam, formatsDDS.name);
      addAttributes(datas.attributes, datas.typ);
      break;
    }
    case 'field': {
      line = cadrageGauche(line, datas.nam, formatsDDS.name);
      if (datas.lig != null) {
        line = cadrageGauche(line, datas.lig, formatsDDS.lig);
      }
      line = cadrageGauche(line, datas.pos, formatsDDS.pos);
      line = cadrageGauche(line, datas.lng, formatsDDS.lng);
      line = cadrageGauche(line, datas.tyf, formatsDDS.typ);
      line = cadrageGauche(line, datas.dec, formatsDDS.dec);
      line = cadrageGauche(line, datas.usg, formatsDDS.usg);
      addAttributes(datas.attributes, datas.typ);
      break;
    }
    case 'const': {
      if (datas.lig != null) {
        line = cadrageGauche(line, datas.lig, formatsDDS.lig);
      }
      line = cadrageGauche(line, datas.pos, formatsDDS.pos);
      // doubler les apostrophes avant injection dans le source DDS
      let constante = replaceAll(datas.val, "'", "''");
      const const_plafond = 35;
      if (constante.length < const_plafond) {
        // cas le plus simple où la constante tient sur une seule ligne
        line = cadrageGauche(line, `'${constante}'`, formatsDDS.att);
        addAttributes(datas.attributes, datas.typ);
      } else {
        // la constante étant trop longue, on la découpe en blocs de 34 car.
        let blocs = chunk(constante.split(''), const_plafond-1)
        for (let i=0, imax=blocs.length; i<imax; i++) {
          let newline = blocs[i].join('')
          if (i == 0) {
              newline = "'" + newline + '-';
          } else {
            if (i == imax-1) {
              newline = newline + "'";
            } else {
              newline = newline + '-';
            }
          }
          // ajout de blancs sur la dernière ligne pour éviter des
          //  problèmes avec la fonction cadrageGauche (qui ne remplit la zone
          //  qu'à concurrence du nombre de caractères transmis dans newline)
          let splitted_newline = newline.split('');
          while (splitted_newline.length <= const_plafond) {
            splitted_newline.push(' ');
          }
          newline = splitted_newline.join('');
          line = cadrageGauche(line, newline, formatsDDS.att);
          addAttributes(datas.attributes, datas.typ);
        }
      }
      break;
    }
    default: {
      // cas des attributs (fonctions) rattachés à la racine (indépendamment
      //   de tout format)
      addAttributes(datas.attributes, datas.typ);
    }
  }
  return xlines;
}

async function connectToDatabase() {

   let dbcnx1 = undefined; // connexion utile uniquement si flag_access_IBMi est à true
   if (flag_access_IBMi) {
     dbcnx1 = await odbc.connect(getDSN(config1));
   }

   const list_members = require(path+impfile);

   const testpath = path + 'testdds/';

   for (let x=0, xmax=list_members.length; x<xmax; x++) {
     let member = list_members[x];
     console.log(member.src, member.pgm, member.type);

     if (flag_access_IBMi) {
       // ajout d'un membre
       let cmd1 = genAddPFM(lib_sandbox, srcfile, member.src, member.type);
       console.log(cmd1);
       let result1 = await dbcnx1.query(cmd1);

       // ovrdbf sur le nouveau membre
       let cmd2 = genOverlayDBFile(srcfile, lib_sandbox, member.src);
       let result2 = await dbcnx1.query(cmd2);
     }

     let source = [];
     let numline = 0.00; // compteur de ligne utilisé pour l'insertion en BD

     for (let i=0, imax=member.datas.length; i<imax; i++) {
       let line = member.datas[i];
       let xlines = formatage(line, member.type);
       // une ligne de donnée en entrée peut produire 1 à x lignes en sortie
       //  d'où la boucle de parcours ci-dessous
       for (let j=0, jmax=xlines.length; j<jmax; j++) {
         let item = xlines[j];
         source.push(item);
         if (flag_access_IBMi) {
           // insertion de la ligne DDS en base
           numline += 0.01;
           let result3 = await dbcnx1.query(insertQry, [numline, insertDate, item]);
         }

       }
     }

     if (flag_access_IBMi) {
       let cmd3 = dropOverlayDBFile();  // fermeture de l'overdbf
       let result3 = await dbcnx1.query(cmd3);
     }

     let xfile = expfile + member.src;
     console.log('enregistrement du fichier : '+xfile);
     FS.writeFileSync( testpath+xfile, source.join('\n') );
   }

}

connectToDatabase();
