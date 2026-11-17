# Publicação — passo a passo (spec 008)

O Habits é o primeiro app do **`servidor-apps`**, um servidor **Amazon Lightsail**
compartilhado com outros apps pequenos e pago com os créditos do plano gratuito da AWS. Ele
fica em **`https://habits.<nome>.duckdns.org`**, com publicação automática pelo **GitHub
Actions** a cada merge na `main`. Decisões e motivos:
[`specs/008-publicacao-gratuita/plan.md`](../specs/008-publicacao-gratuita/plan.md).

```
navegador ──HTTPS──► Caddy do servidor-apps (80/443) ──habits.<nome>…──► web (habits-web) ──/api──► api ──► db
GitHub (merge na main) ──► Actions: testes ──(verde)──► SSH no servidor ──► scripts/deploy.sh
```

A parte comum do servidor fica no repositório
**[servidor-apps](https://github.com/AlexcrGomes/servidor-apps)**: conta AWS, orçamento,
Lightsail, IP estático, firewall, DuckDNS, preparação do servidor e o proxy HTTPS (Caddy).
Aqui fica só o que é do Habits:

- [`docker-compose.prod.yml`](../docker-compose.prod.yml): tira as portas de `web` e `api` e
  liga o `web` à rede `proxy` com o apelido `habits-web`. `db` e `api` ficam só na rede
  interna do Habits.
- [`scripts/deploy.sh`](../scripts/deploy.sh): atualiza o código e reconstrói só os
  contêineres do Habits; o proxy e os outros apps não são tocados.

> ⚠️ **Sem backup nesta fase** (decisão da spec 008). O plano gratuito da AWS encerra a conta
> 6 meses após o cadastro ou quando os créditos acabam, e os dados se perdem. Avise os
> usuários de teste.

---

## 1. Pré-requisito: servidor pronto

Siga o README do **servidor-apps** até o passo 8 (proxy no ar). Ao final:

- `ssh servidor-apps` entra no servidor;
- `https://<nome>.duckdns.org` mostra "Nenhum app neste endereço." com cadeado;
- `nslookup habits.<nome>.duckdns.org` responde com o IP estático;
- a chave `~/.ssh/habits_deploy.pub` foi passada ao `server-setup.sh` (usuário `deploy`).

## 2. Código do Habits no servidor

```bash
ssh servidor-apps
sudo install -d -o deploy -g deploy /opt/habitsapp
sudo -u deploy git clone https://github.com/AlexcrGomes/habitsapp.git /opt/habitsapp
```

A pasta é criada antes porque `/opt` pertence ao root e o usuário `deploy` não pode criar
pastas nela.

## 3. Criar o `.env` de produção (no servidor)

```bash
sudo -u deploy bash -c 'cd /opt/habitsapp && cp .env.example .env && chmod 600 .env'
sudo -u deploy nano /opt/habitsapp/.env
```

| Variável | Valor em produção |
|----------|-------------------|
| `POSTGRES_PASSWORD` | Senha forte gerada no servidor: `openssl rand -base64 32` |
| `HABITS_COOKIE_SECURE` | `true` |
| `HABITS_DOMAIN` | `habits.<nome>.duckdns.org` (ex.: `habits.alexapps.duckdns.org`) |

O `.env` existe **só** no servidor. Guarde a senha do banco num gerenciador de senhas.

## 4. Primeiro deploy (manual, no servidor)

```bash
sudo -u deploy bash /opt/habitsapp/scripts/deploy.sh
```

A primeira vez demora (baixa imagens e dependências, compila a API e depois o React, um de
cada vez). No fim deve aparecer **"Publicado com sucesso"**. Abra
`https://habits.<nome>.duckdns.org`.

## 5. Publicação automática (GitHub)

No repositório do Habits: *Settings → Secrets and variables → Actions → New repository
secret*:

| Secret | Valor |
|--------|-------|
| `DEPLOY_HOST` | o IP estático do servidor (ou `<nome>.duckdns.org`) |
| `DEPLOY_SSH_KEY` | conteúdo de `~/.ssh/habits_deploy` (a **privada**) |
| `DEPLOY_KNOWN_HOSTS` | saída de `ssh-keyscan -t ed25519 <o mesmo valor de DEPLOY_HOST>` |

O `DEPLOY_KNOWN_HOSTS` é uma linha no formato `<host> ssh-ed25519 AAAA…`, e o `<host>` precisa
ser exatamente o valor do `DEPLOY_HOST`. Sem isso o deploy falha com "Host key verification
failed".

A partir daí, cada merge na `main` roda [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml):
testes da API e do web → se passarem, `scripts/deploy.sh` no servidor. Se algo falhar, o
GitHub envia e-mail e a versão anterior continua no ar. Para publicar sem merge: *Actions →
Testes e publicação → Run workflow*.

---

## Operação do dia a dia

```bash
ssh servidor-apps
cd /opt/habitsapp
alias dc='docker compose -f docker-compose.yml -f docker-compose.prod.yml'
dc ps                    # situação dos contêineres do Habits
dc logs -f --tail 100 api
dc restart api
```

- **Nunca** rode `docker compose down -v` em produção: o `-v` apaga o volume `pgdata` com
  todos os dados.
- Reiniciar o servidor é seguro: os contêineres têm `restart: unless-stopped`.
- Erros de certificado ou de encaminhamento aparecem nos logs do proxy:
  `cd /opt/servidor-apps && docker compose logs --tail 100 caddy`.

## Recriar o servidor do zero

1. Recrie o servidor pelo README do servidor-apps (seção "Recriar o servidor do zero").
2. Repita os passos 2 a 4 daqui. Atualize o secret `DEPLOY_KNOWN_HOSTS` (o servidor novo tem
   outra chave de host).
3. Sem backup, o banco começa vazio.
