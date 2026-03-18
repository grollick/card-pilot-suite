import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, UserPlus, CalendarCheck, DollarSign, Eye, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessPerformance } from "@/hooks/useBusinessPerformance";

function TrendRow({ label, icon: Icon, value, trend, prefix = "" }: {
  label: string;
  icon: typeof TrendingUp;
  value: number;
  trend: number;
  prefix?: string;
}) {
  const isPositive = trend > 0;
  const isZero = trend === 0;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {prefix}{value.toLocaleString()} this month
        </p>
      </div>
      <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
        isZero ? "bg-muted text-muted-foreground" :
        isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
      }`}>
        {isZero ? <Minus className="h-2.5 w-2.5" /> :
         isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
        {isPositive ? "+" : ""}{trend}%
      </div>
    </div>
  );
}

function InsightTip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-warning/5 border border-warning/10">
      <Lightbulb className="h-4 w-4 text-warning shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

export default function GrowthTrends() {
  const { data, isLoading } = useBusinessPerformance();

  // Generate a contextual insight
  const getInsight = () => {
    if (!data) return null;
    if (data.leads > 0 && data.bookings === 0) return "You're getting leads but no bookings yet. Try following up within 1 hour.";
    if (data.views > 10 && data.leads === 0) return "Your card is getting views! Add a stronger CTA to capture more leads.";
    if ((data.trends?.leads ?? 0) > 20) return "Your leads are growing fast! Consider upgrading to automate follow-ups.";
    if (data.bookings > 0 && (data.trends?.bookings ?? 0) < 0) return "Bookings are down. Try sending a promo to your contact list.";
    return "Share your card on social media to increase visibility and lead capture.";
  };

  const insight = getInsight();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="rounded-2xl border border-border bg-card"
    >
      <div className="px-5 pt-5 pb-2 flex items-center justify-between">
        <h2 className="font-semibold text-sm text-foreground">Growth & Insights</h2>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">vs. last month</span>
      </div>
      <div className="px-5 pb-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/60">
              <TrendRow label="Card Views" icon={Eye} value={data?.views ?? 0} trend={data?.trends?.views ?? 0} />
              <TrendRow label="Leads" icon={UserPlus} value={data?.leads ?? 0} trend={data?.trends?.leads ?? 0} />
              <TrendRow label="Bookings" icon={CalendarCheck} value={data?.bookings ?? 0} trend={data?.trends?.bookings ?? 0} />
              <TrendRow label="Revenue" icon={DollarSign} value={data?.estimatedRevenue ?? 0} trend={data?.trends?.revenue ?? 0} prefix="$" />
            </div>
            {insight && <div className="mt-4"><InsightTip text={insight} /></div>}
          </>
        )}
      </div>
    </motion.div>
  );
}
