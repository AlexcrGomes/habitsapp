# Tarefas: Metas semanais por hábito

**Branch**: `006-metas-semanais` | **Entradas**: [spec.md](./spec.md), [plan.md](./plan.md)

> Formato: `- [ ] T001 [P] [US1] Descrição — arquivo`. Marque `[x]` ao concluir.

Histórias: **US1** definir meta · **US2** progresso por hábito · **US3** resumo da semana ·
**US4** histórico de metas.

---

## Fase 1 — Banco e API (bloqueia as demais)

- [x] T001 Migração `V3__habit_goals.sql` — `api/src/main/resources/db/migration/`
- [x] T002 [US1][US4] `HabitGoal` (`@IdClass`), `GoalRepository` (meta vigente numa data, por usuário), `GoalService` (validar 1–7/nulo, upsert da linha de hoje só quando muda, `goalsAt`) — `api/…/goal/`
- [x] T003 [US1] `HabitRequest.goal` e `HabitResponse.goal`; `HabitService.create/update` delegam ao `GoalService` — `api/…/habit/`
- [x] T004 [US2][US3] `GoalController`: `GET /api/goals?at=` — `api/…/goal/`
- [x] T005 [US1][US4] `GoalIT`: meta na criação e na edição; sem meta; inválida (0, 8) → 400 com `fields.goal`; mesmo dia sobrescreve; linha antiga (inserida com `valid_from` passado) continua valendo para `at` passado; remover meta; arquivar e restaurar mantém a meta — `api/src/test/…/goal/`
- [x] T006 [US3] `IsolationIT`: `GET /api/goals` de B não traz metas de A; `PATCH` com `goal` no hábito de A → 404 e meta de A intacta — `api/src/test/…/IsolationIT.java`
- [x] T007 Ajustar `HabitIT`/helpers se o contrato de `PATCH` exigir `goal` — `api/src/test/`
- [x] **Checkpoint**: `scripts/api-mvn.sh verify` verde

## Fase 2 — Frontend (US1–US4)

- [x] T008 `Habit.goal`, `Goal`; `api.goals.list(at)`; `goal` em create/update — `web/src/api/`
- [x] T009 [US2][US3] `progress.ts` + `progress.test.ts` (meta parcial, excedente limitado, pesos, faixas 100/70/40 nos limites, sem metas → null) — `web/src/goals/`
- [x] T010 [US2][US3] `useHabits`: estado `goals` da janela (`at = to`), recarga em `mutate` — `web/src/habits/useHabits.ts`
- [x] T011 [US1] Campo "Meta semanal" no `HabitDialog`; `onSave(name, emoji, goal)` em `HomePage` — `web/src/habits/`, `web/src/home/`
- [x] T012 [US2] `GoalBar` acessível na linha do hábito, sem mudar a altura da linha — `web/src/goals/`, `web/src/habits/HabitList.tsx`
- [x] T013 [US3] `WeekSummary` acima da grade ("Até agora", frase, estado sem metas) + `WeekSummary.test.tsx` — `web/src/goals/`, `web/src/home/HomePage.tsx`
- [x] T014 [P] Estilos da barra e do card, incluindo ≤570px — `web/src/styles.css`
- [x] T015 [P] Teste do campo de meta no diálogo (padrão "Sem meta", envio do valor escolhido) — `web/src/habits/`
- [x] **Checkpoint**: `npm test` e `npm run build` verdes

## Fase 3 — Integração e encerramento

- [x] T016 Executar o checklist abaixo; se tudo passar, marcar a spec como **Implementada** e atualizar `docs/sdd-guia.md`

---

## Dependências

- Fase 1 bloqueia a 2 (contrato da API). Dentro da Fase 2, T008 antes das demais; T014 e T015
  podem correr em paralelo depois de T011–T013 existirem.

---

## Checklist de verificação

### Automático
- [x] **V-01** `scripts/api-mvn.sh verify` verde (inclui `GoalIT` e `IsolationIT`).
- [x] **V-02** `npm test` e `npm run build` verdes.

### US1 — Definir meta
- [x] **V-03** (1.1, 1.2) Criar hábito com meta 3 e outro sem mexer na meta: o primeiro reabre com "3 dias por semana", o segundo com "Sem meta".
- [x] **V-04** (1.3) Editar a meta para outro valor e para "Sem meta": a barra aparece/some.
- [x] **V-05** (1.4) Pelo console, `PATCH` com `goal: 8` → 400 com a mensagem da spec.

### US2 — Progresso por hábito
- [x] **V-06** (2.1, 2.2) Meta 4 com 2 marcados: barra em 50%; marcar/desmarcar atualiza na hora.
- [x] **V-07** (2.3) Marcar mais que a meta: barra cheia, sem passar de 100%.
- [x] **V-08** (2.5) `aria-valuetext` da barra lê "Nome: X de N dias".
- [x] **V-09** Linhas da lista continuam alinhadas com as linhas da grade.

### US3 — Resumo da semana
- [x] **V-10** (3.2, 3.3) Metas 4/2 com 2/3 feitos: 67% e "Dá para melhorar"; conferir as quatro frases.
- [x] **V-11** (3.4, 3.5) Semana atual mostra "Até agora"; semana anterior (seta ‹) não.
- [x] **V-12** (3.6, 3.7) Sem metas: convite para definir metas; hábito arquivado não entra no resumo.
- [x] **V-13** Alternar "Últimos 7 dias" / "Dom–Sáb": barras e resumo acompanham a janela.

### US4 — Histórico
- [x] **V-14** (4.1) Com uma meta antiga gravada para semanas passadas, mudar a meta hoje: a semana anterior mantém a meta antiga. *(A interface só grava metas a partir de hoje; verificado por `GoalIT.semanasPassadasGuardamAMetaDaEpoca`.)*
- [x] **V-15** (4.3, 4.4) Semana sem meta na época: hábito sem barra e fora do resumo; hábito criado hoje com meta conta com a meta inteira.

### Geral
- [x] **V-16** Celular (≤570px): barra e card legíveis, sem rolagem horizontal da página.
- [x] **V-17** Segunda conta não vê as metas da primeira. *(Verificado por `IsolationIT`.)*
- [x] **V-18** Regressão rápida: criar/editar/arquivar/reordenar hábitos, marcar dias e trocar semana continuam funcionando.
- [x] **V-19** Nenhum erro no console do navegador nem exceção inesperada no log da API.
