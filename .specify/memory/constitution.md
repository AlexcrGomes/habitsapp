# Constituição do Projeto Habits

**Versão**: 1.0.0 | **Ratificada em**: 2026-10-30 | **Última emenda**: 2026-10-30

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

### II. Simplicidade — sem build

O app é HTML, CSS e JavaScript puro, aberto diretamente no navegador.

- Não introduzir bundler, transpilador, framework ou gerenciador de pacotes sem
  justificativa registrada na seção **Complexity Tracking** do `plan.md`.
- Toda nova dependência externa (CDN) deve ser justificada e ter versão fixa.
- Preferir código direto e legível a abstrações antecipadas.

**Por quê**: o valor do projeto está em ser pequeno, rápido de entender e de rodar.

### III. Dados locais e compatíveis

Os dados do usuário ficam no `localStorage`, na chave `NLWSetup@habits`.

- Nenhuma mudança pode fazer o usuário perder dados já gravados.
- Qualquer alteração de chave ou formato exige uma **migração** descrita no `plan.md`
  (leitura do formato antigo → conversão → gravação no novo) e um cenário de verificação
  com dados pré-existentes.
- Nenhum dado é enviado para servidores externos.

**Por quê**: o histórico de hábitos é o único ativo do usuário; não existe backup em
servidor.

### IV. Interface em pt-BR e acessível

- Todos os textos visíveis em português do Brasil, revisados ortograficamente.
- Imagens com `alt` descritivo; elementos interativos acessíveis por teclado e com foco
  visível.
- Manter contraste adequado no tema escuro (fundo `#09090A`).

**Por quê**: o público é brasileiro e o app deve ser utilizável por qualquer pessoa.

### V. Responsivo

- A interface deve funcionar em telas de celular e desktop.
- O breakpoint existente de 570px (`style.css`) deve ser preservado ou evoluído de forma
  documentada no plan.

**Por quê**: o registro de hábitos acontece principalmente no celular.

### VI. Verificação explícita

Como o projeto não possui framework de testes automatizados:

- Todo `tasks.md` termina com um **checklist de verificação manual** derivado dos
  cenários *Dado/Quando/Então* da spec.
- O checklist da spec `001-registro-de-habitos` é a suíte de **regressão** e deve ser
  executado a cada nova feature.
- Uma feature só passa para **Implementada** quando todos os itens do checklist forem
  verificados no navegador.
- Se testes automatizados forem introduzidos no futuro, isso exige emenda desta
  constituição.

**Por quê**: sem testes, a verificação precisa ser deliberada e rastreável.

---

## Restrições técnicas

| Item | Valor atual |
|------|-------------|
| Linguagens | HTML5, CSS3, JavaScript (ES6+, sem módulos) |
| Biblioteca | `NLWSetup` via CDN jsDelivr (`index.html`) |
| Persistência | `localStorage` — chave `NLWSetup@habits` |
| Fontes | Google Fonts: Inter 600, Roboto Mono 700 |
| Execução | Abrir `index.html` no navegador (ou servidor estático) |
| Hospedagem | Estática (GitHub Pages) |

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
