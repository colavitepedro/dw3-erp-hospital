const db = require("../database/databaseconfig");
const { validarId, validarRegistro } = require("../utils/validacao");

const configuracoes = {
   pacientes: {
      tabela: "pacientes", campos: ["nome", "cpf", "data_nascimento", "telefone", "email"],
      select: "id, nome, cpf, TO_CHAR(data_nascimento, 'YYYY-MM-DD') AS data_nascimento, telefone, email, removido",
      ordenar: "nome, id",
   },
   consultas: {
      tabela: "consultas", campos: ["paciente_id", "data_consulta", "especialidade", "medico", "valor", "observacoes"],
      select: "c.id, c.paciente_id, p.nome AS paciente_nome, TO_CHAR(c.data_consulta, 'YYYY-MM-DD') AS data_consulta, c.especialidade, c.medico, c.valor, c.observacoes, c.removido",
      ordenar: "c.data_consulta DESC, c.id DESC",
   },
};

function tabela(tipo) {
   const config = configuracoes[tipo];
   if (!config) throw new Error("Tipo de cadastro inválido.");
   return config;
}

function from(tipo) {
   return tipo === "consultas" ? "consultas c INNER JOIN pacientes p ON p.id = c.paciente_id" : "pacientes";
}

function where(tipo) {
   return tipo === "consultas" ? "c.removido = FALSE AND p.removido = FALSE" : "removido = FALSE";
}

async function GetAll(tipo) {
   const c = tabela(tipo);
   const result = await db.query(`SELECT ${c.select} FROM ${from(tipo)} WHERE ${where(tipo)} ORDER BY ${c.ordenar}`);
   return result.rows;
}

async function GetByID(tipo, rawId) {
   const id = validarId(rawId);
   if (!id) return { erro: "id" };
   const c = tabela(tipo);
   const campoId = tipo === "consultas" ? "c.id" : "id";
   const result = await db.query(`SELECT ${c.select} FROM ${from(tipo)} WHERE ${campoId} = $1 AND ${where(tipo)}`, [id]);
   return result.rows[0] || null;
}

async function pacienteAtivo(pacienteId) {
   const result = await db.query("SELECT 1 FROM pacientes WHERE id = $1 AND removido = FALSE", [pacienteId]);
   return result.rowCount > 0;
}

async function Insert(tipo, registro) {
   const c = tabela(tipo);
   const erros = validarRegistro(tipo, registro);
   if (erros.length) return { erros };
   if (tipo === "consultas" && !(await pacienteAtivo(registro.paciente_id))) return { pacienteInativo: true };
   const values = c.campos.map((campo) => registro[campo] === undefined ? "" : registro[campo]);
   const placeholders = c.campos.map((_, i) => `$${i + 1}`).join(", ");
   const result = await db.query(`INSERT INTO ${c.tabela} (${c.campos.join(", ")}) VALUES (${placeholders}) RETURNING id`, values);
   return { id: result.rows[0].id };
}

async function Update(tipo, rawId, registro) {
   const id = validarId(rawId);
   if (!id) return { erro: "id" };
   const c = tabela(tipo);
   const erros = validarRegistro(tipo, registro);
   if (erros.length) return { erros };
   if (tipo === "consultas" && !(await pacienteAtivo(registro.paciente_id))) return { pacienteInativo: true };
   const assignments = c.campos.map((field, i) => `${field} = $${i + 2}`).join(", ");
   const values = c.campos.map((campo) => registro[campo] === undefined ? "" : registro[campo]);
   const result = await db.query(`UPDATE ${c.tabela} SET ${assignments} WHERE id = $1 AND removido = FALSE`, [id, ...values]);
   return { linhasAfetadas: result.rowCount };
}

async function Delete(tipo, rawId) {
   const id = validarId(rawId);
   if (!id) return { erro: "id" };
   const c = tabela(tipo);
   const result = await db.query(`UPDATE ${c.tabela} SET removido = TRUE WHERE id = $1 AND removido = FALSE`, [id]);
   return { linhasAfetadas: result.rowCount };
}

module.exports = { GetAll, GetByID, Insert, Update, Delete };
