# Especificação da Feature: Contas de usuário com dados no servidor

**Branch**: `005-contas-e-servidor`
**Criada em**: 2026-11-01
**Status**: Implementada em 2026-11-01 (aprovada em 2026-11-01)
**Entrada**: "Quero mudar a arquitetura da aplicação: conteinerizar, colocar um login para que
cada usuário só tenha acesso aos seus hábitos e registros, e ter um banco de dados para
persistir esses dados."

> Plano de implementação: [plan.md](./plan.md). Exige a constituição **2.0.0**.

---

## Histórias de usuário e cenários de aceitação

### História 1 — Criar conta (Prioridade: P1)

Como pessoa nova, quero criar minha conta para começar a registrar meus hábitos.

**Por que esta prioridade**: sem conta não há acesso ao app.

**Teste independente**: cadastrar-se e cair na tela principal, já logado.

**Cenários de aceitação**:

1. **Dado** a tela de cadastro, **Quando** informo nome, e-mail e senha válidos, **Então** a
   conta é criada e entro no app já logado, com a lista de hábitos vazia.
2. **Dado** um e-mail já cadastrado (sem diferenciar maiúsculas/minúsculas), **Quando**
   tento me cadastrar com ele, **Então** vejo "Este e-mail já está cadastrado." e nada é
   criado.
3. **Dado** uma senha com menos de 8 caracteres, **Quando** tento me cadastrar, **Então**
   vejo "A senha deve ter pelo menos 8 caracteres."
4. **Dado** nome vazio ou e-mail em formato inválido, **Quando** tento me cadastrar,
   **Então** vejo a mensagem do campo com problema.

---

### História 2 — Entrar e sair (Prioridade: P1)

Como usuário, quero entrar com e-mail e senha e sair quando quiser.

**Teste independente**: sair, entrar de novo e encontrar os mesmos dados.

**Cenários de aceitação**:

1. **Dado** e-mail e senha corretos, **Quando** entro, **Então** vejo meus hábitos e a semana atual.
2. **Dado** e-mail inexistente ou senha errada, **Quando** tento entrar, **Então** vejo
   "E-mail ou senha inválidos." (a mesma mensagem nos dois casos).
3. **Dado** que estou logado, **Quando** clico em "Sair", **Então** volto para a tela de
   login e não consigo mais acessar meus dados sem entrar de novo.
4. **Dado** que entrei, **Quando** fico até 7 dias sem usar o app, **Então** continuo
   logado; **Quando** passam mais de 7 dias sem uso, **Então** preciso entrar de novo.
5. **Dado** que não estou logado, **Quando** abro o app, **Então** vejo a tela de login,
   com link para criar conta.

---

### História 3 — Meus dados são só meus (Prioridade: P1)

Como usuário, quero ter certeza de que ninguém vê ou altera meus hábitos e registros.

**Por que esta prioridade**: é o motivo central do login.

**Teste independente**: duas contas em navegadores diferentes; nenhuma enxerga a outra.

**Cenários de aceitação**:

1. **Dado** dois usuários A e B, **Quando** A entra, **Então** vê só os hábitos, marcações e
   preferência dele.
2. **Dado** que B conhece o identificador de um hábito de A, **Quando** B tenta ver,
   alterar, arquivar, excluir, reordenar ou marcar esse hábito, **Então** a operação falha
   como se o hábito não existisse, e nada de A é alterado.
3. **Dado** dois usuários, **Quando** ambos criam um hábito chamado "Ler", **Então** os dois
   conseguem (nomes únicos valem por usuário).

---

### História 4 — Tudo o que já existe continua funcionando (Prioridade: P1)

Como usuário, quero as mesmas funções de hoje, agora guardadas na minha conta.

**Teste independente**: executar os checklists das specs 002 e 004 em uma conta.

**Cenários de aceitação**:

1. **Dado** minha conta, **Quando** uso o app, **Então** valem todas as regras de
   [002 — Hábitos personalizáveis](../002-habitos-personalizaveis/spec.md): criar (nome até
   30 caracteres, emoji opcional), editar, arquivar, restaurar, excluir definitivamente só
   arquivados, limite de 10 ativos, nomes únicos entre ativos e arquivados, reordenar
   arrastando e com ↑/↓.
2. **Dado** minha conta, **Quando** uso o app, **Então** valem todas as regras de
   [004 — Semana automática](../004-calendario-semanal/spec.md): semana aparece sozinha,
   modos "Últimos 7 dias"/"Dom–Sáb" (preferência guardada na conta), edição só de hoje e dos
   6 dias anteriores, semanas antigas só para consulta, celular abre no dia de hoje.
3. **Dado** que tento marcar um dia fora da janela permitida por qualquer meio, **Quando**
   o servidor recebe o pedido, **Então** ele é recusado.

---

### História 5 — Usar em outro navegador ou dispositivo (Prioridade: P2)

**Cenários de aceitação**:

1. **Dado** que marquei hábitos no computador, **Quando** entro pelo celular, **Então** vejo
   as mesmas marcações, hábitos, ordem e preferência de semana.
2. **Dado** duas abas abertas, **Quando** altero algo em uma e recarrego a outra, **Então**
   a outra mostra a alteração.

---

### História 6 — Trocar a senha (Prioridade: P2)

**Cenários de aceitação**:

1. **Dado** que estou logado, **Quando** informo a senha atual correta e uma nova com 8 ou
   mais caracteres, **Então** a senha é trocada e continuo logado.
2. **Dado** a senha atual errada, **Quando** tento trocar, **Então** vejo "Senha atual
   incorreta." e nada muda.
3. **Dado** que troquei a senha, **Quando** entro de novo, **Então** só a nova funciona.

### Casos de borda

- **Sessão expirada durante o uso**: a próxima ação leva à tela de login com o aviso
  "Sua sessão expirou. Entre novamente."; nenhuma alteração é perdida em silêncio.
- **Falha de comunicação com o servidor**: a marcação que não foi salva volta ao estado
  anterior e aparece um aviso.
- **E-mail com espaços ou maiúsculas**: " Ana@Email.com " = "ana@email.com".
- **Virada do dia**: o "hoje" segue o horário de Brasília para todos os usuários.
- **Dados antigos do navegador**: não são importados nem apagados.

---

## Requisitos

### Requisitos funcionais

- **RF-001**: Qualquer pessoa DEVE conseguir criar conta com nome, e-mail e senha.
- **RF-002**: O e-mail DEVE ser único, comparado sem espaços nas pontas e sem diferenciar
  maiúsculas/minúsculas.
- **RF-003**: A senha DEVE ter no mínimo 8 caracteres.
- **RF-004**: O usuário DEVE conseguir entrar com e-mail e senha, e sair.
- **RF-005**: A mensagem de falha de login NÃO DEVE revelar se o e-mail existe.
- **RF-006**: A sessão DEVE expirar após 7 dias sem uso.
- **RF-007**: Todos os hábitos, marcações e a preferência de semana DEVEM pertencer a um
  usuário e ser acessíveis somente por ele.
- **RF-008**: Os dados DEVEM ser guardados no servidor e sobreviver a reinícios.
- **RF-009**: Todas as regras das specs 002 e 004 DEVEM continuar valendo e ser aplicadas
  também pelo servidor.
- **RF-010**: O "hoje" DEVE seguir o horário de Brasília.
- **RF-011**: O usuário logado DEVE conseguir trocar a senha informando a atual.
- **RF-012**: O app DEVE mostrar o nome do usuário logado e a opção "Sair".
- **RF-013**: Todas as telas e mensagens (inclusive de erro do servidor) DEVEM estar em
  pt-BR e ser acessíveis por teclado.

### Requisitos de compatibilidade

- **RC-001**: Dados salvos no navegador pelas versões anteriores NÃO são importados
  (decisão do responsável) e NÃO são apagados.

### Entidades-chave

- **Usuário**: nome, e-mail (único), senha (guardada só de forma irreversível), preferência
  de semana.
- **Hábito**: pertence a um usuário; nome, emoji, ordem, situação (ativo/arquivado).
- **Marcação**: hábito × data.

---

## Critérios de sucesso

- **CS-001**: Criar conta leva no máximo 1 tela e 4 campos.
- **CS-002**: 0 casos em que um usuário consegue ler ou alterar dados de outro (verificado
  por testes automatizados em todas as operações).
- **CS-003**: 100% dos dados continuam após reiniciar toda a aplicação.
- **CS-004**: Todos os cenários das specs 002 e 004 passam em uma conta.

---

## Fora de escopo

- Recuperação de senha por e-mail ("esqueci minha senha") — spec futura.
- Login com Microsoft, Google ou outros provedores.
- Importação dos dados antigos do navegador.
- Excluir a própria conta; perfis de administrador.
- Deploy em produção (servidor, domínio, HTTPS) — spec futura.
- Uso sem conexão (offline).

## Dependências e premissas

- Constituição **2.0.0** (nova stack, dados no servidor, testes automatizados, segurança).
- Comportamento base: specs [002](../002-habitos-personalizaveis/spec.md) e
  [004](../004-calendario-semanal/spec.md).

---

## Checklist de qualidade da spec

- [x] Nenhum detalhe de implementação nos requisitos
- [x] Toda história tem cenários testáveis
- [x] Requisitos verificáveis e sem ambiguidade
- [x] Critérios de sucesso mensuráveis
- [x] Dados existentes considerados (RC-001)
- [x] Nenhuma marcação `[NEEDS CLARIFICATION]` pendente
- [x] Conforme a [constituição](../../.specify/memory/constitution.md) 2.0.0

## Clarificações

| Data | Pergunta | Decisão |
|------|----------|---------|
| 2026-11-01 | Tecnologia do backend? | Java + Spring Boot |
| 2026-11-01 | Banco de dados? | PostgreSQL |
| 2026-11-01 | Forma de login? | E-mail e senha próprios |
| 2026-11-01 | Quem pode criar conta? | Qualquer pessoa |
| 2026-11-01 | Dados do navegador? | Descartados (sem importação) |
| 2026-11-01 | Frontend? | Reescrito em React; contêineres separados para banco, API e front |
| 2026-11-01 | Recuperação de senha? | Spec futura; agora só troca de senha logado |
| 2026-11-01 | Onde roda? | Local com Docker Compose; deploy é spec futura |
| 2026-11-01 | Testes automatizados? | Backend e frontend |
| 2026-11-01 | React com TypeScript? | Sim |
| 2026-11-01 | Fuso do "hoje"? | Horário de Brasília fixo |
| 2026-11-01 | Senha e sessão? | Mínimo 8 caracteres; sessão de 7 dias sem uso |
