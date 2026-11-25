/**
 * Which new photos are already in our albums (or picked twice in the same
 * batch). Photos match when they were taken at the same second.
 */
export function duplicateFlags(times: (number | undefined)[], existing: number[]): boolean[] {
  const seen = new Set(existing.map((t) => Math.floor(t / 1000)));
  return times.map((t) => {
    if (t === undefined) return false;
    const second = Math.floor(t / 1000);
    if (seen.has(second)) return true;
    seen.add(second);
    return false;
  });
}
