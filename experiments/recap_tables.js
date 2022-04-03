/*
  Recréation des indexs à partir d'un fichier DB2 généré de la manière suivante :
  
  --- fichier de travail généré avec la commande suivante :
      DSPFD FILE(GCFIC/*ALL) TYPE(*ACCPTH) OUTPUT(*OUTFILE) FILEATR(*LF) OUTFILE(xxxx/DDSINDEX)

  SELECT aplib, apfile, apuniq, apbof, apbol, apbolf, apnkyf, apkeyf, apkeyn, apkseq, apnsc2, apjoin
  FROM xxxx.DDSINDEX
  WHERE apnsc2 = 1 AND substr(apfile, 1, 3) <> 'SYS' ;

*/

const alasql = require('alasql');
const FS = require('fs');
const config1 = require('../library/env0');

const list_fichiers = require('./datas/dspfd_gcfic.json');
const lib_dest = 'GCFICV2';

const path = config1.exportPath;
const expfile = 'recap_tables.sql';

async function loadCSV1() {
  const path = 'datas/klist_tables.csv';
  const columns = 'nom_entite as entite, nom_physique as physiq, nom_logique as logiq, designation'
  const res = await alasql.promise(`SELECT ${columns} FROM CSV(?, {headers:true, separator:";"})`, [path]);
  return res;
}

async function loadCSV2() {
  const path = 'datas/klist_columns.csv';
  const columns = 'nom_prop,mot_dir,designation,entlog,numord,long,dec,typedec,ori,nom_court'
  const res = await alasql.promise(`SELECT ${columns} FROM CSV(?, {headers:true, separator:";"})`, [path]);
  return res;
}

async function loadCSV3() {
  const path = 'datas/dspfd_accpth.csv';
  const columns = 'aplib, apfile, apuniq, apbof, apbol, apbolf, apnkyf, apkeyf, apkeyn, apkseq, apnsc2, apjoin'
  const res = await alasql.promise(`SELECT ${columns} FROM CSV(?, {headers:true, separator:";"})`, [path]);
  return res;
}

// https://stackoverflow.com/questions/2116558/fastest-method-to-replace-all-instances-of-a-character-in-a-string
function replaceAll (origine, str1, str2) {
  return origine.split(str1).join(str2);
}

(async () => {
	const entites = await loadCSV1();

  const proprietes = await loadCSV2();

  const propkeys = await loadCSV3();

  const fichiers = alasql ('select trim(rffile) as rffile, trim(rflib) as rflib , trim(rfname) as rfname from ? ', [list_fichiers, "PF"]);

  const fusion = `
select a.entite, a.physiq, a.logiq, a.designation, a.id_entite, b.rfname, b.rflib
from ? a
inner join ? b
  on a.physiq = b.rffile
`;

  const liste_tables2 = alasql(fusion, [entites, fichiers])

  let script_final = "";
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
        tabcols.push( `${item.mot_dir} SHORT: ${item.nom_court} TYPE: ${fieldtype} DESC: ${designation_colonne} DEFAULT:${fielddefault}` );
      })

      const script_col = tabcols.join(',\n');

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
          const unique = (keys_by_logiq[key].uniq == 'Y') ? '(clé unique) ' : '' ;
          const suffix_num = String(key).substring(key.length-2, key.length)
          const script_index = `INDEX : ${unique} INDEX ${lib_dest}.IDX_${nom_entite}${suffix_num} ON ${lib_dest}.${nom_entite}(${tmp_keys2}); -- index d'origine : ${key}`;
          tabidxs.push(script_index);
        }
      }

      const script_index = tabidxs.join('\n');

      const script_table = `
--- Entité ${nom_entite}
CREATE TABLE ${lib_dest}.${nom_entite} FOR SYSTEM NAME ${nom_ficphysiq} (
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
      script_final += script_table;
});


 console.log('enregistrement du fichier : '+expfile);
 FS.writeFileSync( path+expfile, script_final );

})();




/*
select title, replace([title],'e','xxx') as a
from (
    SELECT *
    FROM CSV('/file.csv', {headers:true, separator:"|"}) limit 5
) x
*/
/*
select title, replace([title],'e','xxx') as a
from (
    SELECT *
    FROM CSV('/file.csv', {headers:true, separator:"|"}) limit 5
) x
*/
