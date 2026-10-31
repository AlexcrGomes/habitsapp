# Especificação da Feature: Semana automática com registro retroativo

**Branch**: `calendario` (criada pelo responsável; exceção à convenção `NNN-nome`)
**Criada em**: 2026-10-31
**Status**: Implementada em 2026-10-31 (aprovada em 2026-10-31)
**Entrada**: "Sem precisar salvar nada de data, sempre que o usuário abrir o sistema vai estar
mostrando o dia corrente, mas ele pode registrar hábitos feitos nos dias anteriores."

> Plano de implementação: [plan.md](./plan.md).

---

## Histórias de usuário e cenários de aceitação

### História 1 — Ver a semana ao abrir (Prioridade: P1)

Como usuário, quero abrir o app e já ver o dia de hoje, sem precisar registrar nada.

**Por que esta prioridade**: elimina a etapa manual de registrar o dia, que hoje é
obrigatória antes de marcar qualquer hábito.

**Teste independente**: abrir o app em um navegador sem dados e criar um hábito.

**Cenários de aceitação**:

1. **Dado** que abro o app, **Quando** a tela é exibida, **Então** vejo 7 colunas de dias
   (conforme o modo de semana escolhido) que incluem o dia de hoje.
2. **Dado** a semana exibida, **Quando** procuro o dia de hoje, **Então** a coluna dele
   está destacada das demais.
3. **Dado** a tela inicial, **Quando** procuro o botão "Registrar o meu dia", **Então** ele
   não existe mais.
4. **Dado** cada coluna, **Quando** leio o cabeçalho, **Então** vejo o dia da semana e a
   data (ex.: "sex 31/10").

---

### História 2 — Marcar hábitos de hoje e dos dias anteriores (Prioridade: P1)

Como usuário, quero marcar um hábito que fiz em um dos últimos dias e esqueci de registrar.

**Por que esta prioridade**: é o objetivo central do pedido.

**Teste independente**: marcar um hábito 3 dias atrás e recarregar.

**Cenários de aceitação**:

1. **Dado** o dia de hoje ou qualquer um dos 6 dias anteriores, **Quando** clico em um
   hábito desse dia, **Então** ele é marcado (ou desmarcado) e salvo.
2. **Dado** um dia com mais de 6 dias atrás, **Quando** tento alterá-lo, **Então** não é
   possível; as marcações dele continuam visíveis.
3. **Dado** um dia futuro, **Quando** ele aparece na tela, **Então** não pode ser marcado.
4. **Dado** um dia bloqueado, **Quando** um leitor de tela o anuncia, **Então** informa que
   é "somente consulta" ou "dia futuro".

---

### História 3 — Manter meus dados atuais (Prioridade: P1)

Como usuário da versão atual, quero que todas as minhas marcações continuem nos dias certos.

**Por que esta prioridade**: Princípio III da constituição.

**Teste independente**: abrir a nova versão com dados das versões anteriores.

**Cenários de aceitação**:

1. **Dado** que tenho marcações das versões anteriores, **Quando** abro a nova versão,
   **Então** cada marcação aparece no mesmo dia/mês em que foi feita.
2. **Dado** que as versões anteriores não guardavam o ano, **Quando** a conversão
   acontece, **Então** datas cujo dia/mês ainda não chegou neste ano são consideradas do
   ano passado; as demais, do ano atual.
3. **Dado** que tinha dias registrados sem nenhuma marcação, **Quando** abro a nova versão,
   **Então** nada se perde: esses dias continuam aparecendo, porque agora todos os dias da
   semana aparecem automaticamente.

---

### História 4 — Consultar semanas anteriores (Prioridade: P2)

Como usuário, quero ver como foram as semanas passadas.

**Teste independente**: voltar duas semanas e conferir as marcações exibidas.

**Cenários de aceitação**:

1. **Dado** a semana atual, **Quando** clico em ‹, **Então** vejo a semana anterior, com
   as marcações dela.
2. **Dado** uma semana anterior, **Quando** clico em ›, **Então** avanço uma semana.
3. **Dado** a semana atual, **Quando** vejo o botão ›, **Então** ele está desabilitado
   (não há semanas futuras).
4. **Dado** qualquer semana, **Quando** olho a navegação, **Então** vejo o período exibido
   (ex.: "25/10 – 31/10").
5. **Dado** que voltei semanas, **Quando** recarrego a página, **Então** a tela volta para
   a semana atual.

---

### História 5 — Escolher o modo da semana (Prioridade: P2)

Como usuário, quero escolher entre ver os últimos 7 dias ou a semana de domingo a sábado.

**Teste independente**: alternar o modo, recarregar e conferir a escolha.

**Cenários de aceitação**:

1. **Dado** o primeiro uso, **Quando** abro o app, **Então** o modo é "Últimos 7 dias":
   hoje é a última coluna e as 6 anteriores são os dias anteriores.
2. **Dado** que escolho "Dom–Sáb", **Quando** a tela é atualizada, **Então** a semana vai
   de domingo a sábado e contém hoje.
3. **Dado** o modo "Dom–Sáb" e hoje não sendo sábado, **Quando** vejo os dias depois de
   hoje, **Então** eles aparecem bloqueados.
4. **Dado** o modo "Dom–Sáb", **Quando** vejo os dias editáveis, **Então** continuam sendo
   hoje e os 6 dias anteriores, mesmo que alguns estejam na semana anterior.
5. **Dado** que troquei o modo, **Quando** recarrego, **Então** o modo escolhido se mantém.
6. **Dado** que estou vendo uma semana anterior, **Quando** troco o modo, **Então** volto
   para a semana que contém hoje.

---

### História 6 — Usar no celular (Prioridade: P2)

**Cenários de aceitação**:

1. **Dado** uma tela estreita onde as 7 colunas não cabem, **Quando** abro o app,
   **Então** a tela já está rolada até a coluna de hoje.
2. **Dado** uma tela de até 570px, **Quando** vejo a navegação e o alternador, **Então**
   ambos estão visíveis e utilizáveis.

### Casos de borda

- **Virada da meia-noite com o app aberto**: ao voltar para a aba, a tela passa a mostrar o
  novo dia (e a janela de edição avança).
- **Virada do ano**: a semana de 28/12 a 03/01 mostra os dias na ordem certa, e 31/12 de um
  ano não se mistura com 31/12 de outro.
- **29/02 sem ano nos dados antigos**: é atribuído ao ano bissexto mais recente possível.
- **Hábito criado hoje**: aparece em todos os dias da semana; nos dias editáveis pode ser
  marcado retroativamente.
- **Sem hábitos ativos**: as colunas de dias aparecem só com as datas.

---

## Requisitos

### Requisitos funcionais

- **RF-001**: O sistema DEVE exibir automaticamente, ao abrir, a semana que contém o dia atual.
- **RF-002**: O sistema DEVE destacar a coluna do dia atual.
- **RF-003**: O sistema NÃO DEVE armazenar lista de dias; só as marcações (hábito × data) e
  a preferência de modo são salvas.
- **RF-004**: O usuário DEVE conseguir marcar e desmarcar hábitos de hoje e dos 6 dias
  anteriores.
- **RF-005**: O sistema DEVE impedir alterações em dias futuros e em dias com mais de 6 dias
  atrás, mantendo suas marcações visíveis.
- **RF-006**: O usuário DEVE conseguir navegar para semanas anteriores, sem limite, e voltar
  até a semana atual; não há navegação para semanas futuras.
- **RF-007**: O sistema DEVE exibir o período da semana exibida.
- **RF-008**: O usuário DEVE conseguir escolher o modo "Últimos 7 dias" (padrão) ou
  "Dom–Sáb"; a escolha DEVE ser lembrada.
- **RF-009**: As datas DEVEM ser guardadas com ano (corrige D-02).
- **RF-010**: O cabeçalho de cada dia DEVE mostrar o dia da semana e a data DD/MM.
- **RF-011**: O botão "Registrar o meu dia" DEVE ser removido.
- **RF-012**: Em telas estreitas, a tela DEVE abrir rolada até o dia atual.
- **RF-013**: Navegação, alternador e dias bloqueados DEVEM ser acessíveis por teclado e
  leitor de tela, com textos em pt-BR.

### Requisitos de compatibilidade

- **RC-001**: Todas as marcações existentes DEVEM ser preservadas, convertidas para datas com
  ano conforme o cenário 3.2.
- **RC-002**: A conversão DEVE ser automática na primeira abertura, sem alterar os dados
  das versões anteriores (que ficam como cópia de segurança).

### Entidades-chave

- **Marcação**: relação hábito × data completa (dia, mês, ano).
- **Preferência de semana**: "Últimos 7 dias" ou "Dom–Sáb".
- **Janela editável**: hoje e os 6 dias anteriores (calculada, não salva).

---

## Critérios de sucesso

- **CS-001**: Marcar um hábito de hoje leva 1 clique, sem nenhuma etapa de registro.
- **CS-002**: Marcar um hábito de até 6 dias atrás leva no máximo 1 clique (está na tela
  inicial no modo padrão).
- **CS-003**: 100% das marcações existentes aparecem no dia correto após a atualização.
- **CS-004**: Nenhum dia futuro ou com mais de 6 dias atrás pode ser alterado.

---

## Fora de escopo

- Calendário mensal ou escolha de data por seletor.
- Editar dias com mais de 6 dias atrás.
- Estatísticas (spec 003).

## Dependências e premissas

- Base: [001](../001-registro-de-habitos/spec.md) e [002](../002-habitos-personalizaveis/spec.md).
- **Substitui** a História 1 da spec 001 (registrar o dia) e a História 3 / RF-013 da
  spec 002 (dias registrados sem marcação persistem): com todos os dias exibidos
  automaticamente, não há mais dias "registrados".
- **Resolve** o débito D-02 (data sem ano), que bloqueava a spec 003.

---

## Checklist de qualidade da spec

- [x] Nenhum detalhe de implementação nos requisitos
- [x] Toda história tem cenários testáveis
- [x] Requisitos verificáveis e sem ambiguidade
- [x] Critérios de sucesso mensuráveis
- [x] Dados existentes considerados (RC-001, RC-002)
- [x] Nenhuma marcação `[NEEDS CLARIFICATION]` pendente
- [x] Conforme a [constituição](../../.specify/memory/constitution.md)

## Clarificações

| Data | Pergunta | Decisão |
|------|----------|---------|
| 2026-10-31 | Como ver e navegar pelos dias? | Grade de 7 colunas com setas ‹ › |
| 2026-10-31 | Até quando no passado pode registrar? | Hoje e os 6 dias anteriores |
| 2026-10-31 | Semanas mais antigas aparecem? | Sim, pelas setas, somente para consulta |
| 2026-10-31 | O que é a semana exibida? | O usuário escolhe: "Últimos 7 dias" (padrão) ou "Dom–Sáb" |
| 2026-10-31 | Onde escolher o modo? | Alternador junto às setas; escolha lembrada |
| 2026-10-31 | Dias futuros no modo Dom–Sáb? | Aparecem bloqueados |
| 2026-10-31 | Incluir o ano nas datas (D-02)? | Sim, com conversão automática |
| 2026-10-31 | Botão "Registrar o meu dia"? | Removido |
| 2026-10-31 | Celular: como mostrar hoje? | Abre rolado até hoje, ordem cronológica mantida |
