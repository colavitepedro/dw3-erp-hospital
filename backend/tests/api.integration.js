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

async function removerRegistro(path, token) {
  const response = await requisicao(path, token, "DELETE");
  assert.equal(response.status, 200, `Não foi possível limpar o registro de teste em ${path}.`);
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

    const pacienteRemovido = await requisicao(`/deletePaciente/${pacienteId}`, token, "DELETE");
    assert.equal(pacienteRemovido.status, 200);
    pacienteId = null;
    const consultaAposRemocao = await requisicao("/insertConsulta", token, "POST", consultaDados);
    if (consultaAposRemocao.status === 201) {
      await removerRegistro(`/deleteConsulta/${consultaAposRemocao.data.registro.id}`, token);
    }
    assert.equal(consultaAposRemocao.status, 400);
  } finally {
    if (consultaId) await removerRegistro(`/deleteConsulta/${consultaId}`, token);
    if (pacienteId) await removerRegistro(`/deletePaciente/${pacienteId}`, token);
  }
});

test("preserva a integridade entre paciente e consulta", { skip: !enabled && "Defina RUN_INTEGRATION=1 com API e banco disponíveis." }, async () => {
  const db = require("../database/databaseconfig");
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  assert.ok(username && password, "Configure ADMIN_USERNAME e ADMIN_PASSWORD.");

  const login = await requisicao("/Login", null, "POST", { username, password });
  assert.equal(login.status, 200);
  const token = login.data.token;
  const sufixo = Date.now().toString().slice(-11);
  const esperarErroSQL = async (sql, valores, codigo, mensagem) => {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await assert.rejects(client.query(sql, valores), (error) => error.code === codigo, mensagem);
    } finally {
      await client.query("ROLLBACK").catch(() => {});
      client.release();
    }
  };
  let pacienteId;
  let consultaId;
  let consultaDependenteId;

  try {
    const dadosPaciente = {
      nome: `Paciente integridade ${sufixo}`, cpf: sufixo, data_nascimento: "1990-01-01",
      telefone: "17999990000", email: `integridade${sufixo}@example.com`,
    };
    const pacienteCriado = await requisicao("/insertPaciente", token, "POST", dadosPaciente);
    assert.equal(pacienteCriado.status, 201);
    pacienteId = pacienteCriado.data.registro.id;

    assert.equal((await requisicao("/insertPaciente", token, "POST", dadosPaciente)).status, 409);

    const dadosConsulta = {
      paciente_id: pacienteId, data_consulta: new Date().toISOString().slice(0, 10),
      especialidade: "Clínica geral", medico: "Profissional de teste", valor: 90.25,
      observacoes: "Validação da relação paciente-consulta",
    };
    const consultaCriada = await requisicao("/insertConsulta", token, "POST", dadosConsulta);
    assert.equal(consultaCriada.status, 201);
    consultaId = consultaCriada.data.registro.id;

    const fk = await db.query(
      "SELECT confdeltype FROM pg_constraint WHERE conrelid = 'consultas'::regclass AND contype = 'f' AND confrelid = 'pacientes'::regclass AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'consultas'::regclass AND attname = 'paciente_id')]::smallint[] AND confkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'pacientes'::regclass AND attname = 'id')]::smallint[]",
    );
    assert.equal(fk.rowCount, 1, "A relação consulta.paciente_id precisa ter uma chave estrangeira.");
    assert.notEqual(fk.rows[0].confdeltype, "c", "A exclusão física do paciente não deve apagar consultas em cascata.");

    await esperarErroSQL(
      "DELETE FROM pacientes WHERE id = $1",
      [pacienteId],
      "23503",
      "O banco deve impedir a exclusão física de paciente ainda referenciado.",
    );

    let pacienteIdInexistente;
    for (let tentativa = 0; tentativa < 100; tentativa += 1) {
      const proximoId = Number((await db.query("SELECT nextval('pacientes_id_seq') AS id")).rows[0].id);
      const existente = await db.query("SELECT 1 FROM pacientes WHERE id = $1", [proximoId]);
      if (!existente.rowCount) {
        pacienteIdInexistente = proximoId;
        break;
      }
    }
    assert.ok(pacienteIdInexistente, "O teste precisa reservar um ID de paciente inexistente.");
    const consultaPacienteInexistente = await requisicao("/insertConsulta", token, "POST", {
      ...dadosConsulta, paciente_id: pacienteIdInexistente,
    });
    assert.equal(consultaPacienteInexistente.status, 400);
    await esperarErroSQL(
      "INSERT INTO consultas (paciente_id, data_consulta, especialidade, medico, valor) VALUES ($1, CURRENT_DATE, 'Teste', 'Teste', 10)",
      [pacienteIdInexistente],
      "23503",
      "A chave estrangeira deve bloquear referências a pacientes inexistentes.",
    );
    await esperarErroSQL(
      "INSERT INTO consultas (paciente_id, data_consulta, especialidade, medico, valor) VALUES ($1, CURRENT_DATE, 'Teste', 'Teste', -1)",
      [pacienteId],
      "23514",
      "O banco deve rejeitar valores negativos mesmo fora da API.",
    );

    const consultaRelacionada = await requisicao("/insertConsulta", token, "POST", {
      ...dadosConsulta, paciente_id: pacienteId,
    });
    assert.equal(consultaRelacionada.status, 201);
    consultaDependenteId = consultaRelacionada.data.registro.id;

    assert.equal((await requisicao(`/deletePaciente/${pacienteId}`, token, "DELETE")).status, 200);
    pacienteId = null;
    assert.equal((await requisicao(`/updateConsulta/${consultaId}`, token, "PUT", dadosConsulta)).status, 400);
    assert.equal((await requisicao("/getConsultaByID/" + consultaDependenteId, token)).status, 404);
    const consultasVisiveis = await requisicao("/getAllConsultas", token);
    assert.equal(consultasVisiveis.data.registro.some((item) => String(item.id) === String(consultaDependenteId)), false);

    const registrosMantidos = await db.query(
      "SELECT c.removido AS consulta_removida, p.removido AS paciente_removido FROM consultas c JOIN pacientes p ON p.id = c.paciente_id WHERE c.id = $1",
      [consultaDependenteId],
    );
    assert.equal(registrosMantidos.rowCount, 1, "A exclusão lógica do paciente deve preservar o histórico relacionado.");
    assert.equal(registrosMantidos.rows[0].paciente_removido, true);
    assert.equal(registrosMantidos.rows[0].consulta_removida, false);

    const orfaos = await db.query(
      "SELECT COUNT(*)::int AS total FROM consultas c LEFT JOIN pacientes p ON p.id = c.paciente_id WHERE p.id IS NULL",
    );
    assert.equal(orfaos.rows[0].total, 0, "Não deve haver consultas sem paciente correspondente.");

    await removerRegistro(`/deleteConsulta/${consultaId}`, token);
    consultaId = null;
    await removerRegistro(`/deleteConsulta/${consultaDependenteId}`, token);
    consultaDependenteId = null;
  } finally {
    try {
      if (consultaId) await removerRegistro(`/deleteConsulta/${consultaId}`, token);
      if (consultaDependenteId) await removerRegistro(`/deleteConsulta/${consultaDependenteId}`, token);
      if (pacienteId) await removerRegistro(`/deletePaciente/${pacienteId}`, token);
    } finally {
      await db.end();
    }
  }
});
