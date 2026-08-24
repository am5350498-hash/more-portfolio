var mysql = require('mysql2');
var util = require('util');

var conn = mysql.createConnection({
    host: 'bugpnyuot0dqbbwmtf38-mysql.services.clever-cloud.com',
    user: 'ufefbodntmh3jdtp',
    password: 'ufefbodntmh3jdtp',
    database: 'bugpnyuot0dqbbwmtf38'
});

var exe = util.promisify(conn.query).bind(conn);

module.exports = { conn, exe };
