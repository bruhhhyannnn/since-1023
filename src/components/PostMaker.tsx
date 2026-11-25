"use client";

import { Check, Copy, Download, MessageSquareHeart, RectangleVertical, Share, Smartphone } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { groupByAlbum } from "@/lib/albums";
import { MAX_PHOTOS, POST_SIZES, canvasToJpeg, loadImage, loadPostFonts, renderPost, type PostFormat } from "@/lib/collage";
import { formatDate, formatRange } from "@/lib/format";
import type { Photo } from "@/lib/photos";
import { START, albumRange, monthsaryAt, monthsaryTitle, spanText } from "@/lib/time";
import { COUPLE, US } from "@/lib/us";
import { Heart } from "./Heart";
import { FadeImg } from "./motion/FadeImg";
import { Button, Picker, Segmented, Switch, TextField } from "./ui";

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
            <Button icon={Share} onClick={share}>
              Share to Instagram
            </Button>
          )}
          <Button icon={Download} variant={canShare ? "secondary" : "primary"} onClick={download}>
            Download
          </Button>
        </div>
        {status && (
          <p role="status" className="mt-3 text-center text-sm text-rose">
            {status}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-7">
        <Picker
          label="Which monthsary"
          value={n}
          onChange={choose}
          options={options.map((m) => {
            const r = albumRange(m);
            const count = albums.get(m)?.length ?? 0;
            return {
              value: m,
              label: monthsaryTitle(m),
              description: formatRange(r.from, r.to),
              meta: count ? `${count} photo${count === 1 ? "" : "s"}` : undefined,
            };
          })}
        />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-brown">Size</span>
          <Segmented
            label="Size"
            value={format}
            onChange={setFormat}
            options={[
              { value: "post", label: POST_SIZES.post.label, icon: RectangleVertical },
              { value: "story", label: POST_SIZES.story.label, icon: Smartphone },
            ]}
          />
        </div>

        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-brown">
              Photos <span className="tabular text-burgundy">{selected.length}</span>/{MAX_PHOTOS}
            </p>
            <Switch checked={everything} onChange={setEverything} label="Every month" />
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
                      className="press relative block aspect-square w-full overflow-hidden rounded-xl bg-wheat outline-offset-2 transition-[outline-color] aria-pressed:outline-3 aria-pressed:outline-burgundy"
                    >
                      <FadeImg
                        src={p.thumbUrl}
                        alt=""
                        loading="lazy"
                        className={`size-full object-cover ${order >= 0 ? "scale-[0.92] rounded-lg" : "opacity-75 hover:opacity-100"}`}
                      />
                      {order >= 0 && (
                        <span className="pop-in absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-burgundy text-xs font-semibold text-cream shadow">
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

        <TextField
          label="A little message (optional)"
          icon={MessageSquareHeart}
          value={message}
          maxLength={60}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Forever starts with you"
        />

        <div className="rounded-2xl border border-wheat-deep/70 bg-paper/80 p-4">
          <p className="eyebrow">Caption idea</p>
          <p className="mt-2 select-all text-cocoa">{caption}</p>
          <Button variant="ghost" size="sm" icon={copied ? Check : Copy} onClick={copyCaption} className="-ml-3 mt-2">
            {copied ? "Copied" : "Copy caption"}
          </Button>
        </div>
      </div>
    </div>
  );
}
