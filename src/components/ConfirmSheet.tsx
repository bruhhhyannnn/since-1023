"use client";

import { useEffect, useRef } from "react";

/** A gentle "are you sure?" that works everywhere (some in-app browsers block window.confirm). */
export function ConfirmSheet({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fade-in fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-center" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(e) => e.stopPropagation()}
        className="sheet-up w-full max-w-sm rounded-3xl bg-paper p-6 text-center text-cocoa shadow-2xl"
      >
        <h2 id="confirm-title" className="font-display text-2xl font-semibold">
          {title}
        </h2>
        <p id="confirm-message" className="mt-1.5 text-sm text-brown">
          {message}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="press w-full rounded-full bg-[#b3261e] py-3 text-sm font-semibold text-white hover:bg-[#8f1d17]"
          >
            {confirmLabel}
          </button>
          <button ref={cancel} type="button" onClick={onCancel} className="press w-full rounded-full py-3 text-sm font-medium text-brown hover:bg-wheat/60">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
