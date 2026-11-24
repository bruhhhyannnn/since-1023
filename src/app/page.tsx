import Link from "next/link";
import { Suspense } from "react";
import { Heart } from "@/components/Heart";
import { LiveCounter, Milestones, NextDates, TodayLine, Totals } from "@/components/Together";
import { ButtonLink, Section, StorageNotice } from "@/components/ui";
import { albumOf } from "@/lib/albums";
import { loadPhotos } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { START } from "@/lib/time";
import { US } from "@/lib/us";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="pt-12 text-center sm:pt-20">
        <p className="eyebrow">Us, since 10.23.2019</p>
        <h1 className="mt-4 font-display text-6xl font-semibold italic leading-[0.95] text-burgundy sm:text-8xl">
          {US.me} <span className="text-tan">&amp;</span> {US.her}
        </h1>
        <p className="mt-4 font-display text-2xl italic text-brown sm:text-3xl">have been together for</p>
        <div className="mt-8">
          <LiveCounter />
        </div>
        <p className="mt-8 text-cocoa">
          since <span className="font-medium">{formatDate(START, "long")}</span>{" "}
          <span className="whitespace-nowrap">at 7:00 PM</span>
        </p>
        <div className="mt-3">
          <TodayLine />
        </div>
      </section>

      <Section title="Counting down to">
        <NextDates />
      </Section>

      <Section title="Or, if you’re counting">
        <Totals />
      </Section>

      <Section title="Coming up">
        <Milestones />
      </Section>

      <Section
        title="Latest memories"
        action={
          <Link href="/memories" className="text-sm text-brown underline-offset-4 hover:text-burgundy hover:underline">
            See all
          </Link>
        }
      >
        <Suspense fallback={<ThumbRow />}>
          <LatestMemories />
        </Suspense>
      </Section>
    </div>
  );
}

function ThumbRow() {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="aspect-square animate-pulse rounded-2xl bg-wheat/70" />
      ))}
    </div>
  );
}

async function LatestMemories() {
  const loaded = await loadPhotos();
  if (loaded.kind === "none" || loaded.error) return <StorageNotice loaded={loaded} />;

  if (loaded.photos.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-tan bg-paper/70 px-6 py-10 text-center">
        <Heart className="size-6 text-burgundy" />
        <p className="mt-3 font-display text-2xl font-semibold text-cocoa">No photos yet</p>
        <p className="mt-1 max-w-sm text-sm text-brown">
          Add our favorite pictures any day. They&apos;re sorted into monthsary albums automatically.
        </p>
        <div className="mt-5">
          <ButtonLink href="/memories/upload">Add photos</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {loaded.photos.slice(0, 8).map((p) => (
        <Link
          key={p.id}
          href={`/memories/${albumOf(p)}#${p.id}`}
          className="group relative aspect-square overflow-hidden rounded-2xl bg-wheat"
        >
          <img
            src={p.thumbUrl}
            alt={p.caption ?? `Photo from ${formatDate(Date.parse(p.takenAt))}`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      ))}
    </div>
  );
}
