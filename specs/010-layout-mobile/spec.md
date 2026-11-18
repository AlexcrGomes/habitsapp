# Especificação da Feature: Layout mobile — semana inteira na tela e app em tela cheia

**Branch**: `010-layout-mobile`
**Criada em**: 2026-11-17
**Status**: Aprovada em 2026-11-17, revisão 3 <!-- Rascunho | Em clarificação | Aprovada | Implementada | Descartada -->
(edição só na semana atual e na anterior; hábitos na primeira coluna). As revisões 1, 2 e 3
estão implementadas e verificadas localmente (sem commit). A spec passa para **Implementada**
depois dos itens 📱 do checklist, no iPhone e no Android reais, após o deploy (ver
[tasks.md](./tasks.md))
**Plano**: [plan.md](./plan.md) | **Tarefas**: [tasks.md](./tasks.md)
**Entrada**: descrição original do pedido: "o modelo para celular está muito ruim a
visibilidade. quando acesso o app ele não fica 100% da tela, ajuste isso e organize melhor
os elementos na tela, deixe menor os elementos para marcar o dia, de forma que dê pra ver
tudo sem arrastar. deixe o nome do hábito em cima e os flags em baixo. reorganize para ficar
melhor no layout mobile"
**Revisão 2**: "não quero mais ter a visualização dos ultimos sete dias. agora quero ter
apenas a vizualização da semana e a semana deve começar na segunda e terminar no domingo. a
semana esta no superior direito, mas quero que fique embaixo da palavra semana no layout.
quero que o cabeçalho fique sempre fixo e quando tiver muitos habitos apenas eles se movam.
faça uma forma de deixar mais facil identificar o dia da semana de cada atividade, pois acho
que qunado tem muitas atividades fica um pouco confuso, então deixe sempre o dia corrente com
uma especie de destate"
**Revisão 3**: "precisa mudar uma regra, o usuario so pode mudara semana atual ou a semana
anterior, fora isso não pode permitir alterações na marcação de habitos. para atingimento das
metas as semanas devem começar de segunda e terminar aos domingos, de acordo como mostra na
tela. ainda não gostei como os dados estão sendo apresentados, deixe os habitos na primeira
coluna com icone do emoji em cima e o nome em baixoe na segunda coluna começa a contagem da
semana, pois vai ficar mais facil vizualizar e marcar os habitos, com isso pode reduzir um
pouco mais os flags de marcar os habitos"

> Esta spec descreve **o quê** e **por quê**. Não inclua tecnologia, nomes de funções,
> arquivos ou estrutura de código — isso pertence ao `plan.md`.
> Marque toda dúvida com `[NEEDS CLARIFICATION: pergunta]`. A spec só pode ser
> Aprovada quando não restar nenhuma marcação.

> Esta é uma spec de interface, principalmente para telas de celular. Ela não muda dados e
> mantém o design system azul em tema claro da spec 009. Os "flags" do pedido são as
> marcações de dia (as caixas de marcar). A revisão 2 muda também o computador em três
> pontos: a semana passa a ser sempre de segunda a domingo (sai o modo "Últimos 7 dias", que
> vinha da spec 004), o período fica embaixo do título e hoje ganha destaque forte.
> A revisão 3 muda uma **regra de negócio** das specs 004/005: os dias que podem ser marcados
> deixam de ser "hoje e os 6 anteriores" e passam a ser a semana anterior inteira e a semana
> atual até hoje. A regra vale no celular, no computador e no servidor.

---

## Histórias de usuário e cenários de aceitação *(obrigatório)*

### História 1 — A semana inteira cabe no celular (Prioridade: P1)

Como usuário no celular, quero ver cada hábito numa linha: na primeira coluna, o emoji em
cima e o nome embaixo; nas colunas seguintes, as marcações dos 7 dias da semana, todas de
uma vez. Assim registro e confiro a semana sem arrastar a tela para os lados. (Revisão 3: na
revisão 1, o nome ficava em cima e as marcações embaixo.)

**Por que esta prioridade**: é a principal reclamação. Hoje só cabem cerca de 2 dos 7 dias
na largura do celular, e a pessoa precisa arrastar para ver o resto.

**Teste independente**: abrir a tela principal em larguras de 360 a 430px com vários
hábitos e conferir que os 7 dias de cada hábito estão visíveis e podem ser marcados sem
rolar para os lados.

**Cenários de aceitação**:

1. **Dado** que estou logado num celular de 360 a 430px de largura, **Quando** abro a tela
   principal, **Então** cada hábito ocupa uma linha, com o emoji em cima e o nome embaixo
   na primeira coluna e as 7 marcações da semana exibida nas colunas seguintes, sem rolagem
   horizontal.
2. **Dado** a tela principal no celular, **Quando** olho o topo da lista, **Então** vejo uma
   única faixa com o dia da semana e a data de cada coluna, alinhada às marcações de todos
   os hábitos.
3. **Dado** uma lista maior que a tela, **Quando** rolo para baixo, **Então** a faixa de
   dias continua visível e alinhada às marcações.
4. **Dado** que a semana exibida contém hoje, **Quando** a vejo, **Então** o dia de hoje
   aparece em destaque forte na faixa (fundo azul e texto branco) e a sua coluna tem um
   fundo azul contínuo, de cima a baixo, atravessando todos os hábitos, de modo que, mesmo
   com muitos hábitos, eu identifico sem esforço qual caixa é a de hoje.
5. **Dado** uma marcação de um dia editável, **Quando** toco nela, **Então** ela é marcada
   ou desmarcada como hoje, e um toque não aciona a marcação vizinha.
6. **Dado** um dia que não pode ser editado (futuro ou fora da semana atual e da anterior),
   **Quando** olho a marcação, **Então** ela aparece indicada como bloqueada.
7. **Dado** um hábito com meta semanal, **Quando** o vejo no celular, **Então** o progresso
   da meta (quantos dias feitos de quantos, ou "meta atingida") continua visível nele.

---

### História 2 — O app ocupa a tela toda (Prioridade: P1)

Como usuário no celular, quero que o Habits ocupe exatamente a largura da tela, sem ficar
ampliado nem cortado, e que abra em tela cheia, como um app, quando o abro pelo atalho na
tela inicial.

**Por que esta prioridade**: hoje, depois de tocar nos campos de e-mail e senha, a página
fica ampliada e é preciso arrastar para os lados. Isso estraga qualquer arranjo de tela.

**Teste independente**: no iPhone (Safari) e no Android (Chrome), entrar no app tocando nos
campos, navegar por todas as telas e abrir os diálogos; depois adicionar o atalho à tela
inicial e abrir o app por ele.

**Cenários de aceitação**:

1. **Dado** a tela "Entrar" ou "Criar conta" no iPhone, **Quando** toco num campo e digito,
   **Então** a página não amplia sozinha e, depois de entrar, a tela principal aparece na
   largura exata do celular.
2. **Dado** qualquer diálogo com campo de texto (novo hábito, editar hábito, trocar senha),
   **Quando** toco num campo, **Então** a página não amplia sozinha.
3. **Dado** qualquer tela do app no celular, **Quando** tento arrastar para os lados,
   **Então** a página não se move, porque nada fica mais largo que a tela.
4. **Dado** que quero ver algo maior, **Quando** faço o gesto de pinça, **Então** consigo
   ampliar a página (a ampliação manual continua permitida).
5. **Dado** que adicionei o Habits à tela inicial do iPhone ou do Android, **Quando** o abro
   pelo atalho, **Então** ele ocupa a tela inteira, sem a barra de endereço do navegador,
   com o nome "Habits", o ícone da logo e a cor do tema.
6. **Dado** o app aberto em tela cheia num celular com entalhe ou barra de gestos,
   **Quando** vejo o topo e a barra inferior, **Então** nenhum conteúdo nem botão fica
   escondido atrás do entalhe, da barra de status ou da barra de gestos.
7. **Dado** que entrei no app aberto pelo atalho da tela inicial, **Quando** fecho o app e o
   abro de novo dentro de 7 dias, **Então** continuo logado, sem digitar e-mail e senha.
8. **Dado** que toquei em "Sair", **Quando** abro o app de novo, **Então** vejo a tela
   "Entrar".

---

### História 3 — Topo compacto e fixo (Prioridade: P2)

Como usuário no celular, quero que o título, a semana exibida e o resumo ocupem pouca altura
e fiquem sempre parados no topo, junto com a faixa de dias, para que, com muitos hábitos,
só a lista se mova.

**Por que esta prioridade**: completa o "ver tudo sem arrastar" na altura e mantém a
referência de semana e de dias sempre à vista.

**Teste independente**: abrir a tela principal num celular de 390×844 em tela cheia, com 5
hábitos com meta, e conferir que o resumo e os 5 hábitos aparecem sem rolar; depois, com 10
hábitos, rolar a lista e conferir que o topo não se move.

**Cenários de aceitação**:

1. **Dado** a tela principal (no celular e no computador), **Quando** ela abre, **Então**
   vejo o título "Semana" e, logo embaixo dele, a semana exibida com as setas de anterior e
   próxima.
2. **Dado** hábitos com meta, **Quando** vejo o resumo da semana no celular, **Então** ele
   mostra as mesmas informações de hoje (percentual e texto do resumo) em menos altura.
3. **Dado** um celular de 390×844 com o app em tela cheia e 5 hábitos, **Quando** abro a
   tela principal, **Então** vejo o resumo e os 5 hábitos sem rolar.
4. **Dado** uma lista de hábitos maior que a tela do celular, **Quando** rolo, **Então** o
   título, a semana, o resumo e a faixa de dias ficam parados no topo, e só os hábitos se
   movem por baixo deles.

---

### História 5 — Semana de segunda a domingo (Prioridade: P1)

Como usuário, quero ver sempre a semana de segunda a domingo, sem escolher entre modos, para
que a semana do app seja a mesma do meu calendário.

**Por que esta prioridade**: muda o que é exibido e o que o resumo e as metas medem; o
resto do layout depende dela.

**Teste independente**: abrir a tela principal em dias diferentes da semana (inclusive numa
segunda e num domingo) e navegar para semanas anteriores, no celular e no computador.

**Cenários de aceitação**:

1. **Dado** que hoje é quinta-feira, **Quando** abro a tela principal, **Então** vejo a
   semana de segunda a domingo que contém hoje, com os dias depois de hoje bloqueados como
   futuros.
2. **Dado** que hoje é segunda-feira, **Quando** abro a tela principal, **Então** a semana
   começa hoje e os outros 6 dias aparecem bloqueados como futuros; a semana anterior
   inteira continua editável pela seta de semana anterior (História 6).
3. **Dado** a tela principal, **Quando** procuro a escolha entre "Últimos 7 dias" e
   "Dom–Sáb", **Então** ela não existe mais.
4. **Dado** que eu usava "Últimos 7 dias" ou "Dom–Sáb", **Quando** abro o app depois da
   atualização, **Então** vejo a semana de segunda a domingo, e todas as minhas marcações
   continuam lá, nos dias em que foram feitas.
5. **Dado** uma semana que atravessa a virada do mês ou do ano, **Quando** a vejo,
   **Então** o período e os dias da faixa aparecem corretos.
6. **Dado** um hábito com meta, **Quando** vejo o progresso da meta e o resumo de uma
   semana, **Então** eles contam só as marcações de segunda a domingo daquela semana, a
   mesma que aparece na tela.

---

### História 6 — Marcar só na semana atual e na anterior (Prioridade: P1)

Como usuário, quero poder marcar e desmarcar hábitos só na semana atual (até hoje) e na
semana anterior inteira, para corrigir esquecimentos recentes sem mexer no histórico antigo.

**Por que esta prioridade**: é uma regra de negócio que vale para todos os registros e que o
servidor precisa garantir.

**Teste independente**: em dias diferentes da semana, tentar marcar dias da semana atual, da
anterior e de duas semanas atrás, pela tela e direto pelo servidor.

**Cenários de aceitação**:

1. **Dado** que hoje é quarta-feira, **Quando** vejo a semana atual, **Então** posso marcar
   de segunda até hoje, e quinta a domingo aparecem bloqueados como futuros.
2. **Dado** que hoje é quarta-feira, **Quando** volto para a semana anterior, **Então**
   posso marcar e desmarcar todos os dias dela, de segunda a domingo.
3. **Dado** que hoje é quarta-feira, **Quando** volto duas semanas, **Então** todos os dias
   aparecem só para consulta e não posso marcar nem desmarcar.
4. **Dado** que hoje é segunda-feira, **Quando** vejo a semana anterior, **Então** ela
   inteira continua editável; ao virar para a próxima segunda, ela passa a ser só consulta.
5. **Dado** qualquer tentativa de marcar ou desmarcar um dia fora da semana atual e da
   anterior (por exemplo, por uma aba antiga ou direto no servidor), **Quando** ela chega ao
   servidor, **Então** é recusada com a mensagem "Só é possível marcar dias da semana atual
   e da semana anterior." e nada muda.

---

### História 4 — Ações do hábito no celular (Prioridade: P2)

Como usuário no celular, quero editar um hábito tocando nele e reordenar pela alça, sem
botões ocupando espaço, para a primeira coluna caber o emoji, o nome e a meta.

**Por que esta prioridade**: libera espaço na primeira coluna; reordenar e editar já
existem e não mudam.

**Teste independente**: no celular, tocar no hábito para editar e arrastar pela alça; com
teclado (ou leitor de tela), editar e reordenar pelos botões de mover para cima/baixo.

**Cenários de aceitação**:

1. **Dado** um hábito no celular, **Quando** vejo a primeira coluna, **Então** vejo uma alça
   fina de arrastar, o emoji com o selo da meta ao lado e o nome embaixo, sem lápis e sem
   botões de mover para cima/baixo.
2. **Dado** um hábito, **Quando** toco no emoji ou no nome, **Então** a edição do hábito
   abre.
3. **Dado** que uso teclado ou leitor de tela no celular, **Quando** navego até um hábito,
   **Então** alcanço "Editar …" e os botões de mover para cima/baixo, que ficam visíveis
   enquanto têm o foco e funcionam como hoje.
4. **Dado** um hábito, **Quando** o arrasto pela alça, **Então** ele é reordenado como hoje.

---

### Casos de borda

- **Nome longo**: na primeira coluna, o nome ocupa até 2 linhas e é cortado com reticências
  se não couber; o nome completo continua disponível (ao editar e para leitores de tela).
- **Muitos hábitos** (até o limite de ativos): só a lista rola; o topo (título, semana,
  resumo e faixa de dias) fica parado, e a barra inferior de navegação não cobre o último
  hábito.
- **Celular deitado ou tela baixa**: o topo fixo não pode ocupar a tela toda; sempre sobra
  espaço para ver e rolar ao menos um hábito.
- **Largura abaixo de 360px**: o app continua utilizável; se os 7 dias não couberem, só a
  área das marcações rola para os lados, nunca a página inteira.
- **Celular na horizontal**: os 7 dias continuam visíveis sem rolagem horizontal da página.
- **Larguras entre o celular e o computador** (tablet): seguem o layout que o plan definir,
  sem rolagem horizontal da página.
- **Semanas anteriores**: ao navegar para trás e para frente, a faixa de dias e as
  marcações mudam juntas e continuam alinhadas; numa semana sem hoje, nenhuma coluna tem o
  destaque de hoje.
- **Registro retroativo** (revisão 3): pode-se marcar da segunda-feira da semana anterior até
  hoje, ou seja, de 8 dias (numa segunda) a 14 dias (num domingo).
- **Virada do dia com o app aberto**: ao voltar para o app numa segunda-feira, a semana
  exibida passa a ser a nova, e a semana de duas semanas atrás vira só consulta. Uma marcação
  enviada por uma tela desatualizada é recusada pelo servidor com a mensagem da História 6.
- **Marcações antigas fora da janela**: continuam gravadas e visíveis; só não podem mais ser
  alteradas.
- **Teclado virtual aberto** num diálogo: o campo em edição continua visível, e a barra
  inferior não o cobre.
- **"Reduzir movimento"** ativado no sistema: nenhuma animação nova; as existentes seguem a
  regra atual.
- **Atalho criado antes desta mudança** na tela inicial: pode continuar abrindo com a barra
  do navegador até ser removido e adicionado de novo (ver premissas).
- **Sem hábitos**: o estado vazio ("Crie seu primeiro hábito") cabe na tela sem rolagem
  horizontal.
- **Dados já gravados**: nada muda; hábitos, marcações, metas e ordem aparecem como antes.

---

## Requisitos *(obrigatório)*

### Requisitos funcionais

- **RF-001**: Em telas de celular de 360 a 430px de largura, cada hábito DEVE ocupar uma
  linha: na primeira coluna, o emoji em cima e o nome embaixo (até 2 linhas); nas 7 colunas
  seguintes, as marcações dos dias exibidos, todas visíveis sem rolagem horizontal.
- **RF-002**: O dia da semana e a data de cada coluna DEVEM aparecer uma única vez, numa
  faixa acima da lista, alinhada às marcações de todos os hábitos e visível enquanto a
  lista rola.
- **RF-003**: No celular e no computador, o dia de hoje DEVE aparecer na faixa de dias em
  destaque forte (fundo azul, texto branco) e a sua coluna DEVE ter um fundo azul claro
  contínuo, de cima a baixo, atravessando todos os hábitos.
- **RF-004**: No celular, o quadrado visível de cada marcação DEVE ter cerca de 28px, e a
  área que responde ao toque DEVE ser a célula inteira do dia (a largura da coluna, cerca de
  34px em 360px, por pelo menos 44px de altura), sem se sobrepor à área de uma marcação
  vizinha. (Revisão 3: antes, 32px e 44×44px.)
- **RF-005**: O progresso da meta semanal (feitos/meta ou "meta atingida", distinguíveis por
  mais que a cor) DEVE continuar visível em cada hábito com meta.
- **RF-006**: No celular, a primeira coluna DEVE mostrar uma alça fina de arrastar e o
  hábito (emoji, selo da meta ao lado e nome); tocar no emoji ou no nome DEVE abrir a
  edição. Os botões de mover para cima/baixo DEVEM ficar ocultos à vista, mas alcançáveis
  por teclado e leitor de tela, e visíveis enquanto têm o foco.
- **RF-007**: No celular, o título, a navegação entre semanas e o resumo DEVEM ocupar menos
  altura que antes desta spec, sem perder função nem informação, e DEVEM ficar fixos no
  topo junto com a faixa de dias; só a lista de hábitos rola.
- **RF-007a**: No celular e no computador, a semana exibida (setas e período) DEVE ficar
  logo abaixo do título "Semana".
- **RF-008**: Nenhuma tela (entrar, criar conta, semana, arquivados, conta e diálogos) DEVE
  ampliar sozinha ao tocar num campo de texto, e nenhuma DEVE ficar mais larga que a tela
  do celular.
- **RF-009**: O usuário DEVE continuar podendo ampliar a página manualmente (gesto de
  pinça).
- **RF-010**: O app DEVE poder ser adicionado à tela inicial no iPhone (Safari) e no Android
  (Chrome). Aberto pelo atalho, DEVE ocupar a tela inteira sem a barra de endereço do
  navegador, com o nome "Habits", o ícone da logo e a cor do tema, e sem conteúdo escondido
  atrás do entalhe, da barra de status ou da barra de gestos.
- **RF-011**: Em telas de computador, o layout DEVE continuar como o atual, exceto pelo
  que a revisão 2 muda em todas as telas: semana de segunda a domingo sem escolha de modo
  (RF-015), período embaixo do título (RF-007a) e destaque de hoje (RF-003).
- **RF-012**: Todas as funções atuais DEVEM continuar disponíveis no celular: marcar e
  desmarcar dias (inclusive retroativos), dias bloqueados, metas e resumo da semana,
  criar, editar, arquivar, restaurar e excluir hábitos, reordenar arrastando e por teclado,
  navegar entre semanas, trocar senha e sair.
- **RF-013**: Cada marcação DEVE manter o nome acessível atual (hábito e data, e o motivo do
  bloqueio quando houver), foco visível e contraste AA no tema vigente.
- **RF-014**: Depois de entrar, o usuário DEVE continuar logado ao fechar e reabrir o
  navegador ou o app da tela inicial, por até 7 dias desde a entrada. "Sair" continua
  encerrando a sessão na hora, e as demais regras de segurança da sessão não mudam.
- **RF-015**: A semana exibida DEVE ser sempre de segunda a domingo, para todos os usuários,
  no celular e no computador. A escolha entre "Últimos 7 dias" e "Dom–Sáb" DEVE deixar de
  existir. O resumo e o progresso das metas passam a contar a semana de segunda a domingo
  exibida.
- **RF-016**: Só DEVEM poder ser marcados ou desmarcados os dias da semana anterior (segunda
  a domingo) e os da semana atual de segunda até hoje, no horário de Brasília. Os demais
  dias DEVEM aparecer bloqueados (futuros ou só para consulta). Substitui a regra "hoje e os
  6 dias anteriores" das specs 004/005.
- **RF-017**: O servidor DEVE recusar qualquer marcação ou desmarcação fora da janela da
  RF-016, com a mensagem "Só é possível marcar dias da semana atual e da semana anterior.",
  mesmo que a tela permita (Princípio VII).
- **RF-018**: O progresso de cada meta e o resumo da semana DEVEM contar só as marcações de
  segunda a domingo da semana exibida, usando a meta vigente nessa semana.

### Requisitos de compatibilidade

- **RC-001**: Usuários com dados já gravados DEVEM ver exatamente os mesmos hábitos,
  marcações, metas e ordem após a atualização.
- **RC-002**: Usuários com sessão ativa DEVEM continuar logados após a atualização.
- **RC-003**: A preferência de modo da semana já gravada ("Últimos 7 dias" ou "Dom–Sáb") DEVE
  ser ignorada sem erro; nenhuma marcação é apagada ou movida.
- **RC-004**: Marcações já gravadas em dias fora da nova janela DEVEM continuar gravadas e
  visíveis, só sem poder ser alteradas.

---

## Critérios de sucesso *(obrigatório)*

- **CS-001**: Em 360, 375, 390, 414 e 430px de largura, a tela principal mostra os 7 dias
  de todos os hábitos sem rolagem horizontal da página nem da área das marcações.
- **CS-002**: No iPhone, tocar em qualquer campo de texto de qualquer tela ou diálogo não
  muda o zoom da página.
- **CS-003**: Aberto pelo atalho da tela inicial no iPhone e no Android, o app ocupa a tela
  inteira, sem barra de endereço e sem conteúdo atrás do entalhe ou da barra de gestos.
- **CS-004**: Num celular de 390×844 com o app em tela cheia, a tela principal mostra o
  resumo da semana e pelo menos 5 hábitos sem rolar.
- **CS-005**: Toda marcação de dia responde ao toque na célula inteira do dia (pelo menos
  32px de largura em 360px e 44px de altura), sem sobreposição entre dias vizinhos.
- **CS-006**: No computador, a tela principal muda só no previsto pela revisão 2 (período
  embaixo do título, sem a escolha de modo, segunda a domingo e destaque de hoje); a lista,
  a grade e a navegação continuam como antes (comparação de capturas).
- **CS-008**: Com 10 hábitos no celular, ao rolar até o último, o título, a semana, o
  resumo e a faixa de dias não se movem.
- **CS-009**: Em qualquer dia da semana, a primeira coluna é segunda e a última é domingo, e
  a coluna de hoje é identificável em qualquer hábito da lista sem olhar para o topo.
- **CS-007**: Os testes automatizados existentes continuam verdes (ajustados só onde a
  estrutura da tela ou a regra de edição mudou), e nenhum dado existente é perdido.
- **CS-010**: Em qualquer dia da semana, a tela e o servidor aceitam exatamente os dias da
  segunda-feira da semana anterior até hoje, e recusam os demais.

---

## Fora de escopo

- Funcionar sem internet, notificações e publicação em lojas de aplicativos.
- Tema escuro (continua previsto para uma spec futura).
- Mudanças no layout do computador além das três da revisão 2 (RF-011); o arranjo da
  revisão 3 (hábito na primeira coluna com emoji em cima) vale só para o celular.
- Novas funcionalidades (ex.: estatísticas e streaks da spec 003).
- Qualquer mudança no banco, e mudanças na API ou nas regras de negócio além da duração do
  login (RF-014) e da janela de edição (RF-016, RF-017). A preferência de modo da semana
  continua guardada pela API, sem uso; retirá-la é um débito para uma spec futura.
- Escolher em que dia a semana começa.

## Dependências e premissas

- Respeita o design system da spec 009 (paleta de azuis, tema claro, tipografia, logo e
  barra inferior de navegação no celular).
- Mantém o comportamento das specs 004 (semana automática e registro retroativo) e 006
  (metas semanais), **exceto** os dois modos de semana da 004 ("Últimos 7 dias" e
  "Dom–Sáb"), que a revisão 2 substitui pela semana fixa de segunda a domingo (RF-015), e
  da regra de registro retroativo das specs 004/005 ("hoje e os 6 dias anteriores"), que a
  revisão 3 substitui pela semana atual até hoje mais a semana anterior (RF-016).
- Princípio V da constituição: o breakpoint de 570px pode evoluir; a mudança será
  documentada no plan.
- Princípio IV: a ampliação manual da página continua permitida (acessibilidade).
- Quem já adicionou o Habits à tela inicial antes desta mudança pode precisar remover o
  atalho e adicioná-lo de novo para abrir em tela cheia.
- No iPhone, o app da tela inicial guarda o login separado do Safari: na primeira vez que for
  aberto pelo atalho, o usuário precisa entrar de novo.

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
| 2026-11-17 | O que é "não fica 100% da tela"? | As duas coisas: a página fica ampliada/cortada (é preciso arrastar para os lados) e o app deve abrir em tela cheia pelo atalho da tela inicial, sem a barra do navegador |
| 2026-11-17 | Quantos dias aparecem de uma vez no celular? | Os 7 dias, sem rolagem horizontal, de 360 a 430px |
| 2026-11-17 | Tamanho das marcações no celular? | Quadrado visível menor (cerca de 32–36px), com área de toque de cerca de 44px |
| 2026-11-17 | O layout do computador muda? | Não, só o do celular |
| 2026-11-17 | Onde ficam o dia da semana e a data de cada coluna? | Uma faixa única no topo da lista, visível enquanto a lista rola |
| 2026-11-17 | "Ver tudo sem arrastar" vale também para a altura? | Sim: compactar título, navegação de semanas e resumo; rolar para baixo continua permitido, para os lados nunca |
| 2026-11-17 | Quais ações ficam na linha do nome no celular? | Alça de arrastar e editar; mover para cima/baixo sai da vista, mas continua acessível por teclado e leitor de tela |
| 2026-11-17 | Em quais celulares verificar? | iPhone (Safari) e Android (Chrome) |
| 2026-11-17 | Aprovação | Spec aprovada pelo usuário, incluindo a meta da CS-004 (resumo e pelo menos 5 hábitos sem rolar em 390×844) |
| 2026-11-17 | O login sobrevive ao fechar o app da tela inicial? (achado ao planejar: hoje o login vale só enquanto o navegador está aberto, e o app em tela cheia do iPhone costuma perdê-lo ao ser fechado) | Incluir na 010: o login continua valendo por até 7 dias desde a entrada (RF-014); a spec volta para "Em clarificação" até nova aprovação |
| 2026-11-17 | Reaprovação | Spec com a RF-014 e plan aprovados juntos pelo usuário |
| 2026-11-17 | Na implementação, cabiam 4 hábitos em 390×844, e a CS-004 pede 5. Como fica a linha do nome no celular? | Nome e selo da meta ("3/4" ou ✓) na mesma linha; a barra de meta sai da vista só no celular e continua para o leitor de tela. A RF-005 segue atendida pelo selo |
| 2026-11-17 | Revisão 2: quais modos de semana ficam? | Só a semana de segunda a domingo, para todos; sai "Últimos 7 dias" e "Dom–Sáb" (RF-015, US5) |
| 2026-11-17 | Revisão 2: o que fica fixo no topo do celular? | Título, semana, resumo e faixa de dias; só os hábitos rolam (RF-007, CS-008) |
| 2026-11-17 | Revisão 2: como destacar o dia de hoje? | Coluna de hoje com fundo azul contínuo de cima a baixo e o dia na faixa com fundo azul e texto branco (RF-003, CS-009) |
| 2026-11-17 | Revisão 2: período embaixo do título e destaque de hoje valem para o computador? | Sim, no celular e no computador (RF-007a, RF-011) |
| 2026-11-17 | Aprovação da revisão 2 | Spec, plan (P17–P21) e tarefas (T028–T036) aprovados pelo usuário |
| 2026-11-17 | Revisão 3: quais dias podem ser marcados? | A semana anterior inteira e a semana atual de segunda até hoje; dias futuros bloqueados; o resto só consulta (RF-016, RF-017, História 6) |
| 2026-11-17 | Revisão 3: como ficam editar, arrastar e o selo na primeira coluna? | Tocar no emoji ou no nome edita; alça fina à esquerda para arrastar; selo da meta pequeno ao lado do emoji; ↑/↓ só por teclado (RF-006) |
| 2026-11-17 | Revisão 3: tamanho das caixas? | Quadrado de 28px, com toque na célula inteira (~34×44px em 360px), abaixo dos 44px de largura antes exigidos (RF-004, CS-005) |
| 2026-11-17 | Revisão 3: o novo arranjo vale para o computador? | Não, só para o celular; a regra de edição vale para todos |
| 2026-11-17 | Revisão 3: metas de segunda a domingo | Já é assim desde a revisão 2 (a meta conta a semana exibida); fica explícito na RF-018 e coberto por teste |
| 2026-11-17 | Aprovação da revisão 3 | Spec, plan (P22–P26) e tarefas (T037–T045) aprovados pelo usuário |
