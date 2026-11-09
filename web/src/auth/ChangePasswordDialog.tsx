import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "../api/client";
import { MIN_PASSWORD } from "../habits/rules";

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export function ChangePasswordDialog(props: ChangePasswordDialogProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose} labelledBy="password-dialog-title">
      <ChangePasswordForm {...props} />
    </Dialog>
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
      <DialogHeader>
        <DialogTitle id="password-dialog-title">Trocar senha</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="current-password">Senha atual</Label>
          <Input type="password" id="current-password" autoComplete="current-password" value={current}
            onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">Nova senha (mínimo {MIN_PASSWORD} caracteres)</Label>
          <Input type="password" id="new-password" autoComplete="new-password" value={next}
            onChange={(e) => setNext(e.target.value)} />
        </div>
      </div>

      <p className="mt-3 min-h-5 text-sm text-danger" role="alert">{error}</p>
      <DialogFooter>
        <Button onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary" disabled={busy}>Salvar</Button>
      </DialogFooter>
    </form>
  );
}
