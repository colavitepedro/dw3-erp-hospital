const { Pool } = require("pg");

const db = new Pool({
   host: process.env.DB_HOST || "127.0.0.1",
   port: Number(process.env.DB_PORT || 5432),
   database: process.env.DB_NAME || "dw3_hospital",
   user: process.env.DB_USER || "dw3_hospital",
   password: process.env.DB_PASSWORD || "dw3_hospital",
   max: 10,
   idleTimeoutMillis: 30000,
   connectionTimeoutMillis: 5000,
});

module.exports = db;
