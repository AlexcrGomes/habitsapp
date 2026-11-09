import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { fieldClasses } from "./input";

/** <select> nativo estilizado: acessível, funciona no teclado e com userEvent.selectOptions (plan P6). */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select data-slot="select" className={cn(fieldClasses, "h-10 cursor-pointer appearance-none pl-3 pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
}
