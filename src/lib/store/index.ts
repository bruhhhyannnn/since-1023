import "server-only";
import { localStore } from "./local";
import { supabaseStore } from "./supabase";
import { StoreNotConfiguredError, type PhotoStore } from "./types";

export { StoreNotConfiguredError } from "./types";
export type { PhotoStore } from "./types";

const unconfigured: PhotoStore = {
  kind: "none",
  list: async () => [],
  create: async () => {
    throw new StoreNotConfiguredError();
  },
  update: async () => {
    throw new StoreNotConfiguredError();
  },
  remove: async () => {
    throw new StoreNotConfiguredError();
  },
  ping: async () => {},
};

let cached: PhotoStore | undefined;

/**
 * Supabase when its settings are present. Without the secret key, photos go
 * in a local folder while developing (handy for testing without touching the
 * real albums). On Vercel without settings, photos are simply turned off.
 */
export function getStore(): PhotoStore {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (url && key) cached = supabaseStore(url, key);
  else if (process.env.VERCEL) cached = unconfigured;
  else cached = localStore();
  return cached;
}
