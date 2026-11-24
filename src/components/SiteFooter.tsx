import { Suspense } from "react";
import { getOwner } from "@/lib/auth";
import { US } from "@/lib/us";
import { SecretHeart } from "./SecretHeart";
import { SignOutButton } from "./SignOutButton";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-wheat-deep/60 py-8 text-center text-sm text-brown">
      <p className="flex items-center justify-center gap-1.5">
        {US.me} <SecretHeart /> {US.her}
      </p>
      <p className="mt-1 text-xs tracking-wide">since October 23, 2019 · 7:00 PM</p>
      <Suspense fallback={null}>
        <OwnerBadge />
      </Suspense>
    </footer>
  );
}

async function OwnerBadge() {
  const owner = await getOwner();
  if (!owner) return null;
  return (
    <p className="mt-4 text-xs">
      Signed in as {owner.email} · <SignOutButton />
    </p>
  );
}
