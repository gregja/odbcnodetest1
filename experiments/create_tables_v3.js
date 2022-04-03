/*
 * script create_table_v3.js
 * Génération d'un script SQL contenant les CREATE TABLE de l'ensemble des
 *  fichiers référencés dans un fichier produit par DSPFD (sur la bibl. GCFIC)
 *  version 3 (finale): la liste des colonnes de chaque table est générée dans
 *             cette version, ainsi que la liste des indexs
 *             NB : la constante indexs_a_part permet de définir si on souhaite
 *                  créer les indexs dans le fichier des CREATE TABLE ou dans
 *                  un fichier à part.

  Recréation des indexs à partir d'un fichier DB2 généré de la manière suivante :
  --- fichier de travail généré avec la commande suivante :
      DSPFD FILE(GCFIC/*ALL) TYPE(*ACCPTH) OUTPUT(*OUTFILE) FILEATR(*LF) OUTFILE(xxxxx/DDSINDEX)

  SELECT aplib, apfile, apuniq, apbof, apbol, apbolf, apnkyf, apkeyf,
         apkeyn, apkseq, apnsc2, apjoin
  FROM xxxxx.DDSINDEX
  WHERE apnsc2 = 1 AND substr(apfile, 1, 3) <> 'SYS' ;

*/

const alasql = require('alasql');
const FS = require('fs');
const config1 = require('../library/env0');

const list_fichiers = require('./datas/dspfd_gcfic.json');
const lib_dest = 'JARRIGE2'; // 'GCFICV2';

const path = config1.exportPath;
const expfile1 = 'create_tables_v3.sql';
const expfile2 = 'create_indexs_v3.sql';

// flag pour définir si les CREATE INDEX sont créés dans un fichier à part ou s'ils
//  sont inclus dans le fichier des CREATE TABLE
const indexs_a_part = true;

// flag pour définir si on ajoute un nom court sur les CREATE INDEX ou pas
// il est déconseillé de fixer ce paramètre à true si on veut utiliser des
// indexs de type "surrogate" par la suite (cf. script create_tables_v4.js)
const add_sysname_on_index = true;

// préfixe à ajouter sur les noms courts des tables si on souhaite les faire
// cohabiter par la suite avec des "surrogate" indexs
const prefix_on_table_sysname = "X_";

async function loadCSV1() {
  /*
  * Chargement des tables
  */
  const path = 'datas/klist_tables.csv';
  const columns = 'nom_entite as entite, nom_physique as physiq, nom_logique as logiq, designation'
  const res = await alasql.promise(`SELECT ${columns} FROM CSV(?, {headers:true, separator:";"})`, [path]);
  return res;
}

/*
 * Chargement des colonnes de tables
 */
async function loadCSV2() {
  const path = 'datas/klist_columns.csv';
  const columns = 'nom_prop,mot_dir,designation,entlog,numord,long,dec,typedec,ori,nom_court'
  const res = await alasql.promise(`SELECT ${columns} FROM CSV(?, {headers:true, separator:";"})`, [path]);
  return res;
}

/*
 * Chargement des chemins d'accès
 *  fichier généré via la commande DSPFD et le paramètre *ACCPTH
 * Pour rappel, le paramètre *ACCPTH...
 *   fournit les chemins d'accès pour les fichiers
 *   physiques et logiques, ainsi qu'une description de la
 *   clé composée pour les chemins d'accès par clé.
 */
async function loadCSV3() {
  const path = 'datas/dspfd_accpth.csv';
  const columns = 'aplib, apfile, apuniq, apbof, apbol, apbolf, apnkyf, apkeyf, apkeyn, apkseq, apnsc2, apjoin'
  const res = await alasql.promise(`SELECT ${columns} FROM CSV(?, {headers:true, separator:";"})`, [path]);
  return res;
}

/*
 * Méthode rapide et simple pour remplacer toutes les occurrences
 * d'un caractère par un autre
 */
function replaceAll (origine, str1, str2) {
  return origine.split(str1).join(str2);
}

(async () => {
	const entites = await loadCSV1();

  const proprietes = await loadCSV2();

  const propkeys = await loadCSV3();

  const query1 = 'select trim(rffile) as rffile, trim(rflib) as rflib , trim(rfname) as rfname from ? ';
  const fichiers = alasql (query1, [list_fichiers, "PF"]);

  const fusion = `
select a.entite, a.physiq, a.logiq, a.designation, a.id_entite, b.rfname, b.rflib
from ? a
inner join ? b
  on a.physiq = b.rffile
`;

  const liste_tables2 = alasql(fusion, [entites, fichiers])

  let script_final1 = "";  // variable stockage des CREATE TABLE
  let script_final2 = "";  // variable stockage des CREATE INDEX

  liste_tables2.forEach(mainItem => {
      const nom_entite = mainItem.entite;
      const nom_ficphysiq = mainItem.physiq;
      const nom_format = mainItem.rfname;
      const designation_fichier = replaceAll(mainItem.designation.trim(), "'", "''");

      // nom_prop,mot_dir,designation,entlog,numord,long,dec,typedec,ori,nom_court
      const columns = alasql('select mot_dir, designation, entlog, long, dec, typedec, nom_court from ? where entlog = ? order by numord', [proprietes, nom_entite]);

      const indexs = alasql('select apfile, apuniq, apbof, apkeyf, apkeyn, apkseq from ? where apbof = ? order by apfile, apkeyn', [propkeys, nom_ficphysiq]);

      let tabcols = [];
      let tabidxs = [];
      let labels1 = [];
      let labels2 = [];

      columns.forEach(item => {
        let fieldtype = '';
        let fielddefault = '';
        if (item.type == 'Date' || item.type == 'Time') {
          fieldtype = type.toUpper(item.type);
          fielddefault = fieldtype;
        } else {
          if (String(item.dec).trim() == '') {
            fieldtype = `CHAR(${item.long})`;
            fielddefault = "''";
          } else {
            // TODO : vérifier si le type DEC est pertinent dans tous les cas (packé/étendu ?!?)
            fieldtype = `DEC(${item.long}, ${item.dec})`;
            fielddefault = 0;
          }
        }
        let designation_colonne = replaceAll(item.designation.trim(), "'", "''");
        tabcols.push( `    ${item.mot_dir} FOR COLUMN ${item.nom_court} ${fieldtype} NOT NULL DEFAULT ${fielddefault}` );
        labels1.push( `    ${item.mot_dir} IS '${designation_colonne}'` );
        labels2.push( `    ${item.mot_dir} TEXT IS '${designation_colonne}'` );
      })

      const script_col = tabcols.join(',\n');
      const script_labels1 = labels1.join(',\n');
      const script_labels2 = labels2.join(',\n');

      /* mise à plat des clés d'index, résultat attendu => clé1, clé2 DESC, clé3  */
      let rupt_logiq = ''; // détecteur de rupture sur le nom d'index
      let keys_by_logiq = {};
      indexs.forEach(item => {
        // Objectif : récupérer la notion de "unique index" si présente et
        //  consolider la liste des clés de l'index dans un tableau
        if (rupt_logiq != item.apfile) {
           rupt_logiq = item.apfile;
           keys_by_logiq[item.apfile] = {uniq:item.apuniq, keys:[]};
        }
        let sens = '';
        if (item.apkseq == 'D') {
          sens = ' DESC'
        } // le sens ASC est le sens par défaut, alors on ne le déclare pas
        const col_corresp = alasql('select mot_dir as nom_long from ? where nom_court = ?', [columns, item.apkeyf])
        if (col_corresp.length > 0 && col_corresp[0].hasOwnProperty('nom_long')) {
          //let nomcol = item.apkeyf; // remplacé par le nom long de la colonne
          let nomcol = col_corresp[0].nom_long;
          keys_by_logiq[item.apfile].keys.push (`${nomcol}${sens}`);
        } else {
          console.log("!!! Anomalie => entité:", nom_entite, " ; col :", item.apkeyf, " ; ", col_corresp)
        }

      })

      for (const key in keys_by_logiq) {
        if (keys_by_logiq.hasOwnProperty(key)) {
          let tmp_keys1 = keys_by_logiq[key].keys;
          let tmp_keys2 = tmp_keys1.join (', ')
          const script_idx = tabidxs.join(', ');
          const unique = (keys_by_logiq[key].uniq == 'Y') ? 'UNIQUE ' : '' ;
          const suffix_num = String(key).substring(key.length-2, key.length);
          let sysname = '';
          if (add_sysname_on_index) {
            sysname = `FOR SYSTEM NAME ${key} `;
          }
          const script_index = `CREATE ${unique}INDEX ${lib_dest}.IDX_${nom_entite}${suffix_num} ${sysname}ON ${lib_dest}.${nom_entite}(${tmp_keys2}); -- index d'origine : ${key}`;
          tabidxs.push(script_index);
        }
      }

      let script_index = tabidxs.join('\n');

      if (indexs_a_part) {
          script_final2 += script_index;
          script_index = '';
      }

      const script_table = `
--- Entité ${nom_entite}
CREATE OR REPLACE TABLE ${lib_dest}.${nom_entite} FOR SYSTEM NAME ${prefix_on_table_sysname}${nom_ficphysiq} (
${script_col}
) RCDFMT ${nom_format} ;

LABEL ON TABLE ${lib_dest}.${nom_entite} IS '${designation_fichier}' ;
COMMENT ON TABLE ${lib_dest}.${nom_entite} IS '${designation_fichier}' ;

LABEL ON COLUMN ${lib_dest}.${nom_entite} (
${script_labels1}
);
LABEL ON COLUMN ${lib_dest}.${nom_entite} (
${script_labels2}
);
${script_index}
GRANT ALTER , DELETE , INDEX , INSERT , REFERENCES , SELECT , UPDATE
ON ${lib_dest}.${nom_entite} TO ZDEV WITH GRANT OPTION ;
`;
      script_final1 += script_table;
  });

  console.log('enregistrement du fichier : '+expfile1);
  FS.writeFileSync( path+expfile1, script_final1 );

  if (indexs_a_part) {
    console.log('enregistrement du fichier : '+expfile2);
    FS.writeFileSync( path+expfile2, script_final2 );
  }

})();
