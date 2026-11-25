import { ViewTransition } from "react";

/** Wraps a page so it fades and rises in on navigation. The header stays put. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
