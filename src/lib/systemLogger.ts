import { supabase } from "@/integrations/supabase/client";

type Severity = "info" | "warning" | "error" | "critical";

interface LogParams {
  eventType: string;
  severity?: Severity;
  message: string;
  meta?: Record<string, unknown>;
}

/**
 * Logs a system event to the system_events table.
 * Fire-and-forget — never throws.
 */
export async function logSystemEvent({
  eventType,
  severity = "error",
  message,
  meta = {},
}: LogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("system_events" as any).insert({
      event_type: eventType,
      severity,
      message,
      meta_data: meta,
      user_id: user?.id ?? null,
    });
  } catch (err) {
    // Silently fail — we never want logging itself to break the app
    console.error("[systemLogger] Failed to log event:", err);
  }
}
