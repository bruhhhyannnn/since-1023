import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PhotoGrid } from "@/components/PhotoGrid";
import { ButtonLink, StorageNotice } from "@/components/ui";
import { albumOf } from "@/lib/albums";
import { loadPhotos } from "@/lib/data";
import { formatRange } from "@/lib/format";
import { albumFor, albumRange, monthsaryTitle, spanText } from "@/lib/time";

const parse = (raw: string) => (/^\d{1,4}$/.test(raw) ? Number(raw) : null);

export async function generateMetadata({ params }: PageProps<"/memories/[n]">): Promise<Metadata> {
  const n = parse((await params).n);
  return { title: n === null ? "Memories" : monthsaryTitle(n) };
}

export default function AlbumPage({ params }: PageProps<"/memories/[n]">) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 sm:pt-12">
      <Link href="/memories" className="text-sm text-brown hover:text-burgundy">
        ← All memories
      </Link>
      <Suspense fallback={<AlbumSkeleton />}>
        <Album params={params} />
      </Suspense>
    </div>
  );
}

function AlbumSkeleton() {
  return (
    <div className="mt-6">
      <div className="h-14 w-72 animate-pulse rounded-xl bg-wheat/70" />
      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-2xl bg-wheat/70" />
        ))}
      </div>
    </div>
  );
}

async function Album({ params }: { params: PageProps<"/memories/[n]">["params"] }) {
  const n = parse((await params).n);
  if (n === null) notFound();

  const loaded = await loadPhotos();
  const current = albumFor(loaded.now);
  const photos = loaded.photos
    .filter((p) => albumOf(p) === n)
    .sort((a, b) => a.takenAt.localeCompare(b.takenAt));
  if (n > current && photos.length === 0) notFound();

  const { from, to } = albumRange(n);
  const favorites = photos.filter((p) => p.favorite).length;

  return (
    <>
      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{formatRange(from, to)}</p>
          <h1 className="mt-2 font-display text-5xl font-semibold text-cocoa">{monthsaryTitle(n)}</h1>
          <p className="mt-2 text-brown">
            {n > 0 && <>{spanText(n)} together · </>}
            {photos.length} photo{photos.length === 1 ? "" : "s"}
            {favorites > 0 && <> · {favorites} favorite{favorites === 1 ? "" : "s"}</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/memories/upload" variant="secondary">
            Add photos
          </ButtonLink>
          {n > 0 && photos.length > 0 && <ButtonLink href={`/monthsary?n=${n}`}>Make the monthsary post</ButtonLink>}
        </div>
      </header>

      <div className="mt-8">
        <StorageNotice loaded={loaded} />
        <PhotoGrid photos={photos} />
      </div>

      <nav className="mt-10 flex justify-between text-sm">
        {n > 0 ? (
          <Link href={`/memories/${n - 1}`} className="text-brown hover:text-burgundy">
            ← {monthsaryTitle(n - 1)}
          </Link>
        ) : (
          <span />
        )}
        {n < current && (
          <Link href={`/memories/${n + 1}`} className="text-brown hover:text-burgundy">
            {monthsaryTitle(n + 1)} →
          </Link>
        )}
      </nav>
    </>
  );
}
