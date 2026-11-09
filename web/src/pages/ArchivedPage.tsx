import { ArchiveRestore, Archive, Trash2 } from "lucide-react";
import { useState } from "react";
import { ApiError } from "@/api/client";
import type { Habit } from "@/api/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { MAX_ACTIVE, habitSymbol } from "@/habits/rules";

interface ArchivedPageProps {
  habits: Habit[];
  loaded: boolean;
  limitReached: boolean;
  onRestore: (habit: Habit) => Promise<void>;
  onDelete: (habit: Habit) => Promise<void>;
}

/** Hábitos arquivados ("/arquivados"): tela própria desde a spec 009 (antes era um diálogo). */
export function ArchivedPage({ habits, loaded, limitReached, onRestore, onDelete }: ArchivedPageProps) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setError("");
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro inesperado. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  function remove(habit: Habit) {
    const message = `Excluir definitivamente "${habit.name}"? Todo o histórico dele será apagado. Esta ação não pode ser desfeita.`;
    if (confirm(message)) void run(() => onDelete(habit));
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-6">
        <h1 tabIndex={-1} className="text-2xl font-semibold tracking-tight text-ink">Hábitos arquivados</h1>
        <p className="mt-1 text-sm text-slate-500">Hábitos fora da semana, com o histórico guardado.</p>
      </div>

      {limitReached && (
        <Alert id="archived-limit" className="mb-4" variant="info">
          Limite de {MAX_ACTIVE} hábitos ativos atingido. Arquive um hábito para restaurar outro.
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="mb-4" role="alert">{error}</Alert>
      )}

      {!loaded ? (
        <Loading />
      ) : habits.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-brand-50 text-brand-700">
            <Archive aria-hidden="true" className="size-6" />
          </span>
          <p className="mt-4 font-semibold text-ink">Nenhum hábito arquivado</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Para arquivar, abra um hábito na Semana pelo lápis de edição e escolha "Arquivar". O histórico fica guardado aqui.
          </p>
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-slate-200">
            {habits.map((habit) => (
              <li key={habit.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-50 text-lg">
                  {habitSymbol(habit)}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-ink" title={habit.name}>{habit.name}</span>
                <div className="flex gap-2">
                  <Button size="sm" aria-label={`Restaurar ${habit.name}`}
                    aria-describedby={limitReached ? "archived-limit" : undefined}
                    disabled={busy || limitReached} onClick={() => run(() => onRestore(habit))}>
                    <ArchiveRestore aria-hidden="true" />
                    Restaurar
                  </Button>
                  <Button size="sm" variant="ghost" className="text-danger hover:bg-red-50 hover:text-red-700"
                    aria-label={`Excluir definitivamente ${habit.name}`} disabled={busy} onClick={() => remove(habit)}>
                    <Trash2 aria-hidden="true" />
                    Excluir definitivamente
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
