import "server-only";
import { describeKey, keyProblem } from "./key";
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

/** Supabase is set up, but with a key that can't save photos: say exactly how to fix it. */
function misconfigured(problem: string): PhotoStore {
  const fail = async (): Promise<never> => {
    throw new Error(problem);
  };
  return { kind: "supabase", list: fail, create: fail, update: fail, remove: fail, ping: fail };
}

let cached: PhotoStore | undefined;

/**
 * Supabase when its settings are present. Without the secret key, photos go
 * in a local folder while developing (handy for testing without touching the
 * real albums). On Vercel without settings, photos are simply turned off.
 */
export function getStore(): PhotoStore {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  const problem = key ? keyProblem(describeKey(key)) : null;
  if (url && key && problem) cached = misconfigured(problem);
  else if (url && key) cached = supabaseStore(url, key);
  else if (process.env.VERCEL) cached = unconfigured;
  else cached = localStore();
  return cached;
}
