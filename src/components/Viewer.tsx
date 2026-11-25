"use client";

import { Check, ChevronLeft, ChevronRight, LoaderCircle, PenLine, Pencil, Share, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { albumOf } from "@/lib/albums";
import { shareOrDownload } from "@/lib/collage";
import { formatDate } from "@/lib/format";
import { LIMITS, type Photo, type PhotoPatch } from "@/lib/photos";
import { albumFor, monthsaryTitle } from "@/lib/time";
import { Heart } from "./Heart";
import { HeartBurst } from "./motion/HeartBurst";
import { Button, DateTimeField, IconButton, Sheet, TextField } from "./ui";

type Props = {
  photos: Photo[];
  index: number;
  canEdit: boolean;
  error: string | null;
  /** Bumped each time a photo is hearted, to play the little burst. */
  burst?: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  onSave: (photo: Photo, patch: PhotoPatch) => Promise<boolean>;
  onDelete: (photo: Photo) => void;
};

/**
 * Full-screen photo viewer, like the Photos app: swipe or use the arrows to
 * move, tap to hide the controls, double-tap to zoom, jump around with the
 * filmstrip.
 */
export function Viewer({ photos, index, canEdit, error, burst = 0, onIndex, onClose, onSave, onDelete }: Props) {
  const photo = photos[index];
  const [chrome, setChrome] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
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

  async function save() {
    setSaving(true);
    setNote(null);
    try {
      const res = await fetch(photo.url);
      if (!res.ok) throw new Error();
      const day = formatDate(taken, "dots").replaceAll(".", "-");
      await shareOrDownload(await res.blob(), `us-${day}.jpg`, photo.caption ?? formatDate(taken, "long"));
    } catch {
      setNote("Couldn't save this photo. Try again?");
    }
    setSaving(false);
  }

  const bar = `transition-opacity duration-300 ${chrome ? "opacity-100" : "pointer-events-none opacity-0"}`;
  const arrow = "absolute top-1/2 hidden -translate-y-1/2 md:block";

  return (
    <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="viewer-in fixed inset-0 z-50 select-none bg-[#0f0b09] text-white">
      <ZoomableImage
        key={photo.id}
        photo={photo}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onSwipe={(dir) => (dir > 0 ? next() : prev())}
        onTap={() => setChrome((c) => !c)}
      />

      {hasPrev && (
        <div className={`${arrow} left-4 ${bar}`}>
          <IconButton icon={ChevronLeft} label="Previous photo" variant="glass" onClick={prev} />
        </div>
      )}
      {hasNext && (
        <div className={`${arrow} right-4 ${bar}`}>
          <IconButton icon={ChevronRight} label="Next photo" variant="glass" onClick={next} />
        </div>
      )}

      {/* Top bar */}
      <div className={`absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent pb-10 ${bar}`}>
        <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 pt-3">
          <Button variant="glass" size="sm" icon={ChevronLeft} onClick={onClose} className="justify-self-start pl-2.5">
            Back
          </Button>
          <div className="text-center leading-tight">
            <p className="text-sm font-semibold">{formatDate(taken, "range")}</p>
            <p className="text-xs text-white/70">
              {formatDate(taken, "time")} · {index + 1} of {photos.length}
            </p>
          </div>
          <IconButton
            icon={saving ? LoaderCircle : Share}
            label="Save or share this photo"
            variant="glass"
            size="sm"
            onClick={save}
            disabled={saving}
            className={`justify-self-end ${saving ? "[&_svg]:animate-spin" : ""}`}
          />
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
                aria-label={photo.favorite ? "Remove from favorites" : "Add to favorites"}
                aria-pressed={photo.favorite}
                onClick={() => onSave(photo, { favorite: !photo.favorite })}
                className="press relative grid size-11 place-items-center rounded-full bg-white/15 backdrop-blur transition-colors hover:bg-white/25"
              >
                <Heart
                  key={`${photo.id}-${photo.favorite}`}
                  className={`size-6 ${photo.favorite ? "pop-in text-[#e8768a]" : ""}`}
                  filled={photo.favorite}
                />
                {burst > 0 && photo.favorite && <HeartBurst key={burst} />}
              </button>
              <Button variant="glass" icon={Pencil} onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button variant="glass" icon={Trash2} onClick={() => onDelete(photo)} className="hover:text-[#f3a7b4]">
                Delete
              </Button>
            </div>
          )}
          {(error || note) && (
            <p role="alert" className="mt-2 text-center text-sm text-[#f3a7b4]">
              {error ?? note}
            </p>
          )}
        </div>
      </div>

      {editing && <EditSheet key={photo.id} photo={photo} onClose={() => setEditing(false)} onSave={onSave} />}
    </div>
  );
}

/** The photo itself: swipe to move on, tap to show or hide the controls, double-tap to zoom in and drag around. */
function ZoomableImage({
  photo,
  hasPrev,
  hasNext,
  onSwipe,
  onTap,
}: {
  photo: Photo;
  hasPrev: boolean;
  hasNext: boolean;
  onSwipe: (direction: 1 | -1) => void;
  onTap: () => void;
}) {
  const [zoom, setZoom] = useState({ s: 1, x: 0, y: 0 });
  const [dragX, setDragX] = useState(0);
  const [moving, setMoving] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number; horizontal: boolean | null; from: typeof zoom } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(tapTimer.current), []);

  const clamp = (v: number, s: number, size: number) => {
    const max = (size * (s - 1)) / 2;
    return Math.max(-max, Math.min(max, v));
  };

  function toggleZoom(clientX: number, clientY: number) {
    if (zoom.s > 1) return setZoom({ s: 1, x: 0, y: 0 });
    const r = box.current!.getBoundingClientRect();
    const s = 2.5;
    const cx = clientX - (r.left + r.width / 2);
    const cy = clientY - (r.top + r.height / 2);
    setZoom({ s, x: clamp(-cx * (s - 1), s, r.width), y: clamp(-cy * (s - 1), s, r.height) });
  }

  function tapAt(x: number, y: number) {
    const now = performance.now();
    const last = lastTap.current;
    if (last && now - last.t < 300 && Math.hypot(x - last.x, y - last.y) < 40) {
      clearTimeout(tapTimer.current);
      lastTap.current = null;
      toggleZoom(x, y);
    } else {
      lastTap.current = { t: now, x, y };
      tapTimer.current = setTimeout(onTap, 300);
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length > 1) return;
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, horizontal: null, from: zoom };
    setMoving(true);
  }
  function onTouchMove(e: React.TouchEvent) {
    const start = touch.current;
    if (!start || e.touches.length > 1) return;
    const t = e.touches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (start.from.s > 1) {
      const r = box.current!.getBoundingClientRect();
      setZoom({ ...start.from, x: clamp(start.from.x + dx, start.from.s, r.width), y: clamp(start.from.y + dy, start.from.s, r.height) });
      return;
    }
    if (start.horizontal === null && Math.abs(dx) + Math.abs(dy) > 8) start.horizontal = Math.abs(dx) > Math.abs(dy);
    if (start.horizontal) setDragX(!hasPrev && dx > 0 ? dx / 4 : !hasNext && dx < 0 ? dx / 4 : dx);
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touch.current;
    touch.current = null;
    setMoving(false);
    setDragX(0);
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return tapAt(t.clientX, t.clientY);
    if (start.from.s === 1 && start.horizontal && Math.abs(dx) > 60) onSwipe(dx < 0 ? 1 : -1);
  }

  return (
    <div
      ref={box}
      className="absolute inset-0 flex touch-none items-center justify-center overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={(e) => {
        // Mouse: one click toggles the controls, a double-click zooms. Touch is handled above.
        if ("ontouchstart" in window) return;
        if (e.detail === 1) tapTimer.current = setTimeout(onTap, 250);
        if (e.detail === 2) {
          clearTimeout(tapTimer.current);
          toggleZoom(e.clientX, e.clientY);
        }
      }}
    >
      <img
        src={photo.url}
        alt={photo.caption ?? `Photo from ${formatDate(Date.parse(photo.takenAt), "long")}`}
        draggable={false}
        style={{
          transform: `translate(${zoom.x + dragX}px, ${zoom.y}px) scale(${zoom.s})`,
          transition: moving ? "none" : "transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          cursor: zoom.s > 1 ? "zoom-out" : "zoom-in",
        }}
        className="fade-in max-h-full max-w-full object-contain"
      />
    </div>
  );
}

function EditSheet({
  photo,
  onClose,
  onSave,
}: {
  photo: Photo;
  onClose: () => void;
  onSave: (photo: Photo, patch: PhotoPatch) => Promise<boolean>;
}) {
  const [when, setWhen] = useState(() => Date.parse(photo.takenAt));
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [saving, setSaving] = useState(false);
  const moves = albumFor(when) !== albumOf(photo);

  async function submit() {
    setSaving(true);
    const ok = await onSave(photo, { takenAt: new Date(when).toISOString(), caption: caption.trim() || null });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Edit photo"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={Check} onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        <DateTimeField
          label="Taken on"
          value={when}
          onChange={setWhen}
          hint={(ms) => (
            <>
              Goes in the <span className="font-medium text-burgundy">{monthsaryTitle(albumFor(ms))}</span> album
            </>
          )}
        />
        {moves && (
          <p className="enter -mt-2 text-xs text-burgundy">
            This moves it to the {monthsaryTitle(albumFor(when))} album.
          </p>
        )}
        <TextField
          label="Caption"
          icon={PenLine}
          value={caption}
          maxLength={LIMITS.maxCaption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Optional"
          data-autofocus
        />
      </div>
    </Sheet>
  );
}
