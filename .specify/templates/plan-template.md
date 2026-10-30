# Plano de Implementação: [NOME DA FEATURE]

**Branch**: `[NNN-nome-da-feature]` | **Data**: [AAAA-MM-DD] | **Spec**: [spec.md](./spec.md)
**Status**: Rascunho <!-- Rascunho | Aprovado -->

> Pré-requisito: a `spec.md` deve estar com status **Aprovada**.
> Este documento descreve **como** a spec será atendida.

---

## Resumo

[Requisito principal da spec + abordagem técnica escolhida, em 2–4 frases.]

## Contexto técnico

| Item | Valor |
|------|-------|
| Linguagens | HTML, CSS, JavaScript |
| Dependências | [ex.: NLWSetup via CDN; nenhuma nova] |
| Persistência | [ex.: localStorage `NLWSetup@habits`; nova chave?] |
| Restrições | [ex.: funcionar offline, sem build] |
| Riscos | [pontos técnicos incertos] |

---

## Constitution Check

*Obrigatório. Reavaliar ao final do plano.*

| Princípio | Conforme? | Observação |
|-----------|-----------|------------|
| I. Spec antes do código | ☐ | Spec aprovada em [data] |
| II. Simplicidade — sem build | ☐ | |
| III. Dados locais e compatíveis | ☐ | Há migração? |
| IV. Interface pt-BR e acessível | ☐ | |
| V. Responsivo | ☐ | |
| VI. Verificação explícita | ☐ | Checklist no tasks.md |

Qualquer "não" deve ser justificado em **Complexity Tracking**.

---

## Pesquisa e decisões

| Decisão | Alternativas consideradas | Motivo da escolha |
|---------|---------------------------|-------------------|
| [ex.: gerar hábitos via DOM] | [ex.: trocar a NLWSetup] | [motivo] |

## Arquivos afetados

```
index.html      # [o que muda]
script.js       # [o que muda]
style.css       # [o que muda]
assests/        # [novos ícones?]
```

## Modelo de dados

[Formato dos dados gravados. Se mudar, descreva antes/depois.]

```json
{
  "exemplo": ["01-01", "01-02"]
}
```

### Migração *(se o formato mudar)*

1. Ler o formato antigo
2. Converter para o novo
3. Gravar e manter compatibilidade de leitura

## Fluxo / comportamento

[Sequência de eventos: ação do usuário → função → efeito na tela → persistência.]

---

## Complexity Tracking

*Preencha somente se algum princípio da constituição for violado.*

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|----------|----------------------|-------------------------------------------|
| | | |
