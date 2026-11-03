# Especificação da Feature: Metas semanais por hábito

**Branch**: `006-metas-semanais`
**Criada em**: 2026-11-02
**Status**: Implementada em 2026-11-02 (aprovada em 2026-11-02)
**Entrada**: "Quero que o usuário coloque meta para cada hábito, que tenha um indicador de
como está cada meta de cada hábito configurado pelo usuário e também um campo geral onde
agrupa todas as metas cadastradas e diz como foi a semana de forma geral."

> Plano de implementação: [plan.md](./plan.md).

---

## Histórias de usuário e cenários de aceitação

### História 1 — Definir a meta de um hábito (Prioridade: P1)

Como usuário, quero dizer quantos dias por semana pretendo cumprir cada hábito, para ter um
objetivo claro.

**Por que esta prioridade**: sem meta não há o que acompanhar.

**Teste independente**: criar um hábito com meta de 3 dias, reabrir a edição e ver a meta
salva.

**Cenários de aceitação**:

1. **Dado** o diálogo de novo hábito, **Quando** escolho "3 dias por semana" e salvo,
   **Então** o hábito é criado com meta de 3 dias.
2. **Dado** o diálogo de novo hábito, **Quando** não mexo na meta, **Então** o hábito é
   criado **sem meta** (a meta é opcional).
3. **Dado** um hábito com meta, **Quando** edito e escolho outra quantidade ou "Sem meta",
   **Então** a mudança é salva.
4. **Dado** qualquer meio de envio, **Quando** a meta não é "sem meta" nem um número de 1 a
   7, **Então** ela é recusada com "A meta deve ser de 1 a 7 dias por semana."

---

### História 2 — Ver o progresso de cada meta (Prioridade: P1)

Como usuário, quero ver em cada hábito quanto já cumpri da meta na semana exibida.

**Teste independente**: hábito com meta 4 e 2 dias marcados mostra a barra pela metade.

**Cenários de aceitação**:

1. **Dado** um hábito com meta de 4 dias e 2 dias marcados na semana exibida, **Quando**
   vejo a tela, **Então** a barra de progresso do hábito está em 50%.
2. **Dado** que marco ou desmarco um dia, **Quando** a marcação muda, **Então** a barra se
   atualiza na hora.
3. **Dado** que marquei mais dias do que a meta, **Quando** vejo a barra, **Então** ela está
   cheia (100%), sem passar disso.
4. **Dado** um hábito sem meta, **Quando** vejo a tela, **Então** ele não tem barra.
5. **Dado** um leitor de tela, **Quando** chego à barra, **Então** ouço o hábito e o
   progresso, por exemplo "Correr: 2 de 4 dias".

---

### História 3 — Resumo geral da semana (Prioridade: P1)

Como usuário, quero um resumo que junte todas as minhas metas e diga como foi a semana.

**Teste independente**: com duas metas, conferir o percentual e a frase do resumo.

**Cenários de aceitação**:

1. **Dado** hábitos com meta na semana exibida, **Quando** vejo a tela, **Então** acima da
   grade aparece um resumo com o **percentual geral** e uma **frase de avaliação**.
2. **Dado** o percentual geral, **Quando** a frase é escolhida, **Então** vale:
   100% "Semana perfeita"; de 70% a 99% "Boa semana"; de 40% a 69% "Dá para melhorar";
   abaixo de 40% "Semana fraca".
3. **Dado** meta de 4 com 2 feitos e meta de 2 com 3 feitos, **Quando** o percentual geral
   é calculado, **Então** é (2 + 2) ÷ (4 + 2) = 67% — cada meta conta no máximo o próprio
   tamanho, e metas maiores pesam mais.
4. **Dado** que a semana exibida inclui hoje, **Quando** vejo o resumo, **Então** ele traz o
   rótulo "Até agora", porque a semana ainda não acabou.
5. **Dado** uma semana passada, **Quando** navego até ela, **Então** o resumo mostra como
   aquela semana terminou, sem o rótulo "Até agora".
6. **Dado** nenhum hábito com meta na semana exibida, **Quando** vejo a tela, **Então** o
   resumo convida a definir metas nos hábitos, sem percentual.
7. **Dado** um hábito arquivado, **Quando** o resumo é calculado, **Então** ele não entra.

---

### História 4 — Mudar a meta não reescreve o passado (Prioridade: P2)

Como usuário, quero poder ajustar uma meta sem alterar como foram as semanas anteriores.

**Teste independente**: mudar a meta de 3 para 5 e conferir que a semana passada continua
avaliada com 3.

**Cenários de aceitação**:

1. **Dado** um hábito com meta 3 há semanas, **Quando** mudo a meta para 5 hoje, **Então** a
   semana exibida atual passa a usar 5 e as semanas anteriores continuam usando 3.
2. **Dado** que mudo a meta mais de uma vez no mesmo dia, **Quando** vejo qualquer semana,
   **Então** vale só a última escolha daquele dia.
3. **Dado** uma semana em que o hábito ainda não tinha meta, **Quando** navego até ela,
   **Então** o hábito aparece sem barra e não entra no resumo dessa semana.
4. **Dado** um hábito criado no meio da semana com meta, **Quando** vejo essa semana,
   **Então** ele conta com a meta inteira.

### Casos de borda

- **Qual meta vale numa janela de 7 dias**: a meta passa a valer no dia em que foi definida
  ou alterada; cada semana exibida usa a meta que valia no **último dia exibido**. Isso
  resolve o modo "Últimos 7 dias", que cruza duas semanas do calendário.
- **Semana Dom–Sáb atual**: os dias futuros não contam como falha; o resumo mostra
  "Até agora".
- **Hábito restaurado do arquivo**: volta com a meta que tinha.
- **Celular (≤570px)**: barra e resumo legíveis, sem rolagem horizontal da página.
- **Dados existentes**: hábitos atuais começam sem meta; marcações não mudam.

---

## Requisitos

### Requisitos funcionais

- **RF-001**: O usuário DEVE conseguir definir, alterar ou remover a meta de cada hábito ao
  criá-lo ou editá-lo.
- **RF-002**: A meta DEVE ser opcional e, quando existir, ser um número inteiro de dias por
  semana, de 1 a 7.
- **RF-003**: Cada hábito com meta DEVE mostrar uma barra de progresso da semana exibida:
  dias marcados ÷ meta, limitada a 100%.
- **RF-004**: A barra e o resumo DEVEM se atualizar imediatamente ao marcar ou desmarcar.
- **RF-005**: O app DEVE mostrar, acima da grade, um resumo da semana exibida com o
  percentual geral (soma dos dias cumpridos, cada meta limitada ao seu tamanho, dividida
  pela soma das metas) e a frase de avaliação das faixas da História 3.
- **RF-006**: O resumo DEVE indicar "Até agora" quando a semana exibida inclui hoje.
- **RF-007**: Hábitos sem meta e hábitos arquivados NÃO DEVEM entrar no resumo.
- **RF-008**: Mudanças de meta DEVEM valer a partir do dia em que são feitas; semanas
  anteriores continuam avaliadas com a meta da época.
- **RF-009**: As metas DEVEM pertencer ao usuário dono do hábito e ser acessíveis somente
  por ele.
- **RF-010**: Textos em pt-BR; barra e resumo acessíveis por leitor de tela.

### Requisitos de compatibilidade

- **RC-001**: Hábitos e marcações existentes DEVEM continuar iguais após a atualização;
  hábitos existentes começam sem meta.

### Entidades-chave

- **Meta semanal**: pertence a um hábito; quantidade de dias por semana (1 a 7) ou "sem
  meta"; data a partir da qual vale. Um hábito tem um histórico de metas.
- **Progresso da meta**: dias marcados na semana exibida ÷ meta vigente, até 100%.
- **Resumo da semana**: percentual geral e frase de avaliação da semana exibida.

---

## Critérios de sucesso

- **CS-001**: Definir a meta de um hábito leva no máximo 1 campo a mais no diálogo que já
  existe.
- **CS-002**: Barra e resumo batem com a contagem manual em 100% dos cenários do checklist.
- **CS-003**: Mudar uma meta não altera o resultado de nenhuma semana anterior.
- **CS-004**: 0 casos em que um usuário vê ou altera metas de outro (testes automatizados).

---

## Fora de escopo

- Metas por dias específicos da semana (ex.: seg, qua e sex) ou por mês.
- Sequências (streaks), recordes e percentuais longos — continuam na
  [spec 003](../003-estatisticas-streaks/spec.md).
- Notificações, lembretes ou conquistas.
- Gráficos históricos de várias semanas.

## Dependências e premissas

- Constituição **2.0.0**.
- Comportamento base: specs [002](../002-habitos-personalizaveis/spec.md),
  [004](../004-calendario-semanal/spec.md) e [005](../005-contas-e-servidor/spec.md)
  (semana exibida, modos de semana, isolamento por usuário).

---

## Checklist de qualidade da spec

- [x] Nenhum detalhe de implementação nos requisitos
- [x] Toda história tem cenários testáveis
- [x] Requisitos verificáveis e sem ambiguidade
- [x] Critérios de sucesso mensuráveis
- [x] Casos de borda e dados existentes considerados (RC-001)
- [x] Nenhuma marcação `[NEEDS CLARIFICATION]` pendente
- [x] Conforme a [constituição](../../.specify/memory/constitution.md) 2.0.0

## Clarificações

| Data | Pergunta | Decisão |
|------|----------|---------|
| 2026-11-02 | Formato da meta? | N dias por semana, de 1 a 7 |
| 2026-11-02 | A meta é obrigatória? | Opcional; sem meta não há barra nem entrada no resumo |
| 2026-11-02 | Qual semana é avaliada? | A semana exibida (setas e modo de semana) |
| 2026-11-02 | Indicador por hábito? | Barra de progresso |
| 2026-11-02 | O que o resumo mostra? | Percentual geral e frase de avaliação |
| 2026-11-02 | Onde fica o resumo? | Card acima da grade |
| 2026-11-02 | Faixas da frase? | 100% / ≥70% / ≥40% / <40% |
| 2026-11-02 | Semana em andamento? | Parcial, com o rótulo "Até agora" |
| 2026-11-02 | Marcar além da meta? | Barra cheia, sem bônus no percentual geral |
| 2026-11-02 | Mudança de meta e semanas passadas? | Guarda a meta da época |
| 2026-11-02 | Hábito criado no meio da semana? | Entra com a meta cheia |
| 2026-11-02 | Qual meta vale numa janela que cruza semanas? | A vigente no último dia exibido; a meta vale a partir do dia em que é definida |
| 2026-11-02 | Como pesar metas diferentes no geral? | Soma dos cumpridos ÷ soma das metas (metas maiores pesam mais) |
