# Tarefas: Notificações de hábitos e atualização para a versão nova

**Branch**: `011-notificacoes-e-atualizacao` | **Entradas**: [spec.md](./spec.md), [plan.md](./plan.md)

> Pré-requisito: `plan.md` com status **Aprovado** (aprovado em 2026-11-18).
>
> Formato: `- [ ] T001 [P] [US1] Descrição — arquivo`. Marque `[x]` ao concluir.
> `[P]` = pode ser feita em paralelo (arquivos diferentes, sem dependência).

Histórias: **US1** ativar e configurar · **US2** lembrete diário · **US3** aviso de versão
nova · **US4** versão nova automática · **US5** meta em risco · **US6** resumo de domingo ·
**US7** novidades da versão. Decisões do plan citadas como **P1–P21**.

As notificações (US1, US2, US5, US6) e a versão nova (US3, US4, US7) são independentes: as
fases 5–7 podem ser feitas antes das fases 2–4 ou em paralelo.

---

## Fase 1 — Fundamentos (bloqueia as histórias)

- [x] T001 Migração `V4__notifications.sql` com `notification_settings` e
  `push_subscriptions`, exatamente como no plan (nenhuma tabela existente muda) —
  `api/src/main/resources/db/migration/`
- [x] T002 [P] `scripts/gerar-vapid.sh`: gera o par P-256 com `openssl` e imprime
  `HABITS_VAPID_PUBLIC_KEY` (65 bytes) e `HABITS_VAPID_PRIVATE_KEY` (32 bytes) em base64url,
  sem gravar arquivo — `scripts/gerar-vapid.sh`
- [x] T003 [P] Configuração: `habits.vapid.public-key`, `private-key` e `subject` lidos de
  `HABITS_VAPID_*` (vazios por padrão) e `habits.notifications.scheduler.enabled` (true;
  false nos testes); `@EnableScheduling`; variáveis repassadas à API no compose e
  documentadas sem valores no `.env.example` — `api/src/main/resources/application.yml`,
  `HabitsApplication.java`, `docker-compose.yml`, `.env.example`
- [x] T004 [P] Nginx (P13): `Cache-Control: no-cache` para `/`, `index.html`,
  `/version.json`, `/sw.js` e `/manifest.webmanifest`; `public, max-age=31536000, immutable`
  para `/assets/`; manter os cabeçalhos de segurança atuais (repetir os `add_header` dentro de
  cada `location` que definir os seus) — `web/nginx.conf`
- [x] **Checkpoint**: `scripts/api-mvn.sh verify` e `cd web && npm test` verdes; `docker
  compose up --build` sobe com a `V4` aplicada e o app igual a antes

## Fase 2 — Envio de push na API (bloqueia US1, US2, US5 e US6)

- [x] T005 `VapidKeys`: carrega as chaves da configuração (ou indica "indisponível" se
  vazias); assina o JWT ES256 (`aud` = origem do endpoint, `exp` = agora + 12 h, `sub`) com
  `SHA256withECDSAinP1363Format` (P2) — `api/src/main/java/br/com/habits/push/VapidKeys.java`
- [x] T006 `WebPushEncryption`: RFC 8291 `aes128gcm` (ECDH P-256 efêmero, HKDF-SHA256,
  AES-128-GCM, cabeçalho com `salt`, `rs` e chave pública) + `WebPushEncryptionTest` com o
  vetor do apêndice A da RFC 8291 e um teste que verifica o JWT com a chave pública —
  `push/WebPushEncryption.java`, `api/src/test/java/br/com/habits/push/`
- [x] T007 `PushSender` (interface) e `WebPushSender` (`HttpClient`, timeout 10 s, cabeçalhos
  `Authorization: vapid t=…, k=…`, `Content-Encoding: aes128gcm`, `TTL` e `Urgency: normal`);
  devolve `ENTREGUE`, `EXPIRADA` (404/410) ou `FALHOU` (demais), registrando só o código no
  log (P7, P12). Nos testes, um `FakePushSender` captura as mensagens — `push/`

## Fase 3 — História 1: ativar e configurar (P1) 🎯 MVP das notificações

**Objetivo**: ativar por aparelho, escolher horário e tipos, desativar e sair sem receber.
**Verificação independente**: tela da conta no Chrome do computador (localhost é contexto
seguro) com as chaves VAPID de desenvolvimento.

- [x] T008 [US1] Entidades e repositórios `NotificationSettings` e `PushSubscription` —
  `api/src/main/java/br/com/habits/notification/`
- [x] T009 [US1] `NotificationService` + `NotificationController` com as quatro rotas do plan:
  padrões ao ativar (P5), *upsert* por `endpoint` trocando de dono (P4), validação do endpoint
  pela lista de hosts e das chaves (P12), horário `HH:mm` e regra P8 ao salvar; erros
  `INVALID_SUBSCRIPTION`, `SUBSCRIPTION_NOT_FOUND` e `fields.reminderTime` em pt-BR —
  `notification/`
- [x] T010 [US1] `NotificationIT`: sem chaves → `available=false`; padrões; salvar e ler
  preferências; horário inválido; endpoint fora da lista, `http` e chaves de tamanho errado
  recusados; mesmo endpoint de outra conta passa para a atual; `DELETE` remove — 
  `api/src/test/java/br/com/habits/notification/NotificationIT.java`
- [x] T011 [US1] `IsolationIT`: `GET`/`PUT` de preferências só da própria conta; `DELETE` de
  inscrição de outra conta → 404 e a inscrição continua — `IsolationIT.java`
- [x] T012 [P] [US1] `sw.js` (P3): `push` → `showNotification(title, { body, tag, icon:
  "/icon-192.png", data: { url } })`; `notificationclick` → foca uma janela do Habits e
  navega para `url`, ou abre `url`; sem `fetch` handler — `web/public/sw.js`
- [x] T013 [P] [US1] `push.ts`: detecção de suporte, iPhone fora da tela inicial,
  permissão, registro do `/sw.js` (chamado no `main.tsx`), `subscribe`/`unsubscribe` e
  conversão base64url; tipos e rotas novas no cliente da API — `web/src/notifications/push.ts`,
  `web/src/main.tsx`, `web/src/api/client.ts`, `web/src/api/types.ts`
- [x] T014 [US1] Card "Notificações" na tela da conta com os cinco estados do plan (RF-006),
  botão ativar/desativar neste aparelho, horário (`input type="time"`) e os três tipos
  (caixas com rótulo), mensagens de erro em `Alert`; reenvia a inscrição existente ao abrir
  o app logado (P4) — `web/src/notifications/NotificationSettings.tsx`,
  `web/src/pages/AccountPage.tsx`, `web/src/App.tsx`
- [x] T015 [US1] Sair: remove a inscrição do aparelho (`DELETE` + `unsubscribe`) antes do
  logout, sem impedir a saída se falhar — `web/src/auth/AuthContext.tsx`
- [x] T016 [US1] Testes Vitest: estados (sem suporte, iPhone fora da tela inicial,
  bloqueada, desativada, ativa), ativar chama `subscribe` + `PUT`, desativar chama `DELETE` +
  `unsubscribe`, salvar horário/tipos, sair remove a inscrição —
  `NotificationSettings.test.tsx`, `AuthContext` (teste existente ou novo)

## Fase 4 — História 2: lembrete diário (P1)

- [x] T017 [US2] `NotificationRules.daily(...)`: hábitos ativos sem marcação hoje, menos os
  que atingiram a meta vigente na semana de segunda a domingo; textos do P11 (singular,
  plural, até 3 nomes + "e mais N") — `notification/NotificationRules.java`
- [x] T018 [US2] `NotificationJob.runAt(LocalDateTime)`: para cada usuário com inscrições,
  envia o lembrete na janela `[horário, horário + 15 min)` se `daily_enabled` e
  `last_daily_on < hoje`; grava `last_daily_on`; `TTL` até a meia-noite (mínimo 60 s); apaga
  inscrições `EXPIRADA`; o método `@Scheduled` (a cada minuto, `America/Sao_Paulo`) só chama
  `runAt` e respeita `scheduler.enabled` (P6, P7) — `notification/NotificationJob.java`
- [x] T019 [US2] Testes: `NotificationRulesTest` (sem hábitos, tudo marcado, meta atingida
  ignorada, arquivado ignorado, textos) e `NotificationJobIT` (envia uma vez na janela, não
  reenvia no mesmo dia nem após mudar o horário, fora da janela não envia, mudança para
  horário passado conta como feito, tipo desligado não envia, várias inscrições recebem,
  410 apaga, `TTL` calculado) — `api/src/test/java/br/com/habits/notification/`

## Fase 5 — História 3: aviso de versão nova durante o uso (P1) 🎯 MVP da versão

**Objetivo**: com o app aberto, aviso com "Atualizar" em até 5 minutos, sem perder nada.
**Verificação independente**: app aberto em `localhost:8080`, `docker compose up --build web`
com uma mudança qualquer no web, esperar o aviso.

- [x] T020 [US3] Build (P14, P21): `buildId` e `notesId` em `define`; plugin local que grava
  `dist/version.json` `{ version, notes, notesId }` e falha se `novidades.md` passar de 300
  caracteres; `web/novidades.md` com o resumo desta versão; tipos globais —
  `web/vite.config.ts`, `web/novidades.md`, `web/src/vite-env.d.ts`
- [x] T021 [US3] `update/version.ts`: lê `/version.json` com `cache: "no-store"`; versão nova
  só quando a `version` difere da embutida **e** `/api/auth/me` responde 200 ou 401 (P15) —
  `web/src/update/version.ts`
- [x] T022 [US3] `update/blockers.ts` (P17) e seus pontos de uso: `Modal` aberto, arraste do
  `useReorder` e requisições que não são `GET` em andamento no cliente da API —
  `web/src/update/blockers.ts`, `web/src/common/Modal.tsx`, `web/src/habits/useReorder.ts`,
  `web/src/api/client.ts`
- [x] T023 [US3] `UpdateProvider`: checagem a cada 4 min com a aba visível e no
  `visibilitychange`; estado `{ available, notes, pending }`; "Atualizar" recarrega na hora
  sem bloqueio, ou fica pendente e recarrega quando os bloqueios zeram (P16–P18) —
  `web/src/update/UpdateProvider.tsx`, `web/src/App.tsx`
- [x] T024 [US3] `UpdateBanner` no fluxo do `AppShell`, acima do conteúdo: `role="status"`,
  "Nova versão disponível", resumo só se o `notesId` novo for diferente do atual, botão
  "Atualizar" / "Atualizando ao fechar o formulário…" (P19) — `web/src/update/UpdateBanner.tsx`,
  `web/src/shell/AppShell.tsx`
- [x] T025 [US3] Testes Vitest (timers e `fetch` simulados): aviso aparece; sem aviso com a API
  fora; sem resumo quando o `notesId` não muda; "Atualizar" recarrega; com diálogo aberto fica
  pendente e recarrega ao fechar; com `PUT` em andamento espera — `web/src/update/*.test.tsx`

## Fase 6 — História 4: versão nova automática (P1)

- [x] T026 [US4] Recarga automática (P18): logo após entrar (o `AuthContext` avisa o
  provider); na tela Entrar/Criar conta sem campos preenchidos (bloqueio quando há texto);
  ao voltar para a aba depois de ≥ 30 min oculta e sem bloqueio; senão, aviso —
  `web/src/update/UpdateProvider.tsx`, `web/src/auth/AuthContext.tsx`,
  `web/src/auth/LoginPage.tsx`, `web/src/auth/RegisterPage.tsx`
- [x] T027 [US4] Testes Vitest: recarrega após entrar com versão nova; não recarrega após
  entrar sem versão nova; tela de login vazia recarrega e com texto não; voltar após 29 min →
  aviso, após 30 min → recarga, após 30 min com diálogo aberto → aviso — `web/src/update/`

## Fase 7 — História 7: novidades da versão (P3)

- [x] T028 [US7] `NotesDialog` com o `Dialog` atual ("Novidades da versão", texto e
  "Fechar"); regra do `localStorage["habits:notes-seen"]` (P20), com `try/catch` —
  `web/src/update/NotesDialog.tsx`, `web/src/App.tsx`
- [x] T029 [US7] Testes Vitest: primeiro uso só grava; `notesId` novo mostra uma vez; fechar
  grava; sem resumo não mostra; sem `localStorage` não quebra — `NotesDialog.test.tsx`

## Fase 8 — História 5: meta em risco (P2)

- [x] T030 [US5] `NotificationRules.atRisk(...)` (P9) e envio às 9h no `NotificationJob`, na
  janela `[09:00, 09:15)`, com `last_at_risk_on` e uma notificação citando todos os hábitos
  em risco (P11) — `notification/`
- [x] T031 [US5] Testes: sexta com meta 3 e 0 feitos → risco; com folga, atingida,
  impossível ou marcada hoje → não; dois hábitos → uma notificação; domingo precisando de 1 →
  risco; tipo desligado → não; uma vez por dia — `NotificationRulesTest`, `NotificationJobIT`

## Fase 9 — História 6: resumo de domingo (P2)

- [x] T032 [US6] `NotificationRules.summary(...)` com o mesmo cálculo do `weekSummary` do web
  (P9); no domingo, no horário do lembrete, envia o resumo no lugar do lembrete (+ "Faltam N…"
  se o lembrete estiver ligado e houver pendência); sem metas → lembrete normal (P10); resumo
  desligado → lembrete normal; grava `last_daily_on` — `notification/`
- [x] T033 [US6] Testes: casos do `progress.test.ts` reproduzidos em Java (percentual e
  rótulo); domingo com e sem pendência; sem metas; sem hábitos; resumo desligado; nunca duas
  notificações no horário do lembrete — `NotificationRulesTest`, `NotificationJobIT`

## Fase 10 — Polimento e verificação

- [x] T034 `docs/deploy.md`: gerar as chaves VAPID uma vez no servidor com
  `scripts/gerar-vapid.sh`, colocar no `.env` e **nunca trocar**; `HABITS_VAPID_SUBJECT`
  (`mailto:` do responsável); como escrever o `web/novidades.md` em cada PR — `docs/deploy.md`
- [x] T035 Revisar textos em pt-BR (notificações, aviso, novidades, card da conta) e
  acessibilidade (foco, rótulos, contraste, "reduzir movimento") — `web/src/`, `notification/`
- [x] T036 `scripts/api-mvn.sh verify` e `cd web && npm test && npm run build` verdes
- [ ] T037 Checklist de verificação manual abaixo: itens 💻 no navegador local; itens 📱 no
  iPhone e no Android reais depois do deploy (as chaves VAPID de produção são geradas pelo
  usuário no servidor antes do merge)
- [ ] T038 Spec → **Implementada** e tabela "Specs existentes" em `docs/sdd-guia.md`

---

## Dependências

- Fase 1 bloqueia todas. A Fase 2 bloqueia as fases 3, 4, 8 e 9; a Fase 3 bloqueia as fases
  4, 8 e 9 (precisam de inscrições e preferências).
- Fases 5 → 6 → 7 dependem só da Fase 1 (T004) e podem andar em paralelo às fases 2–4.
- Fase 9 depende da Fase 4 (mesmo horário e mesma data de envio).

---

## Checklist de verificação manual

💻 = navegador local (Chrome no computador, `http://localhost:8080`, chaves VAPID de
desenvolvimento) · 📱 = iPhone (app da tela inicial) e Android (Chrome) depois do deploy.
Para testar o horário, usar um lembrete 2 minutos à frente.

### Notificações

- [ ] **V-01** 💻 Conta existente: card "Notificações" desativado; nenhuma notificação chega (1.1, RC-003).
- [ ] **V-02** 💻 Ativar → pedido de permissão → permitir → ativas, três tipos ligados, 20:00 (1.2).
- [x] **V-03** 💻 Recusar a permissão → "bloqueadas" com como liberar (1.3).
- [ ] **V-04** 💻 Mudar o horário para daqui a 2 min, fechar a aba → lembrete chega com o
  navegador sem o Habits aberto, com o número de hábitos que faltam (1.4, 2.1, CS-001).
- [ ] **V-05** 💻 Tocar no lembrete → abre a semana atual (2.4).
- [ ] **V-06** 💻 Tudo marcado (ou faltando só hábitos com meta atingida) → nenhum lembrete (2.2, CS-002).
- [ ] **V-07** 💻 Desligar o lembrete diário → não chega; os outros tipos continuam ligados (1.5).
- [ ] **V-08** 💻 Mudar o horário depois do envio do dia → não chega de novo (casos de borda).
- [ ] **V-09** 💻 Dois navegadores ativados; desativar em um → só o outro recebe (1.6, CS-003).
- [ ] **V-10** 💻 "Sair" num navegador ativado → não recebe mais (1.9, CS-003).
- [ ] **V-11** 💻 Navegador sem suporte (ou sem chaves VAPID) → "indisponíveis" (1.8).
- [ ] **V-12** 📱 iPhone no Safari comum → passos para adicionar à tela inicial, sem botão (1.7).
- [ ] **V-13** 📱 iPhone pelo atalho e Android: ativar, receber o lembrete com o app fechado e tocar nele (RF-001, CS-001).
- [ ] **V-14** 💻 Meta em risco: relógio do servidor de teste ou dados preparados → uma única
  notificação às 9h citando os hábitos em risco (5.1, 5.2) — validado também pelo `NotificationJobIT`.
- [ ] **V-15** 💻 Resumo de domingo: uma notificação com percentual e rótulo iguais aos da tela (6.1, 6.2) — validado também pelo `NotificationJobIT`.

### Versão nova

- [x] **V-16** 💻 App aberto; publicar uma versão nova do web → em até 5 min aparece "Nova
  versão disponível" com o resumo, sem cobrir marcações nem a barra inferior (3.1, 3.2, CS-004).
- [x] **V-17** 💻 "Atualizar" sem diálogo → recarrega na mesma tela, logado (3.3).
- [x] **V-18** 💻 Editando um hábito com texto digitado, "Atualizar" → nada se perde; recarrega ao salvar ou fechar (3.4, CS-006).
- [x] **V-19** 💻 Ignorar o aviso e continuar marcando → tudo funciona (3.5).
- [x] **V-20** 💻 Fechar e abrir de novo após a publicação → abre na versão nova, sem aviso (4.1, CS-005).
- [x] **V-21** 💻 Tela Entrar de uma versão antiga, entrar → tela principal na versão nova, sem pedir login de novo (4.2).
- [ ] **V-22** 💻 Aba oculta ≥ 30 min (simulado no teste T027; no navegador, trocar de aba e
  voltar depois) → recarrega sozinho; com diálogo aberto → aviso (4.4, 4.5).
- [x] **V-23** 💻 Depois de atualizar com resumo novo → "Novidades da versão" uma vez; reabrir não mostra (7.1, 7.2).
- [x] **V-24** 💻 Versão sem mudança no `novidades.md` → aviso sem resumo e sem tela de novidades (3.2, 7.3).
- [x] **V-25** 💻 Aviso e novidades por teclado, com foco visível e leitor de tela (7.4, RF-022).
- [ ] **V-26** 📱 iPhone e Android pelo atalho da tela inicial (sem recriá-lo): após o deploy, abrir → versão nova (RC-004, CS-005).
- [x] **V-27** 💻 `curl -I` em `/`, `/version.json`, `/sw.js` → `no-cache`; em `/assets/…` → `immutable`; cabeçalhos de segurança mantidos (P13).

### Regressão

- [ ] **V-28** Executar o checklist de
  [001-registro-de-habitos](../001-registro-de-habitos/tasks.md#checklist-de-verificação-manual)
  e marcar/desmarcar na semana atual e na anterior (spec 010).
- [ ] **V-29** Usuário com dados antigos: hábitos, marcações, metas e ordem intactos; sessão ativa continua logada (RC-001, RC-002).
- [ ] **V-30** Layout ok no celular (360–430px) e no computador com o aviso visível.

### Resultado da verificação (2026-11-18)

- **Testes automatizados**: API `scripts/api-mvn.sh verify` verde (84 testes, inclusive o vetor
  da RFC 8291, `NotificationIT`, `NotificationJobIT` e `IsolationIT`); web `npm test` verde
  (112 testes) e `npm run build` ok.
- **Navegador embutido** (`docker compose up --build` com chaves VAPID de desenvolvimento no
  `.env` local): V-03, V-16–V-21, V-23–V-25 e V-27 conferidos, com três publicações de teste do
  web (novidades novas, novidades de volta ao texto original, build sem mudar novidades).
- **Pendentes**: o navegador embutido nega notificações e não registra service worker. Por isso
  V-01, V-02, V-04–V-11 e V-14–V-15 (push real) ficam para o Chrome do computador em
  `http://localhost:8080`. V-12, V-13 e V-26 dependem de iPhone e Android depois do deploy.
  V-22 (30 minutos fora) e V-28–V-30 (regressão, dados antigos e layout com o aviso no celular)
  estão cobertos só pelos testes automatizados e pela tela da conta em 375px.
