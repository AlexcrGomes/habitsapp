import { Archive, CalendarDays, KeyRound, LogOut, Plus, UserRound } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Link } from "@/router";

interface AppNavProps {
  name: string;
  email: string;
  archivedCount: number;
  /** Limite de hábitos ativos atingido: "Novo hábito" fica desabilitado. */
  limitReached: boolean;
  limit: number;
  onNew: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
}

// Item: ícone sobre o rótulo na barra inferior; ícone ao lado do rótulo no menu lateral
const item = cn(
  // h-full + justify-end alinha os rótulos pela base, mesmo com o círculo maior do "Novo hábito"
  "flex h-full flex-col items-center justify-end gap-0.5 rounded-md px-1 py-2 text-xs font-medium text-slate-500 transition-colors",
  "lg:h-auto lg:justify-start",
  "hover:text-ink aria-[current=page]:text-brand-700 motion-reduce:transition-none [&_svg]:size-5",
  "lg:flex-row lg:gap-3 lg:px-3 lg:text-sm lg:text-slate-600 lg:hover:bg-slate-100",
  "lg:aria-[current=page]:bg-brand-50 lg:aria-[current=page]:text-brand-700",
);

/**
 * Navegação principal (spec 009, plan P7): um único <nav> que é barra inferior de vidro
 * abaixo de 1024 px e menu lateral fixo a partir daí — nada aparece duplicado no DOM.
 */
export function AppNav({ name, email, archivedCount, limitReached, limit, onNew, onChangePassword, onLogout }: AppNavProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        // Celular: barra inferior de vidro
        "fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-white/75 pb-[env(safe-area-inset-bottom)]",
        "shadow-[0_-4px_16px_rgb(16_24_40/0.06)] backdrop-blur-xl",
        // Desktop: menu lateral
        "lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-t-0",
        "lg:border-slate-200 lg:bg-white lg:pb-0 lg:shadow-none lg:backdrop-blur-none",
      )}
    >
      <div className="hidden h-20 items-center px-6 lg:flex">
        <Logo />
      </div>

      <ul className="mx-auto grid max-w-md grid-cols-4 gap-1 px-2 pt-1 lg:mx-0 lg:flex lg:max-w-none lg:flex-col lg:px-4 lg:pt-2">
        <li>
          <Link to="/" className={item}>
            <CalendarDays aria-hidden="true" />
            Semana
          </Link>
        </li>
        <li>
          <Link to="/arquivados" className={item}>
            <span className="relative">
              <Archive aria-hidden="true" />
              {archivedCount > 0 && (
                <Badge variant="neutral" aria-hidden="true" className="absolute -right-3 -top-2 px-1.5 lg:hidden">
                  {archivedCount}
                </Badge>
              )}
            </span>
            Arquivados
            {archivedCount > 0 && (
              <>
                <Badge variant="neutral" aria-hidden="true" className="ml-auto hidden lg:inline-flex">{archivedCount}</Badge>
                <span className="sr-only"> ({archivedCount})</span>
              </>
            )}
          </Link>
        </li>
        <li className="lg:mt-4">
          <button
            type="button"
            data-slot="button"
            data-action="new"
            disabled={limitReached}
            title={limitReached ? `Limite de ${limit} hábitos ativos` : undefined}
            onClick={onNew}
            className={cn(
              "flex h-full w-full cursor-pointer flex-col items-center justify-end gap-0.5 rounded-md px-1 py-2 text-xs font-medium text-brand-700",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "lg:h-10 lg:flex-row lg:justify-center lg:gap-2 lg:bg-brand-600 lg:text-sm lg:font-semibold lg:text-white",
              "lg:shadow-xs lg:transition-colors lg:hover:bg-brand-700 motion-reduce:transition-none",
            )}
          >
            <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-white shadow-sm lg:size-auto lg:bg-transparent lg:shadow-none">
              <Plus aria-hidden="true" className="size-5 lg:size-4" />
            </span>
            Novo hábito
            {limitReached && <span className="sr-only"> (limite de {limit} hábitos ativos)</span>}
          </button>
        </li>
        <li className="lg:hidden">
          <Link to="/conta" className={item}>
            <UserRound aria-hidden="true" />
            Conta
          </Link>
        </li>
      </ul>

      <div className="mt-auto hidden border-t border-slate-200 p-4 lg:block">
        <div className="flex items-center gap-3">
          <Avatar name={name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink" title={name}>{name}</p>
            <p className="truncate text-xs text-slate-500" title={email}>{email}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1" onClick={onChangePassword}>
            <KeyRound aria-hidden="true" />
            Trocar senha
          </Button>
          <Button size="sm" variant="ghost" onClick={onLogout}>
            <LogOut aria-hidden="true" />
            Sair
          </Button>
        </div>
      </div>
    </nav>
  );
}
