# Tarefas: Contas de usuário com dados no servidor

**Branch**: `005-contas-e-servidor` | **Entradas**: [spec.md](./spec.md), [plan.md](./plan.md)

> Formato: `- [ ] T001 [P] [US1] Descrição — arquivo`. Marque `[x]` ao concluir.

Histórias: **US1** criar conta · **US2** entrar/sair · **US3** isolamento · **US4** paridade
002/004 · **US5** outro dispositivo · **US6** trocar senha.

---

## Fase 1 — Infraestrutura (bloqueia as demais)

- [x] T001 `docker-compose.yml` (db, api, web; volume `pgdata`; healthcheck do banco), `.env.example`, `.gitignore`
- [x] T002 [P] Projeto Spring Boot: `pom.xml`, `HabitsApplication`, `application.yml`, `Dockerfile` multi-stage — `api/`
- [x] T003 [P] Projeto Vite + React + TS: `package.json` (versões fixas), `tsconfig`, `vite.config.ts` (proxy `/api`, Vitest), `Dockerfile`, `nginx.conf` — `web/`
- [x] T004 Migrações `V1__schema.sql` e `V2__spring_session.sql` — `api/src/main/resources/db/migration/`
- [x] **Checkpoint**: `docker compose up --build` sobe os 3 contêineres; Flyway aplica as migrações

## Fase 2 — Autenticação (US1, US2, US6) — P1

- [x] T005 [US2] `SecurityConfig` (sessão, 401 JSON, CSRF SPA, BCrypt, rotas públicas), `SpaCsrfTokenRequestHandler`, `ClockConfig` — `api/…/config/`
- [x] T006 [US1] Entidade `User`, repositório, `UserService` (normalizar e-mail, validar, hash) — `api/…/user/`
- [x] T007 [US1][US2] `AuthController` (register, login com troca de id de sessão, logout, me), `AuthPrincipal` — `api/…/auth/`
- [x] T008 [US6] `MeController` (troca de senha, preferência de semana) — `api/…/user/`
- [x] T009 `ApiException`, `ApiExceptionHandler` (erros JSON pt-BR, validação de campos) — `api/…/common/`
- [x] T010 [US1][US2][US6] Testes de integração `AuthIT` (cadastro, e-mail duplicado com maiúsculas, senha curta, login certo/errado com mesma mensagem, logout, me sem sessão, CSRF ausente → 403, troca de senha) — `api/src/test/`

## Fase 3 — Hábitos e marcações na API (US3, US4) — P1

- [x] T011 [US4] `Habit`, `HabitRepository` (sempre por `userId`), `HabitService` (validação, limite, arquivar, restaurar, excluir, ordem), `HabitController` — `api/…/habit/`
- [x] T012 [US4] `Check`, `CheckRepository`, `EditableWindow`, `CheckService`, `CheckController` — `api/…/check/`
- [x] T013 [P] [US4] `HabitIT` e `CheckIT` (todas as regras da 002 e a janela da 004 com relógio fixo) + `EditableWindowTest` — `api/src/test/`
- [x] T014 [US3] `IsolationIT`: usuário B em **todas** as rotas com ids de A → 404 e dados de A intactos; nomes iguais entre usuários permitidos — `api/src/test/`
- [x] **Checkpoint**: `mvn verify` verde no contêiner Maven

## Fase 4 — Frontend React (US1–US6) — P1

- [x] T015 `api/client.ts` e `api/types.ts` — `web/src/api/`
- [x] T016 [US1][US2] `AuthContext`, `LoginPage`, `RegisterPage`, `App` — `web/src/auth/`, `web/src/App.tsx`
- [x] T017 [US4] `dates.ts` (porta da 004, "hoje" de Brasília) + `dates.test.ts` — `web/src/week/`
- [x] T018 [US4] `rules.ts` (validação de nome/emoji espelhando a API) + `rules.test.ts` — `web/src/habits/`
- [x] T019 [US4] `WeekNav` (setas, período, alternador gravando na conta) e `WeekGrid` (7 colunas, hoje destacado, bloqueios, rolar até hoje) — `web/src/week/`
- [x] T020 [US4] `useHabits` (carregar, marcações otimistas com rollback), `HabitList` (linhas, ↑/↓, arrastar, estado vazio, limite), `HabitDialog`, `ArchivedDialog` — `web/src/habits/`
- [x] T021 [US2][US6] `HomePage`, `UserMenu` (nome, trocar senha, sair), `ChangePasswordDialog`, aviso de sessão expirada — `web/src/home/`, `web/src/auth/`
- [x] T022 [P] `styles.css` portado de `style.css` + telas de login/cadastro, menu e avisos — `web/src/styles.css`
- [x] T023 [P] Testes de componentes: login com erro genérico, cadastro com validação, grade bloqueando dias fora da janela — `web/src/**/*.test.tsx`
- [x] **Checkpoint**: `npm test` e `npm run build` verdes

## Fase 5 — Integração e limpeza

- [x] T024 Remover `index.html`, `script.js`, `style.css`, `assests/`; logo em `web/public/` — raiz
- [x] T025 `.claude/launch.json` subindo o compose via WSL
- [x] T026 Documentação: `CLAUDE.md`, `README.md`, `docs/sdd-guia.md` (tabela + testes), notas nas specs 002 e 004
- [x] T027 Executar o checklist abaixo; se tudo passar, marcar a spec como **Implementada**

---

## Dependências

- Fase 1 bloqueia todas. Fase 2 bloqueia a 3 (rotas exigem sessão). Fase 4 depende do
  contrato da API (pode começar após a Fase 2, com a 3 pronta antes do checkpoint).

---

## Checklist de verificação

### Automático
- [x] **V-01** `mvn verify` verde (inclui `IsolationIT`).
- [x] **V-02** `npm test` e `npm run build` verdes.

### Infra
- [x] **V-03** `docker compose up --build`: `db`, `api` e `web` rodando; app em `http://localhost:8080`.
- [x] **V-04** (CS-003) Criar dados, `docker compose down` e `up`: tudo continua (inclusive a sessão).
- [x] **V-05** `.env` não aparece no `git status`; nenhuma senha real versionada.

### US1/US2 — Conta e sessão
- [x] **V-06** (1.1) Cadastro leva direto à tela principal vazia.
- [x] **V-07** (1.2–1.4) E-mail repetido (com maiúsculas), senha curta e campos inválidos mostram as mensagens da spec.
- [x] **V-08** (2.2) Senha errada e e-mail inexistente mostram a mesma mensagem.
- [x] **V-09** (2.3, 2.5) Sair volta ao login; recarregar continua no login.
- [x] **V-10** Cookie `SESSION` é `HttpOnly` e `SameSite=Lax` (DevTools).
- [x] **V-11** Sessão expirada (apagar o cookie e agir): volta ao login com "Sua sessão expirou. Entre novamente."

### US3 — Isolamento
- [x] **V-12** (3.1) Duas contas em sessões diferentes: cada uma vê só seus dados.
- [x] **V-13** (3.2) Pelo console, conta B chamando a API com ids de A recebe 404.
- [x] **V-14** (3.3) As duas contas criam "Ler".

### US4 — Paridade 002/004
- [x] **V-15** Criar (com e sem emoji), validar nome vazio/duplicado/arquivado (oferece restaurar), limite de 10.
- [x] **V-16** Editar, arquivar, restaurar, excluir definitivamente.
- [x] **V-17** Reordenar por ↑/↓ (teclado) e arrastando; ordem mantida ao recarregar.
- [x] **V-18** Semana automática com hoje destacado; marcar hoje e dias anteriores; bloqueio de futuros e de antigos (somente consulta).
- [x] **V-19** Setas ‹ ›, período, alternador de modo salvo na conta.
- [x] **V-20** Celular: grade abre em hoje; nomes visíveis; header não cobre a grade.

### US5/US6
- [x] **V-21** (5.1) Entrar em outra sessão do navegador mostra os mesmos dados e a mesma preferência.
- [x] **V-22** (6.1–6.3) Trocar senha: senha atual errada recusada; nova senha funciona no próximo login.

### Geral
- [x] **V-23** Nenhum erro no console do navegador nem exceção inesperada no log da API.
