import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import type { Photo } from "./photos";
import { getStore, type PhotoStore } from "./store";

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
