# Plano de Implementação: Publicação para testes com usuários

**Branch**: `008-publicacao-gratuita` (revisões 2 e 3: `008-publicacao-aws`) | **Data**:
2026-11-03, revisado em 2026-11-14 e 2026-11-16 | **Spec**: [spec.md](./spec.md)
**Status**: Revisão 3 (servidor compartilhado na AWS Lightsail) em 2026-11-16 |
**Tarefas**: [tasks.md](./tasks.md)

---

## Resumo

O Habits é o primeiro app do **`servidor-apps`**, um servidor **Amazon Lightsail** de 2 GB
(Ubuntu 24.04, Ohio) pago com os créditos do plano gratuito da AWS, que vai hospedar outros
apps pequenos. O servidor tem um domínio genérico gratuito no **DuckDNS**
(`<nome>.duckdns.org`, no **IP estático** do Lightsail), e cada app fica num subdomínio:
o Habits em `habits.<nome>.duckdns.org`.

A parte comum do servidor fica num **repositório novo, `servidor-apps`**:
- um único **Caddy**, que atende as portas 80/443, obtém os certificados HTTPS (Let's
  Encrypt) e encaminha cada subdomínio ao app certo;
- a rede Docker externa **`proxy`**, por onde o Caddy fala com os apps;
- a preparação do servidor (Docker, swap, SSH, usuário `deploy`) e o passo a passo da AWS.

No repositório do Habits, o `docker-compose.yml` de desenvolvimento não muda. O
`docker-compose.prod.yml` deixa de ter Caddy: só tira as portas de `web` e `api` e liga o
`web` à rede `proxy` com o apelido `habits-web`. `db` e `api` ficam só na rede interna do
Habits, longe dos outros apps (RF-013).

O deploy do Habits continua igual: o **GitHub Actions** roda os testes a cada push na `main`
e, se passarem, entra por SSH no servidor e executa `scripts/deploy.sh`. O script puxa o
código e reconstrói **só os contêineres do Habits**. Os dados ficam no volume `pgdata`, que
nunca é removido. Um orçamento do **AWS Budgets** avisa se o gasto passar de US$ 16/mês.

## Contexto técnico

| Item | Valor |
|------|-------|
| Servidor | Amazon Lightsail `servidor-apps`, plano Linux de **2 GB** (2 vCPU, SSD de 60 GB, x86_64), Ubuntu 24.04 LTS, *dual-stack*, região **Ohio** (`us-east-2`), IP estático `servidor-apps-ip` |
| Custo | Cerca de US$ 12/mês (IPv4 incluído), descontado dos créditos; ~US$ 72 em 6 meses (RF-008) |
| Domínio | `<nome>.duckdns.org` → IP estático; subdomínios (`habits.<nome>…`) resolvem pelo curinga do DuckDNS |
| Proxy HTTPS | `caddy:2.10.2-alpine`, no repositório `servidor-apps`; um bloco por subdomínio |
| Rede entre proxy e apps | Rede Docker externa `proxy`, criada pela preparação do servidor |
| Habits no servidor | `/opt/habitsapp`, projeto Compose `habitsapp`; `web` na rede `proxy` como `habits-web` |
| Firewall | Firewall do Lightsail (IPv4 e IPv6): só 22, 80 e 443 |
| CI/CD | GitHub Actions do Habits (grátis em repositório público) |
| Memória | 2 GB de RAM + 2 GB de swap, divididos entre os apps; builds um de cada vez |
| Segredos | `.env` de cada repositório só no servidor; no GitHub, *Actions secrets* para o SSH |
| Aviso de gasto | AWS Budgets: US$ 16/mês, alertas em 80% e 100% por e-mail (RF-011) |
| Riscos | Conta encerrada aos 6 meses ou com os créditos esgotados (sem backup = perda de dados, aceito); pouca memória para vários apps (reavaliar no 2º app); o usuário `deploy` é comum aos apps |

---

## Constitution Check (2.1.1)

| Princípio | Conforme? | Observação |
|-----------|-----------|------------|
| I. Spec antes do código | ✅ | Revisão 3 da spec aprovada em 2026-11-16 |
| II. Stack oficial | ✅* | O Habits continua React + Spring Boot + PostgreSQL + Compose. Caddy e GitHub Actions já estavam justificados; o repositório `servidor-apps` só tem infraestrutura (Compose + Caddyfile + shell), justificado em Complexity Tracking; versões fixas |
| III. Dados isolados por usuário | ✅ | Sem mudança de código de dados; volume preservado; esquema só por Flyway; banco fora da rede compartilhada |
| IV. pt-BR e acessível | ✅ | Sem mudança de interface; documentação em pt-BR |
| V. Responsivo | ✅ | Sem mudança de interface |
| VI. Verificação | ✅ | CI roda `mvn verify` e `npm test`/`build` antes de publicar; teste local do proxy com o Habits; checklist manual no endereço público |
| VII. Segurança | ✅ | HTTPS obrigatório e cookie `Secure`; só 22/80/443 abertos; SSH só por chave; banco e API sem porta publicada e fora da rede `proxy`; segredos fora do git; MFA na conta AWS |

---

## Pesquisa e decisões

| # | Decisão | Alternativas | Motivo |
|---|---------|--------------|--------|
| P1 | Caddy como proxy HTTPS | Nginx + certbot; Cloudflare Tunnel | HTTPS e renovação automáticos com poucas linhas por site; sem cron |
| P2 | Arquivo `docker-compose.prod.yml` sobreposto | Compose separado; perfis | O `docker-compose.yml` do desenvolvimento fica intacto (RF-010) |
| P3 | Build no servidor via `scripts/deploy.sh` | Build no Actions + registro (GHCR) | Sem registro de imagens nem segredos extras; deploy num único passo |
| P4 | Deploy por SSH a partir do Actions | Ferramenta de terceiros | Só o `ssh` do runner; nenhuma ação de terceiros com acesso ao servidor |
| P5 | Usuário `deploy` sem senha, com uma chave SSH por app no `authorized_keys` | Usar a conta `ubuntu` | Chave do CI separada da pessoal; cada app revogável sozinho. Limite aceito: o grupo `docker` dá a qualquer chave de deploy poder sobre todos os contêineres |
| P6 | `HABITS_COOKIE_SECURE=true` no `.env` do servidor | Mudar o padrão no código | Desenvolvimento local continua em HTTP |
| P7 | IP estático do Lightsail | IP público dinâmico | O endereço não muda em reinícios ou recriações |
| P8 | Aviso de falha = e-mail padrão do GitHub Actions | Bot/integração | Já incluso e gratuito (RF-005) |
| P9 | Lightsail em vez de EC2 | EC2 `t4g.small` | Preço fixo com IPv4, disco e tráfego incluídos; painel mais simples |
| P10 | Plano de 2 GB + swap de 2 GB | 4 GB (~US$ 24/mês) | Cabe nos US$ 100 garantidos; reavaliar no 2º app (spec) |
| P11 | `deploy.sh` constrói a API e o web um de cada vez antes do `up -d` | `up --build` em paralelo | Em 2 GB, Maven e Vite juntos com os apps no ar podem esgotar a memória |
| P12 | Firewall só no Lightsail | iptables/ufw no Ubuntu | O Ubuntu do Lightsail não bloqueia portas; o Docker ignora o ufw nas portas publicadas |
| P13 | DuckDNS só com IPv4 | Registrar também o IPv6 | Menos um endereço para manter; IPv4 atende todos os usuários |
| P14 | Aviso de gasto pelo AWS Budgets | Conferir o painel à mão | Atende RF-011 sem código; gratuito |
| P15 | Região Ohio (`us-east-2`) | São Paulo | O servidor foi criado em Ohio e o responsável decidiu mantê-lo (spec, 2026-11-16); mesmo preço; ~0,15 s a mais por requisição |
| P16 | **Repositório `servidor-apps`** com Caddy, Caddyfile, preparação do servidor e passo a passo da AWS | Caddy no repositório do Habits | RF-012 e CS-005: app novo não mexe no Habits; o deploy do Habits não reinicia o proxy (RF-013) |
| P17 | **Rede Docker externa `proxy`**; o `web` do Habits entra nela com o apelido `habits-web`; `db` e `api` ficam só na rede `default` do projeto | Publicar portas no host para o proxy | Nenhuma porta de app no host; outros apps não alcançam o banco nem a API do Habits (RF-013, cenário 5.4) |
| P18 | Caddyfile com um bloco por subdomínio, usando `{$APPS_DOMAIN}`; o domínio raiz responde 404 sem conteúdo; subdomínio sem bloco não tem certificado e a conexão HTTPS é recusada | Curinga `*.domínio` | Cenário 5.3; o curinga exigiria certificado por DNS (token do DuckDNS e plugin do Caddy) |
| P19 | Atualizar o proxy é manual: `scripts/atualizar.sh` no `servidor-apps` (pull, `up -d`, `caddy reload`) | CI própria para o `servidor-apps` | Muda raramente (só quando entra um app); `reload` troca a configuração sem derrubar conexões |
| P20 | `deploy.sh` confere se a rede `proxy` existe antes de subir | Deixar o Compose falhar | Mensagem clara apontando para o `servidor-apps` |

---

## Arquivos afetados

### Repositório do Habits

```
docker-compose.prod.yml         # rev. 3: sem caddy; web na rede externa proxy (apelido habits-web)
deploy/Caddyfile                # rev. 3: removido (vai para o servidor-apps)
scripts/server-setup.sh         # rev. 3: removido (vai para o servidor-apps)
scripts/deploy.sh               # rev. 2: builds sequenciais; rev. 3: confere a rede proxy
.github/workflows/deploy.yml    # sem mudança
.env.example                    # HABITS_DOMAIN = habits.<nome>.duckdns.org
docs/deploy.md                  # rev. 3: só a parte do Habits; pré-requisito = servidor-apps pronto
README.md, CLAUDE.md            # seção "Publicação"
```

### Repositório novo `servidor-apps`

```
compose.yml                     # caddy:2.10.2-alpine, portas 80/443, rede externa proxy
Caddyfile                       # domínio raiz → 404; habits.{$APPS_DOMAIN} → habits-web:80
.env.example                    # APPS_DOMAIN=<nome>.duckdns.org
scripts/server-setup.sh         # Docker, SSH só por chave, swap, unattended-upgrades, usuário deploy, rede proxy
scripts/atualizar.sh            # git pull + compose up -d + caddy reload
README.md                       # passo a passo: conta AWS, orçamento, Lightsail, IP, firewall, DuckDNS, preparar, adicionar um app
.gitignore, .gitattributes      # .env fora do git; *.sh com LF
```

### `docker-compose.prod.yml` do Habits (esboço)

```yaml
services:
  web:
    ports: !reset []
    networks:
      default:
      proxy:
        aliases: [habits-web]
  api:
    ports: !reset []
networks:
  proxy:
    external: true
```

### `Caddyfile` do `servidor-apps` (esboço)

```
{$APPS_DOMAIN} {
	respond "Nenhum app neste endereço." 404
}

habits.{$APPS_DOMAIN} {
	encode gzip
	header {
		Strict-Transport-Security "max-age=31536000"
		-Server
	}
	reverse_proxy habits-web:80
}
```

Para adicionar um app: o app novo liga o seu serviço web à rede `proxy` com um apelido
próprio, e o `servidor-apps` ganha um bloco `<app>.{$APPS_DOMAIN}` + `atualizar.sh`.

### `scripts/deploy.sh` do Habits (passos)

1. Conferir o `.env` e a rede `proxy` (P20).
2. `git fetch origin main && git reset --hard origin/main`.
3. `docker compose … build api`, depois `build web` (P11). A versão antiga continua no ar.
4. `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans`
   — só o projeto `habitsapp`; o Caddy e os outros apps não são tocados.
5. Esperar `https://$HABITS_DOMAIN/api/auth/me` devolver 401 por até 3 minutos; senão sair
   com erro (o Actions marca falha e o GitHub envia e-mail).
6. `docker image prune -f`.

Nunca usa `down -v`: o volume `pgdata` só é removido manualmente (RC-001).

### `.github/workflows/deploy.yml` (sem mudança)

Push na `main` → job `test` (`mvn -B verify`; `npm ci && npm test && npm run build`) → job
`deploy` por SSH com `DEPLOY_HOST`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS` (pulado sem eles).

## Fluxo

**Uma vez (servidor-apps)**: conta AWS + orçamento → Lightsail + IP + firewall → DuckDNS →
`server-setup.sh` → `.env` com `APPS_DOMAIN` → `docker compose up -d`.

**Habits**: clone em `/opt/habitsapp` → `.env` → `deploy.sh` manual → secrets no GitHub →
a cada merge na `main`, testes → (verde) `deploy.sh` → verificação de saúde. (vermelho) →
nada é publicado; e-mail do GitHub.

---

## Ajustes durante a implementação (fase 1)

| Ajuste | Motivo |
|--------|--------|
| O workflow também roda os testes em pull requests (sem publicar) | Mostra no PR se os testes passam antes do merge |
| Scripts chamados com `bash scripts/…sh` | Não depende do bit de execução no git (repositório editado no Windows) |
| `HABITS_DOMAIN` obrigatório no compose de produção | Falha clara se o `.env` do servidor estiver incompleto |
| `docs/deploy.md`: criar `/opt/habitsapp` com dono `deploy` antes do clone (2026-11-17) | `/opt` pertence ao root; o clone como `deploy` falhava com *Permission denied* |
| `docs/deploy.md`: formato do `DEPLOY_KNOWN_HOSTS` (2026-11-17) | o primeiro deploy pelo Actions falhou com *Host key verification failed*: a linha precisa começar pelo mesmo valor do `DEPLOY_HOST` |

## Revisão 2 — da Oracle para a AWS Lightsail

| Antes (revisão 1) | Agora (revisão 2) | Motivo |
|-------------------|-------------------|--------|
| VM Oracle Always Free `VM.Standard.A1.Flex` (ARM64), 2 OCPU / 12 GB | Lightsail 2 GB (x86_64), com créditos | A Oracle ficou sem capacidade A1 em São Paulo; decisão da spec em 2026-11-14 (região: Ohio, 2026-11-16) |
| IP público reservado da Oracle | IP estático do Lightsail | Mesmo papel (P7) |
| Lista de segurança da VCN + iptables da imagem Oracle | Só o firewall do Lightsail (P12) | O Ubuntu do Lightsail não bloqueia portas |
| `up -d --build` (builds em paralelo) | Builds sequenciais e depois `up -d` (P11) | 2 GB de RAM em vez de 12 GB |
| Painel de custos da Oracle em R$ 0,00 | Plano gratuito da AWS + AWS Budgets de US$ 16 (P14) | RF-008, RF-011 e CS-003 revisados |

## Revisão 3 — servidor compartilhado

| Antes (revisão 2) | Agora (revisão 3) | Motivo |
|-------------------|-------------------|--------|
| Caddy no `docker-compose.prod.yml` do Habits | Caddy único no repositório `servidor-apps` (P16) | RF-012, CS-005 |
| `deploy/Caddyfile` com só o domínio do Habits | Caddyfile do `servidor-apps`, um bloco por subdomínio (P18) | Vários apps; cenário 5.3 |
| Caddy fala com `web` pela rede do projeto | Rede externa `proxy`, apelido `habits-web` (P17) | RF-013 |
| `scripts/server-setup.sh` no Habits | No `servidor-apps`, criando também a rede `proxy` | A preparação é do servidor, não do app |
| `HABITS_DOMAIN=<nome>.duckdns.org` | `HABITS_DOMAIN=habits.<nome>.duckdns.org` | Domínio genérico (spec) |
| `docs/deploy.md` com a AWS inteira | AWS e servidor no README do `servidor-apps`; `docs/deploy.md` só com o Habits | Cada repositório documenta a sua parte |

---

## Complexity Tracking

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|----------|----------------------|-------------------------------------------|
| Novo contêiner Caddy | HTTPS público é obrigatório (Princípio VII) | Nginx atual + certbot exigiria cron de renovação e certificados montados à mão |
| GitHub Actions | Publicação automática foi decisão da spec | Deploy manual não atende RF-004 |
| Repositório extra `servidor-apps` | RF-012 e CS-005 proíbem a configuração comum no repositório do Habits | Manter o proxy no Habits obrigaria a mexer no Habits a cada app novo |
