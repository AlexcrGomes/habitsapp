#!/usr/bin/env bash
# Roda o Maven da API dentro de um contêiner (não precisa de JDK instalado).
# O socket do Docker é montado para o Testcontainers subir o PostgreSQL dos testes.
# Uso: scripts/api-mvn.sh verify    (padrão: verify)
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"

docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$root/api":/app \
  -v habits-m2:/root/.m2 \
  -w /app \
  -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal \
  --add-host host.docker.internal:host-gateway \
  maven:3.9.16-eclipse-temurin-21 \
  mvn -B "${@:-verify}"
