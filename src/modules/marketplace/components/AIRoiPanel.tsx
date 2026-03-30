import { motion } from "framer-motion";
import {
  TrendingUp, Zap, Users, CalendarCheck, DollarSign,
  ArrowUpRight, ArrowDownRight, Minus, Sparkles, Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useAIRoi, useAIUsage, type AIRoiData } from "../hooks/useProviderInsights";
import { useNavigate } from "react-router-dom";

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (previous === 0) return <ArrowUpRight className="h-3 w-3 text-success" />;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return <span className="text-xs text-success font-medium flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" />+{pct}%</span>;
  if (pct < 0) return <span className="text-xs text-destructive font-medium flex items-center gap-0.5"><ArrowDownRight className="h-3 w-3" />{pct}%</span>;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

function MetricCard({ icon: Icon, label, value, subValue, trend }: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  subValue?: string;
  trend?: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        {trend}
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {subValue && <p className="text-[10px] text-muted-foreground mt-0.5">{subValue}</p>}
    </div>
  );
}

function UpgradeDriver({ plan, roi }: { plan: string; roi: AIRoiData }) {
  const navigate = useNavigate();

  if (plan === "growth") return null;

  const hasConversions = roi.ai_assisted_bookings_month > 0;

  return (
    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2 mb-2">
        <Rocket className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">
          {plan === "free" ? "Unlock more AI power" : "Level up your growth"}
        </p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {hasConversions
          ? `AI helped convert ${roi.ai_assisted_bookings_month} booking${roi.ai_assisted_bookings_month !== 1 ? "s" : ""} this month — upgrade to keep growing.`
          : plan === "free"
            ? "Pro providers respond 3× faster and convert more leads with AI."
            : "Growth plan unlocks advanced insights and unlimited AI assists."}
      </p>
      <Button size="sm" onClick={() => navigate("/pricing")} className="gap-1">
        <Zap className="h-3 w-3" />
        Upgrade to {plan === "free" ? "Pro" : "Growth"}
      </Button>
    </div>
  );
}

function ProInsights({ roi }: { roi: AIRoiData }) {
  const tips = [];
  if (roi.conversion_rate_month > 0) {
    tips.push(`Your AI conversion rate is ${roi.conversion_rate_month}% this month`);
  }
  if (roi.ai_assisted_leads_month > 0) {
    tips.push(`AI helped you respond to ${roi.ai_assisted_leads_month} lead${roi.ai_assisted_leads_month !== 1 ? "s" : ""} this month`);
  }
  if (roi.total_ai_generations > 10) {
    tips.push("Top providers use AI on every lead — keep it up!");
  }
  if (tips.length === 0) return null;

  return (
    <div className="space-y-1.5 px-1">
      {tips.map((tip, i) => (
        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
          <span>{tip}</span>
        </div>
      ))}
    </div>
  );
}

export default function AIRoiPanel() {
  const { data: roi, isLoading } = useAIRoi();
  const { data: usage } = useAIUsage();
  const plan = usage?.plan || "free";

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-44" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Empty state
  if (!roi || roi.total_ai_generations === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">Your AI is working for you</h2>
            <p className="text-[10px] text-muted-foreground">Track how AI helps your business grow</p>
          </div>
        </div>
        <div className="text-center py-6">
          <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">No AI activity yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Start using AI to respond to leads faster and track your results here.
          </p>
        </div>
      </div>
    );
  }

  const conversionPct = roi.ai_assisted_leads > 0
    ? Math.min(Math.round((roi.ai_assisted_bookings / roi.ai_assisted_leads) * 100), 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">Your AI is working for you</h2>
            <p className="text-[10px] text-muted-foreground">This month's AI-powered results</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px]">This month</Badge>
      </div>

      {/* Metrics Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <MetricCard
            icon={Users}
            label="AI-assisted leads"
            value={String(roi.ai_assisted_leads_month)}
            subValue={`${roi.ai_assisted_leads} total`}
            trend={<TrendIndicator current={roi.ai_assisted_leads_month} previous={roi.ai_assisted_leads_prev_month} />}
          />
          <MetricCard
            icon={CalendarCheck}
            label="AI-assisted bookings"
            value={String(roi.ai_assisted_bookings_month)}
            subValue={`${roi.ai_assisted_bookings} total`}
            trend={<TrendIndicator current={roi.ai_assisted_bookings_month} previous={roi.ai_assisted_bookings_prev_month} />}
          />
          <MetricCard
            icon={TrendingUp}
            label="Conversion rate"
            value={`${roi.conversion_rate_month}%`}
            subValue={`${roi.conversion_rate}% all time`}
          />
          <MetricCard
            icon={DollarSign}
            label="Est. revenue from AI"
            value={`$${(roi.estimated_revenue_month || 0).toLocaleString()}`}
            subValue={`$${(roi.estimated_revenue || 0).toLocaleString()} total`}
          />
        </div>

        {/* Conversion bar */}
        {roi.ai_assisted_leads > 0 && (
          <div className="mb-4 p-3 rounded-xl border border-border bg-muted/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Lead → Booking conversion</span>
              <span className="text-xs font-semibold text-foreground">{conversionPct}%</span>
            </div>
            <Progress value={conversionPct} className="h-2" />
          </div>
        )}

        {/* Pro insights */}
        <ProInsights roi={roi} />

        {/* Upgrade driver */}
        <div className="mt-4">
          <UpgradeDriver plan={plan} roi={roi} />
        </div>
      </div>
    </motion.div>
  );
}
