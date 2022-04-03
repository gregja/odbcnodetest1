/*
 * script create_table_v2.js
 * Génération d'un script SQL contenant les CREATE TABLE de l'ensemble des
 *  fichiers référencés dans un fichier produit par DSPFD (sur la bibl. GCFIC)
 *  version 2 : la liste des colonnes de chaque table est générée dans cette
 *              version provisoire, mais pas les indexs (voir version 3)
 */
const alasql = require('alasql');
const FS = require('fs');
const config1 = require('../library/env0');

const list_fichiers = require('./datas/dspfd_gcfic.json');
const lib_dest = 'GCFICV2';

const path = config1.exportPath;
const expfile = 'create_tables_v2.sql';

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

(async () => {
	const entites = await loadCSV1();

  const proprietes = await loadCSV2();

  const fichiers = alasql ('select trim(rffile) as rffile, trim(rflib) as rflib , trim(rfname) as rfname from ? ', [list_fichiers, "PF"]);

  const fusion = `
select a.entite, a.physiq, a.logiq, a.designation, a.id_entite, b.rfname, b.rflib
from ? a
inner join ? b
  on a.physiq = b.rffile
`;

  const liste_tables2 = alasql(fusion, [entites, fichiers])

  let script_final = "";
  liste_tables2.forEach(item => {

  // nom_prop,mot_dir,designation,entlog,numord,long,dec,typedec,ori,nom_court
  const columns = alasql('select mot_dir, designation, entlog, long, dec, typedec, nom_court from ? where entlog = ? order by numord', [proprietes, item.entite]);

  let tabcols = [];
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
    let designation = String(item.designation).trim();
    tabcols.push( `    ${item.mot_dir} FOR COLUMN ${item.nom_court} ${fieldtype} NOT NULL DEFAULT ${fielddefault}` );
    labels1.push( `    ${item.mot_dir} IS '${item.designation}'` );
    labels2.push( `    ${item.mot_dir} TEXT IS '${item.designation}'` );
  })

  const script_col = tabcols.join(',\n');
  const script_labels1 = labels1.join(',\n');
  const script_labels2 = labels2.join(',\n');

  const script = `
--- Entité ${item.entite}
CREATE TABLE ${lib_dest}.${item.entite} FOR SYSTEM NAME ${item.physiq} (
${script_col}
) RCDFMT ${item.rfname} ;

LABEL ON TABLE ${lib_dest}.${item.entite} IS '${item.designation}' ;
COMMENT ON TABLE ${lib_dest}.${item.entite} IS '${item.designation}' ;

LABEL ON COLUMN ${lib_dest}.${item.entite} (
${script_labels1}
);
LABEL ON COLUMN ${lib_dest}.${item.entite} (
${script_labels2}
);

GRANT ALTER , DELETE , INDEX , INSERT , REFERENCES , SELECT , UPDATE
ON ${lib_dest}.${item.entite} TO ZDEV WITH GRANT OPTION ;
`;
  script_final += script
});
// console.log(script_final);

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
