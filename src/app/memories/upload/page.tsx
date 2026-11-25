import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OwnerOnly } from "@/components/OwnerOnly";
import { Uploader } from "@/components/Uploader";
import { PageTransition } from "@/components/motion/PageTransition";

export const metadata: Metadata = { title: "Add photos", robots: { index: false } };

export default function UploadPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:pt-12">
        <Link href="/memories" className="text-sm text-brown hover:text-burgundy">
          ← All memories
        </Link>
        <h1 className="mt-6 font-display text-5xl font-semibold text-cocoa">Add photos</h1>
        <p className="mt-2 text-brown">
          We read the date each photo was taken and put it in the right monthsary album. You can change the date if
          it&apos;s off.
        </p>
        <div className="mt-8">
          <Suspense fallback={<div className="h-48 animate-pulse rounded-3xl bg-wheat/70" />}>
            <OwnerOnly>
              <Uploader />
            </OwnerOnly>
          </Suspense>
        </div>
      </div>
    </PageTransition>
  );
}
