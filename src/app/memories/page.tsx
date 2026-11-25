import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Heart } from "@/components/Heart";
import { FadeImg } from "@/components/motion/FadeImg";
import { PageTransition } from "@/components/motion/PageTransition";
import { ButtonLink, StorageNotice } from "@/components/ui";
import { groupByAlbum, keyPhoto } from "@/lib/albums";
import { getOwner } from "@/lib/auth";
import { loadPhotos } from "@/lib/data";
import { formatRange } from "@/lib/format";
import type { Photo } from "@/lib/photos";
import { DAY, albumFor, albumRange, albumReadyAt, celebrating, monthsaryTitle } from "@/lib/time";

export const metadata: Metadata = { title: "Memories" };

export default function MemoriesPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4 pt-10 sm:pt-14">
        <p className="enter eyebrow">Our memories</p>
        <h1 className="enter mt-2 font-display text-5xl font-semibold text-cocoa sm:text-6xl" style={{ "--d": "80ms" } as React.CSSProperties}>
          Memories
        </h1>
        <Suspense fallback={<MemoriesSkeleton />}>
          <Albums />
        </Suspense>
      </div>
    </PageTransition>
  );
}

function MemoriesSkeleton() {
  return (
    <div className="mt-8">
      <div className="-mx-4 aspect-[4/5] animate-pulse bg-wheat/70 sm:mx-0 sm:aspect-[2/1] sm:rounded-3xl" />
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-2xl bg-wheat/70" />
        ))}
      </div>
    </div>
  );
}

async function Albums() {
  const [loaded, owner] = await Promise.all([loadPhotos(), getOwner()]);
  const current = albumFor(loaded.now);
  const groups = groupByAlbum(loaded.photos);
  const withPhotos = [...groups.keys()].sort((a, b) => b - a);
  const today = celebrating(loaded.now);

  // Feature the newest finished album (the latest monthsary), or this month's if none is finished yet.
  const featured = withPhotos.find((n) => n < current) ?? withPhotos[0];
  const featuredLabel =
    featured === undefined
      ? null
      : today === featured
        ? `Happy ${monthsaryTitle(featured)}! Our album is ready`
        : featured === current
          ? "This month"
          : loaded.now - albumReadyAt(featured) < 7 * DAY
            ? "New album"
            : "Latest monthsary";

  // The owners also see this month's album before it has photos, so they can start it.
  const tiles = owner && !groups.has(current) ? [current, ...withPhotos] : withPhotos;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-brown">
          {loaded.photos.length} photo{loaded.photos.length === 1 ? "" : "s"} · {withPhotos.length} album
          {withPhotos.length === 1 ? "" : "s"}
        </p>
        {owner && <ButtonLink href="/memories/upload">Add photos</ButtonLink>}
      </div>

      <div className="mt-6 space-y-6">
        <StorageNotice loaded={loaded} />

        {featured !== undefined && (
          <div className="enter" style={{ "--d": "120ms" } as React.CSSProperties}>
            <FeaturedAlbum n={featured} photos={groups.get(featured)!} label={featuredLabel} celebrating={today === featured} />
            <div className="mt-4 flex justify-center sm:justify-start">
              <ButtonLink href={`/memories/${featured}?wrapped=1`}>
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                  <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
                </svg>
                Watch our {monthsaryTitle(featured)} Wrapped
              </ButtonLink>
            </div>
          </div>
        )}

        {tiles.length === 0 && !loaded.error && loaded.kind !== "none" && (
          <div className="rounded-3xl border border-dashed border-tan bg-paper/70 px-6 py-14 text-center">
            <Heart className="mx-auto size-6 text-burgundy" />
            <p className="mt-3 font-display text-2xl font-semibold text-cocoa">Our albums will live here</p>
            <p className="mt-1 text-sm text-brown">One for every monthsary, filled with our favorite pictures.</p>
          </div>
        )}
      </div>

      {tiles.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-3xl font-semibold text-cocoa">Every monthsary</h2>
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {tiles.map((n, i) => (
              <li key={n} className="tile-in min-w-0" style={{ "--i": i } as React.CSSProperties}>
                <AlbumTile n={n} photos={groups.get(n) ?? []} isCurrent={n === current} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** A big "memory" card, like the ones in the Photos app. */
function FeaturedAlbum({
  n,
  photos,
  label,
  celebrating,
}: {
  n: number;
  photos: Photo[];
  label: string | null;
  celebrating: boolean;
}) {
  const cover = keyPhoto(photos)!;
  const { from, to } = albumRange(n);
  return (
    <Link href={`/memories/${n}`} className="group relative -mx-4 block overflow-hidden bg-cocoa sm:mx-0 sm:rounded-3xl">
      <div className="relative aspect-[4/5] sm:aspect-[2/1]">
        <FadeImg src={cover.url} alt="" className="kenburns-slow absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20" />
        {label && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-burgundy shadow sm:left-6 sm:top-6">
            <Heart className={`size-3.5 ${celebrating ? "beat" : ""}`} /> {label}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-white/80">{formatRange(from, to)}</p>
          <h2 className="mt-2 font-display text-5xl font-semibold leading-[0.95] drop-shadow sm:text-7xl">
            {monthsaryTitle(n)}
          </h2>
          <p className="mt-2 text-sm text-white/85">
            {photos.length} photo{photos.length === 1 ? "" : "s"} · Tap to open
          </p>
        </div>
      </div>
    </Link>
  );
}

/** An album in the grid: square cover, title, dates, count. */
function AlbumTile({ n, photos, isCurrent }: { n: number; photos: Photo[]; isCurrent: boolean }) {
  const cover = keyPhoto(photos);
  const { from, to } = albumRange(n);
  return (
    <Link href={`/memories/${n}`} className="group block min-w-0">
      <div className="lift relative aspect-square overflow-hidden rounded-2xl bg-wheat shadow-sm">
        {cover ? (
          <FadeImg
            src={cover.thumbUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-center text-sm text-brown">
            <div>
              <Heart className="mx-auto size-6 text-tan" />
              <p className="mt-2">Add this month&apos;s photos</p>
            </div>
          </div>
        )}
        {isCurrent && (
          <span className="absolute left-2 top-2 rounded-full bg-burgundy px-2.5 py-0.5 text-xs font-medium text-cream">
            Now
          </span>
        )}
      </div>
      <h3 className="mt-2 truncate font-display text-xl font-semibold leading-tight text-cocoa transition-colors group-hover:text-burgundy">
        {monthsaryTitle(n)}
      </h3>
      <p className="truncate text-sm text-brown">{formatRange(from, to)}</p>
      <p className="text-sm text-brown/80">
        {photos.length} photo{photos.length === 1 ? "" : "s"}
      </p>
    </Link>
  );
}
