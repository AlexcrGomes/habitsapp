#!/usr/bin/env bash
# Gera o par de chaves VAPID (P-256) das notificações (spec 011, plan P2). Rode UMA vez por
# ambiente e copie as duas linhas para o .env. Nunca troque as chaves de produção: todas as
# inscrições de push dos aparelhos deixariam de valer. Nada é gravado em disco.
# Uso: scripts/gerar-vapid.sh
set -euo pipefail

b64url() { base64 | tr -d '=\n' | tr '/+' '_-'; }

pem="$(openssl ecparam -name prime256v1 -genkey -noout)"
# DER da chave privada (SEC1): 7 bytes de cabeçalho, depois os 32 bytes do escalar d
private="$(printf '%s\n' "$pem" | openssl ec -outform DER 2>/dev/null | tail -c +8 | head -c 32 | b64url)"
# DER da chave pública (SPKI): os últimos 65 bytes são o ponto não comprimido (0x04 || X || Y)
public="$(printf '%s\n' "$pem" | openssl ec -pubout -outform DER 2>/dev/null | tail -c 65 | b64url)"

echo "HABITS_VAPID_PUBLIC_KEY=$public"
echo "HABITS_VAPID_PRIVATE_KEY=$private"
