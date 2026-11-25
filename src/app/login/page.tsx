import type { Metadata } from "next";
import { ChevronLeft, ImagePlus, Mail, Sparkles } from "lucide-react";
import { Suspense } from "react";
import { Heart } from "@/components/Heart";
import { LoginForm } from "@/components/LoginForm";
import { SignOutButton } from "@/components/SignOutButton";
import { BackLink, ButtonLink } from "@/components/ui";
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
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-wheat text-burgundy">
            <Heart className="beat size-6" />
          </span>
          <h1 className="mt-3 font-display text-4xl font-semibold text-cocoa">Just the two of us</h1>
          <Suspense fallback={<div className="h-64" />}>
            <SignIn />
          </Suspense>
        </div>
        <div className="mt-6 flex justify-center">
          <BackLink href="/" icon={ChevronLeft}>
            Back to us
          </BackLink>
        </div>
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
          <ButtonLink href="/memories/upload" icon={ImagePlus}>
            Add photos
          </ButtonLink>
          <ButtonLink href="/notes" variant="secondary" icon={Mail}>
            Write a note
          </ButtonLink>
          <ButtonLink href="/monthsary" variant="secondary" icon={Sparkles}>
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
