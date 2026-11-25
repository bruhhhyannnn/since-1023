import { getOwner, requireOwner } from "@/lib/auth";
import { parseNewNote } from "@/lib/notes";
import { failure } from "@/lib/api";
import { getNoteStore } from "@/lib/store/notes";

/** Leave a note. */
export async function POST(request: Request) {
  const denied = await requireOwner(request);
  if (denied) return denied;
  const parsed = parseNewNote(await request.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
  try {
    const owner = await getOwner();
    const note = await getNoteStore().create(parsed.note, owner?.email ?? "");
    return Response.json({ note }, { status: 201 });
  } catch (err) {
    return failure(err);
  }
}
