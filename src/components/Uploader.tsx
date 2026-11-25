"use client";

import { Check, CopyCheck, ImagePlus, Images, PenLine, Plus, RotateCcw, TriangleAlert, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { duplicateFlags } from "@/lib/duplicates";
import { formatDate } from "@/lib/format";
import { FULL_SIDE, THUMB_SIDE, readTakenAt, resizeToJpeg, type Jpeg } from "@/lib/image";
import { LIMITS } from "@/lib/photos";
import { albumFor, monthsaryTitle } from "@/lib/time";
import { Heart } from "./Heart";
import { Button, ButtonLink, DateTimeField, IconButton, TextField } from "./ui";

type Item = {
  key: string;
  file: File;
  status: "reading" | "ready" | "uploading" | "done" | "error";
  takenAt?: number;
  caption: string;
  thumb?: Jpeg;
  preview?: string;
  /** From 0 to 1 while uploading. */
  progress: number;
  error?: string;
  /** Upload it even though it looks like a photo we already have. */
  keepDuplicate?: boolean;
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
const canUpload = (i: Item, duplicate: boolean) =>
  Boolean(i.thumb) && (i.status === "ready" || i.status === "error") && (!duplicate || Boolean(i.keepDuplicate));

/** How many photos upload at the same time. */
const PARALLEL = 2;

type Result = { status: number; body: { error?: string } };

/** Like fetch, but reports upload progress. */
function post(form: FormData, onProgress: (fraction: number) => void): Promise<Result> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/photos");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let body = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // not JSON
      }
      resolve({ status: xhr.status, body });
    };
    xhr.onerror = () => resolve({ status: 0, body: { error: "Couldn't reach the site. Check your connection?" } });
    xhr.send(form);
  });
}

/** `existing`: when every photo already in our albums was taken, to catch duplicates. */
export function Uploader({ existing = [] }: { existing?: number[] }) {
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
      .map((file) => ({ key: crypto.randomUUID(), file, status: "reading", caption: "", progress: 0 }));
    setItems((list) => [...list.filter((i) => i.status !== "done"), ...fresh]);
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

  /** Uploads one photo. Returns false if the session ended (so the rest should wait). */
  async function uploadOne(item: Item): Promise<"ok" | "failed" | "signed-out"> {
    update(item.key, { status: "uploading", error: undefined, progress: 0.04 });
    try {
      const full = await resizeToJpeg(item.file, FULL_SIDE, 0.86);
      update(item.key, { progress: 0.1 });
      const form = new FormData();
      form.append("full", full.blob, "full.jpg");
      form.append("thumb", item.thumb!.blob, "thumb.jpg");
      form.append("takenAt", new Date(item.takenAt!).toISOString());
      form.append("caption", item.caption);
      form.append("width", String(full.width));
      form.append("height", String(full.height));

      const res = await post(form, (f) => update(item.key, { progress: 0.1 + f * 0.85 }));
      if (res.status === 401) {
        update(item.key, { status: "ready", progress: 0 });
        return "signed-out";
      }
      if (res.status < 200 || res.status >= 300) throw new Error(res.body.error ?? "Upload failed. Try again?");
      update(item.key, { status: "done", progress: 1 });
      return "ok";
    } catch (err) {
      update(item.key, { status: "error", error: (err as Error).message, progress: 0 });
      return "failed";
    }
  }

  async function upload(queue: Item[]) {
    setBusy(true);
    setSignedOut(false);
    let next = 0;
    let stop = false;
    let uploadedTo: number | null = null;

    const worker = async () => {
      while (!stop && next < queue.length) {
        const item = queue[next++];
        const result = await uploadOne(item);
        if (result === "signed-out") {
          stop = true;
          setSignedOut(true);
        }
        if (result === "ok") uploadedTo = albumFor(item.takenAt!);
      }
    };
    await Promise.all(Array.from({ length: PARALLEL }, worker));

    setBusy(false);
    if (uploadedTo !== null) {
      setLastAlbum(uploadedTo);
      router.refresh();
    }
  }

  // Photos we already have (or picked twice) are skipped unless chosen with "Add anyway".
  const settled = (i: Item) => i.status === "done" || i.status === "uploading";
  const flags = duplicateFlags(
    items.map((i) => (settled(i) ? undefined : i.takenAt)),
    existing,
  );
  const isDuplicate = (i: Item) => flags[items.indexOf(i)];
  const queue = items.filter((i) => canUpload(i, isDuplicate(i)));
  const skipped = items.filter((i) => isDuplicate(i) && !i.keepDuplicate && !settled(i)).length;
  const pending = queue.length;
  const reading = items.some((i) => i.status === "reading");
  const uploading = items.filter((i) => i.status === "uploading").length;
  const done = items.filter((i) => i.status === "done").length;
  const allDone = done > 0 && done + skipped === items.length;
  const overall = items.length ? items.reduce((sum, i) => sum + (i.status === "done" ? 1 : i.progress), 0) / items.length : 0;
  const showBar = pending > 0 || reading || busy || allDone || skipped > 0;

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
        className={`group flex cursor-pointer flex-col items-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-all duration-300 ${
          dragging ? "scale-[1.01] border-burgundy bg-wheat/60" : "border-tan bg-paper/70 hover:border-burgundy hover:bg-paper"
        }`}
      >
        <span
          className={`grid size-14 place-items-center rounded-full bg-wheat text-burgundy transition-transform duration-300 group-hover:scale-110 ${
            dragging ? "beat" : ""
          }`}
        >
          <ImagePlus aria-hidden="true" className="size-6" />
        </span>
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

      {signedOut && (
        <p role="alert" className="enter mt-6 rounded-2xl border border-rose/40 bg-paper p-4 text-sm text-rose">
          You were signed out, so nothing else was added.{" "}
          <Link href="/login?next=/memories/upload" className="font-medium underline underline-offset-4">
            Sign in again
          </Link>{" "}
          and your photos will still be here to add.
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-6 space-y-3">
          {items.map((item, i) => (
            <UploadRow
              key={item.key}
              item={item}
              index={i}
              duplicate={isDuplicate(item)}
              disabled={busy || item.status === "done" || item.status === "uploading"}
              onChange={(patch) => update(item.key, patch)}
              onRemove={() => setItems((list) => list.filter((x) => x.key !== item.key))}
              onRetry={busy ? undefined : () => upload([item])}
            />
          ))}
        </ul>
      )}

      {/* Room for the toolbar, so it never covers the last photo. */}
      {showBar && <div className="h-28" aria-hidden="true" />}

      {showBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="bar-in relative mx-auto flex max-w-3xl items-center justify-between gap-3 overflow-hidden rounded-3xl border border-wheat-deep bg-paper/95 p-3 pl-5 shadow-2xl backdrop-blur">
            {busy && (
              <span
                className="absolute inset-x-0 bottom-0 h-1 origin-left bg-burgundy transition-transform duration-300"
                style={{ transform: `scaleX(${overall})` }}
              />
            )}
            {allDone && lastAlbum !== null ? (
              <>
                <p className="flex min-w-0 items-center gap-2 whitespace-nowrap text-sm font-medium text-cocoa">
                  <span className="pop-in grid size-6 place-items-center rounded-full bg-burgundy text-cream">
                    <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
                  </span>
                  {done === 1 ? "Added" : `All ${done} added`}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="sm" icon={Plus} onClick={() => setItems([])}>
                    Add more
                  </Button>
                  <ButtonLink href={`/memories/${lastAlbum}`} icon={Images}>
                    See the album
                  </ButtonLink>
                </div>
              </>
            ) : (
              <>
                <p className="min-w-0 text-sm text-brown">
                  {reading
                    ? "Getting photos ready…"
                    : busy
                      ? `Uploading ${done + uploading} of ${done + uploading + pending}…`
                      : pending === 0 && skipped > 0
                        ? `${skipped === 1 ? "That photo is" : "Those photos are"} already in our albums`
                        : `${pending} photo${pending === 1 ? "" : "s"} ready${skipped ? ` · ${skipped} already added` : ""}`}
                </p>
                <Button icon={Upload} onClick={() => upload(queue)} disabled={busy || reading || pending === 0}>
                  {busy ? "Uploading…" : pending ? `Add ${pending} photo${pending === 1 ? "" : "s"}` : "Add photos"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function UploadRow({
  item,
  index,
  duplicate,
  disabled,
  onChange,
  onRemove,
  onRetry,
}: {
  item: Item;
  index: number;
  duplicate: boolean;
  disabled: boolean;
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
  onRetry?: () => void;
}) {
  const skipped = duplicate && !item.keepDuplicate;
  return (
    <li
      className={`slide-in relative overflow-hidden rounded-2xl border bg-paper/80 p-3 transition-colors sm:p-4 ${
        item.status === "done" ? "border-burgundy/30" : item.status === "error" ? "border-rose/40" : "border-wheat-deep/70"
      } ${skipped ? "opacity-70" : ""}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-wheat sm:size-28">
          {item.preview ? (
            <img src={item.preview} alt="" className="fade-in size-full object-cover" />
          ) : (
            <div className="shimmer size-full" />
          )}
          {item.status === "uploading" && (
            <div className="absolute inset-0 grid place-items-center bg-cream/55">
              <Heart className="beat size-6 text-burgundy" />
            </div>
          )}
          {item.status === "done" && (
            <div className="fade-in absolute inset-0 grid place-items-center bg-burgundy/55">
              <span className="pop-in grid size-9 place-items-center rounded-full bg-cream text-burgundy">
                <Check aria-hidden="true" className="size-5" strokeWidth={3} />
              </span>
            </div>
          )}
        </div>

        {/* min-w-0 lets long file names shorten with "…" instead of pushing things around */}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-cocoa">
                {item.takenAt !== undefined ? formatDate(item.takenAt, "long") : "Reading photo…"}
              </p>
              <p className="truncate text-xs text-brown/80" title={item.file.name}>
                {item.file.name}
              </p>
            </div>
            {!disabled && (
              <IconButton icon={X} label={`Remove ${item.file.name}`} size="sm" onClick={onRemove} className="-mr-1.5 -mt-1.5" />
            )}
          </div>

          {duplicate && item.status !== "done" && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-wheat/70 px-3 py-2 text-xs text-cocoa">
              <CopyCheck aria-hidden="true" className="size-4 shrink-0 text-burgundy" />
              <span className="min-w-0 flex-1">
                {item.keepDuplicate ? "Looks like one we already have, but it'll be added." : "Looks like one we already have, so it'll be skipped."}
              </span>
              <button
                type="button"
                onClick={() => onChange({ keepDuplicate: !item.keepDuplicate })}
                className="press shrink-0 rounded-full bg-paper px-2.5 py-1 font-medium text-burgundy shadow-sm"
              >
                {item.keepDuplicate ? "Skip it" : "Add anyway"}
              </button>
            </div>
          )}

          {item.takenAt !== undefined && !skipped && (
            <div className="mt-2 space-y-2">
              <DateTimeField
                label="Taken on"
                hideLabel
                value={item.takenAt}
                disabled={disabled}
                onChange={(ms) => onChange({ takenAt: ms })}
                hint={(ms) => (
                  <>
                    Goes in the <span className="font-medium text-burgundy">{monthsaryTitle(albumFor(ms))}</span> album
                  </>
                )}
              />
              <p className="truncate px-0.5 text-xs text-brown">
                Goes in the <span className="font-medium text-burgundy">{monthsaryTitle(albumFor(item.takenAt))}</span> album
              </p>
              <TextField
                label="Caption"
                hideLabel
                icon={PenLine}
                value={item.caption}
                maxLength={LIMITS.maxCaption}
                disabled={disabled}
                onChange={(e) => onChange({ caption: e.target.value })}
                placeholder="Caption (optional)"
              />
            </div>
          )}

          {item.error && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p role="alert" className="flex min-w-0 flex-1 items-start gap-1.5 text-sm text-rose">
                <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {item.error}
              </p>
              {item.thumb && onRetry && (
                <Button size="sm" icon={RotateCcw} onClick={onRetry}>
                  Try again
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {item.status === "uploading" && (
        <span className="absolute inset-x-0 bottom-0 h-1 bg-wheat">
          <span
            className="block h-full origin-left bg-burgundy transition-transform duration-300"
            style={{ transform: `scaleX(${item.progress})` }}
          />
        </span>
      )}
    </li>
  );
}
