/*
 script create_views.js
  Création de vues à partir des mêmes données en entrée que le script
  create_tables_v3.js, en appliquant le référentiel Adelia des noms longs
  (sur tables et colonnes).
  Exemple de production avec cet extrait de table :

  CREATE VIEW GCFICV2.VUE_ACHATS_METAUX AS (
  SELECT     ACCDCIV AS AC_CD_CIV,
      ACNOMACH AS AC_NOM_ACH,
      ACPREACH AS AC_PRE_ACH,
      ACNOMU30 AS AC_NOM_U_30,
      /.../
      ACBURDIS AS AC_BUR_DIS,
      ACMTANN60 AS AC_MT_ANN_60,
      ACLIPCEPAR AS AC_LI_PCE_PAR
  FROM FMACHM
  ) ;

*/

const alasql = require('alasql');
const FS = require('fs');

const config1 = require('../library/env0');
const list_fichiers = require('./datas/dspfd_gcfic.json');

const lib_dest = 'GCFICV2';

const path = config1.exportPath;
const expfile = 'create_views.sql';

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

      let tabcols = [];

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
        tabcols.push( `    ${item.nom_court} AS ${item.mot_dir}` );
      })

      const script_col = tabcols.join(',\n');

      const script_view = `
--- Entité logique: ${nom_entite} ; fichier: ${nom_ficphysiq} ; libellé: ${designation_fichier}
CREATE VIEW ${lib_dest}.VUE_${nom_entite} AS (
SELECT ${script_col}
FROM ${nom_ficphysiq}
) ;
`;
      script_final += script_view;
});


 console.log('enregistrement du fichier : '+expfile);
 FS.writeFileSync( path+expfile, script_final );

})();
