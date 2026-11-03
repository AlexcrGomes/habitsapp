# Plano de Implementação: Metas semanais por hábito

**Branch**: `006-metas-semanais` | **Data**: 2026-11-02 | **Spec**: [spec.md](./spec.md)
**Status**: Aprovado em 2026-11-02 | **Tarefas**: [tasks.md](./tasks.md)

---

## Resumo

Nova tabela `habit_goals` guarda o **histórico** de metas de cada hábito (meta + data a partir
da qual vale). A API grava a meta junto com criar/editar hábito e expõe as metas vigentes numa
data. O frontend já carrega as marcações da semana exibida; com as metas vigentes no último
dia dessa semana, calcula no navegador a barra de cada hábito e o resumo geral, que por isso
se atualizam na hora ao marcar ou desmarcar.

## Contexto técnico

| Item | Valor |
|------|-------|
| Stack | A mesma da spec 005 (Spring Boot 3.5.16, PostgreSQL 17, React 19 + TS, Vite 7, Vitest 3) |
| Dependências novas | Nenhuma |
| Persistência | Migração nova `V3__habit_goals.sql` |
| Fuso | "Hoje" de Brasília: `Clock` de `ClockConfig` na API; `todayKey()` no frontend |
| Riscos | Alinhamento das linhas da lista com as linhas da grade ao incluir a barra (lição da spec 004) |

---

## Constitution Check (2.0.0)

| Princípio | Conforme? | Observação |
|-----------|-----------|------------|
| I. Spec antes do código | ✅ | Spec aprovada em 2026-11-02 |
| II. Stack oficial | ✅ | Nenhuma dependência nova; barra com elementos nativos e CSS |
| III. Dados isolados por usuário | ✅ | Metas sempre consultadas com join em `habits.user_id`; hábito alheio → 404; esquema por migração Flyway nova (V1/V2 intactas) |
| IV. pt-BR e acessível | ✅ | Campo com rótulo no diálogo; barra com `role="progressbar"` e `aria-valuetext`; resumo em região `role="status"` |
| V. Responsivo | ✅ | Card e barra sem largura fixa; ajuste ≤570px |
| VI. Verificação | ✅ | `GoalIT`, caso novo em `IsolationIT`, testes Vitest e checklist manual |
| VII. Segurança | ✅ | Servidor valida a meta (1–7 ou nula); nada de segredo novo |

---

## Pesquisa e decisões

| # | Decisão | Alternativas | Motivo |
|---|---------|--------------|--------|
| P1 | Histórico em tabela própria `habit_goals(habit_id, valid_from, days_per_week)` | Coluna `goal` em `habits` | A spec exige guardar a meta da época (US4); a coluna perderia o passado |
| P2 | Mudança no mesmo dia sobrescreve a linha de hoje | Uma linha por alteração | Só a última escolha do dia vale (US4.2); evita lixo |
| P3 | `days_per_week` nulo = "meta removida a partir desta data" | Apagar linhas | Remover a meta hoje não pode apagar a meta das semanas passadas |
| P4 | Meta vigente da janela = a do **último dia exibido** | Meta por dia da janela | Uma meta só por semana exibida, inclusive em "Últimos 7 dias" |
| P5 | Progresso e resumo calculados no **frontend**, a partir das marcações já carregadas | Endpoint de resumo na API | Atualização imediata (RF-004) sem nova requisição; o cálculo é simples e não decide permissão |
| P6 | Meta enviada no mesmo `POST`/`PATCH` do hábito (`goal`) | Rota separada `PUT /habits/{id}/goal` | Um único "Salvar" no diálogo (CS-001); a API só grava histórico quando o valor muda |
| P7 | `GET /api/goals?at=YYYY-MM-DD` | Metas embutidas em `GET /api/habits` | A lista de hábitos não depende da semana exibida; metas sim |

---

## Arquivos afetados

```
api/src/main/resources/db/migration/V3__habit_goals.sql   # nova tabela
api/src/main/java/br/com/habits/goal/
  HabitGoal.java          # entidade com @IdClass (mesmo padrão de check/HabitCheck)
  GoalRepository.java     # metas vigentes numa data, por usuário
  GoalService.java        # validar, gravar (usa Clock), consultar
  GoalController.java     # GET /api/goals?at=
api/src/main/java/br/com/habits/habit/
  HabitController.java    # HabitRequest.goal; HabitResponse.goal (vigente hoje)
  HabitService.java       # create/update delegam a meta ao GoalService
api/src/test/java/br/com/habits/
  goal/GoalIT.java        # novo
  IsolationIT.java        # GET /api/goals e PATCH de meta em hábito alheio

web/src/api/types.ts      # Habit.goal; Goal
web/src/api/client.ts     # api.goals.list(at); goal em create/update
web/src/habits/useHabits.ts     # carrega metas da janela; recarrega após mutate
web/src/habits/HabitDialog.tsx  # campo "Meta semanal"
web/src/habits/HabitList.tsx    # barra na linha do hábito
web/src/goals/progress.ts       # funções puras (novo) + progress.test.ts
web/src/goals/GoalBar.tsx       # barra acessível (novo)
web/src/goals/WeekSummary.tsx   # card do resumo (novo) + WeekSummary.test.tsx
web/src/home/HomePage.tsx       # card acima da grade; onSave com meta
web/src/styles.css              # barra, card, ≤570px
```

## Modelo de dados

```sql
-- V3__habit_goals.sql
create table habit_goals (
  habit_id      bigint   not null references habits(id) on delete cascade,
  valid_from    date     not null,
  days_per_week int check (days_per_week between 1 and 7), -- null = sem meta a partir daqui
  primary key (habit_id, valid_from)
);
```

### Migração

Só cria a tabela. Hábitos existentes ficam sem linhas = sem meta (RC-001). Nenhum dado
existente é alterado; `NLWSetup@habits` não é mais usado desde a 005.

### Meta vigente numa data D (por usuário)

```sql
select distinct on (g.habit_id) g.habit_id, g.days_per_week
from habit_goals g join habits h on h.id = g.habit_id
where h.user_id = :userId and g.valid_from <= :at
order by g.habit_id, g.valid_from desc
```

Linhas com `days_per_week` nulo são descartadas na resposta (hábito sem meta naquela data).

## Contrato da API

| Rota | Mudança |
|------|---------|
| `POST /api/habits` | Corpo aceita `goal` (`1..7` ou `null`/ausente = sem meta) |
| `PATCH /api/habits/{id}` | Corpo passa a substituir `name`, `emoji` **e** `goal` |
| `GET /api/habits` e respostas de hábito | Ganham `goal`: meta vigente hoje ou `null` |
| `GET /api/goals?at=YYYY-MM-DD` | **Nova**: `[{ habitId, daysPerWeek }]` vigentes em `at`, só do usuário da sessão |

- Meta inválida → 400 `VALIDATION`, `fields.goal` = "A meta deve ser de 1 a 7 dias por semana."
- `at` ausente ou inválido → 400 `BAD_REQUEST` (tratamento atual do `ApiExceptionHandler`).
- `GoalService.set` compara com a meta vigente hoje; se igual, não grava nada; senão faz
  upsert da linha `(habitId, hoje)`.

## Frontend

- **`progress.ts`**:
  - `habitProgress(done, goal)` → `min(done, goal) / goal`;
  - `weekSummary(habits, checks, goals, days)` → `{ percent, label } | null` (null quando
    nenhum hábito ativo tem meta), percent = Σ min(feitos, meta) ÷ Σ metas, arredondado;
  - `summaryLabel(percent)` → "Semana perfeita" (100) / "Boa semana" (≥70) /
    "Dá para melhorar" (≥40) / "Semana fraca".
  - "feitos" usa `checkKey` de `habits/rules.ts` sobre os 7 dias de `visibleDays`.
- **`useHabits(from, to)`**: novo estado `goals: Map<number, number>` carregado com
  `api.goals.list(to)` no mesmo efeito das marcações; `mutate` recarrega hábitos e metas.
- **`GoalBar`**: na linha do hábito, sob o nome, sem aumentar a altura da linha (alinhada às
  linhas da grade). `role="progressbar"`, `aria-valuemin=0`, `aria-valuemax=goal`,
  `aria-valuenow=min(done, goal)`, `aria-valuetext="Correr: 2 de 4 dias"`.
- **`WeekSummary`**: card entre o aviso e a `board` em `HomePage`; "Até agora" quando
  `days` inclui `today`; sem metas → "Defina metas nos hábitos para ver o resumo da semana."
- **`HabitDialog`**: `<select id="habit-goal">` "Meta semanal" com "Sem meta" e "1 dia por
  semana"…"7 dias por semana"; `onSave(name, emoji, goal)`.

## Fluxo

Marcar um dia → `toggle` otimista muda `checks` → `GoalBar` e `WeekSummary` recalculam na
renderização → a API grava a marcação (rollback se recusar, como hoje).
Salvar o diálogo com outra meta → `PATCH` → `GoalService.set` grava a linha de hoje →
`mutate` recarrega hábitos e metas da janela.

---

## Ajustes durante a implementação

| Ajuste | Motivo |
|--------|--------|
| `days_per_week` como `int` (não `smallint`) | `ddl-auto: validate` recusaria `smallint` mapeado em `Integer` |
| `.gitattributes` com `*.sh text eol=lf` | Com `core.autocrlf=true`, o checkout da `main` trouxe `scripts/api-mvn.sh` com CRLF e o bash do WSL falhou (`set: pipefail`) |
| Percentual geral só mostra 100% quando todas as metas foram cumpridas (senão no máximo 99%) | Evita "Semana perfeita" por arredondamento (ex.: 199 de 200) |
| Texto acessível da barra acrescenta ", meta atingida" ao completar | Equivalente ao destaque visual (barra verde) para leitor de tela |

---

## Complexity Tracking

Nenhuma violação.
