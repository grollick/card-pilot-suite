import { describe, it, expect } from "vitest";
import { isLongJob, isLongJobDayAvailable, dayWindow, workingDaysNeeded, longJobSpan, daySlots, overlapsBooking, dayHasFreeTime, isWithinBookingWindow } from "@/lib/longJobBooking";

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
  it("a booking later in the day now blocks it too", () => {
    const s = new Date(2026, 10, 16, 11); const e = new Date(2026, 10, 16, 12);
    expect(isLongJobDayAvailable(monday, rules, [{ start_datetime: s.toISOString(), end_datetime: e.toISOString() }], new Date(2026, 10, 1))).toBe(false);
  });
});

const now = new Date(2026, 10, 1, 8);

describe("working days needed", () => {
  it("600 minutes is 1 day", () => expect(workingDaysNeeded(600)).toBe(1));
  it("1440 minutes is 1 day", () => expect(workingDaysNeeded(1440)).toBe(1));
  it("2880 minutes is 2 days", () => expect(workingDaysNeeded(2880)).toBe(2));
  it("4000 minutes is 3 days", () => expect(workingDaysNeeded(4000)).toBe(3));
});

describe("multi-day long jobs", () => {
  const friday = new Date(2026, 10, 20);
  it("a 2 day job starting Friday uses Friday and the next Monday", () => {
    const span = longJobSpan(friday, rules, 2880)!;
    expect(span.days.map((d) => d.getDate())).toEqual([20, 23]);
    expect(span.open).toEqual(new Date(2026, 10, 20, 9));
    expect(span.close).toEqual(new Date(2026, 10, 23, 17));
  });
  it("a start day is refused when day two already has a booking", () => {
    const b = [{ start_datetime: new Date(2026, 10, 17, 11).toISOString(), end_datetime: new Date(2026, 10, 17, 12).toISOString() }];
    expect(isLongJobDayAvailable(monday, rules, b, now, 2880)).toBe(false);
    expect(isLongJobDayAvailable(monday, rules, [], now, 2880)).toBe(true);
  });
  it("a saved 2 day booking keeps other customers off day two", () => {
    const span = longJobSpan(monday, rules, 2880)!;
    const saved = [{ start_datetime: span.open.toISOString(), end_datetime: span.close.toISOString() }];
    const tuesday = new Date(2026, 10, 17);
    expect(daySlots(tuesday, rules, saved, 60, now)).toEqual([]);
    expect(overlapsBooking(new Date(2026, 10, 17, 13), new Date(2026, 10, 17, 14), saved)).toBe(true);
    expect(isLongJobDayAvailable(tuesday, rules, saved, now, 1440)).toBe(false);
  });
});

describe("60 day booking window", () => {
  it("day 60 is bookable, day 61 is not", () => {
    expect(isWithinBookingWindow(new Date(2026, 10, 1 + 60), now)).toBe(true);
    expect(isWithinBookingWindow(new Date(2026, 10, 1 + 61), now)).toBe(false);
  });
  it("an open, free day past day 60 is greyed out", () => {
    const day61 = new Date(2026, 10, 1 + 61); // Jan 1 2027, a Friday
    expect(dayHasFreeTime(day61, rules, [], 60, now)).toBe(false);
    expect(dayHasFreeTime(new Date(2026, 11, 31), rules, [], 60, now)).toBe(true);
  });
});
