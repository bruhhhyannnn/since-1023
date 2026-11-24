import { requirePasscode } from "@/lib/passcode";

/** Lets the passcode prompt check a passcode before saving it on the device. */
export async function POST(request: Request) {
  return requirePasscode(request) ?? Response.json({ ok: true });
}
