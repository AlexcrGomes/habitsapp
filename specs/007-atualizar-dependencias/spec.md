# Especificação da Feature: Atualizar dependências vulneráveis

**Branch**: `007-atualizar-dependencias`
**Criada em**: 2026-11-05
**Status**: Implementada em 2026-11-05 (aprovada em 2026-11-05)
**Entrada**: alerta do GitHub ao publicar a spec 006 ("5 vulnerabilities on the default
branch: 2 critical, 3 moderate"), reservado como spec 007 pela
[spec 008](../008-publicacao-gratuita/spec.md), que recomenda concluí-la antes de abrir o
app para usuários.

> Esta é uma spec de manutenção: não muda o comportamento do app. O "o quê" é eliminar ou
> justificar cada vulnerabilidade conhecida sem quebrar nada do que existe.

---

## Levantamento (2026-11-05)

Fontes: `npm audit` no frontend e consulta das dependências de execução da API à base
pública OSV (mesma origem dos alertas do GitHub). O GitHub agrupa alertas por pacote, por
isso mostra menos itens do que a lista abaixo.

### Frontend — só ferramentas de teste (não vão para o app publicado)

| Pacote | Gravidade | Problema | Correção |
|--------|-----------|----------|----------|
| `tinypool` (via Vitest) | Crítica (2) | Prototype pollution → execução de código | Vitest 5 (versão major) |
| `@vitest/mocker` (via Vitest) | Moderada (2) | Leitura de arquivo / injeção de código em mocks | Vitest 5 |

### API — vão para o servidor

| Pacote | Versão | Gravidade | Correção disponível |
|--------|--------|-----------|---------------------|
| Tomcat embutido | 10.1.55 | 5 críticas, 1 alta, 1 moderada (autorização, autenticação, HTTP/2) | 10.1.58+ (última: 10.1.61) |
| Jackson (databind/core) | 2.21.4 | 5 altas, 6 moderadas (DoS, bypass de `@JsonView`) | 2.21.7+ (última: 2.21.8) |
| Driver PostgreSQL | 42.7.11 | 1 alta (rebaixamento de autenticação) | 42.7.12+ (última: 42.7.14) |
| Log4j API | 2.24.3 | 1 moderada | 2.25.5 |
| Spring MVC | 6.2.19 | 2 críticas (eventos SSE com fragmentos; `XsltView`) | **Só no Spring 7** (Spring Boot 4) |

Observações:
- A API usa Spring Boot **3.5.16, a última versão gratuita da linha 3.5**: não haverá
  3.5.17 com as correções. Tomcat, Jackson, PostgreSQL e Log4j têm correção dentro da
  mesma linha e podem ser atualizados individualmente.
- As duas falhas do Spring MVC atingem recursos que o app **não usa** (o app não envia
  eventos SSE nem usa `XsltView`). A correção oficial existe só no Spring 7 / Boot 4.

### Auditoria refeita após a implementação (2026-11-05)

- `npm audit`: **0 vulnerabilidades**.
- OSV das dependências de execução da API: só GHSA-j9f9-w8pj-32f8 e GHSA-pc63-qcmh-9cmg
  (Spring MVC, riscos aceitos abaixo).
- Imagens Docker: já estavam na versão de correção mais recente de cada linha; nenhuma
  tag mudou.

---

## Histórias de usuário e cenários de aceitação

### História 1 — Servidor sem vulnerabilidades exploráveis conhecidas (Prioridade: P1)

Como responsável pelo app, quero que o servidor não tenha falhas conhecidas exploráveis
antes de abrir para usuários (spec 008).

**Teste independente**: refazer o levantamento e conferir a lista de pendências.

**Cenários de aceitação**:

1. **Dado** o levantamento refeito após a atualização, **Quando** comparo com a tabela
   acima, **Então** Tomcat, Jackson, driver PostgreSQL e Log4j não aparecem mais.
2. **Dado** as duas falhas do Spring MVC, **Quando** a atualização termina, **Então** elas
   ficam registradas como **risco aceito** (ver "Riscos aceitos"), e a migração para o
   Spring Boot 4 vira uma spec futura.

### História 2 — Ferramentas de teste sem falhas críticas (Prioridade: P2)

**Cenários de aceitação**:

1. **Dado** o `npm audit` refeito após atualizar o Vitest para a versão 5, **Quando**
   termina, **Então** nenhuma vulnerabilidade aparece.

### História 4 — Imagens Docker com as correções mais recentes (Prioridade: P2)

**Cenários de aceitação**:

1. **Dado** as imagens de build e de execução (Node, Nginx, Java/Maven, PostgreSQL),
   **Quando** a atualização termina, **Então** cada uma está na versão de correção mais
   recente da **mesma linha** (sem trocar versão principal do PostgreSQL, Java ou Node).
2. **Dado** o banco já criado, **Quando** a imagem do PostgreSQL é atualizada, **Então**
   os dados continuam acessíveis (mesma versão principal, sem migração de dados).

### História 3 — Nada quebra (Prioridade: P1)

**Cenários de aceitação**:

1. **Dado** as dependências atualizadas, **Quando** rodo os testes automáticos e o
   checklist de regressão das specs 005 e 006, **Então** tudo passa sem mudança de
   comportamento.
2. **Dado** dados já gravados, **Quando** subo a versão nova, **Então** contas, sessões,
   hábitos, marcações e metas continuam iguais.

### Casos de borda

- Vulnerabilidade nova publicada durante o trabalho: entra se tiver correção na mesma
  linha; senão, fica registrada.
- Atualizar o Vitest pode exigir ajustes na configuração dos testes, nunca no
  comportamento testado.

### Riscos aceitos

| Falha | Por que fica | Impacto no app | Revisão |
|-------|--------------|----------------|---------|
| Spring MVC — eventos SSE com fragmentos (crítica) | Corrigida só no Spring 7 / Boot 4 | Nenhum: o app não envia eventos SSE | Spec futura de migração para o Spring Boot 4 |
| Spring MVC — `XsltView` (crítica) | Corrigida só no Spring 7 / Boot 4 | Nenhum: o app não usa `XsltView` | Spec futura de migração para o Spring Boot 4 |

---

## Requisitos

### Requisitos funcionais

- **RF-001**: Toda dependência com correção disponível na mesma linha de versão DEVE ser
  atualizada para uma versão corrigida.
- **RF-002**: Toda vulnerabilidade que permanecer DEVE ficar registrada nesta spec com
  motivo, impacto no app e quando será revista.
- **RF-003**: O comportamento do app NÃO DEVE mudar.
- **RF-004**: As versões continuam fixas (Princípio II).

### Requisitos de compatibilidade

- **RC-001**: Dados e sessões existentes DEVEM continuar válidos após a atualização.

---

## Critérios de sucesso

- **CS-001**: 0 vulnerabilidades críticas ou altas com correção disponível nas
  dependências que vão para o servidor.
- **CS-002**: 100% dos testes automáticos (API e web) verdes após a atualização.
- **CS-003**: Toda vulnerabilidade restante tem justificativa registrada.

---

## Fora de escopo

- Novas funcionalidades.
- Migrar para Spring Boot 4 / Spring 7 (spec futura).
- Trocar a versão principal de PostgreSQL, Java ou Node.
- Automatizar a atualização de dependências (ex.: configurar o Dependabot para abrir PRs).

## Dependências e premissas

- Constituição **2.0.0** (Princípios II e VII).
- Deve ser concluída antes da abertura para usuários prevista na spec 008.

---

## Checklist de qualidade da spec

- [x] Nenhum detalhe de implementação nos requisitos
- [x] Toda história tem cenários testáveis
- [x] Requisitos verificáveis e sem ambiguidade
- [x] Critérios de sucesso mensuráveis
- [x] Dados existentes considerados (RC-001)
- [x] Nenhuma marcação `[NEEDS CLARIFICATION]` pendente
- [x] Conforme a [constituição](../../.specify/memory/constitution.md) 2.0.0

## Clarificações

| Data | Pergunta | Decisão |
|------|----------|---------|
| 2026-11-05 | Falhas do Spring MVC: migrar para Spring Boot 4 ou aceitar o risco? | Aceitar o risco e ficar no Boot 3.5; migração vira spec futura |
| 2026-11-05 | Vitest: atualizar para a versão 5 ou aceitar o risco? | Atualizar para o Vitest 5 |
| 2026-11-05 | Imagens Docker entram nesta spec? | Sim: versão de correção mais recente da mesma linha |
