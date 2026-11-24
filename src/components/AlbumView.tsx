"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { groupByDay, keyPhoto } from "@/lib/albums";
import { formatDate, formatRange } from "@/lib/format";
import type { Photo, PhotoPatch } from "@/lib/photos";
import { albumRange, albumReadyAt, monthsaryTitle, spanText, toWall } from "@/lib/time";
import { Heart } from "./Heart";
import { Slideshow } from "./Slideshow";
import { Viewer } from "./Viewer";

type Props = {
  n: number;
  photos: Photo[];
  canEdit: boolean;
  complete: boolean;
  celebratingToday: boolean;
  initialPhoto?: string;
};

/** One monthsary album, presented like the Photos app. */
export function AlbumView({ n, photos, canEdit, complete, celebratingToday, initialPhoto }: Props) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<string, Partial<Photo>>>({});
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [openId, setOpenId] = useState<string | null>(
    initialPhoto && photos.some((p) => p.id === initialPhoto) ? initialPhoto : null,
  );
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shown = photos.filter((p) => !removed.has(p.id)).map((p) => ({ ...p, ...overrides[p.id] }));
  const openIndex = shown.findIndex((p) => p.id === openId);
  const cover = keyPhoto(shown);
  const favorites = shown.filter((p) => p.favorite).length;
  const days = groupByDay(shown);

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

  async function remove(photo: Photo) {
    if (!window.confirm("Delete this photo for good?")) return;
    if (!(await send(`/api/photos/${photo.id}`, { method: "DELETE" }))) return;
    const i = shown.findIndex((p) => p.id === photo.id);
    const neighbor = shown[i + 1] ?? shown[i - 1];
    setOpenId(neighbor ? neighbor.id : null);
    setRemoved((s) => new Set(s).add(photo.id));
    router.refresh();
  }

  const badge = celebratingToday
    ? `Happy ${title}! Our album is ready`
    : !complete && n > 0
      ? `This month · complete on ${formatDate(albumReadyAt(n), "short")}`
      : null;

  return (
    <>
      {/* Title card */}
      <section className="relative -mx-4 overflow-hidden bg-cocoa sm:mx-0 sm:rounded-3xl">
        <div className="relative aspect-[4/5] max-h-[78vh] w-full sm:aspect-[16/9]">
          {cover ? (
            <img src={cover.url} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-tan via-brown to-burgundy-dark" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/20" />

          {badge && (
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-burgundy shadow sm:left-6 sm:top-6">
              <Heart className={`size-3.5 ${celebratingToday ? "beat" : ""}`} /> {badge}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-white/80">{range}</p>
            <h1 className="mt-2 font-display text-5xl font-semibold leading-[0.95] drop-shadow sm:text-7xl">{title}</h1>
            <p className="mt-2 text-sm text-white/85">{details.join(" · ")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {shown.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-cocoa transition-colors hover:bg-cream"
                >
                  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                    <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
                  </svg>
                  Play
                </button>
              )}
              {canEdit && complete && shown.length > 0 && (
                <Link
                  href={`/monthsary?n=${n}`}
                  className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-burgundy-dark"
                >
                  Make the post
                </Link>
              )}
              {canEdit && (
                <Link
                  href="/memories/upload"
                  className="rounded-full bg-white/15 px-5 py-2.5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
                >
                  Add photos
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {error && !openId && (
        <p role="alert" className="mt-4 text-sm text-rose">
          {error}
        </p>
      )}

      {/* Days */}
      {days.length === 0 ? (
        <p className="mt-10 text-center text-brown">
          {canEdit ? "No photos yet. Add some as the month goes." : "No photos in this album yet."}
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {days.map(({ day, photos: list }) => (
            <section key={day} aria-label={formatDate(day, "dayYear")}>
              <div className="mb-2 flex items-baseline justify-between gap-3 px-0.5">
                <h2 className="font-display text-2xl font-semibold text-cocoa">
                  {formatDate(day, spansYears ? "dayYear" : "day")}
                </h2>
                <span className="shrink-0 text-sm text-brown">
                  {list.length} photo{list.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="grid grid-flow-row-dense grid-cols-3 gap-[3px] overflow-hidden rounded-xl sm:grid-cols-4 lg:grid-cols-5">
                {list.map((p) => {
                  const big = list.length === 1 || (p.favorite && list.length >= 3);
                  return (
                    <li key={p.id} className={`relative aspect-square bg-wheat ${big ? "col-span-2 row-span-2" : ""}`}>
                      <button
                        type="button"
                        onClick={() => setOpenId(p.id)}
                        aria-label={`Open photo from ${formatDate(Date.parse(p.takenAt), "long")}`}
                        className="group block size-full overflow-hidden"
                      >
                        <img
                          src={big ? p.url : p.thumbUrl}
                          alt={p.caption ?? ""}
                          loading="lazy"
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </button>
                      {p.favorite && (
                        <Heart className="pointer-events-none absolute bottom-1.5 left-1.5 size-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {openIndex >= 0 && (
        <Viewer
          photos={shown}
          index={openIndex}
          canEdit={canEdit}
          error={error}
          onIndex={(i) => setOpenId(shown[i]?.id ?? null)}
          onClose={() => setOpenId(null)}
          onSave={save}
          onDelete={remove}
        />
      )}

      {playing && (
        <Slideshow
          photos={shown}
          title={title}
          subtitle={range}
          onClose={() => setPlaying(false)}
        />
      )}
    </>
  );
}
