"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { FULL_SIDE, THUMB_SIDE, readTakenAt, resizeToJpeg, type Jpeg } from "@/lib/image";
import { LIMITS } from "@/lib/photos";
import { albumFor, fromInputValue, monthsaryTitle, toInputValue } from "@/lib/time";
import { Heart } from "./Heart";
import { buttonStyles } from "./ui";

type Item = {
  key: string;
  file: File;
  status: "reading" | "ready" | "uploading" | "done" | "error";
  takenAt?: number;
  caption: string;
  thumb?: Jpeg;
  preview?: string;
  error?: string;
};

const noop = () => () => {};
/** False until the page is interactive, so photos picked too early aren't silently dropped. */
const useReady = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

const isImage = (f: File) => f.type.startsWith("image/") || /\.(heic|heif|jpe?g|png|webp)$/i.test(f.name);

export function Uploader() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [lastAlbum, setLastAlbum] = useState<number | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const router = useRouter();
  const previews = useRef<string[]>([]);
  const ready = useReady();

  useEffect(() => () => previews.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const update = (key: string, patch: Partial<Item>) =>
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const fresh: Item[] = Array.from(files)
      .filter(isImage)
      .map((file) => ({ key: crypto.randomUUID(), file, status: "reading", caption: "" }));
    setItems((list) => [...list, ...fresh]);
    setLastAlbum(null);

    // One at a time keeps phones from running out of memory.
    for (const item of fresh) {
      try {
        const takenAt = await readTakenAt(item.file);
        const thumb = await resizeToJpeg(item.file, THUMB_SIDE, 0.8);
        const preview = URL.createObjectURL(thumb.blob);
        previews.current.push(preview);
        update(item.key, { status: "ready", takenAt, thumb, preview });
      } catch (err) {
        update(item.key, { status: "error", error: (err as Error).message });
      }
    }
  }

  async function uploadAll() {
    setBusy(true);
    setSignedOut(false);
    const queue = items.filter((i) => i.thumb && (i.status === "ready" || i.status === "error"));
    let uploadedTo: number | null = null;

    for (const item of queue) {
      update(item.key, { status: "uploading", error: undefined });
      try {
        const full = await resizeToJpeg(item.file, FULL_SIDE, 0.86);
        const form = new FormData();
        form.append("full", full.blob, "full.jpg");
        form.append("thumb", item.thumb!.blob, "thumb.jpg");
        form.append("takenAt", new Date(item.takenAt!).toISOString());
        form.append("caption", item.caption);
        form.append("width", String(full.width));
        form.append("height", String(full.height));

        const res = await fetch("/api/photos", { method: "POST", body: form });
        if (res.status === 401) {
          update(item.key, { status: "ready" });
          setSignedOut(true);
          break;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Upload failed. Try again?");
        }
        update(item.key, { status: "done" });
        uploadedTo = albumFor(item.takenAt!);
      } catch (err) {
        update(item.key, { status: "error", error: (err as Error).message });
      }
    }

    setBusy(false);
    if (uploadedTo !== null) {
      setLastAlbum(uploadedTo);
      router.refresh();
    }
  }

  const pending = items.filter((i) => i.thumb && (i.status === "ready" || i.status === "error")).length;
  const reading = items.some((i) => i.status === "reading");
  const allDone = items.length > 0 && items.every((i) => i.status === "done");

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging ? "border-burgundy bg-wheat/60" : "border-tan bg-paper/70 hover:border-burgundy"
        }`}
      >
        <Heart className="size-7 text-burgundy" />
        <span className="mt-3 font-display text-2xl font-semibold text-cocoa">{ready ? "Choose photos" : "Getting ready…"}</span>
        <span className="mt-1 text-sm text-brown">or drop them here. Pick as many as you like.</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={busy || !ready}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {items.length > 0 && (
        <ul className="mt-6 space-y-3">
          {items.map((item) => (
            <UploadRow
              key={item.key}
              item={item}
              disabled={busy || item.status === "done"}
              onChange={(patch) => update(item.key, patch)}
              onRemove={() => setItems((list) => list.filter((i) => i.key !== item.key))}
            />
          ))}
        </ul>
      )}

      {signedOut && (
        <p role="alert" className="mt-6 rounded-2xl border border-rose/40 bg-paper p-4 text-sm text-rose">
          You were signed out, so nothing else was added.{" "}
          <Link href="/login?next=/memories/upload" className="font-medium underline underline-offset-4">
            Sign in again
          </Link>{" "}
          and your photos will still be here to add.
        </p>
      )}

      {(pending > 0 || reading || allDone) && (
        <div className="sticky bottom-4 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-wheat-deep bg-paper/95 p-4 shadow-lg backdrop-blur">
          {allDone && lastAlbum !== null ? (
            <>
              <p className="text-sm text-cocoa">All added. They look great together.</p>
              <Link href={`/memories/${lastAlbum}`} className={buttonStyles.primary}>
                See the {monthsaryTitle(lastAlbum)} album
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-brown">
                {reading ? "Getting photos ready…" : `${pending} photo${pending === 1 ? "" : "s"} ready to add`}
              </p>
              <button
                type="button"
                onClick={uploadAll}
                disabled={busy || reading || pending === 0}
                className={buttonStyles.primary}
              >
                {busy ? "Uploading…" : `Add ${pending} photo${pending === 1 ? "" : "s"}`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function UploadRow({
  item,
  disabled,
  onChange,
  onRemove,
}: {
  item: Item;
  disabled: boolean;
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex gap-3 rounded-2xl border border-wheat-deep/70 bg-paper/80 p-3 sm:gap-4">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-wheat sm:size-28">
        {item.preview && <img src={item.preview} alt="" className="size-full object-cover" />}
        {(item.status === "reading" || item.status === "uploading") && (
          <div className="absolute inset-0 grid place-items-center bg-cream/60">
            <Heart className="beat size-6 text-burgundy" />
          </div>
        )}
        {item.status === "done" && (
          <div className="absolute inset-0 grid place-items-center bg-burgundy/60 text-sm font-medium text-cream">
            Added
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm text-brown" title={item.file.name}>
            {item.file.name}
          </p>
          {!disabled && item.status !== "uploading" && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${item.file.name}`}
              className="-mr-1 -mt-1 rounded-full px-2 text-lg leading-none text-brown hover:text-burgundy"
            >
              ×
            </button>
          )}
        </div>

        {item.takenAt !== undefined && (
          <>
            <label className="mt-2 block">
              <span className="sr-only">When was this taken?</span>
              <input
                type="datetime-local"
                value={toInputValue(item.takenAt)}
                disabled={disabled}
                onChange={(e) => {
                  const ms = fromInputValue(e.target.value);
                  if (ms !== null) onChange({ takenAt: ms });
                }}
                className="w-full rounded-lg border border-wheat-deep bg-cream px-2.5 py-1.5 text-sm text-cocoa outline-none focus:border-burgundy disabled:opacity-70"
              />
            </label>
            <p className="mt-1 text-xs text-brown">
              Goes in the <span className="font-medium text-burgundy">{monthsaryTitle(albumFor(item.takenAt))}</span>{" "}
              album
            </p>
            <input
              type="text"
              value={item.caption}
              maxLength={LIMITS.maxCaption}
              disabled={disabled}
              onChange={(e) => onChange({ caption: e.target.value })}
              placeholder="Caption (optional)"
              aria-label="Caption"
              className="mt-2 w-full rounded-lg border border-wheat-deep bg-cream px-2.5 py-1.5 text-sm text-cocoa outline-none placeholder:text-tan focus:border-burgundy disabled:opacity-70"
            />
          </>
        )}

        {item.error && (
          <p role="alert" className="mt-2 text-sm text-rose">
            {item.error}
          </p>
        )}
      </div>
    </li>
  );
}
