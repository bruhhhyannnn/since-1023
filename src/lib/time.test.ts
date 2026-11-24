import { describe, expect, it } from "vitest";
import {
  DAY,
  START,
  albumFor,
  albumRange,
  albumReadyAt,
  celebrating,
  completedMonths,
  dayNumber,
  elapsed,
  fromExifValue,
  fromInputValue,
  fromWall,
  monthsaryAt,
  monthsaryTitle,
  nextAnniversary,
  nextMonthsary,
  ordinal,
  spanText,
  toInputValue,
  totals,
  upcomingMilestones,
} from "./time";
import { formatDate, formatRange } from "./format";

const ph = (y: number, mo: number, d: number, h = 0, mi = 0, s = 0) =>
  fromWall({ year: y, month: mo, day: d, hour: h, minute: mi, second: s });

describe("start", () => {
  it("is Oct 23, 2019 at 7:00 PM Philippine time (11:00 UTC)", () => {
    expect(new Date(START).toISOString()).toBe("2019-10-23T11:00:00.000Z");
    expect(formatDate(START, "long")).toBe("Wednesday, October 23, 2019");
    expect(formatDate(START, "time")).toBe("7:00 PM");
  });
});

describe("elapsed", () => {
  it("is zero at the start", () => {
    expect(elapsed(START)).toMatchObject({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it("counts exact hours, minutes and seconds from 7 PM", () => {
    expect(elapsed(ph(2019, 10, 23, 21, 30, 15))).toMatchObject({ days: 0, hours: 2, minutes: 30, seconds: 15 });
    expect(elapsed(ph(2019, 10, 24, 18, 59, 59))).toMatchObject({ days: 0, hours: 23, minutes: 59, seconds: 59 });
    expect(elapsed(ph(2019, 10, 24, 19))).toMatchObject({ days: 1, hours: 0 });
  });

  it("only completes a month at 7 PM on the 23rd", () => {
    expect(elapsed(ph(2026, 11, 23, 18, 59, 59))).toMatchObject({
      years: 7,
      months: 0,
      days: 30,
      hours: 23,
      minutes: 59,
      seconds: 59,
    });
    expect(elapsed(ph(2026, 11, 23, 19))).toMatchObject({ years: 7, months: 1, days: 0, hours: 0 });
  });

  it("matches the day this site was built", () => {
    // Nov 24, 2026 4:24 PM in Manila
    expect(elapsed(ph(2026, 11, 24, 16, 24))).toMatchObject({
      years: 7,
      months: 1,
      days: 0,
      hours: 21,
      minutes: 24,
      seconds: 0,
      totalMonths: 85,
    });
  });

  it("does not depend on the machine's time zone", () => {
    expect(elapsed(Date.parse("2020-10-23T11:00:00Z"))).toMatchObject({ years: 1, months: 0, days: 0, hours: 0 });
  });
});

describe("totals", () => {
  it("counts whole days and weeks, including leap days", () => {
    const t = totals(ph(2026, 11, 24, 19));
    // 7 years (incl. Feb 29 2020 and 2024) = 2557 days, + 32 days
    expect(t.days).toBe(2589);
    expect(t.weeks).toBe(Math.floor(2589 / 7));
    expect(t.hours).toBe(2589 * 24);
    expect(t.months).toBe(85);
    expect(t.years).toBe(7);
  });

  it("numbers the days starting at day 1", () => {
    expect(dayNumber(START)).toBe(1);
    expect(dayNumber(START + DAY - 1)).toBe(1);
    expect(dayNumber(START + DAY)).toBe(2);
  });
});

describe("monthsaries", () => {
  it("falls on the 23rd at 7 PM", () => {
    expect(monthsaryAt(1)).toBe(ph(2019, 11, 23, 19));
    expect(monthsaryAt(3)).toBe(ph(2020, 1, 23, 19));
    expect(monthsaryAt(86)).toBe(ph(2026, 12, 23, 19));
  });

  it("knows which one is next", () => {
    expect(nextMonthsary(ph(2026, 11, 24, 10))).toEqual({ n: 86, at: ph(2026, 12, 23, 19) });
    expect(nextMonthsary(ph(2026, 12, 23, 18))).toEqual({ n: 86, at: ph(2026, 12, 23, 19) });
    expect(nextMonthsary(ph(2026, 12, 23, 19))).toEqual({ n: 87, at: ph(2027, 1, 23, 19) });
    expect(completedMonths(ph(2026, 12, 23, 19))).toBe(86);
  });

  it("knows the next anniversary", () => {
    expect(nextAnniversary(ph(2026, 11, 24))).toEqual({ years: 8, at: ph(2027, 10, 23, 19) });
  });

  it("names them", () => {
    expect(monthsaryTitle(1)).toBe("1st Monthsary");
    expect(monthsaryTitle(86)).toBe("86th Monthsary");
    expect(monthsaryTitle(84)).toBe("7th Anniversary");
    expect(monthsaryTitle(100)).toBe("100th Monthsary");
    expect(spanText(86)).toBe("7 years & 2 months");
    expect(spanText(84)).toBe("7 years");
    expect(spanText(1)).toBe("1 month");
  });

  it("uses correct ordinals", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111, 112, 113].map(ordinal)).toEqual([
      "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "101st", "111th", "112th", "113th",
    ]);
  });
});

describe("albums", () => {
  it("runs from the 23rd through the 22nd", () => {
    expect(albumFor(ph(2026, 10, 23, 0, 0))).toBe(85);
    expect(albumFor(ph(2026, 11, 22, 23, 59, 59))).toBe(85);
    expect(albumFor(ph(2026, 11, 23, 0, 0))).toBe(86);
    expect(albumFor(ph(2026, 11, 23, 21))).toBe(86);
    expect(albumFor(ph(2026, 12, 1, 12))).toBe(86);
    expect(albumFor(ph(2026, 12, 22, 23, 59))).toBe(86);
    expect(albumFor(ph(2026, 12, 23, 0, 0))).toBe(87);
  });

  it("is complete at exactly 12:00 AM on the monthsary day", () => {
    expect(albumReadyAt(86)).toBe(ph(2026, 12, 23, 0, 0));
    expect(albumFor(albumReadyAt(86) - 1)).toBe(86);
    expect(albumFor(albumReadyAt(86))).toBe(87);
  });

  it("handles year boundaries", () => {
    expect(albumFor(ph(2026, 12, 31))).toBe(87);
    expect(albumFor(ph(2027, 1, 22))).toBe(87);
    expect(albumFor(ph(2027, 1, 23))).toBe(88);
  });

  it("starts album 1 on day one; anything earlier is album 0", () => {
    expect(albumFor(ph(2019, 10, 23, 8))).toBe(1);
    expect(albumFor(ph(2019, 11, 22, 23))).toBe(1);
    expect(albumFor(ph(2019, 11, 23))).toBe(2);
    expect(albumFor(ph(2019, 10, 22, 23, 59))).toBe(0);
    expect(albumFor(ph(2018, 5, 1))).toBe(0);
    expect(monthsaryTitle(0)).toBe("Before Us");
  });

  it("describes each album's date range", () => {
    const r = albumRange(86);
    expect(formatRange(r.from, r.to)).toBe("Nov 23 – Dec 22, 2026");
    const r2 = albumRange(87);
    expect(formatRange(r2.from, r2.to)).toBe("Dec 23, 2026 – Jan 22, 2027");
    const r1 = albumRange(1);
    expect(formatRange(r1.from, r1.to)).toBe("Oct 23 – Nov 22, 2019");
    expect(albumRange(0).from).toBeNull();
    expect(formatDate(albumRange(0).to)).toBe("Oct 22, 2019");
  });
});

describe("celebrating", () => {
  it("congratulates all day on the 23rd, starting at 12:00 AM", () => {
    expect(celebrating(ph(2026, 11, 22, 23, 59, 59))).toBeNull();
    expect(celebrating(ph(2026, 11, 23, 0, 0))).toBe(85);
    expect(celebrating(ph(2026, 11, 23, 18, 59))).toBe(85);
    expect(celebrating(ph(2026, 11, 23, 23, 59, 59))).toBe(85);
    expect(celebrating(ph(2026, 11, 24, 0, 0))).toBeNull();
    expect(celebrating(ph(2027, 10, 23, 0, 0))).toBe(96);
  });

  it("doesn't celebrate day one itself", () => {
    expect(celebrating(ph(2019, 10, 23, 20))).toBeNull();
  });
});

describe("milestones", () => {
  it("lists upcoming round numbers in order", () => {
    const now = ph(2026, 11, 24, 16, 24);
    const list = upcomingMilestones(now, 10);
    expect(list[0]).toMatchObject({ label: "2,600 days together", at: START + 2600 * DAY });
    expect(list.map((m) => m.at)).toEqual([...list.map((m) => m.at)].sort((a, b) => a - b));
    expect(list.every((m) => m.at > now)).toBe(true);
    expect(list.some((m) => m.label === "Our 100th Monthsary")).toBe(true);
  });
});

describe("date inputs", () => {
  it("round-trips datetime-local values as Philippine time", () => {
    const ms = ph(2026, 2, 14, 18, 30);
    expect(toInputValue(ms)).toBe("2026-02-14T18:30");
    expect(fromInputValue("2026-02-14T18:30")).toBe(ms);
    expect(fromInputValue("nope")).toBeNull();
  });

  it("reads EXIF dates as Philippine time", () => {
    expect(fromExifValue("2024:05:12 18:30:00")).toBe(ph(2024, 5, 12, 18, 30));
    expect(fromExifValue("0000:00:00 00:00:00")).toBeNull();
  });
});
