import { useState, type FormEvent } from "react";
import { ApiError } from "../api/client";
import type { Habit } from "../api/types";
import { Modal } from "../common/Modal";
import { MAX_NAME, habitNameError } from "./rules";

interface HabitDialogProps {
  open: boolean;
  /** null = criar; hábito = editar */
  habit: Habit | null;
  onClose: () => void;
  onSave: (name: string, emoji: string) => Promise<void>;
  onRestore: (habitId: number) => Promise<void>;
  onArchive: (habit: Habit) => Promise<void>;
}

export function HabitDialog(props: HabitDialogProps) {
  return (
    <Modal open={props.open} onClose={props.onClose} labelledBy="habit-dialog-title" fallbackFocus='[data-action="new"]'>
      <HabitForm {...props} />
    </Modal>
  );
}

function HabitForm({ habit, onClose, onSave, onRestore, onArchive }: HabitDialogProps) {
  const [name, setName] = useState(habit?.name ?? "");
  const [emoji, setEmoji] = useState(habit?.emoji ?? "");
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
    void run(() => onSave(name, emoji));
  }

  function archive() {
    if (!habit) return;
    if (!confirm(`Arquivar "${habit.name}"? O hábito sairá da tela, mas o histórico será guardado.`)) return;
    void run(() => onArchive(habit));
  }

  return (
    <form onSubmit={submit} noValidate>
      <h2 id="habit-dialog-title">{habit ? "Editar hábito" : "Novo hábito"}</h2>

      <label htmlFor="habit-name">Nome</label>
      <input type="text" id="habit-name" maxLength={MAX_NAME} autoComplete="off" value={name}
        aria-describedby="habit-name-count" onChange={(e) => setName(e.target.value)} />
      <small id="habit-name-count" className="dialog-hint">{name.length}/{MAX_NAME}</small>

      <label htmlFor="habit-emoji">Emoji (opcional)</label>
      <input type="text" id="habit-emoji" autoComplete="off" placeholder="Ex.: 🧘" value={emoji}
        onChange={(e) => setEmoji(e.target.value)} />

      <p className="dialog-error" role="alert">{error}</p>
      {conflictId !== null && (
        <button type="button" disabled={busy} onClick={() => run(() => onRestore(conflictId))}>
          Restaurar o arquivado
        </button>
      )}

      <div className="dialog-actions">
        {habit && <button type="button" className="dialog-start" disabled={busy} onClick={archive}>Arquivar</button>}
        <button type="button" onClick={onClose}>Cancelar</button>
        <button type="submit" className="primary" disabled={busy}>Salvar</button>
      </div>
    </form>
  );
}
