import type { Photo } from "./photos";
import { albumFor } from "./time";

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
