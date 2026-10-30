# Especificação da Feature: Hábitos personalizáveis

**Branch**: `002-habitos-personalizaveis`
**Criada em**: 2026-10-30
**Status**: Aprovada em 2026-10-30
**Entrada**: "Permitir que o usuário crie, edite e remova os próprios hábitos em vez dos 5 fixos."

> Plano de implementação: [plan.md](./plan.md).

---

## Histórias de usuário e cenários de aceitação

### História 1 — Criar um hábito (Prioridade: P1)

Como usuário, quero adicionar um hábito meu (ex.: "Meditar 🧘") para acompanhar o que é
importante para mim.

**Por que esta prioridade**: é o núcleo da feature; sem criar, não há personalização.

**Teste independente**: criar um hábito e vê-lo na lista, com um campo marcável em cada
dia registrado.

**Cenários de aceitação**:

1. **Dado** a lista de hábitos, **Quando** crio um hábito informando nome e emoji,
   **Então** ele aparece ao final da lista e em todos os dias registrados, desmarcado.
2. **Dado** que criei um hábito sem escolher emoji, **Quando** confirmo, **Então** ele é
   criado e representado pela primeira letra do nome, em maiúscula.
3. **Dado** que tentei criar um hábito sem nome (ou só com espaços), **Quando** confirmo,
   **Então** vejo uma mensagem pedindo o nome e nada é criado.
4. **Dado** que digito um nome com mais de 30 caracteres, **Quando** tento confirmar,
   **Então** não consigo ultrapassar o limite e vejo quantos caracteres restam.
5. **Dado** que já existe um hábito **ativo** com o mesmo nome, **Quando** tento criá-lo,
   **Então** sou avisado e nada é criado.
6. **Dado** que existe um hábito **arquivado** com o mesmo nome, **Quando** tento criá-lo,
   **Então** o app oferece restaurar o arquivado em vez de criar um duplicado.
7. **Dado** que já tenho 10 hábitos ativos, **Quando** tento criar outro, **Então** a
   criação fica indisponível e vejo uma mensagem explicando o limite.
8. **Dado** que criei um hábito, **Quando** recarrego a página, **Então** ele continua lá.

---

### História 2 — Começar do zero e manter meus dados atuais (Prioridade: P1)

Como usuário novo, quero começar com uma lista vazia e montar meus próprios hábitos; como
usuário que já usa o app, quero que meus 5 hábitos e todo o histórico continuem iguais.

**Por que esta prioridade**: perder histórico viola o Princípio III da constituição, e o
primeiro uso define a experiência de quem chega.

**Teste independente**: abrir a nova versão (a) em um navegador sem dados e (b) com dados
da versão atual.

**Cenários de aceitação**:

1. **Dado** que nunca usei o app neste navegador, **Quando** abro pela primeira vez,
   **Então** vejo a lista de hábitos vazia e um convite para criar o primeiro hábito.
2. **Dado** que tenho histórico da versão atual, **Quando** abro a nova versão, **Então**
   vejo os mesmos 5 hábitos, na mesma ordem e com os mesmos emojis, com todas as marcações.
3. **Dado** que não há hábitos ativos, **Quando** clico em "Registrar o meu dia", **Então**
   o dia é registrado normalmente e mostrado sem campos até que um hábito seja criado.

---

### História 3 — Manter os dias registrados mesmo sem marcações (Prioridade: P1)

Como usuário, quero que um dia registrado continue aparecendo mesmo que eu ainda não tenha
marcado nenhum hábito nele. (Corrige o débito **D-01** da spec 001.)

**Por que esta prioridade**: hoje o usuário perde dias registrados; com hábitos
personalizáveis e lista vazia no primeiro uso, isso ficaria ainda mais frequente.

**Teste independente**: registrar o dia sem marcar nada e recarregar.

**Cenários de aceitação**:

1. **Dado** que registrei o dia de hoje sem marcar nenhum hábito, **Quando** recarrego a
   página, **Então** o dia continua na tela.
2. **Dado** um dia com marcações, **Quando** desmarco todos os hábitos e recarrego,
   **Então** o dia continua na tela, sem marcações.

---

### História 4 — Editar um hábito (Prioridade: P2)

Como usuário, quero corrigir o nome ou trocar o emoji de um hábito sem perder o histórico.

**Teste independente**: editar um hábito com marcações e conferir que elas permanecem.

**Cenários de aceitação**:

1. **Dado** um hábito com marcações, **Quando** altero seu nome ou emoji, **Então** a
   lista mostra o novo nome/emoji e todas as marcações anteriores continuam.
2. **Dado** que altero o nome para o de outro hábito ativo ou arquivado, **Quando**
   confirmo, **Então** sou avisado e nada muda.
3. **Dado** que removo o emoji de um hábito, **Quando** confirmo, **Então** ele passa a
   ser representado pela primeira letra do nome.

---

### História 5 — Arquivar e restaurar um hábito (Prioridade: P2)

Como usuário, quero tirar da tela um hábito que deixei de acompanhar, sem perder o
histórico, e poder trazê-lo de volta depois.

**Teste independente**: arquivar um hábito com marcações, conferir que sumiu, restaurar e
conferir que as marcações voltaram.

**Cenários de aceitação**:

1. **Dado** um hábito ativo, **Quando** peço para arquivá-lo, **Então** o app pede
   confirmação explicando que ele sairá da tela, mas o histórico será guardado.
2. **Dado** que confirmei o arquivamento, **Quando** a tela é atualizada, **Então** o
   hábito não aparece mais na lista nem nos dias, e passa a constar na lista de arquivados.
3. **Dado** um hábito arquivado, **Quando** peço para restaurá-lo, **Então** ele volta ao
   final da lista de ativos com todas as marcações anteriores.
4. **Dado** que já tenho 10 hábitos ativos, **Quando** tento restaurar um arquivado,
   **Então** a restauração fica indisponível e vejo uma mensagem explicando o limite.
5. **Dado** que não há hábitos arquivados, **Quando** procuro a lista de arquivados,
   **Então** ela não é exibida ou aparece com a mensagem "Nenhum hábito arquivado".

---

### História 6 — Excluir definitivamente um hábito arquivado (Prioridade: P3)

Como usuário, quero apagar de vez um hábito arquivado que não pretendo mais usar.

**Teste independente**: excluir um arquivado e conferir que ele e suas marcações não
existem mais, nem após recarregar.

**Cenários de aceitação**:

1. **Dado** um hábito arquivado, **Quando** escolho "Excluir definitivamente", **Então** o
   app pede confirmação avisando que o histórico será perdido e não poderá ser recuperado.
2. **Dado** que confirmei a exclusão, **Quando** recarrego a página, **Então** o hábito e
   suas marcações não existem mais, e o nome fica livre para um novo hábito.
3. **Dado** um hábito **ativo**, **Quando** procuro a opção de exclusão, **Então** ela não
   está disponível; é preciso arquivá-lo antes.

---

### História 7 — Reordenar hábitos (Prioridade: P3)

Como usuário, quero organizar meus hábitos na ordem que faz sentido para mim.

**Teste independente**: mudar a ordem, recarregar e conferir que a nova ordem se mantém.

**Cenários de aceitação**:

1. **Dado** a lista de hábitos ativos, **Quando** arrasto um hábito para outra posição
   (mouse ou toque), **Então** ele passa a ocupar essa posição na lista e nos dias.
2. **Dado** um hábito com foco, **Quando** uso os botões "subir" e "descer", **Então** ele
   se move uma posição, e os botões funcionam por teclado e leitor de tela.
3. **Dado** o primeiro hábito da lista, **Quando** vejo seus controles, **Então** "subir"
   está indisponível; o mesmo vale para "descer" no último.
4. **Dado** que reordenei, **Quando** recarrego a página, **Então** a nova ordem se mantém.
5. **Dado** que reordenei, **Quando** vejo as marcações, **Então** cada marcação continua
   com o seu hábito.

---

### Casos de borda

- Arquivar o último hábito ativo: a tela volta ao estado de lista vazia com convite para
  criar (cenário 2.1), e os dias registrados continuam visíveis sem campos.
- Nome com espaços no início/fim: os espaços são desconsiderados (" Ler " = "Ler").
- Comparação de nomes duplicados não diferencia maiúsculas/minúsculas ("Ler" = "ler").
- Nome longo (até 30 caracteres) em telas ≤570px: exibido truncado com "…", e o nome
  completo fica disponível ao focar ou passar o mouse.
- Emoji composto (ex.: 👩‍💻, bandeiras) deve ser exibido como um único símbolo.
- Restaurar um hábito cujo nome foi liberado por exclusão definitiva não se aplica (o
  excluído não existe mais).

---

## Requisitos

### Requisitos funcionais

- **RF-001**: O usuário DEVE conseguir criar um hábito informando nome (obrigatório) e
  emoji (opcional).
- **RF-002**: Hábito sem emoji DEVE ser representado pela primeira letra do nome, em
  maiúscula.
- **RF-003**: O nome DEVE ter de 1 a 30 caracteres, desconsiderando espaços no início e
  no fim.
- **RF-004**: O sistema DEVE impedir nomes duplicados entre hábitos ativos e arquivados,
  sem diferenciar maiúsculas/minúsculas; ao criar com nome de um arquivado, DEVE oferecer
  restaurá-lo.
- **RF-005**: O sistema DEVE permitir no máximo **10 hábitos ativos**; arquivados não
  contam no limite.
- **RF-006**: O usuário DEVE conseguir editar nome e emoji de um hábito sem perder suas
  marcações.
- **RF-007**: O usuário DEVE conseguir arquivar um hábito ativo, com confirmação prévia;
  o histórico é preservado.
- **RF-008**: O usuário DEVE conseguir ver a lista de hábitos arquivados e restaurar
  qualquer um deles, respeitando o limite de RF-005; o restaurado volta ao final da lista.
- **RF-009**: O usuário DEVE conseguir excluir definitivamente um hábito **arquivado**,
  com confirmação que avisa sobre a perda irreversível do histórico.
- **RF-010**: O usuário DEVE conseguir reordenar os hábitos ativos arrastando (mouse e
  toque) **e** por botões subir/descer acessíveis por teclado.
- **RF-011**: Um hábito novo ou restaurado DEVE aparecer em todos os dias já registrados.
- **RF-012**: Hábitos (ativos e arquivados), sua ordem e os dias registrados DEVEM ser
  salvos no navegador e restaurados ao abrir a página.
- **RF-013**: Um dia registrado DEVE permanecer salvo mesmo sem nenhuma marcação
  (corrige D-01).
- **RF-014**: No primeiro uso (sem dados anteriores), a lista de hábitos DEVE começar vazia,
  com um convite para criar o primeiro hábito.
- **RF-015**: Todas as ações (criar, editar, arquivar, restaurar, excluir, reordenar) DEVEM
  ser utilizáveis por teclado e em telas ≤570px, com textos em pt-BR.

### Requisitos de compatibilidade

- **RC-001**: Usuários com dados da versão atual DEVEM manter os 5 hábitos (mesmos nomes
  internos, emojis e ordem) e todas as marcações, sem nenhuma ação manual.
- **RC-002**: Se o formato dos dados salvos mudar, a conversão DEVE acontecer
  automaticamente na primeira abertura, sem perda de dados.
- **RC-003**: Os dias que hoje existem nos dados salvos DEVEM continuar existindo após a
  conversão.

### Entidades-chave

- **Hábito**: identificador único e estável (não muda ao editar o nome), nome exibido,
  emoji opcional, posição na lista, situação (ativo ou arquivado).
- **Dia registrado**: data registrada pelo usuário; existe independentemente de ter
  marcações.
- **Marcação**: relação hábito × dia, vinculada ao identificador do hábito.

---

## Critérios de sucesso

- **CS-001**: Criar um hábito leva no máximo 3 interações (abrir, preencher, confirmar).
- **CS-002**: 100% do histórico de usuários existentes é preservado após a atualização.
- **CS-003**: Editar, reordenar, arquivar e restaurar preservam 100% das marcações.
- **CS-004**: Todas as ações da feature podem ser concluídas usando somente o teclado.
- **CS-005**: Nenhum dia registrado desaparece ao recarregar a página.

---

## Fora de escopo

- Metas por hábito (ex.: "3 vezes por semana") — spec futura.
- Estatísticas — ver [003-estatisticas-streaks](../003-estatisticas-streaks/spec.md).
- Excluir definitivamente um hábito **ativo** sem arquivar antes.
- Reordenar hábitos arquivados.
- Débito **D-02** (data sem ano) — tratado junto com a spec 003 ou em spec própria.
- Sincronização entre dispositivos.

## Dependências e premissas

- Base: comportamento descrito em [001-registro-de-habitos](../001-registro-de-habitos/spec.md).
- Ao concluir esta feature, o item **R-11** do checklist de regressão da spec 001 deve ser
  atualizado: o dia sem marcação passa a persistir.
- **Risco para o plan**: na versão atual a lista de hábitos vem fixa da página e a
  biblioteca usada só a lê na inicialização; ela também só salva marcações, não dias. O
  `plan.md` deve avaliar se a biblioteca suporta esses comportamentos ou se precisa ser
  substituída (o que exige justificativa pelo Princípio II).

---

## Checklist de qualidade da spec

- [x] Nenhum detalhe de implementação nos requisitos
- [x] Toda história tem cenários testáveis
- [x] Requisitos verificáveis e sem ambiguidade
- [x] Critérios de sucesso mensuráveis
- [x] Dados existentes considerados (RC-001 a RC-003)
- [x] Nenhuma marcação `[NEEDS CLARIFICATION]` pendente
- [x] Conforme a [constituição](../../.specify/memory/constitution.md) — reordenação
      acessível por teclado (Princípio IV), migração automática (Princípio III)

## Clarificações

| Data | Pergunta | Decisão |
|------|----------|---------|
| 2026-10-30 | Primeiro uso: hábitos padrão ou lista vazia? | Lista vazia com convite; usuários existentes mantêm os 5 hábitos (RC-001) |
| 2026-10-30 | Remoção: apagar ou arquivar o histórico? | Arquivar, com possibilidade de restaurar (História 5) |
| 2026-10-30 | Exclusão definitiva entra nesta feature? | Sim, apenas para hábitos arquivados, com confirmação (História 6) |
| 2026-10-30 | Reordenar entra nesta feature? | Sim, arrastando + botões subir/descer para teclado (História 7) |
| 2026-10-30 | Limite de hábitos? | 10 ativos; arquivados não contam |
| 2026-10-30 | Nome igual ao de um arquivado? | Bloqueado; o app oferece restaurar o arquivado |
| 2026-10-30 | Tamanho máximo do nome? | 30 caracteres; truncado com "…" no celular |
| 2026-10-30 | Hábito sem emoji é permitido? | Sim; exibe a primeira letra do nome em maiúscula |
| 2026-10-30 | Corrigir o débito D-01 junto? | Sim (História 3) |
