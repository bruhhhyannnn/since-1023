"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "./button";

/**
 * Our own pop-up panel: slides up from the bottom on phones, sits in the
 * middle on bigger screens. Used for pickers, confirmations and forms.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  role = "dialog",
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  role?: "dialog" | "alertdialog";
  size?: "sm" | "md";
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the first thing inside that wants it, or the panel itself.
    const target = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current;
    target?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = overflow;
      before?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fade-in fixed inset-0 z-[80] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panel}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`sheet-up flex max-h-[90dvh] w-full flex-col rounded-t-[28px] bg-paper text-cocoa shadow-2xl outline-none sm:rounded-[28px] ${
          size === "sm" ? "sm:max-w-sm" : "sm:max-w-md"
        }`}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-wheat-deep sm:hidden" aria-hidden="true" />
        <div className="flex shrink-0 items-start justify-between gap-3 px-6 pb-2 pt-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-2xl font-semibold leading-tight">
              {title}
            </h2>
            {description && <div className="mt-1 text-sm text-brown">{description}</div>}
          </div>
          <IconButton icon={X} label="Close" size="sm" onClick={onClose} className="-mr-2 -mt-1" />
        </div>
        {children && <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4">{children}</div>}
        {footer && (
          <div className="shrink-0 border-t border-wheat-deep/60 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
