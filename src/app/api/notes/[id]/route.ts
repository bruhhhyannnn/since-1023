import { requireOwner } from "@/lib/auth";
import { failure, isUuid as isId } from "@/lib/api";
import { getNoteStore } from "@/lib/store/notes";

/** Heart (or un-heart) a note. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/notes/[id]">) {
  const denied = await requireOwner(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!isId(id)) return Response.json({ error: "Note not found." }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.loved !== "boolean") return Response.json({ error: "Nothing to change." }, { status: 400 });
  try {
    const note = await getNoteStore().setLoved(id, body.loved);
    if (!note) return Response.json({ error: "Note not found." }, { status: 404 });
    return Response.json({ note });
  } catch (err) {
    return failure(err);
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/notes/[id]">) {
  const denied = await requireOwner(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!isId(id)) return Response.json({ error: "Note not found." }, { status: 404 });
  try {
    const removed = await getNoteStore().remove(id);
    if (!removed) return Response.json({ error: "Note not found." }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (err) {
    return failure(err);
  }
}
