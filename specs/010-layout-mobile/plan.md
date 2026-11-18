# Plano de Implementação: Layout mobile — semana inteira na tela e app em tela cheia

**Branch**: `010-layout-mobile` | **Data**: 2026-11-17 | **Spec**: [spec.md](./spec.md)
**Status**: Aprovado em 2026-11-17 <!-- Rascunho | Aprovado --> | **Tarefas**: [tasks.md](./tasks.md)

> Pré-requisito: a `spec.md` deve estar com status **Aprovada** (reaprovada em 2026-11-17,
> com a RF-014).
> Este documento descreve **como** a spec será atendida.

---

## Resumo

No celular, a Semana passa a ser renderizada por um componente próprio, a **lista empilhada**
(`HabitRows`). Ela tem uma faixa de dias fixa no topo e, para cada hábito, uma linha com o
nome e, embaixo, 7 colunas de marcações que dividem a largura da tela. Assim os 7 dias cabem
de 320 a 430px, sem rolagem horizontal. A escolha entre a lista empilhada e o layout atual
(`HabitList` + `WeekGrid`) é feita por um hook de *media query*, e só um dos dois existe no
DOM por vez. Com isso o desktop fica idêntico por construção. A lógica de arrastar e a
marcação de dia passam a ser compartilhadas pelos dois layouts. Para o app "ocupar a tela":

- os campos usam 16px em telas de toque, o que acaba com o zoom automático do iPhone;
- entra um manifesto de app (`display: standalone`) com ícones, para abrir em tela cheia;
- a `viewport` passa a cobrir as áreas seguras;
- o cookie de sessão ganha `Max-Age` de 7 dias (RF-014), a única mudança na API.

## Contexto técnico

| Item | Valor |
|------|-------|
| Stack | A mesma (React 19.3.1 + TS 5.9.3, Vite 7.3.7, Tailwind 4.3.3, Vitest 5.0.5; Spring Boot 3.5) |
| Dependências novas | Nenhuma (sem service worker, sem plugin de PWA) |
| Persistência | Nenhuma mudança de esquema; sem migração |
| API | Só configuração: `server.servlet.session.cookie.max-age: 7d` (RF-014) |
| Arquivos estáticos novos | `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` em `web/public/` |
| Celulares-alvo | iPhone (Safari e app da tela inicial) e Android (Chrome e app instalado) |
| Riscos | Alinhamento da faixa de dias com as colunas (resolvido usando a mesma grade de 7 colunas nas duas); `position: sticky` não funciona dentro de ancestral com `overflow` diferente de `visible` (o `Card` da lista empilhada não pode ter `overflow-hidden`); `matchMedia` não existe no jsdom (o hook precisa de um valor padrão para os testes atuais seguirem iguais); tipo MIME do manifesto no Nginx; iOS guarda os cookies do app da tela inicial separados do Safari |

---

## Constitution Check (2.1.1)

| Princípio | Conforme? | Observação |
|-----------|-----------|------------|
| I. Spec antes do código | ✅ | Spec reaprovada em 2026-11-17, com a RF-014 |
| II. Stack oficial | ✅ | Nenhuma dependência nova; manifesto e ícones são arquivos estáticos; nada de service worker (offline está fora de escopo) |
| III. Dados isolados por usuário | ✅ | Nenhuma rota, consulta ou migração nova; `IsolationIT` não muda |
| IV. pt-BR e acessível | ✅ | Pinça liberada (sem `maximum-scale`/`user-scalable=no`); área de toque ≥ 44×44px; nomes acessíveis das marcações iguais aos de hoje; ↑/↓ alcançáveis por teclado e visíveis com foco; contrastes do design system da 009 mantidos; nenhuma animação nova |
| V. Responsivo | ✅ | Breakpoint evolui de forma documentada (P2): lista empilhada quando a largura é < 640px **ou** a altura é < 500px (celular deitado); de 640px em diante, o layout atual da 009 (`sm` 640 / `lg` 1024) |
| VI. Verificação | ✅ | Testes Vitest novos (hook, lista empilhada, Semana no celular) e teste de integração da API para o cookie; checklist manual no `tasks.md` em iPhone e Android reais |
| VII. Segurança | ✅ | Cookie continua `HttpOnly`, `SameSite=Lax` e `Secure` em produção; `Max-Age` igual ao `timeout` da sessão no servidor (7 dias); "Sair" continua invalidando a sessão e apagando o cookie (`Max-Age=0`) |

---

## Pesquisa e decisões

| # | Decisão | Alternativas | Motivo |
|---|---------|--------------|--------|
| P1 | **Dois layouts, um de cada vez no DOM**: `WeekPage` usa `useMobileLayout()` e renderiza `HabitRows` (celular) **ou** `HabitList` + `WeekGrid` (como hoje) | (a) Mudar o desktop para a mesma grade por linha; (b) `display: contents` + `grid-row` calculado para intercalar as duas árvores atuais; (c) renderizar os dois layouts e esconder um por CSS | (a) arrisca a CS-006 (desktop idêntico) e mexe na rolagem horizontal do tablet; (b) é engenhoso demais (Princípio II) e quebra a coluna "hoje" e o `scrollToToday`; (c) duplica checkboxes e botões no DOM, a mesma lição da 009/P7 (leitor de tela e `getByRole`) |
| P2 | Lista empilhada quando `(max-width: 639px), (max-height: 499px)` | Só largura < 640px; `pointer: coarse` | Um celular deitado tem 667–932px de largura, mas menos de 500px de altura. Com o layout de tablet, os dias voltariam a rolar dentro da área (caso de borda "celular na horizontal"). `pointer: coarse` pegaria tablets e notebooks com toque, e o usuário pediu "só o celular" |
| P3 | Hook `useMobileLayout` com `useSyncExternalStore` sobre `matchMedia`; sem `matchMedia` (jsdom), retorna `false` | Estado + `useEffect` com `resize` | Lê o valor certo já no primeiro render (sem piscar o layout errado) e atualiza ao girar o celular; o padrão `false` mantém os testes atuais exercitando o layout de desktop, sem mudança |
| P4 | Grade de **7 colunas iguais** (`grid-cols-7`) na faixa de dias e em cada linha de marcações; o card ocupa a largura toda (`px-3` na página, `px-2` no card) | Colunas de largura fixa | Em 360px sobram 320px → 45,7px por coluna; em 320px, 40px (ainda sem rolagem). As colunas da faixa e das linhas têm a mesma largura por construção, então ficam alinhadas |
| P5 | Marcação: o `<input type="checkbox">` nativo fica com **32px** visíveis (`size-8`) dentro de um `<label>` que ocupa a célula inteira (largura da coluna × 44px de altura). Tocar em qualquer ponto da célula marca | Checkbox de 44px; aumentar só o *padding* | O `<label>` repassa o toque ao input sem JS e não muda o nome acessível (o `aria-label` do input vence). As células são vizinhas sem sobreposição; abaixo de 352px a largura da célula fica < 44px (fora da faixa da spec, aceito no caso de borda < 360px) |
| P6 | Componente **`DayCheck`** compartilhado (input + `aria-label` + animação de encaixe só na caixa recém-marcada); o estado `justChecked` continua no componente pai | Copiar o JSX da `WeekGrid` | Mesmo nome acessível e mesmo comportamento nos dois layouts; a `WeekGrid` passa a usá-lo sem mudar seu DOM |
| P7 | Lógica de arrastar e de mover por ↑/↓ extraída da `HabitList` para o hook **`useReorder`**, usado pela `HabitList` e pela `HabitRows`; continua usando as classes `habit`, `dragging`, `drop-before`, `drop-after`, `[data-id]`, `[data-action]` e `.habit-move` | Duplicar a lógica | O código atual já é genérico (mede `li` pelo `getBoundingClientRect`); só muda de lugar. Na lista empilhada o `li` arrastado leva junto as marcações, o que fica natural |
| P8 | Linha do nome no celular: alça, `HabitLabel` (emoji, nome com reticências, barra de meta e selo) e editar. Os botões ↑/↓ continuam no DOM com `not-focus-within:sr-only` no contêiner `.habit-move` | Remover ↑/↓ no celular; mover para o diálogo de edição | Cumpre a US4: somem da vista, mas o Tab e o leitor de tela os alcançam e eles aparecem enquanto têm o foco. `HabitLabel` é extraído da `HabitList` e reaproveitado (mesma barra acessível `GoalBar`) |
| P9 | Faixa de dias `sticky top-0` com fundo branco, mostrando dia da semana ("ter") e **dia do mês** ("28"); hoje com fundo `brand-50` e texto `brand-700`; na coluna de hoje, as caixas desmarcadas têm borda `brand-500` (regra CSS atual generalizada para `[data-today]`) | Repetir DD/MM | "28/10" não cabe com folga em 40px; a data completa continua no nome acessível de cada marcação ("Ler em 28/10") e no período da navegação |
| P10 | Topo compacto, via props `compact` em `WeekNav` e `WeekSummary` (o desktop não recebe a prop, então não muda). **Cabeçalho**: linha 1 com "Semana" (`text-xl`) à esquerda e ‹ período › à direita; linha 2 com o controle "Últimos 7 dias / Dom–Sáb" em `text-xs`; `py-2`. **Resumo**: `p-3`, sem o ícone; "Resumo da semana · Até agora" e o percentual (`text-xl`) na mesma linha, o rótulo embaixo e a barra | Esconder o título; juntar a navegação de semanas com a faixa de dias | O título é o alvo do foco ao trocar de tela (spec 009); setas junto da faixa roubariam largura das colunas. Mantém todos os textos atuais |
| P11 | Campos com **16px em telas de toque**: `fieldClasses` troca `text-sm` por `text-base pointer-fine:text-sm` | `maximum-scale=1` na `viewport`; `text-base sm:text-sm` | O Safari só amplia ao focar campos com menos de 16px. Bloquear o zoom violaria o Princípio IV (pinça) e, por largura, um celular deitado (> 640px) voltaria a ampliar. Com mouse (`pointer: fine`), o desktop fica igual |
| P12 | `viewport` com `viewport-fit=cover` e espaçamento pelas áreas seguras: a barra inferior já usa `env(safe-area-inset-bottom)` (hoje sem efeito, porque falta o `cover`); o `AppShell` ganha `pl/pr-[env(safe-area-inset-left/right)]` e `pb-[calc(6rem+env(safe-area-inset-bottom))]` | Sem `cover` | Sem `cover`, o `env()` vale 0 e, deitado, o entalhe corta o conteúdo; o último hábito não pode ficar sob a barra inferior |
| P13 | **Manifesto** `manifest.webmanifest`: `name`/`short_name` "Habits", `lang` "pt-BR", `start_url` e `scope` "/", `display` "standalone", `theme_color` `#2563eb`, `background_color` `#f8fafc`, ícones 192, 512 e 512 *maskable*. No `index.html`: `<link rel="manifest">`, `apple-mobile-web-app-title` "Habits", `mobile-web-app-capable` e `apple-mobile-web-app-capable` "yes", `apple-mobile-web-app-status-bar-style` "default" | `display: fullscreen`; status bar `black-translucent` | `standalone` é o que tira a barra do navegador nos dois sistemas e mantém o relógio e a bateria. Com `default`, o iOS não desenha o conteúdo sob a barra de status, então a faixa de dias fixa em `top-0` não fica escondida. Sem service worker, o Chrome atual já instala (e o offline está fora de escopo) |
| P14 | Ícones PNG gerados uma vez a partir de `favicon.svg`, com renderização pelo Edge sem interface (mesmo método da `apple-touch-icon` na 009): 192 e 512 com fundo branco; o *maskable* com a logo em 60% do quadro sobre fundo branco (zona segura) | Gerar no build | Arquivos estáticos simples, sem dependência nova |
| P15 | Nginx: `location = /manifest.webmanifest { types { } default_type application/manifest+json; }` | Confiar no `mime.types` da imagem | Garante o tipo certo independente da versão do Nginx; o `try_files` atual já serve os PNGs |
| P16 | **RF-014**: `server.servlet.session.cookie.max-age: 7d` no `application.yml` (o Spring Boot repassa ao `CookieSerializer` do Spring Session) | Lembrar login com token próprio; `Max-Age` maior que o `timeout` | Uma linha de configuração; o cookie vence 7 dias após a entrada, igual ao `timeout` de inatividade já usado no servidor. "Sair" invalida a sessão e o Spring Session devolve o cookie com `Max-Age=0` |

---

## Layout no celular (360 × 800, como referência)

```
┌──────────────────────────────────────┐
│ Semana            ‹  20/10 – 26/10  ›│  cabeçalho compacto (P10), ~90px, rola com a página
│            [Últimos 7 dias|Dom–Sáb]  │
├──────────────────────────────────────┤
│ ┌ Resumo da semana · Até agora  67% ┐│  resumo compacto, ~76px
│ │ 4 de 6 metas no caminho           ││
│ └ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬───────────── ┘│
│ ┌──────────────────────────────────┐ │
│ │ dom seg ter qua qui sex  sáb     │ │  faixa fixa (sticky), 40px; hoje em brand-50
│ │ 20  21  22  23  24  25  [26]     │ │
│ ├──────────────────────────────────┤ │
│ │ ⠿ 📚 Ler 20 páginas         ✎   │ │  linha do nome (alça, HabitLabel, editar)
│ │      ▬▬▬▬── 2/4                  │ │  barra de meta + selo
│ │ ☐   ☑   ☐   ☑   ☐   ☐   ☐       │ │  7 células de 45×44px, caixa de 32px
│ ├──────────────────────────────────┤ │
│ │ …                                │ │
└──────────────────────────────────────┘
│  Semana  Arquivados  (+)Novo  Conta  │  barra inferior (já existe) + área segura
```

Orçamento de altura para a **CS-004** (390×844 em tela cheia: 47px de barra de status e
~92px de barra inferior com a área segura → 705px úteis): cabeçalho 90 + espaços 24 +
resumo 76 + faixa 40 + 5 linhas × ~86 (nome e meta 30 + marcações 44 + respiro 12) = 660px. O
orçamento é conferido na verificação.

## Arquivos afetados

```
web/index.html                         # viewport-fit=cover; link do manifesto; metas apple-*/mobile-web-app-*
web/public/manifest.webmanifest        # NOVO (P13)
web/public/icon-192.png, icon-512.png, icon-maskable-512.png   # NOVOS (P14)
web/nginx.conf                         # tipo MIME do manifesto (P15)
web/src/index.css                      # regra de "hoje" generalizada para [data-today] (P9)
web/src/lib/useMobileLayout.ts (+ .test.ts)   # NOVO: hook de media query (P2, P3)
web/src/components/ui/input.tsx        # fieldClasses: text-base pointer-fine:text-sm (P11)
web/src/shell/AppShell.tsx             # áreas seguras e espaço da barra inferior (P12)
web/src/pages/WeekPage.tsx             # escolhe o layout; cabeçalho compacto; Card sem overflow-hidden no celular
web/src/week/DayCheck.tsx              # NOVO: marcação compartilhada (P5, P6)
web/src/week/WeekGrid.tsx              # passa a usar DayCheck (DOM e classes iguais)
web/src/week/WeekNav.tsx               # prop compact (P10)
web/src/goals/WeekSummary.tsx          # prop compact (P10)
web/src/habits/useReorder.ts           # NOVO: arrastar + ↑/↓ + foco, extraído da HabitList (P7)
web/src/habits/HabitLabel.tsx          # NOVO: emoji, nome, barra e selo de meta, extraído da HabitList (P8)
web/src/habits/HabitList.tsx           # usa useReorder e HabitLabel (DOM igual)
web/src/habits/HabitRows.tsx (+ .test.tsx)    # NOVO: lista empilhada do celular (P4, P5, P8, P9)
web/src/pages/WeekPage.test.tsx        # NOVO: Semana no celular (matchMedia simulado)
api/src/main/resources/application.yml # server.servlet.session.cookie.max-age: 7d (P16)
api/src/test/java/br/com/habits/auth/CsrfFlowIT.java   # SESSION com Max-Age=604800; logout com Max-Age=0
docs/deploy.md                         # nota: no iPhone, recriar o atalho para abrir em tela cheia
```

Preservar o que o código usa em tempo de execução, no layout de desktop: `.days` e
`.day.today` (`scrollToToday` e teste), `[data-id]`, `[data-action="up|down|edit"]`,
`.habit-move`, `.habit` e as classes de arrastar. A `HabitRows` não usa `.days`, então o
`scrollToToday` não encontra o contêiner no celular e não faz nada (não há o que rolar).

## Fluxo

- **Abrir a Semana**: `WeekPage` lê `useMobileLayout()`. Se `true`: cabeçalho e resumo
  compactos, depois `<Card>` (sem `overflow-hidden`) com `HabitRows`. Se `false`: o JSX atual,
  sem mudança.
- **Girar o celular / redimensionar**: o `matchMedia` dispara `change`, o hook atualiza e
  o React troca de layout. O estado (semana, marcações) mora no `AppShell` e não se perde.
- **Marcar um dia**: toque na célula → o `<label>` aciona o input → `DayCheck` chama
  `onToggle(habit.id, day, checked)`, o mesmo caminho de hoje (`useHabits.toggle`).
- **Reordenar**: alça → `useReorder` (pointer events, igual a hoje) → `onMove`; ou Tab até
  ↑/↓ → `.habit-move` sai de `sr-only` enquanto tem o foco → `onMove` e o foco volta ao
  botão (`useLayoutEffect` atual, agora dentro do hook).
- **Instalar**: Safari → Compartilhar → "Adicionar à Tela de Início" (lê
  `apple-touch-icon`, `apple-mobile-web-app-title` e o manifesto); Chrome → "Instalar app"
  (manifesto + ícones 192/512). Aberto pelo ícone: `standalone`, `start_url` "/".
- **Login no app da tela inicial**: entrar → `Set-Cookie: SESSION=…; Max-Age=604800;
  HttpOnly; SameSite=Lax; Secure` → fechar e reabrir mantém o cookie por 7 dias desde a
  entrada; "Sair" → `Max-Age=0`.

## Testes

| Teste | O quê |
|-------|-------|
| `useMobileLayout.test.ts` (novo) | Sem `matchMedia` retorna `false`; com `matches: true` retorna `true`; evento `change` atualiza o valor |
| `HabitRows.test.tsx` (novo) | Em cada hábito, o nome vem antes das 7 marcações na ordem do DOM; nomes acessíveis iguais aos da `WeekGrid` ("Ler em 28/10", "(dia futuro)", "(somente consulta)"); tocar chama `onToggle`; faixa com `aria-current="date"` em hoje; ↑/↓ e "Editar" presentes uma vez por hábito e funcionando; só a caixa recém-marcada anima; estado vazio "Crie seu primeiro hábito" |
| `WeekPage.test.tsx` (novo) | Com `matchMedia` simulado como celular: renderiza a lista empilhada e não a `WeekGrid` (sem `.days`), sem botões ou checkboxes duplicados; resumo e navegação de semanas continuam funcionando |
| `CsrfFlowIT` (ajuste + caso novo) | `Set-Cookie` do `SESSION` no cadastro contém `Max-Age=604800` além de `HttpOnly` e `SameSite=Lax`; novo caso: logout devolve `SESSION` com `Max-Age=0` |
| Atuais | `WeekGrid`, `HabitDialog`, `WeekSummary`, `AppShell`, `ArchivedPage`, `auth`, `router`, `progress`, `dates`, `rules`: sem mudança de asserção (o hook devolve `false` no jsdom) |

Verificação manual (vai para o checklist do `tasks.md`), no navegador embutido em
360/375/390/414/430px e em iPhone e Android reais pelo endereço de produção depois do deploy:

- `document.documentElement.scrollWidth <= innerWidth` em todas as telas e diálogos;
- focar os campos de entrar, criar conta e dos diálogos no iPhone sem mudar o zoom;
- a pinça continua ampliando;
- instalar e abrir em tela cheia nos dois sistemas e conferir as áreas seguras, também com o
  celular deitado;
- fechar e reabrir o app continua logado; "Sair" pede login;
- contar os hábitos visíveis em 390×844 (CS-004);
- comparar uma captura do desktop antes e depois (CS-006);
- regressão da spec 001.

---

## Revisão 2 (2026-11-17): segunda a domingo, topo fixo e destaque de hoje

**Status da revisão 2**: Aprovado em 2026-11-17, junto com a spec.

Atende a US5, a nova US3 (topo fixo) e as RF-003, RF-007, RF-007a, RF-011, RF-015 e RC-003.
Continua só no frontend: a API guarda `week_mode` só como preferência (as metas usam
`valid_from` e não dependem do início da semana), então nada muda em `api/`.

| # | Decisão | Alternativas | Motivo |
|---|---------|--------------|--------|
| P17 | `visibleDays(offset, today)` sem modo: semana ISO, início na segunda (`addDays(today, -((dia + 6) % 7) + 7 * offset)`). O `AppShell` deixa de ler `user.weekMode` e perde `changeMode`; sai `api.updateSettings`. O tipo `User.weekMode` continua (a API ainda o devolve) | Gravar `calendar` para todos; migração para trocar o check do banco | RC-003: a preferência antiga é só ignorada, sem escrita nem migração. Retirar `week_mode` da API e do banco vira o débito **D-01** (spec futura, com migração Flyway) |
| P18 | `WeekNav` só com ‹ período ›, sem o controle segmentado e sem as props de modo. O cabeçalho da `WeekPage` vira coluna: `h1` e, embaixo, a navegação, no celular e no desktop. No desktop o cabeçalho continua `sticky` (≥ 640px) | Manter o período à direita no desktop | Decisão do usuário: período embaixo do título nas duas telas |
| P19 | **Topo fixo no celular**: com altura ≥ 500px, um bloco `sticky top-0 z-20` com fundo `slate-50/95` + `backdrop-blur` contém o cabeçalho, o resumo compacto e a faixa de dias (a parte de cima do cartão da lista). O restante do cartão, com os hábitos, rola por baixo. A faixa sai da `HabitRows` para o componente `DayStrip`. Com altura < 500px (celular deitado), só a `DayStrip` fica fixa, como na revisão 1. Um hook genérico `useMediaQuery(query)` passa a ser a base do `useMobileLayout` | Lista como contêiner de rolagem próprio (`overflow-y-auto` com altura fixa); medir a altura do topo com `ResizeObserver` | A rolagem continua sendo a da página: o "puxar" do Safari e a barra inferior seguem funcionando, sem rolagem dentro de rolagem. Deitado, o topo (~240px) ocuparia quase toda a altura útil (~320px); o caso de borda pede que sobre espaço para ao menos um hábito |
| P20 | **Destaque de hoje**. Na faixa de dias (celular) e no cabeçalho da grade (desktop), o dia de hoje fica com `bg-brand-600` e texto branco (5,2:1). No celular, uma faixa `bg-brand-50` absoluta atrás da lista (`left = índice × 100/7 %`, largura `100/7 %`, `aria-hidden`) atravessa todos os hábitos, inclusive a linha do nome. As células de hoje deixam de ter fundo próprio e mantêm `data-today` (borda `brand-500` nas caixas vazias). No desktop, a coluna de hoje já tem fundo contínuo; muda só o cabeçalho | Número do dia dentro das caixas; fundo por célula (revisão 1) | Decisão do usuário: coluna contínua. A faixa usa a mesma grade de 7 colunas iguais, então fica alinhada por construção |
| P21 | Orçamento da CS-004 com o topo fixo em 390×797: cabeçalho ~84px (título 28 + navegação 36 + `py-2`), resumo 83px, faixa ~50px, espaços ~24px, ou seja, ~241px. Sobram 797 − 241 − 105 (barra inferior + área de gestos) = ~451px, e 5 hábitos × 84px = 420px | — | Conferido na verificação (T034) |

**Arquivos da revisão 2**

```
web/src/week/dates.ts (+ dates.test.ts)       # visibleDays(offset, today), segunda a domingo (P17)
web/src/lib/useMobileLayout.ts (+ test)        # useMediaQuery genérico; useMobileLayout usa-o (P19)
web/src/week/WeekNav.tsx                       # sem modo (P18)
web/src/week/DayStrip.tsx                      # NOVO: faixa de dias com hoje em destaque (P19, P20)
web/src/habits/HabitRows.tsx (+ test)          # sem a faixa; coluna de hoje contínua (P20)
web/src/week/WeekGrid.tsx (+ test)             # cabeçalho de hoje em brand-600 (P20)
web/src/pages/WeekPage.tsx (+ test)            # cabeçalho em coluna; bloco fixo no celular (P18, P19)
web/src/shell/AppShell.tsx                     # sem weekMode/changeMode (P17)
web/src/api/client.ts                          # sai updateSettings (P17)
testes que usam visibleDays("calendar"|"rolling", …)   # nova assinatura
```

---

## Revisão 3 (2026-11-17): edição só na semana atual e na anterior; hábitos na 1ª coluna

**Status da revisão 3**: Aprovado em 2026-11-17, junto com a spec.

Atende a História 6, a nova História 4 e as RF-001, RF-004, RF-006, RF-016, RF-017, RF-018 e
RC-004. Muda a API (regra da janela de edição), sem migração e sem rota nova.

| # | Decisão | Alternativas | Motivo |
|---|---------|--------------|--------|
| P22 | **API**: `EditableWindow.contains(day)` = não depois de hoje **e** não antes da segunda-feira da semana anterior (`today.with(previousOrSame(MONDAY)).minusWeeks(1)`), no fuso `America/Sao_Paulo` do `Clock` atual. A mensagem do `NOT_EDITABLE` passa a ser "Só é possível marcar dias da semana atual e da semana anterior." O código `NOT_EDITABLE` e o status 422 continuam | Calcular a janela no cliente e confiar nele | Princípio VII: o servidor valida a regra; o cliente só reflete. O código estável mantém o tratamento de erro do frontend |
| P23 | **Web**: `weekStart(day)` (segunda da semana) usado por `visibleDays` e por `isEditable(day, today)` = `day >= weekStart(today) − 7 dias && day <= today`. Sai `EDITABLE_DAYS`. `lockReason` mantém os textos "(dia futuro)" e "(somente consulta)" | — | Mesma regra nos dois lados, com um único cálculo de início de semana no cliente |
| P24 | **Linha do hábito no celular**: cada `li` vira uma grade `grid-cols-[5.25rem_repeat(7,minmax(0,1fr))]` (84px para o hábito e 7 colunas iguais). A `DayStrip` usa a mesma grade, com uma primeira célula vazia (`aria-hidden`), então fica alinhada por construção. 1ª célula: alça fina (12px) e um `<button>` "Editar {nome}" com o emoji (`size-7`) e o selo ao lado, e o nome embaixo em `text-xs` com `line-clamp-2` e `title`. A `GoalBar` fica `sr-only` fora do botão (um botão não expõe papéis internos ao leitor de tela). `.habit-move` com ↑/↓ fica sobreposta à linha (`absolute`) e `not-focus-within:sr-only`. Células de dia: `<label>` com `h-11` e `DayCheck` `size-7` (28px). Coluna de hoje: `left = calc(5.25rem + i × (100% − 5.25rem) / 7 + 2px)` | Manter o lápis visível; manter `HabitLabel` com mais uma variante | Decisões do usuário. O botão no lugar do lápis mantém o nome acessível "Editar {nome}" (os testes atuais continuam valendo) |
| P25 | `HabitLabel` perde a variante `inline` (sem uso); o selo vira o componente exportado `GoalBadge`, usado pela `HabitLabel` (desktop) e pela `HabitRows` | Duplicar o selo | Uma só definição de "X/N" e "Meta atingida" |
| P26 | Orçamento em 390×797: linha de ~72px com nome em 2 linhas (~57px com 1 linha); topo fixo de ~232px; 5 hábitos ≤ 360px → o 5º termina por volta de 600px, antes dos 693px da barra do iPhone (CS-004). Em 360px: 320 − 84 = 236px para 7 dias, ou seja, ~33,7px por dia (CS-005) | — | Conferido na T044 |

**Arquivos da revisão 3**

```
api/src/main/java/br/com/habits/check/EditableWindow.java   # regra nova (P22)
api/src/main/java/br/com/habits/check/CheckService.java     # mensagem do NOT_EDITABLE
api/src/test/java/br/com/habits/check/EditableWindowTest.java, CheckIT.java   # casos novos
web/src/week/dates.ts (+ test)                 # weekStart, isEditable (P23)
web/src/habits/HabitLabel.tsx                  # GoalBadge; sem inline (P25)
web/src/habits/HabitRows.tsx (+ test)          # linha em grade, 1ª coluna (P24)
web/src/week/DayStrip.tsx (+ test)             # 1ª célula vazia (P24)
web/src/week/WeekGrid.test.tsx, goals/progress.test.ts   # janela nova; metas de segunda a domingo (RF-018)
specs/004…, specs/005…/spec.md                 # nota: regra substituída pela 010 rev. 3
```

---

## Ajustes durante a implementação

| Ajuste | Motivo |
|--------|--------|
| Scripts de captura e comparação guardados em `capturas/` (`capturar.mjs`: conta de demonstração local + Edge sem interface via CDP; `diff.ps1`: diferença pixel a pixel) | A T025 precisa repetir exatamente as capturas da T001; na 009 o método ficou só descrito. A conta é local, com valores de teste |
| A CS-006 é avaliada por "diferença forte" (algum canal > 48) e não por pixels idênticos | Duas rodadas do mesmo build já diferem em ~200–530 px de antialiasing fraco. Depois da Fase 1, "antes × depois" deu o mesmo ruído e 0 px de diferença forte nas 4 larguras |
| `HabitLabel` devolve dois irmãos (fragmento): o quadrado do emoji e o bloco nome + meta | Assim fica direto na linha flex da `HabitList`, com o DOM igual ao de antes |
| `useReorder` devolve `listProps` (`ref` + handlers de ponteiro) para espalhar no `<ul>` | Mantém a `HabitList` e a futura `HabitRows` com o mesmo contrato, sem repetir os três handlers |
| No layout de celular, o cabeçalho da Semana nunca é `sticky` (antes era a partir de 640px) | Com o celular deitado (largura ≥ 640px) o cabeçalho fixo cobriria a faixa de dias, que também fica em `top-0` |
| Conteúdo da Semana no celular com `max-w-xl` (576px) centralizado | No celular deitado as 7 colunas ficariam largas demais (~115px); assim ficam com ~80px |
| Célula de hoje com fundo `brand-50` na lista do celular; só ela tem cantos arredondados | Mantém a "coluna de hoje" visível entre as linhas. Na T024 um toque a 2px do canto não marcava, porque o navegador ignora o toque fora da curva do `border-radius`; sem fundo, o arredondado não tinha função e foi tirado das demais células |
| Revisão 2: além do previsto, saiu `updateUser` do `AuthContext` (só o `changeMode` o usava). Os 4 testes que chamavam `visibleDays("calendar"/"rolling", …)` passaram a usar `visibleDays(offset, today)`; nos que usavam 25/10 (domingo, fora da semana de segunda a domingo de 28/10), a data virou 27/10 | P17 |
| Revisão 2: o `useMediaQuery` estabiliza o `subscribe` com `useCallback`, para o `useSyncExternalStore` não reassinar a media query a cada renderização | P19 |
| Revisão 2, medições: topo fixo com 232px em 390×797; o 5º hábito termina em 655px (barra do iPhone em 693px), então a CS-004 continua atendida. Com 10 hábitos, o topo não se move ao rolar (CS-008) | P21 |
| Revisão 3: abaixo de 360px a caixa cai para 24px (`max-[359px]:size-6`) | Em 320px a célula do dia tem 27,8px, menos que a caixa de 28px; fora da faixa 360–430px da spec, mas as caixas não podem encostar |
| Revisão 3: `EditableWindow.firstDay()` público (usado no teste); `DayStrip` exporta `WEEK_ROW_GRID` e `HABIT_COLUMN` para a `HabitRows` usar a mesma grade | P22, P24 |
| Revisão 3, medições: em 360px, coluna do hábito com 84px, célula do dia 33,4×44px, caixa de 28px; linhas de 62 a 77px; faixa, coluna de hoje e caixas alinhadas (±1px); em 390×797 o 5º hábito termina em 585px (barra do iPhone em 693px). API: segunda da semana anterior → 204; domingo de duas semanas atrás e amanhã → 422 com a mensagem nova | P26, CS-010 |
| Celular deitado, tablet e a troca de layout ao girar foram medidos com a página recarregada | Com o painel do navegador oculto, a página roda em segundo plano e não recebe `resize`/`change`; a troca ao vivo fica coberta pelo teste do `useMobileLayout` e pelo V-33 no celular real |
| Medido em 360px: célula 45,4×44px, caixa 32px, `scrollWidth` = largura em 320, 360, 375 e 430px; faixa de dias presa em `top: 0` ao rolar. Desktop (1280, 1024 e 768px) com **0 px** de diferença em relação às capturas da T001 | Fase 2 |
| Ícones gerados a partir do `logo-icone.svg` da 009 (com o bloco "encaixando"), e não do `favicon.svg`: logo em 66% do quadro (192 e 512) e 60% no *maskable*, fundo branco | É o mesmo desenho da `apple-touch-icon.png` atual; o `favicon.svg` é a versão simplificada para 16–32px |
| `description` do manifesto = frase do painel de marca da 009 ("Construa seus hábitos, um bloco de cada vez.") | Texto já aprovado, em pt-BR |
| Medido na Fase 3 (app local): `/manifest.webmanifest` com `Content-Type: application/manifest+json` e os cabeçalhos de segurança do servidor; ícones 200 `image/png`; login devolve `SESSION=…; Max-Age=604800; HttpOnly; SameSite=Lax`; campos com 16px em toque emulado e 14px com mouse; desktop com 0 px de diferença das capturas da T001 | Fase 3 |
| Na Fase 2, cada hábito ocupava 104px (a estimativa do orçamento da CS-004 era ~86px), porque a barra de meta e o selo ficavam numa linha própria embaixo do nome | Resolvido na Fase 4 (linhas abaixo) |
| **Linha do nome no celular (decisão do usuário em 2026-11-17)**: `HabitLabel` ganhou a prop `inline`. Nome e selo ("3/4" ou só o ✓) ficam numa linha; a `GoalBar` fica `sr-only` (o leitor de tela continua ouvindo "Ler: 3 de 4 dias") | Com o topo compacto, em 390×844 cabiam só 4 hábitos. Alternativas recusadas: barra curta na mesma linha (nome com ~14 letras em 360px) e manter a barra embaixo (mudaria a CS-004 para 4) |
| Linha do hábito no celular com `py-1`, alça `h-8` e botões (editar, ↑/↓) com 32px (`size-8`), iguais aos do desktop | Os 8px por linha que faltavam para o quinto hábito; as marcações continuam com área de toque de 44px |
| Resumo compacto: título; rótulo à esquerda e percentual (`text-xl leading-tight`) à direita; barra de 6px. `WeekNav` compacto com setas de 36px, período `min-w-24` e modo em `text-xs`; o modo quebra para a 2ª linha | P10 |
| Medido na Fase 4 em 390×797 (390×844 menos a barra de status de 47px): cabeçalho 93px, resumo 83px, cada hábito 84px; o 5º hábito termina em 678px e a barra inferior começa em 692px no iPhone (726px − 34px da área de gestos), então a **CS-004 passa** com 14px de folga. `scrollWidth` = 390. Desktop: 768px com 0 px de diferença; 1280 e 1024px com 12 e 8 px de antialiasing fraco nos selos e 0 px de diferença forte | Fase 4 |

---

## Complexity Tracking

Nenhuma violação. Os dois layouts da Semana (P1) são uma escolha consciente para manter o
desktop idêntico (RF-011/CS-006) sem duplicar elementos no DOM; o que é comum aos dois
(marcação, rótulo do hábito, arrastar) é extraído e compartilhado (P6–P8).
