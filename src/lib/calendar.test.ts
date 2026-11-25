import { describe, expect, it } from "vitest";
import { compareDate, from12h, monthGrid, shiftMonth, to12h } from "./calendar";

describe("monthGrid", () => {
  it("starts on Sunday and covers whole weeks", () => {
    const oct2019 = monthGrid(2019, 10);
    expect(oct2019.length % 7).toBe(0);
    expect(oct2019[0]).toEqual({ year: 2019, month: 9, day: 29, inMonth: false });
    const first = oct2019.findIndex((d) => d.inMonth);
    expect(first).toBe(2); // Oct 1, 2019 was a Tuesday
    const our = oct2019.find((d) => d.inMonth && d.day === 23)!;
    expect(oct2019.indexOf(our) % 7).toBe(3); // a Wednesday
    expect(oct2019.filter((d) => d.inMonth)).toHaveLength(31);
  });

  it("handles leap years and short months", () => {
    expect(monthGrid(2024, 2).filter((d) => d.inMonth)).toHaveLength(29);
    expect(monthGrid(2026, 2).filter((d) => d.inMonth)).toHaveLength(28);
    expect(monthGrid(2026, 2)).toHaveLength(28); // Feb 2026 fits exactly in 4 weeks
  });
});

describe("helpers", () => {
  it("moves between months across years", () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
  });

  it("converts 12-hour time", () => {
    expect(to12h(0)).toEqual({ hour: 12, pm: false });
    expect(to12h(12)).toEqual({ hour: 12, pm: true });
    expect(to12h(19)).toEqual({ hour: 7, pm: true });
    expect(from12h(12, false)).toBe(0);
    expect(from12h(12, true)).toBe(12);
    expect(from12h(7, true)).toBe(19);
  });

  it("compares dates", () => {
    expect(compareDate({ year: 2026, month: 11, day: 5 }, { year: 2026, month: 11, day: 25 })).toBeLessThan(0);
    expect(compareDate({ year: 2027, month: 1, day: 1 }, { year: 2026, month: 12, day: 31 })).toBeGreaterThan(0);
  });
});
