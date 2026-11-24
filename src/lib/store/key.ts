/**
 * What kind of Supabase key is in SUPABASE_SECRET_KEY. Only the type is ever
 * reported, never the key itself.
 */
export type KeyKind = "secret" | "service_role" | "publishable" | "anon" | "unknown";

export function describeKey(key: string): KeyKind {
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.startsWith("sb_publishable_")) return "publishable";
  const parts = key.split(".");
  if (parts.length === 3) {
    try {
      const role = JSON.parse(Buffer.from(parts[1], "base64url").toString()).role;
      if (role === "service_role") return "service_role";
      if (role === "anon") return "anon";
    } catch {
      // not a JWT
    }
  }
  return "unknown";
}

const WHERE = "Supabase → Project Settings → API Keys → Secret keys";

/** A plain-language fix when the key can't save photos, or null when it looks right. */
export function keyProblem(kind: KeyKind): string | null {
  switch (kind) {
    case "publishable":
      return `SUPABASE_SECRET_KEY is set to the publishable (public) key, which can't save photos. Copy the secret key (starts with sb_secret_) from ${WHERE}, paste it into Vercel, and redeploy.`;
    case "anon":
      return `SUPABASE_SECRET_KEY is set to the legacy "anon" (public) key, which can't save photos. Copy the secret key (starts with sb_secret_) from ${WHERE}, or the legacy "service_role" key, paste it into Vercel, and redeploy.`;
    case "unknown":
      return `SUPABASE_SECRET_KEY doesn't look like a Supabase secret key. Copy it again from ${WHERE} (it starts with sb_secret_), with no quotes or spaces, paste it into Vercel, and redeploy.`;
    default:
      return null;
  }
}

/** Turns Supabase's "row-level security" refusal into something actionable. */
export function explainRls(message: string, kind: KeyKind): string {
  if (!/row-level security/i.test(message)) return message;
  return (
    keyProblem(kind) ??
    `Supabase refused to save the photo even though SUPABASE_SECRET_KEY looks like a secret key. Try the legacy "service_role" key instead (Supabase → Project Settings → API Keys → Legacy API keys), paste it into Vercel as SUPABASE_SECRET_KEY, and redeploy.`
  );
}
