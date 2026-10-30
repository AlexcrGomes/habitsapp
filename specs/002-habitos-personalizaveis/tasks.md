# Tarefas: Hábitos personalizáveis

**Branch**: `002-habitos-personalizaveis` | **Entradas**: [spec.md](./spec.md), [plan.md](./plan.md)

> Formato: `- [ ] T001 [P] [US1] Descrição — arquivo`
> - `[P]` = pode ser feita em paralelo (arquivos diferentes, sem dependência)
> - `[USn]` = história de usuário da spec atendida
> - Marque `[x]` ao concluir cada tarefa. Se algo não previsto surgir, pare e atualize
>   spec/plan antes de seguir.

Histórias da spec: **US1** criar · **US2** primeiro uso e dados atuais · **US3** dias sem
marcação · **US4** editar · **US5** arquivar/restaurar · **US6** excluir definitivamente ·
**US7** reordenar.

---

## Fase 1 — Preparação

- [x] T001 Criar a branch `002-habitos-personalizaveis` a partir da `main`
- [x] T002 Remover o `<script>` da NLWSetup; trocar `.habits` por `<ul class="habits">` vazia (renderizada pelo JS); adicionar `<dialog id="habit-dialog">` e `<dialog id="archived-dialog">` **fora** do `#form-habits`; corrigir o `alt` "íncone" → "ícone" (D-04) — `index.html`

## Fase 2 — Fundamentos (bloqueia todas as histórias)

**Objetivo**: o app funciona sem a NLWSetup, com os mesmos 5 hábitos para quem já tem
dados, e os dias passam a persistir.
**Checkpoint**: ao fim da fase, o checklist de regressão da 001 passa (com R-11 já no
comportamento novo).

- [x] T003 [US2] Seção **Constantes**: chaves `NLWSetup@habits` e `habits@v2`, `MAX_ACTIVE = 10`, `MAX_NAME = 30`, os 5 hábitos padrão (id, nome, emoji, na ordem do plan) — `script.js`
- [x] T004 [US2] `loadState()` com migração (v2 → usa; chave antiga → converte e grava v2 sem tocar na antiga; nada → estado vazio; JSON inválido → não sobrescreve, `console.error`) e `saveState()` — `script.js`
- [x] T005 [US3] Regras `addDay()` (mantém `days` ordenado, sem duplicar) e `toggleCheck(id, dia)` — `script.js`
- [x] T006 [US2] `render()`: coluna de hábitos ativos (emoji/símbolo + nome com `title`) e colunas de dias com checkboxes `name=<id>`, `value=MM-DD`, `aria-label="<Nome> em DD/MM"`; dia sem hábitos ativos mostra só a data — `script.js`
- [x] T007 [US3] Eventos: botão do cabeçalho usa `addDay()` (mantém os alertas atuais, corrigindo "Adicionado com sucesso" — D-03); `change` nos checkboxes → `toggleCheck` → `saveState`; carregar → `loadState` → `render` — `script.js`
- [x] T008 [P] [US2] Linha do hábito com 64px de altura e gap de 24px alinhada às linhas de checkboxes; nome com `text-overflow: ellipsis`; corrigir `font-weight: 125%` → `line-height: 125%` no botão (D-06) — `style.css`

## Fase 3 — US1 Criar hábito + US2 Primeiro uso (P1) 🎯 MVP

**Objetivo**: criar hábitos com validação; lista vazia no primeiro uso.
**Verificação independente**: janela anônima → criar 2 hábitos → recarregar.

- [x] T009 [US1] Regras puras: `normalizeName()`, `findByName()`, `validateHabit(name, idIgnorado)` (vazio, >30, duplicado ativo, duplicado arquivado) e `createHabit()` com id `h-<timestamp36><aleatório>` — `script.js`
- [x] T010 [US1] `firstGrapheme()` (`Intl.Segmenter` com fallback `Array.from(str)[0]`) e `habitSymbol()` (emoji ou primeira letra maiúscula do nome) — `script.js`
- [x] T011 [US1] Diálogo em modo **criar**: campos Nome (`maxlength=30`, contador "x/30") e Emoji; erros em `<p role="alert">`; salvar → `createHabit` → `saveState` → `render` — `script.js`, `index.html`
- [x] T012 [US1] Botão "+ Novo hábito" no fim da coluna (`type="button"`); com 10 ativos fica `disabled` com o texto "Limite de 10 hábitos ativos" — `script.js`
- [x] T013 [US2] Estado vazio: sem hábitos ativos, mostrar "Crie seu primeiro hábito" + botão "+ Novo hábito" — `script.js`
- [x] T014 [P] [US1] Estilos do `<dialog>` (tema escuro, `::backdrop`), campos, mensagens de erro, botão desabilitado e estado vazio — `style.css`

## Fase 4 — US4 Editar hábito (P2)

**Verificação independente**: editar nome/emoji de um hábito com marcações e recarregar.

- [x] T015 [US4] Botão ✎ na linha (`aria-label="Editar <Nome>"`) abre o diálogo em modo **editar**, preenchido — `script.js`
- [x] T016 [US4] `updateHabit()` reutilizando `validateHabit` (ignorando o próprio id); emoji vazio → volta à letra inicial — `script.js`

## Fase 5 — US5 Arquivar e restaurar (P2)

**Verificação independente**: arquivar hábito com marcações → some; restaurar → marcações
voltam.

- [x] T017 [US5] Botão **Arquivar** no diálogo de edição com `confirm()` ("O hábito sairá da tela, mas o histórico será guardado."); `archiveHabit()` — `script.js`
- [x] T018 [US5] Botão "Arquivados (n)" no fim da coluna, exibido só com n > 0; abre `#archived-dialog` com a lista — `script.js`
- [x] T019 [US5] `restoreHabit()` move o hábito para o fim dos ativos; botão **Restaurar** desabilitado com 10 ativos, com o motivo — `script.js`
- [x] T020 [US5] Erro de "nome de hábito arquivado" no diálogo de criar oferece **Restaurar** — `script.js`

## Fase 6 — US6 Excluir definitivamente (P3)

- [x] T021 [US6] Botão **Excluir definitivamente** em cada item de `#archived-dialog` com `confirm()` ("Esta ação não pode ser desfeita."); `deleteHabit()` remove o hábito e `checks[id]` — `script.js`

## Fase 7 — US7 Reordenar (P3)

**Verificação independente**: reordenar por botões e por arrasto, recarregar, conferir
ordem e marcações.

- [x] T022 [US7] `moveHabit(id, novoIndice)` considerando só os ativos dentro do array completo — `script.js`
- [x] T023 [US7] Botões ↑/↓ na linha (`aria-label="Mover <Nome> para cima/baixo"`), desabilitados no primeiro/último; após mover, o foco volta ao mesmo botão do hábito movido — `script.js`
- [x] T024 [US7] Arrastar pela alça ⠿ com Pointer Events (`pointerdown` captura, `pointermove` calcula destino, `pointerup` aplica, `pointercancel` desfaz) — `script.js`
- [x] T025 [P] [US7] Estilos da alça (`touch-action: none`, `cursor: grab`), linha `.dragging` e botões ↑/↓ compactos — `style.css`

## Fase 8 — Polimento

- [x] T026 [P] `:focus-visible` em todos os botões e checkboxes; revisar `aria-label`s e textos em pt-BR — `style.css`, `script.js`
- [x] T027 [P] Ajustes para ≤570px: largura do nome, controles visíveis, diálogos com largura total — `style.css`
- [x] T028 Marcar D-01, D-03, D-04, D-06 e D-07 como resolvidos pela 002 na tabela de débitos — `specs/001-registro-de-habitos/spec.md`
- [x] T029 Atualizar o item R-11 do checklist de regressão (dia sem marcação passa a persistir) e a nota de que o `plan.md` da 001 é histórico — `specs/001-registro-de-habitos/tasks.md`, `specs/001-registro-de-habitos/plan.md`
- [ ] T030 Executar todo o checklist abaixo; se tudo passar, marcar a spec como **Implementada** e atualizar a tabela de `docs/sdd-guia.md`

---

## Dependências

- T002 → Fase 2. A Fase 2 bloqueia todas as outras.
- Fase 3 (T009–T011) bloqueia as Fases 4 e 5 (reutilizam o diálogo e a validação).
- T018 bloqueia T019–T021.
- Fases 6 e 7 são independentes entre si.
- Tarefas `[P]` de CSS podem ser feitas junto com as de JS da mesma fase.

---

## Checklist de verificação manual

*Executar no navegador abrindo `index.html`. "Janela anônima" = localStorage limpo.*

### Preparação de dados antigos (para os itens de migração)

No DevTools, em uma janela anônima **com a versão nova**, antes de recarregar:

```js
localStorage.clear()
localStorage.setItem("NLWSetup@habits", JSON.stringify({
  run: ["10-28", "10-30"], water: ["10-28", "10-29"], food: [], journal: ["10-29"], takePills: []
}))
location.reload()
```

### US2 — Primeiro uso e dados atuais
- [x] **V-01** (2.1) Janela anônima sem dados: lista vazia, texto "Crie seu primeiro hábito" e botão "+ Novo hábito".
- [x] **V-02** (2.2) Com os dados antigos acima: aparecem Corrida 🏃, Água 💧, Alimentação 🍎, Leitura 📚, Remédios 💊, nessa ordem; dias 28/10, 29/10, 30/10; marcações iguais às do JSON.
- [x] **V-03** (RC-002) Após V-02, `localStorage.getItem("habits@v2")` existe e `NLWSetup@habits` continua **idêntico** ao que foi gravado.
- [x] **V-04** (2.3) Sem hábitos ativos, "Registrar o meu dia" cria a coluna só com a data.

### US3 — Dias sem marcação
- [x] **V-05** (3.1) Registrar o dia sem marcar nada e recarregar: o dia continua.
- [x] **V-06** (3.2) Desmarcar todos os hábitos de um dia e recarregar: o dia continua, vazio.

### US1 — Criar
- [x] **V-07** (1.1) Criar "Meditar" com 🧘: aparece no fim da lista e desmarcado em todos os dias.
- [x] **V-08** (1.2) Criar "yoga" sem emoji: aparece com "Y".
- [x] **V-09** (1.3) Confirmar com nome vazio ou só espaços: mensagem "Informe o nome do hábito." e nada criado.
- [x] **V-10** (1.4) O campo não aceita mais de 30 caracteres; o contador mostra "30/30".
- [x] **V-11** (1.5) Criar " meditar " com "Meditar" ativo: aviso de duplicado e nada criado.
- [x] **V-12** (1.6) Criar com o nome de um arquivado: aviso + opção **Restaurar**, que restaura o arquivado.
- [x] **V-13** (1.7) Com 10 ativos: "+ Novo hábito" desabilitado com "Limite de 10 hábitos ativos".
- [x] **V-14** (1.8) Recarregar: hábitos criados continuam.
- [x] **V-15** Emoji composto (👩‍💻) aparece como um único símbolo.

### US4 — Editar
- [x] **V-16** (4.1) Renomear "Corrida" para "Correr" e trocar o emoji: marcações anteriores continuam, inclusive após recarregar.
- [x] **V-17** (4.2) Renomear para o nome de outro hábito ativo ou arquivado: aviso e nada muda.
- [x] **V-18** (4.3) Apagar o emoji: passa a exibir a primeira letra.

### US5 — Arquivar e restaurar
- [x] **V-19** (5.1) Arquivar pede confirmação mencionando que o histórico será guardado.
- [x] **V-20** (5.2) Após confirmar: some da lista e dos dias; "Arquivados (1)" aparece.
- [x] **V-21** (5.3) Restaurar: volta no fim da lista com as marcações anteriores.
- [x] **V-22** (5.4) Com 10 ativos: **Restaurar** desabilitado com o motivo.
- [x] **V-23** (5.5) Sem arquivados: o botão "Arquivados" não aparece.
- [x] **V-24** Arquivar o último ativo: volta ao estado vazio e os dias continuam visíveis.

### US6 — Excluir definitivamente
- [x] **V-25** (6.1) Excluir pede confirmação avisando que não há como desfazer.
- [x] **V-26** (6.2) Após excluir e recarregar: o hábito não existe, `checks` não tem mais o id, e o nome pode ser usado de novo.
- [x] **V-27** (6.3) Hábito ativo não tem opção de excluir.

### US7 — Reordenar
- [x] **V-28** (7.1) Arrastar pela alça com o mouse muda a ordem na lista e nos dias.
- [ ] **V-29** (7.1) Arrastar pela alça no toque (DevTools em modo celular ou aparelho real) funciona sem rolar a página.
- [x] **V-30** (7.2) Só com teclado (Tab até ↑/↓, Enter): o hábito move uma posição e o foco continua no botão.
- [x] **V-31** (7.3) ↑ desabilitado no primeiro e ↓ no último.
- [x] **V-32** (7.4, 7.5) Recarregar: ordem mantida e cada marcação continua com seu hábito.

### Acessibilidade e responsivo
- [ ] **V-33** (CS-004) Todas as ações (criar, editar, arquivar, restaurar, excluir, reordenar, marcar) concluídas usando só o teclado; Esc fecha os diálogos.
- [x] **V-34** Em ≤570px: nome truncado com "…", nome completo no `title`, controles e diálogos utilizáveis.
- [x] **V-35** Nenhum erro no console durante todo o checklist.

### Regressão
- [x] **V-36** Checklist de [001-registro-de-habitos](../001-registro-de-habitos/tasks.md#checklist-de-verificação-manual) completo (R-11 no comportamento novo).
