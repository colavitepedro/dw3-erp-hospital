const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../../../database/databaseconfig");

async function Login(req, res, next) {
   try {
      const { username, password } = req.body || {};
      if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
         return res.status(400).json({ auth: false, message: "Informe usuário e senha." });
      }
      const resultado = await db.query("SELECT id, username, password_hash FROM usuarios WHERE username = $1", [username.trim()]);
      const usuario = resultado.rows[0];
      if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
         return res.status(401).json({ auth: false, message: "Usuário ou senha inválidos." });
      }
      const token = jwt.sign({ id: usuario.id, username: usuario.username }, process.env.JWT_SECRET, { expiresIn: "2h" });
      return res.json({ auth: true, token, username: usuario.username });
   } catch (error) {
      return next(error);
   }
}

module.exports = { Login };
