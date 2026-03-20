import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * /q/:campaign — public QR campaign landing page.
 * Logs the scan then redirects to the card owner's public card.
 * No authentication required; only accesses qr_campaigns + profiles.
 */
export default function QRLanding() {
  const { campaign } = useParams();
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (!campaign || processed.current) return;
    processed.current = true;

    (async () => {
      try {
        // 1. Look up campaign by code
        const { data: qrCampaign, error } = await supabase
          .from("qr_campaigns")
          .select("id, user_id, active")
          .eq("code", campaign)
          .single();

        if (error || !qrCampaign) {
          navigate("/", { replace: true });
          return;
        }

        if (!qrCampaign.active) {
          navigate("/", { replace: true });
          return;
        }

        // 2. Get card owner's handle
        const { data: profile } = await supabase
          .from("public_profiles" as any)
          .select("handle")
          .eq("id", qrCampaign.user_id)
          .single();

        if (!profile?.handle) {
          navigate("/", { replace: true });
          return;
        }

        // 3. Parse device info
        const userAgent = navigator.userAgent;
        let device = "Desktop";
        if (/mobile|android|iphone/i.test(userAgent)) device = "Mobile";
        else if (/ipad|tablet/i.test(userAgent)) device = "Tablet";

        // 4. Log the scan (public insert — no auth needed)
        await supabase.from("qr_scans").insert({
          campaign_id: qrCampaign.id,
          user_id: qrCampaign.user_id,
          handle: profile.handle,
          device,
          referrer: document.referrer || null,
          user_agent: userAgent.slice(0, 500),
          meta_json: {
            timestamp: new Date().toISOString(),
            utm_source: "qr",
            utm_campaign: campaign,
          },
        });

        // 5. Log analytics event
        await supabase.from("analytics_events").insert({
          user_id: qrCampaign.user_id,
          handle: profile.handle,
          event_type: "card_view" as const,
          meta_json: {
            source: "qr_campaign",
            campaign_code: campaign,
            device,
          },
        });

        // 6. Redirect to public card with UTM params
        navigate(
          `/${profile.handle}?utm_source=qr&utm_campaign=${encodeURIComponent(campaign)}`,
          { replace: true }
        );
      } catch {
        navigate("/", { replace: true });
      }
    })();
  }, [campaign, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
