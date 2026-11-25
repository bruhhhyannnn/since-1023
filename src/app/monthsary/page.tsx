import type { Metadata } from "next";
import { Suspense } from "react";
import { OwnerOnly } from "@/components/OwnerOnly";
import { PostMaker } from "@/components/PostMaker";
import { StorageNotice } from "@/components/ui";
import { PageTransition } from "@/components/motion/PageTransition";
import { loadPhotos } from "@/lib/data";
import { albumFor } from "@/lib/time";

export const metadata: Metadata = { title: "Monthsary post", robots: { index: false } };

export default function MonthsaryPage({ searchParams }: PageProps<"/monthsary">) {
  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4 pt-10 sm:pt-14">
        <header>
          <p className="eyebrow">For Instagram</p>
          <h1 className="mt-2 font-display text-5xl font-semibold text-cocoa">Make the monthsary post</h1>
          <p className="mt-2 max-w-xl text-brown">
            Pick a monthsary and its photos. We&apos;ll lay them out with our dates, ready to share or save.
          </p>
        </header>
        <div className="mt-10">
          <Suspense fallback={<div className="aspect-[4/5] max-w-md animate-pulse rounded-3xl bg-wheat/70" />}>
            <OwnerOnly>
              <Maker searchParams={searchParams} />
            </OwnerOnly>
          </Suspense>
        </div>
      </div>
    </PageTransition>
  );
}

async function Maker({ searchParams }: { searchParams: PageProps<"/monthsary">["searchParams"] }) {
  const { n: raw } = await searchParams;
  const loaded = await loadPhotos();
  const { now } = loaded;
  const maxN = Math.max(1, albumFor(now));
  // Default to the newest finished album (each one is done at 12:00 AM on the 23rd).
  const fallback = Math.max(1, maxN - 1);
  const requested = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : NaN;
  const initialN = requested >= 1 && requested <= maxN ? requested : fallback;

  return (
    <>
      <div className="mb-6 empty:hidden">
        <StorageNotice loaded={loaded} />
      </div>
      <PostMaker key={initialN} photos={loaded.photos} initialN={initialN} maxN={maxN} />
    </>
  );
}
