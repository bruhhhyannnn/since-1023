/*
 * Small helpers for our own date & time picker (no browser date inputs).
 * Everything here is plain calendar math on year/month/day numbers.
 */

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

export type Day = { year: number; month: number; day: number; inMonth: boolean };

/** The weeks shown for a month (Sunday first), including the edges of the months around it. */
export function monthGrid(year: number, month: number): Day[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const start = Date.UTC(year, month - 1, 1 - first.getUTCDay());
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const weeks = Math.ceil((first.getUTCDay() + daysInMonth) / 7);
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const d = new Date(start + i * 86_400_000);
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
      inMonth: d.getUTCMonth() + 1 === month,
    };
  });
}

export function shiftMonth(view: { year: number; month: number }, delta: number) {
  const index = view.year * 12 + (view.month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** 0-23 → 1-12 plus AM/PM */
export function to12h(hour: number): { hour: number; pm: boolean } {
  return { hour: hour % 12 === 0 ? 12 : hour % 12, pm: hour >= 12 };
}

/** 1-12 plus AM/PM → 0-23 */
export function from12h(hour: number, pm: boolean): number {
  return (hour % 12) + (pm ? 12 : 0);
}

/** Same calendar day? */
export const sameDate = (a: { year: number; month: number; day: number }, b: { year: number; month: number; day: number }) =>
  a.year === b.year && a.month === b.month && a.day === b.day;

/** Compare calendar days: negative if a is before b. */
export const compareDate = (a: { year: number; month: number; day: number }, b: { year: number; month: number; day: number }) =>
  a.year - b.year || a.month - b.month || a.day - b.day;
