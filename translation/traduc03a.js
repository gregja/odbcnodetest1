/*
 * script traduc03a.js
 * consolide le contenu des fichiers rebuts.csv et traduc-nl.csv pour
 * obtenir une table d'équivalence entre constantes en FR et en NL
 * cette table d'équivalence sera utilisée pour enrichir le fichier
 * Trad_reverso.json, qui sera stocké sous un autre nom, Trad_reverso2.json
 * 
*/
const FS = require('fs');
const alasql = require ('alasql');

const config1 = require('./library/env1');
const path = config1.exportPath;

const expfileAdd1 = 'Trad_reverso.json';
const expfileAdd2 = 'Trad_reverso2.json';
let dataset2complete = require(path+expfileAdd1);


async function loadCSV(file, split_option='\n') {
  const path = `exports/${file}.csv`;

  const datas = FS.readFileSync(path, {encoding:'utf8'});
  const lines = datas.split(split_option);

  let res = [];
  for (let i=1, imax=lines.length; i<imax; i++) {
    let columns = lines[i].split(',');
    let id = 0;
    let constante = '';
    if (columns == 0 || columns == 1) {
      console.log('anomalie sur ligne '+i, columns)
    } else {
      if (columns == 2) {
        id = columns[0];
        constante = columns[1];
      } else {
        id = columns.shift();
        constante = columns.join(',');
      }
    }
    if (id > 0) {
      res.push({
        id, constante
      })
    }
  }

  return res;
}

(async () => {
	const dta_fr = await loadCSV('rebuts');
  const dta_nl = await loadCSV('traduc-nl', '\r\n');

  const query = `select a.id, a.constante as dtaori, b.constante as dtades
  from ? a inner join ? b on a.id = b.id
  `;
  const trads = alasql (query, [dta_fr, dta_nl]);

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

  console.log(`Nombre d'ajouts effectués dans ${expfileAdd1} : ${comptage_ajouts}` );
  console.log('Enregistrement du fichier '+ expfileAdd2);
  FS.writeFileSync( path+expfileAdd2, JSON.stringify(dataset2complete) );

})();
