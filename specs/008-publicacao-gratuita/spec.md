# Especificação da Feature: Publicação para testes com usuários

**Branch**: `008-publicacao-gratuita` (revisões 2 e 3: `008-publicacao-aws`)
**Criada em**: 2026-11-03
**Status**: Aprovada em 2026-11-16 (revisão 3; revisão 2 aprovada em 2026-11-14;
revisão 1 em 2026-11-03)
**Entrada**: "Quero publicar o sistema para ir testando e disponibilizar para alguns usuários,
sem pagar nada."
**Entrada da revisão 2** (2026-11-14): "Desisti de publicar com a Oracle pois não consegui
máquina disponível. Quero fazer o deploy com a AWS, pois ganhei 200 dólares de crédito por
6 meses."
**Entrada da revisão 3** (2026-11-16): "A ideia do servidor mudou. Agora o servidor vai ter
mais algumas outras pequenas aplicações. Quero um domínio genérico para que possa criar
subdomínios com alguns apps, sendo o Habits um deles (o primeiro)."

> A revisão 3 muda o endereço (subdomínio de um domínio genérico) e passa a tratar o
> servidor como compartilhado com outros apps. `plan.md` e `tasks.md` foram revisados
> para o servidor compartilhado.

## Histórico de revisões

| Revisão | Data | Mudança |
|---------|------|---------|
| 1 | 2026-11-03 | Versão inicial: servidor gratuito permanente |
| 2 | 2026-11-14 | Provedor gratuito sem capacidade → servidor pago com créditos promocionais por 6 meses. Muda a História 4 (sem gasto do próprio bolso, em vez de custo zero), RF-008, CS-003 e os casos de borda; entra RF-011 (aviso de consumo) |
| 3 | 2026-11-16 | Servidor compartilhado com outros apps pequenos; o Habits passa a ter um subdomínio de um domínio genérico. Mudam RF-001, cenário 1.1 e casos de borda; entram RF-012, RF-013, CS-005 e a História 5 |

---

## Histórias de usuário e cenários de aceitação

### História 1 — Acessar o app pela internet (Prioridade: P1)

Como pessoa convidada, quero abrir o app por um endereço público, de qualquer lugar, para
usar meus hábitos sem depender do computador do responsável.

**Teste independente**: abrir o endereço público num celular fora da rede da empresa,
cadastrar-se e marcar um hábito.

**Cenários de aceitação**:

1. **Dado** o endereço público do Habits (um subdomínio do domínio do servidor), **Quando**
   abro no navegador (computador ou celular), **Então** vejo a tela de login, servida com
   conexão segura (cadeado/HTTPS).
2. **Dado** que tento abrir o endereço sem HTTPS, **Quando** a página carrega, **Então** sou
   levado para a versão segura.
3. **Dado** que o computador do responsável está desligado, **Quando** acesso o app,
   **Então** ele continua funcionando.
4. **Dado** qualquer pessoa com o link, **Quando** ela se cadastra, **Então** a conta é criada
   (cadastro aberto, como na spec 005).

---

### História 2 — Meus dados continuam lá (Prioridade: P1)

Como usuário de teste, quero que minhas contas e registros não sumam quando o app é
atualizado ou reiniciado.

**Teste independente**: criar dados, publicar uma nova versão e conferir que continuam.

**Cenários de aceitação**:

1. **Dado** dados gravados, **Quando** o servidor ou o app reinicia, **Então** tudo continua.
2. **Dado** dados gravados, **Quando** uma nova versão é publicada, **Então** contas, hábitos,
   metas e marcações continuam, e eu continuo logado.
3. **Dado** uma mudança de formato dos dados numa versão nova, **Quando** ela é publicada,
   **Então** os dados existentes são convertidos, nunca apagados.

---

### História 3 — Publicar novas versões automaticamente (Prioridade: P2)

Como responsável, quero que cada mudança aprovada vá para o ar sozinha, sem acessar o
servidor.

**Teste independente**: mergear uma mudança visível e vê-la no endereço público.

**Cenários de aceitação**:

1. **Dado** um merge na branch principal, **Quando** a publicação termina, **Então** o
   endereço público mostra a nova versão sem nenhuma ação manual.
2. **Dado** que os testes automatizados falham, **Quando** acontece o merge, **Então** a
   versão NÃO é publicada e a anterior continua no ar.
3. **Dado** que a publicação falha no meio, **Quando** isso acontece, **Então** o responsável
   é avisado e o app não fica fora do ar por mais de alguns minutos.

---

### História 4 — Sem gasto do próprio bolso e segredos protegidos (Prioridade: P1)

Como responsável, quero que a publicação seja paga só com os créditos promocionais que
recebi, sem cobrança no meu cartão, e saber com antecedência se os créditos vão acabar.

**Cenários de aceitação**:

1. **Dado** o uso normal por poucos usuários, **Quando** o mês fecha, **Então** nada é
   cobrado no cartão do responsável: todo o custo é descontado dos créditos.
2. **Dado** o ritmo de consumo de um mês normal, **Quando** é projetado para o período de
   créditos, **Então** os créditos garantidos no cadastro bastam até o fim do período.
3. **Dado** um gasto acima do previsto, **Quando** ele passa do limite mensal combinado,
   **Então** o responsável recebe um aviso por e-mail.
4. **Dado** o repositório público ou compartilhado, **Quando** alguém o lê, **Então** não
   encontra senhas, chaves de acesso ao servidor nem credenciais do banco.
5. **Dado** o servidor publicado, **Quando** alguém de fora tenta acessar diretamente o banco
   ou a API sem passar pelo endereço público, **Então** não consegue.

---

### História 5 — Conviver com outros apps no mesmo servidor (Prioridade: P2)

Como responsável, quero hospedar outros apps pequenos no mesmo servidor, cada um no seu
subdomínio, sem que um atrapalhe o outro.

**Teste independente**: com um segundo app de teste publicado em outro subdomínio, publicar
uma versão nova do Habits e conferir que o outro app continua respondendo.

**Cenários de aceitação**:

1. **Dado** o domínio genérico do servidor, **Quando** um app novo é adicionado, **Então**
   ele ganha um subdomínio próprio com HTTPS, sem custo extra de endereço e sem mudar o
   endereço do Habits.
2. **Dado** outros apps no ar, **Quando** uma versão nova do Habits é publicada, **Então** os
   outros apps continuam respondendo durante e depois da publicação.
3. **Dado** um endereço do domínio que não pertence a nenhum app, **Quando** alguém o abre,
   **Então** não vê o Habits nem dados de nenhum app.
4. **Dado** os dados do Habits, **Quando** outro app roda no mesmo servidor, **Então** ele não
   tem acesso ao banco do Habits.

### Casos de borda

- **Fim do período de créditos (6 meses após o cadastro) ou créditos esgotados**: a conta
  do provedor é encerrada e o servidor é desligado. Sem backup, os dados se perdem. Antes do
  5º mês, uma spec futura decide backup e permanência (ver Clarificações). Até lá, o
  responsável avisa os usuários de teste de que é um período de testes.
- **Créditos consumidos mais rápido que o previsto**: o aviso de RF-011 chega antes de o
  saldo acabar, e o responsável pode reduzir recursos ou antecipar a decisão de permanência.
- **Servidor recriado do zero**: o responsável deve saber recriá-lo a partir do repositório
  (passo a passo documentado), mantendo o mesmo endereço.
- **Endereço**: deve continuar o mesmo entre reinícios e recriações do servidor, e não muda
  quando outros apps entram ou saem.
- **Memória compartilhada**: o servidor tem pouca memória para vários apps. Ao adicionar o
  2º app, o responsável reavalia o tamanho do servidor (e o custo de RF-008).
- **Recriar o servidor**: além do Habits, o passo a passo do servidor compartilhado precisa
  ser refeito antes (RF-009).
- **Sessões**: cookies só trafegam em conexão segura no ambiente publicado.

---

## Requisitos

### Requisitos funcionais

- **RF-001**: O app DEVE estar acessível por um endereço público fixo, com HTTPS: um
  subdomínio próprio do domínio genérico do servidor.
- **RF-002**: O app publicado DEVE funcionar com o computador do responsável desligado.
- **RF-003**: Dados DEVEM sobreviver a reinícios e a publicações de novas versões.
- **RF-004**: Cada merge na branch principal DEVE publicar a nova versão automaticamente,
  somente se os testes automatizados passarem.
- **RF-005**: O responsável DEVE ser avisado quando uma publicação falhar.
- **RF-006**: Banco e API NÃO DEVEM ser acessíveis da internet a não ser pelo endereço
  público.
- **RF-007**: Nenhum segredo DEVE ficar no repositório.
- **RF-008**: A publicação NÃO DEVE gerar cobrança no cartão do responsável durante o
  período de créditos. O custo mensal DEVE caber nos créditos garantidos no cadastro, sem
  depender dos créditos extras condicionados a atividades.
- **RF-009**: DEVE existir um passo a passo para recriar o servidor do zero.
- **RF-010**: O desenvolvimento local (`docker compose` no WSL) DEVE continuar funcionando
  como hoje.
- **RF-011**: O responsável DEVE receber um aviso por e-mail quando o gasto do mês passar
  do limite combinado (CS-003).
- **RF-012**: O servidor DEVE poder hospedar outros apps, cada um no seu subdomínio do mesmo
  domínio genérico, sem custo extra de endereço. A configuração comum do servidor (entrada
  HTTPS e encaminhamento por subdomínio) NÃO DEVE ficar no repositório do Habits.
- **RF-013**: Publicar, reiniciar ou falhar uma versão do Habits NÃO DEVE derrubar os outros
  apps do servidor, e outros apps NÃO DEVEM acessar o banco do Habits.

### Requisitos de compatibilidade

- **RC-001**: Atualizações NÃO DEVEM apagar contas, hábitos, metas ou marcações.

---

## Critérios de sucesso

- **CS-001**: Um usuário convidado abre o link e se cadastra pelo celular em até 2 minutos.
- **CS-002**: Do merge até a nova versão no ar: até 15 minutos, sem ação manual.
- **CS-003**: R$ 0,00 cobrados no cartão; gasto de no máximo US$ 16 por mês, que cabe nos
  US$ 100 de créditos garantidos durante os 6 meses.
- **CS-004**: 0 segredos no repositório (verificado por busca antes do merge).
- **CS-005**: Adicionar um app novo ao servidor não exige nenhuma mudança no repositório do
  Habits.

---

## Fora de escopo

- Backups automáticos (spec futura antes de abrir para mais usuários).
- Permanência após o período de créditos: migrar, pagar ou encerrar (spec futura, a
  iniciar antes do 5º mês).
- Domínio próprio pago, e-mails transacionais, recuperação de senha.
- Restrição de cadastro por convite ou lista de e-mails.
- Os outros apps do servidor (cada um terá sua própria especificação).
- Monitoramento avançado, alta disponibilidade, múltiplos servidores.

## Dependências e premissas

- Constituição **2.1.1** (Princípio VII — segurança).
- Specs 005, 006 e 007 implementadas.
- Um repositório próprio do servidor compartilhado (`servidor-apps`), com a entrada HTTPS,
  o encaminhamento por subdomínio e a preparação do servidor. O Habits depende dele para ir
  ao ar.
- O responsável cria a conta no provedor de hospedagem, no plano gratuito com créditos
  promocionais, e no serviço de subdomínio gratuito. O cadastro pode pedir cartão apenas
  para validação.
- Os créditos garantidos no cadastro são US$ 100. Até US$ 100 a mais podem ser obtidos com
  atividades no provedor, mas não entram na conta do custo (RF-008).

---

## Checklist de qualidade da spec

- [x] Nenhum detalhe de implementação nos requisitos
- [x] Toda história tem cenários testáveis
- [x] Requisitos verificáveis e sem ambiguidade
- [x] Critérios de sucesso mensuráveis
- [x] Casos de borda e dados existentes considerados (RC-001)
- [x] Nenhuma marcação `[NEEDS CLARIFICATION]` pendente
- [x] Conforme a [constituição](../../.specify/memory/constitution.md) 2.1.1

## Clarificações

| Data | Pergunta | Decisão |
|------|----------|---------|
| 2026-11-03 | Onde publicar? | ~~Máquina virtual gratuita permanente (Oracle Cloud "Always Free")~~ — substituída em 2026-11-14 |
| 2026-11-03 | Quem pode se cadastrar? | Qualquer pessoa com o link |
| 2026-11-03 | Endereço? | ~~Subdomínio gratuito fixo, com HTTPS~~ — substituída em 2026-11-16 |
| 2026-11-03 | Backup? | Sem backup nesta fase (risco aceito; spec futura) |
| 2026-11-03 | Como publicar versões novas? | Automático a cada merge na principal, se os testes passarem |
| 2026-11-03 | Dados podem ser zerados nos testes? | Não; preservar sempre |
| 2026-11-14 | Por que trocar de provedor? | A Oracle não teve máquina gratuita disponível em São Paulo ("Out of capacity") em várias tentativas |
| 2026-11-14 | Onde publicar? | AWS, plano gratuito com créditos promocionais (US$ 100 no cadastro + até US$ 100 com atividades; validade de 6 meses) |
| 2026-11-14 | Qual serviço da AWS? | Amazon Lightsail: preço fixo por mês, IP fixo e firewall incluídos, painel simples |
| 2026-11-14 | Tamanho do servidor? | 2 GB de memória (cerca de US$ 12/mês; ~US$ 72 em 6 meses, dentro dos US$ 100 garantidos) |
| 2026-11-14 | Região? | ~~São Paulo (menor atraso para usuários no Brasil)~~ — substituída em 2026-11-16 |
| 2026-11-16 | Região? | Ohio (EUA): o servidor já foi criado lá; mesmo preço e um pouco mais de atraso para usuários no Brasil, aceito na fase de testes |
| 2026-11-16 | O servidor é só do Habits? | Não: o `servidor-apps` vai hospedar outros apps pequenos; o Habits é o primeiro |
| 2026-11-16 | Endereço? | Domínio genérico gratuito no DuckDNS (`<nome>.duckdns.org`), com cada app num subdomínio; o Habits fica em `habits.<nome>.duckdns.org`. Substitui a decisão de 2026-11-03 de um subdomínio só para o Habits |
| 2026-11-16 | Onde fica a entrada HTTPS comum? | Num repositório novo, `servidor-apps`, junto com a preparação do servidor; cada app só se conecta a ela |
| 2026-11-16 | Tamanho do servidor com vários apps? | Manter 2 GB por enquanto; reavaliar ao adicionar o 2º app |
| 2026-11-14 | O que fazer ao fim dos 6 meses? | Decidir depois: risco registrado; uma spec futura sobre backup e permanência começa antes do 5º mês |
