import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UPGRADE_SCENARIOS, type UpgradeTrigger } from "@/modules/billing/config/planLimits";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  trigger: UpgradeTrigger;
  currentPlan?: string;
}

export default function UpgradeModal({ open, onClose, trigger, currentPlan = "Free" }: UpgradeModalProps) {
  const navigate = useNavigate();
  const scenario = UPGRADE_SCENARIOS[trigger];
  const Icon = scenario.icon;

  const handleUpgrade = () => {
    onClose();
    navigate("/pricing");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
              {/* Top accent */}
              <div className="h-1 bg-gradient-to-r from-primary to-accent" />

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="p-6 pt-5">
                {/* Current plan badge */}
                <Badge variant="secondary" className="text-xs mb-4">
                  Current plan: {currentPlan}
                </Badge>

                {/* Icon + Headline */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground leading-tight">
                    {scenario.headline}
                  </h2>
                </div>

                {/* Message */}
                <p className="text-sm text-muted-foreground mb-5">
                  {scenario.message}
                </p>

                {/* Benefits */}
                <div className="space-y-2.5 mb-6">
                  {scenario.bullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{bullet}</span>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-2">
                  <Button size="lg" className="w-full font-semibold" onClick={handleUpgrade}>
                    Upgrade Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onClose}>
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
