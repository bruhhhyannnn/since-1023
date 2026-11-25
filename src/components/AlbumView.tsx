"use client";

import { Check, CircleCheck, ImagePlus, Images, Play, Sparkles, Trash2, TriangleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { groupByDay, keyPhoto } from "@/lib/albums";
import { formatDate, formatRange } from "@/lib/format";
import type { Photo, PhotoPatch } from "@/lib/photos";
import { albumRange, albumReadyAt, monthsaryTitle, ordinal, spanText, toWall } from "@/lib/time";
import { wrapMonth, wrapYear, type Wrap } from "@/lib/wrapped";
import { ConfirmSheet } from "./ConfirmSheet";
import { Heart } from "./Heart";
import { FadeImg } from "./motion/FadeImg";
import { HeartBurst } from "./motion/HeartBurst";
import { Toast } from "./Toast";
import { Button, ButtonLink, EmptyState } from "./ui";
import { Viewer } from "./Viewer";
import { Wrapped } from "./Wrapped";

type Props = {
  n: number;
  photos: Photo[];
  canEdit: boolean;
  complete: boolean;
  celebratingToday: boolean;
  initialPhoto?: string;
  /** Request time, for "next up" in the story. */
  now: number;
  /** On anniversary albums: every photo from that year, for the Year Wrapped. */
  yearPhotos?: Photo[];
  /** Open the Wrapped story right away (links from the monthsary banner). */
  autoplay?: boolean;
};

/** Deletes wait this long so they can be undone. */
const UNDO_MS = 5000;


/** One monthsary album, presented like the Photos app. */
export function AlbumView({ n, photos, canEdit, complete, celebratingToday, initialPhoto, now, yearPhotos, autoplay }: Props) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<string, Partial<Photo>>>({});
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [openId, setOpenId] = useState<string | null>(
    initialPhoto && photos.some((p) => p.id === initialPhoto) ? initialPhoto : null,
  );
  const [wrap, setWrap] = useState<Wrap | null>(() => (autoplay && photos.length > 0 ? wrapMonth(n, photos) : null));
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [confirm, setConfirm] = useState<{ ids: string[]; fromViewer: boolean } | null>(null);
  const [toast, setToast] = useState<{ message: string; undoable: boolean; key: number } | null>(null);
  const [burst, setBurst] = useState(0);
  const pending = useRef<{ ids: string[]; timer: ReturnType<typeof setTimeout> } | null>(null);
  const toastSeq = useRef(0);

  const shown = photos.filter((p) => !removed.has(p.id)).map((p) => ({ ...p, ...overrides[p.id] }));
  const openIndex = shown.findIndex((p) => p.id === openId);
  const cover = keyPhoto(shown);
  const favorites = shown.filter((p) => p.favorite).length;
  const days = groupByDay(shown);
  const years = n > 0 && n % 12 === 0 && yearPhotos?.length ? n / 12 : null;

  const title = monthsaryTitle(n);
  const { from, to } = albumRange(n);
  const range = formatRange(from, to);
  const spansYears = from !== null && toWall(from).year !== toWall(to).year;
  const details = [
    n > 0 ? `${spanText(n)} together` : null,
    `${shown.length} photo${shown.length === 1 ? "" : "s"}`,
    favorites ? `${favorites} favorite${favorites === 1 ? "" : "s"}` : null,
  ].filter(Boolean);

  async function send(url: string, init: RequestInit): Promise<boolean> {
    setError(null);
    const res = await fetch(url, init).catch(() => null);
    if (!res) {
      setError("Couldn't reach the site. Check your connection?");
      return false;
    }
    if (res.status === 401) {
      setError("You were signed out. Tap the heart at the bottom of the page five times to sign in again.");
      return false;
    }
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Something went wrong. Try again?");
      return false;
    }
    return true;
  }

  async function save(photo: Photo, patch: PhotoPatch): Promise<boolean> {
    const before = overrides[photo.id];
    if (patch.favorite) setBurst((b) => b + 1);
    setOverrides((o) => ({ ...o, [photo.id]: { ...o[photo.id], ...patch } }));
    const ok = await send(`/api/photos/${photo.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!ok) setOverrides((o) => ({ ...o, [photo.id]: before ?? {} }));
    else router.refresh();
    return ok;
  }

  /* ---- Deleting, with a few seconds to undo ---- */

  const sendDelete = useCallback((ids: string[], keepalive = false) => {
    return fetch("/api/photos", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids }),
      keepalive,
    });
  }, []);

  // Leaving the page (or closing the tab) finishes any delete still waiting.
  useEffect(() => {
    const flush = () => {
      const p = pending.current;
      if (!p) return;
      clearTimeout(p.timer);
      pending.current = null;
      void sendDelete(p.ids, true).catch(() => undefined);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [sendDelete]);

  async function commitDelete(ids: string[]) {
    pending.current = null;
    setToast(null);
    const res = await sendDelete(ids).catch(() => null);
    if (!res?.ok) {
      setRemoved((s) => {
        const next = new Set(s);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      setError(
        res?.status === 401
          ? "You were signed out, so nothing was deleted. Sign in again and try once more."
          : ((await res?.json().catch(() => ({})))?.error ?? "Couldn't delete. The photos are back; try again?"),
      );
      return;
    }
    router.refresh();
  }

  function deleteNow(ids: string[]) {
    // Only one delete waits at a time; an earlier one goes through right away.
    if (pending.current) {
      clearTimeout(pending.current.timer);
      void commitDelete(pending.current.ids);
    }
    if (openId && ids.includes(openId)) {
      const i = shown.findIndex((p) => p.id === openId);
      const rest = shown.filter((p) => !ids.includes(p.id));
      const neighbor = rest[Math.min(i, rest.length - 1)];
      setOpenId(neighbor ? neighbor.id : null);
    }
    setRemoved((s) => new Set([...s, ...ids]));
    pending.current = { ids, timer: setTimeout(() => void commitDelete(ids), UNDO_MS) };
    setToast({ message: `${ids.length === 1 ? "Photo" : `${ids.length} photos`} deleted`, undoable: true, key: ++toastSeq.current });
    setSelecting(false);
    setSelected(new Set());
  }

  function undo() {
    const p = pending.current;
    if (!p) return;
    clearTimeout(p.timer);
    pending.current = null;
    setRemoved((s) => {
      const next = new Set(s);
      p.ids.forEach((id) => next.delete(id));
      return next;
    });
    setToast({ message: "Restored", undoable: false, key: ++toastSeq.current });
    setTimeout(() => setToast((t) => (t?.message === "Restored" ? null : t)), 1800);
  }

  /* ---- Select mode ---- */

  function toggleSelect(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectDay(list: Photo[]) {
    const all = list.every((p) => selected.has(p.id));
    setSelected((s) => {
      const next = new Set(s);
      list.forEach((p) => (all ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  }

  async function favoriteSelected() {
    const ids = [...selected];
    const makeFavorite = !ids.every((id) => shown.find((p) => p.id === id)?.favorite);
    const before = overrides;
    if (makeFavorite) setBurst((b) => b + 1);
    setOverrides((o) => {
      const next = { ...o };
      ids.forEach((id) => (next[id] = { ...next[id], favorite: makeFavorite }));
      return next;
    });
    const ok = await send("/api/photos", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids, favorite: makeFavorite }),
    });
    if (!ok) setOverrides(before);
    else {
      setSelecting(false);
      setSelected(new Set());
      setToast({
        message: `${ids.length === 1 ? "Photo" : `${ids.length} photos`} ${makeFavorite ? "added to" : "removed from"} favorites`,
        undoable: false,
        key: ++toastSeq.current,
      });
      setTimeout(() => setToast((t) => (t && !t.undoable ? null : t)), 2200);
      router.refresh();
    }
  }

  const selectedPhotos = shown.filter((p) => selected.has(p.id));
  const allSelectedFavorite = selectedPhotos.length > 0 && selectedPhotos.every((p) => p.favorite);

  const badge = celebratingToday
    ? `Happy ${title}! Our album is ready`
    : !complete && n > 0
      ? `This month · complete on ${formatDate(albumReadyAt(n), "short")}`
      : null;

  return (
    <>
      {/* Title card */}
      <section className="enter relative -mx-4 overflow-hidden bg-cocoa sm:mx-0 sm:rounded-3xl">
        <div className="relative aspect-[4/5] max-h-[78vh] w-full sm:aspect-[16/9]">
          {cover ? (
            <FadeImg src={cover.url} alt="" className="kenburns-slow absolute inset-0 size-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-tan via-brown to-burgundy-dark" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/20" />

          {badge && (
            <span
              className="pop-in absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-burgundy shadow sm:left-6 sm:top-6"
              style={{ "--d": "500ms" } as React.CSSProperties}
            >
              <Heart className={`size-3.5 ${celebratingToday ? "beat" : ""}`} /> {badge}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
            <p className="enter text-xs uppercase tracking-[0.25em] text-white/80" style={{ "--d": "150ms" } as React.CSSProperties}>
              {range}
            </p>
            <h1
              className="enter mt-2 font-display text-5xl font-semibold leading-[0.95] drop-shadow sm:text-7xl"
              style={{ "--d": "250ms" } as React.CSSProperties}
            >
              {title}
            </h1>
            <p className="enter mt-2 text-sm text-white/85" style={{ "--d": "350ms" } as React.CSSProperties}>
              {details.join(" · ")}
            </p>
            <div className="enter mt-5 flex flex-wrap gap-2" style={{ "--d": "450ms" } as React.CSSProperties}>
              {shown.length > 0 && (
                <Button variant="light" icon={Play} onClick={() => setWrap(wrapMonth(n, shown))}>
                  Watch our Wrapped
                </Button>
              )}
              {years && (
                <Button icon={Play} onClick={() => setWrap(wrapYear(years, yearPhotos!))}>
                  Our {ordinal(years)} year, Wrapped
                </Button>
              )}
              {canEdit && complete && shown.length > 0 && (
                <ButtonLink href={`/monthsary?n=${n}`} icon={Sparkles}>
                  Make the post
                </ButtonLink>
              )}
              {canEdit && (
                <ButtonLink href="/memories/upload" variant="glass" icon={ImagePlus}>
                  Add photos
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Select / Cancel, for the owners */}
      {canEdit && shown.length > 0 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-brown">
            {selecting ? (
              "Tap photos to select them."
            ) : (
              <>
                <Images aria-hidden="true" className="size-4 text-tan" />
                {shown.length} photo{shown.length === 1 ? "" : "s"}
              </>
            )}
          </p>
          <Button
            size="sm"
            variant={selecting ? "primary" : "secondary"}
            icon={selecting ? X : CircleCheck}
            onClick={() => {
              setSelecting((s) => !s);
              setSelected(new Set());
              // Clear "added to favorites" and similar notes so they don't cover the toolbar.
              setToast((t) => (t?.undoable ? t : null));
            }}
          >
            {selecting ? "Cancel" : "Select"}
          </Button>
        </div>
      )}

      {error && !openId && (
        <p role="alert" className="enter mt-4 flex items-start gap-2 rounded-2xl border border-rose/30 bg-paper px-4 py-3 text-sm text-rose">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      {/* Days */}
      {days.length === 0 ? (
        <div className="enter mt-8">
          <EmptyState
            icon={canEdit ? ImagePlus : Images}
            title="No photos yet"
            action={
              canEdit && (
                <ButtonLink href="/memories/upload" icon={ImagePlus}>
                  Add photos
                </ButtonLink>
              )
            }
          >
            {canEdit ? "Add some as the month goes." : "Photos from these days will show up here."}
          </EmptyState>
        </div>
      ) : (
        <div className={`mt-6 space-y-8 ${selecting ? "pb-28" : ""}`}>
          {days.map(({ day, photos: list }, dayIndex) => (
            <section key={day} aria-label={formatDate(day, "dayYear")} className={dayIndex > 0 ? "reveal" : ""}>
              <div className="mb-2 flex items-baseline justify-between gap-3 px-0.5">
                <h2 className="min-w-0 truncate font-display text-2xl font-semibold text-cocoa">
                  {formatDate(day, spansYears ? "dayYear" : "day")}
                </h2>
                {selecting ? (
                  <button type="button" onClick={() => selectDay(list)} className="shrink-0 text-sm font-medium text-burgundy">
                    {list.every((p) => selected.has(p.id)) ? "Deselect" : "Select all"}
                  </button>
                ) : (
                  <span className="shrink-0 text-sm text-brown">
                    {list.length} photo{list.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              <ul className="grid grid-flow-row-dense grid-cols-3 gap-[3px] overflow-hidden rounded-xl sm:grid-cols-4 lg:grid-cols-5">
                {list.map((p, i) => {
                  const big = list.length === 1 || (p.favorite && list.length >= 3);
                  const isSelected = selected.has(p.id);
                  return (
                    <li
                      key={p.id}
                      className={`tile-in relative aspect-square bg-wheat ${big ? "col-span-2 row-span-2" : ""}`}
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      <button
                        type="button"
                        onClick={() => (selecting ? toggleSelect(p.id) : setOpenId(p.id))}
                        aria-pressed={selecting ? isSelected : undefined}
                        aria-label={`${selecting ? (isSelected ? "Deselect" : "Select") : "Open"} photo from ${formatDate(Date.parse(p.takenAt), "long")}`}
                        className="group block size-full overflow-hidden"
                      >
                        <FadeImg
                          src={big ? p.url : p.thumbUrl}
                          alt={p.caption ?? ""}
                          loading="lazy"
                          className={`size-full object-cover transition-[scale,opacity] duration-300 group-hover:scale-[1.03] ${
                            isSelected ? "scale-[0.9] rounded-md" : ""
                          }`}
                        />
                      </button>
                      {p.favorite && (
                        <Heart className="pointer-events-none absolute bottom-1.5 left-1.5 size-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                      )}
                      {selecting && (
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none absolute bottom-1.5 right-1.5 grid size-6 place-items-center rounded-full border-2 border-white shadow transition-colors ${
                            isSelected ? "bg-burgundy" : "bg-black/20"
                          }`}
                        >
                          {isSelected && <Check className="pop-in size-3.5 text-white" strokeWidth={3.5} />}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Select mode toolbar */}
      {selecting && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="bar-in mx-auto flex max-w-xl items-center gap-2 rounded-full border border-wheat-deep bg-paper/95 p-2 pl-5 shadow-2xl backdrop-blur">
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-cocoa">
              {selected.size === 0 ? "Select photos" : `${selected.size} selected`}
            </p>
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={favoriteSelected}
              aria-label={allSelectedFavorite ? "Remove from favorites" : "Add to favorites"}
              className="press relative grid size-11 place-items-center rounded-full text-burgundy hover:bg-wheat disabled:opacity-40"
            >
              <Heart className="size-5" filled={allSelectedFavorite} />
              {burst > 0 && <HeartBurst key={burst} />}
            </button>
            <Button
              variant="danger"
              icon={Trash2}
              disabled={selected.size === 0}
              onClick={() => setConfirm({ ids: [...selected], fromViewer: false })}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {openIndex >= 0 && (
        <Viewer
          photos={shown}
          index={openIndex}
          canEdit={canEdit}
          error={error}
          burst={burst}
          onIndex={(i) => setOpenId(shown[i]?.id ?? null)}
          onClose={() => setOpenId(null)}
          onSave={save}
          onDelete={(photo) => setConfirm({ ids: [photo.id], fromViewer: true })}
        />
      )}

      {confirm && (
        <ConfirmSheet
          title={confirm.ids.length === 1 ? "Delete this photo?" : `Delete ${confirm.ids.length} photos?`}
          message={`${confirm.ids.length === 1 ? "It" : "They"}'ll be removed from the album. You'll have a few seconds to undo.`}
          confirmLabel={confirm.ids.length === 1 ? "Delete photo" : `Delete ${confirm.ids.length} photos`}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            deleteNow(confirm.ids);
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
          raised={selecting}
          icon={toast.undoable ? <Trash2 aria-hidden="true" className="size-4 shrink-0 opacity-80" /> : <Check aria-hidden="true" className="size-4 shrink-0" />}
        />
      )}

      {wrap && <Wrapped wrap={wrap} now={now} complete={complete} onClose={() => setWrap(null)} />}
    </>
  );
}
