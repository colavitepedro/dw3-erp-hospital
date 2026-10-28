const apiBase = window.API_URL.replace(/\/$/, "");
async function requestAPI(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try { response = await fetch(`${apiBase}${path}`, { ...options, headers }); }
  catch { throw new Error("Não foi possível conectar à API. Confira se os serviços estão disponíveis."); }
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    localStorage.removeItem("token"); localStorage.removeItem("username"); window.location.assign("/login");
    throw new Error("Sessão encerrada. Entre novamente.");
  }
  if (!response.ok) throw new Error(data.message || (data.erros || []).join(" ") || "A operação não foi concluída.");
  return data;
}
const pacientesAPI = {
  GetAllPacientes: () => requestAPI("/getAllPacientes").then((r) => r.registro),
  GetPacienteByID: (id) => requestAPI(`/getPacienteByID/${encodeURIComponent(id)}`).then((r) => r.registro),
  InsertPaciente: (registro) => requestAPI("/insertPaciente", { method: "POST", body: JSON.stringify(registro) }),
  UpdatePaciente: (id, registro) => requestAPI(`/updatePaciente/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(registro) }),
  DeletePaciente: (id) => requestAPI(`/deletePaciente/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
const consultasAPI = {
  GetAllConsultas: () => requestAPI("/getAllConsultas").then((r) => r.registro),
  GetConsultaByID: (id) => requestAPI(`/getConsultaByID/${encodeURIComponent(id)}`).then((r) => r.registro),
  InsertConsulta: (registro) => requestAPI("/insertConsulta", { method: "POST", body: JSON.stringify(registro) }),
  UpdateConsulta: (id, registro) => requestAPI(`/updateConsulta/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(registro) }),
  DeleteConsulta: (id) => requestAPI(`/deleteConsulta/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}
window.hospitalAPI = { pacientesAPI, consultasAPI, escapeHTML };
