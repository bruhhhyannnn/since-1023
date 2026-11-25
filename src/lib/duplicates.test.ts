import { describe, expect, it } from "vitest";
import { duplicateFlags } from "./duplicates";

describe("duplicateFlags", () => {
  const t = Date.UTC(2026, 10, 5, 10, 15, 30);
  it("flags photos already in the albums, to the second", () => {
    expect(duplicateFlags([t + 400, t + 1000, undefined], [t])).toEqual([true, false, false]);
  });
  it("flags the second copy within the same batch", () => {
    expect(duplicateFlags([t, t + 999, t + 5000], [])).toEqual([false, true, false]);
  });
});
