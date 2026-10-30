# Especificação da Feature: Registro de hábitos

**Branch**: `001-registro-de-habitos` (retroativa — código já existente em `main`)
**Criada em**: 2026-10-30
**Status**: Implementada
**Entrada**: documentação retroativa do comportamento atual do app Habits.

> Spec **as-built**: descreve o comportamento que já existe, para servir de base e de
> regressão às próximas features. Divergências entre o comportamento ideal e o atual estão
> em **Débitos conhecidos**.

---

## Histórias de usuário e cenários de aceitação

### História 1 — Registrar o dia atual (Prioridade: P1)

Como usuário, quero registrar o dia de hoje para poder marcar os hábitos que cumpri.

**Por que esta prioridade**: sem um dia registrado não há onde marcar hábitos.

**Teste independente**: clicar em "Registrar o meu dia" e ver a coluna do dia aparecer.

**Cenários de aceitação**:

1. **Dado** que o dia de hoje ainda não foi registrado, **Quando** clico em
   "Registrar o meu dia", **Então** vejo a mensagem "Adicionado com sucesso" e uma nova
   coluna com a data de hoje (DD/MM) e um campo por hábito.
2. **Dado** que o dia de hoje já foi registrado, **Quando** clico em
   "Registrar o meu dia", **Então** vejo a mensagem "Dia já incluso" e nenhuma coluna
   nova é criada.
3. **Dado** que há vários dias registrados, **Quando** a tela é exibida, **Então** as
   colunas aparecem em ordem cronológica (mês/dia).

---

### História 2 — Marcar hábitos cumpridos (Prioridade: P1)

Como usuário, quero marcar e desmarcar cada hábito em cada dia registrado para
acompanhar o que cumpri.

**Por que esta prioridade**: é a função central do app.

**Teste independente**: clicar em um quadrado de um dia registrado e vê-lo mudar de cor.

**Cenários de aceitação**:

1. **Dado** um dia registrado, **Quando** clico no quadrado de um hábito, **Então** ele
   fica roxo (marcado).
2. **Dado** um hábito marcado, **Quando** clico nele novamente, **Então** ele volta ao
   estado vazio (desmarcado).
3. **Dado** qualquer marcação ou desmarcação, **Quando** ela acontece, **Então** o
   estado é salvo imediatamente, sem botão de salvar.

---

### História 3 — Manter o histórico entre visitas (Prioridade: P1)

Como usuário, quero que meus registros continuem lá quando eu voltar ao app.

**Por que esta prioridade**: sem histórico não há rastreamento.

**Teste independente**: marcar hábitos, recarregar a página e conferir as marcações.

**Cenários de aceitação**:

1. **Dado** que marquei hábitos em um ou mais dias, **Quando** recarrego a página,
   **Então** os mesmos dias e marcações são exibidos.
2. **Dado** que nunca usei o app neste navegador, **Quando** abro a página, **Então**
   vejo apenas a lista de hábitos, sem dias registrados.

---

### História 4 — Usar no celular (Prioridade: P2)

Como usuário, quero usar o app no celular sem que o cabeçalho ocupe espaço demais.

**Cenários de aceitação**:

1. **Dado** uma tela com até 570px de largura, **Quando** a página é exibida, **Então**
   o botão do cabeçalho mostra apenas o ícone "+", sem o texto.
2. **Dado** muitos dias registrados, **Quando** a largura da tela é excedida, **Então**
   é possível rolar horizontalmente para ver os dias.

### Casos de borda

- Registrar o dia e recarregar **sem marcar nenhum hábito**: o dia desaparece (ver D-01).
- Desmarcar **todos** os hábitos de um dia e recarregar: o dia desaparece (ver D-01).
- Mesmo dia/mês em anos diferentes: tratados como o mesmo dia (ver D-02).
- Dados no navegador apagados pelo usuário: o histórico é perdido (sem backup).

---

## Requisitos

### Requisitos funcionais

- **RF-001**: O sistema DEVE exibir a lista fixa de 5 hábitos: corrida 🏃, água 💧,
  alimentação 🍎, leitura/diário 📚 e remédios 💊.
- **RF-002**: O usuário DEVE conseguir registrar o dia atual com um único clique no botão
  do cabeçalho.
- **RF-003**: O sistema DEVE impedir o registro duplicado do mesmo dia e avisar o usuário.
- **RF-004**: Cada dia registrado DEVE exibir sua data no formato DD/MM e um campo
  marcável por hábito.
- **RF-005**: O usuário DEVE conseguir marcar e desmarcar qualquer hábito de qualquer dia
  registrado.
- **RF-006**: O sistema DEVE salvar as marcações automaticamente no próprio navegador a
  cada alteração.
- **RF-007**: O sistema DEVE restaurar dias e marcações salvos ao abrir a página.
- **RF-008**: Os dias DEVEM ser exibidos em ordem cronológica.
- **RF-009**: Em telas de até 570px, o texto do botão do cabeçalho DEVE ser ocultado.

### Entidades-chave

- **Hábito**: identificador fixo (`run`, `water`, `food`, `journal`, `takePills`) e um
  emoji que o representa.
- **Dia registrado**: data (dia e mês) na qual o usuário pode marcar hábitos.
- **Marcação**: relação "hábito X foi cumprido no dia Y".

---

## Critérios de sucesso

- **CS-001**: Registrar o dia e marcar um hábito leva no máximo 2 cliques.
- **CS-002**: 100% das marcações permanecem após recarregar a página.
- **CS-003**: Nenhum dado do usuário é enviado para servidores; tudo fica no navegador.

---

## Débitos conhecidos

Registrados para correção futura; **não** fazem parte do comportamento desejado.

> As referências de linha valem para o código anterior à spec 002.

| ID | Débito | Onde | Impacto | Situação |
|----|--------|------|---------|----------|
| D-01 | Só as marcações são salvas; um dia sem nenhum hábito marcado não persiste e some ao recarregar | `script.js:21-23` + biblioteca NLWSetup | Usuário perde dias registrados | ✅ Resolvido na [002](../002-habitos-personalizaveis/spec.md) |
| D-02 | A data é guardada sem ano (`MM-DD`) | `script.js:9`, NLWSetup | Colisão entre anos; impede estatísticas de longo prazo | Aberto |
| D-03 | Texto com erros: "Adiconado com suceso" | `script.js:17` | Princípio IV | ✅ Resolvido na 002 |
| D-04 | `alt` com erro: "íncone sinal de mais roxo" | `index.html:20` | Princípio IV | ✅ Resolvido na 002 |
| D-05 | Pasta de imagens chamada `assests/` | `assests/` | Clareza (renomear exige atualizar referências) | Aberto |
| D-06 | `font-weight: 125%` duplicado e inválido no botão (provavelmente `line-height`) | `style.css:36` | Estilo ignorado | ✅ Resolvido na 002 |
| D-07 | Biblioteca NLWSetup carregada da CDN sem versão fixa | `index.html:43` | Princípio II — mudança externa pode quebrar o app | ✅ Resolvido na 002 (biblioteca removida) |
| D-08 | Feedback via `alert()`, que bloqueia a tela | `script.js:13,17` | Experiência de uso | Aberto |
---

## Checklist de qualidade da spec

- [x] Comportamento descrito do ponto de vista do usuário
- [x] Toda história tem cenários testáveis
- [x] Requisitos verificáveis
- [x] Casos de borda e débitos documentados
- [x] Nenhuma marcação `[NEEDS CLARIFICATION]` pendente
- [x] Conforme a [constituição](../../.specify/memory/constitution.md)
