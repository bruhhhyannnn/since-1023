"use client";

import Link from "next/link";
import { formatDate, num } from "@/lib/format";
import {
  DAY,
  celebrating,
  dayNumber,
  elapsed,
  monthsaryTitle,
  nextAnniversary,
  nextMonthsary,
  splitDuration,
  totals,
  upcomingMilestones,
} from "@/lib/time";
import { useNow } from "@/lib/use-now";
import { Heart } from "./Heart";

const pad = (n: number) => String(n).padStart(2, "0");

/** The big live counter: years, months, days, hours, minutes, seconds. */
export function LiveCounter() {
  const now = useNow();
  const e = now === null ? null : elapsed(now);
  const units: [number | undefined, string, boolean][] = [
    [e?.years, "Year", false],
    [e?.months, "Month", false],
    [e?.days, "Day", false],
    [e?.hours, "Hour", true],
    [e?.minutes, "Minute", true],
    [e?.seconds, "Second", true],
  ];

  return (
    <div role="timer" aria-live="off" className="mx-auto grid max-w-4xl grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-3">
      {units.map(([value, label, padded]) => (
        <div
          key={label}
          className="rounded-2xl border border-wheat-deep/70 bg-paper/80 px-1 pb-3 pt-2 shadow-[0_1px_0_var(--color-wheat-deep)]"
        >
          <div className="tabular font-display text-5xl font-semibold leading-none text-burgundy sm:text-6xl">
            <span className="inline-block pt-2">
              {value === undefined ? "–" : padded ? pad(value) : value}
            </span>
          </div>
          <div className="eyebrow mt-2">
            {label}
            {value === 1 ? "" : "s"}
          </div>
        </div>
      ))}
    </div>
  );
}

/** "Today is day 2,589 of us", or a little celebration on monthsary days. */
export function TodayLine() {
  const now = useNow();
  if (now === null) return <p className="h-6" />;

  // From 12:00 AM on the 23rd, all day long.
  const today = celebrating(now);

  return (
    <p className="text-brown">
      {today !== null ? (
        <Link
          href={`/memories/${today}`}
          className="inline-flex items-center gap-2 rounded-full bg-burgundy px-4 py-1.5 text-sm font-medium text-cream transition-colors hover:bg-burgundy-dark"
        >
          <Heart className="beat size-3.5" /> Happy {monthsaryTitle(today)}! See our album →
        </Link>
      ) : (
        <>
          Today is day <span className="tabular font-semibold text-burgundy">{num(dayNumber(now))}</span> of us
        </>
      )}
    </p>
  );
}

function Countdown({ ms }: { ms: number }) {
  const d = splitDuration(ms);
  const parts: [number, string][] = [
    [d.days, d.days === 1 ? "day" : "days"],
    [d.hours, "hrs"],
    [d.minutes, "min"],
    [d.seconds, "sec"],
  ];
  return (
    <div className="tabular mt-4 flex items-baseline gap-3 text-cocoa">
      {parts.map(([v, label], i) => (
        <span key={label}>
          <span className="font-display text-3xl font-semibold text-burgundy">{i === 0 ? num(v) : pad(v)}</span>{" "}
          <span className="text-xs uppercase tracking-wider text-brown">{label}</span>
        </span>
      ))}
    </div>
  );
}

/** Countdowns to the next monthsary and the next anniversary. */
export function NextDates() {
  const now = useNow();
  const cards =
    now === null
      ? null
      : [
          { eyebrow: "Next monthsary", ...nextMonthsary(now), title: monthsaryTitle(nextMonthsary(now).n) },
          { eyebrow: "Next anniversary", ...nextAnniversary(now), title: monthsaryTitle(nextAnniversary(now).years * 12) },
        ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(cards ?? [null, null]).map((c, i) => (
        <article key={i} className="min-h-44 rounded-3xl border border-wheat-deep/70 bg-paper/80 p-6">
          {c && (
            <>
              <p className="eyebrow">{c.eyebrow}</p>
              <h3 className="mt-1 font-display text-3xl font-semibold text-cocoa">{c.title}</h3>
              <p className="mt-1 text-sm text-brown">
                {formatDate(c.at, "long")} · {formatDate(c.at, "time")}
              </p>
              <Countdown ms={c.at - now!} />
            </>
          )}
        </article>
      ))}
    </div>
  );
}

/** The same time together in single units, like "or 2,588 days". */
export function Totals() {
  const now = useNow();
  const t = now === null ? null : totals(now);
  const rows: [keyof NonNullable<typeof t>, string][] = [
    ["months", "months"],
    ["weeks", "weeks"],
    ["days", "days"],
    ["hours", "hours"],
    ["minutes", "minutes"],
    ["seconds", "seconds"],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
      {rows.map(([key, label]) => (
        <div key={key} className="border-l-2 border-tan/60 pl-4">
          <dt className="eyebrow">{label}</dt>
          <dd className="tabular mt-1 font-display text-3xl font-semibold text-burgundy sm:text-4xl">
            {t ? num(t[key]) : "–"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function relative(ms: number): string {
  const days = Math.ceil(ms / DAY);
  if (ms < DAY) return "in less than a day";
  if (days === 1) return "tomorrow";
  if (days < 60) return `in ${days} days`;
  const months = Math.round(days / 30.44);
  return `in about ${months} months`;
}

/** Fun round numbers coming up. */
export function Milestones() {
  const now = useNow();
  if (now === null) return <ul className="min-h-56" />;
  return (
    <ul className="divide-y divide-wheat-deep/70 rounded-3xl border border-wheat-deep/70 bg-paper/80">
      {upcomingMilestones(now, 4).map((m) => (
        <li key={m.key} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-4">
          <span className="font-display text-xl font-semibold text-cocoa">{m.label}</span>
          <span className="text-sm text-brown">
            {formatDate(m.at, "medium")} · <span className="text-burgundy">{relative(m.at - now)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
