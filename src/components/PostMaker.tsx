"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { groupByAlbum } from "@/lib/albums";
import { MAX_PHOTOS, POST_SIZES, canvasToJpeg, loadImage, loadPostFonts, renderPost, type PostFormat } from "@/lib/collage";
import { formatDate, formatRange } from "@/lib/format";
import type { Photo } from "@/lib/photos";
import { START, albumRange, monthsaryAt, monthsaryTitle, spanText } from "@/lib/time";
import { COUPLE, US } from "@/lib/us";
import { Heart } from "./Heart";
import { buttonStyles } from "./ui";

const noop = () => () => {};
const useCanShare = () =>
  useSyncExternalStore(
    noop,
    () => typeof navigator !== "undefined" && typeof navigator.canShare === "function",
    () => false,
  );

function defaultSelection(photos: Photo[]): string[] {
  const favorites = photos.filter((p) => p.favorite);
  return (favorites.length > 0 ? favorites : photos).slice(0, MAX_PHOTOS).map((p) => p.id);
}

export function PostMaker({ photos, initialN, maxN }: { photos: Photo[]; initialN: number; maxN: number }) {
  const albums = groupByAlbum(photos);
  const [n, setN] = useState(initialN);
  const [format, setFormat] = useState<PostFormat>("post");
  const [selected, setSelected] = useState<string[]>(() => defaultSelection(albums.get(initialN) ?? []));
  const [message, setMessage] = useState("");
  const [everything, setEverything] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canShare = useCanShare();

  const title = monthsaryTitle(n);
  const choices = everything
    ? [...photos].sort((a, b) => a.takenAt.localeCompare(b.takenAt))
    : albums.get(n) ?? [];
  const byId = new Map(photos.map((p) => [p.id, p]));
  const selectedPhotos = selected.map((id) => byId.get(id)).filter((p): p is Photo => Boolean(p));
  const selectedKey = selectedPhotos.map((p) => p.url).join("|");

  // Redraw whenever anything changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadPostFonts();
      let images: HTMLImageElement[] = [];
      try {
        images = await Promise.all(selectedKey ? selectedKey.split("|").map(loadImage) : []);
      } catch (err) {
        if (!cancelled) setStatus((err as Error).message);
        return;
      }
      if (cancelled || !canvasRef.current) return;
      renderPost(canvasRef.current, {
        format,
        names: COUPLE,
        title,
        subtitle: `${spanText(n)} together`,
        message,
        from: formatDate(START, "dots"),
        to: formatDate(monthsaryAt(n), "dots"),
        images,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [format, title, n, message, selectedKey]);

  function choose(next: number) {
    setN(next);
    setSelected(defaultSelection(albums.get(next) ?? []));
    setStatus(null);
  }

  function toggle(id: string) {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
      setStatus(null);
    } else if (selected.length >= MAX_PHOTOS) {
      setStatus(`Up to ${MAX_PHOTOS} photos fit in one post.`);
    } else {
      setSelected([...selected, id]);
      setStatus(null);
    }
  }

  const fileName = `${title.toLowerCase().replace(/\s+/g, "-")}${format === "story" ? "-story" : ""}.jpg`;

  async function download() {
    if (!canvasRef.current) return;
    try {
      const blob = await canvasToJpeg(canvasRef.current);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  async function share() {
    if (!canvasRef.current) return;
    try {
      const blob = await canvasToJpeg(canvasRef.current);
      const file = new File([blob], fileName, { type: "image/jpeg" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
      } else {
        await download();
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setStatus((err as Error).message);
    }
  }

  const caption = `Happy ${title.toLowerCase()}, ${US.her}! ${spanText(n)} of us, and counting. 🤎`;

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatus("Couldn't copy. Press and hold the caption to copy it instead.");
    }
  }

  const options = Array.from({ length: maxN }, (_, i) => maxN - i);
  const { width, height } = POST_SIZES[format];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
      {/* Preview */}
      <div className="lg:sticky lg:top-20">
        <div className="mx-auto w-full max-w-md rounded-3xl border border-wheat-deep/70 bg-paper/80 p-3 shadow-xl shadow-wheat-deep/30">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            aria-label={`Preview of the ${title} post`}
            className="block h-auto w-full rounded-2xl"
            style={{ aspectRatio: `${width} / ${height}` }}
          />
        </div>
        <div className="mx-auto mt-4 flex max-w-md flex-wrap justify-center gap-2">
          {canShare && (
            <button type="button" onClick={share} className={buttonStyles.primary}>
              Share to Instagram
            </button>
          )}
          <button type="button" onClick={download} className={canShare ? buttonStyles.secondary : buttonStyles.primary}>
            Download
          </button>
        </div>
        {status && (
          <p role="status" className="mt-3 text-center text-sm text-rose">
            {status}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-7">
        <div>
          <label htmlFor="which" className="eyebrow">
            Which monthsary
          </label>
          <select
            id="which"
            value={n}
            onChange={(e) => choose(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-wheat-deep bg-paper px-3 py-2.5 text-cocoa outline-none focus:border-burgundy"
          >
            {options.map((m) => {
              const r = albumRange(m);
              const count = albums.get(m)?.length ?? 0;
              return (
                <option key={m} value={m}>
                  {monthsaryTitle(m)} · {formatRange(r.from, r.to)}
                  {count ? ` · ${count} photo${count === 1 ? "" : "s"}` : ""}
                </option>
              );
            })}
          </select>
        </div>

        <fieldset>
          <legend className="eyebrow">Size</legend>
          <div className="mt-2 inline-flex rounded-full border border-wheat-deep bg-paper p-1">
            {(Object.keys(POST_SIZES) as PostFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                aria-pressed={format === f}
                className="rounded-full px-4 py-1.5 text-sm text-brown aria-pressed:bg-burgundy aria-pressed:text-cream"
              >
                {POST_SIZES[f].label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="eyebrow">
              Photos · {selected.length}/{MAX_PHOTOS}
            </p>
            <label className="flex items-center gap-2 text-sm text-brown">
              <input
                type="checkbox"
                checked={everything}
                onChange={(e) => setEverything(e.target.checked)}
                className="accent-burgundy"
              />
              Show photos from every month
            </label>
          </div>
          {choices.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-tan bg-paper/70 p-5 text-sm text-brown">
              No photos in this album yet. Add some in Memories, or show photos from every month.
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {choices.map((p) => {
                const order = selected.indexOf(p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      aria-pressed={order >= 0}
                      aria-label={`${order >= 0 ? "Remove" : "Add"} photo from ${formatDate(Date.parse(p.takenAt))}`}
                      className="relative block aspect-square w-full overflow-hidden rounded-xl bg-wheat outline-offset-2 aria-pressed:outline-3 aria-pressed:outline-burgundy"
                    >
                      <img
                        src={p.thumbUrl}
                        alt=""
                        loading="lazy"
                        className={`size-full object-cover transition-opacity ${order >= 0 ? "" : "opacity-70 hover:opacity-100"}`}
                      />
                      {order >= 0 && (
                        <span className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-burgundy text-xs font-semibold text-cream">
                          {order + 1}
                        </span>
                      )}
                      {p.favorite && <Heart className="absolute bottom-1.5 right-1.5 size-4 text-cream drop-shadow" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-2 text-xs text-brown">Tap photos in the order you want them. Favorites are picked for you.</p>
        </div>

        <div>
          <label htmlFor="message" className="eyebrow">
            A little message (optional)
          </label>
          <input
            id="message"
            type="text"
            value={message}
            maxLength={60}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Forever starts with you"
            className="mt-2 w-full rounded-xl border border-wheat-deep bg-paper px-3 py-2.5 text-cocoa outline-none placeholder:text-tan focus:border-burgundy"
          />
        </div>

        <div className="rounded-2xl border border-wheat-deep/70 bg-paper/80 p-4">
          <p className="eyebrow">Caption idea</p>
          <p className="mt-2 select-all text-cocoa">{caption}</p>
          <button type="button" onClick={copyCaption} className={`${buttonStyles.ghost} -ml-3 mt-1 px-3`}>
            {copied ? "Copied!" : "Copy caption"}
          </button>
        </div>
      </div>
    </div>
  );
}
