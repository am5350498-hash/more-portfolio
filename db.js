const mysql = require('mysql2');

const conn = mysql.createPool({
    host: process.env.DB_HOST || 'bugpnyuot0dqbbwmtf38-mysql.services.clever-cloud.com',
    user: process.env.DB_USER || 'ufefbodntmh3jdtp',
    password: process.env.DB_PASSWORD || '6BxMCjK9mLhV6xPVoCV7',
    database: process.env.DB_NAME || 'bugpnyuot0dqbbwmtf38',
    port: Number(process.env.DB_PORT) || 3306,

    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

function exe(sql, params = []) {
    return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

conn.getConnection((err, connection) => {
    if (err) {
        console.log('Database Connection Error:', err.message);
        return;
    }

    console.log('✅ MySQL Connected Successfully');
    connection.release();
});

module.exports = { conn, exe };
