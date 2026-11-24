import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

const digest = (s: string) => createHash("sha256").update(s).digest();

/**
 * Anyone can look at the site, but only the two of us can add, change or
 * delete photos. Returns an error response, or null when the passcode is right.
 */
export function requirePasscode(request: Request): Response | null {
  const expected = process.env.UPLOAD_PASSCODE;
  if (!expected) {
    return Response.json(
      { error: "Uploading is off until UPLOAD_PASSCODE is set (see the README)." },
      { status: 503 },
    );
  }
  const given = request.headers.get("x-passcode") ?? "";
  if (!timingSafeEqual(digest(given), digest(expected))) {
    return Response.json({ error: "That passcode isn't right." }, { status: 401 });
  }
  return null;
}
