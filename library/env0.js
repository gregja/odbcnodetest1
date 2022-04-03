// Parameters to connect Node on a DB2 instance for IBM i server
// TODO : configure your own environment by using that file as model
const path = require('path');

const config1 = {
  user: 'MYUSERNAME',
  pwd: 'MYPASSWORD',
  system: 'dev.myserver.com',
  dbq : 'MYDATABASE',
  exportPath: path.join(process.cwd(), '/exports/'),
  ccsid: '1208',  // UTF-8 encoding
  email: 'myemail@mydomain.com',
  wsurl: 'http://myserver.mydomain.com:8180'
}

module.exports = config1;
