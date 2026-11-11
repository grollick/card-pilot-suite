import { supabase } from "@/integrations/supabase/client";

interface CaptureLeadParams {
  ownerId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source?: string;
  activityType?: string;
  activityTitle?: string;
  activityDescription?: string | null;
  handle?: string | null;
  metaJson?: Record<string, unknown>;
}

interface CaptureLeadResult {
  lead_id: string;
  is_existing: boolean;
  stage_id: string | null;
}

/**
 * Captures through the public server endpoint, which schedules follow-ups and notifies the owner.
 * Handles: contact matching (email/phone), pipeline assignment,
 * activity logging, analytics events, and daily_metrics updates.
 */
export async function captureLead(params: CaptureLeadParams): Promise<CaptureLeadResult | null> {
  const { data, error } = await supabase.functions.invoke("create-booking", {
    body: { action: "capture_lead", ...params, email: params.email || null, phone: params.phone || null },
  });

  if (error) {
    console.error("capture_lead error:", error.message);
    throw new Error(`capture_lead failed: ${error.message}`);
  }

  return data as unknown as CaptureLeadResult;
}

/** Collect visitor attribution metadata from the current page */
export function getVisitorMeta(): Record<string, string> {
  const url = new URL(window.location.href);
  return {
    referrer: document.referrer || "",
    utm_source: url.searchParams.get("utm_source") || "",
    utm_medium: url.searchParams.get("utm_medium") || "",
    utm_campaign: url.searchParams.get("utm_campaign") || "",
    user_agent: navigator.userAgent || "",
    screen: `${screen.width}x${screen.height}`,
    capture_url: window.location.href,
  };
}
