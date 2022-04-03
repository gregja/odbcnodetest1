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

const wsURL = `${config1.wsurl}/engine54/52/PortailJSON?flowName=Svc_TestDecl_By_AS400_InOut&flowType=EAII&actionJSON=launch`;
const wsQuery = `with
url as (
   select '${wsURL}'
   as data from SYSIBM.SYSDUMMY1
),
headerDatas(tname, tvalue) as (Values
   ('Content-Type', 'application/json; charset=utf-8')
),
httpHeader as (
   SELECT
   XMLGROUP(RTRIM(T.tname) AS "name", RTRIM(T.tvalue) AS "value"
   OPTION ROW "header" ROOT "httpHeader" AS ATTRIBUTES)
   From headerDatas T
),
jsonDatas as (
  values json_object(
                'Param1' value 'coucou'
        )
),
finalize as (
  select (select * from url) as url, (select * from httpHeader) as header, (select * from jsonDatas) as jsondta
  from SYSIBM.SYSDUMMY1
)
select SYSTOOLS.HTTPPOSTCLOB(URL, HEADER, JSONDTA) as response from finalize`;

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
