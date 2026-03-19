import {
  Clock, Target, AlertTriangle, TrendingUp, CheckCircle2, BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import type { DutyAnalytics } from "@/hooks/useEstimateDuty";

interface DutyAnalyticsPanelProps {
  analytics: DutyAnalytics;
}

export default function DutyAnalyticsPanel({ analytics }: DutyAnalyticsPanelProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      <div className="border-t border-border pt-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Received", value: analytics.leadsReceived, icon: Target },
            { label: "Accepted", value: analytics.acceptedLeads, icon: CheckCircle2 },
            { label: "Response", value: `${analytics.responseRate}%`, icon: TrendingUp },
            { label: "Avg time", value: analytics.avgResponseMin ? `${analytics.avgResponseMin}m` : "—", icon: Clock },
            { label: "Missed", value: analytics.missedLeads, icon: AlertTriangle },
            { label: "Completed", value: analytics.completedEstimates, icon: BarChart3 },
          ].map((m) => (
            <div key={m.label} className="p-2.5 rounded-lg bg-muted/40 text-center">
              <m.icon className="h-3 w-3 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm font-bold tabular-nums">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
        {analytics.bookingsFromDuty > 0 && (
          <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-success/5 border border-success/10">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span className="text-xs text-success font-medium">
              {analytics.bookingsFromDuty} booking{analytics.bookingsFromDuty > 1 ? "s" : ""} from On Duty leads
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
