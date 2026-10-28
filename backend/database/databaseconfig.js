const { Pool } = require("pg");

function requiredEnv(name) {
   const value = process.env[name]?.trim();
   if (!value || /^CHANGE_ME/i.test(value)) throw new Error(`${name} ausente ou ainda contém o valor de exemplo.`);
   return value;
}

const db = new Pool({
   host: requiredEnv("DB_HOST"),
   port: Number(process.env.DB_PORT || 5432),
   database: requiredEnv("DB_NAME"),
   user: requiredEnv("DB_USER"),
   password: requiredEnv("DB_PASSWORD"),
   max: 10,
   idleTimeoutMillis: 30000,
   connectionTimeoutMillis: 5000,
});

module.exports = db;
