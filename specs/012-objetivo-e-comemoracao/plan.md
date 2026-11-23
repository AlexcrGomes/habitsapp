# Plano de Implementação: Objetivo do hábito e comemoração ao bater a meta

**Branch**: `012-objetivo-e-comemoracao` | **Data**: 2026-11-23 | **Spec**: [spec.md](./spec.md)
**Status**: Aprovado em 2026-11-23 <!-- Rascunho | Aprovado --> | **Tarefas**: [tasks.md](./tasks.md)

> Pré-requisito: a `spec.md` deve estar com status **Aprovada** (aprovada em 2026-11-23).
> Este documento descreve **como** a spec será atendida.

---

## Resumo

**Objetivo**: uma coluna nova e opcional `objective varchar(60)` em `habits`, por migração
Flyway `V5`. A API recebe e devolve o campo junto com nome, emoji e meta nas rotas de hábito
que já existem e valida o tamanho. No diálogo, o objetivo ganha um campo de texto com contador.
No computador, aparece abaixo do nome na lista. No celular, tocar num hábito com objetivo abre
um balão com o objetivo e o botão "Editar".

**Comemoração**: é só visual, nada é gravado. Uma função pura do frontend compara a semana
exibida antes e depois da marcação e decide se ela **cruzou** a meta do hábito ou levou o resumo
a 100%. Nesse caso, um aviso de parabéns com confete feito em CSS aparece por cima da tela,
sem bloquear o toque, e some em 3,5 s. Não entra nenhuma dependência nova.

## Contexto técnico

| Item | Valor |
|------|-------|
| Stack | A atual: Spring Boot 3.5, PostgreSQL 17, React 19 + TS, Vite, Tailwind 4, Vitest |
| Dependências novas | **Nenhuma**: confete com CSS e elementos `<span>`; balão com React e CSS |
| Persistência | Migração nova `V5__habit_objective.sql`: só adiciona uma coluna anulável |
| Riscos | (1) Altura da linha no computador (h-16, alinhada à grade) com nome, objetivo e barra da meta; (2) toque no celular: o balão não pode atrapalhar arrastar, reordenar ou marcar; (3) marcação otimista que falha depois de a comemoração já ter aparecido |

---

## Constitution Check (2.1.1)

| Princípio | Conforme? | Observação |
|-----------|-----------|------------|
| I. Spec antes do código | ✅ | Spec aprovada em 2026-11-23 |
| II. Stack oficial | ✅ | Nenhuma dependência nova; confete e balão em CSS/React |
| III. Dados isolados por usuário | ✅ | O objetivo é coluna de `habits`, sempre lida e escrita pelo `findByIdAndUserId`; hábito de outro usuário → 404; migração nova, sem editar V1–V4; não é destrutiva (só `add column` anulável) |
| IV. pt-BR e acessível | ✅ | Campo com rótulo e contador; objetivo no nome acessível (`aria-describedby`); balão operável por teclado, com Esc e foco devolvido; comemoração em `role="status"` sem mover o foco; `motion-reduce` sem confete nem movimento; contraste AA (texto `slate-600` sobre branco) |
| V. Responsivo | ✅ | Breakpoint de 570px preservado: objetivo visível só fora do celular (`useMobileLayout`); balão e aviso cabem em 360px |
| VI. Verificação | ✅ | `HabitIT` (objetivo), caso novo em `IsolationIT`, testes Vitest de `celebrationRules.ts`, `HabitDialog`, `HabitRows`, `HabitLabel` e `Celebration`; checklist manual no `tasks.md` |
| VII. Segurança | ✅ | O servidor valida o tamanho; o texto é exibido como texto pelo React (sem HTML); nenhum segredo novo |

---

## Pesquisa e decisões

| # | Decisão | Alternativas | Motivo |
|---|---------|--------------|--------|
| P1 | Coluna `objective` em `habits`, sem histórico | Tabela com histórico, como `habit_goals` | A spec diz que o objetivo não tem histórico (entidade Hábito); uma coluna é o mais simples |
| P2 | Nulo no banco = sem objetivo; a API grava `trim()` e converte vazio em nulo | Guardar string vazia | Um único jeito de dizer "sem objetivo" (US1.6) |
| P3 | No `PATCH`, `objective` **ausente** mantém o valor atual; `""` ou `null` explícito remove | Ausente = remover, como nome/emoji/meta | Um navegador ainda na versão antiga (antes de atualizar, spec 011) que edita o hábito não pode apagar o objetivo sem o usuário pedir (RC-001). Para distinguir ausente de nulo, o corpo é lido como `JsonNode` só para esse campo |
| P4 | Limite de 60 contado em `String.length()` (Java) e `maxLength` (navegador) | Contar símbolos visíveis | Os dois lados contam igual (unidades UTF-16); emojis no texto contam 2, o que é aceitável |
| P5 | Comemoração decidida no **frontend**, comparando antes e depois da marcação | A API devolver "bateu a meta" na resposta da marcação | Aparece na hora, junto com a marcação otimista; usa as metas e marcações que o app já tem (como o resumo da spec 006); não grava nada |
| P6 | A comemoração aparece na marcação otimista e some se a API recusar | Esperar a resposta da API | Mais imediato; o caso de falha está na spec (casos de borda) e é raro |
| P7 | Aviso fixo com `pointer-events: none`, que fecha com qualquer `pointerdown`, Esc ou depois de 3,5 s | Diálogo modal com botão Fechar | Não bloqueia nem cobre o toque (RF-010); "tocar fora" fecha sem engolir o toque, que segue para o campo |
| P8 | Confete: 24 `<span>` com `@keyframes` (queda e giro, 1,2–1,8 s), cores do tema; semana perfeita = 48 peças, mais largo, com título maior | Biblioteca de confete (canvas-confetti) | Princípio II; o efeito é simples |
| P9 | Com `prefers-reduced-motion`, não há confete nem entrada animada: só o cartão parado (`motion-safe:`/`motion-reduce:` do Tailwind, como nas specs 009/010) | Desligar a comemoração inteira | A spec pede a mensagem sem movimento (US5.1) |
| P10 | Uma comemoração por vez, guardada num estado `celebration` do `AppShell`; a nova substitui a anterior e reinicia o tempo | Fila | Casos de borda: nunca empilhar |
| P11 | Balão (celular) como **disclosure**: o botão do hábito ganha `aria-expanded`/`aria-controls`; o balão abre logo abaixo do botão, dentro da linha, com o foco no botão "Editar" | Popover nativo (`popover` do HTML) ou `<dialog>` | Mais previsível no Safari do iOS e nos testes (jsdom); só um aberto por vez (estado em `HabitRows`) |
| P12 | Texto: "Parabéns! Você bateu a meta de {nome} {nesta semana \| na semana passada}." e, com objetivo, a linha "{objetivo} — {N} de {N} dias ✓" | Sem lembrar o objetivo | Atende a US3.9 e reforça o desafio do próprio usuário |
| P13 | "Semana passada" quando `offset === -1`; para outras semanas (não editáveis, spec 010) não há marcação, logo não há comemoração | Mostrar a data | Simples e de acordo com a regra de edição da spec 010 |

---

## Arquivos afetados

```
api/src/main/resources/db/migration/V5__habit_objective.sql   # nova coluna
api/src/main/java/br/com/habits/habit/
  Habit.java              # campo objective + get/set
  HabitController.java    # HabitRequest.objective (presente/ausente); HabitResponse.objective
  HabitService.java       # validateObjective; create/update gravam o objetivo
api/src/test/java/br/com/habits/
  habit/HabitIT.java      # criar, editar, remover, limite, trim, ausente no PATCH, restaurar
  IsolationIT.java        # PATCH com objetivo em hábito alheio → 404; GET não vaza objetivo

web/src/api/types.ts            # Habit.objective: string | null
web/src/api/client.ts           # objective em create/update
web/src/habits/rules.ts         # MAX_OBJECTIVE = 60; normalizeObjective
web/src/habits/HabitDialog.tsx  # campo "Objetivo (opcional)" com contador; onSave(..., objective)
web/src/habits/HabitLabel.tsx   # computador: linha do objetivo sob o nome (truncate + title)
web/src/habits/HabitRows.tsx    # celular: balão com objetivo e "Editar"; sem objetivo → edição direta
web/src/habits/ObjectivePopover.tsx  # balão (novo)
web/src/goals/celebrationRules.ts  # função pura celebrationFor (novo) + celebrationRules.test.ts
                                  # (não "celebration.ts": no Windows colide com Celebration.tsx)
web/src/goals/Celebration.tsx   # aviso com confete (novo) + Celebration.test.tsx
web/src/habits/useHabits.ts     # toggle devolve Promise<boolean> (salvou ou não)
web/src/shell/AppShell.tsx      # estado celebration; onToggle decide e mostra; onSave com objetivo
web/src/index.css               # keyframes confetti-fall e celebrate-in
web/src/habits/HabitDialog.test.tsx, HabitRows.test.tsx  # casos novos
```

## Modelo de dados

```sql
-- V5__habit_objective.sql
alter table habits add column objective varchar(60);
```

### Migração

Só adiciona a coluna, anulável e sem valor padrão. Hábitos existentes ficam com `objective`
nulo, ou seja, sem objetivo (RC-001). Nenhuma linha muda e não há conversão de dados.

## Contrato da API

| Rota | Mudança |
|------|---------|
| `POST /api/habits` | Corpo aceita `objective` (texto; ausente, `null` ou só espaços = sem objetivo) |
| `PATCH /api/habits/{id}` | `objective` presente substitui (`""`/`null` remove); **ausente mantém** (P3) |
| Todas as respostas de hábito (`GET`, `POST`, `PATCH`, archive, restore, order) | Ganham `objective`: texto ou `null` |

- Mais de 60 caracteres depois do `trim()` → 400 `VALIDATION`, `fields.objective` = "O objetivo
  deve ter no máximo 60 caracteres."
- Validação feita antes de gravar qualquer coisa (nome, meta e objetivo na mesma transação).

## Frontend

### Objetivo

- **`HabitDialog`**: entre "Emoji" e "Meta semanal", um `Input id="habit-objective"` com o rótulo
  "Objetivo (opcional)", `maxLength={60}`, placeholder "Ex.: ler pelo menos 10 páginas" e
  contador `n/60` (mesmo padrão do nome). `onSave(name, emoji, goal, objective)`.
- **`HabitLabel`** (computador): entre o nome e a barra, `<span class="truncate text-xs
  text-slate-600" title={objective}>`. Para caber em `h-16` (64px), o `gap-1.5` da coluna passa a
  `gap-0.5` quando há objetivo. O texto entra no nome acessível pelo `aria-describedby` do botão
  "Editar {nome}", apontando para o `<span>` do objetivo.
- **`HabitRows`** (celular): estado `openId: number | null`.
  - Hábito **sem** objetivo: o botão continua "Editar {nome}" e chama `onEdit` (como hoje).
  - Hábito **com** objetivo: o botão vira `aria-label="{nome}"`,
    `aria-describedby="objective-{id}"`, `aria-expanded` e `aria-controls="popover-{id}"`, e o
    toque alterna `openId`. O `ObjectivePopover` aparece dentro da `<li>`, logo abaixo do botão
    (`absolute`, `z-30`, largura até a da linha menos 8px), com o nome, o objetivo completo
    (quebra de linha, sem cortar) e o botão "Editar", que fecha o balão e chama `onEdit`.
  - Fecha com Esc, com toque fora (`pointerdown` no `document`, fora do balão e do botão) ou ao
    abrir outro balão. Ao fechar por Esc ou "fora", o foco volta ao botão do hábito.
  - Começar a arrastar (alça) ou marcar um dia fecha o balão sem engolir o gesto.
  - A descrição `objective-{id}` fica num `<span class="sr-only">` sempre presente: o leitor de
    tela ouve o objetivo sem abrir o balão (US2.10).

### Comemoração

- **`celebrationRules.ts`** (função pura, testada):

  ```ts
  type Celebration = { kind: "habit" | "week"; habit: Habit; done: number; goal: number };
  celebrationFor(habits, checksBefore, goals, days, habitId, day, checked): Celebration | null
  ```

  - `checked === false` → `null`.
  - `after` = `checksBefore` com `habitId@day` acrescentado.
  - `goal = goals.get(habitId)`; sem meta → `null`.
  - O hábito cruzou a meta se `doneBefore < goal && doneAfter >= goal`.
  - A semana cruzou 100% se `weekSummary(before).percent < 100` e `weekSummary(after).percent
    === 100`, com o mesmo `weekSummary` da spec 006, para bater com o resumo da tela.
  - Semana cruzou → `kind: "week"` (substitui a do hábito, US4.2); senão, hábito cruzou →
    `kind: "habit"`; senão `null`.
- **`AppShell`**: `onToggle` passa a ser:
  1. `const c = celebrationFor(active, checks, goals, days, habitId, day, checked)`;
  2. se `c`, faz `setCelebration({ ...c, id: Date.now(), lastWeek: offset === -1 })`;
  3. `const ok = await toggle(...)`; se `!ok` e a comemoração atual tem o mesmo `id`, apaga a
     comemoração (caso de borda: falha no servidor).
  - Ao trocar de semana (`offset`) ou de tela, a comemoração é apagada.
- **`Celebration.tsx`**: `<div role="status" aria-live="polite">` sempre montado (para o leitor de
  tela anunciar a troca), `fixed inset-x-0 z-50 pointer-events-none`.
  - Posição: no celular, acima da barra de navegação de baixo
    (`bottom-[calc(6.5rem+env(safe-area-inset-bottom))]`); fora dele, no topo
    (`top-6`, centralizado).
  - Cartão branco com sombra, ícone (🎉 para hábito, 🏆 para semana perfeita), título "Parabéns!" ou
    "Semana perfeita!" e a frase de P12. Semana: "Você bateu todas as metas {da semana | da
    semana passada}."
  - Confete: camada `absolute inset-0` com as peças em `motion-safe:animate-confetti-fall`, com
    posição horizontal, atraso (0–300ms), cor e giro variando pelo índice (determinístico, sem
    `Math.random`, para os testes). `motion-reduce:hidden`.
  - Entrada do cartão: `motion-safe:animate-celebrate-in` (escala 0,9 → 1, 200ms).
  - Fecha: `setTimeout` de 3500ms (CS-003 ≤ 4 s), `keydown` Esc e `pointerdown` no `document`
    (fase de captura, sem `preventDefault`), tudo limpo no `useEffect`.
  - Nenhum som; nenhum elemento pisca (só translação e rotação).
- **`index.css`**: `--animate-confetti-fall` (1,6s ease-in, `forwards`) e
  `--animate-celebrate-in` (200ms), com os `@keyframes` no bloco `@theme`, como `block-in`.

## Fluxo

Marcar um dia → `AppShell.onToggle` calcula `celebrationFor` com as marcações **antes** → mostra
o aviso (se houver) → `toggle` otimista muda `checks` → selo e barra da meta e resumo recalculam
→ a API grava. Se a API recusar, a marcação volta e o aviso some.

Salvar o diálogo com objetivo → `POST`/`PATCH` com `objective` → `mutate` recarrega os hábitos →
a lista mostra o objetivo (computador) ou o balão passa a abrir ao tocar (celular).

---

## Complexity Tracking

*Nenhuma violação da constituição.*

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|----------|----------------------|-------------------------------------------|
| — | — | — |
