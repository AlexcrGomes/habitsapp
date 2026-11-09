import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Aparência comum a campos de texto e seletores. Borda `control` tem 3,6:1 sobre branco. */
export const fieldClasses = [
  "w-full rounded-md border border-control bg-white text-sm text-ink shadow-xs",
  "placeholder:text-slate-500 focus-visible:border-brand-600",
  "aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60",
];

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return <input data-slot="input" type={type} className={cn(fieldClasses, "h-10 px-3", className)} {...props} />;
}
