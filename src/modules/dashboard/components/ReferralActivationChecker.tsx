import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Silent component that checks referral activation on dashboard load.
 * Runs once per session — no UI rendered.
 */
export default function ReferralActivationChecker() {
  const { user } = useAuth();
  const checked = useRef(false);

  useEffect(() => {
    if (!user || checked.current) return;
    checked.current = true;

    supabase.functions
      .invoke("referral-system", { body: { action: "check_activation" } })
      .catch(() => {
        // Non-critical, silently ignore
      });
  }, [user]);

  return null;
}
