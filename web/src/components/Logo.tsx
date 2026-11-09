import { cn } from "@/lib/cn";

/**
 * Logo do Habits (spec 009): um "H" de 7 blocos em degradê de azuis, montado da base
 * esquerda (mais escuro) ao topo direito (mais claro), com o último bloco ainda descendo
 * para o encaixe. Conceito aprovado em specs/009-novo-design-system/logo/.
 */

// x, y de cada bloco na ordem de "construção"
const BLOCKS: [number, number][] = [
  [5, 47], [5, 29.5], [5, 12], [22.5, 29.5], [40, 47], [40, 29.5],
];

const PALETTES = {
  // Sobre fundo claro
  default: {
    blocks: ["#1E3A8A", "#1E40AF", "#1D4ED8", "#2563EB", "#3B82F6", "#60A5FA"],
    slot: "#DBEAFE",
    last: "#93C5FD",
    text: "text-ink",
  },
  // Sobre o painel azul das telas de entrada
  inverted: {
    blocks: ["#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE", "#EFF6FF", "#FFFFFF"],
    slot: "rgb(255 255 255 / 0.18)",
    last: "#FFFFFF",
    text: "text-white",
  },
};

interface LogoProps {
  /** "icon" só o símbolo; "full" símbolo + nome. */
  variant?: "icon" | "full";
  inverted?: boolean;
  className?: string;
}

export function Logo({ variant = "full", inverted = false, className }: LogoProps) {
  const palette = PALETTES[inverted ? "inverted" : "default"];
  return (
    <span role="img" aria-label="Habits" className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 64 64" className="size-9 shrink-0" aria-hidden="true">
        {BLOCKS.map(([x, y], index) => (
          <rect key={index} x={x} y={y} width="15" height="15" rx="3.5" fill={palette.blocks[index]} />
        ))}
        <rect x="40" y="12" width="15" height="15" rx="3.5" fill={palette.slot} />
        <rect x="44" y="3" width="15" height="15" rx="3.5" fill={palette.last} transform="rotate(-12 51.5 10.5)" />
      </svg>
      {variant === "full" && (
        <span aria-hidden="true" className={cn("text-2xl font-bold tracking-tight", palette.text)}>Habits</span>
      )}
    </span>
  );
}
