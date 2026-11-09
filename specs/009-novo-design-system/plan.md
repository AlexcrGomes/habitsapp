# Plano de Implementação: Novo design system (azul, tema claro) e nova logo

**Branch**: `009-novo-design-system` | **Data**: 2026-11-09 | **Spec**: [spec.md](./spec.md)
**Status**: Aprovado em 2026-11-09 | **Tarefas**: [tasks.md](./tasks.md)

> Pré-requisito: a `spec.md` deve estar com status **Aprovada** (aprovada em 2026-11-09).
> Este documento descreve **como** a spec será atendida.

---

## Resumo

O `styles.css` único (611 linhas de hex soltos) é substituído por **Tailwind CSS v4** com
**tokens de design** (`@theme`): escala de azuis `brand`, neutros `slate`, cores de status,
raios, sombras e animações. Os componentes base seguem o modelo do **shadcn/ui** — código
copiado para `web/src/components/ui/`, sem biblioteca de UI instalada — com acabamentos do
**Untitled UI** (avatar com iniciais, selos, cartões) e um efeito de vidro em CSS na barra
de navegação, inspirado no Glisse. A tela logada ganha um **shell** com navegação única
(lateral no desktop, barra inferior no celular) e três rotas — Semana, Arquivados e Conta —
servidas por um roteador mínimo próprio sobre a History API. API, banco e regras não mudam.

## Contexto técnico

| Item | Valor |
|------|-------|
| Stack | A mesma (React 19.3.1 + TS 5.9.3, Vite 7.3.7, Vitest 5.0.5); API e banco intocados |
| Dependências novas | `tailwindcss` 4.3.3, `@tailwindcss/vite` 4.3.3, `clsx` 2.1.1, `tailwind-merge` 3.7.0, `class-variance-authority` 0.7.1, `lucide-react` 1.61.0 (todas fixas; ver P1–P4) |
| Persistência | Nenhuma mudança (sem migração) |
| Fontes | Google Fonts **Inter 400/500/600/700**; números com `tabular-nums` (sai a Roboto Mono) |
| Rotas | `/` (Semana), `/arquivados`, `/conta`; o `try_files` do `nginx.conf` já devolve o `index.html` |
| Riscos | Alinhamento das linhas da lista com a grade de dias (lição das specs 004/006); classes e `data-*` usadas em tempo de execução pelo arrastar e pela rolagem até hoje; testes que encontram elementos duplicados se a navegação for renderizada duas vezes |

---

## Constitution Check (2.1.0)

| Princípio | Conforme? | Observação |
|-----------|-----------|------------|
| I. Spec antes do código | ✅ | Spec aprovada em 2026-11-09 |
| II. Stack oficial | ✅ | Sem linguagem, framework ou serviço novo; 6 pacotes npm de frontend, todos justificados (P1–P4) e com versão fixa publicada há ≥ 2 semanas; roteador próprio em vez de biblioteca (P5) |
| III. Dados isolados por usuário | ✅ | Nenhuma rota de API, consulta ou migração nova; `IsolationIT` não muda |
| IV. pt-BR e acessível | ✅ | Tokens escolhidos com contraste AA medido (tabela em "Tokens"); foco visível `ring` azul em todo controle; `aria-current="page"` na navegação; animações com `motion-reduce` |
| V. Responsivo | ✅ | O breakpoint de 570 px evolui para os padrões do Tailwind: `sm` (640 px) para a grade compacta e `lg` (1024 px) para trocar barra inferior ↔ menu lateral — ver P8 |
| VI. Verificação | ✅ | Testes Vitest novos (roteador, iniciais, shell, Arquivados) + ajustes nos atuais; checklist manual no `tasks.md` |
| VII. Segurança | ✅ | Nada muda em sessão/CSRF; nenhum script de terceiros além do CSS do Google Fonts que já existe |

---

## Pesquisa e decisões

| # | Decisão | Alternativas | Motivo |
|---|---------|--------------|--------|
| P1 | **Tailwind CSS v4** via `@tailwindcss/vite`, tokens em `@theme` no CSS | Manter CSS puro com variáveis; Tailwind v3 + PostCSS | É a base do shadcn/ui e do Untitled UI React (pedido do usuário); v4 dispensa `tailwind.config` e PostCSS — só o plugin do Vite. Versão 4.3.3: as 4.3.4/4.3.5 têm menos de 2 semanas |
| P2 | Componentes **no modelo shadcn** copiados para `components/ui/` | Instalar shadcn via CLI; Untitled UI React como pacote | O shadcn não é dependência — é código no repositório, que fica sob nosso controle e em pt-BR. Copiamos só o necessário (Button, Input, Label, Select nativo, Card, Badge, Avatar, Dialog sobre `<dialog>`) |
| P3 | `clsx` + `tailwind-merge` (função `cn`) e `class-variance-authority` (variantes) | Concatenar strings à mão | É o padrão dos componentes shadcn; `tailwind-merge` resolve conflitos de classe ao customizar um componente. Pacotes pequenos e sem dependências |
| P4 | Ícones **`lucide-react`** | SVGs desenhados à mão; emojis/caracteres (`‹ › ↑ ↓ ✎ ⠿` de hoje) | Biblioteca de ícones do shadcn; importa só os ícones usados (tree-shaking). Os caracteres atuais variam por fonte/sistema |
| P5 | **Roteador próprio** (`useRoute` + `<Link>`, ~50 linhas, History API) | `react-router` | São 3 rotas fixas sem parâmetros; o que a spec pede (endereço próprio, voltar/avançar, favorito, voltar à mesma semana) cabe em `pushState` + `popstate`. Uma dependência a menos (Princípio II) |
| P6 | **Sem Radix**: menu da conta vira o rodapé do menu lateral (desktop) e a tela **Conta** (celular); diálogos continuam no `<dialog>` nativo, só restilizados | Radix Dialog/DropdownMenu | `<dialog>` já dá foco preso e Esc (spec 002) e os testes dependem do polyfill de `showModal`; sem menu suspenso, não há o que o Radix resolva. Também mantém `<select>` e checkbox **nativos** (testes usam `selectOptions` e `role="checkbox"`) |
| P7 | **Uma única `<nav>`** cuja forma muda por CSS (lateral em `lg`, barra inferior abaixo) | Renderizar menu lateral e barra inferior separados | Evita botões duplicados no DOM (leitor de tela e testes com `getByRole` veriam dois "Sair") |
| P8 | Breakpoints: `< 640` celular compacto, `640–1023` celular/tablet com barra inferior, `≥ 1024` menu lateral fixo de 256 px | Manter 570 px | 7 colunas de dia + coluna de hábitos + 256 px de menu não cabem abaixo de ~1024 px; abaixo disso a grade continua rolando na horizontal só na sua área (como hoje) |
| P9 | Estado da semana (`offset`, `today`) e `useHabits` sobem para o **shell**, acima das rotas | Guardar a semana na URL (`?semana=-1`) | A spec pede voltar de Arquivados "na mesma semana"; o shell não desmonta ao trocar de rota, então basta o estado React. Arquivados reaproveita `habits`/`mutate` sem nova requisição |
| P10 | Logo como **componente React** (SVG do ícone inline + texto "Habits" em Inter) e arquivos estáticos em `public/` (`favicon.svg`, `apple-touch-icon.png` 180 px, `logo.svg`) | Wordmark convertido em contornos | No app a Inter já está carregada, então o texto real fica nítido e acessível; o `logo.svg` estático (README/compartilhamento) recebe o nome em contornos, gerado uma vez a partir da Inter |
| P11 | Efeito "vidro" só na barra de navegação inferior e no cabeçalho fixo da Semana: `bg-white/75 backdrop-blur-xl` + borda branca translúcida + sombra | Pacote `glisse` | Fora de escopo instalar o Glisse (spec); `backdrop-filter` tem suporte amplo e degrada para branco sólido |
| P12 | Animação "bloco encaixando": `@keyframes` (escala 0,6 → 1,08 → 1 e leve descida, 180 ms) no checkbox marcado; diálogos com fade + escala 150 ms; tudo sob `motion-safe:` | Biblioteca de animação | CSS basta; `motion-safe` cumpre RF-009 e o Princípio IV sem JS |

---

## Tokens (tema claro)

Definidos em `web/src/index.css` com `@theme` (viram classes `bg-brand-600`, `text-ink`…).

| Token | Valor | Uso | Contraste |
|-------|-------|-----|-----------|
| `brand-50…950` | `#EFF6FF #DBEAFE #BFDBFE #93C5FD #60A5FA #3B82F6 #2563EB #1D4ED8 #1E40AF #1E3A8A #172554` | Escala de azuis (a mesma da logo) | — |
| `brand-600` | `#2563EB` | Botão principal, checkbox marcado, item ativo | branco sobre ele 5,2:1 ✅ |
| `brand-700` | `#1D4ED8` | Hover do principal, links | 6,7:1 sobre branco ✅ |
| `ink` | `#0B1B3F` | Títulos e o nome na logo | 16,9:1 ✅ |
| `slate-700` / `slate-500` | `#334155` / `#64748B` | Texto / texto secundário | 10,4:1 / 4,8:1 ✅ (4,55:1 sobre `slate-50`) |
| `control` | `#7A879C` | Borda de campos, checkbox desmarcado | 3,6:1 sobre branco, 3,5:1 sobre `slate-50` ✅ (≥ 3:1) |
| `slate-200` | `#E2E8F0` | Divisórias e bordas de cartão (decorativas) | — |
| fundo / superfície | `slate-50 #F8FAFC` / branco | Página / cartões, diálogos | — |
| `success` | `#047857` | "Meta atingida" (texto + ícone ✓) | 5,5:1 ✅ |
| `danger` | `#DC2626` | Erros, Excluir, Arquivar | 4,8:1 ✅ |
| `warning` | `#B45309` | Limite de hábitos ativos | 5,0:1 ✅ |
| `ring` | `brand-500 #3B82F6`, 2 px + offset 2 px | Foco visível | 3,7:1 ✅ |
| raios | `sm 6px`, `md 10px`, `lg 14px`, `xl 20px` | Campos / botões / cartões / diálogos | — |
| sombras | `xs`, `sm`, `lg` no padrão Untitled UI (`rgb(16 24 40 / …)`) | Cartões, diálogos, barra de vidro | — |

Os contrastes são conferidos de novo na verificação (T de acessibilidade no `tasks.md`).

## Estrutura de telas

```
Visitante:  /qualquer → Entrar ⇄ Criar conta (mesma URL; após entrar, fica na rota pedida)
Logado:     AppShell
            ├── nav (lateral ≥1024 | barra inferior <1024, vidro)
            │   ├── Logo (só lateral)
            │   ├── Semana        → /            (aria-current="page" quando ativa)
            │   ├── Arquivados    → /arquivados  (selo com a quantidade)
            │   ├── Novo hábito   (botão principal; abre HabitDialog; data-action="new")
            │   ├── Conta         → /conta       (só barra inferior)
            │   └── Cartão da conta: Avatar + nome + e-mail, "Trocar senha", "Sair" (só lateral)
            ├── main (rota atual)
            │   ├── /           WeekPage: cabeçalho fixo (WeekNav + modo), WeekSummary, HabitList + WeekGrid
            │   ├── /arquivados ArchivedPage: lista com Restaurar / Excluir definitivamente, estado vazio
            │   └── /conta      AccountPage: Avatar grande, nome, e-mail, Trocar senha, Sair
            └── HabitDialog e ChangePasswordDialog (abertos de qualquer rota)
Rota desconhecida → replaceState para "/"
```

- **Entrar/Criar conta**: `AuthLayout` em duas colunas no `lg` — painel de marca à esquerda
  (degradê `brand-700 → brand-950`, logo em branco, frase "Construa seus hábitos, um bloco
  de cada vez." e blocos decorativos) e formulário à direita em cartão; uma coluna abaixo.
- **Linha do hábito** (Untitled UI): alça de arrastar (`GripVertical`), emoji em quadrado
  `brand-50`, nome, `GoalBar` + selo de meta (`Badge`: "2/4" em azul; "Meta atingida ✓" em
  verde), ações ↑ ↓ (`ChevronUp/Down`) e editar (`Pencil`) como botões fantasma.
- **Grade**: checkboxes nativos com `appearance-none`, 44 px (40 px em `< 640`), cantos
  `md`, marcado = `brand-600` com ícone de check em SVG de fundo; hoje = coluna com fundo
  `brand-50` e rótulo em `brand-700`.
- **Mensagens**: o aviso global (`app-message`) vira um `Alert` (cartão com ícone) mantendo
  `role="status"` e o botão "Fechar aviso".

## Arquivos afetados

```
web/package.json, package-lock.json   # 6 dependências novas (fixas)
web/vite.config.ts                    # plugin @tailwindcss/vite; alias "@/" → src
web/tsconfig.json                     # paths "@/*"
web/index.html                        # Inter 400–700; favicon.svg; apple-touch-icon; theme-color #2563EB
web/public/                           # logo.svg (nova), favicon.svg, apple-touch-icon.png; sai a logo antiga
web/src/index.css                     # NOVO: @import "tailwindcss", @theme (tokens), base, keyframes
web/src/styles.css                    # REMOVIDO ao final (substituído por index.css + classes)
web/src/lib/cn.ts                     # NOVO: cn() = twMerge(clsx())
web/src/lib/initials.ts (+ .test.ts)  # NOVO: iniciais do nome para o avatar
web/src/router.tsx (+ .test.tsx)      # NOVO: useRoute, navigate, <Link> (P5)
web/src/components/ui/                # NOVOS: button, input, label, select, card, badge, avatar, dialog, alert
web/src/components/Logo.tsx           # NOVO: ícone SVG + "Habits"; variantes icon/full/inverted
web/src/components/AuthLayout.tsx     # NOVO: painel de marca + formulário
web/src/shell/AppShell.tsx (+ test)   # NOVO: estado da semana, useHabits, nav, rotas, diálogos (sai de HomePage)
web/src/shell/AppNav.tsx              # NOVO: navegação única (P7)
web/src/pages/WeekPage.tsx            # NOVO: conteúdo da antiga HomePage
web/src/pages/ArchivedPage.tsx (+ test)  # NOVO: conteúdo do ArchivedDialog como tela
web/src/pages/AccountPage.tsx         # NOVO
web/src/App.tsx                       # AuthProvider + rotas; após logout navega para "/"
web/src/auth/{Login,Register}Page.tsx, ChangePasswordDialog.tsx   # AuthLayout + componentes ui
web/src/common/Modal.tsx              # passa a ser a base do components/ui/dialog (mesmo <dialog>)
web/src/habits/{HabitList,HabitDialog}.tsx  # componentes ui + ícones; sai o botão "Arquivados (n)" da lista
web/src/week/{WeekGrid,WeekNav}.tsx   # novos estilos; mantêm .days, .day.today, aria-*
web/src/goals/{GoalBar,WeekSummary}.tsx     # Card, Badge, barra azul/verde
web/src/home/                         # REMOVIDA (HomePage → shell + WeekPage; UserMenu → AppNav/AccountPage)
web/src/habits/ArchivedDialog.tsx     # REMOVIDO (vira ArchivedPage)
README.md, preview.png                # nova captura de tela
.specify/memory/constitution.md       # linha "Fontes": Inter 400–700 (PATCH 2.1.1)
```

Preservar o que o código usa em tempo de execução: `.days` e `.day.today` (rolagem até
hoje e teste), `[data-id]`, `[data-action="up|down|new|edit"]`, `.habit-move` e as classes
`dragging`, `drop-before`, `drop-after` do arrastar (estilizadas no `index.css`).

## Fluxo

- **Navegar**: clique em `<Link to="/arquivados">` → `history.pushState` + evento interno →
  `useRoute` re-renderiza o `main` do shell; o shell (e `offset`) não desmonta. Voltar do
  navegador → `popstate` → mesma atualização. Foco vai para o `<h1>` da nova tela.
- **Favorito/link sem sessão**: `App` mostra Entrar sem mudar a URL; após o login o shell
  lê `location.pathname` e abre Arquivados.
- **Novo hábito** de qualquer rota: abre `HabitDialog` no shell; ao salvar, `mutate`
  recarrega e a lista da Semana já aparece atualizada ao voltar.
- **Restaurar em Arquivados**: `mutate(api.habits.restore)` → `habits` do shell muda → o
  hábito volta à Semana com marcações e meta (vêm da API como hoje).

## Testes

| Teste | O quê |
|-------|-------|
| `router.test.tsx` (novo) | `navigate` muda a rota; `popstate` volta; rota desconhecida cai em `/`; `<Link>` ativo tem `aria-current="page"` |
| `initials.test.ts` (novo) | "Ana" → "A"; "Ana Maria Souza" → "AS"; acentos ("Érica Lima" → "ÉL"); espaços extras; vazio |
| `AppShell.test.tsx` (novo) | Ir a Arquivados e voltar mantém a semana anterior exibida; "Novo hábito" abre o diálogo em qualquer rota |
| `ArchivedPage.test.tsx` (novo) | Lista, Restaurar desabilitado no limite, estado vazio com explicação |
| `auth.test.tsx` (ajuste) | Continua encontrando "Sair", "Ana" e "Crie seu primeiro hábito" uma única vez (P7); login em `/arquivados` abre Arquivados |
| Atuais | `WeekGrid`, `HabitDialog`, `WeekSummary`, `progress`, `dates`, `rules` sem mudança de asserção |

---

## Ajustes durante a implementação

| Ajuste | Motivo |
|--------|--------|
| `styles.css` antigo importado pelo `index.css` como `@import "./styles.css" layer(legacy)`, com a ordem `theme, base, legacy, components, utilities` | Sem camada, o CSS antigo (seletores globais de `button`, `dialog`, `input`) venceria os utilitários dos componentes novos durante a migração; na camada `legacy` ele vence só o reset do Tailwind e o app segue usável até a T031 |
| Alias `@` → `"/src"` no Vite (em vez de `fileURLToPath`) | O projeto não tem `@types/node`; `/src` é relativo à raiz do Vite e funciona no build e no Vitest |
| `tailwindcss` e `@tailwindcss/vite` em `devDependencies` | São ferramentas de build, como o `vite`; os outros 4 pacotes vão para o bundle |
| As 3 `<img src="/logo.svg">` antigas trocadas já na Fase 1 por `<Logo inverted />` | O `logo.svg` novo tem o nome em azul-marinho e sumiria no fundo escuro que ainda vale até a Fase 3/4 |
| Componentes ui marcados com `data-slot` (convenção do shadcn) e as regras globais antigas de `button` e `dialog` no `styles.css` restritas a `:not([data-slot])` | Na camada `legacy`, `button { padding; border }` ainda alcançava propriedades que os utilitários não definem (ex.: borda violeta no botão principal) |
| Fundo `slate-50` só no `<main>` de Arquivados e Conta enquanto a Semana usa o visual antigo; a condição sai na Fase 3 | As telas novas são claras e ficariam com título azul-escuro sobre o fundo escuro antigo |
| Sem regra base de cor para `h1`–`h3` no `index.css` | Na camada `base` ela pintava de azul-escuro os títulos das telas antigas; os componentes novos já definem `text-ink` |
| "Novo hábito" e "Arquivados (n)" saíram da `HabitList` (ficaram só na navegação); a lista mantém "Crie seu primeiro hábito" | Evita dois botões "Novo hábito" na mesma tela (P7) |
| Contagem de arquivados no link: selo visual `aria-hidden` + texto acessível " (n)" | Um selo aparece sobre o ícone no celular e outro à direita no menu lateral; o leitor de tela ouve "Arquivados (2)" uma vez |
| Na Fase 3, o `styles.css` encolheu para só o que as telas de entrar/criar conta usam (as seções de cabeçalho, grade, metas, diálogos e arquivados foram apagadas junto com a migração de cada componente), e o fundo claro passou para o `AppShell` inteiro | Regras antigas de classe (`.habit`, `.days`, `input[type=checkbox]`) continuariam vencendo propriedades não definidas pelos utilitários; o corpo da página segue escuro só para as telas de entrada até a Fase 4 |
| Checkbox da grade e estados de arrastar como classes em `@layer components` do `index.css` (`.habit-check`, `.habit.dragging`, `.drop-before/after`) | O ícone de "marcado" é um SVG em `background-image` e as classes de arrastar são trocadas por `classList`; ficam mais legíveis como CSS do que como utilitários arbitrários |
| Linhas com altura fixa (cabeçalho `h-14`, linhas `h-16`) nas duas colunas | Substitui o `margin-top: 76px` antigo; lista e grade ficam alinhadas por construção |
| O selo "Meta atingida" mostra o texto só quando a coluna do nome tem ≥ 9rem (*container query* `@container` / `@[9rem]:inline`); abaixo disso, só o ícone ✓. A coluna de hábitos ganhou `xl:w-80` | Com `sm:inline`, entre 1024 e 1440 px o selo transbordava por cima das setas ↑/↓ (visto na captura do README). O texto completo continua no `aria-valuetext` da barra |
| Componente `Loading` (spinner `motion-safe` + "Carregando…" em `role="status"`) | Mesmo padrão no carregamento inicial e na Semana |
| Animação de encaixe só na caixa que a pessoa acabou de marcar (estado `justChecked` na `WeekGrid`), e não via `.habit-check:checked` | Pelo CSS, todas as caixas já marcadas "pulariam" ao abrir a página e a cada troca de semana |
| T028 sem mudança de código: o diálogo já usava `open:motion-safe:animate-dialog-in` e cada `transition-*` já vinha com `motion-reduce:transition-none` | Conferido no CSS publicado: as três animações ficam dentro de `prefers-reduced-motion: no-preference` |
| Estado vazio de Arquivados fala em "lápis de edição" (não "Editar"), e o botão de lápis ganhou `title="Editar"` | Na Semana o botão é só um ícone; o nome "Editar" fica no `aria-label` |
| Com a T031, o `index.css` ficou só com `@import "tailwindcss"` (sem camada `legacy`); `data-slot` foi mantido nos componentes | `data-slot` é a convenção do shadcn e ajuda a identificar os componentes no DOM |
| `preview.png` do README refeito com uma conta de demonstração local (e-mail trocado na captura por um de exemplo) | A conta de teste tinha um hábito só; a imagem mostra metas em andamento, meta atingida e o resumo |

---

## Complexity Tracking

Nenhuma violação. As dependências novas são permitidas pelo Princípio II com justificativa
(P1–P4) e versão fixa.
