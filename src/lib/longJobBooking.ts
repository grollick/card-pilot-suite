export interface AvailabilityRule { day_of_week: number; start_time: string; end_time: string }
export interface BookingRange { start_datetime: string; end_datetime: string }

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };

/** day_of_week in our DB: 0=Mon .. 6=Sun */
export function dbDayOf(date: Date): number { const js = date.getDay(); return js === 0 ? 6 : js - 1; }

export function longestOpenWindowMinutes(rules: AvailabilityRule[]): number {
  return rules.reduce((max, r) => Math.max(max, toMin(r.end_time) - toMin(r.start_time)), 0);
}

/** A long job is longer than the pro's longest open window on any single day. */
export function isLongJob(durationMin: number | null | undefined, rules: AvailabilityRule[]): boolean {
  if (!durationMin || rules.length === 0) return false;
  return durationMin > longestOpenWindowMinutes(rules);
}

/** Opening and closing time of a given date (earliest open, latest close), or null if closed. */
export function dayWindow(date: Date, rules: AvailabilityRule[]): { open: Date; close: Date } | null {
  const day = rules.filter((r) => r.day_of_week === dbDayOf(date));
  if (day.length === 0) return null;
  const openMin = Math.min(...day.map((r) => toMin(r.start_time)));
  const closeMin = Math.max(...day.map((r) => toMin(r.end_time)));
  const at = (m: number) => { const d = new Date(date); d.setHours(Math.floor(m / 60), m % 60, 0, 0); return d; };
  return { open: at(openMin), close: at(closeMin) };
}

/** Long-job day is available when the pro is open and no active booking covers that day's opening time. */
export function isLongJobDayAvailable(date: Date, rules: AvailabilityRule[], bookings: BookingRange[], now: Date = new Date()): boolean {
  const w = dayWindow(date, rules);
  if (!w) return false;
  const t = w.open.getTime();
  if (!isStartOfferable(w.open, now)) return false;
  return !bookings.some((b) => new Date(b.start_datetime).getTime() <= t && t < new Date(b.end_datetime).getTime());
}

/** Minimum notice before a slot can be booked. */
export const MIN_NOTICE_MS = 60 * 60 * 1000;

/** A time can be offered only when it starts at least one hour from now. */
export function isStartOfferable(start: Date, now: Date = new Date()): boolean {
  return start.getTime() >= now.getTime() + MIN_NOTICE_MS;
}

/** True when [start, end) overlaps any active booking. */
export function overlapsBooking(start: Date, end: Date, bookings: BookingRange[]): boolean {
  return bookings.some((b) => start.getTime() < new Date(b.end_datetime).getTime() && end.getTime() > new Date(b.start_datetime).getTime());
}

const fmtTime = (d: Date) => {
  const h = d.getHours(); const m = d.getMinutes();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

/** Start times (e.g. "9:00 AM") a normal job can be booked at on a date: 30-minute steps inside opening hours, one hour notice, no overlap. */
export function daySlots(date: Date, rules: AvailabilityRule[], bookings: BookingRange[], durationMin: number | null | undefined, now: Date = new Date()): string[] {
  const rule = rules.find((r) => r.day_of_week === dbDayOf(date));
  if (!rule) return [];
  const duration = durationMin ?? 30;
  const at = (t: string) => { const d = new Date(date); const m = toMin(t); d.setHours(Math.floor(m / 60), m % 60, 0, 0); return d; };
  const dayEnd = at(rule.end_time);
  const slots: string[] = [];
  for (let cursor = at(rule.start_time); cursor < dayEnd; cursor = new Date(cursor.getTime() + 30 * 60000)) {
    const end = new Date(cursor.getTime() + duration * 60000);
    if (end > dayEnd) break;
    if (isStartOfferable(cursor, now) && !overlapsBooking(cursor, end, bookings)) slots.push(fmtTime(cursor));
  }
  return slots;
}

/** A day can be tapped only when it has at least one time that can be offered for the chosen service. */
export function dayHasFreeTime(date: Date, rules: AvailabilityRule[], bookings: BookingRange[], durationMin: number | null | undefined, now: Date = new Date()): boolean {
  if (isLongJob(durationMin, rules)) return isLongJobDayAvailable(date, rules, bookings, now);
  return daySlots(date, rules, bookings, durationMin, now).length > 0;
}
