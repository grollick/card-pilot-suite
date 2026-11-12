import { describe, it, expect } from "vitest";
import { isLongJob, isLongJobDayAvailable, dayWindow } from "@/lib/longJobBooking";

const rules = [0, 1, 2, 3, 4].map((d) => ({ day_of_week: d, start_time: "09:00", end_time: "17:00" }));
const monday = new Date(2026, 10, 16); // Mon
const saturday = new Date(2026, 10, 21);

describe("long job rule", () => {
  it("a 1440-minute job is longer than an 8-hour day", () => expect(isLongJob(1440, rules)).toBe(true));
  it("a 480-minute job fits an 8-hour day", () => expect(isLongJob(480, rules)).toBe(false));
});

describe("long job day availability", () => {
  it("open day with no bookings is available", () => expect(isLongJobDayAvailable(monday, rules, [])).toBe(true));
  it("closed day is not available", () => expect(isLongJobDayAvailable(saturday, rules, [])).toBe(false));
  it("a booking covering opening time blocks the day", () => {
    const w = dayWindow(monday, rules)!;
    const b = [{ start_datetime: w.open.toISOString(), end_datetime: w.close.toISOString() }];
    expect(isLongJobDayAvailable(monday, rules, b)).toBe(false);
  });
  it("a booking later in the day does not block it", () => {
    const s = new Date(2026, 10, 16, 13); const e = new Date(2026, 10, 16, 14);
    expect(isLongJobDayAvailable(monday, rules, [{ start_datetime: s.toISOString(), end_datetime: e.toISOString() }])).toBe(true);
  });
});
