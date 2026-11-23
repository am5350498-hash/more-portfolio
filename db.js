const mysql = require('mysql2');

const db = mysql.createPool({
    host:'bugpnyuot0dqbbwmtf38-mysql.services.clever-cloud.com',
    user:'ufefbodntmh3jdtp',
    password: 'ufefbodntmh3jdtp',
    database: 'bugpnyuot0dqbbwmtf38',
    port:  3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.log("❌ MySQL Connection Failed:", err.message);
    } else {
        console.log("✅ MySQL Connected Successfully");
        connection.release();
    }
});

module.exports = db;
