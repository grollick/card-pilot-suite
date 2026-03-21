import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, UserPlus, CalendarCheck, DollarSign, Eye, Lightbulb, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessPerformance } from "@/hooks/useBusinessPerformance";

function TrendRow({ label, icon: Icon, value, trend, prefix = "", route, onClick }: {
  label: string;
  icon: typeof TrendingUp;
  value: number;
  trend: number;
  prefix?: string;
  route?: string;
  onClick?: () => void;
}) {
  const isPositive = trend > 0;
  const isZero = trend === 0;

  return (
    <div
      className={`flex items-center gap-3 py-3 ${onClick ? "cursor-pointer group hover:bg-muted/30 -mx-2 px-2 rounded-xl transition-colors" : ""}`}
      onClick={onClick}
    >
      <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{label}</p>
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
      {onClick && (
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-all group-hover:translate-x-0.5 shrink-0" />
      )}
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
  const navigate = useNavigate();
  const { data, isLoading } = useBusinessPerformance();

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
        <button
          onClick={() => navigate("/app/analytics")}
          className="text-[10px] font-medium text-primary hover:text-primary/80 uppercase tracking-widest transition-colors flex items-center gap-1"
        >
          View All <ArrowRight className="h-2.5 w-2.5" />
        </button>
      </div>
      <div className="px-5 pb-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/60">
              <TrendRow label="Card Views" icon={Eye} value={data?.views ?? 0} trend={data?.trends?.views ?? 0} onClick={() => navigate("/app/analytics")} />
              <TrendRow label="Leads" icon={UserPlus} value={data?.leads ?? 0} trend={data?.trends?.leads ?? 0} onClick={() => navigate("/app/contacts")} />
              <TrendRow label="Bookings" icon={CalendarCheck} value={data?.bookings ?? 0} trend={data?.trends?.bookings ?? 0} onClick={() => navigate("/app/bookings")} />
              <TrendRow label="Revenue" icon={DollarSign} value={data?.estimatedRevenue ?? 0} trend={data?.trends?.revenue ?? 0} prefix="$" onClick={() => navigate("/app/invoices")} />
            </div>
            {insight && <div className="mt-4"><InsightTip text={insight} /></div>}
          </>
        )}
      </div>
    </motion.div>
  );
}
