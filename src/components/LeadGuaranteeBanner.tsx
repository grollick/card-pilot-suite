import { motion } from "framer-motion";
import { Shield, CheckCircle2, Circle, TrendingUp, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface LeadGuaranteeBannerProps {
  /** "landing" | "pricing" | "dashboard" — controls layout & detail level */
  variant?: "landing" | "pricing" | "dashboard";
  /** Dashboard-specific data */
  guaranteeData?: {
    leadsLast30Days: number;
    progress: number;
    isEligible: boolean;
    targetMet: boolean;
    conditions: { label: string; met: boolean }[];
  };
}

export default function LeadGuaranteeBanner({ variant = "landing", guaranteeData }: LeadGuaranteeBannerProps) {
  // ── Landing / Pricing: static trust banner ──
  if (variant === "landing" || variant === "pricing") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5 p-6 md:p-8"
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/[0.06] blur-[60px] -z-0" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Icon */}
          <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <h3 className="text-lg md:text-xl font-bold text-foreground">
                3 Leads in 30 Days — Guaranteed
              </h3>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                <Sparkles className="h-2.5 w-2.5 mr-0.5" /> Risk-Free
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg">
              Complete your setup, share your card, and respond to leads. If you don't get at least
              3 leads in your first 30 days, your next month is on us. Zero risk.
            </p>
          </div>

          {/* Conditions pill list */}
          <div className="flex flex-col gap-1.5 text-xs flex-shrink-0">
            {["Complete your setup", "Share your card", "Respond to leads"].map((c) => (
              <div key={c} className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Dashboard: interactive tracking widget ──
  if (!guaranteeData) return null;

  const { leadsLast30Days, progress, isEligible, targetMet, conditions } = guaranteeData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/5 p-5"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Lead Guarantee</h3>
          <p className="text-xs text-muted-foreground">
            {targetMet
              ? "🎉 You've hit 3+ leads! Guarantee achieved."
              : `Get 3 leads in 30 days or your next month is free.`}
          </p>
        </div>
        {targetMet ? (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
            ✓ Achieved
          </Badge>
        ) : isEligible ? (
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
            Eligible
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px]">
            Not Eligible
          </Badge>
        )}
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">
            {leadsLast30Days} of 3 leads
          </span>
          <span className="font-medium text-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Conditions */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Conditions
        </p>
        {conditions.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-xs">
            {c.met ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
            )}
            <span className={c.met ? "text-foreground" : "text-muted-foreground"}>
              {c.label}
            </span>
          </div>
        ))}
      </div>

      {/* Tip */}
      {!targetMet && isEligible && (
        <div className="mt-3 rounded-lg bg-primary/5 border border-primary/10 p-2.5 text-xs text-foreground flex items-start gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span>
            Keep sharing your card! Most users hit 3 leads within the first 2 weeks.
          </span>
        </div>
      )}
    </motion.div>
  );
}
