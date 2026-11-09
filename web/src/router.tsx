import { useSyncExternalStore, type ComponentProps, type MouseEvent } from "react";
import { cn } from "@/lib/cn";

/**
 * Roteador mínimo sobre a History API (spec 009, plan P5): três rotas fixas, sem parâmetros.
 * O Nginx devolve o index.html para qualquer caminho, então favoritos e recarregar funcionam.
 */
export const ROUTES = ["/", "/arquivados", "/conta"] as const;
export type Route = (typeof ROUTES)[number];

const CHANGE = "habits:navigate";

/** Rota da barra de endereço; caminho desconhecido vale como a Semana ("/"). */
export function currentRoute(): Route {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return (ROUTES as readonly string[]).includes(path) ? (path as Route) : "/";
}

export function navigate(to: Route, { replace = false } = {}) {
  if (!replace && window.location.pathname === to) return;
  window.history[replace ? "replaceState" : "pushState"](null, "", to);
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(CHANGE, onChange);
  };
}

/** Rota atual; re-renderiza em navigate() e nos botões voltar/avançar do navegador. */
export function useRoute(): Route {
  return useSyncExternalStore(subscribe, currentRoute);
}

type LinkProps = Omit<ComponentProps<"a">, "href"> & { to: Route };

/** Link interno: muda a rota sem recarregar; ativo ganha aria-current="page" (estilize com aria-[current=page]:). */
export function Link({ to, className, onClick, ...props }: LinkProps) {
  const route = useRoute();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    // Ctrl/⌘/Shift/botão do meio: deixa o navegador abrir em outra aba/janela
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  }

  return (
    <a href={to} aria-current={route === to ? "page" : undefined} className={cn(className)}
      onClick={handleClick} {...props} />
  );
}
