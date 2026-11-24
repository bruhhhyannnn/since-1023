"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Heart } from "./Heart";

const KEY = "since1023:passcode";

const readStored = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const writeStored = (value: string | null) => {
  try {
    if (value) localStorage.setItem(KEY, value);
    else localStorage.removeItem(KEY);
  } catch {
    // Private browsing: we just ask again next time.
  }
};

type Request = (url: string, init?: RequestInit) => Promise<Response | null>;

const PasscodeContext = createContext<Request | null>(null);

/**
 * Viewing is open to everyone. Adding, changing or deleting photos asks for
 * our passcode once, then remembers it on this device.
 */
export function useAuthedFetch(): Request {
  const ctx = useContext(PasscodeContext);
  if (!ctx) throw new Error("useAuthedFetch must be used inside <PasscodeProvider>");
  return ctx;
}

export function PasscodeProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState<{ error?: string } | null>(null);
  const resolver = useRef<((value: string | null) => void) | null>(null);
  const pending = useRef<Promise<string | null> | null>(null);
  const known = useRef<string | null>(null);

  const ask = useCallback((error?: string) => {
    pending.current ??= new Promise<string | null>((resolve) => {
      resolver.current = resolve;
      setPrompt({ error });
    }).finally(() => {
      pending.current = null;
      setPrompt(null);
    });
    return pending.current;
  }, []);

  const request = useCallback<Request>(
    async (url, init = {}) => {
      let pass = known.current ?? readStored();
      if (!pass) pass = await ask();
      if (!pass) return null;

      const send = (p: string) =>
        fetch(url, { ...init, headers: { ...(init.headers as Record<string, string>), "x-passcode": p } });

      let res = await send(pass);
      if (res.status === 401) {
        known.current = null;
        writeStored(null);
        pass = await ask("That passcode isn't right. Try again?");
        if (!pass) return null;
        res = await send(pass);
      }
      if (res.ok) {
        known.current = pass;
        writeStored(pass);
      }
      return res;
    },
    [ask],
  );

  return (
    <PasscodeContext.Provider value={request}>
      {children}
      {prompt && (
        <PasscodeDialog
          error={prompt.error}
          onDone={(value) => {
            resolver.current?.(value);
            resolver.current = null;
          }}
        />
      )}
    </PasscodeContext.Provider>
  );
}

function PasscodeDialog({ error, onDone }: { error?: string; onDone: (value: string | null) => void }) {
  const [value, setValue] = useState("");
  const [message, setMessage] = useState(error);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value) return;
    setBusy(true);
    setMessage(undefined);
    try {
      const res = await fetch("/api/passcode", { method: "POST", headers: { "x-passcode": value } });
      if (res.ok) return onDone(value);
      const body = await res.json().catch(() => ({}));
      setMessage(body.error ?? "Something went wrong. Try again?");
    } catch {
      setMessage("Couldn't reach the site. Check your connection?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-cocoa/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={() => onDone(null)}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="passcode-title"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onDone(null)}
        className="w-full max-w-sm rounded-3xl border border-wheat-deep bg-paper p-6 shadow-xl"
      >
        <Heart className="size-6 text-burgundy" />
        <h2 id="passcode-title" className="mt-3 font-display text-2xl font-semibold text-cocoa">
          Just the two of us
        </h2>
        <p className="mt-1 text-sm text-brown">
          Enter our passcode to add or change photos. This device will remember it.
        </p>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Passcode"
          placeholder="Passcode"
          className="mt-4 w-full rounded-xl border border-wheat-deep bg-cream px-4 py-3 text-cocoa outline-none placeholder:text-tan focus:border-burgundy"
        />
        {message && (
          <p role="alert" className="mt-2 text-sm text-rose">
            {message}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onDone(null)}
            className="rounded-full px-4 py-2 text-sm text-brown hover:text-cocoa"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !value}
            className="rounded-full bg-burgundy px-5 py-2 text-sm font-medium text-cream transition-colors hover:bg-burgundy-dark disabled:opacity-50"
          >
            {busy ? "Checking…" : "Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
