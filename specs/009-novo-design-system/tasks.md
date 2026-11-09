# Tarefas: Novo design system (azul, tema claro) e nova logo

**Branch**: `009-novo-design-system` | **Entradas**: [spec.md](./spec.md), [plan.md](./plan.md)

> Formato: `- [ ] T001 [P] [US1] Descrição — arquivo`. Marque `[x]` ao concluir.
> `[P]` = pode ser feita em paralelo (arquivos diferentes, sem dependência).

Histórias: **US1** identidade visual · **US2** navegação e rotas · **US3** entrar/criar conta ·
**US4** componentes consistentes · **US5** microinterações.

Decisões do plan citadas como **P1–P12**. API e banco não mudam: nenhuma tarefa em `api/`.

---

## Fase 1 — Fundamentos (bloqueia as histórias)

- [x] T001 Instalar com versão exata (`npm install -E`): `tailwindcss@4.3.3`, `@tailwindcss/vite@4.3.3`, `clsx@2.1.1`, `tailwind-merge@3.7.0`, `class-variance-authority@0.7.1`, `lucide-react@1.61.0`; conferir `npm audit` — `web/package.json`, `web/package-lock.json`
- [x] T002 Plugin `@tailwindcss/vite` e alias `@/` → `src` (Vite e Vitest); `paths` `@/*` — `web/vite.config.ts`, `web/tsconfig.json`
- [x] T003 [US1] `index.css`: `@import "tailwindcss"`, `@theme` com os tokens do plan (escala `brand`, `ink`, `control`, `success`, `danger`, `warning`, raios, sombras, fonte Inter, `tabular-nums` utilitário), base (`body` `slate-50`, foco `ring` global), keyframes `block-in` e `dialog-in`; o `styles.css` antigo entra como `@import … layer(legacy)` (entre o reset e os utilitários) até a T031 — `web/src/index.css`, `web/src/main.tsx`
- [x] T004 [P] `cn()` = `twMerge(clsx(...))` — `web/src/lib/cn.ts`
- [x] T005 [P] [US4] `initials(name)` + `initials.test.ts` (casos do plan: uma palavra, várias, acentos, espaços extras, vazio) — `web/src/lib/`
- [x] T006 [US4] Componentes ui no modelo shadcn, em pt-BR e sem Radix (P2, P6): `button` (cva: `primary`, `secondary`, `ghost`, `danger`, `link`; tamanhos `sm`, `md`, `icon`), `input`, `label`, `select` (nativo estilizado), `card`, `badge` (`brand`, `success`, `warning`, `neutral`), `avatar` (iniciais, tons de azul), `alert` (ícone + texto, mantém `role` recebido), `dialog` (envolve o `Modal` com `<dialog>` nativo; título, descrição, rodapé de ações) — `web/src/components/ui/`
- [x] T007 [US1] `Logo` com variantes `icon`, `full` e `inverted` (para fundo azul), SVG do ícone inline com `role="img"` e `aria-label="Habits"` — `web/src/components/Logo.tsx`
- [x] T008 [P] [US1] Arquivos estáticos a partir do conceito aprovado em `specs/009-novo-design-system/logo/`: `favicon.svg`, `logo.svg` (nome em contornos, P10), `apple-touch-icon.png` 180 px com fundo branco (render único com o Edge sem interface); remover a logo antiga — `web/public/`
- [x] T009 [P] [US1] Google Fonts Inter 400;500;600;700 (sem Roboto Mono), `favicon.svg`, `apple-touch-icon`, `<meta name="theme-color" content="#2563EB">` — `web/index.html`
- [x] T010 [P] Linha "Fontes" → "Google Fonts: Inter 400–700"; versão 2.1.1 (PATCH) com histórico — `.specify/memory/constitution.md`
- [x] **Checkpoint**: `npm test` e `npm run build` verdes (o app ainda com o visual antigo)

## Fase 2 — História 2: navegação e rotas (P1) 🎯 MVP

**Objetivo**: shell com navegação única e as rotas Semana, Arquivados e Conta.
**Verificação independente**: alcançar os quatro destinos no desktop e no celular, só com teclado inclusive; voltar do navegador.

- [x] T011 [US2] Roteador próprio (P5): `useRoute()`, `navigate(path, {replace})`, `<Link>` com `aria-current="page"` quando ativo; rota desconhecida → `replace("/")`; foco no `<h1>` da tela nova após navegar + `router.test.tsx` — `web/src/router.tsx`
- [x] T012 [US2] `AppShell`: recebe o estado que hoje está na `HomePage` (`today`, `offset`, virada da meia-noite, `useHabits`, `changeMode`, aviso global, `HabitDialog`, `ChangePasswordDialog`) e renderiza `AppNav` + a rota atual (P9) — `web/src/shell/AppShell.tsx`
- [x] T013 [US2] `AppNav` como **uma única** `<nav aria-label="Navegação principal">` (P7): logo (só lateral), Semana, Arquivados com selo da quantidade, botão "Novo hábito" (`data-action="new"`, desabilitado com o texto do limite como hoje), Conta (`lg:hidden`), cartão da conta com avatar, nome, e-mail, "Trocar senha" e "Sair" (`hidden lg:flex`); lateral fixa de 256 px em `lg`, barra inferior de vidro abaixo (P11) com `padding-bottom` de área segura e espaço reservado no `main` — `web/src/shell/AppNav.tsx`
- [x] T014 [US2] `WeekPage` com o conteúdo da antiga `HomePage` (WeekNav, WeekSummary, HabitList, WeekGrid) recebendo o estado do shell; tirar da `HabitList` o botão "Arquivados (n)" e manter "Crie seu primeiro hábito" no estado vazio — `web/src/pages/WeekPage.tsx`, `web/src/habits/HabitList.tsx`
- [x] T015 [US2] `ArchivedPage` com o conteúdo do `ArchivedDialog` como tela (`<h1>Hábitos arquivados</h1>`, Restaurar desabilitado no limite com o aviso, Excluir definitivamente com a confirmação de hoje), estado vazio explicando como arquivar + `ArchivedPage.test.tsx`; remover `ArchivedDialog.tsx` — `web/src/pages/`, `web/src/habits/`
- [x] T016 [US2] `AccountPage`: avatar grande, nome, e-mail, "Trocar senha", "Sair" — `web/src/pages/AccountPage.tsx`
- [x] T017 [US2] `App`: visitante vê Entrar/Criar conta sem mudar a URL; logado vê o `AppShell` na rota pedida; após sair, `navigate("/", {replace: true})`; remover `web/src/home/` — `web/src/App.tsx`
- [x] T018 [US2] Testes: `AppShell.test.tsx` (Arquivados → Semana mantém a semana anterior exibida; "Novo hábito" abre o diálogo em `/arquivados`); `auth.test.tsx` ganha "login em `/arquivados` abre Arquivados" e continua achando "Sair", "Ana" e "Crie seu primeiro hábito" uma única vez — `web/src/shell/`, `web/src/auth/auth.test.tsx`
- [x] **Checkpoint**: `npm test` e `npm run build` verdes

## Fase 3 — Histórias 1 e 4: identidade visual e componentes (P1/P2)

**Objetivo**: toda tela logada no visual novo, com os componentes da Fase 1.
**Verificação independente**: percorrer Semana, Arquivados, Conta e os diálogos sem restos de violeta/zinco.

- [x] T019 [US1][US4] `WeekNav` com `Button` `ghost` + `ChevronLeft/Right`, período em `tabular-nums`, modo como controle segmentado (rádios nativos estilizados); cabeçalho fixo de vidro na Semana (P11) — `web/src/week/WeekNav.tsx`, `web/src/pages/WeekPage.tsx`
- [x] T020 [US1][US4] `HabitList`: linha no padrão do plan (alça `GripVertical`, emoji em quadrado `brand-50`, nome truncado, `GoalBar` + `Badge` "X/N" ou "Meta atingida" com ícone, ↑ ↓ ✎ como `Button` `icon` com os mesmos `aria-label`); manter `[data-id]`, `[data-action]`, `.habit-move` e as classes `dragging`/`drop-before`/`drop-after` estilizadas — `web/src/habits/HabitList.tsx`, `web/src/index.css`
- [x] T021 [US1][US4] `WeekGrid`: checkbox nativo `appearance-none` 44 px (40 px `< sm`), marcado `brand-600` com check em SVG, desmarcado borda `control`, desabilitado esmaecido; coluna de hoje com fundo `brand-50`; manter `.days`, `.day.today`, `aria-current`; linhas alinhadas com a `HabitList` — `web/src/week/WeekGrid.tsx`
- [x] T022 [P] [US4] `GoalBar` (trilho `slate-200`, preenchimento `brand-600` / `success` ao atingir) e `WeekSummary` em `Card` com percentual grande em `tabular-nums`, sem mudar textos e papéis acessíveis — `web/src/goals/`
- [x] T023 [P] [US4] `HabitDialog` e `ChangePasswordDialog` com `dialog`, `Input`, `Label`, `Select` nativo e `Button` (Arquivar = `danger`); mesmos rótulos e mensagens — `web/src/habits/HabitDialog.tsx`, `web/src/auth/ChangePasswordDialog.tsx`
- [x] T024 [P] [US4] Aviso global como `Alert` (`role="status"`, botão "Fechar aviso" com ícone `X`) e "Carregando…" com spinner acessível — `web/src/shell/AppShell.tsx`, `web/src/App.tsx`
- [x] **Checkpoint**: `npm test` e `npm run build` verdes

## Fase 4 — História 3: entrar e criar conta (P2)

- [x] T025 [US3] `AuthLayout`: duas colunas em `lg` (painel `brand-700 → brand-950` com `Logo inverted`, frase "Construa seus hábitos, um bloco de cada vez." e blocos decorativos `aria-hidden`), uma coluna abaixo com a logo acima do cartão — `web/src/components/AuthLayout.tsx`
- [x] T026 [US3] `LoginPage` e `RegisterPage` com `AuthLayout`, `Card`, `Input`, `Label`, `Button`; erros junto ao campo/formulário com os mesmos textos e `role="alert"` — `web/src/auth/`

## Fase 5 — História 5: microinterações (P3)

- [x] T027 [US5] Checkbox marcado com `motion-safe:animate-[block-in_180ms]` (P12), sem atrasar o registro — `web/src/week/WeekGrid.tsx`, `web/src/index.css`
- [x] T028 [P] [US5] Abertura de diálogos (`dialog-in` 150 ms) e transições de hover/foco dos botões e da navegação, todas sob `motion-safe` — `web/src/components/ui/`, `web/src/index.css`

## Fase 6 — Polimento e encerramento

- [x] T029 Revisar textos novos em pt-BR (rótulos da navegação, estado vazio de Arquivados, frase do painel) e `alt`/`aria-label` da logo
- [x] T030 Procurar restos do visual antigo: nenhum `#8B5CF6`, `#A78BFA`, `#09090A`, `#18181B`, `#27272A`, `Roboto Mono` ou `logo.svg` antigo em `web/` (`grep`)
- [x] T031 Remover `styles.css` e seu import, depois de todas as telas migradas — `web/src/styles.css`, `web/src/main.tsx`
- [x] T032 [P] Nova captura de tela da Semana no desktop — `preview.png`, `README.md`
- [x] T033 Executar o checklist abaixo; se tudo passar, marcar a spec como **Implementada** e atualizar `docs/sdd-guia.md`

---

## Dependências

- Fase 1 bloqueia as demais (tokens, componentes e logo).
- Fase 2 antes da 3: as telas novas (`WeekPage`, `ArchivedPage`, `AccountPage`) são o que a
  Fase 3 estiliza. T011 → T012 → T013/T014/T015/T016 → T017 → T018.
- Fases 4 e 5 dependem só da Fase 1 e podem correr em paralelo com a 3.
- T031 por último entre as tarefas de código (o CSS antigo segura o visual até lá).

---

## Checklist de verificação

### Automático
- [x] **V-01** `cd web && npm test` e `npm run build` verdes.
- [x] **V-02** `scripts/api-mvn.sh verify` verde (nada mudou na API; confirma que o deploy da `main` passa).
- [x] **V-03** `docker compose up --build` sobe e o app abre em `http://localhost:8080`, inclusive abrindo direto `/arquivados` e `/conta` (fallback do Nginx).

### US1 — Identidade visual
- [x] **V-04** (1.1) Tela de entrada com a nova logo e fundo claro azulado.
- [x] **V-05** (1.2) Semana, Arquivados, Conta e os três diálogos com a mesma paleta, fonte, cantos e sombras.
- [x] **V-06** (1.3) Favicon na aba e ícone ao adicionar à tela inicial do celular legíveis.
- [x] **V-07** (1.4) Nenhum violeta nem fundo escuro em nenhuma tela (inclui T030).

### US2 — Navegação
- [x] **V-08** (2.1) Desktop ≥ 1024 px: menu lateral com logo, Semana, Arquivados, Novo hábito e cartão da conta com Trocar senha e Sair.
- [x] **V-09** (2.2) Celular: barra inferior fixa de vidro com Semana, Arquivados, Novo hábito e Conta; o último hábito da lista não fica escondido atrás dela.
- [x] **V-10** (2.3) O destino atual fica destacado e o leitor de tela anuncia "página atual".
- [x] **V-11** (2.4) Só com Tab/Enter: alcançar e ativar todos os destinos, com foco visível.
- [x] **V-12** (2.5) Arquivados abre em tela própria e a URL vira `/arquivados`; Restaurar e Excluir definitivamente funcionam.
- [x] **V-13** (2.6) Na semana anterior (‹), ir a Arquivados e voltar pelo navegador e pelo menu: continua na semana anterior.
- [x] **V-14** (2.7) Restaurar um hábito com meta e marcações: ao voltar à Semana ele aparece com ambas.
- [x] **V-15** (2.8) Sair, abrir `/arquivados` pela barra de endereço, entrar: abre Arquivados.

### US3 — Entrar e criar conta
- [x] **V-16** (3.1) Desktop: duas colunas com o painel da marca.
- [x] **V-17** (3.2) Celular (360 px): uma coluna, logo acima do formulário, sem rolagem horizontal.
- [x] **V-18** (3.3) Senha errada e cadastro inválido: mesmas mensagens de hoje, anunciadas pelo leitor de tela.

### US4 — Componentes
- [x] **V-19** (4.1) Entrar, Salvar e Novo hábito com o mesmo botão azul; Arquivar e Excluir com o estilo de perigo; Fechar/Cancelar neutros.
- [x] **V-20** (4.2) Avatar com as iniciais ("Ana Maria Souza" → "AS"; nome de uma palavra → 1 letra).
- [x] **V-21** (4.3) Meta em andamento mostra "X/N"; meta atingida mostra barra verde + "Meta atingida" com ícone.
- [x] **V-22** (4.4) Aviso de "Senha alterada." e erros com o mesmo padrão visual.

### US5 — Microinterações
- [x] **V-23** (5.1) Marcar um dia: animação curta de encaixe; a marcação é gravada (recarregar a página confirma).
- [x] **V-24** (5.2) Diálogos abrem com transição suave.
- [x] **V-25** (5.3) Com "reduzir movimento" ativo no sistema (ou emulado no navegador), nenhuma animação.

### Casos de borda
- [x] **V-26** Nome longo/com acentos: avatar e cartão da conta sem quebrar o layout.
- [x] **V-27** Muitos hábitos (até o limite): a lista rola; a navegação continua visível.
- [x] **V-28** 360 px: a grade de dias rola só na sua área e abre centralizada em hoje.
- [x] **V-29** Zoom de 200% no desktop: tudo utilizável.
- [x] **V-30** Celular com teclado aberto no diálogo: o campo em edição não fica coberto.
- [x] **V-31** Endereço inexistente (`/xyz`) logado: vai para a Semana.

### Acessibilidade
- [x] **V-32** Contrastes da tabela "Tokens" do plan conferidos no navegador (texto ≥ 4,5:1; controles e foco ≥ 3:1).
- [x] **V-33** Arrastar para reordenar (mouse e toque) e mover com ↑/↓ mantendo o foco continuam funcionando.

### Regressão
- [x] **V-34** Checklist rápido das specs 004–006: marcar dia retroativo, dia futuro bloqueado, semana anterior só consulta, alternar "Últimos 7 dias"/"Dom–Sáb", metas e resumo, criar/editar/arquivar hábito, trocar senha, sessão expirada volta ao login com aviso.
- [x] **V-35** Conta com dados de antes da atualização: hábitos, marcações, metas e ordem intactos; sessão ativa continua logada (RC-001, RC-002).
- [x] **V-36** Nenhum erro no console do navegador.

### Resultado da verificação (2026-11-09)

- Automático: web 52/52 (`npm test`, 3 rodadas seguidas) e `npm run build`; API 30/30 (`scripts/api-mvn.sh verify`).
- Navegador (Edge sem interface via CDP, conta de demonstração local, e o navegador do app com a conta "Teste 007"):
  V-03, V-08–V-10, V-12–V-14, V-23–V-25 (com e sem "reduzir movimento" emulado), V-27 (10 hábitos a 1280 e 390 px),
  V-28, V-29 (640 px = 200% de 1280), V-31, V-33 (mouse e teclado), V-36 sem erros.
- V-32: contraste medido em todos os 61 textos visíveis de Semana, Arquivados e Conta: nenhum abaixo de 4,5:1 (menor: 4,55, `slate-500` sobre `slate-50`).
- V-15, V-18 e as partes de V-34 sem tela (trocar senha, sessão expirada) cobertas pelos testes automáticos.
- No celular (verificado pelo usuário em 2026-11-09): V-30 (teclado virtual aberto no diálogo) e o arraste por **toque** do V-33 —
  o toque emulado não chega à página no Edge sem interface, por isso ficou para o aparelho real.
