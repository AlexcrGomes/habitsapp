# Plano de Implementação: Atualizar dependências vulneráveis

**Branch**: `007-atualizar-dependencias` | **Data**: 2026-11-05 | **Spec**: [spec.md](./spec.md)
**Status**: Aprovado em 2026-11-05 | **Tarefas**: [tasks.md](./tasks.md)

---

## Resumo

Na API, o Spring Boot continua em 3.5.16 (última versão gratuita da linha) e as bibliotecas
vulneráveis com correção na mesma linha sobem por **sobrescrita das propriedades de versão**
que o Boot gerencia, no `pom.xml`. No frontend, o Vitest sobe de 3.2.7 para 5.0.5. As
imagens Docker já estão na versão de correção mais recente de cada linha e só são
conferidas e reconstruídas. Nenhum código de produção muda.

## Contexto técnico

| Item | Antes | Depois |
|------|-------|--------|
| Spring Boot (parent) | 3.5.16 | 3.5.16 (sem 3.5.17 gratuita) |
| `tomcat.version` | 10.1.55 | **10.1.61** (06/10/2026) |
| `jackson-bom.version` | 2.21.4 | **2.21.8** (17/10/2026) |
| `postgresql.version` | 42.7.11 | **42.7.14** (07/10/2026) |
| `log4j2.version` | 2.24.3 | **2.25.5** (01/07/2026) |
| `vitest` | 3.2.7 | **5.0.5** (15/10/2026) |
| Imagens | `postgres:17.11-alpine`, `maven:3.9.16-eclipse-temurin-21`, `eclipse-temurin:21.0.13_9-jre-alpine`, `node:22.23.4-alpine`, `nginx:1.28.3-alpine` | Iguais: já são a correção mais recente de cada linha (conferido no Docker Hub em 2026-11-05) |

Todas as versões novas foram publicadas há mais de 2 semanas (critério da spec 005, P6).

---

## Constitution Check (2.0.0)

| Princípio | Conforme? | Observação |
|-----------|-----------|------------|
| I. Spec antes do código | ✅ | Spec aprovada em 2026-11-05 |
| II. Stack oficial, versões fixas | ✅ | Mesma stack; versões exatas, sem faixas; nenhuma dependência nova |
| III. Dados isolados / Flyway | ✅ | Sem mudança de esquema; mesma versão principal do PostgreSQL |
| IV. pt-BR e acessível | ✅ | Interface não muda |
| V. Responsivo | ✅ | Interface não muda |
| VI. Verificação | ✅ | Suítes completas da API e do web + regressão manual + auditoria refeita |
| VII. Segurança | ✅ | Objetivo da spec; riscos restantes registrados na spec |

---

## Pesquisa e decisões

| # | Decisão | Alternativas | Motivo |
|---|---------|--------------|--------|
| P1 | Sobrescrever `tomcat.version`, `jackson-bom.version`, `postgresql.version` e `log4j2.version` em `<properties>` do `pom.xml` | Declarar cada artefato com `<version>`; migrar para Boot 4 | Mecanismo oficial do Boot: troca o conjunto inteiro (ex.: todos os módulos do Jackson e do Tomcat) de uma vez; Boot 4 recusado na spec |
| P2 | Versões mais recentes da linha (10.1.61, 2.21.8, 42.7.14), não as mínimas corrigidas | Mínimas (10.1.58, 2.21.7, 42.7.12) | Trazem também correções publicadas depois do levantamento; mesma linha, mesmo risco de compatibilidade |
| P3 | Vitest **5.0.5**, não 5.1.0 | 5.1.0 (02/11) | 5.1.0 tem 3 dias; 5.0.5 já zera o `npm audit` (conferido com lockfile de teste) |
| P4 | Log4j 2.24 → 2.25 (minor) | Ficar em 2.24.3 | Única linha com correção; o app só usa a ponte `log4j-to-slf4j` do Boot |
| P5 | Spring MVC 6.2.19 mantido | — | Risco aceito na spec (recursos não usados) |

## Arquivos afetados

```
api/pom.xml              # 4 propriedades de versão
web/package.json         # vitest 5.0.5
web/package-lock.json    # regenerado (inclui binários nativos do Linux, como hoje)
web/vite.config.ts       # só se a configuração de teste do Vitest 5 exigir
specs/007-…/spec.md      # status Implementada + resultado da auditoria refeita
docs/sdd-guia.md         # tabela
```

## Riscos

- **Vitest 3 → 5** (duas versões major): mudanças de configuração ou de API de teste podem
  exigir ajustes nos testes; nunca no comportamento testado. Se um ajuste mudar o que um
  teste verifica, parar e atualizar a spec.
- **Jackson/Tomcat mais novos que o Boot espera**: mitigado por serem da mesma linha; as
  suítes de integração (Testcontainers) e o `CsrfFlowIT` (HTTP real no Tomcat) cobrem.
- **Lockfile**: regenerar dentro do WSL/Linux para manter os binários nativos do Rollup
  usados no build do contêiner.

## Verificação

1. Auditoria refeita: `npm audit` sem vulnerabilidades; consulta OSV das dependências de
   execução da API mostrando só as 2 do Spring MVC (riscos aceitos).
2. `scripts/api-mvn.sh verify` e `cd web && npm test && npm run build` verdes.
3. `docker compose up --build` com o volume atual: login com conta existente, hábitos,
   marcações e metas iguais; criar/marcar/editar meta funciona; logs sem erro.

---

## Complexity Tracking

Nenhuma violação.
