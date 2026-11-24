"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/format";
import { LIMITS, type Photo, type PhotoPatch } from "@/lib/photos";
import { fromInputValue, toInputValue } from "@/lib/time";
import { Heart } from "./Heart";
import { useAuthedFetch } from "./PasscodeProvider";
import { buttonStyles } from "./ui";

/** An album's photos: tap one to see it big, heart it, fix its date, or delete it. */
export function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [overrides, setOverrides] = useState<Record<string, Partial<Photo>>>({});
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const request = useAuthedFetch();
  const router = useRouter();

  const shown = photos.filter((p) => !removed.has(p.id)).map((p) => ({ ...p, ...overrides[p.id] }));
  const openIndex = shown.findIndex((p) => p.id === openId);

  async function save(photo: Photo, patch: PhotoPatch): Promise<boolean> {
    setError(null);
    const before = overrides[photo.id];
    setOverrides((o) => ({ ...o, [photo.id]: { ...o[photo.id], ...patch } }));
    const res = await request(`/api/photos/${photo.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);
    if (!res || !res.ok) {
      setOverrides((o) => ({ ...o, [photo.id]: before ?? {} }));
      if (res) setError((await res.json().catch(() => ({}))).error ?? "Couldn't save that. Try again?");
      return false;
    }
    router.refresh();
    return true;
  }

  async function remove(photo: Photo) {
    if (!window.confirm("Delete this photo for good?")) return;
    setError(null);
    const res = await request(`/api/photos/${photo.id}`, { method: "DELETE" }).catch(() => null);
    if (!res) return;
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Couldn't delete that. Try again?");
      return;
    }
    const next = shown[openIndex + 1] ?? shown[openIndex - 1];
    setOpenId(next && next.id !== photo.id ? next.id : null);
    setRemoved((s) => new Set(s).add(photo.id));
    router.refresh();
  }

  if (shown.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-tan bg-paper/70 px-6 py-12 text-center">
        <Heart className="mx-auto size-6 text-burgundy" />
        <p className="mt-3 font-display text-2xl font-semibold text-cocoa">Nothing here yet</p>
        <p className="mt-1 text-sm text-brown">Photos taken during these days will show up here.</p>
      </div>
    );
  }

  return (
    <>
      {error && !openId && (
        <p role="alert" className="mb-4 text-sm text-rose">
          {error}
        </p>
      )}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
        {shown.map((p) => (
          <li
            key={p.id}
            id={p.id}
            className="group relative aspect-square scroll-mt-24 overflow-hidden rounded-2xl bg-wheat target:ring-4 target:ring-burgundy/70"
          >
            <button type="button" onClick={() => setOpenId(p.id)} className="block size-full">
              <img
                src={p.thumbUrl}
                alt={p.caption ?? `Photo from ${formatDate(Date.parse(p.takenAt))}`}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
            <FavoriteButton photo={p} onToggle={() => save(p, { favorite: !p.favorite })} small />
          </li>
        ))}
      </ul>

      {openIndex >= 0 && (
        <Lightbox
          key={shown[openIndex].id}
          photo={shown[openIndex]}
          position={`${openIndex + 1} / ${shown.length}`}
          error={error}
          onClose={() => setOpenId(null)}
          onPrev={openIndex > 0 ? () => setOpenId(shown[openIndex - 1].id) : undefined}
          onNext={openIndex < shown.length - 1 ? () => setOpenId(shown[openIndex + 1].id) : undefined}
          onSave={(patch) => save(shown[openIndex], patch)}
          onDelete={() => remove(shown[openIndex])}
        />
      )}
    </>
  );
}

function FavoriteButton({ photo, onToggle, small }: { photo: Photo; onToggle: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={photo.favorite}
      aria-label={photo.favorite ? "Remove from favorites" : "Add to favorites"}
      className={`grid place-items-center rounded-full transition-all ${
        small
          ? `absolute right-2 top-2 size-9 ${
              photo.favorite ? "bg-cream/90 text-burgundy" : "bg-cocoa/25 text-cream opacity-90 hover:bg-cocoa/40"
            }`
          : `size-11 ${photo.favorite ? "bg-burgundy text-cream" : "bg-cream/15 text-cream hover:bg-cream/25"}`
      }`}
    >
      <Heart className={small ? "size-4.5" : "size-5"} filled={photo.favorite} />
    </button>
  );
}

function Lightbox({
  photo,
  position,
  error,
  onClose,
  onPrev,
  onNext,
  onSave,
  onDelete,
}: {
  photo: Photo;
  position: string;
  error: string | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSave: (patch: PhotoPatch) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [when, setWhen] = useState(() => toInputValue(Date.parse(photo.takenAt)));
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    if (editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, onClose, onPrev, onNext]);

  const taken = Date.parse(photo.takenAt);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ms = fromInputValue(when);
    if (ms === null) return;
    setSaving(true);
    const ok = await onSave({ takenAt: new Date(ms).toISOString(), caption: caption.trim() || null });
    setSaving(false);
    if (ok) setEditing(false);
  }

  const navButton = "absolute top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-cream/10 text-2xl text-cream hover:bg-cream/20 sm:grid";

  return (
    <div role="dialog" aria-modal="true" aria-label="Photo" className="fixed inset-0 z-50 flex flex-col bg-[#1f1612] text-cream">
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
        <span className="text-cream/70">{position}</span>
        <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 hover:bg-cream/10">
          Close
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
        <img
          src={photo.url}
          alt={photo.caption ?? ""}
          className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
        />
        {onPrev && (
          <button type="button" onClick={onPrev} aria-label="Previous photo" className={`${navButton} left-3`}>
            ‹
          </button>
        )}
        {onNext && (
          <button type="button" onClick={onNext} aria-label="Next photo" className={`${navButton} right-3`}>
            ›
          </button>
        )}
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-4">
        {editing ? (
          <form onSubmit={submit} className="space-y-2">
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              aria-label="When was this taken?"
              className="w-full rounded-lg border border-cream/20 bg-cream/10 px-3 py-2 text-sm text-cream outline-none [color-scheme:dark] focus:border-cream/60"
            />
            <input
              type="text"
              value={caption}
              maxLength={LIMITS.maxCaption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              aria-label="Caption"
              className="w-full rounded-lg border border-cream/20 bg-cream/10 px-3 py-2 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-cream/60"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditing(false)} className="rounded-full px-4 py-2 text-sm text-cream/80 hover:text-cream">
                Cancel
              </button>
              <button type="submit" disabled={saving} className={buttonStyles.primary}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg italic leading-snug sm:text-xl">{photo.caption || formatDate(taken, "long")}</p>
              {photo.caption && <p className="text-sm text-cream/60">{formatDate(taken, "long")}</p>}
            </div>
            <FavoriteButton photo={photo} onToggle={() => onSave({ favorite: !photo.favorite })} />
            <button type="button" onClick={() => setEditing(true)} className="rounded-full px-3 py-2 text-sm text-cream/80 hover:bg-cream/10 hover:text-cream">
              Edit
            </button>
            <button type="button" onClick={onDelete} className="rounded-full px-3 py-2 text-sm text-cream/80 hover:bg-cream/10 hover:text-[#f3a7b4]">
              Delete
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm text-[#f3a7b4]">
            {error}
          </p>
        )}
        <div className="mt-3 flex justify-between sm:hidden">
          <button type="button" onClick={onPrev} disabled={!onPrev} className="rounded-full px-4 py-2 text-sm disabled:opacity-30">
            ‹ Previous
          </button>
          <button type="button" onClick={onNext} disabled={!onNext} className="rounded-full px-4 py-2 text-sm disabled:opacity-30">
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}
