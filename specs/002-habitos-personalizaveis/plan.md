# Plano de Implementação: Hábitos personalizáveis

**Branch**: `002-habitos-personalizaveis` | **Data**: 2026-10-30 | **Spec**: [spec.md](./spec.md)
**Status**: Aprovado em 2026-10-30 | **Tarefas**: [tasks.md](./tasks.md)

---

## Resumo

A grade de dias × hábitos passa a ser renderizada pelo próprio `script.js`, a partir de um
estado salvo em uma nova chave do `localStorage` (`habits@v2`) que guarda hábitos (com
id estável, nome, emoji, ordem e situação), dias registrados e marcações. A biblioteca
`NLWSetup` é **removida**, porque não suporta hábitos dinâmicos nem dias sem marcação.
Os dados antigos (`NLWSetup@habits`) são convertidos automaticamente na primeira abertura
e mantidos intactos como cópia de segurança. Criar e editar usam um `<dialog>` nativo;
reordenar usa arrastar com Pointer Events, mais botões subir/descer.

## Contexto técnico

| Item | Valor |
|------|-------|
| Linguagens | HTML, CSS, JavaScript (script clássico, sem módulos) |
| Dependências | **Remove** `NLWSetup` (CDN). Nenhuma nova. |
| Persistência | `localStorage`: nova chave `habits@v2`; `NLWSetup@habits` só lida (migração) |
| APIs do navegador | `<dialog>`, Pointer Events, `Intl.Segmenter` (com fallback) |
| Restrições | Sem build; funcionar abrindo `index.html` direto (`file://`) |
| Riscos | Arrastar no toque (mitigado com Pointer Events + `touch-action: none`); alinhamento da coluna de hábitos com as linhas de checkboxes |

---

## Constitution Check

| Princípio | Conforme? | Observação |
|-----------|-----------|------------|
| I. Spec antes do código | ✅ | Spec aprovada em 2026-10-30 |
| II. Simplicidade — sem build | ✅ | Remove a única dependência externa de JS; nenhum build. Resolve D-07 |
| III. Dados locais e compatíveis | ✅ | Migração automática `NLWSetup@habits` → `habits@v2`; chave antiga preservada e nunca sobrescrita |
| IV. Interface pt-BR e acessível | ✅ | Ações por botões nativos e `<dialog>`; subir/descer por teclado; `aria-label` em checkboxes e botões de ícone |
| V. Responsivo | ✅ | Breakpoint de 570px mantido; nome truncado com "…" |
| VI. Verificação explícita | ✅ | Checklist no `tasks.md` + regressão da 001 (com R-11 atualizado) |

---

## Pesquisa e decisões

| # | Decisão | Alternativas consideradas | Motivo da escolha |
|---|---------|---------------------------|-------------------|
| P1 | **Remover a NLWSetup** e renderizar a grade no `script.js` | (a) Manter a lib e manipular seus campos internos; (b) fixar versão e fazer fork | A lib lê hábitos só no construtor (`.habit[data-name]`), guarda dias só a partir das marcações (causa do D-01) e não tem API para adicionar/remover hábitos. Contornar isso dependeria de detalhes internos de código externo sem versão fixa. Reescrever a parte usada é ~1 função de renderização |
| P2 | **Nova chave `habits@v2`**, chave antiga preservada | Reescrever `NLWSetup@habits` no novo formato | Nunca destrói o dado original: se algo falhar, a versão anterior do app ainda abre com os dados de antes da migração |
| P3 | Hábitos em **array** (ordem = posição) com `archived: true/false` | Campo `order` numérico | Reordenar e "restaurar no fim" viram mover um item no array; sem renumeração |
| P4 | **Id estável**: os 5 migrados mantêm `run`, `water`… ; novos usam `h-<timestamp36><aleatório>` | `crypto.randomUUID()` | `randomUUID` exige contexto seguro e pode falhar em `file://`; o id gerado é único o bastante para dados locais |
| P5 | Datas continuam `MM-DD` | Incluir o ano agora | D-02 está fora do escopo (spec). Manter o formato evita uma segunda migração dentro desta feature |
| P6 | Criar/editar em `<dialog>` nativo com `showModal()` | Formulário inline; `prompt()` | Foco preso no modal, Esc fecha, acessível por padrão; `prompt()` não comporta dois campos |
| P7 | Confirmações (arquivar, excluir) com `confirm()` | Diálogo customizado | Consistente com o `alert()` atual; trocar os dois é o débito D-08, fora do escopo |
| P8 | Arrastar com **Pointer Events** em uma alça (⠿) | API HTML5 Drag and Drop | HTML5 DnD não funciona de forma consistente no toque (celular), que é o uso principal (Princípio V) |
| P9 | Emoji: guardar só o **primeiro grafema** digitado (`Intl.Segmenter`, fallback `Array.from(str)[0]`) | Seletor de emojis | Sem dependência; o teclado de emojis do sistema resolve a escolha. Grafema preserva emojis compostos (👩‍💻) |
| P10 | Normalização de nome: `trim()` + `toLocaleLowerCase('pt-BR')` para comparar | Comparação exata | Atende "Ler" = "ler" = " Ler " (casos de borda da spec) |

---

## Arquivos afetados

```
index.html   # remove <script> da NLWSetup; .habits vira <ul> renderizada pelo JS;
             # adiciona <dialog id="habit-dialog"> e <dialog id="archived-dialog">
             # (fora do #form-habits, pois form dentro de form é inválido)
script.js    # reescrito: estado, migração, regras, renderização e eventos
style.css    # linha do hábito (alça, emoji, nome truncado, ↑↓, editar), estado vazio,
             # diálogos, estado "arrastando", :focus-visible
specs/001-registro-de-habitos/spec.md   # marcar D-01 e D-07 como resolvidos pela 002, e também
                                        # D-03, D-04 e D-06 (correções triviais nos mesmos
                                        # arquivos, permitidas pelo Princípio I)
specs/001-registro-de-habitos/tasks.md  # atualizar R-11 (dia sem marcação persiste)
```

Nenhum arquivo novo em `assests/`: os ícones dos botões da linha (⠿ ↑ ↓ ✎) são caracteres
de texto, com `aria-label`.

---

## Modelo de dados

### Antes — `NLWSetup@habits` (somente leitura a partir desta versão)

```json
{ "run": ["10-28", "10-30"], "water": ["10-29"], "food": [], "journal": [], "takePills": [] }
```

### Depois — `habits@v2`

```json
{
  "version": 2,
  "habits": [
    { "id": "run",           "name": "Corrida",  "emoji": "🏃", "archived": false },
    { "id": "water",         "name": "Água",     "emoji": "💧", "archived": false },
    { "id": "h-lq3x9k2ab7c", "name": "Meditar",  "emoji": "",   "archived": true  }
  ],
  "days": ["10-28", "10-29", "10-30"],
  "checks": {
    "run":   ["10-28", "10-30"],
    "water": ["10-29"]
  }
}
```

- `habits`: ordem do array = ordem de exibição dos **ativos**. Arquivados ficam no array
  com `archived: true` e são ignorados na grade.
- `emoji: ""` → exibe a primeira letra do nome em maiúscula (RF-002).
- `days`: dias registrados, independentes das marcações (corrige D-01). Mantido ordenado.
- `checks[id]`: dias marcados do hábito. Excluir definitivamente remove o hábito **e**
  `checks[id]`.

### Migração (executada ao carregar)

```
se existe "habits@v2"           → usar
senão se existe "NLWSetup@habits" → converter:
    habits = 5 padrões, nesta ordem:
        run       "Corrida"      🏃
        water     "Água"         💧
        food      "Alimentação"  🍎
        journal   "Leitura"      📚
        takePills "Remédios"     💊
    checks = dados antigos (chaves iguais aos ids)
    days   = união de todas as datas dos dados antigos, ordenada
    gravar "habits@v2"; NÃO alterar "NLWSetup@habits"
senão                           → estado vazio { version: 2, habits: [], days: [], checks: {} }
```

- A simples existência da chave antiga (mesmo `{}` ou com listas vazias) conta como
  usuário existente → recebe os 5 hábitos (RC-001).
- JSON inválido em `habits@v2`: não sobrescrever; tentar migrar da chave antiga; se não
  houver, começar vazio e registrar `console.error`.

---

## Fluxo / comportamento

### Organização do `script.js` (seções, nesta ordem)

1. **Constantes** — chaves do storage, `MAX_ACTIVE = 10`, `MAX_NAME = 30`, hábitos padrão.
2. **Estado e persistência** — `loadState()` (com migração), `saveState()`.
3. **Regras** (puras, sem DOM) — `activeHabits()`, `normalizeName()`, `findByName()`,
   `validateHabit(name, idIgnorado)`, `createHabit()`, `updateHabit()`, `archiveHabit()`,
   `restoreHabit()`, `deleteHabit()`, `moveHabit(id, novoIndice)`, `addDay()`,
   `toggleCheck()`, `firstGrapheme()`, `habitSymbol()`.
4. **Renderização** — `render()` recria a coluna de hábitos e as colunas de dias a partir
   do estado. Chamado após toda mudança.
5. **Eventos** — botão do cabeçalho, `change` nos checkboxes, cliques nos botões das
   linhas (delegação no `<ul>`), diálogos, arrastar.

Cada ação segue o mesmo ciclo: **regra altera estado → `saveState()` → `render()`**.

### Tela

```
header:  [logo]                                  [+ Registrar o meu dia]

         ┌ coluna de hábitos ───────────────┐   ┌ 28/10 ┐ ┌ 29/10 ┐
         │ ⠿ 🏃 Corrida          ↑ ↓  ✎     │   │  ☐    │ │  ☑    │
         │ ⠿ 💧 Água             ↑ ↓  ✎     │   │  ☑    │ │  ☐    │
         │ [+ Novo hábito]                  │
         │ [Arquivados (1)]                 │   (só aparece se houver arquivados)
         └──────────────────────────────────┘
```

- Cada linha mantém 64px de altura e o gap de 24px, para alinhar com os checkboxes.
- Nome com `text-overflow: ellipsis` e atributo `title` com o nome completo.
- ≤570px: esconde o texto dos botões (regra existente) e reduz a largura do nome; os
  controles continuam visíveis.
- **Estado vazio**: no lugar das linhas, o texto "Crie seu primeiro hábito" e o botão
  "+ Novo hábito".
- **Limite**: com 10 ativos, "+ Novo hábito" fica `disabled` com o texto
  "Limite de 10 hábitos ativos".

### Checkboxes

`<input type="checkbox" name="<id>" value="MM-DD" aria-label="Corrida em 30/10">`, na
ordem dos hábitos ativos. Um dia sem hábitos ativos mostra apenas a data.

### Diálogo de hábito (`#habit-dialog`)

- Campos: **Nome** (`maxlength=30`, `required`, contador "x/30") e **Emoji** (opcional).
- Modo criar / modo editar (mesmo diálogo). No modo editar, mostra também **Arquivar**.
- Erros aparecem dentro do diálogo em `<p role="alert">`:
  - vazio → "Informe o nome do hábito.";
  - duplicado ativo → "Já existe um hábito com esse nome.";
  - duplicado arquivado → "Há um hábito arquivado com esse nome." + botão **Restaurar**.

### Diálogo de arquivados (`#archived-dialog`)

Lista de arquivados, cada um com **Restaurar** (desabilitado com 10 ativos, com o motivo)
e **Excluir definitivamente** (`confirm()` avisando que não há como desfazer).

### Reordenar

- **Botões ↑/↓** na linha: chamam `moveHabit` com ±1; desabilitados no primeiro/último.
  Após mover, o foco volta ao mesmo botão do hábito movido (para mover várias vezes).
- **Arrastar** pela alça ⠿ (`touch-action: none`):
  `pointerdown` → captura o ponteiro e marca a linha como `.dragging`;
  `pointermove` → calcula o índice de destino pela posição vertical sobre as linhas;
  `pointerup` → `moveHabit` + salvar + render; `pointercancel` → desfaz o estado visual.

---

## Complexity Tracking

Nenhuma violação. Observação: substituir a NLWSetup aumenta o código próprio
(estimativa inicial de 250 a 300 linhas; o resultado final ficou com ~570 linhas no
`script.js`, ~450 sem linhas em branco, por causa dos diálogos, do arrastar e do controle de foco), mas elimina a dependência externa sem
versão fixa e as limitações que impediam a feature (decisão P1).
