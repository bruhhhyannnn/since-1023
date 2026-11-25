"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * A small preference remembered on this device (like who usually writes
 * from this phone). Falls back to memory when storage is blocked.
 */

const listeners = new Set<() => void>();
const memory = new Map<string, string>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

export function useStoredChoice<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      const v = read(key);
      return allowed.includes(v as T) ? (v as T) : fallback;
    },
    () => fallback,
  );
  const set = useCallback(
    (v: T) => {
      memory.set(key, v);
      try {
        localStorage.setItem(key, v);
      } catch {
        // Private browsing: remembered until the page closes.
      }
      listeners.forEach((l) => l());
    },
    [key],
  );
  return [value, set] as const;
}
