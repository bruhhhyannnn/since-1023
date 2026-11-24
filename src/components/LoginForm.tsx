"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { buttonStyles } from "./ui";

const field =
  "mt-1 w-full rounded-xl border border-wheat-deep bg-cream px-4 py-3 text-cocoa outline-none placeholder:text-tan focus:border-burgundy";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requested = params.get("next") ?? "";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/memories";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.replace(next);
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong. Try again?");
    } catch {
      setError("Couldn't reach the site. Check your connection?");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4 text-left">
      <label className="block text-sm text-brown">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
        />
      </label>
      <label className="block text-sm text-brown">
        Password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-rose">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={`${buttonStyles.primary} w-full py-3`}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
