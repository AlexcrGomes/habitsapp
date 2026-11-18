# Tarefas: Layout mobile — semana inteira na tela e app em tela cheia

**Branch**: `010-layout-mobile` | **Entradas**: [spec.md](./spec.md), [plan.md](./plan.md)

> Pré-requisito: `plan.md` com status **Aprovado** (aprovado em 2026-11-17).
>
> Formato: `- [ ] T001 [P] [US1] Descrição — arquivo`. Marque `[x]` ao concluir.
> `[P]` = pode ser feita em paralelo (arquivos diferentes, sem dependência).

Histórias: **US1** semana inteira no celular · **US2** app ocupa a tela toda (inclui o login
de 7 dias, RF-014) · **US3** topo compacto · **US4** ações do hábito no celular.

Decisões do plan citadas como **P1–P16**. O banco não muda; a única tarefa em `api/` é a
duração do cookie de sessão (P16).

---

## Fase 1 — Fundamentos (bloqueia as histórias)

Refatorações sem mudança visível: ao final, o desktop e o celular continuam exatamente
como hoje.

- [x] T001 Capturas de referência **antes de qualquer mudança**: Semana em 1280, 1024 e
  768px (desktop/tablet) e em 375px (celular), com a mesma conta e semana, para a comparação
  da CS-006 — `specs/010-layout-mobile/capturas/antes-*.png`
- [x] T002 [P] Hook `useMobileLayout()` com `useSyncExternalStore` sobre
  `matchMedia("(max-width: 639px), (max-height: 499px)")`; sem `matchMedia` retorna `false`
  (P2, P3) + `useMobileLayout.test.ts` (sem `matchMedia` → `false`; `matches: true` → `true`;
  evento `change` atualiza) — `web/src/lib/useMobileLayout.ts`
- [x] T003 [P] `DayCheck`: input com `aria-label` (`habit.name em DD/MM` + `lockReason`),
  `disabled` pelo `isEditable` e a classe de encaixe só quando `animate`; recebe `className`
  para o tamanho. A `WeekGrid` passa a usá-lo, com o DOM e as classes iguais (P6) —
  `web/src/week/DayCheck.tsx`, `web/src/week/WeekGrid.tsx`
- [x] T004 [P] `HabitLabel` extraído da `HabitList`: emoji em quadrado `brand-50`, nome
  truncado com `title`, `GoalBar` e selo "X/N" ou "Meta atingida" (P8); a `HabitList` passa
  a usá-lo com o DOM igual — `web/src/habits/HabitLabel.tsx`, `web/src/habits/HabitList.tsx`
- [x] T005 Hook `useReorder(habits, onMove)` com a lógica atual da `HabitList`: arrastar pela
  alça (pointer events, `dragging`/`drop-before`/`drop-after`), `moveByButton` e o foco
  depois de mover (`useLayoutEffect`). Devolve `listRef`, handlers e `moveByButton` (P7); a
  `HabitList` passa a usá-lo com o DOM igual — `web/src/habits/useReorder.ts`,
  `web/src/habits/HabitList.tsx`
- [x] T006 [P] Regra de "hoje" do checkbox generalizada: `.day.today .habit-check:not(:checked)`
  **e** `[data-today] .habit-check:not(:checked)` com borda `brand-500` (P9) —
  `web/src/index.css`
- [x] **Checkpoint**: `cd web && npm test` e `npm run build` verdes, sem mudar nenhuma
  asserção dos testes atuais

## Fase 2 — História 1: semana inteira no celular (P1) 🎯 MVP

**Objetivo**: no celular, nome em cima e as 7 marcações embaixo, sem rolagem horizontal.
**Verificação independente**: 360–430px com vários hábitos, os 7 dias visíveis e marcáveis
sem arrastar para os lados.

- [x] T007 [US1][US4] `HabitRows`, a lista empilhada (P4, P5, P8, P9):
  - faixa `sticky top-0 z-10` com fundo branco e `grid-cols-7`, com dia da semana
    (`weekdayShort`) e dia do mês em cada coluna; hoje com `bg-brand-50`, texto `brand-700`
    e `aria-current="date"`;
  - `<ul class="habits">` com `li.habit[data-id]`. Em cada um: linha do nome (alça com
    `GripVertical`, `HabitLabel`, `.habit-move` com ↑/↓ e `not-focus-within:sr-only`, e
    editar `data-action="edit"`) e, embaixo, `grid-cols-7` de células `<label>` com altura de
    44px (`h-11`) e `DayCheck` `size-8`, com `data-today` na célula de hoje;
  - `justChecked` como na `WeekGrid`; usa `useReorder`; estado vazio "Crie seu primeiro
    hábito";
  - não usa a classe `.days`, então o `scrollToToday` não faz nada no celular.

  Arquivo: `web/src/habits/HabitRows.tsx`
- [x] T008 [US1] `WeekPage`: `const mobile = useMobileLayout()`. No celular: container
  `px-3 py-3 space-y-3` e `<Card className="px-2 pb-2">` **sem** `overflow-hidden` (senão a
  faixa não fica fixa) com `HabitRows`. Fora do celular: o JSX atual sem nenhuma mudança —
  `web/src/pages/WeekPage.tsx`
- [x] T009 [P] [US1] `HabitRows.test.tsx`:
  - na ordem do DOM, o nome de cada hábito vem antes das suas 7 marcações;
  - os nomes acessíveis são iguais aos da `WeekGrid` ("Ler em 28/10", "(dia futuro)",
    "(somente consulta)") e os dias bloqueados ficam desabilitados;
  - clicar chama `onToggle(id, dia, true)`, e clicar na célula (`label`) também marca;
  - só a caixa recém-marcada anima;
  - a faixa marca hoje com `aria-current="date"`;
  - o estado vazio aparece.

  Arquivo: `web/src/habits/HabitRows.test.tsx`
- [x] T010 [P] [US1] `WeekPage.test.tsx` com `matchMedia` simulado como celular: renderiza a
  lista empilhada e não renderiza `.days`; cada checkbox e cada "Editar …" aparece **uma**
  vez; o hábito com meta mostra o progresso (`progressbar` "Meta de …") —
  `web/src/pages/WeekPage.test.tsx`
- [x] **Checkpoint**: `npm test` e `npm run build` verdes; no navegador embutido em 375px, a
  Semana mostra os 7 dias sem rolagem horizontal

## Fase 3 — História 2: o app ocupa a tela toda (P1)

**Objetivo**: sem zoom automático nem página mais larga que a tela; abrir em tela cheia pelo
atalho; login que sobrevive ao fechar o app.
**Verificação independente**: entrar tocando nos campos (iPhone), instalar e reabrir o app
nos dois sistemas.

- [x] T011 [P] [US2] `fieldClasses`: `text-sm` → `text-base pointer-fine:text-sm` (P11);
  conferir que não há outro campo de texto fora de `Input`/`Select` —
  `web/src/components/ui/input.tsx`
- [x] T012 [P] [US2] Ícones PNG renderizados uma vez com o Edge sem interface a partir do
  `favicon.svg` (mesmo método da `apple-touch-icon` na 009): `icon-192.png` e `icon-512.png`
  com fundo branco; `icon-maskable-512.png` com a logo em 60% do quadro sobre branco (P14) —
  `web/public/`
- [x] T013 [US2] `manifest.webmanifest`: `name`/`short_name` "Habits", `lang` "pt-BR",
  `start_url` e `scope` "/", `display` "standalone", `theme_color` "#2563eb",
  `background_color` "#f8fafc", e os três ícones com `sizes`, `type` e `purpose` (`any` /
  `maskable`) (P13) — `web/public/manifest.webmanifest`
- [x] T014 [US2] `index.html`: `viewport` com `width=device-width, initial-scale=1.0,
  viewport-fit=cover` (sem `maximum-scale` nem `user-scalable`), `<link rel="manifest">`,
  `apple-mobile-web-app-title` "Habits", `mobile-web-app-capable` e
  `apple-mobile-web-app-capable` "yes", `apple-mobile-web-app-status-bar-style` "default"
  (P12, P13) — `web/index.html`
- [x] T015 [P] [US2] `location = /manifest.webmanifest { types { } default_type
  application/manifest+json; }` (P15) — `web/nginx.conf`
- [x] T016 [US2] Áreas seguras no `AppShell`: `pl-[env(safe-area-inset-left)]`,
  `pr-[env(safe-area-inset-right)]` e `pb-[calc(6rem+env(safe-area-inset-bottom))]` abaixo
  de `lg` (P12); a barra inferior já usa `env(safe-area-inset-bottom)` —
  `web/src/shell/AppShell.tsx`
- [x] T017 [P] [US2] RF-014: `server.servlet.session.cookie.max-age: 7d` (P16) —
  `api/src/main/resources/application.yml`
- [x] T018 [US2] `CsrfFlowIT`: o `Set-Cookie` do `SESSION` no cadastro também contém
  `Max-Age=604800`. Caso novo: depois do cadastro, o logout (com CSRF) devolve `SESSION` com
  `Max-Age=0` — `api/src/test/java/br/com/habits/auth/CsrfFlowIT.java`
- [x] T019 [P] [US2] Nota no guia de publicação: como instalar no iPhone e no Android;
  quem já tem o atalho precisa recriá-lo; no iPhone o app instalado pede login uma vez —
  `docs/deploy.md`
- [x] **Checkpoint**: `npm test`, `npm run build` e `scripts/api-mvn.sh verify` verdes;
  `docker compose up --build` e `curl -I http://localhost:8080/manifest.webmanifest` com
  `Content-Type: application/manifest+json`; ícones respondem 200

## Fase 4 — História 3: topo compacto (P2)

**Objetivo**: título, navegação de semanas, modo e resumo em menos altura no celular.
**Verificação independente**: 390×844 com 5 hábitos: o resumo e os 5 hábitos aparecem sem
rolar.

- [x] T020 [P] [US3] `WeekNav` com prop `compact`: setas `size-9` e período `min-w-24`;
  controle "Últimos 7 dias / Dom–Sáb" em `text-xs px-2 py-1`; mesmos textos e rádios nativos
  (P10) — `web/src/week/WeekNav.tsx`
- [x] T021 [P] [US3] `WeekSummary` com prop `compact`: `p-3`, sem o ícone; título e
  percentual (`text-xl`) na mesma linha, o rótulo embaixo e a barra; mesmos textos, `role` e
  `aria-labelledby` (P10) + caso no `WeekSummary.test.tsx` — `web/src/goals/`
- [x] T022 [US3] Cabeçalho da `WeekPage` no celular: `py-2`, título `text-xl`, ‹ período ›
  na mesma linha e o controle de modo na linha de baixo; passa `compact` ao `WeekNav` e ao
  `WeekSummary`; desktop sem mudança — `web/src/pages/WeekPage.tsx`

## Fase 5 — História 4: ações do hábito no celular (P2)

**Objetivo**: só a alça e o editar visíveis; ↑/↓ continuam alcançáveis por teclado.

- [x] T023 [US4] Em `HabitRows.test.tsx`: os botões "Mover … para cima/baixo" existem e
  funcionam (clique chama `onMove` com o índice certo; o primeiro "para cima" e o último
  "para baixo" ficam desabilitados); depois de mover, o foco continua no botão (ou passa para
  o outro, se ele ficou desabilitado); o contêiner `.habit-move` tem a classe
  `not-focus-within:sr-only` — `web/src/habits/HabitRows.test.tsx`

## Fase 6 — Polimento e encerramento

- [x] T024 Medir no navegador embutido: `scrollWidth <= innerWidth` em 320, 360, 375, 390,
  414 e 430px em todas as telas e diálogos (CS-001, RF-008); a altura em 390×844 (CS-004);
  as células de marcação ≥ 44×44px (CS-005). Ajustar espaçamentos se preciso e registrar em
  "Ajustes durante a implementação" no plan
- [x] T025 Capturas depois em 1280, 1024 e 768px comparadas com as da T001 (CS-006), mais
  375px antes/depois — `specs/010-layout-mobile/capturas/`
- [x] T026 Revisar textos e rótulos acessíveis em pt-BR (faixa de dias, botões, nota do
  `deploy.md`)
- [ ] T027 Executar o checklist abaixo no ambiente local. Depois do merge e do deploy,
  executar no iPhone e no Android reais os itens marcados 📱. Se tudo passar, marcar a spec
  como **Implementada** e atualizar `docs/sdd-guia.md`

## Fase 7 — Revisão 2: segunda a domingo, topo fixo e destaque de hoje

**Objetivo**: US5, a nova US3 (topo fixo) e o destaque de hoje (RF-003), com as decisões
P17–P21 do plan.
**Verificação independente**: em qualquer dia, a semana vai de segunda a domingo, sem
escolha de modo; com 10 hábitos no celular só a lista rola; a coluna de hoje se destaca em
todos os hábitos.

- [x] T028 [US5] `visibleDays(offset, today)` de segunda a domingo + `dates.test.ts` (hoje
  quarta, segunda e domingo; semana anterior; virada de ano); trocar as chamadas antigas
  nos testes (`HabitRows`, `WeekGrid`, `WeekSummary`, `progress`, `WeekPage`) —
  `web/src/week/dates.ts`, testes
- [x] T029 [US5] `AppShell` sem `weekMode`/`changeMode`; `client.ts` sem `updateSettings`;
  `WeekNav` sem o controle de modo e sem as props `mode`/`onModeChange` (P17, P18) —
  `web/src/shell/AppShell.tsx`, `web/src/api/client.ts`, `web/src/week/WeekNav.tsx`
- [x] T030 [US3] Cabeçalho da `WeekPage` em coluna (título e, embaixo, ‹ período ›) no
  celular e no desktop (P18) — `web/src/pages/WeekPage.tsx`
- [x] T031 [P] [US1] `DayStrip` (faixa de 7 colunas; hoje em `bg-brand-600` e texto branco,
  `aria-current="date"`) extraída da `HabitRows`; `HabitRows` com a faixa contínua de hoje
  (`aria-hidden`) atrás da lista e sem fundo nas células de hoje (P20) —
  `web/src/week/DayStrip.tsx`, `web/src/habits/HabitRows.tsx`
- [x] T032 [P] [US1] `WeekGrid`: cabeçalho do dia de hoje em `bg-brand-600` e texto branco
  (P20) — `web/src/week/WeekGrid.tsx`
- [x] T033 [US3] Topo fixo no celular (P19): `useMediaQuery` genérico (+ teste); com altura
  ≥ 500px, bloco `sticky` com cabeçalho, resumo e `DayStrip`; com altura < 500px, só a
  `DayStrip` fixa — `web/src/lib/useMobileLayout.ts`, `web/src/pages/WeekPage.tsx`
- [x] T034 Testes: `HabitRows`/`DayStrip` (hoje em destaque e faixa contínua na coluna
  certa; sem destaque numa semana sem hoje); `WeekPage` (não existe "Últimos 7 dias" nem
  "Dom–Sáb"; título antes da navegação; no celular, cabeçalho, resumo e faixa dentro do
  bloco fixo); `npm test` e `npm run build` verdes
- [x] T035 Medir no navegador embutido: CS-004 com o topo fixo (390×797), CS-008 (10
  hábitos, o topo não se move), CS-009 (segunda na 1ª coluna em qualquer dia), celular
  deitado e `scrollWidth` em 320–430px; novas capturas `depois-*` (o desktop muda no
  previsto: comparar à vista) e registro em "Ajustes" no plan
- [x] T036 Atualizar o checklist abaixo (V-29 trocado por V-40–V-46), `docs/sdd-guia.md` e
  a nota da spec 004 sobre os modos substituídos

## Fase 8 — Revisão 3: edição na semana atual e na anterior; hábitos na 1ª coluna

**Objetivo**: História 6 (regra no servidor e na tela), nova História 4 e RF-001/RF-004/RF-018,
com as decisões P22–P26 do plan.
**Verificação independente**: numa quarta, marcar a semana anterior inteira e a atual até
hoje, e ver duas semanas atrás bloqueada, também direto na API; no celular, cada hábito numa
linha, com emoji em cima, nome embaixo e as 7 caixas ao lado.

- [x] T037 [US6] API: `EditableWindow` da segunda-feira da semana anterior até hoje e mensagem
  nova do `NOT_EDITABLE` (P22); `EditableWindowTest` (sábado, domingo, segunda, fuso de
  Brasília, virada de ano) e `CheckIT` (13 dias atrás num sábado editável; 14 recusado) —
  `api/src/main/java/br/com/habits/check/`, `api/src/test/java/br/com/habits/check/`
- [x] T038 [P] [US6] Web: `weekStart` e `isEditable` com a mesma regra (P23) + `dates.test.ts`;
  ajustar `WeekGrid.test.tsx` e `HabitRows.test.tsx` (a semana anterior inteira editável;
  duas semanas atrás "somente consulta") — `web/src/week/dates.ts`, testes
- [x] T039 [P] [US4] `GoalBadge` exportado; `HabitLabel` sem a variante `inline` (P25) —
  `web/src/habits/HabitLabel.tsx`
- [x] T040 [US1] `DayStrip` na grade `5.25rem + 7 colunas`, com 1ª célula vazia `aria-hidden`
  (+ teste) — `web/src/week/DayStrip.tsx`
- [x] T041 [US1][US4] `HabitRows`: linha em grade (P24); botão "Editar {nome}" com emoji,
  selo e nome em 2 linhas; alça fina; `GoalBar` `sr-only`; ↑/↓ sobrepostas e visíveis só com
  foco; caixas de 28px na célula inteira; coluna de hoje com o novo `left` (+ testes: tocar no
  nome chama `onEdit`; nome antes das caixas; 7 caixas por linha; ↑/↓ com foco) —
  `web/src/habits/HabitRows.tsx`
- [x] T042 [P] [US5] RF-018: teste de que a meta conta só segunda a domingo da semana exibida
  (uma marcação no domingo anterior não entra) — `web/src/goals/progress.test.ts`
- [x] T043 `npm test`, `npm run build` e `scripts/api-mvn.sh verify` verdes
- [x] T044 Medir no navegador embutido: CS-001 (320–430px), CS-004 (390×797), CS-005 (célula ≥
  32×44px em 360px), CS-010 (tela e `curl` na API: segunda da semana anterior aceita, domingo
  de duas semanas atrás recusado), topo fixo com 10 hábitos; capturas `depois-*`; registro em
  "Ajustes" no plan
- [x] T045 Checklist (V-47–V-53), notas nas specs 004 e 005 sobre a regra substituída e
  `docs/sdd-guia.md`

---

## Dependências

- Fase 1 bloqueia as demais. A T001 vem antes de qualquer código; T002–T004 e T006 são
  independentes, e a T005 depende da T004 (mesmo arquivo `HabitList`).
- Fase 2: T007 → T008 → T009/T010.
- A Fase 3 depende só da Fase 1 e pode correr em paralelo com a 2. A T017 → T018 é o único
  trecho na API.
- Fase 4 depende da T008 (o ramo do celular na `WeekPage`).
- Fase 5 depende da T007.
- T024–T027 por último. A verificação 📱 só é possível com o app publicado em HTTPS
  (tela cheia, ícone e cookie `Secure`).
- Fase 7: T028 → T029 → T030; T031 e T032 em paralelo; T033 depende de T030 e T031;
  T034 → T035 → T036. A T027 (itens 📱) só fecha depois da Fase 7.
- Fase 8: T037 e T038 independentes (API e web); T039 → T040 → T041; T042 independente;
  T043 → T044 → T045. A T027 só fecha depois da Fase 8.

---

## Checklist de verificação manual

📱 = feito no aparelho real (iPhone/Safari e Android/Chrome) pelo endereço de produção depois
do deploy; os demais itens, no navegador embutido em `http://localhost:8080` com o celular
emulado.

### Automático
- [x] **V-01** `cd web && npm test` e `npm run build` verdes.
- [x] **V-02** `scripts/api-mvn.sh verify` verde (inclui o `Max-Age` do cookie).
- [x] **V-03** `docker compose up --build` sobe; `/manifest.webmanifest` responde com
  `application/manifest+json`; `icon-192.png`, `icon-512.png` e `icon-maskable-512.png`
  respondem 200.

### US1 — Semana inteira no celular
- [x] **V-04** (1.1) Em 360, 375, 390, 414 e 430px: cada hábito com símbolo e nome numa
  linha e as 7 marcações embaixo, sem rolagem horizontal (CS-001).
- [x] **V-05** (1.2) Uma única faixa de dias/datas no topo, alinhada às marcações de todos
  os hábitos.
- [x] **V-06** (1.3) Com 10 hábitos, rolar para baixo: a faixa continua visível e alinhada.
- [x] **V-07** (1.4) A coluna de hoje fica destacada na faixa e nas marcações.
- [x] **V-08** (1.5) Marcar e desmarcar um dia: grava (recarregar confirma); tocar perto da
  borda da célula marca a célula certa, não a vizinha; área de toque ≥ 44×44px (CS-005).
- [x] **V-09** (1.6) Dia futuro e dia de semana anterior fora do limite aparecem bloqueados.
- [x] **V-10** (1.7) Hábito com meta mostra "X/N"; com a meta atingida aparece o selo verde
  com ✓ (no celular sem a barra, pela decisão de 2026-11-17; o leitor de tela ouve o progresso).

### US2 — O app ocupa a tela toda
- [ ] **V-11** 📱 (2.1) iPhone: em "Entrar" e "Criar conta", tocar nos campos e digitar não
  amplia a página; depois de entrar, a Semana aparece na largura exata (CS-002).
- [ ] **V-12** 📱 (2.2) iPhone: os campos de "Novo hábito", "Editar hábito" e "Trocar senha"
  não ampliam a página.
- [x] **V-13** (2.3) Entrar, Criar conta, Semana, Arquivados, Conta e os três diálogos:
  `scrollWidth <= innerWidth` em 320–430px; arrastar para os lados não move a página.
- [ ] **V-14** 📱 (2.4) O gesto de pinça amplia a página.
- [ ] **V-15** 📱 (2.5) Adicionar à tela inicial no iPhone (Safari) e instalar no Android
  (Chrome): abre em tela cheia, sem barra de endereço, com o nome "Habits", o ícone da logo e
  a cor do tema (CS-003).
- [ ] **V-16** 📱 (2.6) Em tela cheia, em pé e deitado: nada fica atrás do entalhe, da barra
  de status ou da barra de gestos; o último hábito não fica sob a barra inferior.
- [ ] **V-17** 📱 (2.7) Entrar no app instalado, fechá-lo (tirá-lo da lista de apps
  abertos) e abrir de novo: continua logado.
- [x] **V-18** (2.8) Tocar em "Sair" e abrir o app de novo: aparece "Entrar".

### US3 — Topo compacto
- [x] **V-19** (3.1) No celular, o título, ‹ período ›, "Últimos 7 dias / Dom–Sáb" ocupam
  menos altura que na captura "antes" e continuam funcionando.
- [x] **V-20** (3.2) O resumo mostra o mesmo percentual e o mesmo texto de antes, em menos
  altura.
- [x] **V-21** 📱 (3.3) 390×844 em tela cheia (ou emulado com 47px de barra de status), com
  5 hábitos: o resumo e os 5 hábitos aparecem sem rolar (CS-004).

### US4 — Ações do hábito no celular
- [x] **V-22** (4.1) Na linha do nome só aparecem a alça e o lápis; ↑/↓ não aparecem.
- [x] **V-23** (4.2) Com Tab, o foco alcança "Mover … para cima/baixo", que aparecem enquanto
  têm o foco e movem o hábito, mantendo o foco.
- [ ] **V-24** 📱 (4.3) Arrastar pela alça (toque) reordena; o lápis abre a edição.

### Casos de borda
- [x] **V-25** Nome longo: cortado com reticências; o nome completo aparece ao editar e no
  leitor de tela.
- [x] **V-26** 320px: tudo utilizável, sem rolagem horizontal da página.
- [x] **V-27** Celular deitado (ex.: 844×390): lista empilhada, com os 7 dias visíveis.
- [x] **V-28** Tablet 768px: layout de antes (o da 009), sem rolagem horizontal da página.
- [x] **V-29** Alternar "Últimos 7 dias" e "Dom–Sáb" e navegar para semanas anteriores: a
  faixa e as marcações mudam juntas e continuam alinhadas.
- [ ] **V-30** 📱 Teclado virtual aberto num diálogo: o campo em edição continua visível.
- [ ] **V-31** Com "reduzir movimento" emulado, nenhuma animação nova; marcar não anima.
- [ ] **V-32** Conta sem hábitos: o estado vazio cabe na tela.
- [ ] **V-33** Girar o celular emulado (retrato ⇄ paisagem ⇄ 1024px): o layout troca e a
  semana exibida e as marcações continuam as mesmas.

### Desktop
- [x] **V-34** 1280, 1024 e 768px iguais às capturas da T001 (CS-006).
- [x] **V-35** Com mouse, os campos continuam com 14px.

### Acessibilidade
- [x] **V-36** No celular, o leitor de tela anuncia as marcações como no desktop ("Ler em
  28/10", "(dia futuro)"); foco visível em células, alça, ↑/↓ e lápis; texto de hoje na faixa
  com contraste ≥ 4,5:1.

### Regressão
- [ ] **V-37** Executar o checklist de
  [001-registro-de-habitos](../001-registro-de-habitos/tasks.md#checklist-de-verificação-manual)
  e o rápido das specs 004–006 (dia retroativo, dia futuro bloqueado, semana anterior só para
  consulta, metas e resumo, criar/editar/arquivar hábito, trocar senha).
- [x] **V-38** Conta com dados de antes da atualização: hábitos, marcações, metas e ordem
  intactos; sessão ativa continua logada (RC-001, RC-002).
- [x] **V-39** Nenhum erro no console do navegador.

### Revisão 2
- [x] **V-40** (5.1) Numa quinta-feira (data simulada ou real), a semana vai de segunda a
  domingo e os dias depois de hoje aparecem bloqueados.
- [ ] **V-41** (5.2) Numa segunda-feira, a semana começa hoje; os dias ainda editáveis da
  semana anterior ficam acessíveis pela seta ‹.
- [x] **V-42** (5.3, 5.4) Não existe "Últimos 7 dias" nem "Dom–Sáb"; uma conta que usava
  "Últimos 7 dias" vê segunda a domingo, com todas as marcações nos dias certos.
- [ ] **V-43** (5.5) Semana que atravessa a virada do mês: período e faixa corretos.
- [x] **V-44** (3.1) Celular e computador: "Semana" e, logo embaixo, ‹ período ›.
- [x] **V-45** (3.4) Celular com 10 hábitos: rolando até o último, título, semana, resumo e
  faixa de dias não se movem (CS-008); deitado, sobra espaço para a lista rolar.
- [x] **V-46** (1.4) Hoje na faixa com fundo azul e texto branco e coluna de hoje com fundo
  contínuo atravessando todos os hábitos, no celular e no computador (CS-009); numa semana
  anterior, sem destaque.

V-29 ("Últimos 7 dias" e "Dom–Sáb") fica substituído pelos itens V-40 a V-43 na revisão 2.

### Resultado da verificação local (2026-11-17)

- **Automático**: web 68/68 (`npm test`) e `npm run build`; API 34/34 (`scripts/api-mvn.sh verify`,
  com o `Max-Age=604800` no cadastro e `Max-Age=0` no "Sair" do `CsrfFlowIT`).
- **App local** (`docker compose`): `/manifest.webmanifest` com `application/manifest+json`;
  ícones 200; login devolve `SESSION=…; Max-Age=604800; HttpOnly; SameSite=Lax`.
- **Navegador embutido, conta de demonstração local** (celular emulado):
  - nenhuma tela ou diálogo passa da largura em 320, 360, 375, 390, 414 e 430px (Entrar,
    Criar conta, Semana, Arquivados, Conta, Novo hábito, Editar, Trocar senha);
  - células de 39,8×44px (320px) a 55,5×44px (430px), caixa de 32px; tocar a 1px das bordas
    marca a célula certa, grava (recarregar confirma) e não mexe nas vizinhas;
  - faixa de dias alinhada às marcações (±1px) em "Últimos 7 dias", "Dom–Sáb" e na semana
    anterior; presa no topo com 10 hábitos; dias futuros e fora do limite bloqueados;
  - 390×797 (390×844 sem a barra de status): o 5º hábito termina em 678px e a barra inferior
    do iPhone começa em 692px (CS-004);
  - ↑/↓ com 1px antes do foco e 64px, com contorno de foco, ao chegar por Tab;
  - nome de 29 letras cortado com reticências, completo no `title` e no rótulo acessível;
  - campos com 16px no toque emulado e 14px com mouse;
  - celular deitado (844×390) usa a lista empilhada; tablet (768px) usa o layout de antes;
  - contraste do texto de hoje na faixa (`brand-700` sobre `brand-50`): 6,16:1.
- **Desktop (CS-006)**: capturas `depois-*` iguais às `antes-*` em 1280, 1024 e 768px
  (0 px de diferença).
- **Console**: só os 502/401 esperados durante os reinícios dos contêineres e com a sessão
  encerrada; nenhum erro do app.
- **Ainda não verificado**:
  - 📱 V-11, V-12, V-14 a V-17, V-24 e V-30: só no iPhone e no Android reais, pelo endereço de
    produção depois do deploy;
  - V-31: o navegador embutido não emula "reduzir movimento". O CSS só anima sob
    `motion-safe`, como na 009;
  - V-32: o estado vazio está coberto pelo teste da `HabitRows`, mas não foi visto na tela
    (precisaria de outra conta);
  - V-33: com o painel do navegador oculto, a página roda em segundo plano e não recebe
    `resize`/`change`. O teste do `useMobileLayout` cobre a troca. Conferir girando o
    celular real;
  - V-37: a regressão completa da 001 não foi refeita. Marcar, desmarcar, retroativo, futuro,
    modos, semana anterior e "Sair" foram exercitados acima.

### Revisão 3
- [x] **V-47** (6.1, 6.2) Numa quarta (ou no dia real): semana atual editável de segunda até
  hoje; semana anterior inteira editável; futuros bloqueados.
- [x] **V-48** (6.3) Duas semanas atrás: todos os dias "somente consulta"; marcações antigas
  continuam visíveis (RC-004).
- [x] **V-49** (6.5) Direto na API: marcar a segunda da semana anterior → 204; o domingo de duas
  semanas atrás → 422 `NOT_EDITABLE` com a mensagem nova (CS-010).
- [x] **V-50** (1.1) Celular 360–430px: cada hábito numa linha, emoji em cima e nome embaixo
  na 1ª coluna, 7 caixas de 28px ao lado, sem rolagem horizontal; faixa de dias e coluna de
  hoje alinhadas às caixas.
- [x] **V-51** (4.1, 4.2) Tocar no emoji ou no nome abre a edição; alça arrasta; selo da meta
  ao lado do emoji; sem lápis e sem ↑/↓ à vista.
- [x] **V-52** (4.3) Com Tab: "Editar …" e ↑/↓ alcançáveis e visíveis com foco.
- [x] **V-53** (5.6) Meta de uma semana conta só as marcações de segunda a domingo dela.

### Resultado da verificação da revisão 2 (2026-11-17)

- **Automático**: web 77/77 (`npm test`) e `npm run build`. A API não mudou na revisão 2; a
  última rodada (34/34) continua válida.
- **Navegador embutido, conta de demonstração local** (hoje = terça, 17/11):
  - a semana exibida é 16/11 – 22/11 ("seg 16" … "dom 22"), sem "Últimos 7 dias" nem
    "Dom–Sáb". A conta estava com a preferência "Últimos 7 dias" gravada, e as marcações
    continuam nos dias certos (V-42);
  - "Semana" e, embaixo, ‹ período › em 390px e em 1280px (V-44);
  - 390×797: o topo fixo tem 232px; o 5º hábito termina em 655px e a barra inferior do
    iPhone começa em 693px (CS-004);
  - 10 hábitos, página rolada 394px: o topo, o título e a faixa de hoje não se movem, e o
    primeiro hábito sai de 232px para −162px (CS-008, V-45). Os 5 hábitos extras foram apagados
    depois;
  - celular deitado (844×390): o topo rola e só a faixa de dias fica presa (a 6px do topo);
  - hoje: faixa e cabeçalho da grade com `rgb(37, 99, 235)` (`brand-600`) e texto branco;
    no celular, a coluna contínua tem a mesma posição e largura da célula de hoje na faixa
    (±1px) em 320, 390 e 430px (V-46);
  - `scrollWidth` = largura em 320 e 430px; células com 39,8×44px em 320px.
- **Desktop**: muda só no previsto (cabeçalho, segunda a domingo e hoje em destaque), conferido
  à vista nas capturas `depois-*`. A barra lateral fica igual (as diferenças começam em
  x = 256px).
- **Coberto só por teste automático**: V-41 (segunda-feira; `dates.test.ts`) e V-43 (virada
  de mês e de ano; `dates.test.ts` e o período 26/10 – 01/11 no `WeekPage.test.tsx`).

### Resultado da verificação da revisão 3 (2026-11-17)

- **Automático**: web 82/82 (`npm test`) e `npm run build`; API 36/36 (`scripts/api-mvn.sh
  verify`: 5 casos novos no `EditableWindowTest` e o `CheckIT` com a janela nova).
- **API local** (hoje = terça, 17/11): `PUT` em 09/11 (segunda da semana anterior) → 204;
  em 08/11 (domingo de duas semanas atrás) e 18/11 (amanhã) → 422 `NOT_EDITABLE` "Só é
  possível marcar dias da semana atual e da semana anterior."; `DELETE` em 09/11 → 204 (V-49).
- **Navegador embutido, conta de demonstração local**:
  - semana atual com 2 dias editáveis (16 e 17/11) e 5 futuros; semana anterior (09–15/11)
    com os 7 editáveis; 02–08/11 com os 7 "somente consulta" (V-47, V-48);
  - 360px: 1ª coluna com 84px, emoji com o selo ao lado e o nome embaixo em até 2 linhas
    ("Beber 2 litros de…"); células de 33,4×44px, caixas de 28px; faixa, coluna de hoje e
    caixas alinhadas; sem rolagem horizontal em 320, 360, 390 e 430px (V-50);
  - tocar no nome "Ler 20 páginas" abriu "Editar hábito" com o nome no campo; nenhum lápis e
    nenhum ↑/↓ à vista; com Tab, "Mover Correr para cima" ganha foco visível e o grupo ↑/↓
    aparece (1px → 64px) (V-51, V-52);
  - 390×797: o 5º hábito termina em 585px, antes da barra do iPhone em 693px (CS-004);
  - 320px: caixa de 24px numa célula de 27,8px (ajuste registrado no plan).
- **Metas** (V-53): teste `progress.test.ts` — o domingo anterior e a segunda seguinte não
  entram na contagem da semana de 26/10 a 01/11.
- **Desktop**: só a regra de edição muda; arranjo igual (captura `depois-1280.png`).
