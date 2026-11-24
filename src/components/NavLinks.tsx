"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS, NAV_LINK_CLASS } from "./nav";

export function NavLinks() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return NAV_LINKS.map((l) => (
    <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined} className={NAV_LINK_CLASS}>
      {l.label}
    </Link>
  ));
}
