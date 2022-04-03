const pivot_table = "sysibm.sysdummy1";

/**
 * Generate the DSN string used to open a connection on a DB2 database
 * @param {*} config 
 * @returns String
 */
function getDSN(config) {
  let driver = config.driver || '{IBM i Access ODBC Driver}';
  let ccsid = config.ccsid || '1208';
  let port = config.port || '1234';
  let dsn = `DRIVER=${driver};SYSTEM=${config.system};DBQ=${config.dbq};UID=${config.user};PWD=${config.pwd};CCSID=${ccsid};Port=${port};CMT=0;DFT=5;NAM=1;DSP=1;DEC=0;TFT=0;TSP=0`;
  return dsn;
}

/**
 * Generate the Wrapper to execute Sys commands via SQL DB2
 * @param {*} cmd 
 * @returns String
 */
function genCmdSys (cmd) {
  // return `CALL QCMDEXC ('${cmd}', ${cmd.length})` ;
  return `CALL QCMDEXC ('${cmd}')` ;
}

function genListProfiles() {
  let cmd = 'DSPUSRPRF USRPRF(*ALL) OUTPUT(*OUTFILE) OUTFILE(QTEMP/TMPPROFILE) OUTMBR(*FIRST *REPLACE)';
  return genCmdSys(cmd);
}

// file GCSRC/QCLSRC
function genListMembers(file) {
  let cmd = `DSPFD FILE(${file}) TYPE(*MBRLIST) OUTPUT(*OUTFILE) FILEATR(*ALL) OUTFILE(QTEMP/MBRLIST)`;
  return genCmdSys(cmd);
}

/**
 * Generate the command to add a member on a physical file
 * @param {*} library 
 * @param {*} file 
 * @param {*} member 
 * @param {*} srctype 
 * @param {*} description 
 * @returns String
 */
function genAddPFM(library, file, member, srctype, description) {
  library = String(library).trim().toUpperCase();
  file = String(file).trim().toUpperCase();
  member = String(member).trim().toUpperCase();
  srctype = String(srctype).trim().toUpperCase();
  description = String(description).trim();
  let cmd = `ADDPFM FILE(${library}/${file}) MBR(${member}) SRCTYPE(${srctype}) TEXT(''${description}'')`;
  return genCmdSys(cmd);
}

/**
 * Generate command to get the list of user profiles
 * @returns {cmd, outfile}
 */
function genListProfiles() {
  const outfile = "QTEMP/TMPPROFILE";
  let cmd = `DSPUSRPRF USRPRF(*ALL) OUTPUT(*OUTFILE) OUTFILE(${outfile}) OUTMBR(*FIRST *REPLACE)`;
  return {cmd:genCmdSys(cmd), outfile: outfile};
}

/**
 * Generate command to get the list of members of the physical file
 * @param {*} library 
 * @param {*} file 
 * @returns {cmd, outfile}
 */
function genListMembers(library, file) {
  const outfile = "QTEMP/MBRLIST";
  library = String(library).trim().toUpperCase();
  file = String(file).trim().toUpperCase();
  let cmd = `DSPFD FILE(${library}/${file}) TYPE(*MBRLIST) OUTPUT(*OUTFILE) FILEATR(*ALL) OUTFILE(${outfile})`;
  return {cmd: genCmdSys(cmd), outfile: outfile};
}

/**
 * Generate Cross References in QTEMP, for a program or a library
 * @param {*} library 
 * @param {*} program  (optional, by default : *ALL) 
 * @returns {cmd, outfile}
 */
 function genPgmRef(library, program='*ALL') {
  const outfile = "QTEMP/TMPPGMREF";
  library = String(library).trim().toUpperCase();
  program = String(program).trim().toUpperCase();
  let cmd = `DSPPGMREF PGM(${library}/${program}) OUTPUT(*OUTFILE) OBJTYPE(*ALL) OUTFILE(${outfile}) OUTMBR(*FIRST *REPLACE) `;
  return {cmd:genCmdSys(cmd), outfile: outfile};
}

/**
 * Generate the list of DB2 indexes (DDS files) in QTEMP, for a file or a library
 * @param {*} library 
 * @param {*} file (optional, by default : *ALL) 
 * @returns {cmd, outfile}
 */
function genDspDbr(library, file='*ALL') {
  const outfile = "QTEMP/TMPDSPDBR";
  library = String(library).trim().toUpperCase();
  file = String(file).trim().toUpperCase();
  let cmd = `DSPDBR FILE(${library}/${file}) OUTPUT(*OUTFILE) OUTFILE(${outfile}) OUTMBR(*FIRST *REPLACE) `;
  return {cmd:genCmdSys(cmd), outfile: outfile};
}

/**
 * Retrieve Query to get Environment System Information from IBMi
 * @returns String
 */
function getEnvSysInfo() {
  return 'SELECT * FROM SYSIBMADM.ENV_SYS_INFO';
}

/**
 * Retrieve Query to get Tables and Physical Files from one library 
 * @returns 
 */
function getTablesFromLib() {
  return `SELECT table_name, trim(system_table_name) as short_name,
    table_type, column_count,
    row_length, table_text, table_owner, table_schema
    FROM qsys2.systables
    WHERE TABLE_SCHEMA = ? and table_type in ('P', 'T')`;
}

// https://www.rpgpgm.com/2016/01/using-sql-for-objects-statistics.html
function getAllObjects() {
  return `SELECT objname, objtype, objattribute, source_library, source_file, source_member, source_timestamp, created_system
    FROM TABLE(qsys2.object_statistics(?,'*ALL'))`;
}

/**
 * Retrieve SQL query to get All members from one physical file
 * @returns String
 */
function getAllMembersFromFile() {
  return `SELECT trim(SYSTEM_TABLE_MEMBER) as SYSTEM_TABLE_MEMBER, trim(SOURCE_TYPE) as SOURCE_TYPE 
    FROM QSYS2.SYSPARTITIONSTAT 
    WHERE SYSTEM_TABLE_SCHEMA = ? AND SYSTEM_TABLE_NAME = ?`;
}

/**
 * Retrieve SQL query to get All members from one library
 * @returns String
 */
function getAllMembersFromLib() {
  return `SELECT trim(SYSTEM_TABLE_MEMBER) as SYSTEM_TABLE_MEMBER, trim(SOURCE_TYPE) as SOURCE_TYPE 
    FROM QSYS2.SYSPARTITIONSTAT 
    WHERE SYSTEM_TABLE_SCHEMA = ?`;
}

/**
 * Generate command CVTRPGSRC to convert an RPG source from RPG3 to RPG4
 * @param {*} ori_library 
 * @param {*} ori_file 
 * @param {*} ori_member 
 * @param {*} des_library 
 * @param {*} des_file 
 * @returns String
 */
function CvtRpgSrc(ori_library, ori_file, ori_member, des_library, des_file) {
  ori_library = ori_library(ori_library).trim().toUpperCase();
  ori_file = ori_library(ori_file).trim().toUpperCase();
  ori_member = ori_library(ori_member).trim().toUpperCase();
  des_library = ori_library(des_library).trim().toUpperCase();
  des_file = ori_library(des_file).trim().toUpperCase();
  let cmd = `CVTRPGSRC FROMFILE(${ori_library}/${ori_file}) FROMMBR(${ori_member}) TOFILE(${des_library}/${des_file})`;
  return genCmdSys(cmd);
}

/**
 * Retrieve SQL Query to get the description of a table, from the table SYSCOLUMNS
 * @returns String
 */
function describe() {
  return `SELECT
   ORDINAL_POSITION AS ORD_POS,
   COLUMN_NAME AS COL_NAME,
   SYSTEM_COLUMN_NAME AS SHORT_NAME,
   DATA_TYPE,
   LENGTH,
   SCALE,
   NUMERIC_PRECISION AS NUM_PREC,
   NULLS AS COL_NULL,
   "CCSID" as COL_CCSID,
   COLUMN_HEADING AS COL_HEAD,
   COLUMN_TEXT AS COL_TEXT,
   HAS_DEFAULT AS HAS_DEF,
   COLUMN_DEFAULT AS COL_DEF,
   IS_IDENTITY AS IS_IDENT,
   TABLE_NAME AS TAB_NAME,
   TABLE_SCHEMA AS TAB_SCHEMA
  FROM QSYS2.SYSCOLUMNS
  WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
`;
}

/**
 * Generate command OVRDBF (Overlay Database File) on a member of a physical file
 * @param {*} file 
 * @param {*} library 
 * @param {*} member 
 * @returns String
 */
function genOverlayDBFile(file, library, member) {
  library = String(library).trim().toUpperCase();
  file = String(file).trim().toUpperCase();
  member = String(member).trim().toUpperCase();
  // The parameter OVRSCOPE is mandatory in this context
  //  https://www.ibm.com/docs/en/i/7.2?topic=sql-running-program-embedded-override-considerations
  let cmd = `OVRDBF FILE(${file}) TOFILE(${library}/${file}) MBR(${member}) OVRSCOPE(*JOB) `;
  return genCmdSys(cmd);
}

/**
 * Generate command to delete an OVRDBF
 * @param {*} file 
 * @returns 
 */
function dropOverlayDBFile(file='*ALL') {
  file = String(file).trim().toUpperCase();
  let cmd = `DLTOVR FILE(${file})`;
  return genCmdSys(cmd);
}

/**
 * Retrieve SQL Query to get the DB2 system date 
 * @returns 
 */
function getSysDate() {
  return `SELECT now() as now FROM ${pivot_table}`;
}

/**
 * Constant to set the position of the different fields of a DDS source code
 * (adapted for DSPF and DSPF source files)
 * For reminder, the positions are calculated from position 0 plus the "beg" 
 * position is inclusive and the "end" position is exclusive
 */
const formatsDDS = {
  flag_OrAnd: {pos:6},
  indic_list: {beg:7, end:16},
  flag_fmt: {pos:16},
  name: {beg:18, end:28},
  ref: {pos:28},
  lng: {beg:29, end:34},
  typ: {pos:34},
  dec: {beg:35, end:37},
  usg: {pos:37},
  lig: {beg:39, end:41},
  pos: {beg:42, end:44},
  att: {beg:44, end:80}
};

module.exports = {
  getDSN: getDSN,
  genCmdSys : genCmdSys,
  genListProfiles: genListProfiles,
  genListMembers: genListMembers,
  genOverlayDBFile: genOverlayDBFile,
  dropOverlayDBFile: dropOverlayDBFile,
  getEnvSysInfo: getEnvSysInfo,
  getTablesFromLib: getTablesFromLib,
  describe: describe,
  formatsDDS: formatsDDS,
  genAddPFM: genAddPFM,
  getAllObjects: getAllObjects,
  getAllMembersFromFile: getAllMembersFromFile,
  getAllMembersFromLib: getAllMembersFromLib,
  genPgmRef: genPgmRef,
  genDspDbr: genDspDbr,
  getSysDate: getSysDate,
  CvtRpgSrc: CvtRpgSrc
};
