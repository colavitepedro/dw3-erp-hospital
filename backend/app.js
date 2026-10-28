require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const db = require("./database/databaseconfig");
const router = require("./routes/router");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || /^CHANGE_ME/i.test(process.env.JWT_SECRET)) throw new Error("JWT_SECRET precisa ser próprio, aleatório e ter pelo menos 32 caracteres.");
const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "32kb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, standardHeaders: "draft-7", legacyHeaders: false }));
app.use((req, res, next) => {
   res.header("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "http://localhost:40100");
   res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization");
   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
   if (req.method === "OPTIONS") return res.sendStatus(204);
   return next();
});
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/", router);
app.use((error, req, res, next) => {
   if (res.headersSent) return next(error);
   if (error.code === "23503") return res.status(400).json({ status: "erro", message: "Paciente informado não existe ou foi removido." });
   if (error.code === "23505") return res.status(409).json({ status: "erro", message: "O CPF informado já está cadastrado." });
   if (error.code === "23514" || error.code === "22P02") return res.status(400).json({ status: "erro", message: "Confira os dados informados." });
   console.error(error.message);
   return res.status(500).json({ status: "erro", message: "Não foi possível concluir a solicitação." });
});

const server = app.listen(Number(process.env.API_PORT || 40000), () => console.log(`API hospitalar disponível na porta ${process.env.API_PORT || 40000}.`));
async function encerrar() {
   server.close(async () => { await db.end(); process.exit(0); });
}
process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);
module.exports = app;
