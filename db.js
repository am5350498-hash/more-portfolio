const mysql = require('mysql2');

const db = mysql.createPool({
    host:'b8qruw7a2fwly78kjl5e-mysql.services.clever-cloud.com',
    user:'u3tpdmqhlebcluir',
    password: 'u3tpdmqhlebcluir',
    database: 'b8qruw7a2fwly78kjl5e',
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
