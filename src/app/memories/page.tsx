import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Heart } from "@/components/Heart";
import { ButtonLink, StorageNotice } from "@/components/ui";
import { groupByAlbum } from "@/lib/albums";
import { loadPhotos } from "@/lib/data";
import { formatRange } from "@/lib/format";
import type { Photo } from "@/lib/photos";
import { albumFor, albumRange, monthsaryTitle } from "@/lib/time";

export const metadata: Metadata = { title: "Memories" };

export default function MemoriesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Our memories</p>
          <h1 className="mt-2 font-display text-5xl font-semibold text-cocoa">An album every monthsary</h1>
          <p className="mt-2 max-w-xl text-brown">
            Add photos any day. Each album holds everything from the day after one monthsary through the next one.
          </p>
        </div>
        <ButtonLink href="/memories/upload">Add photos</ButtonLink>
      </header>

      <Suspense fallback={<AlbumsSkeleton />}>
        <Albums />
      </Suspense>
    </div>
  );
}

function AlbumsSkeleton() {
  return (
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-wheat/70" />
      ))}
    </div>
  );
}

async function Albums() {
  const loaded = await loadPhotos();
  const current = albumFor(loaded.now);
  const groups = groupByAlbum(loaded.photos);
  const numbers = [...new Set([current, ...groups.keys()])].sort((a, b) => b - a);

  return (
    <div className="mt-10 space-y-6">
      <StorageNotice loaded={loaded} />
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {numbers.map((n) => (
          <li key={n}>
            <AlbumCard n={n} photos={groups.get(n) ?? []} isCurrent={n === current} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function AlbumCard({ n, photos, isCurrent }: { n: number; photos: Photo[]; isCurrent: boolean }) {
  const { from, to } = albumRange(n);
  const favorites = photos.filter((p) => p.favorite);
  const cover = [...favorites, ...photos.filter((p) => !p.favorite)].slice(0, 4);

  return (
    <Link
      href={`/memories/${n}`}
      className="group block rounded-3xl border border-wheat-deep/70 bg-paper/80 p-3 transition-shadow hover:shadow-lg hover:shadow-wheat-deep/40"
    >
      <div className="grid aspect-square grid-cols-2 grid-rows-2 gap-1.5 overflow-hidden rounded-2xl bg-wheat">
        {cover.length === 0 ? (
          <div className="col-span-2 row-span-2 grid place-items-center text-center text-sm text-brown">
            <div>
              <Heart className="mx-auto size-6 text-tan" />
              <p className="mt-2">No photos yet</p>
            </div>
          </div>
        ) : (
          cover.map((p, i) => (
            <img
              key={p.id}
              src={p.thumbUrl}
              alt=""
              loading="lazy"
              className={`size-full object-cover ${
                cover.length === 1 ? "col-span-2 row-span-2" : cover.length === 2 ? "row-span-2" : cover.length === 3 && i === 0 ? "row-span-2" : ""
              }`}
            />
          ))
        )}
      </div>
      <div className="px-2 pb-1 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-semibold text-cocoa group-hover:text-burgundy">{monthsaryTitle(n)}</h2>
          {isCurrent && <span className="rounded-full bg-burgundy px-2.5 py-0.5 text-xs font-medium text-cream">Now</span>}
        </div>
        <p className="text-sm text-brown">{formatRange(from, to)}</p>
        <p className="mt-1 text-sm text-brown">
          {photos.length} photo{photos.length === 1 ? "" : "s"}
          {favorites.length > 0 && (
            <span className="text-burgundy">
              {" "}
              · {favorites.length} <Heart className="inline size-3 align-[-1px]" />
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
