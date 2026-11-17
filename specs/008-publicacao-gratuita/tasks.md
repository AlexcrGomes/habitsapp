# Tarefas: Publicação para testes com usuários

**Branch**: `008-publicacao-gratuita` (revisões 2 e 3: `008-publicacao-aws`) | **Entradas**:
[spec.md](./spec.md), [plan.md](./plan.md)

> Formato: `- [ ] T001 [P] [US1] Descrição — arquivo`. Marque `[x]` ao concluir.
> Tarefas marcadas **(você)** exigem ações nas suas contas (AWS, DuckDNS, GitHub); eu
> preparo os arquivos e o passo a passo.
>
> **Revisão 2 (2026-11-14)**: troca da Oracle pela AWS Lightsail (fase 1b).
> **Revisão 3 (2026-11-16)**: servidor compartilhado e repositório `servidor-apps` (fase 1c).
> As fases 2 e 3 nunca tinham sido concluídas e foram reescritas e renumeradas.

Histórias: **US1** acesso pela internet · **US2** dados preservados · **US3** publicação
automática · **US4** sem gasto do próprio bolso e segredos · **US5** convivência com outros
apps.

---

## Fase 1 — Arquivos no repositório (eu)

- [x] T001 [US1] `docker-compose.prod.yml` e `deploy/Caddyfile` — raiz, `deploy/`
- [x] T002 [US2] `scripts/deploy.sh` (fetch/reset, up --build, verificação de saúde, prune; nunca `down -v`) — `scripts/`
- [x] T003 [US4] `scripts/server-setup.sh` (Docker, firewall, usuário `deploy`, SSH só por chave, swap, atualizações automáticas) — `scripts/`
- [x] T004 [US3] `.github/workflows/deploy.yml` (testes → deploy por SSH, `concurrency`, pula sem secrets) — `.github/workflows/`
- [x] T005 [US4] `.env.example` com `HABITS_DOMAIN`; `.gitattributes` cobre os novos `.sh` — raiz
- [x] T006 [US1] `docs/deploy.md`: criar conta e VM, IP reservado, lista de segurança, DuckDNS, setup, secrets do GitHub, primeiro deploy, como recriar a VM, como ver logs — `docs/`
- [x] T007 README e CLAUDE.md: seção "Publicação" — raiz
- [x] **Checkpoint**: no WSL, `docker compose -f docker-compose.yml -f docker-compose.prod.yml config` válido; `docker compose up --build` de desenvolvimento continua igual (RF-010)

## Fase 1b — Ajustes para a AWS Lightsail (eu, revisão 2)

- [x] T008 [US4] `scripts/server-setup.sh`: remover as regras de iptables e o `iptables-persistent` da Oracle (P12) — `scripts/`
- [x] T009 [US2] `scripts/deploy.sh`: construir a API e o web um de cada vez antes do `up -d` (P11) — `scripts/`
- [x] T010 [US1] `docs/deploy.md`: conta AWS no plano gratuito, MFA, orçamento de US$ 16 (RF-011), Lightsail, IP estático, firewall 443 — `docs/`
- [x] T011 README e CLAUDE.md: "Publicação" passa a citar AWS Lightsail — raiz
- [x] **Checkpoint**: `bash -n` nos scripts; compose de produção válido; nenhuma menção restante à Oracle fora do histórico da spec/plan

## Fase 1c — Servidor compartilhado (eu, revisão 3)

- [x] T012 [US5] Repositório local `servidor-apps` (pasta irmã do Habits): `compose.yml` com Caddy e rede externa `proxy`, `Caddyfile` (raiz → 404; `habits.` → `habits-web:80`), `.env.example`, `.gitignore`, `.gitattributes` (P16–P18) — `../servidor-apps/`
- [x] T013 [US5] `servidor-apps/scripts/server-setup.sh` (movido do Habits; acrescenta a chave de deploy sem apagar as outras e cria a rede `proxy`) e `scripts/atualizar.sh` (P5, P19) — `../servidor-apps/scripts/`
- [x] T014 [US5] `servidor-apps/README.md`: conta AWS, orçamento, Lightsail, IP estático, firewall, DuckDNS, preparar o servidor, subir o proxy, adicionar um app, recriar, custos, fim dos créditos — `../servidor-apps/`
- [x] T015 [US5] Habits: `docker-compose.prod.yml` sem Caddy, com `web` na rede `proxy` (apelido `habits-web`); remover `deploy/Caddyfile` e `scripts/server-setup.sh` (P17) — raiz, `deploy/`, `scripts/`
- [x] T016 [US3] `scripts/deploy.sh`: conferir a rede `proxy` antes de subir (P20) — `scripts/`
- [x] T017 [US1] `docs/deploy.md` só com a parte do Habits; `.env.example`, README e CLAUDE.md com `habits.<nome>.duckdns.org` e o `servidor-apps` — `docs/`, raiz
- [x] T018 [US5] Teste local no WSL: rede `proxy` + `servidor-apps` com `APPS_DOMAIN=localhost` + Habits de produção em projeto separado; `https://habits.localhost/api/auth/me` → 401, `https://localhost` → 404, banco e API do Habits fora da rede `proxy`
- [x] **Checkpoint**: `bash -n` nos scripts; os dois composes válidos; desenvolvimento local do Habits continua igual (RF-010)

> Teste local (2026-11-16, WSL, portas 8088/8443): `/api/auth/me` → 401, `/` → 200, raiz → 404 "Nenhum app neste endereço.", `http://` → 308 para `https://`, subdomínio sem app → TLS recusado, HSTS presente; rede `proxy` só com `web` e Caddy; Caddy não alcança `api` nem `db`.

## Fase 2 — Provedores e servidor (você, com o README do `servidor-apps` e o `docs/deploy.md`)

- [x] T019 **(você)** Conta AWS no plano gratuito: MFA no usuário raiz, conferir créditos, orçamento mensal de US$ 16 com alertas em 80% e 100%
- [x] T020 **(você)** Instância Lightsail `servidor-apps` (2 GB, Ubuntu 24.04, Ohio) e IP estático `52.15.99.27` — acesso por SSH conferido em 2026-11-16
- [x] T021 **(você)** Porta 443 (HTTPS) no firewall do Lightsail, IPv4 e IPv6
- [x] T022 **(você)** Domínio genérico no DuckDNS apontando para o IP estático; conferir que `habits.<nome>.duckdns.org` resolve para o mesmo IP — `alexapps.duckdns.org`
- [x] T023 **(você)** Repositório `servidor-apps` no GitHub; chave SSH do deploy do Habits; `server-setup.sh`; `.env` com `APPS_DOMAIN`; subir o proxy
- [x] T024 **(você)** Habits no servidor: clone em `/opt/habitsapp`, `.env`, primeiro `deploy.sh` manual — no ar em 2026-11-17
- [x] T025 **(você)** Cadastrar `DEPLOY_HOST`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS` nos secrets do GitHub do Habits
- [x] **Checkpoint**: `https://habits.<nome>.duckdns.org` abre o app com cadeado

> Conferido de fora em 2026-11-17: `/` → 200, `/api/auth/me` → 401, `http://` → 308 para
> `https://`, HSTS presente, `https://alexapps.duckdns.org` → 404; portas 5432, 8080 e 8081
> fechadas. Execução manual do workflow (2026-11-17): testes verdes e "Publicado com sucesso"
> pelo GitHub Actions.

## Fase 3 — Verificação e encerramento

- [ ] T026 Merge desta branch → Actions roda testes e publica sozinho
- [ ] T027 Executar o checklist; se passar, marcar a spec como **Implementada** e atualizar `docs/sdd-guia.md`
- [ ] T028 Registrar na agenda o lembrete do 5º mês após o cadastro na AWS: abrir a spec de backup e permanência (caso de borda da spec)

---

## Checklist de verificação

### US1 — Acesso
- [ ] **V-01** (1.1) `https://habits.<nome>.duckdns.org` abre com cadeado; cadastro e marcação pelo celular fora da rede da empresa (CS-001).
- [ ] **V-02** (1.2) `http://` redireciona para `https://`.
- [ ] **V-03** (1.3) Com o PC desligado/sem WSL, o app continua acessível.
- [ ] **V-04** Cookie `SESSION` com `Secure`, `HttpOnly`, `SameSite=Lax` (DevTools).

### US2 — Dados
- [ ] **V-05** (2.1) Reiniciar o servidor pelo painel do Lightsail: dados e sessão continuam.
- [ ] **V-06** (2.2) Publicar uma versão nova: dados continuam e o usuário segue logado.

### US3 — Publicação automática
- [ ] **V-07** (3.1) Merge com mudança visível aparece no ar em até 15 min sem ação manual (CS-002).
- [ ] **V-08** (3.2) Branch de teste com um teste quebrado: deploy não roda e a versão anterior continua.
- [ ] **V-09** (3.3) Falha de deploy gera e-mail do GitHub.

### US4 — Custo e segurança
- [ ] **V-10** (4.5) De fora, portas 5432, 8080 e 8081 do servidor não respondem; só 22/80/443.
- [ ] **V-11** (4.4) Busca nos dois repositórios não encontra senhas, chaves ou `.env` (CS-004).
- [ ] **V-12** (4.1) Após alguns dias, *Billing* da AWS mostra o gasto descontado dos créditos e nada a pagar no cartão; conta continua no plano gratuito (CS-003).
- [ ] **V-13** (4.2) Projeção do *Cost Explorer* para o mês ≤ US$ 16 (CS-003).
- [ ] **V-14** (4.3) Orçamento de US$ 16 existe em *Budgets* com alertas de 80% e 100% para o e-mail do responsável (RF-011).
- [ ] **V-15** Desenvolvimento local continua funcionando como antes (RF-010).

### US5 — Convivência com outros apps
- [ ] **V-16** (5.3) `https://<nome>.duckdns.org` responde 404 sem conteúdo do Habits; um subdomínio sem app não abre o Habits.
- [ ] **V-17** (5.1, CS-005) Um app de teste (ex.: `whoami`) ganha `teste.<nome>.duckdns.org` com cadeado mexendo só no `servidor-apps`.
- [ ] **V-18** (5.2) Com o app de teste no ar, publicar o Habits: o app de teste continua respondendo durante e depois.
- [ ] **V-19** (5.4) No servidor, `docker network inspect proxy` lista só o `web` do Habits (e o Caddy/apps), nunca `db` ou `api`.
