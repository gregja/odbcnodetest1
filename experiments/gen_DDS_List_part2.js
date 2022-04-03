/*
Script d'analyse et d'extraction des constantes textes, à partir des
sources DSPF (écrans) et PRTF (éditions) d'une application RPG

Partie 2 : stockage dans une table DB2 du fichier JSON des constantes
  écrans et éditions (qui a été généré par le script gen_DDS_List_part1.js)

Structure de la table de stockage DB2 :
  
      CREATE OR REPLACE TABLE MABIBL.DDSECRPRT (
        PROGRAM CHAR(10),
        MEMBERNAME CHAR(10),
        MEMBTYPE CHAR(4),
        IDLINE INTEGER,
        FORMAT CHAR(10),
        LIG INTEGER,
        POS INTEGER,
        STR VARCHAR(240),
        LNG INTEGER,
        CAD CHAR(1)
      );
*/

const odbc = require('odbc');

const config1 = require('../library/env0');

const {getDSN} = require('../library/IBMiTools');

const mabib = config1.dbq;

const path = config1.exportPath;
const expfile = 'DDS_application.json';

let datasfinal = require(path+expfile);
//console.log(datasfinal);

async function connectToDatabase() {

  const dbcnx1 = await odbc.connect(getDSN(config1));

  let deleteQuery = `DELETE FROM ${mabib}.DDSECRPRT`;
  await dbcnx1.query(deleteQuery);

  let insertQuery = `INSERT INTO ${mabib}.DDSECRPRT
      (PROGRAM, MEMBERNAME, MEMBTYPE, IDLINE, FORMAT, LIG, POS, STR, LNG, CAD)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const statement = await dbcnx1.createStatement();
  await statement.prepare(insertQuery);
  for (let i=0, imax=datasfinal.length; i<imax; i++) {
    let item = datasfinal[i];
    for (let j=0, jmax=item.datas.length; j<jmax; j++) {
      let data = item.datas[j];
      let tmpdatas = [
        item.pgm,
        item.src,
        item.type,
        data['id'],
        data['fmt'],
        data.lig,
        data.pos,
        data.str,
        data.lng,
        data.cad
      ];
      await statement.bind(tmpdatas);
      const result = await statement.execute();

    }
  }
}

connectToDatabase();
