# Tarefas: Objetivo do hábito e comemoração ao bater a meta

**Branch**: `012-objetivo-e-comemoracao` | **Entradas**: [spec.md](./spec.md), [plan.md](./plan.md)

> Pré-requisito: `plan.md` com status **Aprovado** (aprovado em 2026-11-23).
>
> Formato: `- [x] T001 [P] [US1] Descrição — arquivo`. Marque `[x]` ao concluir.

Histórias: **US1** definir objetivo · **US2** ver objetivo (computador e balão no celular) ·
**US3** comemorar a meta do hábito · **US4** semana perfeita · **US5** acessibilidade e
"reduzir movimento".

---

## Fase 1 — Banco e API (bloqueia o frontend do objetivo)

- [x] T001 Migração `V5__habit_objective.sql`: `alter table habits add column objective varchar(60)` — `api/src/main/resources/db/migration/`
- [x] T002 [US1] Campo `objective` em `Habit` (get/set) — `api/…/habit/Habit.java`
- [x] T003 [US1] `HabitService.validateObjective` (`trim`, vazio → `null`, > 60 → 400 `VALIDATION` com `fields.objective` = "O objetivo deve ter no máximo 60 caracteres."); `create` grava; `update` recebe "presente/ausente" e só substitui quando presente (plan P3) — `api/…/habit/HabitService.java`
- [x] T004 [US1] `HabitRequest` com o objetivo (distinguir ausente de `null`, plan P3) e `HabitResponse.objective` em todas as respostas de hábito — `api/…/habit/HabitController.java`
- [x] T005 [US1] `HabitIT`: criar com e sem objetivo; `trim`; só espaços → `null`; 60 aceito e 61 → 400 com a mensagem; `PATCH` muda, remove (`""` e `null`) e, sem o campo, mantém; arquivar e restaurar mantém; `GET` devolve `objective` — `api/src/test/…/habit/HabitIT.java`
- [x] T006 [US1] `IsolationIT`: `PATCH` de B com `objective` no hábito de A → 404 e objetivo de A intacto; `GET` de B não traz hábitos/objetivos de A — `api/src/test/…/IsolationIT.java`
- [x] **Checkpoint**: `scripts/api-mvn.sh verify` verde

## Fase 2 — Objetivo no frontend (US1, US2) 🎯 MVP

- [x] T007 [US1] `Habit.objective: string | null`; `objective` em `api.habits.create/update` — `web/src/api/types.ts`, `web/src/api/client.ts`
- [x] T008 [P] [US1] `MAX_OBJECTIVE = 60` e `normalizeObjective` (trim; vazio → `""`) em `rules.ts` + testes em `rules.test.ts` — `web/src/habits/`
- [x] T009 [US1] Campo "Objetivo (opcional)" com contador `n/60`, `maxLength` e placeholder no `HabitDialog`; `onSave(name, emoji, goal, objective)`; `AppShell` repassa o objetivo para create/update — `web/src/habits/HabitDialog.tsx`, `web/src/shell/AppShell.tsx`
- [x] T010 [P] [US1] `HabitDialog.test.tsx`: campo vazio por padrão; edição preenche; envia o texto; contador; não passa de 60 — `web/src/habits/`
- [x] T011 [US2] Computador: linha do objetivo em `HabitLabel` (`truncate`, `title`, `text-xs text-slate-600`), `gap` ajustado para caber em `h-16`; `aria-describedby` do botão "Editar {nome}" aponta para o objetivo — `web/src/habits/HabitLabel.tsx`, `web/src/habits/HabitList.tsx`
- [x] T012 [US2] `ObjectivePopover` (nome, objetivo completo, botão "Editar"; Esc e toque fora fecham; foco no "Editar" ao abrir e de volta no hábito ao fechar) — `web/src/habits/ObjectivePopover.tsx`
- [x] T013 [US2] `HabitRows`: estado `openId`; hábito com objetivo abre/fecha o balão (`aria-expanded`, `aria-controls`, descrição `sr-only` sempre presente); sem objetivo continua "Editar {nome}" → edição; arrastar ou marcar fecha o balão — `web/src/habits/HabitRows.tsx`
- [x] T014 [P] [US2] `HabitRows.test.tsx`: toque com objetivo abre o balão e "Editar" chama `onEdit`; sem objetivo chama `onEdit` direto; Esc fecha e devolve o foco; abrir outro fecha o primeiro; leitor ouve o objetivo (descrição) — `web/src/habits/`
- [x] **Checkpoint**: `npm test` e `npm run build` verdes

## Fase 3 — Comemoração (US3, US4, US5)

- [x] T015 [US3][US4] `celebrationRules.ts`: `celebrationFor(habits, checksBefore, goals, days, habitId, day, checked)` (plan, seção Comemoração) — `web/src/goals/celebrationRules.ts`
- [x] T016 [P] [US3][US4] `celebrationRules.test.ts`: cruza a meta (2→3 de 3) → `habit`; além da meta (3→4) → `null`; desmarcar → `null`; sem meta → `null`; último hábito leva a 100% → `week` (não `habit`); um único hábito com meta → `week`; já em 100% → `null` — `web/src/goals/`
- [x] T017 [US3] `useHabits.toggle` devolve `Promise<boolean>` (salvou ou não) — `web/src/habits/useHabits.ts`
- [x] T018 [P] [US3][US5] Keyframes `confetti-fall` e `celebrate-in` no `@theme` — `web/src/index.css`
- [x] T019 [US3][US4][US5] `Celebration.tsx`: `role="status"` sempre montado; cartão (🎉/🏆, "Parabéns!"/"Semana perfeita!", frase do plan P12 com "nesta semana"/"na semana passada" e linha do objetivo); confete determinístico `motion-safe`, escondido com `motion-reduce`; `pointer-events-none`; fecha em 3500ms, Esc ou `pointerdown`; posição no celular acima da navegação e no topo no computador — `web/src/goals/Celebration.tsx`
- [x] T020 [US3] `AppShell`: estado `celebration`; `onToggle` calcula antes de marcar, mostra e apaga se a API recusar (mesmo `id`); apagar ao trocar de semana ou de tela — `web/src/shell/AppShell.tsx`
- [x] T021 [P] [US3][US4][US5] `Celebration.test.tsx`: textos de hábito e de semana (atual e passada, com e sem objetivo); some com timers falsos em 3,5 s, com Esc e com `pointerdown`; nova comemoração substitui a anterior. Teste de integração em `WeekPage.test.tsx`/`AppShell.test.tsx`: marcar o dia que bate a meta mostra o aviso; marcar além da meta não — `web/src/goals/`, `web/src/shell/`
- [x] **Checkpoint**: `npm test` e `npm run build` verdes

## Fase 4 — Encerramento

- [x] T022 Revisar textos em pt-BR (diálogo, balão, comemoração, erro da API)
- [ ] T023 Executar o checklist abaixo no navegador (computador e celular ≤570px)
- [ ] T024 Se tudo passar: spec → **Implementada**, atualizar `docs/sdd-guia.md`; acrescentar a novidade em `web/novidades.md` (spec 011)

---

## Dependências

- Fase 1 bloqueia T007 em diante (contrato da API).
- T011–T014 dependem de T007; T012 antes de T013.
- A Fase 3 não depende da Fase 2, salvo o texto do objetivo na comemoração (T019 usa
  `Habit.objective` de T007). T015 antes de T020; T017 antes de T020; T018 antes de T019.

---

## Checklist de verificação

### Automático
- [x] **V-01** `scripts/api-mvn.sh verify` verde (inclui `HabitIT` e `IsolationIT`).
- [x] **V-02** `npm test` e `npm run build` verdes.

### US1 — Definir objetivo
- [x] **V-03** (1.1, 1.2) Criar "Ler" com objetivo "Ler pelo menos 10 páginas" e outro hábito sem objetivo; recarregar: o primeiro reabre com o texto, o segundo com o campo vazio.
- [ ] **V-04** (1.3, 1.6) Editar o objetivo, depois apagá-lo e depois salvar só com espaços: muda, some e continua sem objetivo.
- [x] **V-05** (1.4) Digitar mais de 60 caracteres: o campo para em 60 e o contador mostra 60/60.
- [x] **V-06** (1.5) Pelo console, `PATCH` com `objective` de 61 caracteres → 400 com "O objetivo deve ter no máximo 60 caracteres."
- [ ] **V-07** (1.7) Arquivar e restaurar um hábito com objetivo: volta com o mesmo texto.

### US2 — Ver objetivo
- [x] **V-08** (2.1, 2.2) Computador: objetivo em texto menor sob o nome; texto longo cortado com reticências e completo ao passar o mouse; linhas da lista ainda alinhadas com a grade (com e sem barra de meta). *(computador 1024px: linhas de 64px alinhadas com a grade.)*
- [x] **V-09** (2.3) Celular (≤570px): o objetivo não aparece na linha.
- [x] **V-10** (2.4, 2.5) Celular: tocar no hábito com objetivo abre o balão; "Editar" abre a edição.
- [ ] **V-11** (2.6) Celular: tocar fora, Esc e tocar em outro hábito fecham o balão; nunca há dois abertos; marcar um dia com o balão aberto funciona.
- [x] **V-12** (2.7, 2.8, 2.9) Celular: hábito sem objetivo abre a edição direto; computador: clicar em editar abre a edição direto.
- [x] **V-13** (2.10) Leitor de tela/teclado: o hábito anuncia nome e objetivo; o balão abre com Enter, o foco vai para "Editar" e volta ao hábito com Esc. *(foco e descrição conferidos no navegador; leitor de tela real não testado.)*

### US3 — Comemoração do hábito
- [x] **V-14** (3.1) Meta 3 com 2 dias: marcar o 3º mostra "Parabéns! Você bateu a meta de … nesta semana." com confete.
- [x] **V-15** (3.2, 3.3) Some sozinha em até 4 s, com Esc e ao tocar em outro lugar; marcar outro dia logo em seguida funciona e não é atrasado. *(some sozinha e não atrasa a marcação; Esc e toque cobertos por `Celebration.test.tsx`.)*
- [ ] **V-16** (3.4, 3.5) Marcar o 4º dia: sem comemoração; desmarcar um dia e marcar de novo: comemora de novo.
- [x] **V-17** (3.6) Hábito sem meta: nenhuma comemoração.
- [ ] **V-18** (3.7) Semana anterior: bater a meta comemora "… na semana passada."
- [x] **V-19** (3.8) Recarregar, trocar de semana e abrir o app com metas já batidas: nenhuma comemoração.
- [x] **V-20** (3.9) Hábito com objetivo: a comemoração lembra o objetivo.

### US4 — Semana perfeita
- [x] **V-21** (4.1, 4.2) Dois hábitos com meta: bater o primeiro dá a comemoração normal; bater o último dá só a de "Semana perfeita!", maior.
- [ ] **V-22** (4.3) Um único hábito com meta: ao bater, a comemoração é a de semana perfeita.
- [ ] **V-23** (4.4) Semana em 100%: marcar mais não comemora; desmarcar e voltar a 100% comemora.

### US5 — Acessibilidade e movimento
- [ ] **V-24** (5.1) Com "reduzir movimento" ativo no sistema: sem confete nem animação, só o cartão parado, que some sozinho.
- [ ] **V-25** (5.2) Leitor de tela anuncia os parabéns e o foco continua no campo marcado.
- [ ] **V-26** (5.3) Sem som; nada pisca.

### Casos de borda e geral
- [ ] **V-27** Marcação recusada pela API (ex.: parar a API e marcar): a marcação volta e a comemoração some.
- [ ] **V-28** Marcar vários dias rápido: no máximo um aviso por vez.
- [ ] **V-29** Diminuir a meta para um valor já batido: nenhuma comemoração ao salvar.
- [x] **V-30** Celular de 360px: balão e comemoração cabem sem rolagem horizontal e não impedem desmarcar. *(conferido em 375px: sem rolagem horizontal; aviso acima da navegação.)*
- [ ] **V-31** Dados existentes: hábitos, metas e marcações iguais depois da migração; hábitos antigos sem objetivo.
- [x] **V-32** Segunda conta não vê nem altera o objetivo da primeira. *(Verificado por `IsolationIT`.)*
- [ ] **V-33** Regressão rápida: criar, editar, arquivar e reordenar hábitos (arrastar e ↑/↓), marcar dias, trocar de semana e o aviso de versão nova continuam funcionando.
- [x] **V-34** Nenhum erro no console do navegador nem exceção inesperada no log da API. *(só 502 da API subindo, 401 antes do login e o 400 do teste de 61 caracteres.)*
