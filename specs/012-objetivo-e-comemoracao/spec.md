# Especificação da Feature: Objetivo do hábito e comemoração ao bater a meta

**Branch**: `012-objetivo-e-comemoracao`
**Criada em**: 2026-11-23
**Status**: Aprovada em 2026-11-23; implementada (sem commit) e verificada em parte no navegador. Passa para
**Implementada** depois dos itens pendentes do checklist em [tasks.md](./tasks.md) <!-- Rascunho | Em clarificação | Aprovada | Implementada | Descartada -->
**Plano**: [plan.md](./plan.md) | **Tarefas**: [tasks.md](./tasks.md)
**Entrada**: descrição original do pedido: "quero criar algumas novas funcionalidades: cada meta
ter uma meta a bater, como uma observação, exemplo: habito de ler: ler pelo menos 10 paginas,
habito de correr, pelo menos 5km. não precisa validar nada, serve apenas como meta estipulada
para o usuario se desafiar; tambem quero uma animação de comemoração ao atingir a meta de cada
habito, como forma de estimular e parabenizar o usuario"

> Esta spec descreve **o quê** e **por quê**. Não inclua tecnologia, nomes de funções,
> arquivos ou estrutura de código — isso pertence ao `plan.md`.

**Termos usados nesta spec**:

- **Objetivo**: texto livre e opcional do hábito que descreve o que conta como cumprir o
  hábito num dia (ex.: "Ler pelo menos 10 páginas", "Correr pelo menos 5 km"). O app não
  confere nem mede o objetivo; ele só lembra o usuário do desafio que ele mesmo se deu.
- **Meta semanal**: a quantidade de dias por semana (1 a 7) já existente desde a
  [spec 006](../006-metas-semanais/spec.md).
- **Bater a meta**: uma marcação faz os dias marcados do hábito na semana exibida chegarem à
  meta semanal vigente.

---

## Histórias de usuário e cenários de aceitação

### História 1 — Definir o objetivo de um hábito (Prioridade: P1)

Como usuário, quero escrever o objetivo de cada hábito (ex.: "Ler pelo menos 10 páginas")
para lembrar do desafio que me propus toda vez que marcar o dia.

**Por que esta prioridade**: é a base da feature e entrega valor sozinha, sem a comemoração.

**Teste independente**: criar o hábito "Ler" com o objetivo "Ler pelo menos 10 páginas",
recarregar a página e ver o objetivo salvo na edição e na tela principal.

**Cenários de aceitação**:

1. **Dado** o diálogo de novo hábito, **Quando** preencho o objetivo "Ler pelo menos 10
   páginas" e salvo, **Então** o hábito é criado com esse objetivo.
2. **Dado** o diálogo de novo hábito, **Quando** deixo o objetivo vazio, **Então** o hábito é
   criado sem objetivo (o objetivo é opcional).
3. **Dado** um hábito com objetivo, **Quando** edito e mudo ou apago o texto, **Então** a
   mudança é salva.
4. **Dado** que digito o objetivo, **Quando** passo de 60 caracteres, **Então** não consigo
   ultrapassar o limite e vejo quantos caracteres restam.
5. **Dado** qualquer meio de envio, **Quando** o objetivo tem mais de 60 caracteres,
   **Então** ele é recusado com "O objetivo deve ter no máximo 60 caracteres."
6. **Dado** um objetivo só com espaços, **Quando** salvo, **Então** o hábito fica sem
   objetivo; espaços no início e no fim são descartados.
7. **Dado** um hábito arquivado com objetivo, **Quando** o restauro, **Então** ele volta com o
   mesmo objetivo.

---

### História 2 — Ver o objetivo na tela principal (Prioridade: P1)

Como usuário, quero ver o objetivo do hábito na tela principal, para saber o que preciso fazer
antes de marcar o dia.

**Por que esta prioridade**: sem aparecer na tela principal, o objetivo fica esquecido no
formulário.

**Teste independente**: com um hábito com objetivo, conferir no computador (texto visível
abaixo do nome) e no celular (texto visível só ao tocar no hábito).

**Cenários de aceitação**:

1. **Dado** um hábito com objetivo no computador (tela maior que 570px), **Quando** vejo a
   tela principal, **Então** o objetivo aparece abaixo do nome, em texto menor.
2. **Dado** um objetivo que não cabe na largura da coluna no computador, **Quando** vejo a
   tela, **Então** ele é cortado com reticências e o texto completo aparece ao passar o mouse.
3. **Dado** um hábito com objetivo no celular (tela até 570px), **Quando** vejo a tela
   principal, **Então** o objetivo não aparece na linha do hábito.
4. **Dado** um hábito com objetivo no celular, **Quando** toco no emoji ou no nome do hábito,
   **Então** abre um balão junto ao hábito com o nome, o objetivo completo e o botão "Editar".
5. **Dado** o balão aberto, **Quando** toco em "Editar", **Então** o balão fecha e abre a
   edição do hábito, como o toque fazia antes desta spec.
6. **Dado** o balão aberto, **Quando** toco fora dele, aperto Esc ou toco em outro hábito,
   **Então** o balão fecha (no outro hábito, abre o balão dele); só um balão fica aberto por
   vez e ele não bloqueia as marcações.
7. **Dado** um hábito **sem** objetivo no celular, **Quando** toco no emoji ou no nome,
   **Então** a edição abre direto, como hoje (não há balão vazio).
8. **Dado** o computador, **Quando** clico no hábito (com ou sem objetivo), **Então** a edição
   abre direto, como hoje — o objetivo já está visível abaixo do nome.
9. **Dado** um hábito sem objetivo, **Quando** vejo a tela (computador ou celular), **Então**
   nada muda em relação a hoje.
10. **Dado** um leitor de tela, **Quando** chego ao hábito, **Então** ouço o nome e o
    objetivo, em qualquer tamanho de tela; o balão e o botão "Editar" funcionam pelo teclado,
    e o foco volta ao hábito quando o balão fecha.

---

### História 3 — Comemorar ao bater a meta semanal do hábito (Prioridade: P1)

Como usuário, quero ver uma comemoração quando a marcação de um dia faz o hábito bater a meta
da semana, para me sentir recompensado e estimulado a continuar.

**Por que esta prioridade**: é o estímulo pedido; depende só da meta semanal, que já existe.

**Teste independente**: com o hábito "Correr" com meta de 3 dias e 2 dias marcados, marcar o
3º dia e ver a comemoração; desmarcar e marcar um 4º dia não deve comemorar de novo.

**Cenários de aceitação**:

1. **Dado** um hábito com meta de 3 dias e 2 dias marcados na semana exibida, **Quando**
   marco o 3º dia, **Então** aparece uma animação de comemoração com uma mensagem de
   parabéns que cita o hábito (ex.: "Parabéns! Você bateu a meta de Correr nesta semana.").
2. **Dado** a comemoração na tela, **Quando** passam poucos segundos ou toco/clico fora dela
   ou aperto Esc, **Então** ela some, sem eu precisar fazer nada.
3. **Dado** a comemoração na tela, **Quando** ela aparece, **Então** a marcação já está salva
   e consigo continuar marcando outros dias normalmente; a comemoração não atrasa nem bloqueia
   o registro.
4. **Dado** um hábito que já bateu a meta na semana exibida, **Quando** marco mais um dia
   além da meta, **Então** não há nova comemoração.
5. **Dado** um hábito que bateu a meta, **Quando** desmarco um dia (fica abaixo da meta) e
   marco de novo, **Então** a comemoração aparece de novo.
6. **Dado** um hábito sem meta semanal, **Quando** marco qualquer dia, **Então** não há
   comemoração.
7. **Dado** a semana anterior exibida (que a spec 010 permite editar), **Quando** a marcação
   bate a meta daquela semana, **Então** a comemoração aparece e cita a semana passada (ex.:
   "… na semana passada.").
8. **Dado** que abro o app, troco de semana ou recarrego a página com metas já batidas,
   **Quando** a tela aparece, **Então** não há comemoração — ela só acontece no momento da
   marcação.
9. **Dado** um hábito com objetivo, **Quando** a comemoração aparece, **Então** a mensagem
   pode lembrar o objetivo cumprido. [Decisão de texto no plan; não é obrigatório.]

---

### História 4 — Comemoração especial da semana perfeita (Prioridade: P2)

Como usuário, quero uma comemoração maior quando bato todas as metas da semana, para
celebrar a "Semana perfeita".

**Por que esta prioridade**: reforça o estímulo, mas depende da História 3.

**Teste independente**: com dois hábitos com meta, bater a primeira (comemoração normal) e
depois a segunda (comemoração especial).

**Cenários de aceitação**:

1. **Dado** hábitos com meta na semana exibida e o resumo abaixo de 100%, **Quando** a
   marcação leva o resumo da semana a 100% ("Semana perfeita"), **Então** aparece uma
   comemoração especial, maior e diferente da comemoração do hábito, com uma mensagem como
   "Semana perfeita! Você bateu todas as metas da semana."
2. **Dado** que a mesma marcação bate a meta do hábito e completa a semana, **Quando** a
   comemoração aparece, **Então** só a comemoração especial é mostrada (não as duas).
3. **Dado** um único hábito com meta, **Quando** bato a meta dele, **Então** a comemoração é
   a especial (o resumo foi a 100%).
4. **Dado** a semana já em 100%, **Quando** marco mais dias, **Então** não há nova
   comemoração; se desmarcar (cair de 100%) e voltar a 100%, comemora de novo.

---

### História 5 — Comemoração acessível e respeitando "reduzir movimento" (Prioridade: P1)

Como usuário que usa leitor de tela ou pede menos movimento no sistema, quero receber os
parabéns sem animação incômoda.

**Por que esta prioridade**: exigência da constituição (Princípio IV).

**Teste independente**: repetir as Histórias 3 e 4 com "reduzir movimento" ativado e com
leitor de tela.

**Cenários de aceitação**:

1. **Dado** que o sistema pede "reduzir movimento", **Quando** bato uma meta, **Então** não
   há animação de movimento; a mensagem de parabéns aparece parada e some sozinha.
2. **Dado** um leitor de tela, **Quando** bato uma meta, **Então** a mensagem de parabéns é
   anunciada sem tirar o foco do campo que marquei.
3. **Dado** a comemoração, **Quando** ela aparece, **Então** dura poucos segundos, não pisca
   mais de 3 vezes por segundo e não toca som.

### Casos de borda

- **Marcação que falha no servidor**: se a marcação não for salva (erro ou sem conexão), a
  marcação volta ao estado anterior como hoje e não há comemoração; se a comemoração já tinha
  aparecido, ela some.
- **Marcações muito rápidas**: marcar vários dias em sequência nunca empilha comemorações;
  aparece no máximo uma por vez (a mais recente substitui a anterior).
- **Mudança de meta**: se o usuário diminui a meta e os dias já marcados passam a bater a nova
  meta, não há comemoração — ela só acontece ao marcar um dia.
- **Modo "Últimos 7 dias"** (spec 004): vale a meta vigente no último dia exibido, como no
  resumo da spec 006.
- **Hábito arquivado**: não entra na conta da semana perfeita, como no resumo atual.
- **Celular (≤570px)**: a comemoração cabe na tela, sem rolagem horizontal, e não cobre o
  campo marcado de forma a impedir desmarcá-lo.
- **Dados existentes**: hábitos atuais começam sem objetivo; metas e marcações não mudam.

---

## Requisitos

### Requisitos funcionais

- **RF-001**: O usuário DEVE conseguir definir, alterar ou remover o objetivo de cada hábito
  ao criá-lo ou editá-lo.
- **RF-002**: O objetivo DEVE ser opcional, texto livre de até 60 caracteres, sem espaços no
  início e no fim; vazio equivale a "sem objetivo". O app não valida nem mede o conteúdo.
- **RF-003**: O servidor DEVE recusar objetivo com mais de 60 caracteres com a mensagem "O
  objetivo deve ter no máximo 60 caracteres."
- **RF-004**: Em telas maiores que 570px, o objetivo DEVE aparecer abaixo do nome do hábito,
  em texto menor, cortado com reticências se não couber.
- **RF-005**: Em telas até 570px, o objetivo NÃO DEVE aparecer na linha do hábito. Tocar num
  hábito com objetivo DEVE abrir um balão com o nome, o objetivo e o botão "Editar" (que abre a
  edição); tocar num hábito sem objetivo DEVE abrir a edição direto, como hoje. O balão fecha
  ao tocar fora, com Esc ou ao tocar em outro hábito, e não bloqueia as marcações.
- **RF-006**: O objetivo DEVE ser lido por leitores de tela junto com o nome do hábito.
- **RF-007**: Ao marcar um dia que faz um hábito com meta semanal atingir a meta da semana
  exibida, o app DEVE mostrar uma comemoração curta com mensagem de parabéns que cita o hábito.
- **RF-008**: Ao marcar um dia que leva o resumo da semana exibida a 100%, o app DEVE mostrar
  a comemoração especial de semana perfeita, no lugar da comemoração do hábito.
- **RF-009**: A comemoração DEVE acontecer só no momento da marcação que cruza o limite (de
  abaixo para igual/acima da meta, ou de abaixo de 100% para 100%); abrir, recarregar, trocar
  de semana, mudar a meta ou marcar além da meta NÃO DEVEM comemorar.
- **RF-010**: A comemoração NÃO DEVE bloquear nem atrasar o registro; some sozinha em poucos
  segundos, ao tocar/clicar fora ou com Esc; no máximo uma por vez.
- **RF-011**: Com "reduzir movimento", a comemoração DEVE aparecer sem animação de movimento;
  a mensagem DEVE ser anunciada a leitores de tela sem mover o foco; sem som.
- **RF-012**: O objetivo DEVE pertencer ao usuário dono do hábito e ser acessível somente por
  ele.
- **RF-013**: Textos em pt-BR, com contraste AA no tema vigente.

### Requisitos de compatibilidade

- **RC-001**: Hábitos, metas e marcações existentes DEVEM continuar iguais após a
  atualização; hábitos existentes começam sem objetivo.

### Entidades-chave

- **Hábito** (existente): ganha o atributo **objetivo** — texto opcional de até 60
  caracteres. Diferente da meta semanal, o objetivo não tem histórico: vale sempre o texto
  atual.
- **Comemoração**: evento visual momentâneo, sem dados gravados. Dois tipos: **meta do
  hábito** e **semana perfeita**.

---

## Critérios de sucesso

- **CS-001**: Definir o objetivo leva no máximo 1 campo a mais no diálogo que já existe.
- **CS-002**: Em 100% dos cenários do checklist, a comemoração aparece exatamente quando a
  meta é batida pela marcação, e nunca em outro momento.
- **CS-003**: A comemoração some sozinha em até 4 segundos e nunca impede uma marcação
  seguinte.
- **CS-004**: 0 casos em que um usuário vê ou altera o objetivo de outro (testes
  automatizados).
- **CS-005**: Nenhum dado existente é perdido ou alterado após a atualização.

---

## Fora de escopo

- Medir ou validar o objetivo (contar páginas, quilômetros etc.) ou registrar quanto foi
  feito em cada dia.
- Histórico de objetivos (ver o objetivo que valia numa semana passada).
- Comemoração para hábitos sem meta semanal ou a cada dia marcado.
- Sons, vibração, conquistas, medalhas ou compartilhamento.
- Comemoração nas notificações (spec 011).
- Tema escuro.

## Dependências e premissas

- Constituição **2.1.1** (Princípio IV: animações curtas e desativadas com "reduzir
  movimento").
- Comportamento base: specs [006](../006-metas-semanais/spec.md) (meta semanal, resumo e
  "Semana perfeita"), [009](../009-novo-design-system/spec.md) (design system e animação de
  marcação) e [010](../010-layout-mobile/spec.md) (layout do celular, tocar no hábito abre a
  edição, edição na semana atual e anterior).

---

## Checklist de qualidade da spec

- [x] Nenhum detalhe de implementação (tecnologia, arquivo, função)
- [x] Toda história tem cenários *Dado/Quando/Então* testáveis
- [x] Requisitos são verificáveis e sem ambiguidade
- [x] Critérios de sucesso são mensuráveis
- [x] Casos de borda e dados existentes foram considerados
- [x] Nenhuma marcação `[NEEDS CLARIFICATION]` pendente
- [x] Conforme a [constituição](../../.specify/memory/constitution.md) 2.1.1

## Clarificações

| Data | Pergunta | Decisão |
|------|----------|---------|
| 2026-11-23 | Quando a comemoração aparece? | Ao bater a meta semanal do hábito (spec 006); hábitos sem meta não comemoram |
| 2026-11-23 | Comemoração para a semana inteira? | Sim: comemoração especial quando o resumo chega a 100% ("Semana perfeita") |
| 2026-11-23 | Onde o objetivo aparece? | No computador, abaixo do nome em texto menor; no celular, só ao tocar no hábito |
| 2026-11-23 | Tamanho máximo do objetivo? | 60 caracteres |
| 2026-11-23 | O app valida o objetivo? | Não; é texto livre, só um lembrete do desafio |
| 2026-11-23 | Como mostrar o objetivo ao tocar no hábito no celular, se hoje o toque abre a edição? | Balão com nome, objetivo e botão "Editar"; hábito sem objetivo continua abrindo a edição direto; no computador nada muda no clique |
