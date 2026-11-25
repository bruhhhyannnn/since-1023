import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { NotesBoard } from "@/components/NotesBoard";
import { StorageNotice } from "@/components/ui";
import { loadNotes } from "@/lib/data";
import { US } from "@/lib/us";

export const metadata: Metadata = { title: "Love notes" };

export default function NotesPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4 pt-10 sm:pt-14">
        <p className="enter eyebrow">Love notes</p>
        <h1 className="enter mt-2 font-display text-5xl font-semibold text-cocoa sm:text-6xl" style={{ "--d": "80ms" } as React.CSSProperties}>
          Notes for each other
        </h1>
        <p className="enter mt-2 max-w-xl text-brown" style={{ "--d": "160ms" } as React.CSSProperties}>
          Little messages from {US.me} to {US.her}, and from {US.her} to {US.me}.
        </p>
        <div className="mt-8">
          <Suspense fallback={<NotesSkeleton />}>
            <Notes />
          </Suspense>
        </div>
      </div>
    </PageTransition>
  );
}

function NotesSkeleton() {
  return (
    <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
      {[160, 220, 180].map((h, i) => (
        <div key={i} className="mb-8 animate-pulse rounded-md bg-wheat/70" style={{ height: h }} />
      ))}
    </div>
  );
}

async function Notes() {
  const loaded = await loadNotes();
  return (
    <>
      {loaded.canWrite && (loaded.kind === "none" || loaded.error) && (
        <div className="mb-6">
          <StorageNotice loaded={{ photos: [], kind: loaded.kind, now: 0, error: loaded.error }} />
        </div>
      )}
      <NotesBoard notes={loaded.notes} canWrite={loaded.canWrite} needsSetup={loaded.needsSetup} />
    </>
  );
}
