import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const DEFAULT_TIMEZONE = "America/Toronto";

/** Returns the zone if the runtime recognises it, otherwise null. */
export function validTimezone(tz: unknown): string | null {
  if (typeof tz !== "string" || !tz || tz.length > 64) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return null;
  }
}

export function formatBookingTimes(start: string | Date, end: string | Date, tz?: string | null) {
  const timeZone = validTimezone(tz) || DEFAULT_TIMEZONE;
  const s = new Date(start);
  const e = new Date(end);
  const date = s.toLocaleDateString("en-US", { timeZone, weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const shortDate = s.toLocaleDateString("en-US", { timeZone, weekday: "short", month: "short", day: "numeric" });
  const t = (d: Date) => d.toLocaleTimeString("en-US", { timeZone, hour: "numeric", minute: "2-digit" });
  return { date, shortDate, time: `${t(s)} – ${t(e)}` };
}

/** Queues a customer email via send-transactional-email. Returns true only when queued. */
export async function queueCustomerEmail(
  client: SupabaseClient,
  bookingId: string,
  templateName: string,
  recipientEmail: string,
  idempotencyKey: string,
  templateData: Record<string, unknown>,
): Promise<boolean> {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return false;
  const { error } = await client.functions.invoke("send-transactional-email", {
    headers: { Authorization: `Bearer ${serviceKey}`, "x-internal-service-key": serviceKey },
    body: { templateName, recipientEmail, idempotencyKey, templateData },
  });
  if (error) {
    const response = error.context instanceof Response ? error.context : null;
    const detail = response ? await response.json().catch(() => ({})) : {};
    console.error("Booking email failed", { bookingId, templateName, status: response?.status, error: detail.error || error.message });
    return false;
  }
  return true;
}
