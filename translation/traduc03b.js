/*
 * script traduc03b.js
 * utilise le fichier tmp_trad_nl2.csv qui est une table de correspondances FR=>NL
 * l'objectif est d'enrichir le fichier Trad_reverso2.json, qui sera stocké
 * sous un autre nom, Trad_reverso3.json
 * 
*/
const FS = require('fs');
const alasql = require ('alasql');

const config1 = require('./library/env1');
const path = config1.exportPath;
const expfileOri = 'tmp_trad_nl2';

const expfileAdd2 = 'Trad_reverso2.json';
const expfileAdd3 = 'Trad_reverso3.json';

let dataset2complete = require(path+expfileAdd2);

async function loadCSV3(file, split_option='\n', split_columns=',') {
  const path = `${file}.csv`;

  const datas = FS.readFileSync(path, {encoding:'utf8'});
  const lines = datas.split(split_option);

  let res = [];
  for (let i=0, imax=lines.length; i<imax; i++) {
    let columns = lines[i].split(split_columns);
    if (columns.length == 2) {
      res.push({
        dtaori: columns[0],
        dtades: columns[1]
      })
    } else {
      console.log('Nombre de colonnes erroné : ', columns);
    }
  }

  return res;
}

(async () => {
	const trads = await loadCSV3(path+expfileOri, '\n', ';');

  console.log('Nombre de lignes de traduction prises en compte : '+trads.length);

  let comptage_ajouts = 0;
  const query2 = 'select 1 as found from ? where origine = ?';
  trads.forEach((item, i) => {
    let search = alasql(query2, [dataset2complete, item.dtaori]);
    let flag = false;
    if (search.length > 0) {
        if (search[0].found == 1) {
          flag = true;
        }
    }
    if (!flag) {
      comptage_ajouts++;
      dataset2complete.push({
        origine: item.dtaori,
        traduction: [item.dtades]
      })

    }

  });

  console.log(`Nombre d'ajouts effectués dans ${expfileAdd2} : ${comptage_ajouts}` );
  console.log('Enregistrement du fichier '+ expfileAdd3);
  FS.writeFileSync( path+expfileAdd3, JSON.stringify(dataset2complete) );


})();
