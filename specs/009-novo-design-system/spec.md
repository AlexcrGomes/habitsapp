# Especificação da Feature: Novo design system (azul, tema claro) e nova logo

**Branch**: `009-novo-design-system`
**Criada em**: 2026-11-09
**Status**: Implementada em 2026-11-09 (aprovada no mesmo dia, com a logo em [`logo/`](logo/) e a emenda 2.1.0 da constituição; verificação em [tasks.md](./tasks.md))
**Plano**: [plan.md](./plan.md) (aprovado em 2026-11-09) | **Tarefas**: [tasks.md](./tasks.md)
**Entrada**: descrição original do pedido: "na nova spec quero mudar todo o layout do
sistema, todo o design foi aplicado de um projeto antigo então quero reconstruir o design
system do sistema. Aplique bibliotecas como Untitled UI (avatares), shadcn/ui e Glisse. O
novo padrão de cor deve ser azul com vários tons e de uma forma bem moderna. Crie uma logo
nova para o sistema como se fosse um H de Habits com blocos demonstrando a construção de
algo novo."

> Esta é uma spec de interface: não muda regras de negócio, dados nem a API. O "o quê" é
> uma identidade visual nova e própria do Habits (logo, cores, componentes e estrutura de
> navegação), aplicada de forma consistente a todas as telas, sem perder nenhuma
> funcionalidade nem acessibilidade.
>
> O conceito da logo está em [`logo/`](logo/) (prévia: [`logo/preview.png`](logo/preview.png))
> e faz parte do que é aprovado com esta spec.

---

## Histórias de usuário e cenários de aceitação *(obrigatório)*

### História 1 — Nova identidade visual (Prioridade: P1)

Como usuário, quero um app com aparência moderna e própria — logo nova e uma paleta de
azuis em fundo claro — para que o Habits pareça um produto atual e coerente, e não uma
adaptação de outro projeto.

**Por que esta prioridade**: é o motivo do pedido; todo o resto se apoia nesta identidade.

**Teste independente**: abrir cada tela (entrar, criar conta, tela principal, cada diálogo)
e conferir logo, cores e tipografia novas, sem restos do visual anterior.

**Cenários de aceitação**:

1. **Dado** que abro o app, **Quando** a tela de entrada carrega, **Então** vejo a nova
   logo (o "H" formado por blocos azuis) e a interface em fundo claro com tons de azul.
2. **Dado** que estou logado, **Quando** navego pela tela principal e abro qualquer
   diálogo, **Então** todos usam a mesma paleta, tipografia, cantos e sombras.
3. **Dado** a aba do navegador ou o atalho na tela inicial do celular, **Quando** olho o
   ícone do app, **Então** vejo a versão reduzida da nova logo, legível em tamanho pequeno.
4. **Dado** qualquer tela, **Quando** procuro a cor violeta ou o fundo escuro antigos,
   **Então** não os encontro.

---

### História 2 — Nova estrutura de navegação (Prioridade: P1)

Como usuário, quero uma navegação clara e sempre à mão — menu lateral no computador e
barra inferior no celular — para chegar rápido à semana, aos hábitos arquivados, à minha
conta e à criação de hábitos.

**Por que esta prioridade**: o pedido é mudar todo o layout, não só as cores; a navegação
é a estrutura que organiza todas as telas.

**Teste independente**: no computador e no celular, alcançar cada destino (Semana,
Arquivados, Conta, Novo hábito) a partir da tela principal, inclusive só com teclado.

**Cenários de aceitação**:

1. **Dado** que estou logado no computador, **Quando** a tela principal abre, **Então**
   vejo um menu lateral com a logo, "Semana", "Arquivados", o botão "Novo hábito" em
   destaque e, no rodapé, meu avatar com nome e as opções "Trocar senha" e "Sair".
2. **Dado** que estou logado no celular, **Quando** a tela principal abre, **Então** vejo
   uma barra inferior fixa com os mesmos destinos e o "Novo hábito" em destaque, e o
   conteúdo não fica escondido atrás dela.
3. **Dado** qualquer destino do menu, **Quando** o ativo, **Então** ele fica marcado como
   atual (visualmente e para leitores de tela).
4. **Dado** que uso só o teclado, **Quando** percorro o menu com Tab, **Então** alcanço e
   ativo todos os destinos com foco visível.
5. **Dado** que clico em "Arquivados", **Quando** a tela abre, **Então** vejo meus
   hábitos arquivados em uma tela própria, com as mesmas ações de hoje (restaurar e
   excluir), e o endereço no navegador muda para o dessa tela.
6. **Dado** que estou em "Arquivados", **Quando** uso o botão voltar do navegador ou
   clico em "Semana", **Então** volto para a tela principal na mesma semana em que estava.
7. **Dado** que restauro um hábito em "Arquivados", **Quando** volto para "Semana",
   **Então** ele aparece na lista com as marcações e a meta que tinha.
8. **Dado** que abro o endereço de "Arquivados" diretamente (favorito ou link) sem estar
   logado, **Quando** entro, **Então** sou levado à tela de "Arquivados".

---

### História 3 — Entrar e criar conta redesenhadas (Prioridade: P2)

Como visitante, quero telas de entrada e cadastro bonitas e claras para ter boa primeira
impressão e entender o que é o app.

**Por que esta prioridade**: é a primeira tela que um novo usuário vê, mas não bloqueia o
uso do app.

**Teste independente**: abrir "Entrar" e "Criar conta" no computador e no celular,
preencher com erro e com sucesso.

**Cenários de aceitação**:

1. **Dado** o computador, **Quando** abro "Entrar" ou "Criar conta", **Então** vejo duas
   colunas: um painel de marca (logo, frase sobre construir hábitos bloco a bloco) e o
   formulário.
2. **Dado** o celular, **Quando** abro as mesmas telas, **Então** vejo uma coluna só, com a
   logo acima do formulário e sem rolagem horizontal.
3. **Dado** um campo inválido ou login recusado, **Quando** envio, **Então** a mensagem de
   erro aparece junto ao campo ou ao formulário, com o mesmo texto de hoje, e é anunciada
   por leitores de tela.

---

### História 4 — Componentes consistentes (Prioridade: P2)

Como usuário, quero que botões, campos, diálogos e indicadores se comportem e pareçam
iguais em todo o app para não ter que reaprender a interface em cada tela.

**Por que esta prioridade**: dá coerência ao design system; sem ela a identidade nova fica
remendada.

**Teste independente**: comparar os mesmos tipos de elemento em telas diferentes.

**Cenários de aceitação**:

1. **Dado** qualquer ação principal (Entrar, Salvar, Criar hábito), **Quando** a vejo,
   **Então** ela usa o mesmo botão principal azul; ações destrutivas (Excluir, Arquivar)
   usam o mesmo estilo de perigo; ações secundárias, o mesmo estilo neutro.
2. **Dado** o usuário logado, **Quando** vejo meu avatar, **Então** ele mostra as
   iniciais do meu nome em um círculo com tom de azul.
3. **Dado** um hábito com meta semanal, **Quando** vejo seu progresso, **Então** a barra e
   o selo de meta seguem o mesmo padrão em todos os lugares, e "meta atingida" é
   distinguível de "em andamento" por mais que a cor (texto ou ícone).
4. **Dado** uma mensagem de erro ou sucesso, **Quando** ela aparece, **Então** usa o mesmo
   padrão visual em todo o app.

---

### História 5 — Microinterações (Prioridade: P3)

Como usuário, quero pequenos movimentos que deem retorno ao marcar um dia e ao abrir
menus, para que registrar hábitos seja agradável.

**Por que esta prioridade**: acabamento; o app funciona sem isso.

**Teste independente**: marcar e desmarcar um dia; abrir e fechar diálogos e o menu da
conta; repetir com "reduzir movimento" ativado no sistema.

**Cenários de aceitação**:

1. **Dado** um dia não marcado, **Quando** o marco, **Então** o quadrado se preenche com
   uma animação curta de "bloco encaixando" (eco da logo), sem atrasar o registro.
2. **Dado** um diálogo ou menu, **Quando** abre ou fecha, **Então** a transição é suave e
   curta.
3. **Dado** que o sistema pede "reduzir movimento", **Quando** faço as mesmas ações,
   **Então** não há animação, só a mudança de estado.

---

### Casos de borda

- Nome do usuário com uma só palavra, acentos ou muito longo: o avatar mostra 1–2
  iniciais e o nome é truncado sem quebrar o layout.
- Muitos hábitos ou nomes longos: a lista rola dentro do conteúdo; o menu lateral e a
  barra inferior continuam visíveis.
- Tela estreita (360 px) com a semana inteira: a grade de dias rola na horizontal dentro
  da sua área, como hoje, sem rolar a página inteira.
- Zoom do navegador em 200%: o conteúdo continua utilizável.
- Teclado virtual aberto no celular durante um formulário: a barra inferior não cobre o
  campo em edição.
- Nenhum hábito arquivado: a tela "Arquivados" mostra um estado vazio explicando como
  arquivar um hábito.
- Endereço inexistente digitado no navegador: o usuário é levado à tela principal.
- Dados já gravados: nada muda; hábitos, marcações, metas e ordem aparecem como antes.

---

## Requisitos *(obrigatório)*

### Requisitos funcionais

- **RF-001**: Todas as funcionalidades atuais DEVEM continuar acessíveis: marcar/desmarcar
  dias (incluindo retroativos), metas semanais e resumo da semana, criar/editar/arquivar/
  restaurar/excluir hábitos, reordenar por arrastar e por teclado, alternar semana
  calendário/corrida, navegar entre semanas, trocar senha e sair.
- **RF-002**: O app DEVE ter um tema único claro.
- **RF-003**: A cor principal DEVE ser azul, com uma escala de tons (do mais claro ao mais
  escuro) usada para fundos, destaques, estados e textos; as cores de sucesso, erro e
  aviso DEVEM ser distinguíveis do azul.
- **RF-004**: Textos DEVEM ter contraste mínimo de 4,5:1 (3:1 para texto grande) e
  elementos gráficos de controle, 3:1 (nível AA).
- **RF-005**: Todo elemento interativo DEVE ser alcançável e acionável por teclado, com
  foco visível em azul.
- **RF-006**: Os textos atuais DEVEM permanecer em pt-BR e com o mesmo conteúdo; textos
  novos (rótulos de navegação, frase do painel de marca) também em pt-BR.
- **RF-007**: A nova logo DEVE existir em três versões: ícone, ícone com o nome "Habits" e
  versão reduzida para aba do navegador e atalho na tela inicial do celular.
- **RF-008**: O usuário logado DEVE ver um avatar com as iniciais do seu nome.
- **RF-009**: Animações DEVEM ser curtas e desativadas quando o sistema pedir "reduzir
  movimento".
- **RF-010**: A interface DEVE funcionar de 360 px de largura até desktop, sem rolagem
  horizontal da página, com menu lateral em telas largas e barra inferior em telas
  estreitas.
- **RF-011**: O destino atual da navegação DEVE ser indicado visualmente e para leitores
  de tela.
- **RF-012**: Imagens da logo DEVEM ter texto alternativo descritivo.
- **RF-013**: "Arquivados" DEVE ser uma tela própria, com endereço próprio no navegador,
  compatível com os botões voltar/avançar e com favoritos; as ações de restaurar e
  excluir continuam as mesmas.

### Requisitos de compatibilidade

- **RC-001**: Usuários com dados já gravados DEVEM ver exatamente os mesmos hábitos,
  marcações, metas e ordem após a atualização.
- **RC-002**: Usuários com sessão ativa DEVEM continuar logados após a atualização.

---

## Critérios de sucesso *(obrigatório)*

- **CS-001**: Nenhuma tela mantém a paleta violeta/cinza-escura, o fundo escuro ou a logo
  antiga.
- **CS-002**: 100% dos textos e controles verificados atingem o contraste AA.
- **CS-003**: Todas as tarefas da RF-001 são concluídas só com teclado.
- **CS-004**: A tela principal é utilizável em 360 px de largura sem rolagem horizontal da
  página.
- **CS-005**: Os testes automatizados existentes continuam verdes (ajustados só onde a
  estrutura da tela mudou) e nenhum dado existente é perdido.
- **CS-006**: Qualquer destino da navegação é alcançado com no máximo 1 toque/clique a
  partir da tela principal.

---

## Fora de escopo

- Tema escuro (spec futura, por decisão do usuário).
- Novas funcionalidades (ex.: estatísticas e streaks da spec 003).
- Qualquer mudança na API, no banco ou nas regras de negócio.
- Usar a biblioteca Glisse como dependência: dela vem só a inspiração do efeito "vidro",
  aplicado em poucos pontos.

## Dependências e premissas

- Exige **emenda da constituição** (MINOR → 2.1.0), feita em 2026-11-09 junto com a
  aprovação desta spec:
  - Princípio IV: "Manter contraste adequado no tema escuro (fundo `#09090A`)" passa a
    exigir contraste AA no tema vigente;
  - Restrições técnicas → Fontes: passa a refletir a tipografia definida no plan.
- Princípio V: o breakpoint de 570 px pode evoluir; a mudança será documentada no plan.
- Referências visuais indicadas pelo usuário: shadcn/ui (base dos componentes), Untitled UI
  (avatares, selos, cartões) e Glisse (efeito "vidro" pontual).
- Specs 001–008 continuam valendo como comportamento; só a aparência muda.

---

## Checklist de qualidade da spec

- [x] Nenhum detalhe de implementação (tecnologia, arquivo, função)
- [x] Toda história tem cenários *Dado/Quando/Então* testáveis
- [x] Requisitos são verificáveis e sem ambiguidade
- [x] Critérios de sucesso são mensuráveis
- [x] Casos de borda e dados existentes foram considerados
- [x] Nenhuma marcação `[NEEDS CLARIFICATION]` pendente
- [x] Conforme a [constituição](../../.specify/memory/constitution.md) (emenda 2.1.0 de
      2026-11-09)

## Clarificações

| Data | Pergunta | Decisão |
|------|----------|---------|
| 2026-11-09 | Base do design system? | Estilo shadcn/ui, com padrões visuais do Untitled UI (avatares, selos, cartões); efeito "vidro" do Glisse só em 1–2 pontos, sem usar a biblioteca |
| 2026-11-09 | Tema claro, escuro ou ambos? | Só claro; o escuro fica para uma spec futura |
| 2026-11-09 | Mudar a estrutura das telas ou só o visual? | Nova estrutura de navegação + novo visual; funcionalidades iguais |
| 2026-11-09 | Estilo da logo? | "H" formado por blocos em degradê de azuis, com o último bloco "encaixando"; versões ícone e ícone + nome |
| 2026-11-09 | "Arquivados" vira tela própria ou continua diálogo? | Tela própria, com endereço próprio no navegador |
| 2026-11-09 | Aprovação | Spec e conceito da logo aprovados; constituição emendada para 2.1.0 |
