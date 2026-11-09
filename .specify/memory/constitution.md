# Constituição do Projeto Habits

**Versão**: 2.1.1 | **Ratificada em**: 2026-10-30 | **Última emenda**: 2026-11-09

Esta constituição define os princípios não negociáveis do projeto. Toda spec, plano e
implementação deve estar em conformidade com ela. Em caso de conflito entre um documento
de feature e esta constituição, a constituição prevalece.

---

## Princípios

### I. Spec antes do código

Nenhuma mudança funcional é implementada sem uma `spec.md` com status **Aprovada** em
`specs/NNN-nome/`.

- A **spec** descreve *o quê* e *por quê*, do ponto de vista do usuário — sem detalhes de
  implementação.
- O **plan** descreve *como*, e só é escrito depois que a spec está aprovada.
- As **tasks** derivam do plan e são a única fonte do que será implementado.
- Correções triviais (erro de digitação, ajuste visual sem mudança de comportamento) podem
  dispensar a spec, mas devem ser registradas no `tasks.md` da feature relacionada ou em
  "Débitos conhecidos".

**Por quê**: garante que o comportamento esperado esteja combinado e verificável antes de
qualquer código ser escrito, e que o histórico de decisões fique no repositório.

### II. Simplicidade dentro da stack oficial

A aplicação usa a stack definida em **Restrições técnicas**: frontend React + TypeScript,
API Spring Boot, banco PostgreSQL, tudo orquestrado com Docker Compose.

- Não introduzir outra linguagem, framework, banco ou serviço sem justificativa registrada
  na seção **Complexity Tracking** do `plan.md`.
- Toda nova dependência (Maven, npm, imagem Docker) deve ser justificada e ter versão fixa.
- Preferir código direto e legível a abstrações antecipadas.

**Por quê**: a arquitetura cresceu; limitar a stack mantém o projeto fácil de entender, rodar
e manter.

### III. Dados no servidor, isolados por usuário

Os dados ficam no PostgreSQL e pertencem a um usuário.

- Todo acesso a dados é filtrado pelo usuário autenticado na sessão. Recurso de outro
  usuário é tratado como inexistente (**404**), nunca como proibido.
- Nenhuma mudança pode fazer o usuário perder dados já gravados.
- Mudanças de esquema só por **migração versionada** (Flyway). Uma migração já aplicada
  nunca é editada; corrige-se com uma nova.
- Migração destrutiva (apagar coluna/tabela com dados) exige plano de conversão descrito no
  `plan.md` e cenário de verificação com dados pré-existentes.

**Por quê**: o histórico de hábitos é o único ativo do usuário, e cada um deve ver só o seu.

### IV. Interface em pt-BR e acessível

- Todos os textos visíveis em português do Brasil, revisados ortograficamente — inclusive
  mensagens de erro vindas da API.
- Imagens com `alt` descritivo; elementos interativos acessíveis por teclado e com foco
  visível.
- Contraste mínimo nível AA no tema vigente (ver **Restrições técnicas**): 4,5:1 em texto
  normal; 3:1 em texto grande, ícones e bordas de controles.
- Animações curtas e desativadas quando o sistema pede "reduzir movimento".

**Por quê**: o público é brasileiro e o app deve ser utilizável por qualquer pessoa.

### V. Responsivo

- A interface deve funcionar em telas de celular e desktop.
- O breakpoint de 570px deve ser preservado ou evoluído de forma documentada no plan.

**Por quê**: o registro de hábitos acontece principalmente no celular.

### VI. Verificação explícita

- **Testes automatizados são obrigatórios**:
  - API: testes de unidade das regras e de integração com PostgreSQL real, incluindo
    **isolamento entre usuários** em todas as rotas que acessam dados;
  - frontend: testes da lógica (datas, validações) e dos componentes principais.
- Todo `tasks.md` termina com um **checklist de verificação manual** da interface,
  derivado dos cenários *Dado/Quando/Então* da spec.
- Uma feature só passa para **Implementada** com os testes verdes e o checklist verificado
  no navegador.

**Por quê**: com servidor e vários usuários, um erro pode expor ou corromper dados de outros.

### VII. Segurança

- Senhas só armazenadas com hash forte (BCrypt); nunca em texto, log ou resposta da API.
- Sessão em cookie `HttpOnly` e `SameSite`; proteção contra CSRF nas requisições que
  alteram dados.
- Segredos (senhas de banco, chaves) fora do git: `.env` ignorado, `.env.example` versionado
  sem valores reais.
- O servidor valida todas as regras; o cliente nunca é a fonte de verdade.
- Mensagens de login não revelam se um e-mail está cadastrado.

**Por quê**: o app agora guarda credenciais e dados de várias pessoas.

---

## Restrições técnicas

| Item | Valor atual |
|------|-------------|
| Frontend | React + TypeScript (Vite), servido por Nginx |
| API | Java 21 + Spring Boot 3 (Maven) |
| Banco | PostgreSQL, migrações com Flyway |
| Autenticação | E-mail e senha; sessão Spring Session JDBC |
| Orquestração | Docker Compose: `db`, `api`, `web` |
| Fuso de referência | `America/Sao_Paulo` |
| Testes | JUnit + Testcontainers (API); Vitest + Testing Library (frontend) |
| Tema | Claro, paleta de azuis (spec 009); tema escuro previsto em spec futura |
| Fontes | Google Fonts: Inter 400–700 (números com `tabular-nums`) |

---

## Governança

- Esta constituição só pode ser alterada por uma emenda registrada neste arquivo, com
  atualização da versão e da data de **Última emenda**.
- Versionamento semântico:
  - **MAJOR** — remoção ou redefinição incompatível de um princípio;
  - **MINOR** — novo princípio ou expansão relevante de um existente;
  - **PATCH** — esclarecimentos de texto, sem mudança de regra.
- Todo `plan.md` deve conter a seção **Constitution Check**. Violações só são aceitas se
  justificadas em **Complexity Tracking** e aprovadas pelo responsável do projeto.

### Histórico de emendas

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0.0 | 2026-10-30 | Versão inicial |
| 1.1.0 | 2026-10-31 | Princípio III: chave vigente movida para Restrições técnicas e regra de nunca apagar/sobrescrever chaves antigas; restrições técnicas atualizadas (sem NLWSetup, chave `habits@v3`) |
| 2.0.0 | 2026-11-01 | Nova arquitetura (spec 005): II redefinido para a stack React + Spring Boot + PostgreSQL + Docker; III redefinido para dados no servidor isolados por usuário e migrações Flyway; VI passa a exigir testes automatizados; novo VII (Segurança); restrições técnicas reescritas |
| 2.1.0 | 2026-11-09 | Novo design system (spec 009): IV troca "contraste no tema escuro (fundo `#09090A`)" por contraste AA no tema vigente e passa a exigir respeito a "reduzir movimento"; restrições técnicas ganham a linha Tema (claro, azuis) e as fontes passam a ser definidas no plan da 009 |
| 2.1.1 | 2026-11-09 | Restrições técnicas: fontes passam a ser Inter 400–700 (sai a Roboto Mono), conforme o plan da spec 009 |
