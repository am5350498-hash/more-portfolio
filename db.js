
const mysql = require('mysql2');
const util = require('util');

const conn = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'alex_rivera',
    port: Number(process.env.DB_PORT) || 3306,

    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

const exe = util.promisify(conn.query).bind(conn);

conn.getConnection((err, connection) => {
    if (err) {
        console.log('❌ Database Connection Error:', err.message);
        return;
    }

    console.log('✅ MySQL Connected Successfully');
    connection.release();
});

module.exports = { conn, exe };
