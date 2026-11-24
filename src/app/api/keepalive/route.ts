import { connection } from "next/server";
import { getStore } from "@/lib/store";

/**
 * Called once a day by Vercel Cron (see vercel.json). Free Supabase projects
 * pause after a week without activity; this keeps ours awake.
 */
export async function GET() {
  await connection();
  try {
    await getStore().ping();
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
