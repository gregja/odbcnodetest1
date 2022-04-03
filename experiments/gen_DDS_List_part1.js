/*
Script d'analyse et d'extraction des constantes textes, à partir des
sources DSPF (écrans) et PRTF (éditions) d'une application RPG

Etapes de mise en place préalables à l'exécution de ce script

Etape 1 : génération d'une table des références croisée

    DSPPGMREF PGM(GCPGM/*ALL) OUTPUT(*OUTFILE) OUTFILE(MABIBL/PGMREF)

Etape 2 : génération d'une liste des sources DDS

   DSPFD FILE(GCSRC/QDDSSRC)
         TYPE(*MBRLIST)
         OUTPUT(*OUTFILE)
         OUTFILE(MABIBL/SYSCOMDDS)

Etape 3 : requête SQL De croisement des DDS avec les programmes :

    WITH FILES AS (
       SELECT MLNAME, MLSEU, MLMTXT FROM MABIBL.SYSCOMDDS WHERE MLSEU IN ('DSPF', 'PRTF')
    )
    , REFER AS (
       SELECT A.MLNAME, A.MLSEU, A.MLMTXT,
             (SELECT WHPNAM FROM MABIBL.PGMREF WHERE WHFNAM = A.MLNAME LIMIT 1) AS PGMNAME
       FROM FILES A
    )
    SELECT MLNAME, MLSEU, MLMTXT, PGMNAME FROM REFER WHERE PGMNAME IS NOT NULL
    ;

Etape 4 : export résultat au format JSON

Etape 5 : voir le projet "nodetrad" dans lequel le fichier produit est
   réutilisé pour traduire les constantes dans une autre langue

Exemple de lignes DDS à extraire :
A          R SFL02
A                                  2 11'Ticket n°:'
A                                  4  2'Appuyez sur F5 pour confirmer vos -
A                                      'choix'
A                                    23'ARBORESCENCE D''APPEL DES PROGRAMM-
A                                      'MES'
A                                  2 11'                  Confirmations d-
A                                      ''achat                    '
*/

const alasql = require('alasql');
const FS = require('fs');
const odbc = require('odbc');

const prod_mode = true;

let config1 = require('../library/env0');

const {replaceAll} = require('../library/tools.js');

const {getDSN, genOverlayDBFile, dropOverlayDBFile} = require('../library/IBMiTools');

const mabib = config1.dbq;
const lib_dest = 'GCFICV2';

const path = config1.exportPath;
const expfile = 'DDS_application.json';

async function loadCSV1() {
  const path = 'datas/list_DDS_Ecr_Prt.csv';
  const columns = 'MLNAME, MLSEU, MLMTXT, PGMNAME';
  const res = await alasql.promise(`SELECT ${columns} FROM CSV(?, {headers:true, separator:";"})`, [path]);
  return res;
}

async function connectToDatabase() {

   const list_members = [];

   if (prod_mode) {
     list_members = await loadCSV1();
   } else {
     // liste provisoire pour tests
     list_members = [
      {
       MLNAME: 'SAIJOUD',
       PGMNAME: 'néant',
       MLSEU: 'DSPF'
     },
      {
       MLNAME: 'SAIEBAD',
       PGMNAME: 'RSAIEBA',
       MLSEU: 'DSPF'
     },
      {
       MLNAME: 'RINT3PR',
       PGMNAME: 'RUPDINT3',
       MLSEU: 'PRTF'
     }];
   }

    const dbcnx1 = await odbc.connect(getDSN(config1));

    let datasfinal = [];

    async function analyse (memberName, memberType) {
      console.log(memberName, memberType);
      let datalines = [];
      let idline = 0;
      // génération liste des profils utilisateurs dans une table temporaire
      let cmd1 = genOverlayDBFile('QDDSSRC', 'GCSRC', memberName);
      let result1 = await dbcnx1.query(cmd1);

      // on ne prend que les lignes de type "A" non commentées
      let query2 = "SELECT SRCDTA FROM QDDSSRC WHERE SUBSTR(SRCDTA, 6, 2) = 'A '";
      let result2 = await dbcnx1.query(query2);

      let cmd3 = dropOverlayDBFile();
      let result3 = await dbcnx1.query(cmd3);

      let current_format = '';

      for (let i=0,imax=result2.length; i<imax; i++) {
        let srcline = new String(result2[i]['SRCDTA']);
        let nextline = '';
        let warning = false;
        if (i<imax-1) {
          nextline = new String(result2[i+1]['SRCDTA']);
          // si la constante suivante contient 2 apostrophes successifs, alors
          //  il s'agit d'un cas tordu : la constante de la ligne courante
          //  est probabement splittée mais la position du tiret de split
          //  est 78 et non 79
          if (nextline[44] == "'" && nextline[45] == "'") {
            warning = true;
          }
        }

        if (srcline[16] == 'R') {
          let formatName = srcline.substring(18, 28)
          current_format = String(formatName).trim();
        } else {
          let lig = null;
          if (memberType == "DSPF") {
            lig = parseInt(srcline.substring(39, 41));
          }
          let pos = parseInt(srcline.substring(42, 44));
          let constante = '';
          if (srcline[44] == "'") {
            constante = srcline.substring(44, 80);
            let findEnd = true;
            let posTiret = 0;
            if (srcline[79] == '-') {
              posTiret = 79; // tiret de césure de ligne en 79 (cas normal)
            } else {
              // le tiret de césure de ligne n'est en position 78 que dans le cas où
              //  la ligne suivante contient 2 apostrophes en positions 44 et 45
              if ( srcline[78] == '-' && warning) {
                posTiret = 78;
              }
            }
            if (posTiret > 0) {
              //console.log(srcline)
              findEnd = false;
              constante = srcline.substring(44, posTiret); // on élimine le - en fin de ligne
            }
            // on rentre dans une boucle pour récupérer les bouts de la
            //  constante qui se trouvent sur les lignes suivantes
            while(findEnd == false) {
              i++; // on avance le compteur du "for" principal car on ne repassera
                   // pas sur ces lignes qui sont des compléments de la ligne courante
              let otherline = new String(result2[i]['SRCDTA']);
              //console.log(i)
              //console.log(otherline)
              let debpos = 44;
              let endpos = 79;
              let rewarning = false;
              let nextline2 = '';
              if (otherline[79] != '-' && otherline[78] != '-') {
                findEnd = true;
              } else {
                if (i<imax-1) {
                  nextline2 = new String(result2[i+1]['SRCDTA']);
                  // si la constante suivante contient 2 apostrophes successifs, alors
                  //  il s'agit d'un cas tordu : la constante de la ligne courante
                  //  est probabement splittée mais la position du tiret de split
                  //  est 78 et non 79
                  if (nextline2[44] == "'" && nextline2[45] == "'") {
                    rewarning = true;
                    if (otherline[78] == '-') {
                      endpos = 78;
                    }
                  }
                }
              }
              if (rewarning && nextline2[44] == "'" && nextline2[45] == "'" ) {
                // cas tordu où la constante est "splittée" au niveau d'une apostrophe
                debpos = 45;
              }
              let extract = otherline.substring(debpos, endpos);
              //console.log(debpos, endpos, extract)
              constante += extract;
            }

            constante = String(constante).trim();
            constante = constante.substring(1, constante.length-1);
            // d'office les apostrophes sont doublées dans les constantes, alors
            //   on simplifie
            constante = replaceAll(constante, "''", "'");

            let lng = constante.length; // récup longueur réelle avant trim() final
            // on considère arbitrairement que toute chaîne commençant par un blanc
            //   est potentiellement centrée (pourra être utile après traduction)
            let cad = constante[0] == ' ' ? 'c' : 'g'; // c=centré ; g=cadré à gauche

            let stockage = true;
            if (lng == 1 || (constante.trim() == '!' || constante.trim() == '|')) {
              // ne pas stocker les séparateurs de colonne et les constantes
              //  de 1 caractère (TODO : pertinent ?)
              stockage = false;
            } else {
              // ne pas stocker les constantes qui ne contiennent que
              //  les caractères séparateurs de lignes suivants : - + = | _ *
              let test = replaceAll(constante, '-', '');
              test = replaceAll(test, '+', '');
              test = replaceAll(test, '=', '');
              test = replaceAll(test, '|', '');
              test = replaceAll(test, '_', '');
              test = replaceAll(test, '*', '');
              if (test.trim() == '') {
                stockage = false;
              }
            }

            if (stockage) {
              idline++;
              let datas = {
                id: idline,
                fmt: current_format,
                lig: lig,
                pos: pos,
                str: constante.trim(),
                lng: lng,
                cad: cad
              }
              datalines.push(datas);
            }
          }
        }

      } // end for i
      return datalines;
    }

    if (prod_mode) {
        for (let i=0, imax=list_members.length; i<imax; i++) {
          let member = list_members[i];
          memberName = String(member['MLNAME']).trim();
          pgmName = String(member['PGMNAME']).trim();
          memberType = String(member['MLSEU']).trim();
          datasfinal.push({src: memberName, pgm:pgmName, type:memberType,
            datas: await analyse(memberName, memberType)});
        }

    } else {
        console.log('!!! ATTENTION !!! : script lancé en mode Test');
        let testmembers =  ['LSTLACBE', 'PRTENTJE', 'AFFBARFM', 'DSPCNFACHD'];
        for (let x=0, xmax=testmembers.length; x<xmax; x++) {
          let testmember = testmembers[x];
            datasfinal.push({
              src: testmember,
              pgm:'XXX',
              type:'DSPF',
              datas: await analyse(testmember, 'DSPF')
            });
        }

}


    // affichage des données pour contrôle (en phase de test)
    /*
    datasfinal.forEach(item => {
      console.log("DSPF => ", item.src, " ; PGM => ", item.pgm, " ; TYPE => ", item.type, " ; DATAS => ", item.datas);
    })
    */

    console.log('enregistrement du fichier : '+expfile);
    FS.writeFileSync( path+expfile, JSON.stringify(datasfinal) );

}

connectToDatabase();
