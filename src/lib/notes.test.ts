import { describe, expect, it } from "vitest";
import { authorName, parseNewNote, recipientName } from "./notes";

describe("parseNewNote", () => {
  it("accepts a normal note and tidies it", () => {
    expect(parseNewNote({ author: "her", body: "  I love you \r\n so much  ", color: "blush", isPrivate: false })).toEqual({
      ok: true,
      note: { author: "her", body: "I love you \n so much", color: "blush", isPrivate: false },
    });
  });

  it("keeps notes private unless asked, and falls back to a safe color", () => {
    const r = parseNewNote({ author: "me", body: "hi", color: "neon" });
    expect(r).toEqual({ ok: true, note: { author: "me", body: "hi", color: "cream", isPrivate: true } });
  });

  it("rejects empty, too long, or authorless notes", () => {
    expect(parseNewNote({ author: "me", body: "   " }).ok).toBe(false);
    expect(parseNewNote({ author: "me", body: "x".repeat(1001) }).ok).toBe(false);
    expect(parseNewNote({ author: "someone", body: "hi" }).ok).toBe(false);
    expect(parseNewNote(null).ok).toBe(false);
  });

  it("names who it's from and to", () => {
    expect(authorName("me")).toBe("Bryan");
    expect(recipientName("me")).toBe("Cecilia");
    expect(authorName("her")).toBe("Cecilia");
  });
});
