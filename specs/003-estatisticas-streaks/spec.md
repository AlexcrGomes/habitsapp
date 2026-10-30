# Especificação da Feature: Estatísticas e streaks

**Branch**: `003-estatisticas-streaks`
**Criada em**: 2026-10-30
**Status**: Rascunho
**Entrada**: "Mostrar a sequência de dias (streak) e o percentual de conclusão de cada hábito."

> Próximo passo: resolver as marcações `[NEEDS CLARIFICATION]` e as dependências antes
> de aprovar. Só então escrever `plan.md` e `tasks.md`.

---

## Histórias de usuário e cenários de aceitação

### História 1 — Ver minha sequência atual (Prioridade: P1)

Como usuário, quero ver há quantos dias seguidos cumpro cada hábito para me manter
motivado.

**Por que esta prioridade**: a sequência é o principal fator de motivação em apps de
hábitos.

**Teste independente**: com marcações em dias seguidos, conferir o número exibido.

**Cenários de aceitação**:

1. **Dado** que marquei "água" hoje, ontem e anteontem, **Quando** vejo as estatísticas,
   **Então** a sequência atual de "água" é 3.
2. **Dado** que marquei "água" ontem mas ainda não hoje, **Quando** vejo as estatísticas,
   **Então** [NEEDS CLARIFICATION: a sequência continua valendo até o fim do dia de hoje,
   ou já é exibida como interrompida?]
3. **Dado** que nunca marquei um hábito, **Quando** vejo as estatísticas, **Então** a
   sequência dele é 0.
4. **Dado** um dia que não foi registrado no app, **Quando** a sequência é calculada,
   **Então** [NEEDS CLARIFICATION: o streak conta dias corridos do calendário (dia não
   registrado quebra a sequência) ou apenas os dias registrados?]

---

### História 2 — Ver meu recorde (Prioridade: P2)

Como usuário, quero ver a maior sequência que já alcancei em cada hábito.

**Teste independente**: com histórico contendo uma sequência antiga maior que a atual,
conferir que o recorde mostra a antiga.

**Cenários de aceitação**:

1. **Dado** que tive uma sequência de 7 dias no passado e hoje tenho 2, **Quando** vejo as
   estatísticas, **Então** o recorde é 7 e a sequência atual é 2.
2. **Dado** que a sequência atual supera o recorde, **Quando** vejo as estatísticas,
   **Então** o recorde é igual à sequência atual.

---

### História 3 — Ver o percentual de conclusão (Prioridade: P2)

Como usuário, quero saber com que frequência cumpro cada hábito.

**Cenários de aceitação**:

1. **Dado** 10 dias registrados no período e 7 marcações de "corrida", **Quando** vejo as
   estatísticas, **Então** a conclusão de "corrida" é 70%.
2. **Dado** o período escolhido, **Quando** a estatística é calculada, **Então** o período
   é [NEEDS CLARIFICATION: últimos 7 dias, últimos 30 dias, mês atual, todo o histórico,
   ou selecionável?]
3. **Dado** nenhum dia no período, **Quando** vejo as estatísticas, **Então** o
   percentual aparece como "—" (sem divisão por zero).

---

### História 4 — Consultar no celular (Prioridade: P3)

**Cenários de aceitação**:

1. **Dado** uma tela ≤570px, **Quando** vejo as estatísticas, **Então** todos os números
   ficam legíveis sem rolagem horizontal.
2. **Onde** as estatísticas aparecem: [NEEDS CLARIFICATION: junto a cada hábito na
   grade, em um painel/aba separado, ou ambos?]

### Casos de borda

- Virada de ano: dias de anos diferentes com mesmo dia/mês (débito D-02 da spec 001).
- Hábito criado recentemente (spec 002): o percentual considera só os dias após a criação?
- Hábito removido (spec 002): suas estatísticas somem ou ficam arquivadas?
- Dias registrados sem marcação que desaparecem ao recarregar (débito D-01) afetam o
  percentual.

---

## Requisitos

### Requisitos funcionais

- **RF-001**: O sistema DEVE exibir a sequência atual de cada hábito.
- **RF-002**: O sistema DEVE exibir o recorde de sequência de cada hábito.
- **RF-003**: O sistema DEVE exibir o percentual de conclusão de cada hábito no período
  definido.
- **RF-004**: As estatísticas DEVEM ser atualizadas imediatamente ao marcar ou desmarcar
  um hábito.
- **RF-005**: As estatísticas DEVEM ser calculadas a partir dos dados já salvos, sem
  exigir nenhuma ação do usuário.

### Requisitos de compatibilidade

- **RC-001**: O histórico existente DEVE gerar estatísticas corretas na primeira abertura
  após a atualização.

### Entidades-chave

- **Sequência**: quantidade de dias consecutivos com o hábito marcado, terminando hoje
  (ou ontem, conforme clarificação).
- **Recorde**: maior sequência já registrada para o hábito.
- **Taxa de conclusão**: dias marcados ÷ dias considerados no período.

---

## Critérios de sucesso

- **CS-001**: Os valores exibidos batem com a contagem manual em 100% dos cenários do
  checklist de verificação.
- **CS-002**: O usuário encontra a sequência de qualquer hábito sem sair da tela principal
  ou com no máximo 1 clique.

---

## Fora de escopo

- Gráficos históricos detalhados (calendário anual, heatmap) — spec futura.
- Notificações ou lembretes.
- Metas por hábito.

## Dependências e premissas

- **Bloqueante**: débito **D-02** (data sem ano) da
  [spec 001](../001-registro-de-habitos/spec.md#débitos-conhecidos). Sem o ano, sequências
  e percentuais ficam incorretos na virada do ano. Decidir se esta feature corrige o
  débito ou se ele vira uma spec própria antes desta.
- Recomendado implementar após [002-habitos-personalizaveis](../002-habitos-personalizaveis/spec.md),
  para que as estatísticas já considerem hábitos dinâmicos.
- Afetada pelo débito **D-01** (dias sem marcação não persistem).

---

## Checklist de qualidade da spec

- [x] Nenhum detalhe de implementação nos requisitos
- [x] Toda história tem cenários testáveis
- [ ] Requisitos sem ambiguidade (pendente: definição de streak e período)
- [x] Critérios de sucesso mensuráveis
- [x] Dados existentes considerados (RC-001)
- [ ] Nenhuma marcação `[NEEDS CLARIFICATION]` pendente
- [ ] Dependências bloqueantes resolvidas (D-02)
- [ ] Conforme a [constituição](../../.specify/memory/constitution.md)

## Clarificações

| Data | Pergunta | Decisão |
|------|----------|---------|
| | Streak conta dias corridos ou dias registrados? | |
| | Sequência de ontem vale até o fim de hoje? | |
| | Período do percentual? | |
| | Onde exibir as estatísticas? | |
| | D-02 é corrigido aqui ou em spec própria? | |
