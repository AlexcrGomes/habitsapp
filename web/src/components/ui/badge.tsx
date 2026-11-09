import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset [&_svg]:size-3",
  {
    variants: {
      variant: {
        brand: "bg-brand-50 text-brand-700 ring-brand-200",
        success: "bg-emerald-50 text-success ring-emerald-200",
        warning: "bg-amber-50 text-warning ring-amber-200",
        neutral: "bg-slate-100 text-slate-700 ring-slate-200",
      },
    },
    defaultVariants: { variant: "brand" },
  },
);

export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
