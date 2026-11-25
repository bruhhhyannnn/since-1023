"use client";

import { Eye, EyeOff, LogIn, Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, IconButton, TextField } from "./ui";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
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
      <TextField
        label="Email"
        icon={Mail}
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Password"
        icon={Lock}
        type={show ? "text" : "password"}
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        trailing={
          <IconButton
            icon={show ? EyeOff : Eye}
            label={show ? "Hide password" : "Show password"}
            size="sm"
            className="mr-1"
            onClick={() => setShow((s) => !s)}
          />
        }
      />
      {error && (
        <p role="alert" className="enter text-sm text-rose">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy} icon={LogIn} size="lg" className="w-full">
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
