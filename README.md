# DW3 · ERP Hospitalar

Sistema de gestão hospitalar para o 2º trabalho de Desenvolvimento Web III. O projeto implementa login com JWT e CRUD de pacientes e consultas, ligados por uma relação 1:N. A interface não acessa o banco diretamente: todas as operações passam pela API.

## Estrutura

- `backend/`: API Express, autenticação, validação e acesso PostgreSQL.
- `frontend/`: interface web Express/Nunjucks e funções cliente da API.
- `docker-compose.yml`: banco, API e interface em serviços separados.

## Preparar

1. Instale Docker e Docker Compose.
2. Copie o arquivo de exemplo e configure credenciais próprias:

   ```bash
   cp .env.example .env
   ```

   Troque `POSTGRES_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_USERNAME` e `ADMIN_PASSWORD`. Use o mesmo valor em `POSTGRES_PASSWORD` e `DB_PASSWORD`. A chave JWT precisa ter pelo menos 32 caracteres; a senha administrativa deve ter pelo menos 12.

3. Inicie os três serviços:

   ```bash
   docker compose up --build -d
   ```

   O esquema do banco é criado na primeira inicialização do volume.

4. Crie ou atualize a conta administrativa:

   ```bash
   docker compose exec api node backend/database/seedAdmin.js
   ```

5. Acesse `http://localhost:40100/login`. A API fica em `http://localhost:40000` e o endpoint de saúde em `/health`.

Para encerrar os serviços: `docker compose down`. Para também apagar os dados do banco: `docker compose down -v`.

## Entidades e regras

- **Pacientes:** nome, CPF, data de nascimento, telefone e e-mail.
- **Consultas:** paciente, data, especialidade, profissional, valor decimal e observações.
- Ambas as tabelas possuem `id` e `removido`. A exclusão lógica muda `removido` para `true`; listagens e buscas retornam apenas registros ativos. Consultas associadas a pacientes removidos não aparecem na listagem.
- Rotas de cadastro exigem `Authorization: Bearer <token>`. O endpoint `POST /Login` emite JWT após validar as credenciais.

## APIs

A API usa as cinco operações para cada entidade:

| Operação | Pacientes | Consultas |
|---|---|---|
| Listar | `GET /getAllPacientes` | `GET /getAllConsultas` |
| Buscar por ID | `GET /getPacienteByID/:id` | `GET /getConsultaByID/:id` |
| Inserir | `POST /insertPaciente` | `POST /insertConsulta` |
| Atualizar | `PUT /updatePaciente/:id` | `PUT /updateConsulta/:id` |
| Remover (lógico) | `DELETE /deletePaciente/:id` | `DELETE /deleteConsulta/:id` |

A interface inclui as funções correspondentes em `frontend/public/js/api.js`.

## Testes

Os testes unitários das validações usam o test runner nativo do Node.js e não iniciam servidor nem banco:

```bash
npm install
npm test
```

O arquivo `docker-compose.yml` apenas configura os serviços; nenhum container é iniciado automaticamente pelos testes.
