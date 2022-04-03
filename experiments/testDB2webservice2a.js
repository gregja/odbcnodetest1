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

const wsURL = `http://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml`;
const wsQuery = `VALUES
 XMLPARSE(DOCUMENT
 SYSTOOLS.HTTPGETBLOB(
 -------------- URL --------------------------
 '${wsURL}',
 -------------- Header -------------------------
 ''
 )
 )`;

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
