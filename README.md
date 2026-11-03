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

   Troque `POSTGRES_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_USERNAME` e `ADMIN_PASSWORD`. Use o mesmo valor em `POSTGRES_PASSWORD` e `DB_PASSWORD`. A chave JWT precisa ter pelo menos 32 caracteres; a senha administrativa deve ter pelo menos 12. O projeto rejeita valores de exemplo que começam com `CHANGE_ME`. O container da interface recebe apenas `WEB_PORT` e `API_URL`; credenciais do banco e da API ficam restritas ao serviço da API.

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
- Ambas as tabelas possuem `id` e `removido`. A exclusão lógica muda `removido` para `true`; listagens e buscas retornam apenas os registros ativos. As APIs de listagem e consulta por ID retornam os campos de cada tabela, inclusive `criado_em`. Consultas associadas a pacientes removidos não aparecem na listagem, mas seu histórico é preservado.
- A relação `consultas.paciente_id` tem chave estrangeira para `pacientes.id`. Não há exclusão física em cascata: o banco impede remover um paciente ainda referenciado, evitando apagar o histórico das consultas.
- Rotas de cadastro exigem `Authorization: Bearer JWT`. O endpoint `POST /Login` emite JWT após validar as credenciais.

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

O teste de integração valida login, proteção por token, CRUD e integridade entre pacientes e consultas. Ele precisa da API e do banco ativos e deve rodar dentro do container da API, que já recebe as variáveis de conexão:

```bash
docker compose exec -T \
  -e RUN_INTEGRATION=1 \
  api sh -c 'API_URL=http://127.0.0.1:${API_PORT:-40000} node --test backend/tests/api.integration.js'
```

Além do fluxo completo de CRUD das duas entidades e da presença de todos os campos em listagem/busca, a integração verifica CPF duplicado, chave estrangeira apontando para `pacientes.id`, rejeição de referência inexistente, bloqueio de exclusão física do paciente com consultas, preservação do histórico na exclusão lógica, consultas ocultas quando o paciente é removido, ausência de órfãos e a restrição de valores negativos diretamente no banco.

Os testes unitários (`npm test`) rodam sem servidor ou banco. Se o teste de integração for chamado sem `RUN_INTEGRATION=1`, os cenários são ignorados.
