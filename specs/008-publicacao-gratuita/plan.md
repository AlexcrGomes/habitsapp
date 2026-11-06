# Plano de Implementação: Publicação gratuita para testes com usuários

**Branch**: `008-publicacao-gratuita` | **Data**: 2026-11-03 | **Spec**: [spec.md](./spec.md)
**Status**: Aprovado em 2026-11-03 | **Tarefas**: [tasks.md](./tasks.md)

---

## Resumo

Uma VM ARM **Always Free** da Oracle Cloud (Ubuntu) roda o mesmo `docker-compose.yml` do
desenvolvimento, com um arquivo extra `docker-compose.prod.yml` que acrescenta o **Caddy**
(HTTPS automático com Let's Encrypt) na frente do `web` e fecha todas as outras portas. O
endereço é um subdomínio **DuckDNS**. Um workflow do **GitHub Actions** roda os testes a cada
push na `main` e, se passarem, entra por SSH na VM e executa `scripts/deploy.sh`, que puxa o
código e reconstrói os contêineres **na própria VM** (sem registro de imagens). Os dados
ficam no volume `pgdata`, que nunca é removido; o Flyway migra o esquema na subida da API.

## Contexto técnico

| Item | Valor |
|------|-------|
| Servidor | Oracle Cloud Always Free, `VM.Standard.A1.Flex` (ARM64), 2 OCPU / 12 GB, Ubuntu 24.04, disco de 50 GB |
| Proxy HTTPS | `caddy:2.10.2-alpine` (versão fixa; certificado Let's Encrypt automático) |
| Endereço | `<nome>.duckdns.org` apontando para o IP público **reservado** da VM |
| CI/CD | GitHub Actions (grátis em repositório público; 2.000 min/mês em privado) |
| Imagens | Construídas na VM (ARM64 nativo); as bases fixadas (postgres, temurin, node, nginx) têm variante arm64 |
| Segredos | `.env` só na VM; no GitHub, *Actions secrets* para o acesso SSH |
| Riscos | Falta de capacidade ARM na região; VM ociosa recuperada pela Oracle (sem backup = perda de dados, aceito na spec); firewall duplo da Oracle (lista de segurança + iptables da imagem Ubuntu) |

---

## Constitution Check (2.0.0)

| Princípio | Conforme? | Observação |
|-----------|-----------|------------|
| I. Spec antes do código | ✅ | Spec aprovada em 2026-11-03 |
| II. Stack oficial | ✅* | Docker Compose continua sendo a forma de rodar; Caddy e GitHub Actions são ferramentas de infraestrutura novas, justificadas em Complexity Tracking; versões fixas |
| III. Dados isolados por usuário | ✅ | Sem mudança de código de dados; volume preservado; esquema só por Flyway |
| IV. pt-BR e acessível | ✅ | Sem mudança de interface; documentação em pt-BR |
| V. Responsivo | ✅ | Sem mudança de interface |
| VI. Verificação | ✅ | CI roda `mvn verify` e `npm test`/`build` antes de publicar; checklist manual no endereço público |
| VII. Segurança | ✅ | HTTPS obrigatório e cookie `Secure`; só 22/80/443 abertos; SSH só por chave; banco e API sem porta publicada; segredos fora do git |

---

## Pesquisa e decisões

| # | Decisão | Alternativas | Motivo |
|---|---------|--------------|--------|
| P1 | Caddy como proxy HTTPS | Nginx + certbot; Cloudflare Tunnel | HTTPS e renovação automáticos com ~5 linhas de configuração; um contêiner a mais, sem cron |
| P2 | Arquivo `docker-compose.prod.yml` sobreposto | Compose separado; perfis | O `docker-compose.yml` do desenvolvimento fica intacto (RF-010); produção só acrescenta/remove o necessário |
| P3 | Build na VM via `scripts/deploy.sh` | Build no Actions + registro (GHCR) | Evita emulação ARM lenta no CI e registro de imagens; a VM tem CPU/RAM de sobra |
| P4 | Deploy por SSH a partir do Actions | Ferramenta de terceiros (Watchtower, ssh-action) | Só o `ssh` do runner; nenhuma ação de terceiros com acesso ao servidor |
| P5 | Usuário `deploy` na VM, sem senha, chave SSH exclusiva do CI | Usar a conta padrão `ubuntu` | Chave do CI separada da chave pessoal; revogável sozinha |
| P6 | `HABITS_COOKIE_SECURE=true` no `.env` da VM | Mudar o padrão no código | Desenvolvimento local continua em HTTP |
| P7 | IP público reservado + DuckDNS | IP efêmero | O endereço continua o mesmo se a VM for recriada (caso de borda) |
| P8 | Aviso de falha = e-mail padrão do GitHub Actions | Bot/integração | Já incluso e gratuito (RF-005) |

---

## Arquivos afetados

```
docker-compose.prod.yml         # novo: caddy; remove portas de web/api; restart sempre
deploy/Caddyfile                # novo: {$HABITS_DOMAIN} → reverse_proxy web:80, cabeçalhos HSTS
scripts/deploy.sh               # novo: atualizar código e reconstruir na VM
scripts/server-setup.sh         # novo: preparar a VM (Docker, firewall, usuário deploy, swap)
.github/workflows/deploy.yml    # novo: testes → deploy por SSH (só na main)
.env.example                    # + HABITS_DOMAIN (vazio no dev)
docs/deploy.md                  # novo: passo a passo para criar/recriar o servidor e operar
README.md, CLAUDE.md            # seção "Publicação"
```

### `docker-compose.prod.yml` (esboço)

```yaml
services:
  caddy:
    image: caddy:2.10.2-alpine
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    environment:
      HABITS_DOMAIN: ${HABITS_DOMAIN}
    volumes:
      - ./deploy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data        # certificados (evita limite do Let's Encrypt a cada deploy)
    depends_on: [web]
  web:
    ports: !reset []           # só o Caddy fala com o web
  api:
    ports: !reset []           # sem 127.0.0.1:8081 em produção
volumes:
  caddy_data:
```

### `scripts/deploy.sh` (passos)

1. `cd /opt/habitsapp && git fetch origin main && git reset --hard origin/main`
   (a VM nunca tem alterações locais; `.env` é ignorado pelo git).
2. `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --remove-orphans`
   — as imagens novas são construídas com as antigas ainda no ar; a troca leva segundos.
3. Esperar a API responder (`curl` em `https://$HABITS_DOMAIN/api/auth/me` devolvendo 401)
   por até 3 minutos; senão sair com erro (o Actions marca falha e o GitHub envia e-mail).
4. `docker image prune -f` para o disco gratuito não encher.

Nunca usa `down -v`: o volume `pgdata` só é removido manualmente (RC-001).

### `.github/workflows/deploy.yml` (esboço)

- `on: push` em `main` (merge de PR) + `workflow_dispatch`.
- `concurrency: deploy` para não haver dois deploys ao mesmo tempo.
- Job `test` (ubuntu-latest, Docker disponível para o Testcontainers):
  `actions/setup-java@v4` (Temurin 21) → `mvn -B verify` em `api/`;
  `actions/setup-node@v4` (Node 22) → `npm ci && npm test && npm run build` em `web/`.
- Job `deploy` (`needs: test`): grava `DEPLOY_SSH_KEY` e `DEPLOY_KNOWN_HOSTS` dos secrets e
  roda `ssh deploy@$DEPLOY_HOST /opt/habitsapp/scripts/deploy.sh`.
- Secrets: `DEPLOY_HOST`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS` (sem eles o job de deploy é
  pulado, para forks não falharem).

### Preparação da VM (`scripts/server-setup.sh` + `docs/deploy.md`)

- Lista de segurança da VCN: entrada só 22, 80, 443.
- iptables da imagem Ubuntu da Oracle: liberar 80/443 (bloqueados por padrão) e persistir.
- SSH só por chave (`PasswordAuthentication no`), atualizações automáticas de segurança
  (`unattended-upgrades`), swap de 2 GB.
- Docker Engine + plugin Compose (repositório oficial), usuário `deploy` no grupo `docker`.
- Clonar o repositório em `/opt/habitsapp`, criar `.env` com senha gerada na VM,
  `HABITS_COOKIE_SECURE=true`, `HABITS_DOMAIN=<nome>.duckdns.org`.
- DuckDNS: apontar o subdomínio para o IP reservado (cron de atualização opcional).

## Fluxo

Merge do PR na `main` → Actions roda testes → (verde) SSH na VM → `deploy.sh` reconstrói e
sobe → verificação de saúde → fim. (vermelho) → nada é publicado; e-mail do GitHub.

---

## Ajustes durante a implementação

| Ajuste | Motivo |
|--------|--------|
| O workflow também roda os testes em pull requests (sem publicar) | Mostra no PR se os testes passam antes do merge |
| Scripts chamados com `bash scripts/…sh` | Não depende do bit de execução no git (repositório editado no Windows) |
| `HABITS_DOMAIN` obrigatório no compose de produção | Falha clara se o `.env` da VM estiver incompleto |

---

## Complexity Tracking

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|----------|----------------------|-------------------------------------------|
| Novo contêiner Caddy | HTTPS público é obrigatório (Princípio VII) | Nginx atual + certbot exigiria cron de renovação e certificados montados à mão |
| GitHub Actions | Publicação automática foi decisão da spec | Deploy manual não atende RF-004 |
