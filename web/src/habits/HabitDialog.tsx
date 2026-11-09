import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ApiError } from "../api/client";
import type { Habit } from "../api/types";
import { MAX_GOAL, MIN_GOAL } from "../goals/progress";
import { MAX_NAME, habitNameError } from "./rules";

const GOAL_OPTIONS = Array.from({ length: MAX_GOAL - MIN_GOAL + 1 }, (_, index) => MIN_GOAL + index);

interface HabitDialogProps {
  open: boolean;
  /** null = criar; hábito = editar */
  habit: Habit | null;
  onClose: () => void;
  /** goal null = sem meta */
  onSave: (name: string, emoji: string, goal: number | null) => Promise<void>;
  onRestore: (habitId: number) => Promise<void>;
  onArchive: (habit: Habit) => Promise<void>;
}

export function HabitDialog(props: HabitDialogProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose} labelledBy="habit-dialog-title" fallbackFocus='[data-action="new"]'>
      <HabitForm {...props} />
    </Dialog>
  );
}

function HabitForm({ habit, onClose, onSave, onRestore, onArchive }: HabitDialogProps) {
  const [name, setName] = useState(habit?.name ?? "");
  const [emoji, setEmoji] = useState(habit?.emoji ?? "");
  // "" = sem meta
  const [goal, setGoal] = useState(habit?.goal ? String(habit.goal) : "");
  const [error, setError] = useState("");
  const [conflictId, setConflictId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro inesperado. Tente novamente.");
      // Restaurar o arquivado só é oferecido ao criar (spec 002, cenário 1.6)
      if (e instanceof ApiError && e.code === "ARCHIVED_DUPLICATE" && !habit) setConflictId(e.habitId ?? null);
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const nameError = habitNameError(name);
    setConflictId(null);
    if (nameError) {
      setError(nameError);
      return;
    }
    void run(() => onSave(name, emoji, goal ? Number(goal) : null));
  }

  function archive() {
    if (!habit) return;
    if (!confirm(`Arquivar "${habit.name}"? O hábito sairá da tela, mas o histórico será guardado.`)) return;
    void run(() => onArchive(habit));
  }

  return (
    <form onSubmit={submit} noValidate>
      <DialogHeader>
        <DialogTitle id="habit-dialog-title">{habit ? "Editar hábito" : "Novo hábito"}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="habit-name">Nome</Label>
          <Input id="habit-name" maxLength={MAX_NAME} autoComplete="off" value={name}
            aria-describedby="habit-name-count" onChange={(e) => setName(e.target.value)} />
          <small id="habit-name-count" className="block text-right text-xs tabular-nums text-slate-500">{name.length}/{MAX_NAME}</small>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="habit-emoji">Emoji (opcional)</Label>
          <Input id="habit-emoji" autoComplete="off" placeholder="Ex.: 🧘" value={emoji}
            onChange={(e) => setEmoji(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="habit-goal">Meta semanal</Label>
          <Select id="habit-goal" value={goal} aria-describedby="habit-goal-hint" onChange={(e) => setGoal(e.target.value)}>
            <option value="">Sem meta</option>
            {GOAL_OPTIONS.map((days) => (
              <option key={days} value={days}>{days} {days === 1 ? "dia" : "dias"} por semana</option>
            ))}
          </Select>
          <small id="habit-goal-hint" className="block text-xs text-slate-500">Uma meta nova vale a partir de hoje.</small>
        </div>
      </div>

      <p className="mt-3 min-h-5 text-sm text-danger" role="alert">{error}</p>
      {conflictId !== null && (
        <Button className="mt-2" disabled={busy} onClick={() => run(() => onRestore(conflictId))}>
          Restaurar o arquivado
        </Button>
      )}

      <DialogFooter>
        {habit && <Button variant="danger" className="sm:mr-auto" disabled={busy} onClick={archive}>Arquivar</Button>}
        <Button onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary" disabled={busy}>Salvar</Button>
      </DialogFooter>
    </form>
  );
}
