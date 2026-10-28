const root = document.querySelector(".app-shell");
const modulo = root.dataset.modulo;
const api = window.hospitalAPI[modulo === "pacientes" ? "pacientesAPI" : "consultasAPI"];
const singular = modulo === "pacientes" ? "Paciente" : "Consulta";
const config = modulo === "pacientes" ? {
  campos: [
    ["nome", "Nome completo", "text", true], ["cpf", "CPF", "text", true],
    ["data_nascimento", "Data de nascimento", "date", true], ["telefone", "Telefone", "tel", true], ["email", "E-mail", "email", true],
  ],
  colunas: [["nome", "Paciente"], ["cpf", "CPF"], ["data_nascimento", "Nascimento", "date"], ["telefone", "Telefone"], ["email", "E-mail"]],
  listar: api.GetAllPacientes, buscar: api.GetPacienteByID, inserir: api.InsertPaciente, atualizar: api.UpdatePaciente, excluir: api.DeletePaciente,
} : {
  campos: [
    ["paciente_id", "Paciente", "select", true], ["data_consulta", "Data da consulta", "date", true],
    ["especialidade", "Especialidade", "text", true], ["medico", "Profissional responsável", "text", true],
    ["valor", "Valor (R$)", "number", true], ["observacoes", "Observações", "textarea", false],
  ],
  colunas: [["paciente_nome", "Paciente"], ["data_consulta", "Data", "date"], ["especialidade", "Especialidade"], ["medico", "Profissional"], ["valor", "Valor", "currency"]],
  listar: api.GetAllConsultas, buscar: api.GetConsultaByID, inserir: api.InsertConsulta, atualizar: api.UpdateConsulta, excluir: api.DeleteConsulta,
};
const $ = (selector) => document.querySelector(selector);
let editandoId = null;
const alertar = (texto, tipo = "error") => { const el = $("#mensagem"); el.className = `notice notice-${tipo}`; el.textContent = texto; el.hidden = false; };
const esconderAlerta = () => { $("#mensagem").hidden = true; };
function dataBR(value) { if (!value) return "—"; const [y,m,d] = String(value).slice(0,10).split("-"); return `${d}/${m}/${y}`; }
function moeda(value) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value)); }
function renderHead() { $("#cabecalho-tabela").innerHTML = `<tr>${config.colunas.map(([, title]) => `<th>${title}</th>`).join("")}<th class="align-right">Ações</th></tr>`; }
function display(value, tipo) { if (tipo === "date") return dataBR(value); if (tipo === "currency") return moeda(value); return window.hospitalAPI.escapeHTML(value || "—"); }
async function carregar() {
  esconderAlerta();
  try {
    const registros = await config.listar();
    $("#total-registros").textContent = `${registros.length} ${registros.length === 1 ? "registro" : "registros"}`;
    $("#corpo-tabela").innerHTML = registros.length ? registros.map((item) => `<tr>${config.colunas.map(([key,,type]) => `<td>${display(item[key],type)}</td>`).join("")}<td class="align-right actions"><button class="table-action" data-editar="${item.id}">Editar</button><button class="table-action danger" data-excluir="${item.id}">Remover</button></td></tr>`).join("") : `<tr><td class="table-state" colspan="${config.colunas.length + 1}">Nenhum registro ativo encontrado.</td></tr>`;
  } catch (error) { $("#corpo-tabela").innerHTML = `<tr><td class="table-state">Não foi possível carregar os registros.</td></tr>`; alertar(error.message); }
}
async function montarCampos(registro = {}) {
  const pacientes = modulo === "consultas" ? await window.hospitalAPI.pacientesAPI.GetAllPacientes() : [];
  $("#campos-form").innerHTML = config.campos.map(([key,label,type,required]) => {
    const val = registro[key] ?? "";
    let input;
    if (type === "select") input = `<select id="campo-${key}" name="${key}" required><option value="">Selecione</option>${pacientes.map((p) => `<option value="${p.id}" ${String(val) === String(p.id) ? "selected" : ""}>${window.hospitalAPI.escapeHTML(p.nome)} · ${window.hospitalAPI.escapeHTML(p.cpf)}</option>`).join("")}</select>`;
    else if (type === "textarea") input = `<textarea id="campo-${key}" name="${key}" rows="3" maxlength="2000">${window.hospitalAPI.escapeHTML(val)}</textarea>`;
    else input = `<input id="campo-${key}" name="${key}" type="${type}" ${type === "number" ? 'min="0" step="0.01"' : ""} ${required ? "required" : ""} value="${window.hospitalAPI.escapeHTML(val)}">`;
    return `<label for="campo-${key}">${label}</label>${input}`;
  }).join("");
}
async function abrirModal(id = null) {
  esconderAlerta(); editandoId = id;
  try {
    const registro = id ? await config.buscar(id) : {};
    await montarCampos(registro);
    $("#titulo-modal").textContent = id ? `Editar ${singular.toLowerCase()}` : `Novo ${singular.toLowerCase()}`;
    $("#modal-registro").hidden = false;
    $("#campos-form input, #campos-form select, #campos-form textarea").item(0)?.focus();
  } catch (error) { alertar(error.message); }
}
$("#novo-registro").addEventListener("click", () => abrirModal());
$("#logout").addEventListener("click", () => { localStorage.removeItem("token"); localStorage.removeItem("username"); window.location.assign("/login"); });
$("#usuario-atual").textContent = localStorage.getItem("username") || "";
document.querySelectorAll("[data-fechar]").forEach((el) => el.addEventListener("click", () => { $("#modal-registro").hidden = true; }));
$("#corpo-tabela").addEventListener("click", async (event) => {
  const edit = event.target.closest("[data-editar]"); const remove = event.target.closest("[data-excluir]");
  if (edit) await abrirModal(edit.dataset.editar);
  if (remove && window.confirm(`Remover este registro? Ele ficará marcado como removido.`)) {
    try { await config.excluir(remove.dataset.excluir); alertar(`${singular} removido.`, "success"); await carregar(); }
    catch (error) { alertar(error.message); }
  }
});
$("#form-registro").addEventListener("submit", async (event) => {
  event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
  if (modulo === "consultas") { data.paciente_id = Number(data.paciente_id); data.valor = Number(data.valor); }
  const erro = $("#erro-form"); erro.hidden = true;
  try {
    if (editandoId) await config.atualizar(editandoId, data); else await config.inserir(data);
    $("#modal-registro").hidden = true; alertar(`${singular} salvo com sucesso.`, "success"); await carregar();
  } catch (error) { erro.textContent = error.message; erro.hidden = false; }
});
renderHead(); carregar();
