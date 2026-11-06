# Tarefas: Publicação gratuita para testes com usuários

**Branch**: `008-publicacao-gratuita` | **Entradas**: [spec.md](./spec.md), [plan.md](./plan.md)

> Formato: `- [ ] T001 [P] [US1] Descrição — arquivo`. Marque `[x]` ao concluir.
> Tarefas marcadas **(você)** exigem ações nas suas contas (Oracle, DuckDNS, GitHub); eu
> preparo os arquivos e o passo a passo.

Histórias: **US1** acesso pela internet · **US2** dados preservados · **US3** publicação
automática · **US4** custo zero e segredos.

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

## Fase 2 — Provedores (você, com o passo a passo)

- [ ] T008 **(você)** Criar conta Oracle Cloud (Always Free), VM ARM, IP reservado, regras 22/80/443
- [ ] T009 **(você)** Criar subdomínio DuckDNS apontando para o IP
- [ ] T010 **(você)** Rodar `server-setup.sh` na VM, criar `.env` lá, cadastrar a chave pública do CI
- [ ] T011 **(você)** Cadastrar `DEPLOY_HOST`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS` nos secrets do GitHub
- [ ] **Checkpoint**: primeiro `deploy.sh` manual na VM sobe o app em `https://<nome>.duckdns.org`

## Fase 3 — Verificação e encerramento

- [ ] T012 Merge desta branch → Actions roda testes e publica sozinho
- [ ] T013 Executar o checklist; se passar, marcar a spec como **Implementada** e atualizar `docs/sdd-guia.md`

---

## Checklist de verificação

### US1 — Acesso
- [ ] **V-01** (1.1) Endereço público abre com cadeado; cadastro e marcação pelo celular fora da rede da empresa (CS-001).
- [ ] **V-02** (1.2) `http://` redireciona para `https://`.
- [ ] **V-03** (1.3) Com o PC desligado/sem WSL, o app continua acessível.
- [ ] **V-04** Cookie `SESSION` com `Secure`, `HttpOnly`, `SameSite=Lax` (DevTools).

### US2 — Dados
- [ ] **V-05** (2.1) Reiniciar a VM: dados e sessão continuam.
- [ ] **V-06** (2.2) Publicar uma versão nova: dados continuam e o usuário segue logado.

### US3 — Publicação automática
- [ ] **V-07** (3.1) Merge com mudança visível aparece no ar em até 15 min sem ação manual (CS-002).
- [ ] **V-08** (3.2) Branch de teste com um teste quebrado: deploy não roda e a versão anterior continua.
- [ ] **V-09** (3.3) Falha de deploy gera e-mail do GitHub.

### US4 — Segurança e custo
- [ ] **V-10** (4.3) De fora, portas 5432, 8080 e 8081 da VM não respondem; só 22/80/443.
- [ ] **V-11** (4.2) Busca no repositório não encontra senhas, chaves ou `.env` (CS-004).
- [ ] **V-12** (4.1) Painel de custos da Oracle mostra R$ 0,00 após alguns dias (CS-003).
- [ ] **V-13** Desenvolvimento local continua funcionando como antes (RF-010).
