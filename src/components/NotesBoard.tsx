"use client";

import { Check, Globe, Lock, MailOpen, Send, Trash2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { NOTE_COLORS, NOTE_LIMIT, authorName, recipientName, type Note, type NoteAuthor, type NoteColor } from "@/lib/notes";
import { US } from "@/lib/us";
import { useStoredChoice } from "@/lib/use-stored";
import { ConfirmSheet } from "./ConfirmSheet";
import { Heart } from "./Heart";
import { HeartBurst } from "./motion/HeartBurst";
import { NOTE_PAPER, NotePaper } from "./NotePaper";
import { Toast } from "./Toast";
import { Button, EmptyState, IconButton, Segmented, Swatches, TextArea } from "./ui";

const UNDO_MS = 5000;
const AUTHORS = ["me", "her"] as const;

type Filter = "all" | NoteAuthor;

/** The love notes wall: write a note (when signed in), read, heart, and delete them. */
export function NotesBoard({ notes, canWrite, needsSetup }: { notes: Note[]; canWrite: boolean; needsSetup?: boolean }) {
  const router = useRouter();
  const [added, setAdded] = useState<Note[]>([]);
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [loved, setLoved] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; undoable: boolean; key: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [burst, setBurst] = useState<{ id: string; n: number } | null>(null);
  const pending = useRef<{ id: string; timer: ReturnType<typeof setTimeout> } | null>(null);
  const toastSeq = useRef(0);

  const all = [...added.filter((a) => !notes.some((n) => n.id === a.id)), ...notes]
    .filter((n) => !removed.has(n.id))
    .map((n) => (n.id in loved ? { ...n, loved: loved[n.id] } : n));
  const shown = filter === "all" ? all : all.filter((n) => n.author === filter);

  function say(message: string, undoable = false) {
    setToast({ message, undoable, key: ++toastSeq.current });
    if (!undoable) setTimeout(() => setToast((t) => (t && !t.undoable ? null : t)), 2400);
  }

  async function request(url: string, init: RequestInit): Promise<Response | null> {
    setError(null);
    const res = await fetch(url, init).catch(() => null);
    if (!res) setError("Couldn't reach the site. Check your connection?");
    else if (res.status === 401) setError("You were signed out. Tap the heart at the bottom of the page five times to sign in again.");
    else if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? "Something went wrong. Try again?");
    return res?.ok ? res : null;
  }

  async function toggleLove(note: Note) {
    const next = !note.loved;
    setLoved((l) => ({ ...l, [note.id]: next }));
    if (next) setBurst({ id: note.id, n: (burst?.n ?? 0) + 1 });
    const ok = await request(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ loved: next }),
    });
    if (!ok) setLoved((l) => ({ ...l, [note.id]: note.loved }));
    else router.refresh();
  }

  /* Deleting waits a few seconds so it can be undone. */
  const sendDelete = useCallback(
    (id: string, keepalive = false) => fetch(`/api/notes/${id}`, { method: "DELETE", keepalive }),
    [],
  );

  useEffect(() => {
    const flush = () => {
      const p = pending.current;
      if (!p) return;
      clearTimeout(p.timer);
      pending.current = null;
      void sendDelete(p.id, true).catch(() => undefined);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [sendDelete]);

  async function commitDelete(id: string) {
    pending.current = null;
    setToast(null);
    const res = await sendDelete(id).catch(() => null);
    if (!res?.ok) {
      setRemoved((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
      setError("Couldn't delete that note, so it's back. Try again?");
      return;
    }
    router.refresh();
  }

  function deleteNote(id: string) {
    if (pending.current) {
      clearTimeout(pending.current.timer);
      void commitDelete(pending.current.id);
    }
    setRemoved((s) => new Set(s).add(id));
    pending.current = { id, timer: setTimeout(() => void commitDelete(id), UNDO_MS) };
    say("Note deleted", true);
  }

  function undo() {
    const p = pending.current;
    if (!p) return;
    clearTimeout(p.timer);
    pending.current = null;
    setRemoved((s) => {
      const next = new Set(s);
      next.delete(p.id);
      return next;
    });
    say("Restored");
  }

  const counts = { all: all.length, me: all.filter((n) => n.author === "me").length, her: all.filter((n) => n.author === "her").length };

  return (
    <div>
      {needsSetup && canWrite && (
        <div role="alert" className="enter mb-6 flex gap-3 rounded-3xl border border-dashed border-tan bg-paper/80 p-5 text-sm text-brown">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-burgundy" />
          <div>
            <p className="font-medium text-cocoa">One quick setup step for love notes</p>
            <p className="mt-1">
              In Supabase, open <b>SQL Editor → New query</b>, paste everything from <code>supabase/love-notes.sql</code>, and
              click <b>Run</b>. Then refresh this page.
            </p>
          </div>
        </div>
      )}

      {canWrite && (
        <Composer
          onSent={(note) => {
            setAdded((a) => [note, ...a]);
            setFilter("all");
            say(`Note left for ${recipientName(note.author)}`);
            router.refresh();
          }}
          onError={setError}
        />
      )}

      {error && (
        <p role="alert" className="enter mt-6 flex items-start gap-2 rounded-2xl border border-rose/30 bg-paper px-4 py-3 text-sm text-rose">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      {all.length > 1 && (
        <div className="mt-10 flex justify-center">
          <Segmented
            label="Show notes from"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: `All ${counts.all}` },
              { value: "me", label: `${US.me} ${counts.me}` },
              { value: "her", label: `${US.her} ${counts.her}` },
            ]}
          />
        </div>
      )}

      {shown.length === 0 ? (
        <div className="enter mt-10">
          <EmptyState icon={MailOpen} title={all.length ? "No notes here yet" : canWrite ? "No notes yet" : "Our notes are just for us"}>
            {canWrite
              ? all.length
                ? "Try another filter, or write one above."
                : "Leave the first one above. It'll be waiting here."
              : "Little messages we leave for each other live here."}
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-10 columns-1 gap-6 sm:columns-2 lg:columns-3">
          {shown.map((note, i) => (
            <li key={note.id} className="mb-8 break-inside-avoid pt-2">
              <div className="note-in" style={{ animationDelay: `${Math.min(i, 9) * 70}ms` }}>
                <NotePaper
                  note={note}
                  index={i}
                  actions={
                    canWrite ? (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleLove(note)}
                          aria-pressed={note.loved}
                          aria-label={note.loved ? "Unheart this note" : "Heart this note"}
                          title={note.loved ? `${recipientName(note.author)} loved this` : "Heart this note"}
                          className="press relative grid size-9 place-items-center rounded-full transition-colors hover:bg-black/5"
                        >
                          <Heart
                            key={String(note.loved)}
                            className={`size-5 ${note.loved ? (note.color === "burgundy" ? "pop-in text-[#f3a7b4]" : "pop-in text-rose") : ""}`}
                            filled={note.loved}
                          />
                          {burst?.id === note.id && note.loved && <HeartBurst key={burst.n} />}
                        </button>
                        <IconButton
                          icon={Trash2}
                          label="Delete note"
                          size="sm"
                          onClick={() => setConfirm(note.id)}
                          className={note.color === "burgundy" ? "text-cream hover:bg-white/10 hover:text-cream" : ""}
                        />
                      </>
                    ) : note.loved ? (
                      <span className="flex items-center gap-1 pr-2" title={`${recipientName(note.author)} loved this`}>
                        <Heart className={`size-4 ${note.color === "burgundy" ? "text-[#f3a7b4]" : "text-rose"}`} />
                      </span>
                    ) : null
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {confirm && (
        <ConfirmSheet
          title="Delete this note?"
          message="It'll be removed from the wall. You'll have a few seconds to undo."
          confirmLabel="Delete note"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            deleteNote(confirm);
            setConfirm(null);
          }}
        />
      )}

      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          action={toast.undoable ? "Undo" : undefined}
          onAction={undo}
          durationMs={toast.undoable ? UNDO_MS : undefined}
          icon={
            toast.undoable ? (
              <Trash2 aria-hidden="true" className="size-4 shrink-0 opacity-80" />
            ) : (
              <Check aria-hidden="true" className="size-4 shrink-0" />
            )
          }
        />
      )}
    </div>
  );
}

/** Writing a note: who it's from, the words, a paper color, and who can see it. */
function Composer({ onSent, onError }: { onSent: (note: Note) => void; onError: (message: string | null) => void }) {
  const [author, setAuthor] = useStoredChoice<NoteAuthor>("since1023:note-author", "me", AUTHORS);
  const [body, setBody] = useState("");
  const [color, setColor] = useState<NoteColor>("cream");
  const [visibility, setVisibility] = useState<"us" | "everyone">("us");
  const [sending, setSending] = useState(false);
  const [burst, setBurst] = useState(0);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    onError(null);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ author, body, color, isPrivate: visibility === "us" }),
    }).catch(() => null);
    setSending(false);
    if (!res) return onError("Couldn't reach the site. Check your connection?");
    if (res.status === 401) return onError("You were signed out. Tap the heart at the bottom of the page five times to sign in again.");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return onError(data.error ?? "Couldn't leave that note. Try again?");
    setBody("");
    // Back to private after each note, so nothing is shared with everyone by accident.
    setVisibility("us");
    setBurst((b) => b + 1);
    onSent(data.note as Note);
  }

  const paper = NOTE_PAPER[color];
  const left = NOTE_LIMIT - body.length;

  return (
    <form onSubmit={send} className="enter rounded-[28px] border border-wheat-deep bg-paper/90 p-4 shadow-xl shadow-wheat-deep/30 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-brown">
          <span>From</span>
          <Segmented
            label="Who is writing"
            value={author}
            onChange={setAuthor}
            options={[
              { value: "me", label: US.me },
              { value: "her", label: US.her },
            ]}
          />
        </div>
        <p className="text-sm text-brown">
          to <span className="font-display text-lg font-semibold italic text-burgundy">{recipientName(author)}</span>
        </p>
      </div>

      {/* The note itself, on the paper color you picked */}
      <div className={`mt-4 rounded-md px-5 pb-3 pt-4 shadow-inner transition-colors duration-300 ${paper.className}`}>
        <TextArea
          label={`Your note to ${recipientName(author)}`}
          hideLabel
          value={body}
          maxLength={NOTE_LIMIT}
          rows={3}
          placeholder={`Dear ${recipientName(author)},`}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
          }}
          fieldClassName="min-h-24 font-hand text-[26px] leading-[1.15] placeholder:text-current"
        />
        <p className={`text-right text-[11px] opacity-60 ${left < 100 ? "font-semibold" : ""}`}>
          {left < 200 ? `${left} left` : `— ${authorName(author)}`}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Swatches
          label="Paper color"
          value={color}
          onChange={setColor}
          options={NOTE_COLORS.map((c) => ({ value: c, label: NOTE_PAPER[c].label, color: NOTE_PAPER[c].swatch }))}
        />
        <Segmented
          label="Who can see it"
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: "us", label: "Just us", icon: Lock },
            { value: "everyone", label: "Everyone", icon: Globe },
          ]}
        />
      </div>
      <p className="mt-2 text-xs text-brown">
        {visibility === "us" ? "Only the two of us will see this note." : "Anyone who visits the site can read this one."}
      </p>

      <div className="mt-4 flex justify-end">
        <Button type="submit" icon={Send} size="lg" disabled={sending || !body.trim()} className="relative">
          {sending ? "Sending…" : "Leave note"}
          {burst > 0 && <HeartBurst key={burst} color="#f3d6d1" />}
        </Button>
      </div>
    </form>
  );
}
