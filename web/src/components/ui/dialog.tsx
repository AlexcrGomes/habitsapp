import type { ComponentProps, ReactNode } from "react";
import { Modal } from "@/common/Modal";
import { cn } from "@/lib/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** id do <DialogTitle>, que dá o nome acessível ao diálogo. */
  labelledBy: string;
  fallbackFocus?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Diálogo no visual shadcn sobre o <dialog> nativo do Modal (plan P6): foco preso e Esc
 * continuam do navegador; aqui só entram aparência e a animação de abertura.
 */
export function Dialog({ className, ...props }: DialogProps) {
  return (
    <Modal
      slot="dialog"
      className={cn(
        "m-auto w-[min(calc(100%-2rem),28rem)] rounded-xl border border-slate-200 bg-white p-6 text-slate-700 shadow-lg",
        "backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm open:motion-safe:animate-dialog-in",
        className,
      )}
      {...props}
    />
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mb-5 flex flex-col gap-1", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("text-lg font-semibold text-ink", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-sm text-slate-500", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}
