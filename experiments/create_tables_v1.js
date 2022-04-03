/*
 * script create_table_v1.js
 * Génération d'un script SQL contenant les CREATE TABLE de l'ensemble des
 *  fichiers référencés dans un fichier produit par DSPFD (sur la bibl. GCFIC)
 *  version 1 : la liste des colonnes n'est pas générée dans cette version
 *              provisoire
 */
const alasql = require('alasql');
const FS = require('fs');
const config1 = require('../library/env0');

const list_fichiers = require('./datas/dspfd_gcfic.json');
//console.log(list_fichiers);

const path = config1.exportPath;
const expfile = 'create_tables.sql';

async function loadCSV() {
  const path = 'datas/klist_tables.csv';
  const columns = 'nom_entite as entite, nom_physique as physiq, nom_logique as logiq, designation, id_entite'
  const res = await alasql.promise(`SELECT ${columns} FROM CSV(?, {headers:true, separator:";"})`, [path]);
  return res;
}

(async () => {
	const entites = await loadCSV();
  //console.log('datas ', entites);

  const fichiers = alasql ('select trim(rffile) as rffile, trim(rflib) as rflib , trim(rfname) as rfname from ? ', [list_fichiers, "PF"]);
  //console.log('fichiers ', fichiers)

  const fusion = `
select a.entite, a.physiq, a.logiq, a.designation, a.id_entite, b.rfname, b.rflib
from ? a
inner join ? b
  on a.physiq = b.rffile
`;

  const liste_tables2 = alasql(fusion, [entites, fichiers])

  let script_final = "";
  liste_tables2.forEach(item => {
    const script = `
  --- Entité ${item.entite}
  CREATE TABLE ${item.rflib}.${item.entite} FOR SYSTEM NAME ${item.physiq} (
    ...
  ) RCDFMT ${item.rfname} ;
  LABEL ON TABLE ${item.rflib}.${item.entite} IS '${item.designation}' ;
  COMMENT ON TABLE ${item.rflib}.${item.entite} IS '${item.designation}' ;
  `;
    script_final += script
  });

 console.log('enregistrement du fichier : '+expfile);
 FS.writeFileSync( path+expfile, script_final );

})();
