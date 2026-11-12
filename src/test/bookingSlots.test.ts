import { describe, it, expect } from "vitest";
import { overlapsBooking, isLongJobDayAvailable, isStartOfferable, dayHasFreeTime, daySlots } from "@/lib/longJobBooking";

const rules = [0, 1, 2, 3, 4].map((d) => ({ day_of_week: d, start_time: "09:00", end_time: "17:00" }));
const at = (h: number, m = 0) => new Date(2026, 10, 12, h, m); // Thu Nov 12 2026

describe("overlap check", () => {
  const busy = [{ start_datetime: at(9).toISOString(), end_datetime: at(17).toISOString() }];
  it("9:00 is taken when a 9–5 booking exists", () => {
    expect(overlapsBooking(at(9), at(10), busy)).toBe(true);
  });
  it("a time ending exactly when a booking starts is free", () => {
    expect(overlapsBooking(at(8), at(9), busy)).toBe(false);
    expect(overlapsBooking(at(17), at(18), busy)).toBe(false);
  });
});

describe("minimum notice", () => {
  it("a time less than one hour away is not offered", () => {
    expect(isStartOfferable(at(10, 30), at(10))).toBe(false);
    expect(isStartOfferable(at(11), at(10))).toBe(true);
  });
});

describe("long jobs", () => {
  it("today is not offered after opening time", () => {
    expect(isLongJobDayAvailable(at(0), rules, [], at(9, 30))).toBe(false);
  });
  it("today is not offered when opening is less than one hour away", () => {
    expect(isLongJobDayAvailable(at(0), rules, [], at(8, 30))).toBe(false);
    expect(isLongJobDayAvailable(at(0), rules, [], at(7, 0))).toBe(true);
  });
  it("a day with a booking covering opening time is not offered", () => {
    const busy = [{ start_datetime: at(9).toISOString(), end_datetime: at(17).toISOString() }];
    expect(isLongJobDayAvailable(at(0), rules, busy, at(6))).toBe(false);
  });
});

describe("day has a free time", () => {
  const day = at(0);
  it("an open day with nothing booked has a free time", () => {
    expect(dayHasFreeTime(day, rules, [], 60, at(6))).toBe(true);
  });
  it("a closed day has no free time", () => {
    expect(dayHasFreeTime(new Date(2026, 10, 14), rules, [], 60, at(6))).toBe(false);
  });
  it("a fully booked day has no free time", () => {
    const busy = [{ start_datetime: at(9).toISOString(), end_datetime: at(17).toISOString() }];
    expect(dayHasFreeTime(day, rules, busy, 60, at(6))).toBe(false);
  });
  it("today has no free time when the last start is less than one hour away", () => {
    expect(dayHasFreeTime(day, rules, [], 60, at(15, 30))).toBe(false);
    expect(dayHasFreeTime(day, rules, [], 60, at(15))).toBe(true);
  });
  it("one open half hour is enough for a 30 minute job", () => {
    const busy = [{ start_datetime: at(9).toISOString(), end_datetime: at(16, 30).toISOString() }];
    expect(daySlots(day, rules, busy, 30, at(6))).toEqual(["4:30 PM"]);
  });
  it("long jobs use the long job rule", () => {
    expect(dayHasFreeTime(day, rules, [], 600, at(6))).toBe(true);
    expect(dayHasFreeTime(day, rules, [], 600, at(9, 30))).toBe(false);
  });
});
