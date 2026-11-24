import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Pages only the owners use. Visitors who wander in are sent home. */
const OWNER_PAGES = ["/memories/upload", "/monthsary"];

const hasSession = (request: NextRequest) =>
  request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

/**
 * Runs before each page: keeps a signed-in owner's session fresh, and sends
 * anyone without a session away from the owner-only pages. Visitors (no
 * session cookie) pass straight through with no extra work.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ownerPage = OWNER_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!hasSession(request)) {
    if (!ownerPage) return NextResponse.next();
    return NextResponse.redirect(new URL("/", request.url));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  // Refreshes the session if it's about to expire, writing new cookies above.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|api/files|api/keepalive).*)"],
};
