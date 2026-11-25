import { CloudOff, TriangleAlert } from "lucide-react";
import type { Loaded } from "@/lib/data";

/** Explains why photos can't load, if they can't. */
export function StorageNotice({ loaded }: { loaded: Loaded }) {
  if (loaded.kind === "none") {
    return (
      <div className="flex gap-3 rounded-3xl border border-dashed border-tan bg-paper/70 p-5 text-sm text-brown">
        <CloudOff aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-tan" />
        <div>
          <p className="font-medium text-cocoa">Photo storage isn&apos;t connected yet.</p>
          <p className="mt-1">Add the Supabase settings in Vercel, then redeploy. The README walks through it.</p>
        </div>
      </div>
    );
  }
  if (loaded.error) {
    return (
      <div role="alert" className="flex gap-3 rounded-3xl border border-rose/40 bg-paper/70 p-5 text-sm text-rose">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p>Couldn&apos;t load photos right now. {loaded.error}</p>
      </div>
    );
  }
  return null;
}
