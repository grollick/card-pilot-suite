import { motion } from "framer-motion";
import { Store, TrendingUp, Users, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function MarketplaceAwarenessWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user has marketplace listing
  const { data: profile } = useQuery({
    queryKey: ["marketplace-awareness-profile", user?.id],
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("marketplace_enabled, bio, profession_id")
        .eq("id", user!.id)
        .single();
      return data;
    },
  });

  // Check estimate duty status
  const { data: duty } = useQuery({
    queryKey: ["marketplace-awareness-duty", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("estimate_duty_status")
        .select("is_on_duty, leads_received")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const isListed = profile?.marketplace_enabled === true;
  const isOnDuty = duty?.is_on_duty === true;
  const leadsReceived = duty?.leads_received || 0;

  // Don't show if already fully active
  if (isListed && isOnDuty) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-5 space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Store className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Get Found on the Marketplace
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {!isListed
              ? "Activate your marketplace listing and let customers find you. Pros who list get 3x more leads on average."
              : "Go on duty to start receiving leads from customers searching for your services."
            }
          </p>
        </div>
      </div>

      {leadsReceived > 0 && (
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-[hsl(var(--success))]">
            <Users className="h-3 w-3" /> {leadsReceived} leads received
          </span>
          <span className="flex items-center gap-1 text-primary">
            <TrendingUp className="h-3 w-3" /> Active marketplace
          </span>
        </div>
      )}

      <div className="flex gap-2">
        {!isListed && (
          <Button size="sm" onClick={() => navigate("/app/settings")} className="gap-1.5 shadow-glow">
            Activate Listing <ArrowRight className="h-3 w-3" />
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => navigate("/discover")} className="gap-1.5">
          Browse Marketplace
        </Button>
      </div>
    </motion.div>
  );
}
