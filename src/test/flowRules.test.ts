import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const signup = readFileSync("drizzle/migrations/0002_safe_signup_referral_and_lifecycle.sql", "utf8");
const booking = readFileSync("drizzle/migrations/0003_server_followup_scheduling_and_new_account_hours.sql", "utf8");

describe("sign-up and booking rules", () => {
  it("accepts only UUID-shaped referral values before attempting a cast", () => {
    const expression = signup.match(/referral_text ~\* '([^']+)'/);
    expect(expression).not.toBeNull();
    const valid = new RegExp(expression?.[1] ?? "(?!)", "i");
    expect(valid.test("not-a-uuid")).toBe(false);
    expect(valid.test("")).toBe(false);
    expect(valid.test("79594574-231b-4377-8504-121f71a6ec53")).toBe(true);
    expect(signup).toMatch(/SELECT id INTO referral_id FROM auth\.users WHERE id = referral_text::uuid/);
  });

  it("defaults new-account booking hours to Monday through Friday, 09:00–17:00", () => {
    const hours = booking.match(/SELECT NEW\.user_id, day, '([^']+)'::time, '([^']+)'::time FROM generate_series\((\d+), (\d+)\)/);
    expect(hours?.slice(1)).toEqual(["09:00", "17:00", "0", "4"]);
  });

  it("does not assign default hours to accounts created before rollout", () => {
    const boundary = booking.match(/created_at >= '([^']+)'::timestamptz/);
    expect(boundary?.[1]).toBe("2026-11-11T23:34:44Z");
    expect(new Date("2026-11-10T00:00:00Z").getTime()).toBeLessThan(new Date(boundary?.[1] ?? "").getTime());
  });
});