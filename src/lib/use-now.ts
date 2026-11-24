"use client";

import { useSyncExternalStore } from "react";

/*
 * One shared clock for every live number on the page, ticking right on the
 * second so all counters change together.
 */

const listeners = new Set<() => void>();
let now = typeof window === "undefined" ? 0 : Date.now();
let timer: ReturnType<typeof setTimeout> | undefined;

function tick() {
  now = Date.now();
  listeners.forEach((l) => l());
  timer = setTimeout(tick, 1000 - (now % 1000) + 5);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setTimeout(tick, 1000 - (now % 1000) + 5);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
}

/** The current time in ms, updated every second. Null while the page is being prerendered/hydrated. */
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => null,
  );
}
