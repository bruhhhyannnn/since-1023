import { US } from "./us";

type Style = "long" | "medium" | "short" | "range" | "time" | "dots";

const formats: Record<Style, Intl.DateTimeFormatOptions> = {
  // Wednesday, October 23, 2019
  long: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
  // Oct 23, 2019
  medium: { month: "short", day: "numeric", year: "numeric" },
  // Oct 23
  short: { month: "short", day: "numeric" },
  // October 23, 2019
  range: { month: "long", day: "numeric", year: "numeric" },
  // 7:00 PM
  time: { hour: "numeric", minute: "2-digit" },
  // handled below
  dots: {},
};

const cache = new Map<Style, Intl.DateTimeFormat>();

/** Format an instant in Philippine time. */
export function formatDate(ms: number, style: Style = "medium"): string {
  if (style === "dots") {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: US.timeZone,
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }).formatToParts(ms);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("month")}.${get("day")}.${get("year")}`;
  }
  let f = cache.get(style);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: US.timeZone, ...formats[style] });
    cache.set(style, f);
  }
  return f.format(ms);
}

/** "Nov 24 – Dec 23, 2026" or "Dec 24, 2025 – Jan 23, 2026" */
export function formatRange(from: number | null, to: number): string {
  if (from === null) return `Until ${formatDate(to, "medium")}`;
  const sameYear = formatDate(from, "medium").slice(-4) === formatDate(to, "medium").slice(-4);
  return `${formatDate(from, sameYear ? "short" : "medium")} – ${formatDate(to, "medium")}`;
}

export const num = (n: number) => n.toLocaleString("en-US");
