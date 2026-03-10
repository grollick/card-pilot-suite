import { Eye, UserPlus, CalendarCheck, DollarSign, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useBusinessPerformance } from "@/hooks/useDashboardStats";

export default function BusinessPerformancePanel() {
  const { data, isLoading } = useBusinessPerformance();

  const metrics = [
    { label: "Card Views", value: data?.views ?? 0, icon: Eye, color: "text-primary bg-primary/10" },
    { label: "Leads Captured", value: data?.leads ?? 0, icon: UserPlus, color: "text-success bg-success/10" },
    { label: "Bookings", value: data?.bookings ?? 0, icon: CalendarCheck, color: "text-warning bg-warning/10" },
    { label: "Est. Revenue", value: `$${(data?.estimatedRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-primary bg-primary/10" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <div>
          <h2 className="font-semibold text-sm">This Month's Performance</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Revenue generated through CardPilot</p>
        </div>
        {!isLoading && data && (
          <div className="stat-pill text-primary bg-primary/8">
            <TrendingUp className="h-3 w-3" />
            {data.conversionRate}% conversion
          </div>
        )}
      </div>

      <div className="dash-card-body">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl bg-muted/40 p-3.5 transition-colors hover:bg-muted/60">
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${m.color}`}>
                  <m.icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-2xs text-muted-foreground font-medium uppercase tracking-wider">{m.label}</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <p className="text-xl font-bold tracking-tight tabular-nums">{m.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
