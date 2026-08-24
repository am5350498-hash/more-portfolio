var mysql = require('mysql2');
var util = require('util');

var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'alex_rivera'
});

var exe = util.promisify(conn.query).bind(conn);

module.exports = { conn, exe };
