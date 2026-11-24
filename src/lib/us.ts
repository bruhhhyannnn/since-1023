/**
 * Everything that makes this site *ours*. Change names or details here and
 * the whole site (counter, albums, monthsary posts) follows.
 */
export const US = {
  me: "Bryan",
  her: "Cecilia",
  /** The moment it all started, in Philippine time: Oct 23, 2019, 7:00 PM. */
  start: { year: 2019, month: 10, day: 23, hour: 19, minute: 0 },
  timeZone: "Asia/Manila",
  /** Philippine time is UTC+8 all year (no daylight saving). */
  utcOffsetHours: 8,
} as const;

export const COUPLE = `${US.me} & ${US.her}`;
