const express = require("express");
const { Login } = require("../apps/login/controller/ctlLogin");
const crud = require("../apps/crud");
const AutenticaJWT = require("../middleware/autenticaJWT");
const router = express.Router();

router.post("/Login", Login);
router.use(AutenticaJWT);

for (const [tipo, singular] of [["pacientes", "Paciente"], ["consultas", "Consulta"]]) {
   router.get(`/getAll${tipo[0].toUpperCase()}${tipo.slice(1)}`, async (req, res, next) => {
      try { res.json({ status: "ok", registro: await crud.GetAll(tipo) }); } catch (error) { next(error); }
   });
   router.get(`/get${singular}ByID/:id`, async (req, res, next) => {
      try {
         const registro = await crud.GetByID(tipo, req.params.id);
         if (registro?.erro) return res.status(400).json({ status: "erro", message: "ID inválido." });
         if (!registro) return res.status(404).json({ status: "erro", message: `${singular} não encontrado(a).` });
         return res.json({ status: "ok", registro });
      } catch (error) { return next(error); }
   });
   router.post(`/insert${singular}`, async (req, res, next) => {
      try {
         const result = await crud.Insert(tipo, req.body);
         if (result.pacienteInativo) return res.status(400).json({ status: "erro", message: "Selecione um paciente ativo para a consulta." });
         if (result.erros) return res.status(400).json({ status: "erro", erros: result.erros });
         return res.status(201).json({ status: "ok", registro: result });
      } catch (error) { return next(error); }
   });
   router.put(`/update${singular}/:id`, async (req, res, next) => {
      try {
         const result = await crud.Update(tipo, req.params.id, req.body);
         if (result.pacienteInativo) return res.status(400).json({ status: "erro", message: "Selecione um paciente ativo para a consulta." });
         if (result.erro) return res.status(400).json({ status: "erro", message: "ID inválido." });
         if (result.erros) return res.status(400).json({ status: "erro", erros: result.erros });
         if (!result.linhasAfetadas) return res.status(404).json({ status: "erro", message: `${singular} não encontrado(a).` });
         return res.json({ status: "ok", linhasAfetadas: result.linhasAfetadas });
      } catch (error) { return next(error); }
   });
   router.delete(`/delete${singular}/:id`, async (req, res, next) => {
      try {
         const result = await crud.Delete(tipo, req.params.id);
         if (result.erro) return res.status(400).json({ status: "erro", message: "ID inválido." });
         if (!result.linhasAfetadas) return res.status(404).json({ status: "erro", message: `${singular} não encontrado(a).` });
         return res.json({ status: "ok", linhasAfetadas: result.linhasAfetadas });
      } catch (error) { return next(error); }
   });
}

module.exports = router;
