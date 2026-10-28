const test = require("node:test");
const assert = require("node:assert/strict");
const { validarId, validarRegistro } = require("../utils/validacao");

test("aceita paciente com campos válidos", () => {
  assert.deepEqual(validarRegistro("pacientes", {
    nome: "Ana Souza", cpf: "123.456.789-00", data_nascimento: "1990-05-22",
    telefone: "17999990000", email: "ana@example.com",
  }), []);
});

test("rejeita data inexistente no cadastro de paciente", () => {
  const erros = validarRegistro("pacientes", {
    nome: "Ana Souza", cpf: "123.456.789-00", data_nascimento: "2025-02-30",
    telefone: "17999990000", email: "ana@example.com",
  });
  assert.deepEqual(erros, ["Campo inválido: data_nascimento."]);
});

test("aceita consulta ligada a paciente e valor decimal", () => {
  assert.deepEqual(validarRegistro("consultas", {
    paciente_id: 12, data_consulta: "2026-10-28", especialidade: "Cardiologia",
    medico: "Dra. Lima", valor: 180.5, observacoes: "Retorno",
  }), []);
});

test("rejeita consulta sem paciente ou com valor negativo", () => {
  const erros = validarRegistro("consultas", {
    paciente_id: 0, data_consulta: "2026-10-28", especialidade: "Cardiologia",
    medico: "Dra. Lima", valor: -1,
  });
  assert.deepEqual(erros, ["Campo inválido: paciente_id.", "Campo inválido: valor."]);
});

test("rejeita IDs de paciente em notação exponencial", () => {
  const erros = validarRegistro("consultas", {
    paciente_id: "1e2", data_consulta: "2026-10-28", especialidade: "Cardiologia",
    medico: "Dra. Lima", valor: 18.5,
  });
  assert.deepEqual(erros, ["Campo inválido: paciente_id."]);
});

test("valida IDs positivos inteiros sem coerção de formatos parciais", () => {
  assert.equal(validarId("15"), 15);
  assert.equal(validarId("1e2"), null);
  assert.equal(validarId("0"), null);
  assert.equal(validarId("abc"), null);
});
