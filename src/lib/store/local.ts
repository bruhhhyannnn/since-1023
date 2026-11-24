import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Photo, PhotoPatch } from "@/lib/photos";
import type { NewPhoto, PhotoStore } from "./types";

/**
 * Development-only store: keeps photos in ./.data so the whole site works
 * on your computer without a Supabase project. Never used on Vercel.
 */
export const LOCAL_ROOT = path.join(process.cwd(), ".data");
const INDEX = path.join(LOCAL_ROOT, "photos.json");

type Entry = Omit<Photo, "url" | "thumbUrl">;

const fileUrl = (kind: "full" | "thumb", id: string) => `/api/files/${kind}/${id}.jpg`;

const toPhoto = (e: Entry): Photo => ({
  ...e,
  url: fileUrl("full", e.id),
  thumbUrl: fileUrl("thumb", e.id),
});

async function readIndex(): Promise<Entry[]> {
  try {
    return JSON.parse(await readFile(INDEX, "utf8")) as Entry[];
  } catch {
    return [];
  }
}

// Serialize writes so two uploads at once don't clobber the index.
let queue: Promise<unknown> = Promise.resolve();
function withIndex<T>(fn: (entries: Entry[]) => Promise<{ entries: Entry[]; result: T }>): Promise<T> {
  const run = queue.then(async () => {
    const { entries, result } = await fn(await readIndex());
    await mkdir(LOCAL_ROOT, { recursive: true });
    await writeFile(INDEX, JSON.stringify(entries, null, 2));
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export function localStore(): PhotoStore {
  return {
    kind: "local",

    async list() {
      const entries = await readIndex();
      return entries
        .sort((a, b) => b.takenAt.localeCompare(a.takenAt))
        .map(toPhoto);
    },

    async create(input: NewPhoto) {
      const id = crypto.randomUUID();
      for (const [kind, blob] of [["full", input.full], ["thumb", input.thumb]] as const) {
        const dir = path.join(LOCAL_ROOT, kind);
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, `${id}.jpg`), Buffer.from(await blob.arrayBuffer()));
      }
      const entry: Entry = {
        id,
        takenAt: input.takenAt,
        caption: input.caption,
        favorite: false,
        width: input.width,
        height: input.height,
        createdAt: new Date().toISOString(),
      };
      return withIndex(async (entries) => ({ entries: [...entries, entry], result: toPhoto(entry) }));
    },

    async update(id: string, patch: PhotoPatch) {
      return withIndex(async (entries) => {
        const i = entries.findIndex((e) => e.id === id);
        if (i < 0) return { entries, result: null };
        const next = { ...entries[i] };
        if (patch.favorite !== undefined) next.favorite = patch.favorite;
        if (patch.caption !== undefined) next.caption = patch.caption;
        if (patch.takenAt !== undefined) next.takenAt = patch.takenAt;
        entries[i] = next;
        return { entries, result: toPhoto(next) };
      });
    },

    async remove(id: string) {
      const removed = await withIndex(async (entries) => {
        const rest = entries.filter((e) => e.id !== id);
        return { entries: rest, result: rest.length !== entries.length };
      });
      if (removed) {
        await rm(path.join(LOCAL_ROOT, "full", `${id}.jpg`), { force: true });
        await rm(path.join(LOCAL_ROOT, "thumb", `${id}.jpg`), { force: true });
      }
      return removed;
    },

    async ping() {},
  };
}
