# Tarefas: Atualizar dependências vulneráveis

**Branch**: `007-atualizar-dependencias` | **Entradas**: [spec.md](./spec.md), [plan.md](./plan.md)

> Formato: `- [ ] T001 [P] [US1] Descrição — arquivo`. Marque `[x]` ao concluir.

Histórias: **US1** servidor sem falhas exploráveis · **US2** ferramentas de teste ·
**US3** nada quebra · **US4** imagens Docker.

---

## Fase 1 — API (US1)

- [x] T001 [US1] Sobrescrever `tomcat.version` 10.1.61, `jackson-bom.version` 2.21.8, `postgresql.version` 42.7.14 e `log4j2.version` 2.25.5 — `api/pom.xml`
- [x] T002 [US1] Conferir com `dependency:list` que as versões efetivas são as novas — `api/`
- [x] T003 [US3] `scripts/api-mvn.sh verify` verde
- [x] **Checkpoint**: consulta OSV das dependências de execução mostra só as 2 falhas do Spring MVC

## Fase 2 — Frontend (US2)

- [x] T004 [P] [US2] `vitest` 5.0.5 em `package.json`; regenerar `package-lock.json` no WSL — `web/`
- [x] T005 [US3] Ajustar a configuração de teste se o Vitest 5 exigir, sem mudar o que os testes verificam — `web/vite.config.ts`, `web/src/test/`
- [x] T006 [US3] `npm test` e `npm run build` verdes
- [x] **Checkpoint**: `npm audit` sem vulnerabilidades

## Fase 3 — Imagens e integração (US3, US4)

- [x] T007 [US4] Reconferir no Docker Hub que as 5 imagens seguem na correção mais recente da linha; atualizar a tag se saiu versão nova — `docker-compose.yml`, `api/Dockerfile`, `web/Dockerfile`, `scripts/api-mvn.sh`
- [x] T008 [US3] `docker compose up --build` com o volume existente e executar o checklist
- [x] T009 Registrar o resultado da auditoria refeita na spec, marcar como **Implementada** e atualizar `docs/sdd-guia.md`

---

## Checklist de verificação

### Automático
- [x] **V-01** `scripts/api-mvn.sh verify` verde (todas as suítes, incluindo `IsolationIT` e `CsrfFlowIT`).
- [x] **V-02** `npm test` e `npm run build` verdes.
- [x] **V-03** `npm audit`: 0 vulnerabilidades.
- [x] **V-04** OSV das dependências de execução da API: só GHSA-j9f9-w8pj-32f8 e GHSA-pc63-qcmh-9cmg (riscos aceitos).

### Regressão (US3)
- [x] **V-05** (RC-001) Com o volume atual: login com conta existente; hábitos, marcações e metas iguais; sessão anterior continua válida. *(Conferido no banco após subir a versão nova: 3 contas, 13 hábitos, 11 marcações, 3 metas e 2 sessões válidas preservadas; o login com conta antiga não foi feito pela interface porque a senha dela não estava disponível.)*
- [x] **V-06** Criar hábito com meta, marcar/desmarcar, ver barra e resumo atualizarem.
- [x] **V-07** Cadastro, login com senha errada (mensagem genérica), troca de senha e sair. *(Troca de senha: verificado o caso de senha atual errada (422); o caso de sucesso segue coberto pelo `AuthIT`.)*
- [x] **V-08** Isolamento: segunda conta recebe 404 nos ids da primeira (`IsolationIT` + console).
- [x] **V-09** Nenhum erro no console do navegador nem exceção no log da API.

### Imagens (US4)
- [x] **V-10** Cada imagem na correção mais recente da linha, conferida na data da implementação.
