import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, CheckCircle2, Share2, Users, MessageSquare, ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfileCache } from "@/hooks/useProfileCache";
import { useCard } from "@/hooks/useCard";

const STORAGE_KEY = "guzzl_you_are_live_dismissed";

export default function YouAreLiveBanner() {
  const { data: profile } = useProfileCache();
  const { data: card } = useCard();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(STORAGE_KEY) === "true");
  const [showConfetti, setShowConfetti] = useState(false);

  const isLive = card?.status === "published";
  // Show for first 7 days — use updated_at as proxy if created_at unavailable
  const cardDate = card?.created_at || card?.updated_at;
  const isNew = cardDate
    ? Date.now() - new Date(cardDate).getTime() < 7 * 24 * 60 * 60 * 1000
    : false;

  const show = isLive && isNew && !dismissed;

  useEffect(() => {
    if (show) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (!show) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(STORAGE_KEY, "true");
  };

  const actions = [
    { icon: MessageSquare, label: "Respond to leads", desc: "Check your CRM for new contacts", to: "/app/contacts" },
    { icon: Share2, label: "Share your card", desc: "Send your link or QR code", to: "/app/share" },
    { icon: Users, label: "Invite others", desc: "Earn Pro access with referrals", to: "/app/referrals" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl border border-success/30 bg-gradient-to-br from-success/8 via-background to-primary/5 p-6 overflow-hidden"
      >
        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-success/15 flex items-center justify-center">
            <Rocket className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              You are live!
              {showConfetti && <Sparkles className="h-4 w-4 text-warning animate-pulse" />}
            </h3>
            <p className="text-sm text-muted-foreground">Your card is published and ready to capture leads</p>
          </div>
        </div>

        {/* Next steps */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          What to do next
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-card-hover hover:border-border/80 transition-all text-left group active:scale-[0.98]"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <action.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
