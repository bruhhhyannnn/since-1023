import Link from "next/link";
import type { Loaded } from "@/lib/data";

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16 sm:mt-20">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="font-display text-3xl font-semibold text-cocoa sm:text-4xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const button =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

export const buttonStyles = {
  primary: `${button} bg-burgundy text-cream hover:bg-burgundy-dark`,
  secondary: `${button} border border-wheat-deep bg-paper text-cocoa hover:border-tan hover:text-burgundy`,
  ghost: `${button} text-brown hover:text-burgundy`,
};

export function ButtonLink({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: keyof typeof buttonStyles;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonStyles[variant]}>
      {children}
    </Link>
  );
}

/** Explains why photos can't load, if they can't. */
export function StorageNotice({ loaded }: { loaded: Loaded }) {
  if (loaded.kind === "none") {
    return (
      <div className="rounded-3xl border border-dashed border-tan bg-paper/70 p-6 text-sm text-brown">
        <p className="font-medium text-cocoa">Photo storage isn&apos;t connected yet.</p>
        <p className="mt-1">
          Add the Supabase settings in Vercel, then redeploy. The README walks through it.
        </p>
      </div>
    );
  }
  if (loaded.error) {
    return (
      <div role="alert" className="rounded-3xl border border-rose/40 bg-paper/70 p-6 text-sm text-rose">
        Couldn&apos;t load photos right now. {loaded.error}
      </div>
    );
  }
  return null;
}
