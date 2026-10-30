# Especificação da Feature: [NOME DA FEATURE]

**Branch**: `[NNN-nome-da-feature]`
**Criada em**: [AAAA-MM-DD]
**Status**: Rascunho <!-- Rascunho | Em clarificação | Aprovada | Implementada | Descartada -->
**Entrada**: descrição original do pedido: "[texto do pedido]"

> Esta spec descreve **o quê** e **por quê**. Não inclua tecnologia, nomes de funções,
> arquivos ou estrutura de código — isso pertence ao `plan.md`.
> Marque toda dúvida com `[NEEDS CLARIFICATION: pergunta]`. A spec só pode ser
> Aprovada quando não restar nenhuma marcação.

---

## Histórias de usuário e cenários de aceitação *(obrigatório)*

<!--
  Ordene por prioridade (P1 = mais importante). Cada história deve ser
  INDEPENDENTEMENTE testável: implementar só ela já entrega valor.
-->

### História 1 — [título curto] (Prioridade: P1)

[Descreva a jornada em linguagem simples: "Como usuário, quero … para …"]

**Por que esta prioridade**: [valor entregue e motivo da ordem]

**Teste independente**: [como verificar esta história isoladamente]

**Cenários de aceitação**:

1. **Dado** [estado inicial], **Quando** [ação], **Então** [resultado esperado]
2. **Dado** [estado inicial], **Quando** [ação], **Então** [resultado esperado]

---

### História 2 — [título curto] (Prioridade: P2)

[Descrição]

**Por que esta prioridade**: [motivo]

**Teste independente**: [como verificar]

**Cenários de aceitação**:

1. **Dado** [estado inicial], **Quando** [ação], **Então** [resultado esperado]

---

[Adicione mais histórias conforme necessário]

### Casos de borda

- O que acontece quando [condição limite]?
- Como o sistema se comporta quando [cenário de erro]?
- O que acontece com os dados já gravados pelo usuário?

---

## Requisitos *(obrigatório)*

### Requisitos funcionais

- **RF-001**: O sistema DEVE [capacidade específica]
- **RF-002**: O usuário DEVE conseguir [interação]
- **RF-003**: O sistema DEVE [requisito de dados/persistência]
- **RF-004**: O sistema DEVE [comportamento] [NEEDS CLARIFICATION: exemplo de dúvida]

### Requisitos de compatibilidade *(se houver dados existentes)*

- **RC-001**: Usuários com dados já gravados DEVEM [comportamento esperado]

### Entidades-chave *(se a feature envolver dados)*

- **[Entidade]**: [o que representa, atributos principais, sem implementação]

---

## Critérios de sucesso *(obrigatório)*

<!-- Mensuráveis e independentes de tecnologia. -->

- **CS-001**: [ex.: "O usuário conclui X em até 3 cliques"]
- **CS-002**: [ex.: "Nenhum dado existente é perdido após a atualização"]

---

## Fora de escopo

- [O que explicitamente NÃO será feito nesta feature]

## Dependências e premissas

- [Outras specs, débitos ou decisões das quais esta depende]

---

## Checklist de qualidade da spec

- [ ] Nenhum detalhe de implementação (tecnologia, arquivo, função)
- [ ] Toda história tem cenários *Dado/Quando/Então* testáveis
- [ ] Requisitos são verificáveis e sem ambiguidade
- [ ] Critérios de sucesso são mensuráveis
- [ ] Casos de borda e dados existentes foram considerados
- [ ] Nenhuma marcação `[NEEDS CLARIFICATION]` pendente
- [ ] Conforme a [constituição](../../.specify/memory/constitution.md)

## Clarificações

<!-- Registre aqui as perguntas resolvidas, com data. -->

| Data | Pergunta | Decisão |
|------|----------|---------|
| | | |
