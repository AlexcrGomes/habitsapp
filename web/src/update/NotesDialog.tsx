import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CURRENT, type AppVersion } from "./version";

export const NOTES_SEEN_KEY = "habits:notes-seen";

/**
 * Mostrar as novidades desta versão? Só depois de uma atualização (plan P20): no primeiro uso,
 * ou na primeira versão com esta função, só guarda o que foi visto.
 */
export function shouldShowNotes(version: AppVersion = CURRENT): boolean {
  if (!version.notes || !version.notesId) return false;
  try {
    const seen = localStorage.getItem(NOTES_SEEN_KEY);
    if (seen === null) {
      localStorage.setItem(NOTES_SEEN_KEY, version.notesId);
      return false;
    }
    return seen !== version.notesId;
  } catch {
    return false;
  }
}

function markSeen(version: AppVersion) {
  try {
    localStorage.setItem(NOTES_SEEN_KEY, version.notesId);
  } catch {
    // sem localStorage: as novidades não voltam nesta sessão, porque o diálogo já fechou
  }
}

/** "Novidades da versão", uma única vez depois de carregar a versão nova (spec 011, US7). */
export function NotesDialog({ version = CURRENT }: { version?: AppVersion }) {
  const [open, setOpen] = useState(() => shouldShowNotes(version));

  function close() {
    markSeen(version);
    setOpen(false);
  }

  return (
    <Dialog open={open} onClose={close} labelledBy="notes-title">
      <DialogHeader>
        <DialogTitle id="notes-title">Novidades da versão</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-slate-700">{version.notes}</p>
      <DialogFooter>
        <Button variant="primary" onClick={close}>Fechar</Button>
      </DialogFooter>
    </Dialog>
  );
}
