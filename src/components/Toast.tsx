"use client";

/** A small message at the bottom of the screen, with an optional action like "Undo". */
export function Toast({
  message,
  action,
  onAction,
  durationMs,
  raised,
}: {
  message: string;
  action?: string;
  onAction?: () => void;
  /** Shows a shrinking line for how long the toast stays. */
  durationMs?: number;
  /** Sit above a bottom toolbar instead of on top of it. */
  raised?: boolean;
}) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 ${
        raised ? "pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.5rem)]" : "pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      }`}
    >
      <div role="status" className="toast-in pointer-events-auto relative flex items-center gap-4 overflow-hidden rounded-full bg-cocoa py-3 pl-5 pr-3 text-sm text-cream shadow-2xl">
        <span>{message}</span>
        {action && (
          <button type="button" onClick={onAction} className="press rounded-full bg-cream/15 px-3.5 py-1.5 font-semibold hover:bg-cream/25">
            {action}
          </button>
        )}
        {durationMs && (
          <span className="toast-timer absolute inset-x-0 bottom-0 h-[2px] origin-left bg-cream/50" style={{ animationDuration: `${durationMs}ms` }} />
        )}
      </div>
    </div>
  );
}
