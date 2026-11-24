import { supabaseForRequest } from "@/lib/auth";

export async function POST() {
  const supabase = await supabaseForRequest();
  await supabase?.auth.signOut();
  return Response.json({ ok: true });
}
