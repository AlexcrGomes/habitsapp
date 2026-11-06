# Especificação da Feature: Publicação gratuita para testes com usuários

**Branch**: `008-publicacao-gratuita`
**Criada em**: 2026-11-03
**Status**: Aprovada em 2026-11-03
**Entrada**: "Quero publicar o sistema para ir testando e disponibilizar para alguns usuários,
sem pagar nada."

> Próximo passo: escrever `plan.md` e `tasks.md`. O número 007 está reservado para a
> atualização de dependências vulneráveis.

---

## Histórias de usuário e cenários de aceitação

### História 1 — Acessar o app pela internet (Prioridade: P1)

Como pessoa convidada, quero abrir o app por um endereço público, de qualquer lugar, para
usar meus hábitos sem depender do computador do responsável.

**Teste independente**: abrir o endereço público num celular fora da rede da empresa,
cadastrar-se e marcar um hábito.

**Cenários de aceitação**:

1. **Dado** o endereço público, **Quando** abro no navegador (computador ou celular),
   **Então** vejo a tela de login, servida com conexão segura (cadeado/HTTPS).
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

### História 4 — Custo zero e segredos protegidos (Prioridade: P1)

**Cenários de aceitação**:

1. **Dado** o uso normal por poucos usuários, **Quando** o mês fecha, **Então** não há
   nenhuma cobrança.
2. **Dado** o repositório público ou compartilhado, **Quando** alguém o lê, **Então** não
   encontra senhas, chaves de acesso ao servidor nem credenciais do banco.
3. **Dado** o servidor publicado, **Quando** alguém de fora tenta acessar diretamente o banco
   ou a API sem passar pelo endereço público, **Então** não consegue.

### Casos de borda

- **Servidor gratuito recuperado pelo provedor por inatividade**: o responsável deve saber
  recriá-lo a partir do repositório (passo a passo documentado). Sem backup, os dados se
  perdem nesse caso — risco aceito para a fase de testes (ver Clarificações).
- **Falta de capacidade gratuita na região**: documentar como tentar outra configuração.
- **Endereço gratuito**: deve continuar o mesmo entre reinícios do servidor.
- **Sessões**: cookies só trafegam em conexão segura no ambiente publicado.

---

## Requisitos

### Requisitos funcionais

- **RF-001**: O app DEVE estar acessível por um endereço público fixo, com HTTPS.
- **RF-002**: O app publicado DEVE funcionar com o computador do responsável desligado.
- **RF-003**: Dados DEVEM sobreviver a reinícios e a publicações de novas versões.
- **RF-004**: Cada merge na branch principal DEVE publicar a nova versão automaticamente,
  somente se os testes automatizados passarem.
- **RF-005**: O responsável DEVE ser avisado quando uma publicação falhar.
- **RF-006**: Banco e API NÃO DEVEM ser acessíveis da internet a não ser pelo endereço
  público.
- **RF-007**: Nenhum segredo DEVE ficar no repositório.
- **RF-008**: O custo mensal DEVE ser zero.
- **RF-009**: DEVE existir um passo a passo para recriar o servidor do zero.
- **RF-010**: O desenvolvimento local (`docker compose` no WSL) DEVE continuar funcionando
  como hoje.

### Requisitos de compatibilidade

- **RC-001**: Atualizações NÃO DEVEM apagar contas, hábitos, metas ou marcações.

---

## Critérios de sucesso

- **CS-001**: Um usuário convidado abre o link e se cadastra pelo celular em até 2 minutos.
- **CS-002**: Do merge até a nova versão no ar: até 15 minutos, sem ação manual.
- **CS-003**: R$ 0,00 cobrados por mês.
- **CS-004**: 0 segredos no repositório (verificado por busca antes do merge).

---

## Fora de escopo

- Backups automáticos (spec futura antes de abrir para mais usuários).
- Domínio próprio pago, e-mails transacionais, recuperação de senha.
- Restrição de cadastro por convite ou lista de e-mails.
- Monitoramento avançado, alta disponibilidade, múltiplos servidores.

## Dependências e premissas

- Constituição **2.0.0** (Princípio VII — segurança).
- Specs 005 e 006 implementadas.
- Spec 007 (dependências vulneráveis) concluída e mergeada antes da publicação.
- O responsável cria as contas nos provedores gratuitos (hospedagem e subdomínio); o
  cadastro do provedor de hospedagem pode pedir cartão apenas para validação.

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
| 2026-11-03 | Onde publicar? | Máquina virtual gratuita permanente (Oracle Cloud "Always Free") |
| 2026-11-03 | Quem pode se cadastrar? | Qualquer pessoa com o link |
| 2026-11-03 | Endereço? | Subdomínio gratuito fixo, com HTTPS |
| 2026-11-03 | Backup? | Sem backup nesta fase (risco aceito; spec futura) |
| 2026-11-03 | Como publicar versões novas? | Automático a cada merge na principal, se os testes passarem |
| 2026-11-03 | Dados podem ser zerados nos testes? | Não; preservar sempre |
