import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, UserPlus, CalendarCheck, DollarSign, Eye } from "lucide-react";
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
    <div className="flex items-center gap-3 py-2.5">
      <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {prefix}{value.toLocaleString()} this month
        </p>
      </div>
      <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isZero ? "bg-muted text-muted-foreground" :
        isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
      }`}>
        {isZero ? <Minus className="h-3 w-3" /> :
         isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPositive ? "+" : ""}{trend}%
      </div>
    </div>
  );
}

export default function GrowthTrends() {
  const { data, isLoading } = useBusinessPerformance();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <h2 className="font-semibold text-sm">Growth Trends</h2>
        <span className="text-2xs text-muted-foreground">vs. last month</span>
      </div>
      <div className="dash-card-body">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            <TrendRow label="Card Views" icon={Eye} value={data?.views ?? 0} trend={data?.trends?.views ?? 0} />
            <TrendRow label="Leads Captured" icon={UserPlus} value={data?.leads ?? 0} trend={data?.trends?.leads ?? 0} />
            <TrendRow label="Bookings" icon={CalendarCheck} value={data?.bookings ?? 0} trend={data?.trends?.bookings ?? 0} />
            <TrendRow label="Est. Revenue" icon={DollarSign} value={data?.estimatedRevenue ?? 0} trend={data?.trends?.revenue ?? 0} prefix="$" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
