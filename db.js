
const mysql = require('mysql2');
const util = require('util');

const conn = mysql.createPool({
    host: 'b8qruw7a2fwly78kjl5e-mysql.services.clever-cloud.com',
     user: 'u3tpdmqhlebcluir',
     password:'u3tpdmqhlebcluir',
     database: 'b8qruw7a2fwly78kjl5e',
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
