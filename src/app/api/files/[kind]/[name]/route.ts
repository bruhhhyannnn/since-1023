import { readFile } from "node:fs/promises";
import path from "node:path";
import { getStore } from "@/lib/store";
import { LOCAL_ROOT } from "@/lib/store/local";

const NAME = /^[0-9a-f-]{36}\.jpg$/i;

/** Serves photos from ./.data while developing locally. Unused with Supabase. */
export async function GET(_request: Request, ctx: RouteContext<"/api/files/[kind]/[name]">) {
  const { kind, name } = await ctx.params;
  if (getStore().kind !== "local" || (kind !== "full" && kind !== "thumb") || !NAME.test(name)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const file = await readFile(path.join(LOCAL_ROOT, kind, name));
    return new Response(new Uint8Array(file), {
      headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
