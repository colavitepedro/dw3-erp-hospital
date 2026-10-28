const campos = {
   pacientes: {
      nome: (v) => typeof v === "string" && v.trim().length >= 2 && v.trim().length <= 120,
      cpf: (v) => typeof v === "string" && /^[0-9.\/-]{11,14}$/.test(v.trim()),
      data_nascimento: dataValida,
      telefone: (v) => typeof v === "string" && v.trim().length >= 6 && v.trim().length <= 30,
      email: (v) => typeof v === "string" && v.trim().length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
   },
   consultas: {
      paciente_id: (v) => (typeof v === "number" || typeof v === "string") && /^[0-9]+$/.test(String(v)) && Number.isSafeInteger(Number(v)) && Number(v) > 0,
      data_consulta: dataValida,
      especialidade: (v) => typeof v === "string" && v.trim().length >= 2 && v.trim().length <= 100,
      medico: (v) => typeof v === "string" && v.trim().length >= 2 && v.trim().length <= 120,
      valor: (v) => (typeof v === "number" || typeof v === "string") && /^[0-9]{1,8}(?:[.][0-9]{1,2})?$/.test(String(v)) && Number.isFinite(Number(v)),
      observacoes: (v) => v === undefined || (typeof v === "string" && v.length <= 2000),
   },
};

function dataValida(valor) {
   if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
   const data = new Date(`${valor}T00:00:00Z`);
   return !Number.isNaN(data.valueOf()) && data.toISOString().slice(0, 10) === valor;
}

function validarRegistro(tipo, registro) {
   const regras = campos[tipo];
   if (!regras || !registro || typeof registro !== "object" || Array.isArray(registro)) return ["Dados inválidos."];
   const erros = [];
   for (const [campo, valida] of Object.entries(regras)) {
      if (!valida(registro[campo])) erros.push(`Campo inválido: ${campo}.`);
   }
   return erros;
}

function validarId(valor) {
   if (typeof valor !== "string" && typeof valor !== "number") return null;
   const texto = String(valor);
   if (!/^[0-9]+$/.test(texto)) return null;
   const id = Number(texto);
   return Number.isSafeInteger(id) && id > 0 ? id : null;
}

module.exports = { validarRegistro, validarId };
