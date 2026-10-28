const test = require("node:test");
const assert = require("node:assert/strict");

const apiUrl = process.env.API_URL || "http://localhost:40000";
const enabled = process.env.RUN_INTEGRATION === "1";

async function requisicao(path, token, method = "GET", body) {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json().catch(() => ({})) };
}

test("API protege rotas e executa CRUD relacional com soft delete", { skip: !enabled && "Defina RUN_INTEGRATION=1 com API e banco disponíveis." }, async () => {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  assert.ok(username && password, "Configure ADMIN_USERNAME e ADMIN_PASSWORD.");

  const semToken = await requisicao("/getAllPacientes");
  assert.equal(semToken.status, 401);

  const login = await requisicao("/Login", null, "POST", { username, password });
  assert.equal(login.status, 200);
  assert.ok(login.data.token);
  const token = login.data.token;
  const sufixo = Date.now().toString().slice(-11);
  let pacienteId;
  let consultaId;

  try {
    const criadoPaciente = await requisicao("/insertPaciente", token, "POST", {
      nome: `Paciente teste ${sufixo}`, cpf: sufixo, data_nascimento: "1990-01-01",
      telefone: "17999990000", email: `teste${sufixo}@example.com`,
    });
    assert.equal(criadoPaciente.status, 201);
    pacienteId = criadoPaciente.data.registro.id;

    const paciente = await requisicao(`/getPacienteByID/${pacienteId}`, token);
    assert.equal(paciente.status, 200);

    const consultaDados = {
      paciente_id: pacienteId, data_consulta: new Date().toISOString().slice(0, 10),
      especialidade: "Clínica geral", medico: "Profissional teste", valor: 125.5, observacoes: "Teste de integração",
    };
    const criadaConsulta = await requisicao("/insertConsulta", token, "POST", consultaDados);
    assert.equal(criadaConsulta.status, 201);
    consultaId = criadaConsulta.data.registro.id;

    assert.equal((await requisicao("/getConsultaByID/999999999", token)).status, 404);
    assert.equal((await requisicao(`/getConsultaByID/${consultaId}`, token)).status, 200);
    assert.equal((await requisicao(`/updateConsulta/${consultaId}`, token, "PUT", { ...consultaDados, valor: 130 })).status, 200);

    assert.equal((await requisicao(`/deleteConsulta/${consultaId}`, token, "DELETE")).status, 200);
    consultaId = null;
    assert.equal((await requisicao(`/getConsultaByID/${criadaConsulta.data.registro.id}`, token)).status, 404);

    assert.equal((await requisicao(`/deletePaciente/${pacienteId}`, token, "DELETE")).status, 200);
    assert.equal((await requisicao(`/insertConsulta`, token, "POST", consultaDados)).status, 400);
    pacienteId = null;
  } finally {
    if (consultaId) await requisicao(`/deleteConsulta/${consultaId}`, token, "DELETE").catch(() => {});
    if (pacienteId) await requisicao(`/deletePaciente/${pacienteId}`, token, "DELETE").catch(() => {});
  }
});
