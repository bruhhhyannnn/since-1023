import "server-only";
import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NewNote, Note } from "@/lib/notes";
import { describeKey, keyProblem } from "./key";
import { LOCAL_ROOT } from "./local";
import { StoreNotConfiguredError } from "./types";

export interface NoteStore {
  kind: "supabase" | "local" | "none";
  /** Newest first. Private notes only when `includePrivate`. */
  list(options: { includePrivate: boolean }): Promise<Note[]>;
  create(note: NewNote, authorEmail: string): Promise<Note>;
  setLoved(id: string, loved: boolean): Promise<Note | null>;
  remove(id: string): Promise<boolean>;
}

/** The notes table hasn't been created in Supabase yet (see supabase/love-notes.sql). */
export class NotesNotSetUpError extends Error {
  constructor() {
    super("Love notes need one quick setup step: run supabase/love-notes.sql in the Supabase SQL Editor.");
  }
}

type Row = {
  id: string;
  author: Note["author"];
  body: string;
  color: Note["color"];
  is_private: boolean;
  loved: boolean;
  created_at: string;
};

const toNote = (r: Row): Note => ({
  id: r.id,
  author: r.author,
  body: r.body,
  color: r.color,
  isPrivate: r.is_private,
  loved: r.loved,
  createdAt: new Date(r.created_at).toISOString(),
});

function supabaseNotes(url: string, key: string): NoteStore {
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const table = () => db.from("notes");
  const fail = (error: { code?: string; message: string }): never => {
    // PGRST205 / 42P01: the table doesn't exist yet.
    if (error.code === "PGRST205" || error.code === "42P01") throw new NotesNotSetUpError();
    throw new Error(error.message);
  };
  return {
    kind: "supabase",
    async list({ includePrivate }) {
      let q = table().select("*").order("created_at", { ascending: false }).limit(500);
      if (!includePrivate) q = q.eq("is_private", false);
      const { data, error } = await q;
      if (error) fail(error);
      return (data as Row[]).map(toNote);
    },
    async create(note, authorEmail) {
      const { data, error } = await table()
        .insert({ author: note.author, body: note.body, color: note.color, is_private: note.isPrivate, author_email: authorEmail })
        .select()
        .single();
      if (error) fail(error);
      return toNote(data as Row);
    },
    async setLoved(id, loved) {
      const { data, error } = await table().update({ loved }).eq("id", id).select().maybeSingle();
      if (error) fail(error);
      return data ? toNote(data as Row) : null;
    },
    async remove(id) {
      const { data, error } = await table().delete().eq("id", id).select("id").maybeSingle();
      if (error) fail(error);
      return Boolean(data);
    },
  };
}

/** While developing: notes live in ./.data/notes.json. */
function localNotes(): NoteStore {
  const file = path.join(LOCAL_ROOT, "notes.json");
  const read = async (): Promise<Note[]> => {
    try {
      return JSON.parse(await readFile(file, "utf8")) as Note[];
    } catch {
      return [];
    }
  };
  let queue: Promise<unknown> = Promise.resolve();
  const write = <T,>(fn: (notes: Note[]) => { notes: Note[]; result: T }) => {
    const run = queue.then(async () => {
      const { notes, result } = fn(await read());
      await mkdir(LOCAL_ROOT, { recursive: true });
      await writeFile(file, JSON.stringify(notes, null, 2));
      return result;
    });
    queue = run.catch(() => undefined);
    return run;
  };
  return {
    kind: "local",
    async list({ includePrivate }) {
      const notes = (await read()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return includePrivate ? notes : notes.filter((n) => !n.isPrivate);
    },
    create(note) {
      const created: Note = { ...note, id: crypto.randomUUID(), loved: false, createdAt: new Date().toISOString() };
      return write((notes) => ({ notes: [...notes, created], result: created }));
    },
    setLoved(id, loved) {
      return write((notes) => {
        const n = notes.find((x) => x.id === id);
        if (n) n.loved = loved;
        return { notes, result: n ?? null };
      });
    },
    remove(id) {
      return write((notes) => {
        const rest = notes.filter((n) => n.id !== id);
        return { notes: rest, result: rest.length !== notes.length };
      });
    },
  };
}

const unconfigured: NoteStore = {
  kind: "none",
  list: async () => [],
  create: async () => {
    throw new StoreNotConfiguredError();
  },
  setLoved: async () => {
    throw new StoreNotConfiguredError();
  },
  remove: async () => {
    throw new StoreNotConfiguredError();
  },
};

let cached: NoteStore | undefined;

/** Same rules as the photo store: Supabase when set up, a local file while developing. */
export function getNoteStore(): NoteStore {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  const problem = key ? keyProblem(describeKey(key)) : null;
  if (url && key && !problem) cached = supabaseNotes(url, key);
  else if (url && key && problem) {
    const fail = async (): Promise<never> => {
      throw new Error(problem);
    };
    cached = { kind: "supabase", list: fail, create: fail, setLoved: fail, remove: fail };
  } else if (process.env.VERCEL) cached = unconfigured;
  else cached = localNotes();
  return cached;
}
