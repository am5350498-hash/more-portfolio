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
    host: 'bx9tsc7z3jzn2peksvfn-mysql.services.clever-cloud.com',
     user: 'GiRUGVN1n2hObbvrGtuG',
     password:'29ox0cwWp4IzHNFjJhIn',
     database: 'bx9tsc7z3jzn2peksvfn',
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
