import Link from "next/link";
import { Suspense } from "react";
import { Heart } from "./Heart";
import { NAV_LINKS, NAV_LINK_CLASS } from "./nav";
import { NavLinks } from "./NavLinks";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-wheat-deep/60 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 text-burgundy">
          <Heart className="size-4" />
          <span className="font-display text-xl font-semibold italic tracking-tight">since 10·23</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {/* The current page is only known at request time, so the highlight streams in. */}
          <Suspense
            fallback={NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={NAV_LINK_CLASS}>
                {l.label}
              </Link>
            ))}
          >
            <NavLinks />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
