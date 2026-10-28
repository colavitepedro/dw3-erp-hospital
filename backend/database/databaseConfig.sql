CREATE TABLE IF NOT EXISTS usuarios (
   id BIGSERIAL PRIMARY KEY,
   username VARCHAR(80) NOT NULL UNIQUE,
   password_hash TEXT NOT NULL,
   criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pacientes (
   id BIGSERIAL PRIMARY KEY,
   nome VARCHAR(120) NOT NULL,
   cpf VARCHAR(14) NOT NULL UNIQUE,
   data_nascimento DATE NOT NULL,
   telefone VARCHAR(30) NOT NULL,
   email VARCHAR(160) NOT NULL,
   removido BOOLEAN NOT NULL DEFAULT FALSE,
   criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consultas (
   id BIGSERIAL PRIMARY KEY,
   paciente_id BIGINT NOT NULL REFERENCES pacientes(id),
   data_consulta DATE NOT NULL,
   especialidade VARCHAR(100) NOT NULL,
   medico VARCHAR(120) NOT NULL,
   valor NUMERIC(10, 2) NOT NULL CHECK (valor >= 0),
   observacoes VARCHAR(2000) NOT NULL DEFAULT '',
   removido BOOLEAN NOT NULL DEFAULT FALSE,
   criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS consultas_paciente_id_idx ON consultas(paciente_id);
CREATE INDEX IF NOT EXISTS consultas_data_consulta_idx ON consultas(data_consulta);
