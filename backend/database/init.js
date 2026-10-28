require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const fs = require("node:fs");
const path = require("node:path");
const db = require("./databaseconfig");

async function initializeDatabase() {
   await db.query(fs.readFileSync(path.join(__dirname, "databaseConfig.sql"), "utf8"));
   console.log("Estrutura do banco hospitalar preparada.");
}
initializeDatabase().catch((error) => {
   console.error(`Não foi possível preparar o banco: ${error.message}`);
   process.exitCode = 1;
}).finally(() => db.end());
