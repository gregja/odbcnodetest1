/*
 * script testDB2webservice.js
 * test d'appel de Webservice à partir de DB2 for i
 * Exemple ci-dessous issu du document suivant :
 *   https://www-356.ibm.com/partnerworld/wps/servlet/download/DownloadServlet?id=k4ixw2TAAIwiPCA$cnt&attachmentName=accessing_web_services_using_ibm_db2_for_i_udfs_and_udtfs.pdf
 */
const odbc = require('odbc');
const FS = require('fs');

const config1 = require('../library/env0');

const {getDSN} = require('../library/IBMiTools');

const wsURL1 = `http://www.ecb.int/vocabulary/2002-08-01/eurofxref`;
const wsURL2 = `http://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml`;

const wsQuery = `SELECT my_cube.rate_time, my_cube.currency, my_cube.rate
 FROM
 XMLTABLE(
 -------------- Declare Namespaces ----------------------
 XMLNAMESPACES(
 DEFAULT '${wsURL1}',
 'http://www.gesmes.org/xml/2002-08-01' AS "gesmes"
 ),
 -------------- Row Expression --------------------------
 'gesmes:Envelope/Cube/Cube/Cube'
 PASSING
 ------------ Initial Context ------------------------
 XMLPARSE(DOCUMENT
 SYSTOOLS.HTTPGETBLOB(
 ----------------- URL ------------------------
 '${wsURL2}',
 ---------------- Header ---------------------
 ''
 )
 )
 -------------- Result Set Columns -------------
 COLUMNS
 currency CHAR(3) PATH '@currency',
 rate DECIMAL(10,4) PATH '@rate',
 rate_time DATE PATH '../@time'
 ) my_cube
WHERE currency = 'USD'
ORDER BY rate_time DESC `;

async function connectToDatabase() {

    const dbcnx1 = await odbc.connect(getDSN(config1));

    try {
      let result1 = await dbcnx1.query(wsQuery);
      console.log(result1);   //=> { RESPONSE: '{"Param2":"Msg coucou sent."}' }

    } catch (err) {
      console.log(err);
    }

}

connectToDatabase();
