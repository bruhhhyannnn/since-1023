"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        router.push("/");
        router.refresh();
      }}
      className="press inline-flex items-center gap-1 rounded-full underline-offset-4 hover:text-burgundy hover:underline disabled:opacity-50"
    >
      <LogOut aria-hidden="true" className="size-3.5" />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
