import Link from "next/link";
import { Suspense } from "react";
import { Heart } from "@/components/Heart";
import { FadeImg } from "@/components/motion/FadeImg";
import { FloatingHearts } from "@/components/motion/FloatingHearts";
import { PageTransition } from "@/components/motion/PageTransition";
import { LiveCounter, Milestones, NextDates, TodayLine, Totals } from "@/components/Together";
import { ButtonLink, Section, StorageNotice } from "@/components/ui";
import { albumOf } from "@/lib/albums";
import { getOwner } from "@/lib/auth";
import { loadPhotos } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { Photo } from "@/lib/photos";
import { START, toWall } from "@/lib/time";
import { US } from "@/lib/us";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export default function Home() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4">
        <section className="relative isolate pt-12 text-center sm:pt-20">
          <FloatingHearts />
          <p className="enter eyebrow" style={d(0)}>
            Us, since 10.23.2019
          </p>
          <h1 className="mt-4 font-display text-6xl font-semibold italic leading-[0.95] text-burgundy sm:text-8xl">
            <span className="enter inline-block" style={d(100)}>
              {US.me}
            </span>{" "}
            <span className="pop-in inline-block text-tan" style={d(350)}>
              &amp;
            </span>{" "}
            <span className="enter inline-block" style={d(220)}>
              {US.her}
            </span>
          </h1>
          <p className="enter mt-4 font-display text-2xl italic text-brown sm:text-3xl" style={d(380)}>
            have been together for
          </p>
          <div className="mt-8">
            <LiveCounter />
          </div>
          <p className="enter mt-8 text-cocoa" style={d(900)}>
            since <span className="font-medium">{formatDate(START, "long")}</span>{" "}
            <span className="whitespace-nowrap">at 7:00 PM</span>
          </p>
          <div className="mt-3">
            <TodayLine />
          </div>
        </section>

        <Suspense fallback={null}>
          <OnThisDay />
        </Suspense>

        <Section title="Counting down to">
          <NextDates />
        </Section>

        <Section title="Or, if you’re counting">
          <Totals />
        </Section>

        <Section title="Coming up">
          <Milestones />
        </Section>

        <Suspense fallback={null}>
          <LatestMemories />
        </Suspense>
      </div>
    </PageTransition>
  );
}

/** Photos from this same day in earlier years, like "On This Day" in the Photos app. */
async function OnThisDay() {
  const loaded = await loadPhotos();
  const today = toWall(loaded.now);
  const byYear = new Map<number, Photo[]>();
  for (const p of loaded.photos) {
    const w = toWall(Date.parse(p.takenAt));
    if (w.month === today.month && w.day === today.day && w.year < today.year) {
      byYear.set(w.year, [...(byYear.get(w.year) ?? []), p]);
    }
  }
  if (byYear.size === 0) return null;
  const years = [...byYear.entries()].sort((a, b) => b[0] - a[0]);

  return (
    <Section title="On this day">
      <div className="space-y-6">
        {years.map(([year, list]) => {
          const ago = today.year - year;
          return (
            <div key={year}>
              <p className="eyebrow mb-2">
                {ago === 1 ? "1 year ago" : `${ago} years ago`} · {year}
              </p>
              <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
                {list.map((p, i) => (
                  <li key={p.id} className="tile-in shrink-0 snap-start" style={{ "--i": i } as React.CSSProperties}>
                    <Link
                      href={`/memories/${albumOf(p)}?photo=${p.id}`}
                      className="lift group relative block h-56 w-44 overflow-hidden rounded-2xl bg-wheat sm:h-64 sm:w-52"
                    >
                      <FadeImg src={p.thumbUrl} alt={p.caption ?? ""} loading="lazy" className="size-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8 text-left text-sm text-white">
                        <span className="line-clamp-2">{p.caption ?? formatDate(Date.parse(p.takenAt), "time")}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/** The newest photos, like "Recents" in the Photos app. Hidden from visitors until there are some. */
async function LatestMemories() {
  const [loaded, owner] = await Promise.all([loadPhotos(), getOwner()]);
  const problem = loaded.kind === "none" || loaded.error;
  if ((problem || loaded.photos.length === 0) && !owner) return null;

  return (
    <Section
      title="Latest memories"
      action={
        loaded.photos.length > 0 && (
          <Link href="/memories" className="text-sm text-brown underline-offset-4 hover:text-burgundy hover:underline">
            See all
          </Link>
        )
      }
    >
      {problem ? (
        <StorageNotice loaded={loaded} />
      ) : loaded.photos.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-tan bg-paper/70 px-6 py-10 text-center">
          <Heart className="beat size-6 text-burgundy" />
          <p className="mt-3 font-display text-2xl font-semibold text-cocoa">No photos yet</p>
          <p className="mt-1 max-w-sm text-sm text-brown">
            Add our favorite pictures any day. They&apos;re sorted into monthsary albums automatically.
          </p>
          <div className="mt-5">
            <ButtonLink href="/memories/upload">Add photos</ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-4 gap-[3px] overflow-hidden rounded-2xl">
          {loaded.photos.slice(0, 8).map((p, i) => (
            <li key={p.id} className="tile-in aspect-square bg-wheat" style={{ "--i": i } as React.CSSProperties}>
              <Link href={`/memories/${albumOf(p)}?photo=${p.id}`} className="group block size-full overflow-hidden">
                <FadeImg
                  src={p.thumbUrl}
                  alt={p.caption ?? `Photo from ${formatDate(Date.parse(p.takenAt))}`}
                  loading="lazy"
                  className="size-full object-cover transition-[scale] duration-500 group-hover:scale-105"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
