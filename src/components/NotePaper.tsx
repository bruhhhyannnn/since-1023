import { ArrowRight, Lock } from "lucide-react";
import { formatDate } from "@/lib/format";
import { authorName, recipientName, type Note, type NoteColor } from "@/lib/notes";

export const NOTE_PAPER: Record<NoteColor, { label: string; swatch: string; className: string }> = {
  cream: { label: "Cream", swatch: "#fffcf6", className: "bg-[#fffcf6] text-cocoa" },
  wheat: { label: "Wheat", swatch: "#f3e4c4", className: "bg-wheat text-cocoa" },
  blush: { label: "Blush", swatch: "#f3d6d1", className: "bg-[#f3d6d1] text-burgundy-dark" },
  burgundy: { label: "Burgundy", swatch: "#7a1f2e", className: "bg-burgundy text-cream" },
};

const TILTS = [-1.6, 1.1, -0.6, 1.6, -1.1, 0.7];

/** A note on paper with a bit of tape: who it's from, the words, and when. */
export function NotePaper({
  note,
  index = 0,
  actions,
  className = "",
}: {
  note: Note;
  index?: number;
  /** Buttons for the bottom-right corner (heart, delete). */
  actions?: React.ReactNode;
  className?: string;
}) {
  const at = Date.parse(note.createdAt);
  return (
    <article
      className={`note-paper relative rounded-md px-5 pb-4 pt-7 shadow-[0_14px_34px_-16px_rgba(61,43,34,0.45)] ${NOTE_PAPER[note.color].className} ${className}`}
      style={{ "--tilt": `${TILTS[index % TILTS.length]}deg` } as React.CSSProperties}
    >
      <span
        aria-hidden="true"
        className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-3 rounded-[2px] bg-[#efe0bd]/80 shadow-sm"
      />
      <header className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">
        <span className="flex min-w-0 items-center gap-1.5">
          {authorName(note.author)}
          <ArrowRight aria-label="to" className="size-3 shrink-0" />
          {recipientName(note.author)}
        </span>
        {note.isPrivate && (
          <span className="flex shrink-0 items-center gap-1 normal-case tracking-normal" title="Only we can see this">
            <Lock aria-hidden="true" className="size-3" />
            Just us
          </span>
        )}
      </header>
      <p className="mt-3 whitespace-pre-wrap break-words font-hand text-[26px] leading-[1.15]">{note.body}</p>
      <footer className="mt-4 flex min-h-9 items-center justify-between gap-2 text-xs opacity-80">
        <time dateTime={note.createdAt}>
          {formatDate(at, "medium")} · {formatDate(at, "time")}
        </time>
        {actions && <div className="-mr-2 flex items-center">{actions}</div>}
      </footer>
    </article>
  );
}
