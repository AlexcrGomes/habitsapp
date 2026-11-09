import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const alertVariants = cva("flex items-start gap-3 rounded-lg border p-4 text-sm shadow-xs", {
  variants: {
    variant: {
      info: "border-brand-200 bg-brand-50 text-brand-900",
      success: "border-emerald-200 bg-emerald-50 text-emerald-900",
      danger: "border-red-200 bg-red-50 text-red-900",
    },
  },
  defaultVariants: { variant: "info" },
});

const ICONS = { info: Info, success: CircleCheck, danger: CircleAlert };

export type AlertProps = ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    /** Com onClose, mostra o botão de fechar com este rótulo acessível. */
    closeLabel?: string;
    onClose?: () => void;
  };

/** O papel (role="status" ou "alert") vem de quem usa, conforme a urgência da mensagem. */
export function Alert({ className, variant, closeLabel, onClose, children, ...props }: AlertProps) {
  const Icon = ICONS[variant ?? "info"];
  return (
    <div className={cn(alertVariants({ variant }), className)} {...props}>
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1">{children}</div>
      {onClose && (
        <button data-slot="button" type="button" aria-label={closeLabel} onClick={onClose}
          className="-m-1 cursor-pointer rounded-sm p-1 opacity-70 hover:opacity-100">
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  );
}
