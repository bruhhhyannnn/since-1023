import type { Photo } from "./photos";
import { albumFor, startOfDay } from "./time";

export const albumOf = (p: Photo) => albumFor(Date.parse(p.takenAt));

/** Photos grouped by monthsary album, each album oldest → newest. */
export function groupByAlbum(photos: Photo[]): Map<number, Photo[]> {
  const groups = new Map<number, Photo[]>();
  for (const p of photos) {
    const n = albumOf(p);
    const list = groups.get(n);
    if (list) list.push(p);
    else groups.set(n, [p]);
  }
  for (const list of groups.values()) list.sort((a, b) => a.takenAt.localeCompare(b.takenAt));
  return groups;
}

/** The album's cover: the first favorite, or else the first photo. */
export function keyPhoto(photos: Photo[]): Photo | undefined {
  return photos.find((p) => p.favorite) ?? photos[0];
}

/** Photos (already oldest → newest) split into Philippine calendar days. */
export function groupByDay(photos: Photo[]): { day: number; photos: Photo[] }[] {
  const days: { day: number; photos: Photo[] }[] = [];
  for (const p of photos) {
    const day = startOfDay(Date.parse(p.takenAt));
    const last = days[days.length - 1];
    if (last && last.day === day) last.photos.push(p);
    else days.push({ day, photos: [p] });
  }
  return days;
}
