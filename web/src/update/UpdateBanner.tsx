import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdate } from "./UpdateProvider";
import { CURRENT } from "./version";

/**
 * Aviso de versão nova (spec 011, US3, plan P19): faixa no fluxo da página, acima do conteúdo,
 * sem cobrir as marcações nem a barra inferior.
 */
export function UpdateBanner() {
  const { available, pending, update } = useUpdate();
  if (!available) return null;
  // Resumo só quando as novidades mudaram em relação à versão em uso (plan P20)
  const notes = available.notes && available.notesId !== CURRENT.notesId ? available.notes : "";

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-10">
      <div role="status" aria-labelledby="update-title"
        className="flex flex-col gap-3 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900 shadow-xs sm:flex-row sm:items-center">
        <RefreshCw aria-hidden="true" className="hidden size-4 shrink-0 sm:block" />
        <div className="min-w-0 flex-1">
          <p id="update-title" className="font-semibold">Nova versão disponível</p>
          {notes && <p className="mt-1">{notes}</p>}
        </div>
        <Button variant="primary" size="sm" onClick={update} disabled={pending} className="self-start sm:self-auto">
          {pending ? "Atualizando ao fechar o formulário…" : "Atualizar"}
        </Button>
      </div>
    </div>
  );
}
