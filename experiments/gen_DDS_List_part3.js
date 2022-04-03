/*
Script d'analyse et d'extraction de l'ensemble des propriétés (constantes,
champs, formats, indicateurs, fonctions..) de sources DSPF (écrans)
et PRTF (éditions) d'une application RPG

Il s'agit d'un outil d'extraction plus complet que ce que proposait le
script gen_DDS_List_part1.js, qui lui se focalisant uniquement sur les
constantes.
*/

const alasql = require('alasql');
const FS = require('fs');
const odbc = require('odbc');

const config1 = require('../library/env0');
const path = config1.exportPath;

const {replaceAll} = require('../library/tools.js');

const {getDSN, genOverlayDBFile, dropOverlayDBFile, formatsDDS} = require('../library/IBMiTools');

const expfile = 'DDS_application_test.json';

async function loadCSV1() {
  const path = 'datas/list_DDS_Ecr_Prt.csv';
  const columns = 'MLNAME, MLSEU, MLMTXT, PGMNAME';
  const res = await alasql.promise(`SELECT ${columns} FROM CSV(?, {headers:true, separator:";"})`, [path]);
  return res;
}

function decoupageDDS(srcline, memberType) {
  let lig = null;
  if (memberType == "DSPF") {
    lig = parseInt(srcline.substring(formatsDDS.lig.beg, formatsDDS.lig.end));
  }
  let temp = {
    type_data: null,
    flag_OrAnd: srcline[formatsDDS.flag_OrAnd.pos],
    indic_list: srcline.substring(formatsDDS.indic_list.beg, formatsDDS.indic_list.end),
    flag_fmt: srcline[formatsDDS.flag_fmt.pos],
    name: String(srcline.substring(formatsDDS.name.beg, formatsDDS.name.end)).trim(),
    functions: srcline.substring(formatsDDS.att.beg, formatsDDS.att.end),
    ref: srcline[formatsDDS.ref.pos],
    pos: srcline.substring(formatsDDS.pos.beg, formatsDDS.pos.end),
    lig: lig,
    lng: srcline.substring(formatsDDS.lng.beg, formatsDDS.lng.end),
    typ: srcline[formatsDDS.typ.pos],
    dec: srcline.substring(formatsDDS.dec.beg, formatsDDS.dec.end),
    usg: srcline[formatsDDS.usg.pos],
    attributes: []
  }

  if (temp.name != '') {
    if (String(temp.functions).trim() != '') {
      let attrib = {fnc: String(temp.functions).trim()};
      temp.attributes.push(attrib);
    } else {
      temp.attributes.push({fnc:''});
    }
    if (temp.flag_fmt == 'R') {
      temp.type_data = 'format';
    } else {
      temp.type_data = 'field';
    }
  } else {
    if (srcline[44] == "'") {
      temp.type_data = 'const';
    } else {
      temp.type_data = 'attrib';
    }
  }
  return temp;
}

async function connectToDatabase() {

   //   const list_members = await loadCSV1();  // => liste standard (Prod)

   // liste provisoire pour Tests
   const list_members = [
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
    }
  ];

    const dbcnx1 = await odbc.connect(getDSN(config1));

    let datasfinal = [];

    async function analyse (memberName, memberType) {
      console.log(memberName, memberType);

      let datalines = [];

      const writeDatas = function (datas) {
        if (!datas.hasOwnProperty('attributes')) {
          datas['attributes'] = [];
        }
        if (datas.hasOwnProperty('functions')) {
          delete datas.functions;
        }
        datalines.push(datas);
        return datas; // on renvoie l'objet courant
      }

      // génération liste des profils utilisateurs dans une table temporaire
      let cmd1 = genOverlayDBFile('QDDSSRC', 'GCSRC', memberName);
      let result1 = await dbcnx1.query(cmd1);

      // on ne prend que les lignes de type "A" non commentées
      let query2 = "SELECT SRCDTA FROM QDDSSRC WHERE SUBSTR(SRCDTA, 6, 1) = 'A' ORDER BY SRCSEQ";
      let result2 = await dbcnx1.query(query2);

      let cmd3 = dropOverlayDBFile();
      let result3 = await dbcnx1.query(cmd3);

      let current_type_data = '';
      // pointeur sur objet courant pour d'éventuels ajouts dans le tableau "attributes"
      let current_object = writeDatas({}); // création de l'objet "main" au démarrage

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
        let decoupe = decoupageDDS(srcline, memberType);
        if (decoupe.type_data == 'format') {
          console.log(decoupe.name)
        }
        if (decoupe.type_data == 'format' || decoupe.type_data == 'field' ||
          decoupe.type_data == 'attrib') {

          if (decoupe.type_data == 'format' || decoupe.type_data == 'field') {
            current_type_data = decoupe.type_data;

            if (decoupe.type_data == 'format') {
              current_object = writeDatas({
                        typ: decoupe.type_data,
                        nam: decoupe.name,
                        functions: decoupe.functions,
                        attributes: decoupe.attributes
                      });
            } else {
              /* cas d'un type "field" */
              current_object = writeDatas({
                        typ: decoupe.type_data,
                        nam: decoupe.name,
                        lig: decoupe.lig,
                        pos: decoupe.pos,
                        ref: decoupe.ref,
                        lng: decoupe.lng,
                        tyf: decoupe.typ,
                        dec: decoupe.dec,
                        usg: decoupe.usg,
                        functions: decoupe.functions,
                        attributes: decoupe.attributes
                      });
            }
          } else {
            /* il s'agit d'un attribut */
            if (String(decoupe.functions).trim() != ''
            || String(decoupe.flag_OrAnd).trim() != ''
            || String(decoupe.indic_list).trim() != '') {
              let attrib = {
                fnc: String(decoupe.functions).trim()
              }
              if (String(decoupe.flag_OrAnd).trim() != '') {
                attrib['flag_OrAnd'] = decoupe.flag_OrAnd;
              }
              if (String(decoupe.indic_list).trim() != '') {
                attrib['indic_list'] = decoupe.indic_list;
              }
              current_object.attributes.push(attrib);
            }
          }
        } else {
          /* ici on est dans le cas d'une constante */
          current_type_data = decoupe.type_data;
          let constante = decoupe.functions;
          let lig = decoupe.lig;
          let pos = decoupe.pos;
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
            findEnd = false;
            constante = srcline.substring(44, posTiret); // on élimine le - en fin de ligne
          }
          // on rentre dans une boucle pour récupérer les bouts de la
          //  constante qui se trouvent sur les lignes suivantes
          while(findEnd == false) {
            i++; // on avance le compteur du "for" principal car on ne repassera
                 // pas sur ces lignes qui sont des compléments de la ligne courante
            let otherline = new String(result2[i]['SRCDTA']);
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
          current_type_data = '';
          current_object = writeDatas({
            typ: 'const',
            lig: lig,
            pos: pos,
            val: constante.trim(),
            lng: lng,
            cad: cad,
            functions: decoupe.functions,
            attributes: decoupe.attributes
          })
        }

      } // end for i
      return datalines;
    }

    for (let i=0, imax=list_members.length; i<imax; i++) {
      let member = list_members[i];
      memberName = String(member['MLNAME']).trim();
      pgmName = String(member['PGMNAME']).trim();
      memberType = String(member['MLSEU']).trim();
      datasfinal.push({src: memberName, pgm:pgmName, type:memberType,
        datas: await analyse(memberName, memberType)});
      }

    // affichage des données pour contrôle (à utiliser en phase de test uniquement)
    /*
    datasfinal.forEach(item => {
      console.log("DSPF => ", item.src, " ; PGM => ", item.pgm, " ; TYPE => ", item.type, " ; DATAS => ", item.datas);
    })
    */

    console.log('enregistrement du fichier : '+expfile);
    FS.writeFileSync( path+expfile, JSON.stringify(datasfinal) );

}

connectToDatabase();
