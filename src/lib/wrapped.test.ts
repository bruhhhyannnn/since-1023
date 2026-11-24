import { describe, expect, it } from "vitest";
import { formatDate } from "./format";
import type { Photo } from "./photos";
import { fromWall } from "./time";
import { montage, timeOfDay, weekday, wrapMonth, wrapYear } from "./wrapped";

const ph = (y: number, mo: number, d: number, h = 12, mi = 0) =>
  fromWall({ year: y, month: mo, day: d, hour: h, minute: mi });

let id = 0;
const photo = (ms: number, extra: Partial<Photo> = {}): Photo => ({
  id: `p${++id}`,
  takenAt: new Date(ms).toISOString(),
  caption: null,
  favorite: false,
  url: "",
  thumbUrl: "",
  width: 1,
  height: 1,
  createdAt: "",
  ...extra,
});

describe("time of day and weekday", () => {
  it("uses Philippine time", () => {
    expect(timeOfDay(ph(2026, 11, 5, 4, 59))).toBe("night");
    expect(timeOfDay(ph(2026, 11, 5, 5))).toBe("morning");
    expect(timeOfDay(ph(2026, 11, 5, 12))).toBe("afternoon");
    expect(timeOfDay(ph(2026, 11, 5, 17))).toBe("evening");
    expect(timeOfDay(ph(2026, 11, 5, 21))).toBe("night");
    expect(weekday(ph(2019, 10, 23, 19))).toBe(3); // Wednesday
    expect(weekday(ph(2026, 11, 5, 23, 30))).toBe(4); // Thursday, even late at night
  });
});

describe("wrapMonth", () => {
  const photos = [
    photo(ph(2026, 10, 25, 11)),
    photo(ph(2026, 10, 31, 20), { favorite: true, caption: "  Halloween with you  " }),
    photo(ph(2026, 11, 5, 18)),
    photo(ph(2026, 11, 5, 19, 30), { favorite: true }),
    photo(ph(2026, 11, 5, 20)),
    photo(ph(2026, 11, 14, 22)),
    photo(ph(2026, 11, 23, 9)), // next album
    photo(ph(2026, 9, 30, 9)), // previous album
  ];
  const w = wrapMonth(85, photos);

  it("covers exactly the album's days", () => {
    expect(formatDate(w.from, "long")).toBe("Friday, October 23, 2026");
    expect(formatDate(w.to, "long")).toBe("Sunday, November 22, 2026");
    expect(w.periodDays).toBe(31);
    expect(w.photos).toHaveLength(6);
    expect(w.title).toBe("85th Monthsary");
  });

  it("finds the highlights", () => {
    expect(w.days).toBe(4);
    expect(w.favorites).toHaveLength(2);
    expect(w.busiest?.photos).toHaveLength(3);
    expect(formatDate(w.busiest!.day, "day")).toBe("Thursday, November 5");
    expect(w.topTime).toBe("evening");
    expect(w.timeOfDay.find((t) => t.key === "evening")?.count).toBe(4);
    expect(w.topWeekday).toBe(4); // Thursday
    expect(w.captions).toEqual([{ text: "Halloween with you", at: ph(2026, 10, 31, 20) }]);
    expect(w.cover?.favorite).toBe(true);
    expect(w.topAlbum).toBeNull();
  });

  it("holds back on stats it can't call", () => {
    const small = wrapMonth(85, [photo(ph(2026, 11, 1)), photo(ph(2026, 11, 2))]);
    expect(small.busiest).toBeNull();
    expect(small.topTime).toBeNull();
    expect(small.topWeekday).toBeNull();
  });
});

describe("wrapYear", () => {
  it("covers the twelve albums ending on the anniversary", () => {
    const photos = [
      photo(ph(2025, 10, 22)), // album 72, previous year
      photo(ph(2025, 10, 23)), // album 73, first of the year
      photo(ph(2026, 3, 1)),
      photo(ph(2026, 3, 2)),
      photo(ph(2026, 10, 22)), // album 84, last of the year
      photo(ph(2026, 10, 23)), // album 85, next year
    ];
    const w = wrapYear(7, photos);
    expect(w.title).toBe("Our 7th Year");
    expect(w.n).toBe(84);
    expect(w.photos).toHaveLength(4);
    expect(w.periodDays).toBe(365);
    expect(w.topAlbum).toEqual({ n: 77, count: 2 });
  });
});

describe("montage", () => {
  it("keeps favorites and spreads the rest", () => {
    const many = Array.from({ length: 40 }, (_, i) => photo(ph(2026, 11, 1, 0, i), { favorite: i === 37 }));
    const picked = montage(many, 10);
    expect(picked).toHaveLength(10);
    expect(picked.some((p) => p.favorite)).toBe(true);
    expect(picked.map((p) => p.takenAt)).toEqual([...picked.map((p) => p.takenAt)].sort());
  });
});
