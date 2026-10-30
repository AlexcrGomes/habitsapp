# Plano de Implementação: Registro de hábitos

**Branch**: `001-registro-de-habitos` | **Data**: 2026-10-30 | **Spec**: [spec.md](./spec.md)
**Status**: Aprovado (as-built — documenta a implementação existente)

> **Histórico**: este plano descreve a implementação original, com a biblioteca NLWSetup.
> A partir da [spec 002](../002-habitos-personalizaveis/plan.md), a grade é renderizada pelo
> `script.js` e os dados ficam em `habits@v2`. O comportamento da spec 001 continua valendo.

---

## Resumo

Página estática única. A biblioteca **NLWSetup** (carregada via CDN) monta a grade de
dias × hábitos a partir do HTML e controla os checkboxes. O `script.js` liga o botão do
cabeçalho ao registro do dia e salva/restaura os dados no `localStorage`.

## Contexto técnico

| Item | Valor |
|------|-------|
| Linguagens | HTML5, CSS3, JavaScript (script clássico, sem módulos) |
| Dependências | `NLWSetup.js` — `cdn.jsdelivr.net/gh/maykbrito/libs/NLWSetup/source/NLWSetup.js` (sem versão fixa) |
| Persistência | `localStorage`, chave `NLWSetup@habits` |
| Fontes | Google Fonts: Inter 600, Roboto Mono 700 |
| Execução | Abrir `index.html` no navegador |

---

## Constitution Check

| Princípio | Conforme? | Observação |
|-----------|-----------|------------|
| I. Spec antes do código | ⚠️ | Spec escrita retroativamente |
| II. Simplicidade — sem build | ✅ | Sem build; CDN sem versão fixa (D-07) |
| III. Dados locais e compatíveis | ✅ | Apenas `localStorage` |
| IV. Interface pt-BR e acessível | ⚠️ | Erros de texto (D-03, D-04) |
| V. Responsivo | ✅ | Breakpoint 570px |
| VI. Verificação explícita | ✅ | Checklist em [tasks.md](./tasks.md) |

---

## Arquivos

```
index.html        # estrutura: header (logo + botão), form#form-habits com .habits e .days
script.js         # integração: registro do dia, save/load no localStorage
style.css         # tema escuro, layout flex, checkboxes estilizados, breakpoint 570px
assests/logo.svg  # logomarca
assests/plus.svg  # ícone do botão
preview.png       # imagem do README
```

## Arquitetura

```
index.html
 ├─ <form id="form-habits">
 │   ├─ .habits  → 5 × <div class="habit" data-name="…">emoji</div>   (fonte dos hábitos)
 │   └─ .days    → preenchido pela NLWSetup
 ├─ NLWSetup.js  (CDN)
 └─ script.js
```

### Contrato da NLWSetup (comportamento observado da biblioteca)

| Membro | Comportamento |
|--------|---------------|
| `new NLWSetup(form)` | Lê os hábitos de `.habit[data-name]` dentro do form; localiza `.days`; registra listener de `change` no form que atualiza `data` com os checkboxes marcados |
| `setData(obj)` | Substitui `data` (lança erro se receber valor falso) |
| `load()` | Se `data` tiver chaves, extrai todos os dias de `data` e renderiza |
| `dayExists("DD/MM")` | Verifica se o dia já está registrado |
| `addDay("DD/MM")` | Registra o dia (ignora duplicados) e re-renderiza |
| `data` | Objeto `{ [habito]: ["MM-DD", …] }` |

Renderização: para cada dia, em ordem de `MM-DD`, cria `<div class="day">` com um
`<div>` contendo `DD/MM` e um `<input type="checkbox" name="<hábito>" value="MM-DD">`
por hábito.

## Fluxo

1. **Carregamento** — `script.js:25-28`: lê `NLWSetup@habits` do `localStorage` (ou `{}`),
   chama `setData` e `load`.
2. **Registrar dia** — clique no `header button` → `add()` (`script.js:8-19`):
   - `today = new Date().toLocaleDateString('pt-br').slice(0, -5)` → `"DD/MM"`;
   - se `dayExists(today)` → alerta "Dia já incluso"; senão alerta de sucesso e `addDay(today)`.
3. **Marcar hábito** — evento `change` no form:
   - listener interno da NLWSetup atualiza `data`;
   - listener `save()` (`script.js:21-23`) grava `JSON.stringify(nlwSetup.data)` no
     `localStorage`.

> Consequência do fluxo: só `data` é persistido. Os dias são reconstruídos a partir das
> marcações, por isso um dia sem marcações não sobrevive ao recarregamento (débito D-01).

## Modelo de dados

Chave `localStorage`: `NLWSetup@habits`

```json
{
  "run":       ["10-28", "10-30"],
  "water":     ["10-28", "10-29", "10-30"],
  "food":      [],
  "journal":   ["10-29"],
  "takePills": ["10-30"]
}
```

- Chaves = `data-name` dos hábitos em `index.html`.
- Valores = dias marcados no formato `MM-DD` (sem ano — débito D-02).

**Qualquer feature futura deve continuar lendo este formato** (Princípio III).

---

## Complexity Tracking

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|----------|----------------------|-------------------------------------------|
| Dependência externa (NLWSetup via CDN) | Fornece a grade e o controle dos checkboxes | Decisão original do projeto; reavaliar na spec 002 |
