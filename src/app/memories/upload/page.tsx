import type { Metadata } from "next";
import Link from "next/link";
import { Uploader } from "@/components/Uploader";

export const metadata: Metadata = { title: "Add photos" };

export default function UploadPage() {
  return (
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
        <Uploader />
      </div>
    </div>
  );
}
