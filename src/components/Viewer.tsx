"use client";

import { useEffect, useRef, useState } from "react";
import { formatDate } from "@/lib/format";
import { LIMITS, type Photo, type PhotoPatch } from "@/lib/photos";
import { fromInputValue, toInputValue } from "@/lib/time";
import { Heart } from "./Heart";
import { buttonStyles } from "./ui";

type Props = {
  photos: Photo[];
  index: number;
  canEdit: boolean;
  error: string | null;
  onIndex: (i: number) => void;
  onClose: () => void;
  onSave: (photo: Photo, patch: PhotoPatch) => Promise<boolean>;
  onDelete: (photo: Photo) => void;
};

/**
 * Full-screen photo viewer, like the Photos app: swipe or use the arrows to
 * move, tap the photo to hide the controls, jump around with the filmstrip.
 */
export function Viewer({ photos, index, canEdit, error, onIndex, onClose, onSave, onDelete }: Props) {
  const photo = photos[index];
  const [chrome, setChrome] = useState(true);
  const [editing, setEditing] = useState(false);
  const [dragX, setDragX] = useState(0);
  const touch = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null);
  const strip = useRef<HTMLDivElement>(null);

  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;
  const prev = () => hasPrev && onIndex(index - 1);
  const next = () => hasNext && onIndex(index + 1);

  useEffect(() => {
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, []);

  useEffect(() => {
    if (editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
      if (e.key === "ArrowRight" && index < photos.length - 1) onIndex(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, index, photos.length, onClose, onIndex]);

  // Keep the current photo centered in the filmstrip, and preload its neighbors.
  useEffect(() => {
    strip.current
      ?.querySelector<HTMLElement>(`[data-index="${index}"]`)
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    for (const p of [photos[index - 1], photos[index + 1]]) if (p) new Image().src = p.url;
  }, [index, photos]);

  if (!photo) return null;
  const taken = Date.parse(photo.takenAt);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, horizontal: null };
  }
  function onTouchMove(e: React.TouchEvent) {
    const start = touch.current;
    if (!start) return;
    const t = e.touches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (start.horizontal === null && Math.abs(dx) + Math.abs(dy) > 8) start.horizontal = Math.abs(dx) > Math.abs(dy);
    if (start.horizontal) setDragX(!hasPrev && dx > 0 ? dx / 4 : !hasNext && dx < 0 ? dx / 4 : dx);
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    setDragX(0);
    if (start.horizontal && dx < -60) next();
    else if (start.horizontal && dx > 60) prev();
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) setChrome((c) => !c);
  }

  const bar = `transition-opacity duration-300 ${chrome ? "opacity-100" : "pointer-events-none opacity-0"}`;
  const arrow =
    "absolute top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-2xl text-white backdrop-blur hover:bg-white/20 md:grid";

  return (
    <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-50 select-none bg-[#0f0b09] text-white">
      {/* Photo */}
      <div
        className="absolute inset-0 flex touch-pan-y items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={(e) => {
          // Mouse clicks toggle the controls; taps are handled in onTouchEnd.
          if (e.detail > 0 && !("ontouchstart" in window)) setChrome((c) => !c);
        }}
      >
        <img
          key={photo.id}
          src={photo.url}
          alt={photo.caption ?? `Photo from ${formatDate(taken, "long")}`}
          draggable={false}
          style={{ transform: `translateX(${dragX}px)`, transition: dragX ? "none" : "transform 250ms ease-out" }}
          className="fade-in max-h-full max-w-full object-contain"
        />
      </div>

      {hasPrev && (
        <button type="button" onClick={prev} aria-label="Previous photo" className={`${arrow} left-4 ${bar}`}>
          ‹
        </button>
      )}
      {hasNext && (
        <button type="button" onClick={next} aria-label="Next photo" className={`${arrow} right-4 ${bar}`}>
          ›
        </button>
      )}

      {/* Top bar */}
      <div className={`absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent pb-10 ${bar}`}>
        <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 pt-3">
          <button type="button" onClick={onClose} className="justify-self-start rounded-full px-3 py-2 text-sm hover:bg-white/10">
            ‹ Back
          </button>
          <div className="text-center leading-tight">
            <p className="text-sm font-semibold">{formatDate(taken, "range")}</p>
            <p className="text-xs text-white/70">{formatDate(taken, "time")}</p>
          </div>
          <span className="justify-self-end text-xs text-white/60">
            {index + 1} of {photos.length}
          </span>
        </div>
      </div>

      {/* Bottom: caption, filmstrip, owner tools */}
      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-16 ${bar}`}>
        <div className="mx-auto max-w-5xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {photo.caption && <p className="mb-3 text-center font-display text-xl italic">{photo.caption}</p>}

          <div ref={strip} className="no-scrollbar flex items-center gap-[3px] overflow-x-auto px-[45%] py-1">
            {photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                data-index={i}
                onClick={() => onIndex(i)}
                aria-label={`Photo ${i + 1}`}
                aria-current={i === index}
                className={`h-11 shrink-0 overflow-hidden rounded-[3px] transition-all duration-300 ${
                  i === index ? "mx-1.5 w-16 opacity-100" : "w-7 opacity-60 hover:opacity-90"
                }`}
              >
                <img src={p.thumbUrl} alt="" className="size-full object-cover" draggable={false} />
              </button>
            ))}
          </div>

          {canEdit && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onSave(photo, { favorite: !photo.favorite })}
                aria-pressed={photo.favorite}
                aria-label={photo.favorite ? "Remove from favorites" : "Add to favorites"}
                className="grid size-11 place-items-center rounded-full hover:bg-white/10"
              >
                <Heart className={`size-6 ${photo.favorite ? "text-[#e8768a]" : ""}`} filled={photo.favorite} />
              </button>
              <button type="button" onClick={() => setEditing(true)} className="rounded-full px-4 py-2 text-sm hover:bg-white/10">
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(photo)}
                className="rounded-full px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-[#f3a7b4]"
              >
                Delete
              </button>
            </div>
          )}
          {error && (
            <p role="alert" className="mt-2 text-center text-sm text-[#f3a7b4]">
              {error}
            </p>
          )}
        </div>
      </div>

      {editing && <EditSheet key={photo.id} photo={photo} onCancel={() => setEditing(false)} onSave={onSave} onDone={() => setEditing(false)} />}
    </div>
  );
}

function EditSheet({
  photo,
  onCancel,
  onSave,
  onDone,
}: {
  photo: Photo;
  onCancel: () => void;
  onSave: (photo: Photo, patch: PhotoPatch) => Promise<boolean>;
  onDone: () => void;
}) {
  const [when, setWhen] = useState(() => toInputValue(Date.parse(photo.takenAt)));
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ms = fromInputValue(when);
    if (ms === null) return;
    setSaving(true);
    const ok = await onSave(photo, { takenAt: new Date(ms).toISOString(), caption: caption.trim() || null });
    setSaving(false);
    if (ok) onDone();
  }

  const input =
    "mt-1 w-full rounded-xl border border-wheat-deep bg-cream px-3 py-2.5 text-cocoa outline-none placeholder:text-tan focus:border-burgundy";

  return (
    <div className="absolute inset-0 z-10 flex items-end justify-center bg-black/50 sm:items-center" onClick={onCancel}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
        className="w-full max-w-md rounded-t-3xl bg-paper p-6 text-cocoa sm:rounded-3xl"
      >
        <h2 className="font-display text-2xl font-semibold">Edit photo</h2>
        <label className="mt-4 block text-sm text-brown">
          Taken on
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={input} />
        </label>
        <label className="mt-3 block text-sm text-brown">
          Caption
          <input
            type="text"
            value={caption}
            maxLength={LIMITS.maxCaption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional"
            className={input}
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={buttonStyles.ghost}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={buttonStyles.primary}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
