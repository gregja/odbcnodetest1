/*
 * script testDB2webservice.js
 * test d'appel de Webservice à partir de DB2 for i
 * Documentation :
 *   https://www-356.ibm.com/partnerworld/wps/servlet/download/DownloadServlet?id=k4ixw2TAAIwiPCA$cnt&attachmentName=accessing_web_services_using_ibm_db2_for_i_udfs_and_udtfs.pdf
 */
const odbc = require('odbc');
const FS = require('fs');

const config1 = require('../library/env0');

const {getDSN} = require('../library/IBMiTools');

const wsQuery = `SELECT XMLGROUP(
 rrn(a) as "id",
 trim(WHLIB) AS "WHLIB",
 trim(WHPNAM) AS "WHPNAM",
 trim(WHTEXT) AS "WHTEXT"
 OPTION ROW "claim"
 ROOT "pgmref_dep"
) AS summary_doc
FROM jarrige.pgmref a
`;

async function connectToDatabase() {

    const dbcnx1 = await odbc.connect(getDSN(config1));

    try {
      let result1 = await dbcnx1.query(wsQuery);
      console.log(result1);   //=>

    } catch (err) {
      console.log(err);
    }

}

connectToDatabase();
