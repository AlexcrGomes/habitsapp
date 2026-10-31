# Plano de Implementação: Semana automática com registro retroativo

**Branch**: `calendario` | **Data**: 2026-10-31 | **Spec**: [spec.md](./spec.md)
**Status**: Aprovado em 2026-10-31 | **Tarefas**: [tasks.md](./tasks.md)

---

## Resumo

Os dias deixam de ser dados: a grade calcula as 7 colunas a partir da data atual, do modo de
semana e de um deslocamento de navegação (não salvo). As marcações passam a usar datas
completas `YYYY-MM-DD` em uma nova chave `habits@v3`, que também guarda a preferência de
modo. Os dados de `habits@v2` e `NLWSetup@habits` são convertidos automaticamente e mantidos
intactos. O botão "Registrar o meu dia" dá lugar a uma barra de navegação no cabeçalho.

## Contexto técnico

| Item | Valor |
|------|-------|
| Linguagens | HTML, CSS, JavaScript (script clássico, sem módulos) |
| Dependências | Nenhuma nova |
| Persistência | Nova chave `habits@v3`; `habits@v2` e `NLWSetup@habits` só lidas (migração) |
| APIs do navegador | `Date` (datas locais), `toLocaleDateString` (dia da semana), `scrollIntoView`, `visibilitychange` |
| Riscos | Fuso/horário de verão em contas de data (mitigado com datas locais construídas por `new Date(ano, mês, dia)`); layout do cabeçalho no celular |

---

## Constitution Check

| Princípio | Conforme? | Observação |
|-----------|-----------|------------|
| I. Spec antes do código | ✅ | Spec aprovada em 2026-10-31 |
| II. Simplicidade — sem build | ✅ | Nenhuma dependência nova |
| III. Dados locais e compatíveis | ✅ | Migração automática v2/NLWSetup → v3; chaves antigas preservadas. Exige emenda de texto da constituição (a chave citada como vigente muda) |
| IV. Interface pt-BR e acessível | ✅ | Setas e alternador nativos (`button`, `radio`); `aria-current="date"`; motivo do bloqueio no `aria-label` |
| V. Responsivo | ✅ | Cabeçalho quebra em ≤570px; abre rolado até hoje |
| VI. Verificação explícita | ✅ | Checklist no `tasks.md`; regressão da 001 atualizada |

---

## Pesquisa e decisões

| # | Decisão | Alternativas | Motivo |
|---|---------|--------------|--------|
| P1 | Datas `YYYY-MM-DD` | Timestamp; objeto `{y,m,d}` | Ordenável como texto, legível no DevTools, mesmo formato de antes com o ano na frente |
| P2 | Nova chave `habits@v3` | Reescrever `habits@v2` | Mesmo padrão da 002: o dado anterior nunca é destruído |
| P3 | Datas sempre locais (`new Date(a, m - 1, d)`, `getFullYear/getMonth/getDate`) | `toISOString()` | `toISOString` usa UTC e erra o dia à noite no Brasil |
| P4 | `addDays` por `new Date(a, m, d + n)` | Somar milissegundos | Imune ao horário de verão |
| P5 | `weekOffset` só em memória | Salvar a semana vista | Spec 4.5: recarregar volta para a semana atual |
| P6 | Ano inferido: `MM-DD` > hoje → ano passado | Sempre ano atual | Dados sem ano são do passado; uma data "depois de hoje" só pode ser do ano anterior |
| P7 | 29/02 inexistente → ano bissexto anterior mais recente | Descartar | Nunca perder marcação (Princípio III) |
| P8 | Alternador com dois `radio` em `fieldset` | `select`; botão de alternar | Dois estados visíveis, nativo e acessível por setas do teclado |
| P9 | Dia da semana com `toLocaleDateString("pt-BR", { weekday: "short" })`, sem o ponto final | Tabela fixa | Já localizado; só remove o "." ("sex." → "sex") |

---

## Arquivos afetados

```
index.html     # header: remove #register-day; adiciona .week-nav (‹ período ›) e fieldset do modo
script.js      # modelo v3 + migração, funções de data, renderDays/renderNav, eventos de navegação
style.css      # barra de navegação, alternador, coluna .today, checkbox :disabled, header no celular
assests/plus.svg   # removido (não é mais usado)
specs/001-…/spec.md, tasks.md   # D-02 resolvido; US1 substituída; regressão atualizada
specs/002-…/spec.md             # nota: US3/RF-013 substituídos pela 004
specs/003-…/spec.md             # dependência D-02 resolvida
.specify/memory/constitution.md # emenda 1.1.0 (chave vigente e stack atual)
CLAUDE.md, docs/sdd-guia.md     # descrição do projeto, regra 10, tabela de specs
```

---

## Modelo de dados

### Antes — `habits@v2`
```json
{ "version": 2, "habits": [...], "days": ["10-28", "10-30"], "checks": { "run": ["10-28"] } }
```

### Depois — `habits@v3`
```json
{
  "version": 3,
  "habits": [ { "id": "run", "name": "Corrida", "emoji": "🏃", "archived": false } ],
  "checks": { "run": ["2026-10-28"] },
  "settings": { "weekMode": "rolling" }
}
```
- `weekMode`: `"rolling"` (Últimos 7 dias) | `"calendar"` (Dom–Sáb).
- `habits` é copiado sem mudança.

### Migração (`loadState`)
```
se "habits@v3" válido          → usar
senão se "habits@v2" válido    → toV3(v2)
senão se "NLWSetup@habits"     → toV3(migrate(antigo))     // migrate() existente gera v2
senão                          → estado vazio v3
gravar "habits@v3" (só se ainda não existir com conteúdo inválido); chaves antigas intactas

toV3(v2): checks[id] = datas "MM-DD" → inferirAno → "YYYY-MM-DD" (sem duplicar, ordenadas)
          descarta "days"; settings = { weekMode: "rolling" }
```

---

## Fluxo / comportamento

### Funções de data (puras)
- `toKey(date)` → `"YYYY-MM-DD"` · `fromKey(key)` → `Date` local · `addDays(date, n)`
- `todayDate()` → hoje à meia-noite local
- `visibleDays(mode, offset)` →
  - `rolling`: de `hoje + 7·offset − 6` até `hoje + 7·offset`
  - `calendar`: de `domingo(hoje) + 7·offset` até `+6`
- `isEditable(key)`: `toKey(hoje − 6) ≤ key ≤ toKey(hoje)` · `isFuture(key)`: `key > toKey(hoje)`
- `formatDay(key)` → `"DD/MM"` · `weekdayShort(key)` → `"sex"` · `periodLabel(days)` → `"25/10 – 31/10"`

### Tela
```
header:  [logo]          [‹]  25/10 – 31/10  [›]    ( Últimos 7 dias | Dom–Sáb )

         coluna de hábitos      sáb 25/10 … sex 31/10 (hoje destacado)
```
- `renderNav()`: período, `›` desabilitado em `weekOffset === 0`, radio marcado conforme `weekMode`.
- `renderDays()`: 7 colunas; `.today` + `aria-current="date"` em hoje; checkbox `disabled`
  fora da janela, com `aria-label` "Corrida em 20/10 (somente consulta)" ou "(dia futuro)".
- `render()` chama também `renderNav()`.

### Eventos
- `‹`/`›`: `weekOffset ∓ 1` (› nunca passa de 0) → `render()`; ao chegar em 0, rola até hoje.
- Alternador `change`: grava `settings.weekMode`, `weekOffset = 0`, `saveState()`, `render()`, rola até hoje.
- Carregamento: `render()` e rola até hoje.
- `visibilitychange` (visível) e `focus`: se o dia mudou, `weekOffset = 0`, `render()`, rola até hoje.
- `change` dos checkboxes: inalterado (`toggleCheck` + `saveState`); checkbox bloqueado não dispara.

### Rolar até hoje
`document.querySelector(".day.today")?.scrollIntoView({ block: "nearest", inline: "center" })`
— só tem efeito quando há rolagem horizontal (celular).

---

## Ajustes durante a implementação

Encontrados na verificação no navegador; não mudam o comportamento da spec, só o layout.

| Problema | Ajuste |
|----------|--------|
| Rótulo "dom 25/10" quebrava em duas linhas e desalinhava a grade | Rótulo em duas linhas fixas (`.day-label`, 44px: dia da semana em 14px + data); `margin-top` da coluna de hábitos 57px → 76px |
| 7 colunas não cabiam em telas comuns | `gap` entre os dias 48px → 16px |
| No celular a página inteira rolava na horizontal, escondendo nomes dos hábitos e a seta ‹ | Só `.days` rola (`overflow-x: auto`); form com `max-width: 100%` e coluna de hábitos fixa |
| Cabeçalho fixo mais alto no celular (navegação em duas linhas) cobria a grade | Header `position: sticky` em vez de `fixed`; `padding-top` do form 182px → 48px (24px no celular) |
| Rolagem até hoje era desfeita pela restauração de rolagem do navegador | `history.scrollRestoration = "manual"` e `scrollToToday()` também no evento `load` |

## Complexity Tracking

Nenhuma violação.
