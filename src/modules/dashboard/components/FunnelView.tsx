import { motion } from "framer-motion";
import { Eye, UserPlus, CalendarCheck, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessPerformance } from "@/hooks/useBusinessPerformance";

export default function FunnelView() {
  const { data, isLoading } = useBusinessPerformance();

  const stages = [
    {
      label: "Visitors",
      value: data?.views ?? 0,
      icon: Eye,
      color: "bg-primary/10 text-primary",
      barColor: "bg-primary",
    },
    {
      label: "Leads",
      value: data?.leads ?? 0,
      icon: UserPlus,
      color: "bg-success/10 text-success",
      barColor: "bg-success",
    },
    {
      label: "Bookings",
      value: data?.bookings ?? 0,
      icon: CalendarCheck,
      color: "bg-warning/10 text-warning",
      barColor: "bg-warning",
    },
  ];

  const maxValue = Math.max(...stages.map(s => s.value), 1);

  // Conversion rates between stages
  const viewToLead = data && data.views > 0
    ? Math.round((data.leads / data.views) * 100)
    : 0;
  const leadToBooking = data && data.leads > 0
    ? Math.round((data.bookings / data.leads) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <h2 className="font-semibold text-sm">Your Funnel</h2>
        <span className="text-2xs text-muted-foreground">This month</span>
      </div>
      <div className="dash-card-body">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {stages.map((stage, idx) => {
              const widthPct = Math.max((stage.value / maxValue) * 100, 8);
              return (
                <div key={stage.label}>
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${stage.color}`}>
                      <stage.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {stage.label}
                        </span>
                        <span className="text-lg font-bold tabular-nums text-foreground">
                          {stage.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${stage.barColor}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.1 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Conversion arrow between stages */}
                  {idx < stages.length - 1 && (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 ml-12">
                      <div className="h-px flex-1 bg-border" />
                      <div className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] font-semibold tabular-nums text-foreground">
                          {idx === 0 ? viewToLead : leadToBooking}%
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
