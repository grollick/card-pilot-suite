import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Share2, Copy, Check, ArrowRight, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Shows a motivational share prompt after the user receives a new lead.
 * Encourages them to share again while momentum is high.
 */
export default function PostLeadSharePrompt() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data } = useQuery({
    queryKey: ["post-lead-prompt", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const uid = user!.id;

      // Get lead count and most recent lead
      const [{ count }, { data: profile }, { data: recentLead }] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("profiles").select("handle, name, company").eq("id", uid).single(),
        supabase
          .from("leads")
          .select("name, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const leadCount = count ?? 0;
      const isRecent =
        recentLead?.created_at &&
        Date.now() - new Date(recentLead.created_at).getTime() < 24 * 60 * 60 * 1000;

      return {
        leadCount,
        isRecent,
        leadName: recentLead?.name ?? "Someone",
        handle: profile?.handle,
        company: profile?.company,
      };
    },
  });

  // Only show when there's a recent lead and at least 1 lead
  if (!data || !data.isRecent || data.leadCount === 0 || dismissed || !data.handle) return null;

  // Dismiss key to avoid showing repeatedly in same session
  const sessionKey = `cp_post_lead_prompt_${new Date().toDateString()}`;
  if (sessionStorage.getItem(sessionKey)) return null;

  const cardUrl = `${window.location.origin}/${data.handle}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    toast.success("Card link copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(sessionKey, "true");
    setDismissed(true);
  };

  const getMessage = () => {
    if (data.leadCount === 1) return "Your card just got its first lead! Share it more to keep the momentum going.";
    if (data.leadCount <= 5) return `${data.leadName} just reached out — you now have ${data.leadCount} leads. Keep sharing to grow!`;
    return `${data.leadName} just connected with you. You're on a roll with ${data.leadCount} leads!`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="rounded-xl border border-success/30 bg-gradient-to-r from-success/5 via-background to-primary/5 p-5 relative"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <Rocket className="h-3.5 w-3.5 text-primary" />
              You're Getting Leads!
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {getMessage()}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                size="sm"
                variant="default"
                className="gap-1.5 text-xs h-8"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy Card Link"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8"
                onClick={() => {
                  handleDismiss();
                  navigate("/app/card/qr");
                }}
              >
                <Share2 className="h-3.5 w-3.5" />
                Share Card
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
