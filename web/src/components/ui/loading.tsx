import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

/** "Carregando…" anunciado ao leitor de tela; o ícone só gira se o sistema não pedir menos movimento. */
export function Loading({ className }: { className?: string }) {
  return (
    <p role="status" className={cn("flex items-center gap-2 py-6 text-sm text-slate-500", className)}>
      <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
      Carregando…
    </p>
  );
}
