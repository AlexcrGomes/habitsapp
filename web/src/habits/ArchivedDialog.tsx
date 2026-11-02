import { useState } from "react";
import { ApiError } from "../api/client";
import type { Habit } from "../api/types";
import { Modal } from "../common/Modal";
import { MAX_ACTIVE, habitSymbol } from "./rules";

interface ArchivedDialogProps {
  open: boolean;
  habits: Habit[];
  limitReached: boolean;
  onClose: () => void;
  onRestore: (habit: Habit) => Promise<void>;
  onDelete: (habit: Habit) => Promise<void>;
}

export function ArchivedDialog(props: ArchivedDialogProps) {
  return (
    <Modal open={props.open} onClose={props.onClose} labelledBy="archived-dialog-title" fallbackFocus='[data-action="new"]'>
      <ArchivedList {...props} />
    </Modal>
  );
}

function ArchivedList({ habits, limitReached, onClose, onRestore, onDelete }: ArchivedDialogProps) {
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
    <>
      <h2 id="archived-dialog-title">Hábitos arquivados</h2>
      {limitReached && (
        <p id="archived-limit" className="dialog-hint">
          Limite de {MAX_ACTIVE} hábitos ativos atingido. Arquive um hábito para restaurar outro.
        </p>
      )}

      <ul className="archived-list">
        {habits.length === 0 && <li className="archived-empty">Nenhum hábito arquivado</li>}
        {habits.map((habit) => (
          <li key={habit.id} className="archived-item">
            <span className="habit-symbol" aria-hidden="true">{habitSymbol(habit)}</span>
            <span className="habit-name" title={habit.name}>{habit.name}</span>
            <button type="button" aria-label={`Restaurar ${habit.name}`}
              aria-describedby={limitReached ? "archived-limit" : undefined}
              disabled={busy || limitReached} onClick={() => run(() => onRestore(habit))}>
              Restaurar
            </button>
            <button type="button" className="danger" aria-label={`Excluir definitivamente ${habit.name}`}
              disabled={busy} onClick={() => remove(habit)}>
              Excluir definitivamente
            </button>
          </li>
        ))}
      </ul>

      <p className="dialog-error" role="alert">{error}</p>
      <div className="dialog-actions">
        <button type="button" onClick={onClose}>Fechar</button>
      </div>
    </>
  );
}
