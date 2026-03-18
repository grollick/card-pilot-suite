import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, Sparkles, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function FirstLeadCelebration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const alreadySeen = localStorage.getItem("cp_first_lead_celebrated");

  const { data: leadCount } = useQuery({
    queryKey: ["first-lead-count", user?.id],
    enabled: !!user && !alreadySeen,
    staleTime: 30_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count ?? 0;
    },
  });

  const shouldShow = leadCount === 1 && !alreadySeen && !dismissed;

  useEffect(() => {
    if (shouldShow) {
      // Auto-dismiss after 30 seconds
      const timer = setTimeout(() => {
        localStorage.setItem("cp_first_lead_celebrated", "true");
        setDismissed(true);
      }, 30_000);
      return () => clearTimeout(timer);
    }
  }, [shouldShow]);

  const handleDismiss = () => {
    localStorage.setItem("cp_first_lead_celebrated", "true");
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: "spring", damping: 15, stiffness: 200 }}
          className="rounded-xl border-2 border-success/40 bg-gradient-to-br from-success/10 via-background to-primary/5 p-6 relative overflow-hidden"
        >
          {/* Sparkle decorations */}
          <div className="absolute top-2 right-3 text-warning/30">
            <Star className="h-5 w-5 animate-pulse" />
          </div>
          <div className="absolute bottom-3 left-4 text-primary/20">
            <Sparkles className="h-4 w-4 animate-pulse" style={{ animationDelay: "0.5s" }} />
          </div>

          <div className="text-center relative z-10">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <PartyPopper className="h-10 w-10 text-success mx-auto mb-3" />
            </motion.div>

            <h3 className="text-lg font-bold text-foreground mb-1">
              🎉 Your First Lead Just Arrived!
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Your card is working! Someone found you and wants to connect. Keep sharing to get more leads and bookings.
            </p>

            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => {
                  handleDismiss();
                  navigate("/app/contacts");
                }}
                size="sm"
                className="gap-1.5 shadow-glow"
              >
                View Your Lead
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-muted-foreground"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
