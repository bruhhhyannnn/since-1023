import { LIMITS, type PhotoPatch } from "@/lib/photos";
import { requirePasscode } from "@/lib/passcode";
import { StoreNotConfiguredError, getStore } from "@/lib/store";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function failure(err: unknown) {
  const status = err instanceof StoreNotConfiguredError ? 503 : 500;
  return Response.json({ error: (err as Error).message }, { status });
}

/** Heart a photo, fix its date, or change its caption. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/photos/[id]">) {
  const denied = requirePasscode(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return Response.json({ error: "Photo not found." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Nothing to change." }, { status: 400 });
  }

  const patch: PhotoPatch = {};
  if (typeof body.favorite === "boolean") patch.favorite = body.favorite;
  if (body.caption === null || typeof body.caption === "string") {
    patch.caption = (body.caption ?? "").trim().slice(0, LIMITS.maxCaption) || null;
  }
  if (typeof body.takenAt === "string") {
    if (Number.isNaN(Date.parse(body.takenAt))) {
      return Response.json({ error: "That date doesn't look right." }, { status: 400 });
    }
    patch.takenAt = new Date(body.takenAt).toISOString();
  }
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Nothing to change." }, { status: 400 });
  }

  try {
    const photo = await getStore().update(id, patch);
    if (!photo) return Response.json({ error: "Photo not found." }, { status: 404 });
    return Response.json({ photo });
  } catch (err) {
    return failure(err);
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/photos/[id]">) {
  const denied = requirePasscode(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return Response.json({ error: "Photo not found." }, { status: 404 });

  try {
    const removed = await getStore().remove(id);
    if (!removed) return Response.json({ error: "Photo not found." }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (err) {
    return failure(err);
  }
}
