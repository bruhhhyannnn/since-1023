import type { Photo, PhotoPatch } from "@/lib/photos";

export type NewPhoto = {
  full: Blob;
  thumb: Blob;
  takenAt: string;
  caption: string | null;
  width: number;
  height: number;
};

export interface PhotoStore {
  /**
   * "supabase" in production, "local" while developing (files in .data/),
   * "none" when deployed without Supabase settings yet.
   */
  kind: "supabase" | "local" | "none";
  list(): Promise<Photo[]>;
  create(input: NewPhoto): Promise<Photo>;
  update(id: string, patch: PhotoPatch): Promise<Photo | null>;
  remove(id: string): Promise<boolean>;
  /** A cheap call that keeps a free Supabase project from pausing. */
  ping(): Promise<void>;
}

export class StoreNotConfiguredError extends Error {
  constructor() {
    super(
      "Photo storage isn't connected yet. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (see the README).",
    );
  }
}
