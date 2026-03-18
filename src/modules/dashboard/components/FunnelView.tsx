import { motion } from "framer-motion";
import { Eye, UserPlus, CalendarCheck, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessPerformance } from "@/hooks/useBusinessPerformance";

export default function FunnelView() {
  const { data, isLoading } = useBusinessPerformance();

  const stages = [
    { label: "Visitors", value: data?.views ?? 0, icon: Eye, color: "bg-primary", lightBg: "bg-primary/10", textColor: "text-primary" },
    { label: "Leads", value: data?.leads ?? 0, icon: UserPlus, color: "bg-success", lightBg: "bg-success/10", textColor: "text-success" },
    { label: "Bookings", value: data?.bookings ?? 0, icon: CalendarCheck, color: "bg-warning", lightBg: "bg-warning/10", textColor: "text-warning" },
  ];

  const maxValue = Math.max(...stages.map(s => s.value), 1);

  const viewToLead = data && data.views > 0 ? ((data.leads / data.views) * 100).toFixed(1) : "0";
  const leadToBooking = data && data.leads > 0 ? ((data.bookings / data.leads) * 100).toFixed(1) : "0";
  const conversionRates = [viewToLead, leadToBooking];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h2 className="font-semibold text-sm text-foreground">Conversion Funnel</h2>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">This month</span>
      </div>

      <div className="px-5 pb-5">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-1">
            {stages.map((stage, idx) => {
              const widthPct = Math.max((stage.value / maxValue) * 100, 6);
              return (
                <div key={stage.label}>
                  {/* Stage row */}
                  <div className="flex items-center gap-3 py-2.5">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${stage.lightBg}`}>
                      <stage.icon className={`h-4 w-4 ${stage.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-xs font-medium text-muted-foreground">{stage.label}</span>
                        <span className="text-xl font-bold tabular-nums text-foreground">{stage.value.toLocaleString()}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${stage.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPct}%` }}
                          transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1], delay: idx * 0.12 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Conversion rate connector */}
                  {idx < stages.length - 1 && (
                    <div className="flex items-center gap-2 pl-12 pr-2 py-0.5">
                      <div className="flex-1 border-t border-dashed border-border/60" />
                      <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2.5 py-0.5">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] font-bold tabular-nums text-foreground">{conversionRates[idx]}%</span>
                      </div>
                      <div className="flex-1 border-t border-dashed border-border/60" />
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
