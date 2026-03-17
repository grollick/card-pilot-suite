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
 * Calls the centralized `capture_lead` DB function.
 * Handles: contact matching (email/phone), pipeline assignment,
 * activity logging, analytics events, and daily_metrics updates.
 */
export async function captureLead(params: CaptureLeadParams): Promise<CaptureLeadResult | null> {
  const { data, error } = await supabase.rpc("capture_lead", {
    p_owner_id: params.ownerId,
    p_name: params.name,
    p_email: params.email || null,
    p_phone: params.phone || null,
    p_source: params.source ?? "card_form",
    p_activity_type: params.activityType ?? "form_submitted",
    p_activity_title: params.activityTitle ?? "Contact form submitted",
    p_activity_description: params.activityDescription ?? null,
    p_meta_json: params.metaJson ?? {},
    p_handle: params.handle ?? null,
  });

  if (error) {
    console.error("capture_lead error:", error);
    return null;
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
