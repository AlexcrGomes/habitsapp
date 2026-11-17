#!/usr/bin/env bash
# Publica a versão atual da main no servidor compartilhado (spec 008). Roda NO SERVIDOR, como
# o usuário deploy. Chamado pelo GitHub Actions por SSH; também pode ser rodado à mão.
# Só mexe nos contêineres do Habits: o proxy (servidor-apps) e os outros apps não são tocados.
# Nunca usa "down -v": o volume pgdata (dados dos usuários) só é removido manualmente.
set -euo pipefail

app_dir="${HABITS_APP_DIR:-/opt/habitsapp}"
cd "$app_dir"

if [[ ! -f .env ]]; then
  echo "Arquivo .env não encontrado em $app_dir (veja docs/deploy.md)." >&2
  exit 1
fi
domain="$(grep -E '^HABITS_DOMAIN=' .env | cut -d= -f2-)"
if [[ -z "$domain" ]]; then
  echo "HABITS_DOMAIN vazio no .env (ex.: habits.nome.duckdns.org)." >&2
  exit 1
fi
if ! docker network inspect proxy >/dev/null 2>&1; then
  echo "Rede Docker 'proxy' não encontrada: prepare o servidor pelo repositório servidor-apps." >&2
  exit 1
fi

echo "==> Atualizando o código"
git fetch --quiet origin main
git reset --quiet --hard origin/main
git log --oneline -1

compose=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

# Um build de cada vez: com 2 GB de RAM, Maven e Vite juntos (com o app no ar) podem esgotar
# a memória. A versão antiga continua no ar até a troca.
echo "==> Construindo a API"
"${compose[@]}" build api
echo "==> Construindo o web"
"${compose[@]}" build web

echo "==> Subindo os contêineres"
"${compose[@]}" up -d --remove-orphans

echo "==> Aguardando a API responder em https://$domain"
for _ in $(seq 1 36); do
  # Sem sessão a API responde 401: significa que está no ar
  status="$(curl -s -o /dev/null -w '%{http_code}' "https://$domain/api/auth/me" || true)"
  if [[ "$status" == "401" ]]; then
    echo "==> Publicado com sucesso"
    docker image prune -f >/dev/null
    exit 0
  fi
  sleep 5
done

echo "A API não respondeu em 3 minutos (último status: $status)." >&2
"${compose[@]}" ps >&2
"${compose[@]}" logs --tail 50 api >&2
exit 1
