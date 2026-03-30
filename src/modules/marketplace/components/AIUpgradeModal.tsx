import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PLAN_BENEFITS: Record<string, { headline: string; message: string; features: string[] }> = {
  free: {
    headline: "Unlock more with guzzl Copilot",
    message: "Keep replying faster and win more jobs with more AI assists.",
    features: [
      "100 AI assists per month",
      "Follow-up suggestions",
      "Profile rewrite assistant",
      "Priority support",
    ],
  },
  pro: {
    headline: "Supercharge your growth",
    message: "Get unlimited AI help and advanced growth insights.",
    features: [
      "500 AI assists per month",
      "Advanced growth analytics",
      "Featured placement",
      "Premium badge",
    ],
  },
};

interface Props {
  open: boolean;
  onClose: () => void;
  currentPlan?: string;
  reason?: "limit_reached" | "feature_locked";
  featureName?: string;
}

export default function AIUpgradeModal({ open, onClose, currentPlan = "free", reason = "limit_reached", featureName }: Props) {
  const navigate = useNavigate();
  const benefits = PLAN_BENEFITS[currentPlan] || PLAN_BENEFITS.free;
  const nextPlan = currentPlan === "pro" ? "Growth" : "Pro";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-xl"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>

            <h2 className="text-lg font-bold text-foreground text-center mb-1">
              {benefits.headline}
            </h2>

            <p className="text-sm text-muted-foreground text-center mb-1">
              {reason === "feature_locked" && featureName
                ? `${featureName} is available on ${nextPlan}.`
                : benefits.message}
            </p>

            <p className="text-xs text-muted-foreground text-center mb-4">
              Current plan: <span className="font-medium capitalize text-foreground">{currentPlan}</span>
            </p>

            <div className="space-y-2 mb-5">
              {benefits.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  <span className="text-foreground">{f}</span>
                </div>
              ))}
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => { onClose(); navigate("/pricing"); }}
            >
              <Zap className="h-4 w-4" />
              Upgrade to {nextPlan}
            </Button>

            <button
              onClick={onClose}
              className="block mx-auto mt-3 text-xs text-muted-foreground hover:text-foreground"
            >
              Maybe later
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
