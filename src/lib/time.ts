import { US } from "./us";

/*
 * All relationship math happens on Philippine wall-clock time (UTC+8, no DST),
 * so the counter reads the same on every device, wherever it is.
 */

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const OFFSET = US.utcOffsetHours * HOUR;

export type Wall = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
};

/** Philippine wall-clock parts of an instant. */
export function toWall(ms: number): Wall {
  const d = new Date(ms + OFFSET);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
  };
}

/** The instant for Philippine wall-clock parts. */
export function fromWall(w: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
}): number {
  return (
    Date.UTC(w.year, w.month - 1, w.day, w.hour ?? 0, w.minute ?? 0, w.second ?? 0) -
    OFFSET
  );
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export const START = fromWall(US.start);

/** The instant of the n-th monthsary. n = 0 is the very start; n = 12 is the 1st anniversary. */
export function monthsaryAt(n: number): number {
  const index = US.start.month - 1 + n;
  const year = US.start.year + Math.floor(index / 12);
  const month = (((index % 12) + 12) % 12) + 1;
  const day = Math.min(US.start.day, daysInMonth(year, month));
  return fromWall({ year, month, day, hour: US.start.hour, minute: US.start.minute });
}

/** How many monthsaries have already happened at `now`. */
export function completedMonths(now: number): number {
  if (now < START) return 0;
  const w = toWall(now);
  let m = (w.year - US.start.year) * 12 + (w.month - US.start.month);
  if (monthsaryAt(m) > now) m -= 1;
  return m;
}

export type Duration = { days: number; hours: number; minutes: number; seconds: number };

export function splitDuration(ms: number): Duration {
  const s = Math.max(0, Math.floor(ms / SECOND));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export type Elapsed = Duration & { years: number; months: number; totalMonths: number };

/** Calendar-aware time together: years, months, then days/hours/minutes/seconds. */
export function elapsed(now: number): Elapsed {
  const totalMonths = completedMonths(now);
  const rest = splitDuration(now - monthsaryAt(totalMonths));
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    totalMonths,
    ...rest,
  };
}

/** The same span expressed in single units ("or 2,588 days"). */
export function totals(now: number) {
  const ms = Math.max(0, now - START);
  const months = completedMonths(now);
  return {
    years: Math.floor(months / 12),
    months,
    weeks: Math.floor(ms / (7 * DAY)),
    days: Math.floor(ms / DAY),
    hours: Math.floor(ms / HOUR),
    minutes: Math.floor(ms / MINUTE),
    seconds: Math.floor(ms / SECOND),
  };
}

/** Day 1 is Oct 23, 2019 (from 7 PM); counts up by one every 24 hours. */
export function dayNumber(now: number): number {
  return Math.floor(Math.max(0, now - START) / DAY) + 1;
}

export function nextMonthsary(now: number): { n: number; at: number } {
  const n = now < START ? 0 : completedMonths(now) + 1;
  return { n, at: monthsaryAt(n) };
}

export function nextAnniversary(now: number): { years: number; at: number } {
  const years = Math.floor(completedMonths(now) / 12) + 1;
  return { years, at: monthsaryAt(years * 12) };
}

export function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]);
}

/** "86th Monthsary", or "7th Anniversary" every 12 months. */
export function monthsaryTitle(n: number): string {
  if (n <= 0) return "Day One";
  if (n % 12 === 0) return `${ordinal(n / 12)} Anniversary`;
  return `${ordinal(n)} Monthsary`;
}

/** "7 years & 2 months" */
export function spanText(totalMonths: number): string {
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  const parts: string[] = [];
  if (y) parts.push(plural(y, "year"));
  if (m || !y) parts.push(plural(m, "month"));
  return parts.join(" & ");
}

export function plural(n: number, word: string): string {
  return `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;
}

/* ------------------------------------------------------------------------ *
 * Albums: one per monthsary.
 *
 * The album for the n-th monthsary holds every photo from the day after the
 * previous monthsary through the monthsary day itself (24th → 23rd), so the
 * celebration day lands in the album you post that night.
 * Album 0 ("Day One") holds Oct 23, 2019 and anything before it.
 * ------------------------------------------------------------------------ */

/** The album number for a photo taken at `ms`. */
export function albumFor(ms: number): number {
  const w = toWall(ms);
  const k = (w.year - US.start.year) * 12 + (w.month - US.start.month);
  if (k < 0) return 0;
  const monthsaryDay = toWall(monthsaryAt(k)).day;
  return w.day <= monthsaryDay ? k : k + 1;
}

/** First and last calendar day (as noon instants, for display) of an album. */
export function albumRange(n: number): { from: number | null; to: number } {
  const end = toWall(monthsaryAt(n));
  const to = fromWall({ year: end.year, month: end.month, day: end.day, hour: 12 });
  if (n <= 0) return { from: null, to };
  const prev = toWall(monthsaryAt(n - 1));
  const from = fromWall({ year: prev.year, month: prev.month, day: prev.day + 1, hour: 12 });
  return { from, to };
}

/** True when `a` and `b` fall on the same Philippine calendar day. */
export function sameDay(a: number, b: number): boolean {
  const x = toWall(a);
  const y = toWall(b);
  return x.year === y.year && x.month === y.month && x.day === y.day;
}

/* ------------------------------------------------------------------------ *
 * Milestones worth looking forward to.
 * ------------------------------------------------------------------------ */

export type Milestone = { key: string; label: string; at: number };

export function upcomingMilestones(now: number, count = 4): Milestone[] {
  const since = Math.max(0, now - START);
  const next = (unit: number, step: number) => (Math.floor(since / unit / step) + 1) * step;

  const candidates: Milestone[] = [];
  const add = (key: string, label: string, at: number) => {
    if (at > now && !candidates.some((c) => c.at === at)) candidates.push({ key, label, at });
  };

  const hundredDays = next(DAY, 100);
  add(`days-${hundredDays}`, `${hundredDays.toLocaleString("en-US")} days together`, START + hundredDays * DAY);

  const thousandDays = next(DAY, 1000);
  add(`days-${thousandDays}`, `${thousandDays.toLocaleString("en-US")} days together`, START + thousandDays * DAY);

  const tenThousandHours = next(HOUR, 10_000);
  add(`hours-${tenThousandHours}`, `${tenThousandHours.toLocaleString("en-US")} hours together`, START + tenThousandHours * HOUR);

  const fiftyMillionSeconds = next(SECOND, 50_000_000);
  add(
    `seconds-${fiftyMillionSeconds}`,
    `${(fiftyMillionSeconds / 1_000_000).toLocaleString("en-US")} million seconds together`,
    START + fiftyMillionSeconds * SECOND,
  );

  const fiftyMonths = (Math.floor(completedMonths(now) / 50) + 1) * 50;
  add(`months-${fiftyMonths}`, `Our ${monthsaryTitle(fiftyMonths)}`, monthsaryAt(fiftyMonths));

  return candidates.sort((a, b) => a.at - b.at).slice(0, count);
}

/* ------------------------------------------------------------------------ *
 * <input type="datetime-local"> values, read as Philippine time.
 * ------------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");

/** ms → "2026-11-24T16:05" (Philippine time) */
export function toInputValue(ms: number): string {
  const w = toWall(ms);
  return `${w.year}-${pad(w.month)}-${pad(w.day)}T${pad(w.hour)}:${pad(w.minute)}`;
}

/** "2026-11-24T16:05" (Philippine time) → ms, or null if it isn't a valid value. */
export function fromInputValue(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!m) return null;
  const [year, month, day, hour, minute, second] = m.slice(1).map((x) => Number(x ?? 0));
  return fromWall({ year, month, day, hour, minute, second });
}

/** EXIF "2024:05:12 18:30:00" (camera time, taken as Philippine time) → ms */
export function fromExifValue(value: string): number | null {
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value.trim());
  if (!m) return null;
  const [year, month, day, hour, minute, second] = m.slice(1).map((x) => Number(x ?? 0));
  if (year < 1990 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return fromWall({ year, month, day, hour, minute, second });
}
