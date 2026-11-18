# Especificação da Feature: Notificações de hábitos e atualização para a versão nova

**Branch**: `011-notificacoes-e-atualizacao`
**Criada em**: 2026-11-18
**Status**: Aprovada em 2026-11-18; implementada e verificada localmente (sem commit). Passa para
**Implementada** depois dos itens pendentes do checklist em [tasks.md](./tasks.md) (push real no
Chrome; iPhone e Android após o deploy) <!-- Rascunho | Em clarificação | Aprovada | Implementada | Descartada -->
**Plano**: [plan.md](./plan.md) | **Tarefas**: [tasks.md](./tasks.md)
**Entrada**: descrição original do pedido: "agora quero que o sistema ganhe funções de notificações
e que quando eu atualizar a versão no servidor ele peça pra atualizar se o usuário estiver
usando ou atualizar automático quando for logar no sistema"

> Esta spec descreve **o quê** e **por quê**. Não inclua tecnologia, nomes de funções,
> arquivos ou estrutura de código — isso pertence ao `plan.md`.
> Marque toda dúvida com `[NEEDS CLARIFICATION: pergunta]`. A spec só pode ser
> Aprovada quando não restar nenhuma marcação.

> A spec tem duas partes independentes:
>
> - **Notificações** (Histórias 1, 2, 5 e 6): lembretes que chegam como notificação do
>   sistema do celular ou do computador, **mesmo com o app fechado**. Vêm desligadas; cada
>   pessoa ativa em cada aparelho e escolhe o horário do lembrete.
> - **Versão nova** (Histórias 3, 4 e 7): quando uma versão nova do Habits é publicada, quem
>   está usando o app recebe um aviso com o botão "Atualizar", e quem abre o app ou entra
>   recebe a versão nova sozinho, sem nunca perder o que estava digitando.
>
> "Horário" é sempre o de Brasília (fuso de referência da constituição). "Hábito ativo" é um
> hábito não arquivado. "Formulário aberto" é qualquer diálogo ou tela com campos de texto
> sendo preenchidos: novo hábito, editar hábito, trocar senha, entrar e criar conta.

---

## Histórias de usuário e cenários de aceitação *(obrigatório)*

### História 1 — Ativar e configurar as notificações (Prioridade: P1)

Como usuário, quero ativar as notificações no aparelho que uso, escolher o horário do
lembrete e ligar ou desligar cada tipo, para receber só o que me ajuda e na hora que me serve.

**Por que esta prioridade**: sem ativação e controle, nenhuma outra notificação pode chegar,
e notificação que a pessoa não pediu vira motivo para bloquear o app.

**Teste independente**: com uma conta nova, abrir a tela da conta no Android (Chrome), no
iPhone (com e sem o app na tela inicial) e no computador; ativar, mudar o horário, desligar um
tipo e desativar.

**Cenários de aceitação**:

1. **Dado** uma conta nova ou existente, **Quando** abro o app depois desta mudança,
   **Então** as notificações estão desligadas em todos os meus aparelhos e nenhuma chega.
2. **Dado** que estou na tela da conta num aparelho que aceita notificações, **Quando** toco
   em ativar as notificações, **Então** o aparelho me pede permissão e, se eu permitir, as
   notificações passam a valer neste aparelho, com os três tipos ligados e o lembrete às 20h.
3. **Dado** que recusei a permissão no pedido do aparelho, **Quando** volto à tela da conta,
   **Então** vejo que as notificações estão bloqueadas neste aparelho e uma explicação curta
   de como liberá-las nos ajustes do aparelho ou do navegador.
4. **Dado** as notificações ativas, **Quando** escolho outro horário para o lembrete,
   **Então** o lembrete e o resumo de domingo passam a chegar no novo horário, em todos os
   meus aparelhos ativos, a partir do dia seguinte ou do mesmo dia se o horário ainda não
   passou.
5. **Dado** as notificações ativas, **Quando** desligo um tipo (lembrete diário, meta em risco
   ou resumo da semana), **Então** só esse tipo deixa de chegar, em todos os meus aparelhos.
6. **Dado** as notificações ativas no celular e no computador, **Quando** desativo as
   notificações no computador, **Então** o computador deixa de recebê-las e o celular
   continua recebendo.
7. **Dado** um iPhone em que o Habits está aberto no Safari, e não pelo atalho da tela
   inicial, **Quando** abro a área de notificações da tela da conta, **Então** vejo passos
   curtos de como adicionar o Habits à tela inicial e abri-lo por lá para ativar as
   notificações, sem o botão de ativar.
8. **Dado** um navegador ou aparelho que não aceita notificações, **Quando** abro a área de
   notificações, **Então** vejo que elas não estão disponíveis neste aparelho.
9. **Dado** as notificações ativas num aparelho, **Quando** toco em "Sair", **Então** esse
   aparelho deixa de receber notificações da minha conta.

---

### História 2 — Lembrete diário de marcar os hábitos (Prioridade: P1)

Como usuário, quero receber no horário que escolhi um lembrete de que ainda falta marcar
hábitos hoje, para não esquecer de registrar o dia.

**Por que esta prioridade**: é a notificação que mais ajuda a manter os registros em dia e
o principal motivo do pedido.

**Teste independente**: com as notificações ativas e o lembrete num horário próximo,
deixar hábitos sem marcar, fechar o app e esperar o horário; repetir com tudo marcado.

**Cenários de aceitação**:

1. **Dado** o lembrete ligado às 20h e 2 hábitos ativos sem marcação hoje, **Quando** chega
   20h, **Então** recebo, mesmo com o app fechado, uma notificação dizendo que faltam 2
   hábitos para marcar hoje.
2. **Dado** que todos os meus hábitos ativos foram marcados hoje, ou que os não marcados já
   atingiram a meta desta semana, **Quando** chega o horário do lembrete, **Então** nenhum
   lembrete é enviado.
3. **Dado** que não tenho hábitos ativos, **Quando** chega o horário, **Então** nenhum
   lembrete é enviado.
4. **Dado** que recebi o lembrete, **Quando** toco nele, **Então** o Habits abre na semana
   atual (ou na tela Entrar, se eu não estiver logado naquele aparelho).
5. **Dado** que hoje é domingo e o resumo da semana está ligado, **Quando** chega o horário,
   **Então** recebo só o resumo da semana (História 6), e não um lembrete separado.

---

### História 3 — Aviso de versão nova durante o uso (Prioridade: P1)

Como usuário com o app aberto, quero ser avisado quando houver uma versão nova e escolher a
hora de atualizar, para usar as novidades e correções sem ser interrompido no meio de algo.

**Por que esta prioridade**: hoje quem está com o app aberto (principalmente pelo atalho da
tela inicial) pode continuar indefinidamente na versão antiga depois de uma publicação.

**Teste independente**: com o app aberto numa tela qualquer, publicar uma versão nova e
esperar o aviso; tocar em "Atualizar" com e sem formulário aberto.

**Cenários de aceitação**:

1. **Dado** que estou usando o app, **Quando** uma versão nova é publicada, **Então** em até
   5 minutos aparece um aviso "Nova versão disponível" com o botão "Atualizar", sem bloquear
   a tela, sem cobrir as marcações nem a barra inferior de navegação.
2. **Dado** que a versão nova tem resumo de novidades, **Quando** o aviso aparece, **Então**
   ele mostra esse resumo; se não tem, mostra só "Nova versão disponível".
3. **Dado** o aviso na tela e nenhum formulário aberto, **Quando** toco em "Atualizar",
   **Então** o app carrega a versão nova na mesma tela em que eu estava, e continuo logado.
4. **Dado** o aviso na tela e um formulário aberto (por exemplo, editando um hábito),
   **Quando** toco em "Atualizar", **Então** nada do que digitei se perde: o app só carrega a
   versão nova depois que eu salvar ou fechar o formulário.
5. **Dado** que ignorei o aviso, **Quando** continuo usando o app, **Então** tudo funciona
   normalmente e a versão nova entra na próxima vez que eu abrir o app (História 4).
6. **Dado** que acabei de marcar um dia, **Quando** o app atualiza, **Então** a marcação não se
   perde nem é enviada duas vezes.
7. **Dado** que o app estava em segundo plano por menos de 30 minutos, **Quando** volto para
   ele e há versão nova, **Então** vejo o aviso (e não uma atualização sozinha).

---

### História 4 — Versão nova automática ao abrir o app ou entrar (Prioridade: P1)

Como usuário, quero que o app já abra na versão mais nova quando eu o abro ou entro na minha
conta, sem precisar fazer nada.

**Por que esta prioridade**: é a outra metade do pedido ("atualizar automático quando for
logar") e garante que ninguém fique preso numa versão antiga.

**Teste independente**: depois de publicar uma versão nova, abrir o app do zero (navegador e
atalho da tela inicial no iPhone e no Android), entrar na conta e voltar a um app pausado há
mais de 30 minutos.

**Cenários de aceitação**:

1. **Dado** que uma versão nova foi publicada, **Quando** abro o app do zero (no navegador ou
   pelo atalho da tela inicial), **Então** ele já abre na versão nova, sem aviso.
2. **Dado** que estou na tela "Entrar" de uma versão antiga, **Quando** entro na conta,
   **Então** a tela principal já aparece na versão nova, sem aviso e sem precisar entrar de
   novo.
3. **Dado** que estou na tela "Entrar" ou "Criar conta" com os campos vazios e uma versão
   nova é publicada, **Quando** o app percebe a versão nova, **Então** carrega a versão nova
   sozinho; se eu já comecei a digitar, nada se perde e a versão nova entra quando eu entrar.
4. **Dado** que o app ficou em segundo plano por 30 minutos ou mais e há versão nova,
   **Quando** volto para ele sem nenhum formulário aberto, **Então** ele carrega a versão nova
   sozinho, na semana atual, e continuo logado.
5. **Dado** que o app ficou em segundo plano por 30 minutos ou mais com um formulário aberto,
   **Quando** volto para ele, **Então** o formulário continua como deixei e vejo o aviso da
   História 3.
6. **Dado** qualquer atualização (sozinha ou pelo botão), **Quando** ela acontece, **Então**
   continuo logado e todos os meus hábitos, marcações e metas aparecem como antes.

---

### História 5 — Aviso de meta em risco (Prioridade: P2)

Como usuário com metas semanais, quero ser avisado de manhã quando uma meta só pode ser
atingida se eu fizer o hábito hoje, para ter o dia inteiro para cumpri-lo.

**Por que esta prioridade**: ajuda a cumprir as metas da spec 006, mas depende da ativação
(História 1) e vale só para quem usa metas.

**Teste independente**: com uma meta de 3 dias, deixar a semana chegar a sexta-feira com 0
marcações (faltam 3 dias e 3 marcações) e conferir o aviso às 9h; repetir com a meta já
impossível e com a meta atingida.

**Cenários de aceitação**:

1. **Dado** um hábito com meta de 3 dias, 0 marcações na semana e hoje sexta-feira (restam
   sexta, sábado e domingo), **Quando** chega 9h, **Então** recebo uma notificação dizendo que
   preciso fazer esse hábito hoje para não perder a meta.
2. **Dado** dois hábitos em risco no mesmo dia, **Quando** chega 9h, **Então** recebo uma
   única notificação citando os dois.
3. **Dado** um hábito cuja meta já foi atingida, ou que ainda tem folga (sobram mais dias do
   que marcações necessárias), **Quando** chega 9h, **Então** ele não gera aviso.
4. **Dado** um hábito cuja meta já não pode mais ser atingida nesta semana, **Quando** chega
   9h, **Então** ele não gera aviso.
5. **Dado** que hoje já marquei o hábito antes das 9h, **Quando** chega 9h, **Então** ele não
   gera aviso.
6. **Dado** que toquei no aviso, **Quando** o app abre, **Então** vejo a semana atual.

---

### História 6 — Resumo da semana no domingo (Prioridade: P2)

Como usuário, quero receber no domingo, no horário do lembrete, um resumo de como foi a
minha semana, ainda a tempo de marcar o domingo.

**Por que esta prioridade**: reforça o hábito de revisar a semana, mas não é essencial para
registrar o dia a dia.

**Teste independente**: num domingo, com hábitos e metas, conferir o resumo no horário do
lembrete, com e sem hábitos pendentes hoje.

**Cenários de aceitação**:

1. **Dado** que hoje é domingo e o resumo está ligado, **Quando** chega o horário do lembrete,
   **Então** recebo uma notificação com o resumo da semana de segunda a domingo, com as mesmas
   informações do resumo da semana mostrado na tela principal.
2. **Dado** que, além disso, ainda falta marcar hábitos hoje e o lembrete diário está ligado,
   **Quando** o resumo chega, **Então** ele também diz quantos hábitos faltam marcar hoje.
3. **Dado** que o resumo está desligado e o lembrete ligado, **Quando** chega o horário no
   domingo, **Então** recebo só o lembrete diário, como nos outros dias.
4. **Dado** que não tenho hábitos ativos, **Quando** chega domingo, **Então** nenhum resumo é
   enviado.

---

### História 7 — Novidades da versão (Prioridade: P3)

Como usuário, quero ver uma vez o que mudou depois que o app atualiza, para descobrir as
novidades sem precisar perguntar.

**Por que esta prioridade**: informativo; o app funciona sem isso.

**Teste independente**: publicar uma versão com resumo de novidades e outra sem; atualizar
pelo botão e sozinho ao abrir.

**Cenários de aceitação**:

1. **Dado** que o app acabou de carregar uma versão nova que tem resumo de novidades (pelo
   botão ou sozinho), **Quando** a tela aparece, **Então** vejo uma vez "Novidades da versão"
   com o resumo, e posso fechar.
2. **Dado** que já fechei as novidades desta versão, **Quando** abro o app de novo, **Então**
   elas não aparecem mais.
3. **Dado** uma versão sem resumo de novidades, **Quando** o app a carrega, **Então** nenhuma
   tela de novidades aparece.
4. **Dado** que as novidades estão na tela, **Quando** uso teclado ou leitor de tela,
   **Então** consigo ler e fechar com o foco visível.

---

### Casos de borda

**Notificações**

- **Celular sem internet ou desligado no horário**: a notificação pode chegar atrasada quando o
  aparelho voltar; se chegar depois da meia-noite (já é outro dia), não deve ser exibida.
- **Permissão retirada depois** (nos ajustes do aparelho) ou app removido da tela inicial: o
  aparelho deixa de receber, sem erro para a pessoa; a tela da conta mostra o estado real.
- **Mesmo aparelho, outra conta**: ao sair de uma conta e entrar em outra, o aparelho só
  recebe notificações da conta que ativou nele depois de entrar.
- **Horário alterado depois que o lembrete do dia já foi enviado**: não envia de novo no
  mesmo dia.
- **Marcação feita entre o cálculo e o envio**: o texto deve refletir as marcações no momento
  do envio; se nada falta mais, não envia.
- **Hábito arquivado**: não conta para lembrete, meta em risco nem resumo.
- **Meta alterada na semana**: vale a meta vigente na semana, como na spec 006.
- **Semana anterior ainda editável** (spec 010): o lembrete e a meta em risco olham só o dia
  de hoje e a semana atual.
- **Limite de notificações por dia**: no máximo uma de manhã (meta em risco, às 9h) e uma no
  horário do lembrete (lembrete ou resumo de domingo).
- **Lembrete escolhido às 9h**: chegam duas notificações separadas no mesmo horário (meta em
  risco e lembrete), uma de cada tipo.
- **Texto na tela bloqueada**: a notificação mostra nomes de hábitos; quem preferir pode
  desligar o tipo ou esconder o conteúdo nos ajustes do aparelho.

**Versão nova**

- **Primeira publicação desta função**: quem estiver com uma versão antiga aberta (sem esta
  função) não vê aviso; recebe a versão nova quando abrir o app do zero.
- **Duas versões publicadas em seguida**: o aviso e as novidades se referem à versão mais
  nova; a pessoa nunca precisa atualizar duas vezes seguidas.
- **Publicação em andamento** (servidor reiniciando): o app não mostra o aviso nem atualiza
  sozinho até a versão nova estar no ar; se atualizar e o servidor ainda não responder, mostra
  a mensagem de erro de conexão atual, sem tela em branco.
- **Arrastando para reordenar ou com marcação sendo enviada**: a atualização sozinha espera a
  ação terminar.
- **Várias abas abertas**: cada aba mostra o próprio aviso; atualizar uma não perde nada nas
  outras.
- **Sessão expirada durante a atualização**: o app abre na tela "Entrar", como hoje.
- **"Reduzir movimento"** ativado no sistema: o aviso e as novidades aparecem sem animação.
- **Dados já gravados**: nada muda; hábitos, marcações, metas e ordem continuam como antes.

---

## Requisitos *(obrigatório)*

### Requisitos funcionais

**Notificações**

- **RF-001**: O sistema DEVE enviar notificações que aparecem no aparelho como notificação do
  sistema, mesmo com o app fechado, no Android (Chrome), no iPhone (com o Habits aberto pelo
  atalho da tela inicial) e no computador, onde o navegador permitir.
- **RF-002**: As notificações DEVEM vir desligadas para todos os usuários, novos e
  existentes. Só são ativadas por ação explícita do usuário num aparelho, na tela da conta,
  com a permissão do aparelho.
- **RF-003**: A ativação DEVE valer por aparelho: cada aparelho ativado recebe, e desativar
  num aparelho não afeta os outros.
- **RF-004**: O horário do lembrete e os tipos ligados DEVEM valer para a conta (todos os
  aparelhos ativos). Ao ativar pela primeira vez, os três tipos vêm ligados e o lembrete às
  20h.
- **RF-005**: O usuário DEVE poder escolher o horário do lembrete (hora e minutos) e ligar ou
  desligar cada tipo: lembrete diário, meta em risco e resumo da semana.
- **RF-006**: A tela da conta DEVE mostrar o estado das notificações neste aparelho: ativas,
  desativadas, bloqueadas pelo aparelho (com como liberar), indisponíveis neste aparelho, ou,
  no iPhone fora do atalho da tela inicial, os passos para adicionar o Habits à tela inicial.
- **RF-007**: **Lembrete diário** — no horário escolhido, DEVE ser enviado se houver ao menos
  um hábito ativo sem marcação hoje cuja meta desta semana ainda não foi atingida (hábitos sem
  meta contam sempre). O texto DEVE dizer quantos hábitos faltam. Se nenhum faltar, nada é
  enviado.
- **RF-008**: **Meta em risco** — às 9h, DEVE ser enviada uma única notificação citando os
  hábitos com meta que, sem marcação hoje, não podem mais atingir a meta da semana (as
  marcações que faltam são iguais aos dias que restam, contando hoje). Hábitos com meta já
  atingida, com folga, já impossível ou marcados hoje não entram.
- **RF-009**: **Resumo da semana** — no domingo, no horário do lembrete, DEVE ser enviado o
  resumo da semana de segunda a domingo, com as mesmas informações do resumo da tela
  principal. Ele substitui o lembrete do domingo e, se o lembrete estiver ligado e faltar
  marcar hábitos hoje, também diz quantos faltam.
- **RF-010**: Por conta, DEVE haver no máximo uma notificação de cada tipo por dia, e nenhuma
  notificação sobre um dia que já passou.
- **RF-011**: Tocar numa notificação DEVE abrir o Habits na semana atual, ou na tela "Entrar"
  se o aparelho não estiver logado.
- **RF-012**: Ao tocar em "Sair", o aparelho DEVE deixar de receber notificações daquela
  conta.
- **RF-013**: Os textos das notificações DEVEM estar em pt-BR e citar só dados da própria
  conta (Princípios III e IV).

**Versão nova**

- **RF-014**: Com o app aberto e em uso, o sistema DEVE perceber que há uma versão nova
  publicada em até 5 minutos, e também ao voltar para o app.
- **RF-015**: Ao perceber uma versão nova durante o uso, o app DEVE mostrar um aviso "Nova
  versão disponível", com o resumo das novidades quando houver e o botão "Atualizar", sem
  bloquear o uso e sem cobrir marcações nem a barra inferior.
- **RF-016**: "Atualizar" DEVE carregar a versão nova na mesma tela, mantendo o login. Com um
  formulário aberto, DEVE esperar o formulário ser salvo ou fechado.
- **RF-017**: O app DEVE carregar a versão nova sozinho, sem aviso: (a) ao ser aberto do zero,
  no navegador ou pelo atalho da tela inicial; (b) logo após o usuário entrar na conta;
  (c) na tela "Entrar" ou "Criar conta" com os campos vazios; (d) ao voltar para o app depois
  de 30 minutos ou mais em segundo plano.
- **RF-018**: Nenhuma atualização, pelo botão ou sozinha, DEVE acontecer com um formulário
  aberto com texto digitado, durante um arraste de reordenação ou com uma marcação sendo
  enviada; nesses casos, ela espera a ação terminar ou mostra o aviso.
- **RF-019**: Depois de publicada uma versão nova, ninguém DEVE continuar recebendo a versão
  antiga ao abrir o app do zero, inclusive pelo atalho da tela inicial.
- **RF-020**: Quem publica DEVE poder informar, junto com a versão, um resumo curto das
  novidades em pt-BR, opcional.
- **RF-021**: Depois de carregar uma versão com resumo de novidades, o app DEVE mostrar uma
  única vez "Novidades da versão" com esse resumo; versões sem resumo não mostram nada.
- **RF-022**: O aviso e as novidades DEVEM ser acessíveis por teclado e leitor de tela, com
  foco visível, contraste AA e sem animação quando o sistema pede "reduzir movimento".

### Requisitos de compatibilidade

- **RC-001**: Usuários com dados já gravados DEVEM ver exatamente os mesmos hábitos,
  marcações, metas e ordem após esta mudança.
- **RC-002**: Usuários com sessão ativa DEVEM continuar logados após esta mudança e após
  cada atualização de versão.
- **RC-003**: Nenhum usuário existente DEVE receber notificação sem ter ativado (RF-002).
- **RC-004**: Quem já tem o Habits na tela inicial NÃO DEVE precisar removê-lo e adicioná-lo
  de novo para receber as versões novas.

### Entidades-chave

- **Preferências de notificação** (uma por usuário): horário do lembrete; tipos ligados
  (lembrete diário, meta em risco, resumo da semana).
- **Aparelho com notificações ativas** (vários por usuário): o aparelho em que o usuário
  ativou as notificações; deixa de existir ao desativar, ao sair ou quando o aparelho para de
  aceitar.
- **Versão do app**: identificação da versão publicada e o resumo opcional das novidades.

---

## Critérios de sucesso *(obrigatório)*

- **CS-001**: Com as notificações ativas no Android (Chrome) e no iPhone (atalho da tela
  inicial), o lembrete chega com o app fechado em até 5 minutos depois do horário escolhido.
- **CS-002**: Em nenhum dia uma conta recebe mais de 2 notificações (uma às 9h e uma no
  horário do lembrete), e nenhuma chega quando não há nada pendente.
- **CS-003**: Depois de desativar num aparelho, ou de tocar em "Sair" nele, nenhuma
  notificação chega a esse aparelho.
- **CS-004**: Com o app aberto, o aviso de versão nova aparece em até 5 minutos depois da
  publicação.
- **CS-005**: Depois de uma publicação, abrir o app do zero (navegador e atalho da tela
  inicial, no iPhone e no Android) carrega a versão nova em 100% das tentativas, sem aviso e
  sem pedir login.
- **CS-006**: Em nenhum cenário de atualização (botão, abrir, entrar, voltar ao app) o
  usuário perde texto digitado, perde ou duplica uma marcação, ou precisa entrar de novo.
- **CS-007**: Os testes automatizados existentes continuam verdes, e nenhum dado existente é
  perdido.

---

## Fora de escopo

- Notificações por e-mail, SMS ou mensageiros.
- Avisos de lembrete dentro do app (faixas na tela); as notificações são só do sistema.
- Lembrete com horário próprio por hábito e escolha do horário da meta em risco (fixo às 9h).
- Notificação de parabéns ao atingir uma meta.
- Funcionar sem internet (o app continua precisando de conexão para abrir e marcar).
- Histórico ou lista de todas as versões publicadas; só o resumo da versão carregada.
- Publicação em lojas de aplicativos e apps nativos.
- Tema escuro e mudanças de layout além do aviso, das novidades e da área de notificações na
  tela da conta.

## Dependências e premissas

- Depende da spec 010: app instalável pela tela inicial, em tela cheia, e login de 7 dias.
- **iPhone**: só recebe notificações com o app fechado se o Habits foi adicionado à tela
  inicial e é aberto por lá, num iOS que suporte isso (16.4 ou mais recente). No Safari
  comum, a tela da conta mostra os passos para instalar (RF-006).
- Usa as metas semanais da spec 006 e a semana de segunda a domingo da spec 010.
- As publicações continuam automáticas a cada merge na `main` (spec 008); o resumo de
  novidades é escrito por quem publica.
- Princípio II: receber notificações com o app fechado e perceber versões novas
  provavelmente exige peças novas no app e na publicação; o plan justifica cada uma em
  **Complexity Tracking**.
- Princípio III: preferências e aparelhos de notificação são dados do usuário, isolados por
  conta.
- Envio no horário certo depende do sistema do aparelho e da internet; atrasos do próprio
  aparelho (economia de bateria, sem rede) não são controláveis pelo Habits.

---

## Checklist de qualidade da spec

- [x] Nenhum detalhe de implementação (tecnologia, arquivo, função)
- [x] Toda história tem cenários *Dado/Quando/Então* testáveis
- [x] Requisitos são verificáveis e sem ambiguidade
- [x] Critérios de sucesso são mensuráveis
- [x] Casos de borda e dados existentes foram considerados
- [x] Nenhuma marcação `[NEEDS CLARIFICATION]` pendente
- [x] Conforme a [constituição](../../.specify/memory/constitution.md)

## Clarificações

| Data | Pergunta | Decisão |
|------|----------|---------|
| 2026-11-18 | Por qual canal chegam as notificações? | Notificação do sistema, com o app fechado (no iPhone, só com o app na tela inicial) |
| 2026-11-18 | Quais tipos nesta versão? | Lembrete diário, meta em risco e resumo da semana (sem parabéns por meta atingida) |
| 2026-11-18 | Como fica o horário do lembrete? | Um horário por usuário, escolhido por ele (padrão 20h) |
| 2026-11-18 | Ligadas ou desligadas? | Desligadas; o usuário ativa na tela da conta e pode desligar cada tipo ou todas |
| 2026-11-18 | Quando chega a meta em risco? | Separada, de manhã, fixa às 9h |
| 2026-11-18 | Quando chega o resumo da semana? | Domingo, no horário do lembrete |
| 2026-11-18 | Domingo: lembrete e resumo juntos? | Uma notificação só: o resumo substitui o lembrete e lembra o que falta marcar hoje |
| 2026-11-18 | Em que caso o lembrete diário é enviado? | Se algum hábito ativo não foi marcado hoje, ignorando os que já atingiram a meta da semana; o texto diz quantos faltam |
| 2026-11-18 | Mesma conta em vários aparelhos? | Todos os aparelhos em que o usuário ativou recebem; desativar num não afeta os outros |
| 2026-11-18 | iPhone sem o app na tela inicial? | A tela mostra passos para adicionar à tela inicial |
| 2026-11-18 | Versão nova com o app em uso? | Aviso com botão "Atualizar", sem forçar; se ignorar, a versão nova entra na próxima abertura |
| 2026-11-18 | Quando atualizar sozinho? | Ao abrir o app do zero e ao entrar na conta (e na tela Entrar) |
| 2026-11-18 | Voltando a um app pausado em segundo plano? | Atualiza sozinho se ficou 30 minutos ou mais fora e não há formulário aberto; antes disso, mostra o aviso |
| 2026-11-18 | Em quanto tempo o aviso aparece? | Em até 5 minutos depois da publicação, e também ao voltar para o app |
| 2026-11-18 | E com um formulário aberto? | Nunca perde o que foi digitado: só atualiza depois de salvar ou fechar |
| 2026-11-18 | O aviso diz o que mudou? | Sim, com um resumo curto das novidades escrito a cada versão |
| 2026-11-18 | Quem atualiza sozinho vê as novidades? | Sim, uma vez, depois de carregar a versão nova |
| 2026-11-18 | Versão sem resumo de novidades? | Aviso só com "Nova versão disponível" e sem tela de novidades depois |
| 2026-11-18 | Aprovação | Spec aprovada pelo usuário, incluindo os pontos deduzidos: CS-001 (lembrete em até 5 minutos), notificação atrasada para depois da meia-noite não é mostrada, e aviso/novidades só da versão mais nova |
| 2026-11-18 | Aprovação do plan | Plan (P1–P21) aprovado pelo usuário, incluindo P10 (domingo sem metas: lembrete normal, sem resumo) e P17 (qualquer diálogo aberto bloqueia a atualização) |
