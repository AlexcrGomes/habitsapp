# Tarefas: [NOME DA FEATURE]

**Branch**: `[NNN-nome-da-feature]` | **Entradas**: [spec.md](./spec.md), [plan.md](./plan.md)

> Pré-requisito: `plan.md` com status **Aprovado**.
>
> Formato: `- [ ] T001 [P] [US1] Descrição — arquivo`
> - `[P]` = pode ser feita em paralelo (arquivos diferentes, sem dependência)
> - `[USn]` = história de usuário da spec atendida pela tarefa
> - Marque `[x]` ao concluir cada tarefa.

---

## Fase 1 — Preparação

- [ ] T001 [Preparação necessária, ex.: criar ícones] — `assests/`
- [ ] T002 [P] [Estrutura HTML base] — `index.html`

## Fase 2 — Fundamentos (bloqueia as histórias)

- [ ] T003 [ex.: migração de dados do localStorage] — `script.js`

## Fase 3 — História 1 (P1) 🎯 MVP

**Objetivo**: [o que esta história entrega]
**Verificação independente**: [como testar só esta história]

- [ ] T004 [US1] [Descrição] — `script.js`
- [ ] T005 [P] [US1] [Descrição] — `style.css`

## Fase 4 — História 2 (P2)

**Objetivo**: [o que entrega]

- [ ] T006 [US2] [Descrição] — `arquivo`

## Fase N — Polimento

- [ ] T0XX Revisar textos em pt-BR e atributos `alt`
- [ ] T0XX Conferir layout em ≤570px
- [ ] T0XX Atualizar status da spec para **Implementada**

---

## Dependências

- Fase 2 bloqueia as fases de histórias.
- [Outras dependências entre tarefas]

---

## Checklist de verificação manual

*Derivado dos cenários de aceitação da spec. Executar no navegador.*

### Feature
- [ ] US1-C1: Dado …, Quando …, Então …
- [ ] US1-C2: Dado …, Quando …, Então …
- [ ] US2-C1: Dado …, Quando …, Então …

### Regressão
- [ ] Executar o checklist de [001-registro-de-habitos](../001-registro-de-habitos/tasks.md#checklist-de-verificação-manual)
- [ ] Recarregar a página com dados antigos no localStorage: nada se perde
- [ ] Layout ok em desktop e em tela ≤570px
