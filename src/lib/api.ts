import "server-only";
import { StoreNotConfiguredError } from "./store";
import { NotesNotSetUpError } from "./store/notes";

/** Turns a storage error into a JSON response with a sensible status. */
export function failure(err: unknown) {
  const setup = err instanceof StoreNotConfiguredError || err instanceof NotesNotSetUpError;
  return Response.json({ error: (err as Error).message }, { status: setup ? 503 : 500 });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (id: unknown): id is string => typeof id === "string" && UUID.test(id);
