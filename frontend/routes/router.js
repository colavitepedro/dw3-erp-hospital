const express = require("express");
const router = express.Router();
router.get("/", (req, res) => res.redirect("/login"));
router.get("/login", (req, res) => res.render("login", { apiUrl: process.env.API_URL || "http://localhost:40000" }));
router.get("/pacientes", (req, res) => res.render("cadastro", { title: "Pacientes", modulo: "pacientes", apiUrl: process.env.API_URL || "http://localhost:40000" }));
router.get("/consultas", (req, res) => res.render("cadastro", { title: "Consultas", modulo: "consultas", apiUrl: process.env.API_URL || "http://localhost:40000" }));
module.exports = router;
