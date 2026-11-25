import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { getOwner } from "./auth";
import type { Note } from "./notes";
import type { Photo } from "./photos";
import { getStore, type PhotoStore } from "./store";
import { NotesNotSetUpError, getNoteStore } from "./store/notes";

export type Loaded = {
  photos: Photo[];
  kind: PhotoStore["kind"];
  /** The request time, so pages agree on what "now" is. */
  now: number;
  error?: string;
};

/** Every photo, newest first. Always fresh, so new uploads show up right away. */
export const loadPhotos = cache(async (): Promise<Loaded> => {
  await connection();
  const store = getStore();
  const now = Date.now();
  try {
    return { photos: await store.list(), kind: store.kind, now };
  } catch (err) {
    console.error(err);
    return { photos: [], kind: store.kind, now, error: (err as Error).message };
  }
});

export type LoadedNotes = {
  notes: Note[];
  /** Whoever is looking can write notes. */
  canWrite: boolean;
  kind: PhotoStore["kind"];
  /** The notes table still needs creating in Supabase. */
  needsSetup?: boolean;
  error?: string;
};

/** Love notes: everything for us, only the public ones for visitors. */
export const loadNotes = cache(async (): Promise<LoadedNotes> => {
  await connection();
  const owner = await getOwner();
  const store = getNoteStore();
  try {
    return { notes: await store.list({ includePrivate: owner !== null }), canWrite: owner !== null, kind: store.kind };
  } catch (err) {
    if (err instanceof NotesNotSetUpError) return { notes: [], canWrite: owner !== null, kind: store.kind, needsSetup: true };
    console.error(err);
    return { notes: [], canWrite: owner !== null, kind: store.kind, error: (err as Error).message };
  }
});
