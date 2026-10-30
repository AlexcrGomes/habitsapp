# CLAUDE.md — Habits

App estático de rastreamento de hábitos: HTML + CSS + JavaScript puro, sem build e sem
testes automatizados. A biblioteca `NLWSetup` (CDN) monta a grade de dias × hábitos; os
dados ficam no `localStorage`, chave `NLWSetup@habits`. Para rodar, abra `index.html` no
navegador.

## Metodologia: Spec Driven Development (GitHub Spec Kit)

Este repositório segue SDD. Guia completo: [`docs/sdd-guia.md`](docs/sdd-guia.md).

| O quê | Onde |
|-------|------|
| Constituição (princípios obrigatórios) | `.specify/memory/constitution.md` |
| Templates | `.specify/templates/{spec,plan,tasks}-template.md` |
| Specs de features | `specs/NNN-nome/{spec,plan,tasks}.md` |

### Regras

1. **Leia a constituição** antes de propor qualquer mudança. Ela prevalece sobre qualquer
   outro documento.
2. **Nenhuma implementação sem spec Aprovada.** Se o pedido não tiver spec, crie a spec
   primeiro (a partir do template) e pare para aprovação.
3. **Ordem obrigatória**: `spec.md` → clarificação → aprovação → `plan.md` → `tasks.md` →
   implementação → verificação. Não pule fases nem escreva plan/tasks de spec em Rascunho.
4. **Spec = o quê/por quê** (sem tecnologia). **Plan = como.**
5. **Não invente respostas**: dúvidas viram `[NEEDS CLARIFICATION: …]` e são perguntadas ao
   usuário; decisões vão para a tabela **Clarificações** da spec.
6. Todo `plan.md` tem **Constitution Check** preenchido; violações só com justificativa em
   **Complexity Tracking**.
7. Ao implementar, siga o `tasks.md` na ordem e marque `[x]` em cada tarefa concluída. Se
   algo não previsto surgir, pare e atualize spec/plan.
8. Antes de marcar a spec como **Implementada**, execute o checklist de verificação da
   feature **e** o de regressão de `specs/001-registro-de-habitos/tasks.md`.
9. Mantenha atualizada a tabela "Specs existentes" em `docs/sdd-guia.md`.
10. Nunca quebre os dados salvos em `NLWSetup@habits`; mudança de formato exige migração
    descrita no plan.

### Convenções

- Numeração `NNN` sequencial; pasta e branch `NNN-nome-em-kebab-case`.
- IDs: histórias `US1`, requisitos `RF-001`/`RC-001`, sucesso `CS-001`, tarefas `T001`,
  débitos `D-01`.
- Documentação, textos da interface e mensagens de commit em **pt-BR**.
- Débitos técnicos conhecidos estão em `specs/001-registro-de-habitos/spec.md`; não os
  corrija sem uma spec ou tarefa que os inclua.
