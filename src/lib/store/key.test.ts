import { describe, expect, it } from "vitest";
import { describeKey, explainRls, keyProblem } from "./key";

const jwt = (role: string) =>
  `${Buffer.from('{"alg":"HS256"}').toString("base64url")}.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.sig`;

describe("describeKey", () => {
  it("tells the key types apart", () => {
    expect(describeKey("sb_secret_abc123")).toBe("secret");
    expect(describeKey("sb_publishable_abc123")).toBe("publishable");
    expect(describeKey(jwt("service_role"))).toBe("service_role");
    expect(describeKey(jwt("anon"))).toBe("anon");
    expect(describeKey('"sb_secret_abc"')).toBe("unknown");
  });

  it("only complains about keys that can't save photos", () => {
    expect(keyProblem("secret")).toBeNull();
    expect(keyProblem("service_role")).toBeNull();
    expect(keyProblem("publishable")).toMatch(/publishable/);
    expect(keyProblem("anon")).toMatch(/anon/);
  });

  it("explains row-level security errors without showing the key", () => {
    const msg = explainRls("new row violates row-level security policy", "publishable");
    expect(msg).toMatch(/SUPABASE_SECRET_KEY is set to the publishable/);
    expect(explainRls("new row violates row-level security policy", "secret")).toMatch(/service_role/);
    expect(explainRls("Bucket not found", "publishable")).toBe("Bucket not found");
  });
});
