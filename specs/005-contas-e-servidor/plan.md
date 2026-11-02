# Plano de Implementação: Contas de usuário com dados no servidor

**Branch**: `005-contas-e-servidor` | **Data**: 2026-11-01 | **Spec**: [spec.md](./spec.md)
**Status**: Aprovado em 2026-11-01 | **Tarefas**: [tasks.md](./tasks.md)

---

## Resumo

Três contêineres orquestrados por Docker Compose: **db** (PostgreSQL), **api** (Spring Boot,
regras de negócio, autenticação por sessão) e **web** (React + TypeScript compilado e servido
por Nginx, que também encaminha `/api` para a API — mesma origem, sem CORS). As regras das
specs 002 e 004, hoje em `script.js`, passam a ser aplicadas pela API e reproduzidas na
interface React. O app estático antigo é removido.

## Contexto técnico

| Item | Valor |
|------|-------|
| API | Java 21, Spring Boot **3.5.16** (web, security, data-jpa, validation, session-jdbc), Flyway, driver PostgreSQL |
| Banco | `postgres:17.11-alpine` |
| Frontend | React **19.3.1**, TypeScript **5.9.3**, Vite **7.3.7**, `@vitejs/plugin-react` **5.2.0** |
| Testes | JUnit 5 + MockMvc + Testcontainers (versão gerida pelo Boot); Vitest **3.2.7**, Testing Library (react **16.3.3**, jest-dom **6.10.0**, user-event **14.6.8**), jsdom **26.1.0** |
| Imagens de build | `maven:3.9.16-eclipse-temurin-21`, `eclipse-temurin:21.0.13_9-jre-alpine`, `node:22.23.4-alpine`, `nginx:1.28.3-alpine` |
| Execução | Docker 29.6 + Compose no WSL (Ubuntu) |
| Fuso | `America/Sao_Paulo` (API via `Clock`; frontend via `Intl` com `timeZone`) |

---

## Constitution Check (2.0.0)

| Princípio | Conforme? | Observação |
|-----------|-----------|------------|
| I. Spec antes do código | ✅ | Spec aprovada em 2026-11-01 |
| II. Stack oficial | ✅ | Exatamente a stack das Restrições técnicas; versões fixas; sem roteador nem biblioteca de estado no React |
| III. Dados isolados por usuário | ✅ | Toda consulta filtra por `userId` da sessão; 404 para recurso alheio; Flyway |
| IV. pt-BR e acessível | ✅ | Erros da API com mensagem pt-BR; diálogos nativos; foco devolvido; rótulos em formulários |
| V. Responsivo | ✅ | CSS atual portado (breakpoint 570px, grade com rolagem só nos dias, header sticky) |
| VI. Verificação | ✅ | Integração com PostgreSQL real, isolamento A × B em todas as rotas; Vitest; checklist manual |
| VII. Segurança | ✅ | BCrypt; cookie `SESSION` HttpOnly + SameSite=Lax; CSRF por cookie/header; `.env` fora do git; erro de login genérico; troca do id de sessão no login |

---

## Pesquisa e decisões

| # | Decisão | Alternativas | Motivo |
|---|---------|--------------|--------|
| P1 | Sessão em cookie (Spring Session JDBC) | JWT | Logout real, expiração por inatividade de 7 dias, cookie HttpOnly sem token no JS; sessões sobrevivem a reinício da API |
| P2 | Nginx faz proxy de `/api` | CORS entre portas | Mesma origem: cookies `SameSite=Lax` e CSRF simples |
| P3 | CSRF com `CookieCsrfTokenRepository` (cookie `XSRF-TOKEN` legível → header `X-XSRF-TOKEN`) | Desligar CSRF | Princípio VII; padrão oficial do Spring Security para SPA |
| P4 | Login por endpoint JSON próprio (`AuthenticationManager` + salvar contexto na sessão + trocar id da sessão) | `formLogin` | Respostas JSON e mensagens pt-BR; evita fixação de sessão |
| P5 | Principal serializável com `id` do usuário | Buscar usuário por e-mail a cada requisição | Spring Session JDBC serializa o contexto; evita consulta extra |
| P6 | Spring Boot 3.5 / React 19 / Vite 7 / Vitest 3 | Boot 4, Vite 8, Vitest 5, TS 7 | Linhas maduras e conhecidas; todas publicadas há mais de 2 semanas |
| P7 | Sem React Router nem React Query | Bibliotecas | Só 3 telas (login, cadastro, principal); Princípio II |
| P8 | Datas no frontend como chave `YYYY-MM-DD` com aritmética em UTC; "hoje" de Brasília via `Intl.DateTimeFormat("en-CA", { timeZone })` | Datas locais do navegador | Independe do fuso da máquina do usuário (RF-010) |
| P9 | Testes da API dentro de um contêiner Maven com o socket do Docker | Instalar JDK 21 no WSL | Nada a instalar; Testcontainers sobe o PostgreSQL real |

---

## Estrutura

```
docker-compose.yml   .env.example   .gitignore
api/
  Dockerfile  pom.xml
  src/main/java/br/com/habits/
    HabitsApplication.java
    config/  SecurityConfig, SpaCsrfTokenRequestHandler, ClockConfig
    auth/    AuthController, AuthPrincipal, AppUserDetailsService, RegisterRequest, LoginRequest
    user/    User, UserRepository, UserService, MeController, UserResponse, ChangePasswordRequest, SettingsRequest
    habit/   Habit, HabitRepository, HabitService, HabitController, HabitRequest, HabitResponse, OrderRequest
    check/   Check, CheckId, CheckRepository, CheckService, CheckController, CheckResponse, EditableWindow
    common/  ApiException, ApiError, ApiExceptionHandler
  src/main/resources/ application.yml, db/migration/V1__schema.sql, V2__spring_session.sql
  src/test/java/br/com/habits/ IntegrationTest (base Testcontainers), AuthIT, CsrfFlowIT, HabitIT, CheckIT, IsolationIT, EditableWindowTest
web/
  Dockerfile  nginx.conf  package.json  tsconfig.json  vite.config.ts  index.html
  public/logo.svg
  src/ main.tsx App.tsx styles.css
       api/    client.ts types.ts
       auth/   AuthContext.tsx LoginPage.tsx RegisterPage.tsx ChangePasswordDialog.tsx
       week/   dates.ts dates.test.ts WeekNav.tsx WeekGrid.tsx
       habits/ rules.ts rules.test.ts useHabits.ts HabitList.tsx HabitDialog.tsx ArchivedDialog.tsx
       home/   HomePage.tsx UserMenu.tsx
       test/   setup.ts
```
Removidos da raiz: `index.html`, `script.js`, `style.css`, `assests/` (logo vai para `web/public`).

---

## Modelo de dados (Flyway)

`V1__schema.sql`
```sql
create table users (
  id bigserial primary key,
  name varchar(100) not null,
  email varchar(254) not null unique,          -- gravado já normalizado (trim + minúsculas)
  password_hash varchar(100) not null,
  week_mode varchar(10) not null default 'rolling' check (week_mode in ('rolling','calendar')),
  created_at timestamptz not null default now()
);
create table habits (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  name varchar(30) not null,
  emoji varchar(16) not null default '',
  archived boolean not null default false,
  position int not null,
  created_at timestamptz not null default now()
);
create unique index habits_user_name_uk on habits (user_id, lower(name));
create table checks (
  habit_id bigint not null references habits(id) on delete cascade,
  day date not null,
  primary key (habit_id, day)
);
```
`V2__spring_session.sql`: tabelas `spring_session` e `spring_session_attributes` (DDL oficial do Spring Session para PostgreSQL); `spring.session.jdbc.initialize-schema=never`.

---

## Contrato da API (`/api`, JSON)

Erros: `{ "code": "...", "message": "texto pt-BR", "fields"?: {campo: mensagem}, "habitId"?: n }`

| Rota | Corpo / resposta | Erros |
|------|------------------|-------|
| `POST /auth/register` | `{name, email, password}` → 201 `User` (já logado) | 400 `VALIDATION`, 409 `EMAIL_TAKEN` |
| `POST /auth/login` | `{email, password}` → 200 `User` | 401 `BAD_CREDENTIALS` |
| `POST /auth/logout` | → 204 | — |
| `GET /auth/me` | → 200 `User` | 401 `UNAUTHENTICATED` |
| `PUT /me/password` | `{currentPassword, newPassword}` → 204 | 400 `VALIDATION`, 422 `WRONG_PASSWORD` |
| `PUT /me/settings` | `{weekMode}` → 200 `User` | 400 |
| `GET /habits` | → 200 `Habit[]` (ativos por posição, depois arquivados) | — |
| `POST /habits` | `{name, emoji}` → 201 `Habit` | 400, 409 `DUPLICATE_NAME` / `ARCHIVED_DUPLICATE` (+`habitId`), 422 `LIMIT_REACHED` |
| `PATCH /habits/{id}` | `{name, emoji}` → 200 `Habit` | 400, 404, 409 |
| `POST /habits/{id}/archive` · `/restore` | → 200 `Habit` | 404, 422 `LIMIT_REACHED` (restore) |
| `DELETE /habits/{id}` | → 204 | 404, 409 `NOT_ARCHIVED` |
| `PUT /habits/order` | `{ids: number[]}` (todos os ativos) → 200 `Habit[]` | 400 `INVALID_ORDER`, 404 |
| `GET /checks?from&to` | → 200 `[{habitId, day}]` | 400 (intervalo > 366 dias ou invertido) |
| `PUT /checks/{habitId}/{day}` · `DELETE` | → 204 (idempotente) | 404, 409 `HABIT_ARCHIVED`, 422 `NOT_EDITABLE` |

`User = {id, name, email, weekMode}` · `Habit = {id, name, emoji, archived}`

Regras portadas de `script.js`: nome com trim, 1–30 caracteres; emoji = primeiro grafema
(`BreakIterator`); unicidade por usuário entre ativos e arquivados; até 10 ativos; restaurar e
criar vão para o fim dos ativos; excluir só arquivado; janela editável
`hoje − 6 ≤ dia ≤ hoje` com `LocalDate.now(clock)` em Brasília.

Segurança: tudo exige sessão, exceto `register`, `login` e `GET /auth/me` (que responde 401
sem sessão). Sem sessão → 401 JSON. CSRF em todo método que altera dados.
`server.servlet.session.timeout=7d`; cookie `SESSION` `HttpOnly`, `SameSite=Lax`, `Secure`
por variável (`HABITS_COOKIE_SECURE`, padrão `false` em ambiente local).

---

## Frontend

- `api/client.ts`: `request(method, path, body)` com `credentials: "same-origin"`, envia
  `X-XSRF-TOKEN` lido do cookie; 401 → dispara "sessão expirada" no `AuthContext`; erros viram
  `ApiError { code, message, fields, habitId }`.
- `AuthContext`: carrega `GET /auth/me` ao abrir; expõe `user`, `login`, `register`, `logout`,
  `updateUser`, `sessionExpired`.
- `App`: sem usuário → `LoginPage`/`RegisterPage` (alternadas por estado); com usuário → `HomePage`.
- `HomePage`: header sticky (logo, `WeekNav` com setas + alternador, `UserMenu` com nome,
  "Trocar senha", "Sair"); `HabitList` + `WeekGrid` com o mesmo CSS de hoje.
- `dates.ts`: porta das funções de data da 004, em UTC + "hoje" de Brasília.
- `useHabits`: carrega hábitos e marcações da semana visível; marcação otimista com rollback
  e aviso; após cada ação de hábito, recarrega a lista da API.
- Diálogos com `<dialog>` + `showModal()`; foco volta ao controle de origem (lição da 002).
- Arrastar com Pointer Events na alça ⠿ + botões ↑/↓; envia `PUT /habits/order`.

---

## Execução

- `cp .env.example .env` (preencher senha) → `docker compose up --build` no WSL → `http://localhost:8080`.
- API também publicada em `127.0.0.1:8081` para desenvolvimento do frontend com `npm run dev`
  (proxy do Vite para `/api`).
- Testes da API:
  `docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v "$PWD/api":/app -v habits-m2:/root/.m2 -w /app -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal --add-host host.docker.internal:host-gateway maven:3.9.16-eclipse-temurin-21 mvn -B verify`
- Testes do frontend: `cd web && npm test`.

---

## Ajustes durante a implementação

| Tema | O que mudou em relação ao plano | Motivo |
|------|---------------------------------|--------|
| CSRF | Sem `CsrfCookieFilter`: o `SpaCsrfTokenRequestHandler` já carrega o token em toda resposta | Padrão atual da documentação do Spring Security |
| Estrutura da API | DTOs de requisição como `record` aninhados nos controllers | Menos arquivos; cada DTO só é usado por um controller |
| Teste de CSRF | Novo `CsrfFlowIT` com HTTP real (porta aleatória) em vez de MockMvc | O `csrf()` do spring-security-test troca o repositório de tokens do filtro e escondia o comportamento real |
| Mockito | `mock-maker-subclass` em `src/test/resources/mockito-extensions` | O agente inline do Mockito não consegue se acoplar à JVM dentro do contêiner Maven |
| Testes da API | `scripts/api-mvn.sh` roda o Maven em contêiner com o socket do Docker | Mesmo comando para qualquer máquina com Docker |
| `jest-dom` | 6.9.1 em vez de 6.10.0 | 6.10.0 foi marcada como obsoleta pelos mantenedores |
| Frontend | Componente `common/Modal` compartilhado pelos três diálogos | Foco, Esc e montagem do conteúdo num só lugar |
| Rolar até hoje | Rola só `.days` na horizontal, sem `scrollIntoView` | `scrollIntoView` rolava a página para baixo no celular com muitos hábitos |
| Cabeçalho no celular | `position: static` em ≤570px | Com o menu do usuário o cabeçalho preso ocupava ~1/3 da tela |
| Verificação inicial da sessão | Aviso "Não foi possível falar com o servidor…" quando `/auth/me` falha por outro motivo que não 401 | Durante reinício da API o usuário caía no login sem explicação |

## Complexity Tracking

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|----------|----------------------|-------------------------------------------|
| Nenhuma em relação à constituição 2.0.0 | — | — |
