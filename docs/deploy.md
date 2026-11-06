# Publicação — passo a passo (spec 008)

Como colocar o Habits no ar de graça, numa VM **Always Free** da Oracle Cloud, com HTTPS num
subdomínio **DuckDNS** e publicação automática pelo **GitHub Actions** a cada merge na `main`.
Decisões e motivos: [`specs/008-publicacao-gratuita/plan.md`](../specs/008-publicacao-gratuita/plan.md).

```
navegador ──HTTPS──► Caddy (80/443) ──► web (Nginx + React) ──/api──► api (Spring Boot) ──► db (PostgreSQL)
                     └── único serviço exposto à internet ──┘
GitHub (merge na main) ──► Actions: testes ──(verde)──► SSH na VM ──► scripts/deploy.sh
```

> ⚠️ **Sem backup nesta fase** (decisão da spec 008). Se a VM for apagada ou recuperada
> pela Oracle, os dados dos usuários se perdem. Avise os usuários de teste.

---

## 1. Criar a VM na Oracle Cloud

1. Crie a conta em <https://www.oracle.com/cloud/free/>. Escolha a **região de origem** com
   cuidado (não dá para trocar; São Paulo ou Vinhedo). O cartão é só para validação: fique no
   plano **Always Free** e não faça upgrade para "Pay As You Go".
2. **Compute → Instances → Create instance**:
   - *Image*: **Canonical Ubuntu 24.04** (não o "Minimal").
   - *Shape*: **Ampere → VM.Standard.A1.Flex**, **2 OCPU / 12 GB** (o selo "Always Free-eligible"
     tem que aparecer).
   - *Networking*: crie uma VCN nova com sub-rede **pública** e marque "Assign a public IPv4".
   - *SSH keys*: cole a **sua** chave pública pessoal (a do seu PC, não a do CI).
   - *Boot volume*: 50 GB.
   - Se aparecer **"Out of capacity"**: tente outro *Availability Domain*, menos OCPU (1 OCPU /
     6 GB também funciona) ou tente de novo mais tarde.
3. **IP fixo**: em *Networking → Reserved public IPs*, reserve um IP e associe à VNIC da VM
   (troque o IP efêmero pelo reservado). Assim o endereço não muda se a VM for recriada.
4. **Portas**: em *VCN → Security Lists → Default*, adicione regras de entrada (*Ingress*)
   TCP de origem `0.0.0.0/0` para as portas **80** e **443** (a 22 já vem aberta). Não abra
   5432, 8080 ou 8081.

## 2. Subdomínio no DuckDNS

1. Entre em <https://www.duckdns.org> (login com GitHub ou Google).
2. Crie um subdomínio (ex.: `meuhabits`) e coloque em *current ip* o **IP reservado** da VM.
3. Confira: `nslookup meuhabits.duckdns.org` deve responder com o IP da VM.

## 3. Chave SSH do deploy (no seu PC)

Chave **exclusiva** do GitHub Actions, sem senha, separada da sua chave pessoal:

```bash
ssh-keygen -t ed25519 -C "habits-deploy" -N "" -f ~/.ssh/habits_deploy
```

Gera `~/.ssh/habits_deploy` (privada → secret do GitHub) e `~/.ssh/habits_deploy.pub`
(pública → servidor). Nunca coloque a privada no repositório.

## 4. Preparar a VM

```bash
ssh ubuntu@<IP-da-VM>
curl -fsSLO https://raw.githubusercontent.com/AlexcrGomes/habitsapp/main/scripts/server-setup.sh
sudo bash server-setup.sh "<conteúdo de ~/.ssh/habits_deploy.pub>"
```

O script instala Docker e Compose, libera 80/443 no iptables (a imagem da Oracle bloqueia),
desliga login SSH por senha, liga atualizações automáticas de segurança, cria 2 GB de swap,
cria o usuário `deploy` e clona o repositório em `/opt/habitsapp`.

> Se o repositório for **privado**, o clone e o `git fetch` precisam de acesso: crie uma
> *deploy key* somente leitura no GitHub (*Settings → Deploy keys*) para o usuário `deploy`.

## 5. Criar o `.env` de produção (na VM)

```bash
sudo -u deploy bash -c 'cd /opt/habitsapp && cp .env.example .env && chmod 600 .env'
sudo -u deploy nano /opt/habitsapp/.env
```

| Variável | Valor em produção |
|----------|-------------------|
| `POSTGRES_PASSWORD` | Senha forte gerada na VM: `openssl rand -base64 32` |
| `HABITS_COOKIE_SECURE` | `true` |
| `HABITS_DOMAIN` | `meuhabits.duckdns.org` |

O `.env` existe **só** na VM. Guarde a senha do banco num gerenciador de senhas.

## 6. Primeiro deploy (manual, na VM)

```bash
sudo -u deploy bash /opt/habitsapp/scripts/deploy.sh
```

A primeira vez demora (baixa imagens e dependências, compila a API e o React). No fim deve
aparecer **"Publicado com sucesso"**. Abra `https://meuhabits.duckdns.org`.

## 7. Publicação automática (GitHub)

No repositório: *Settings → Secrets and variables → Actions → New repository secret*:

| Secret | Valor |
|--------|-------|
| `DEPLOY_HOST` | `meuhabits.duckdns.org` (ou o IP) |
| `DEPLOY_SSH_KEY` | conteúdo de `~/.ssh/habits_deploy` (a **privada**) |
| `DEPLOY_KNOWN_HOSTS` | saída de `ssh-keyscan -t ed25519 meuhabits.duckdns.org` |

A partir daí, cada merge na `main` roda [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml):
testes da API e do web → se passarem, `scripts/deploy.sh` na VM. Se algo falhar, o GitHub
envia e-mail e a versão anterior continua no ar. Para publicar sem merge: *Actions → Testes e
publicação → Run workflow*.

---

## Operação do dia a dia

```bash
ssh ubuntu@<IP-da-VM>
cd /opt/habitsapp
alias dc='docker compose -f docker-compose.yml -f docker-compose.prod.yml'
dc ps                    # situação dos contêineres
dc logs -f --tail 100 api
dc restart api
```

- **Nunca** rode `docker compose down -v` em produção: o `-v` apaga o volume `pgdata` com
  todos os dados.
- Reiniciar a VM é seguro: os contêineres têm `restart: unless-stopped`.

## Recriar o servidor do zero

1. Crie a VM nova (passo 1) e associe a ela o **mesmo IP reservado** — o DuckDNS continua
   valendo.
2. Repita os passos 4 a 6. Atualize o secret `DEPLOY_KNOWN_HOSTS` (a VM nova tem outra
   chave de host).
3. Sem backup, o banco começa vazio.

## Custos

Confira de vez em quando *Billing → Cost Analysis* no painel da Oracle: deve ficar em
**R$ 0,00**. A VM parada por muito tempo (uso de CPU muito baixo por 7 dias) pode ser
recuperada pela Oracle; com usuários usando, isso não deve acontecer.
