import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { OwnerOnly } from "@/components/OwnerOnly";
import { Uploader } from "@/components/Uploader";
import { PageTransition } from "@/components/motion/PageTransition";
import { BackLink } from "@/components/ui";
import { loadPhotos } from "@/lib/data";

export const metadata: Metadata = { title: "Add photos", robots: { index: false } };

export default function UploadPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:pt-12">
        <BackLink href="/memories" icon={ChevronLeft}>
          All memories
        </BackLink>
        <h1 className="enter mt-6 font-display text-5xl font-semibold text-cocoa">Add photos</h1>
        <p className="enter mt-2 text-brown" style={{ "--d": "80ms" } as React.CSSProperties}>
          We read the date each photo was taken and put it in the right monthsary album. You can change the date if
          it&apos;s off, and photos that are already in our albums get flagged so nothing is added twice.
        </p>
        <div className="mt-8">
          <Suspense fallback={<div className="h-48 animate-pulse rounded-3xl bg-wheat/70" />}>
            <OwnerOnly>
              <UploaderWithLibrary />
            </OwnerOnly>
          </Suspense>
        </div>
      </div>
    </PageTransition>
  );
}

/** Passes along when every existing photo was taken, to spot duplicates. */
async function UploaderWithLibrary() {
  const loaded = await loadPhotos();
  return <Uploader existing={loaded.photos.map((p) => Date.parse(p.takenAt))} />;
}
