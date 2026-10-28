require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const bcrypt = require("bcryptjs");
const db = require("./databaseconfig");

async function seedAdmin() {
   const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
   if (!ADMIN_USERNAME || !ADMIN_PASSWORD || /^CHANGE_ME/i.test(ADMIN_USERNAME) || /^CHANGE_ME/i.test(ADMIN_PASSWORD) || ADMIN_PASSWORD.length < 12) {
      throw new Error("Defina ADMIN_USERNAME e ADMIN_PASSWORD próprios; a senha precisa ter pelo menos 12 caracteres.");
   }
   const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
   await db.query("INSERT INTO usuarios (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash", [ADMIN_USERNAME, hash]);
   console.log("Usuário administrativo preparado.");
}
seedAdmin().catch((error) => {
   console.error(`Não foi possível preparar o usuário: ${error.message}`);
   process.exitCode = 1;
}).finally(() => db.end());
