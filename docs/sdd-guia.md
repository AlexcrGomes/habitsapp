# Guia de Spec Driven Development — Habits

Este projeto segue **Spec Driven Development (SDD)** no formato do
[GitHub Spec Kit](https://github.com/github/spec-kit): primeiro se especifica o
comportamento, depois se planeja a solução, depois se quebra em tarefas e só então se
implementa.

```
constituição ──► spec.md ──► clarificação ──► plan.md ──► tasks.md ──► implementação ──► verificação
 (princípios)    (o quê)     (dúvidas)        (como)      (passos)                       (checklist)
```

---

## Onde fica cada coisa

| Caminho | Conteúdo |
|---------|----------|
| [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) | Princípios não negociáveis do projeto |
| [`.specify/templates/`](../.specify/templates/) | Modelos de `spec.md`, `plan.md` e `tasks.md` |
| [`specs/NNN-nome/`](../specs/) | Uma pasta por feature, com seus três documentos |
| [`CLAUDE.md`](../CLAUDE.md) | Regras que o Claude segue ao trabalhar neste repositório |

### Specs existentes

| Nº | Feature | Status |
|----|---------|--------|
| 001 | [Registro de hábitos](../specs/001-registro-de-habitos/spec.md) | Implementada (retroativa) |
| 002 | [Hábitos personalizáveis](../specs/002-habitos-personalizaveis/spec.md) | Aprovada — implementada, falta verificar V-29 e V-33 |
| 003 | [Estatísticas e streaks](../specs/003-estatisticas-streaks/spec.md) | Rascunho |

> Mantenha esta tabela atualizada sempre que criar uma spec ou mudar um status.

---

## Convenções

- **Numeração**: três dígitos sequenciais (`001`, `002`, …), nunca reaproveitados.
- **Nome da pasta e da branch**: `NNN-nome-curto-em-kebab-case` (ex.: `004-exportar-dados`).
- **Identificadores**:
  - Histórias: `US1`, `US2`… (prioridade P1, P2, P3)
  - Requisitos funcionais: `RF-001`; de compatibilidade: `RC-001`
  - Critérios de sucesso: `CS-001`
  - Tarefas: `T001`
- **Dúvidas** na spec: `[NEEDS CLARIFICATION: pergunta]`.

### Ciclo de status da spec

```
Rascunho ──► Em clarificação ──► Aprovada ──► Implementada
    └──────────────────────────────────────► Descartada
```

O `plan.md` tem status próprio: `Rascunho` → `Aprovado`.

---

## Passo a passo

### 1. Criar a feature

```bash
git checkout -b 004-nome-da-feature
```

Crie a pasta `specs/004-nome-da-feature/` e copie para ela o
[`spec-template.md`](../.specify/templates/spec-template.md) como `spec.md`.

### 2. Escrever a spec — *o quê e por quê*

- Escreva do ponto de vista do usuário. **Nada de tecnologia, arquivos ou funções.**
- Cada história deve ser testável sozinha e ter cenários *Dado / Quando / Então*.
- Pense em casos de borda, principalmente **o que acontece com os dados já gravados**.
- Toda dúvida vira `[NEEDS CLARIFICATION: …]` — não invente respostas.

### 3. Clarificar

- Resolva cada `[NEEDS CLARIFICATION]` e registre a decisão na tabela **Clarificações**
  da spec.
- Status: `Em clarificação`.

### 4. Aprovar a spec

- Preencha o **Checklist de qualidade da spec**.
- Sem marcações pendentes → status `Aprovada`.
- A partir daqui, mudanças de escopo voltam a spec para `Em clarificação`.

### 5. Planejar — *como*

- Copie [`plan-template.md`](../.specify/templates/plan-template.md) para `plan.md`.
- Descreva arquivos afetados, modelo de dados, migração (se houver) e decisões técnicas.
- Preencha o **Constitution Check**. Se algum princípio for violado, justifique em
  **Complexity Tracking**.
- Status do plan: `Aprovado`.

### 6. Quebrar em tarefas

- Copie [`tasks-template.md`](../.specify/templates/tasks-template.md) para `tasks.md`.
- Agrupe por história (cada história = um incremento entregável).
- Termine com o **Checklist de verificação manual**, derivado dos cenários da spec, e
  inclua a regressão da spec 001.

### 7. Implementar

- Uma tarefa por vez, na ordem; marque `[x]` ao concluir.
- Se surgir algo não previsto na spec, **pare** e atualize a spec/plan antes de seguir.

### 8. Verificar e encerrar

- Abra `index.html` no navegador e execute todo o checklist de verificação.
- Tudo ok → spec com status `Implementada` e tabela de specs deste guia atualizada.
- Abra o PR referenciando a pasta da spec.

---

## Trabalhando com o Claude

O [`CLAUDE.md`](../CLAUDE.md) faz o Claude seguir este fluxo automaticamente. Exemplos
de pedidos para cada fase:

| Fase | Exemplo de pedido |
|------|-------------------|
| Spec | "Crie a spec 004 para exportar e importar os dados em JSON." |
| Clarificação | "Liste as dúvidas da spec 002 e me pergunte uma por uma." |
| Aprovação | "Revise o checklist de qualidade da spec 002 e marque como Aprovada." |
| Plan | "Escreva o plan.md da spec 002, com Constitution Check." |
| Tasks | "Gere o tasks.md da spec 002 a partir do plan." |
| Implementação | "Implemente as tarefas da Fase 3 da spec 002." |
| Verificação | "Rode o checklist de verificação da spec 002 no navegador." |

### Opcional: CLI oficial do Spec Kit

A estrutura deste repositório (`.specify/` + `specs/`) é compatível com o CLI `specify`
do GitHub Spec Kit. Se quiser os comandos prontos (`/speckit.specify`,
`/speckit.clarify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`…), consulte
a documentação do projeto para instalar e rodar `specify init --here --ai claude`.
Os nomes dos comandos podem variar conforme a versão — confira antes e preserve a
constituição e as specs existentes ao inicializar.
