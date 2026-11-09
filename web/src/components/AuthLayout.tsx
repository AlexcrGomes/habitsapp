import type { ReactNode } from "react";
import { Logo } from "./Logo";

// Blocos decorativos do painel: ecoam a logo (um "H" sendo construído), em tons translúcidos
const BLOCKS = [
  "left-0 top-24 bg-white/10", "left-0 top-12 bg-white/15", "left-0 top-0 bg-white/20",
  "left-12 top-12 bg-white/25", "left-24 top-24 bg-white/30", "left-24 top-12 bg-white/40",
];

/**
 * Entrar/Criar conta (spec 009, US3): duas colunas a partir de 1024 px — painel da marca
 * em degradê azul e o formulário; abaixo disso, uma coluna com a logo acima do cartão.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-slate-50 text-slate-700 lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-linear-to-br from-brand-700 via-brand-800 to-brand-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo inverted />

        <div className="relative z-10 max-w-md">
          <p className="text-4xl font-semibold leading-tight tracking-tight">
            Construa seus hábitos, um bloco de cada vez.
          </p>
        </div>

        <div aria-hidden="true" className="absolute right-16 top-32 size-36 opacity-90">
          {BLOCKS.map((classes) => (
            <span key={classes} className={`absolute size-10 rounded-lg ${classes}`} />
          ))}
          <span className="absolute -top-10 left-28 size-10 -rotate-12 rounded-lg bg-white/60" />
        </div>
        <div aria-hidden="true" className="absolute -right-24 -top-24 size-80 rounded-full bg-brand-500/20 blur-3xl" />
      </section>

      <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10 sm:px-6">
        <Logo className="mb-8 lg:hidden" />
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
