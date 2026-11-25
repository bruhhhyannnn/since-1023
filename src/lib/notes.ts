import { US } from "./us";

/* Love notes: short messages we leave for each other. Shared by server and client. */

export const NOTE_COLORS = ["cream", "wheat", "blush", "burgundy"] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

/** "me" is US.me, "her" is US.her (see src/lib/us.ts). */
export type NoteAuthor = "me" | "her";

export type Note = {
  id: string;
  author: NoteAuthor;
  body: string;
  color: NoteColor;
  /** Only visible when signed in. */
  isPrivate: boolean;
  /** The other one hearted it. */
  loved: boolean;
  createdAt: string;
};

export type NewNote = Pick<Note, "author" | "body" | "color" | "isPrivate">;

export const NOTE_LIMIT = 1000;

export const authorName = (a: NoteAuthor) => (a === "me" ? US.me : US.her);
export const recipientName = (a: NoteAuthor) => (a === "me" ? US.her : US.me);

/** Checks a note coming from the browser. */
export function parseNewNote(input: unknown): { ok: true; note: NewNote } | { ok: false; error: string } {
  const o = (input ?? {}) as Record<string, unknown>;
  const body = typeof o.body === "string" ? o.body.replace(/\r\n/g, "\n").trim() : "";
  if (!body) return { ok: false, error: "Write something first." };
  if (body.length > NOTE_LIMIT) return { ok: false, error: `Keep it under ${NOTE_LIMIT.toLocaleString("en-US")} characters.` };
  if (o.author !== "me" && o.author !== "her") return { ok: false, error: "Who is this from?" };
  const color = NOTE_COLORS.includes(o.color as NoteColor) ? (o.color as NoteColor) : "cream";
  return { ok: true, note: { author: o.author, body, color, isPrivate: o.isPrivate !== false } };
}
