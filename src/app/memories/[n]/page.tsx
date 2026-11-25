import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AlbumView } from "@/components/AlbumView";
import { BackLink, StorageNotice } from "@/components/ui";
import { PageTransition } from "@/components/motion/PageTransition";
import { albumOf } from "@/lib/albums";
import { getOwner } from "@/lib/auth";
import { loadPhotos } from "@/lib/data";
import { albumFor, celebrating, monthsaryTitle } from "@/lib/time";

const parse = (raw: string) => (/^\d{1,4}$/.test(raw) ? Number(raw) : null);

export async function generateMetadata({ params }: PageProps<"/memories/[n]">): Promise<Metadata> {
  const n = parse((await params).n);
  return { title: n === null ? "Memories" : monthsaryTitle(n) };
}

export default function AlbumPage({ params, searchParams }: PageProps<"/memories/[n]">) {
  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4 pt-4 sm:pt-8">
        <div className="mb-4">
          <BackLink href="/memories" icon={ChevronLeft}>
            All memories
          </BackLink>
        </div>
        <Suspense fallback={<AlbumSkeleton />}>
          <Album params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </PageTransition>
  );
}

function AlbumSkeleton() {
  return (
    <div>
      <div className="-mx-4 aspect-[4/5] max-h-[78vh] animate-pulse bg-wheat/70 sm:mx-0 sm:aspect-[16/9] sm:rounded-3xl" />
      <div className="mt-8 grid grid-cols-3 gap-[3px] sm:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-square animate-pulse bg-wheat/70" />
        ))}
      </div>
    </div>
  );
}

async function Album({
  params,
  searchParams,
}: {
  params: PageProps<"/memories/[n]">["params"];
  searchParams: PageProps<"/memories/[n]">["searchParams"];
}) {
  const n = parse((await params).n);
  if (n === null) notFound();
  const { photo, wrapped } = await searchParams;

  const [loaded, owner] = await Promise.all([loadPhotos(), getOwner()]);
  const current = albumFor(loaded.now);
  if (n > current) notFound();

  const photos = loaded.photos
    .filter((p) => albumOf(p) === n)
    .sort((a, b) => a.takenAt.localeCompare(b.takenAt));

  return (
    <>
      <StorageNotice loaded={loaded} />
      <AlbumView
        key={n}
        n={n}
        photos={photos}
        canEdit={owner !== null}
        complete={n < current}
        celebratingToday={celebrating(loaded.now) === n}
        initialPhoto={typeof photo === "string" ? photo : undefined}
        now={loaded.now}
        yearPhotos={n > 0 && n % 12 === 0 ? loaded.photos.filter((p) => albumOf(p) > n - 12 && albumOf(p) <= n) : undefined}
        autoplay={wrapped === "1"}
      />

      <nav className="mt-12 grid grid-cols-2 gap-3 text-sm">
        {n > 0 ? (
          <Link
            href={`/memories/${n - 1}`}
            className="lift group flex items-center gap-3 rounded-2xl border border-wheat-deep/70 bg-paper/80 p-4 text-brown transition-colors hover:border-tan hover:text-burgundy"
          >
            <ChevronLeft aria-hidden="true" className="size-5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span className="min-w-0">
              <span className="block text-xs uppercase tracking-wider">Before</span>
              <span className="block truncate font-display text-xl font-semibold text-cocoa">{monthsaryTitle(n - 1)}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {n < current && (
          <Link
            href={`/memories/${n + 1}`}
            className="lift group flex items-center justify-end gap-3 rounded-2xl border border-wheat-deep/70 bg-paper/80 p-4 text-right text-brown transition-colors hover:border-tan hover:text-burgundy"
          >
            <span className="min-w-0">
              <span className="block text-xs uppercase tracking-wider">After</span>
              <span className="block truncate font-display text-xl font-semibold text-cocoa">{monthsaryTitle(n + 1)}</span>
            </span>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </nav>
    </>
  );
}
