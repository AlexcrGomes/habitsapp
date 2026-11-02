# CLAUDE.md — Habits

App de rastreamento de hábitos com contas de usuário. Três contêineres orquestrados por
Docker Compose (rodando no WSL):

| Serviço | Pasta | Stack |
|---------|-------|-------|
| `web` | `web/` | React + TypeScript (Vite), servido por Nginx, que também faz proxy de `/api` |
| `api` | `api/` | Java 21 + Spring Boot 3.5 (Maven), sessão Spring Session JDBC, Flyway |
| `db`  | —      | PostgreSQL 17 (volume `pgdata`) |

## Como rodar e testar

```bash
cp .env.example .env          # uma vez; troque a senha do banco
docker compose up --build     # no WSL; app em http://localhost:8080
scripts/api-mvn.sh verify     # testes da API (Maven em contêiner + Testcontainers)
cd web && npm test            # testes do frontend (Vitest)
```

- `.claude/launch.json` sobe o compose para o navegador embutido.
- A API também fica em `127.0.0.1:8081` para `npm run dev` no `web/` (proxy do Vite).
- No PowerShell, argumentos `-D…` do Maven precisam de aspas: `'-Dit.test=AuthIT'`.

## Metodologia: Spec Driven Development (GitHub Spec Kit)

Este repositório segue SDD. Guia completo: [`docs/sdd-guia.md`](docs/sdd-guia.md).

| O quê | Onde |
|-------|------|
| Constituição (princípios obrigatórios) | `.specify/memory/constitution.md` |
| Templates | `.specify/templates/{spec,plan,tasks}-template.md` |
| Specs de features | `specs/NNN-nome/{spec,plan,tasks}.md` |

### Regras

1. **Leia a constituição** antes de propor qualquer mudança. Ela prevalece sobre qualquer
   outro documento.
2. **Nenhuma implementação sem spec Aprovada.** Se o pedido não tiver spec, crie a spec
   primeiro (a partir do template) e pare para aprovação.
3. **Ordem obrigatória**: `spec.md` → clarificação → aprovação → `plan.md` → `tasks.md` →
   implementação → verificação. Não pule fases nem escreva plan/tasks de spec em Rascunho.
4. **Spec = o quê/por quê** (sem tecnologia). **Plan = como.**
5. **Não invente respostas**: dúvidas viram `[NEEDS CLARIFICATION: …]` e são perguntadas ao
   usuário; decisões vão para a tabela **Clarificações** da spec.
6. Todo `plan.md` tem **Constitution Check** preenchido; violações só com justificativa em
   **Complexity Tracking**.
7. Ao implementar, siga o `tasks.md` na ordem e marque `[x]` em cada tarefa concluída. Se
   algo não previsto surgir, pare e atualize spec/plan.
8. Antes de marcar a spec como **Implementada**: testes automatizados verdes (API e web) **e**
   checklist de verificação manual da feature no navegador.
9. Mantenha atualizada a tabela "Specs existentes" em `docs/sdd-guia.md`.
10. **Dados isolados por usuário**: toda consulta filtra pelo usuário da sessão; recurso de
    outro usuário responde 404; toda rota nova que acessa dados ganha caso em `IsolationIT`.
11. **Esquema só por migração Flyway nova** (`api/src/main/resources/db/migration/`); nunca
    edite uma migração já aplicada.
12. **Segredos fora do git**: `.env` é ignorado; atualize `.env.example` sem valores reais.

### Convenções

- Numeração `NNN` sequencial; pasta e branch `NNN-nome-em-kebab-case`.
- IDs: histórias `US1`, requisitos `RF-001`/`RC-001`, sucesso `CS-001`, tarefas `T001`,
  débitos `D-01`.
- Documentação, textos da interface, mensagens de erro da API e mensagens de commit em **pt-BR**.
- Erros da API: `{ code, message, fields?, habitId? }` — `code` estável para o frontend,
  `message` para o usuário.
- Versões de dependências e imagens sempre fixas (Princípio II).
