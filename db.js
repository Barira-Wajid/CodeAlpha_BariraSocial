const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

const isTiDB = Boolean(process.env.MYSQLHOST);

const dbConfig = {
    host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",

    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),

    user: process.env.MYSQLUSER || process.env.DB_USER || "root",

    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",

    database: process.env.MYSQLDATABASE || process.env.DB_NAME || "barira_social_db",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Secure connection for TiDB Cloud
if (isTiDB) {
    dbConfig.ssl = {
        ca: fs.readFileSync(
            path.join(__dirname, "isrgrootx1.pem"),
            "utf8"
        )
    };
}

const db = mysql.createPool(dbConfig);

db.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        return;
    }

    console.log("Database connected successfully!");
    connection.release();
});

module.exports = db;