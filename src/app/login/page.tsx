import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Heart } from "@/components/Heart";
import { LoginForm } from "@/components/LoginForm";
import { SignOutButton } from "@/components/SignOutButton";
import { ButtonLink } from "@/components/ui";
import { PageTransition } from "@/components/motion/PageTransition";
import { getOwner } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

/** Not linked anywhere. Reach it by tapping the footer heart five times. */
export default function LoginPage() {
  return (
    <PageTransition>
      <div className="mx-auto flex min-h-[65vh] max-w-sm flex-col justify-center px-4 py-12">
        <div className="rounded-3xl border border-wheat-deep bg-paper/90 p-7 text-center shadow-xl shadow-wheat-deep/30">
          <Heart className="mx-auto size-7 text-burgundy" />
          <h1 className="mt-3 font-display text-4xl font-semibold text-cocoa">Just the two of us</h1>
          <Suspense fallback={<div className="h-64" />}>
            <SignIn />
          </Suspense>
        </div>
        <Link href="/" className="mt-6 text-center text-sm text-brown hover:text-burgundy">
          ← Back to us
        </Link>
      </div>
    </PageTransition>
  );
}

async function SignIn() {
  const owner = await getOwner();
  if (owner) {
    return (
      <div className="mt-4 space-y-5">
        <p className="text-brown">You&apos;re signed in as {owner.email}.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <ButtonLink href="/memories/upload">Add photos</ButtonLink>
          <ButtonLink href="/monthsary" variant="secondary">
            Make a post
          </ButtonLink>
        </div>
        <p className="text-sm text-brown">
          <SignOutButton />
        </p>
      </div>
    );
  }
  return (
    <>
      <p className="mt-1 text-sm text-brown">Sign in to add photos and make our monthsary posts.</p>
      <LoginForm />
    </>
  );
}
