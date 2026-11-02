import { useState, type FormEvent } from "react";
import { ApiError, api } from "../api/client";
import { Modal } from "../common/Modal";
import { MIN_PASSWORD } from "../habits/rules";

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export function ChangePasswordDialog(props: ChangePasswordDialogProps) {
  return (
    <Modal open={props.open} onClose={props.onClose} labelledBy="password-dialog-title">
      <ChangePasswordForm {...props} />
    </Modal>
  );
}

function ChangePasswordForm({ onClose, onChanged }: ChangePasswordDialogProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (next.length < MIN_PASSWORD) {
      setError(`A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    setBusy(true);
    try {
      await api.changePassword(current, next);
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro inesperado. Tente novamente.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <h2 id="password-dialog-title">Trocar senha</h2>

      <label htmlFor="current-password">Senha atual</label>
      <input type="password" id="current-password" autoComplete="current-password" value={current}
        onChange={(e) => setCurrent(e.target.value)} />

      <label htmlFor="new-password">Nova senha (mínimo {MIN_PASSWORD} caracteres)</label>
      <input type="password" id="new-password" autoComplete="new-password" value={next}
        onChange={(e) => setNext(e.target.value)} />

      <p className="dialog-error" role="alert">{error}</p>
      <div className="dialog-actions">
        <button type="button" onClick={onClose}>Cancelar</button>
        <button type="submit" className="primary" disabled={busy}>Salvar</button>
      </div>
    </form>
  );
}
