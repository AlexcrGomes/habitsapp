import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  /** Para onde levar o foco se o botão que abriu o diálogo não existir mais (ex.: hábito arquivado). */
  fallbackFocus?: string;
  className?: string;
  /** Marca o diálogo como componente do design system (components/ui/dialog). */
  slot?: string;
  children: ReactNode;
}

/** <dialog> nativo: foco preso no modal e Esc fecha. O conteúdo só é montado aberto (estado novo a cada abertura). */
export function Modal({ open, onClose, labelledBy, fallbackFocus, className, slot, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) {
      dialog.close();
      // O navegador devolve o foco a quem abriu; se esse elemento sumiu, o foco iria para o <body>
      requestAnimationFrame(() => {
        const active = document.activeElement;
        if ((!active || active === document.body) && fallbackFocus) {
          document.querySelector<HTMLElement>(fallbackFocus)?.focus();
        }
      });
    }
  }, [open, fallbackFocus]);

  return (
    <dialog
      ref={ref}
      className={className}
      data-slot={slot}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {open && children}
    </dialog>
  );
}
