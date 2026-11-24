import { albumOf, groupByDay, keyPhoto } from "./albums";
import type { Photo } from "./photos";
import { DAY, albumReadyAt, monthsaryTitle, ordinal, toWall } from "./time";

/*
 * The numbers behind a Wrapped story: everything is worked out from the
 * photos in a monthsary album (or a whole year of albums).
 */

export type TimeKey = "morning" | "afternoon" | "evening" | "night";

export const TIMES: { key: TimeKey; label: string }[] = [
  { key: "morning", label: "Morning" },
  { key: "afternoon", label: "Afternoon" },
  { key: "evening", label: "Evening" },
  { key: "night", label: "Night" },
];

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type Wrap = {
  kind: "month" | "year";
  /** The album number the story ends on (for a year: the anniversary). */
  n: number;
  title: string;
  /** First and last moment the story covers. */
  from: number;
  to: number;
  periodDays: number;
  photos: Photo[];
  /** How many different days have photos. */
  days: number;
  favorites: Photo[];
  /** The day with the most photos, if any day has two or more. */
  busiest: { day: number; photos: Photo[] } | null;
  timeOfDay: { key: TimeKey; label: string; count: number; share: number }[];
  /** Null with fewer than 3 photos (not enough to call it). */
  topTime: TimeKey | null;
  /** Photo counts, Sunday → Saturday. */
  weekdays: number[];
  topWeekday: number | null;
  captions: { text: string; at: number }[];
  /** Year stories only: the monthsary with the most photos. */
  topAlbum: { n: number; count: number } | null;
  cover: Photo | undefined;
};

export function timeOfDay(ms: number): TimeKey {
  const h = toWall(ms).hour;
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

export function weekday(ms: number): number {
  const w = toWall(ms);
  return new Date(Date.UTC(w.year, w.month - 1, w.day)).getUTCDay();
}

/** Index of the largest count (the first one wins ties). */
const argmax = (counts: number[]) => counts.reduce((best, c, i) => (c > counts[best] ? i : best), 0);

function build(kind: Wrap["kind"], n: number, title: string, firstAlbum: number, all: Photo[]): Wrap {
  const photos = all
    .filter((p) => {
      const a = albumOf(p);
      return a >= firstAlbum && a <= n;
    })
    .sort((a, b) => a.takenAt.localeCompare(b.takenAt));
  const at = (p: Photo) => Date.parse(p.takenAt);

  const from = albumReadyAt(firstAlbum - 1);
  const to = albumReadyAt(n) - 1;

  const days = groupByDay(photos);
  const biggestDay = days.reduce<(typeof days)[number] | null>(
    (best, d) => (!best || d.photos.length > best.photos.length ? d : best),
    null,
  );

  const timeCounts = TIMES.map((t) => photos.filter((p) => timeOfDay(at(p)) === t.key).length);
  const weekdays = WEEKDAYS.map((_, i) => photos.filter((p) => weekday(at(p)) === i).length);

  let topAlbum: Wrap["topAlbum"] = null;
  if (kind === "year" && photos.length > 0) {
    const counts = new Map<number, number>();
    for (const p of photos) counts.set(albumOf(p), (counts.get(albumOf(p)) ?? 0) + 1);
    const [bestN, bestCount] = [...counts.entries()].reduce((a, b) => (b[1] > a[1] ? b : a));
    topAlbum = { n: bestN, count: bestCount };
  }

  return {
    kind,
    n,
    title,
    from,
    to,
    periodDays: Math.round((to + 1 - from) / DAY),
    photos,
    days: days.length,
    favorites: photos.filter((p) => p.favorite),
    busiest: biggestDay && biggestDay.photos.length >= 2 ? biggestDay : null,
    timeOfDay: TIMES.map((t, i) => ({
      ...t,
      count: timeCounts[i],
      share: photos.length ? timeCounts[i] / photos.length : 0,
    })),
    topTime: photos.length >= 3 ? TIMES[argmax(timeCounts)].key : null,
    weekdays,
    topWeekday: photos.length >= 3 ? argmax(weekdays) : null,
    captions: photos.filter((p) => p.caption?.trim()).map((p) => ({ text: p.caption!.trim(), at: at(p) })),
    topAlbum,
    cover: keyPhoto(photos),
  };
}

/** The story for one monthsary album. */
export function wrapMonth(n: number, photos: Photo[]): Wrap {
  return build("month", n, monthsaryTitle(n), n, photos);
}

/** The story for a whole year together, ending on anniversary `years`. */
export function wrapYear(years: number, photos: Photo[]): Wrap {
  const n = years * 12;
  return build("year", n, `Our ${ordinal(years)} Year`, n - 11, photos);
}

/** Up to `max` photos spread evenly through the story, favorites always kept. */
export function montage(photos: Photo[], max = 18): Photo[] {
  if (photos.length <= max) return photos;
  const keep = new Set(photos.filter((p) => p.favorite).slice(0, max).map((p) => p.id));
  const step = photos.length / (max - keep.size || 1);
  for (let i = 0; keep.size < max && i < photos.length; i += step) keep.add(photos[Math.floor(i)].id);
  return photos.filter((p) => keep.has(p.id));
}
