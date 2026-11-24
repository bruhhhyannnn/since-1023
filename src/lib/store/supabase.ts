import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Photo, PhotoPatch } from "@/lib/photos";
import { describeKey, explainRls } from "./key";
import type { NewPhoto, PhotoStore } from "./types";

const BUCKET = "photos";
const TABLE = "photos";

type Row = {
  id: string;
  taken_at: string;
  caption: string | null;
  favorite: boolean;
  path: string;
  thumb_path: string;
  width: number;
  height: number;
  created_at: string;
};

export function supabaseStore(url: string, secretKey: string): PhotoStore {
  const keyKind = describeKey(secretKey);
  const fail = (what: string, message: string) => new Error(`${what}: ${explainRls(message, keyKind)}`);
  const db = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const bucket = () => db.storage.from(BUCKET);
  const publicUrl = (path: string) => bucket().getPublicUrl(path).data.publicUrl;

  const toPhoto = (r: Row): Photo => ({
    id: r.id,
    takenAt: new Date(r.taken_at).toISOString(),
    caption: r.caption,
    favorite: r.favorite,
    url: publicUrl(r.path),
    thumbUrl: publicUrl(r.thumb_path),
    width: r.width,
    height: r.height,
    createdAt: new Date(r.created_at).toISOString(),
  });

  return {
    kind: "supabase",

    async list() {
      const { data, error } = await db
        .from(TABLE)
        .select("*")
        .order("taken_at", { ascending: false });
      if (error) throw fail("Could not load photos", error.message);
      return (data as Row[]).map(toPhoto);
    },

    async create(input: NewPhoto) {
      const id = crypto.randomUUID();
      const path = `full/${id}.jpg`;
      const thumbPath = `thumb/${id}.jpg`;
      const options = { contentType: "image/jpeg", cacheControl: "31536000", upsert: false };

      const full = await bucket().upload(path, input.full, options);
      if (full.error) throw fail("Upload failed", full.error.message);
      const thumb = await bucket().upload(thumbPath, input.thumb, options);
      if (thumb.error) {
        await bucket().remove([path]);
        throw fail("Upload failed", thumb.error.message);
      }

      const { data, error } = await db
        .from(TABLE)
        .insert({
          id,
          taken_at: input.takenAt,
          caption: input.caption,
          path,
          thumb_path: thumbPath,
          width: input.width,
          height: input.height,
        })
        .select()
        .single();
      if (error) {
        await bucket().remove([path, thumbPath]);
        throw fail("Could not save photo", error.message);
      }
      return toPhoto(data as Row);
    },

    async update(id: string, patch: PhotoPatch) {
      const changes: Partial<Row> = {};
      if (patch.favorite !== undefined) changes.favorite = patch.favorite;
      if (patch.caption !== undefined) changes.caption = patch.caption;
      if (patch.takenAt !== undefined) changes.taken_at = patch.takenAt;
      const { data, error } = await db
        .from(TABLE)
        .update(changes)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw fail("Could not update photo", error.message);
      return data ? toPhoto(data as Row) : null;
    },

    async remove(id: string) {
      const { data, error } = await db.from(TABLE).delete().eq("id", id).select().maybeSingle();
      if (error) throw fail("Could not delete photo", error.message);
      if (!data) return false;
      const row = data as Row;
      await bucket().remove([row.path, row.thumb_path]);
      return true;
    },

    async ping() {
      const { error } = await db.from(TABLE).select("id").limit(1);
      if (error) throw new Error(error.message);
    },
  };
}
