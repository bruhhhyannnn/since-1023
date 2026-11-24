import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

/*
 * Visitors can look at everything. Only the owners (emails in OWNER_EMAILS,
 * with an account in Supabase Auth) can add, change or delete photos.
 */

export type Owner = { email: string };

export function authSettings(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const owners = (process.env.OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return owners.includes(email.toLowerCase());
}

/** Supabase keeps the session in cookies named like `sb-<project>-auth-token`. */
export function hasSessionCookie(names: string[]): boolean {
  return names.some((n) => n.startsWith("sb-") && n.includes("-auth-token"));
}

/** A Supabase client tied to this request's cookies. */
export async function supabaseForRequest() {
  const settings = authSettings();
  if (!settings) return null;
  const store = await cookies();
  return createServerClient(settings.url, settings.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server Components can't set cookies; the proxy refreshes sessions instead.
        }
      },
    },
  });
}

/** The signed-in owner, or null for everyone else. Checked once per request. */
export const getOwner = cache(async (): Promise<Owner | null> => {
  const store = await cookies();
  if (!hasSessionCookie(store.getAll().map((c) => c.name))) return null;
  const supabase = await supabaseForRequest();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  if (error || !isOwnerEmail(email)) return null;
  return { email: email!.toLowerCase() };
});

/**
 * For API routes that change things: returns an error response, or null when
 * the request comes from a signed-in owner on this site.
 */
export async function requireOwner(request: Request): Promise<Response | null> {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return Response.json({ error: "Not allowed." }, { status: 403 });
  }
  if (!(await getOwner())) {
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  }
  return null;
}
