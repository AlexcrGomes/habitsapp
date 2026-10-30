# Tarefas: Registro de hábitos

**Branch**: `001-registro-de-habitos` | **Entradas**: [spec.md](./spec.md), [plan.md](./plan.md)

> Tarefas históricas (as-built), todas concluídas. O valor principal deste arquivo é o
> **checklist de verificação manual**, usado como regressão em todas as features futuras.

---

## Fase 1 — Preparação

- [x] T001 Criar estrutura HTML com header, `form#form-habits`, `.habits` e `.days` — `index.html`
- [x] T002 [P] Adicionar logomarca e ícone "+" — `assests/`
- [x] T003 [P] Carregar fontes Inter e Roboto Mono — `index.html`
- [x] T004 Incluir NLWSetup via CDN e `script.js` — `index.html`

## Fase 2 — História 1: registrar o dia (P1)

- [x] T005 [US1] Instanciar `NLWSetup` com o form — `script.js`
- [x] T006 [US1] Função `add()` com data `DD/MM`, verificação de duplicado e alertas — `script.js`

## Fase 3 — História 2: marcar hábitos (P1)

- [x] T007 [US2] Declarar os 5 hábitos com `data-name` e emoji — `index.html`
- [x] T008 [P] [US2] Estilizar checkboxes (vazio/marcado) e colunas de dias — `style.css`

## Fase 4 — História 3: persistência (P1)

- [x] T009 [US3] `save()` no evento `change` do form — `script.js`
- [x] T010 [US3] Restaurar dados do `localStorage` com `setData` + `load` — `script.js`

## Fase 5 — História 4: responsivo (P2)

- [x] T011 [US4] Ocultar texto do botão em ≤570px — `style.css`

---

## Checklist de verificação manual

*Suíte de regressão do app. Execute em uma janela anônima (localStorage limpo) e depois
com dados existentes.*

### Primeiro uso
- [ ] **R-01** Abrir `index.html` com localStorage limpo: aparecem os 5 emojis e nenhum dia.

### Registrar dia (US1)
- [ ] **R-02** Clicar em "Registrar o meu dia": alerta de sucesso e coluna com a data de hoje (DD/MM).
- [ ] **R-03** Clicar de novo: alerta "Dia já incluso" e nenhuma coluna nova.

### Marcar hábitos (US2)
- [ ] **R-04** Clicar em um quadrado: fica roxo.
- [ ] **R-05** Clicar de novo: volta a ficar vazio.

### Persistência (US3)
- [ ] **R-06** Marcar 2 hábitos e recarregar: dia e marcações continuam.
- [ ] **R-07** No DevTools, `localStorage.getItem("habits@v2")` contém as datas marcadas no formato `MM-DD`.
- [ ] **R-08** Com dados de vários dias, as colunas aparecem em ordem cronológica.

### Responsivo (US4)
- [ ] **R-09** Em largura ≤570px, o botão mostra só o ícone "+".
- [ ] **R-10** Com muitos dias, é possível rolar horizontalmente.

### Dias sem marcação (D-01, resolvido na 002)
- [ ] **R-11** Registrar o dia sem marcar nada e recarregar: o dia continua na tela.

> Desde a spec 002, a chave de dados é `habits@v2` (R-07); `NLWSetup@habits` só é lida na
> migração.
