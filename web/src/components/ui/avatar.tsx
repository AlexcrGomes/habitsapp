import { cva, type VariantProps } from "class-variance-authority";
import { User } from "lucide-react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/initials";

const avatarVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800 ring-1 ring-inset ring-brand-900/10",
  {
    variants: {
      size: {
        sm: "size-8 text-xs [&_svg]:size-4",
        md: "size-10 text-sm [&_svg]:size-5",
        lg: "size-16 text-xl [&_svg]:size-7",
      },
    },
    defaultVariants: { size: "md" },
  },
);

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name: string;
  className?: string;
}

/** Avatar com iniciais (padrão Untitled UI). Decorativo: o nome sempre aparece em texto ao lado. */
export function Avatar({ name, size, className }: AvatarProps) {
  const letters = initials(name);
  return (
    <span aria-hidden="true" className={cn(avatarVariants({ size }), className)}>
      {letters || <User />}
    </span>
  );
}
