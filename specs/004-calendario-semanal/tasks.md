# Tarefas: Semana automática com registro retroativo

**Branch**: `calendario` | **Entradas**: [spec.md](./spec.md), [plan.md](./plan.md)

> Formato: `- [ ] T001 [P] [US1] Descrição — arquivo`. Marque `[x]` ao concluir.

Histórias: **US1** semana ao abrir · **US2** marcar dias anteriores · **US3** dados atuais ·
**US4** semanas anteriores · **US5** modo da semana · **US6** celular.

---

## Fase 1 — Fundamentos: modelo v3 (bloqueia as demais)

- [x] T001 [US3] Funções de data puras: `toKey`, `fromKey`, `addDays`, `todayDate`, `formatDay`, `weekdayShort` — `script.js`
- [x] T002 [US3] `inferYear(mmdd, hoje)` com regra do 29/02 e `toV3(v2)` — `script.js`
- [x] T003 [US3] `loadState()` encadeado (v3 → v2 → NLWSetup → vazio), `STORAGE_KEY = "habits@v3"`, `emptyState()` v3 — `script.js`
- [x] T004 [US3] Remover `addDay`, `todayKey` e qualquer uso de `state.days` — `script.js`

## Fase 2 — US1 + US2: semana atual e edição retroativa (P1) 🎯 MVP

- [x] T005 [US1] `visibleDays(mode, offset)`, `isEditable`, `isFuture` — `script.js`
- [x] T006 [US1] `renderDays()` com 7 colunas, rótulo "dia DD/MM", `.today` + `aria-current`, checkbox `disabled` e `aria-label` com motivo — `script.js`
- [x] T007 [US1] Remover o botão `#register-day` e seu listener; header com `.week-nav` — `index.html`, `script.js`
- [x] T008 [P] [US2] Estilos: coluna `.today`, checkbox `:disabled` (marcado e vazio) — `style.css`

## Fase 3 — US4: semanas anteriores (P2)

- [x] T009 [US4] `periodLabel`, `renderNav()` (período, `›` desabilitado em 0), `weekOffset` em memória — `script.js`
- [x] T010 [US4] Eventos de `‹`/`›` — `script.js`
- [x] T011 [P] [US4] Estilos da barra de navegação — `style.css`

## Fase 4 — US5: modo da semana (P2)

- [x] T012 [US5] `fieldset` com dois `radio` ("Últimos 7 dias" / "Dom–Sáb") — `index.html`
- [x] T013 [US5] `change` do alternador: grava `settings.weekMode`, zera `weekOffset`, re-renderiza — `script.js`
- [x] T014 [P] [US5] Estilo do alternador (segmented control) com foco visível — `style.css`

## Fase 5 — US6 e casos de borda (P2)

- [x] T015 [US6] `scrollToToday()` ao carregar, ao voltar para a semana atual e ao trocar de modo — `script.js`
- [x] T016 Virada do dia: `visibilitychange`/`focus` re-renderizam se a data mudou — `script.js`
- [x] T017 [P] [US6] Header em ≤570px (quebra em duas linhas, `padding-top` do form ajustado); remover `assests/plus.svg` e regras CSS do botão antigo — `style.css`, `assests/`

## Fase 6 — Documentação

- [x] T018 Spec 001: D-02 resolvido na 004, US1 marcada como substituída; regressão sem R-02/R-03/R-11 e com `habits@v3` — `specs/001-registro-de-habitos/`
- [x] T019 [P] Spec 002: nota de que US3/RF-013 foram substituídos; spec 003: D-02 resolvido — `specs/002-…/spec.md`, `specs/003-…/spec.md`
- [x] T020 [P] Emenda 1.1.0 da constituição (Princípio III e restrições técnicas) — `.specify/memory/constitution.md`
- [x] T021 [P] `CLAUDE.md` (descrição e regra 10) e tabela de specs do guia — `CLAUDE.md`, `docs/sdd-guia.md`
- [x] T022 Executar o checklist abaixo; se tudo passar, marcar a spec como **Implementada**

---

## Dependências

- Fase 1 bloqueia todas. Fase 2 bloqueia 3, 4 e 5. Fases 3 e 4 são independentes entre si.

---

## Checklist de verificação manual

### Preparação de dados (DevTools)

```js
localStorage.clear()
localStorage.setItem("habits@v2", JSON.stringify({
  version: 2,
  habits: [{ id: "run", name: "Corrida", emoji: "🏃", archived: false },
           { id: "water", name: "Água", emoji: "💧", archived: false }],
  days: ["10-25", "10-29", "12-25"],
  checks: { run: ["10-29", "12-25"], water: ["10-25"] }
}))
location.reload()
```
(Com hoje = 31/10/2026: `12-25` vira 2025-12-25; os demais, 2026.)

### US3 — Dados atuais
- [x] **V-01** (3.1, 3.2) `habits@v3` tem `run: ["2025-12-25", "2026-10-29"]` e `water: ["2026-10-25"]`; sem `days`.
- [x] **V-02** (RC-002) `habits@v2` continua idêntico ao semeado.
- [x] **V-03** Somente `NLWSetup@habits` (dados da versão original): os 5 hábitos e as marcações aparecem nos dias certos.

### US1 — Semana ao abrir
- [x] **V-04** (1.1) Sem dados: 7 colunas terminando em hoje, sem precisar clicar em nada.
- [x] **V-05** (1.2) Coluna de hoje destacada e com `aria-current="date"`.
- [x] **V-06** (1.3) Não existe botão "Registrar o meu dia".
- [x] **V-07** (1.4) Cabeçalho das colunas no formato "sex 31/10".

### US2 — Edição retroativa
- [x] **V-08** (2.1) Marcar um hábito 3 dias atrás e recarregar: continua marcado.
- [x] **V-09** (2.2) Na semana anterior, dias com mais de 6 dias atrás estão desabilitados e mostram as marcações.
- [x] **V-10** (2.3) No modo Dom–Sáb, dias depois de hoje estão desabilitados.
- [x] **V-11** (2.4) `aria-label` dos bloqueados termina com "(somente consulta)" ou "(dia futuro)".

### US4 — Semanas anteriores
- [x] **V-12** (4.1, 4.2) ‹ mostra a semana anterior; › volta.
- [x] **V-13** (4.3) › desabilitado na semana atual.
- [x] **V-14** (4.4) Período exibido correto (ex.: "25/10 – 31/10").
- [x] **V-15** (4.5) Voltar semanas e recarregar: abre na semana atual.

### US5 — Modo da semana
- [x] **V-16** (5.1) Primeiro uso: "Últimos 7 dias" selecionado, hoje na última coluna.
- [x] **V-17** (5.2) "Dom–Sáb": primeira coluna é domingo e a semana contém hoje.
- [x] **V-18** (5.4) No "Dom–Sáb", os 6 dias anteriores a hoje continuam editáveis (navegando para a semana anterior se preciso).
- [x] **V-19** (5.5) Recarregar mantém o modo.
- [x] **V-20** (5.6) Trocar o modo numa semana anterior volta para a semana atual.

### US6 e casos de borda
- [x] **V-21** (6.1) Preset celular: a coluna de hoje está visível ao abrir.
- [x] **V-22** (6.2) Em ≤570px, setas e alternador visíveis e utilizáveis.
- [x] **V-23** Virada do dia: simulando outra data e disparando `visibilitychange`, a grade avança.
- [x] **V-24** Virada do ano: com "hoje" simulado em 02/01, a semana mostra 27/12 a 02/01 em ordem.
- [x] **V-25** Setas e alternador utilizáveis só com teclado.
- [x] **V-26** Nenhum erro no console.

### Regressão
- [x] **V-27** Checklist de [001](../001-registro-de-habitos/tasks.md#checklist-de-verificação-manual) (atualizado).
- [x] **V-28** Da [002](../002-habitos-personalizaveis/tasks.md#checklist-de-verificação-manual): criar, editar, arquivar, restaurar, excluir e reordenar continuam funcionando, e um hábito novo aparece em todas as colunas.
