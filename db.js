// var mysql = require('mysql2');
// var util = require('util');

// var conn = mysql.createConnection({
//     host: "localhost",
//     user: 'root',
//     password: 'root',
//     database: 'alex_rivera',
//     port:3306
// });

// var exe = util.promisify(conn.query).bind(conn);

// module.exports = { conn, exe };


const mysql = require('mysql2');
const util = require('util');

const conn = mysql.createPool({
    host: 'bugpnyuot0dqbbwmtf38-mysql.services.clever-cloud.com',
    user: 'ufefbodntmh3jdtp',
    password:'ufefbodntmh3jdtp',
    database: 'bugpnyuot0dqbbwmtf38',
    port: 3306,

    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

const exe = util.promisify(conn.query).bind(conn);

conn.getConnection((err, connection) => {
    if (err) {
        console.log('Database Connection Error:', err.message);
        return;
    }

    console.log('✅ MySQL Connected Successfully');
    connection.release();
});

module.exports = { conn, exe };
