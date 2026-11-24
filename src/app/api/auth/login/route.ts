import { authSettings, isOwnerEmail, supabaseForRequest } from "@/lib/auth";

export async function POST(request: Request) {
  if (!authSettings()) {
    return Response.json(
      { error: "Sign-in isn't set up yet. Add the Supabase settings (see the README)." },
      { status: 503 },
    );
  }

  let email = "";
  let password = "";
  try {
    const body = await request.json();
    email = String(body.email ?? "").trim();
    password = String(body.password ?? "");
  } catch {
    // handled below
  }
  if (!email || !password) {
    return Response.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const supabase = (await supabaseForRequest())!;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return Response.json({ error: "That email or password isn't right." }, { status: 401 });
  }
  if (!isOwnerEmail(data.user.email)) {
    await supabase.auth.signOut();
    return Response.json(
      { error: "This account isn't allowed to edit the site. Add its email to OWNER_EMAILS." },
      { status: 403 },
    );
  }
  return Response.json({ ok: true });
}
