import { Eye, UserPlus, CalendarCheck, DollarSign, Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useYesterdaySnapshot } from "@/hooks/useDashboardStats";

export default function YesterdaySnapshot() {
  const { data, isLoading } = useYesterdaySnapshot();

  const items = [
    { label: "Views", value: data?.views ?? 0, icon: Eye },
    { label: "New Leads", value: data?.leads ?? 0, icon: UserPlus },
    { label: "Bookings", value: data?.bookings ?? 0, icon: CalendarCheck },
    { label: "Revenue", value: `$${(data?.potentialRevenue ?? 0).toLocaleString()}`, icon: DollarSign },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <h2 className="font-semibold text-sm">Yesterday's Results</h2>
        {!isLoading && (data?.followupsNeeded ?? 0) > 0 && (
          <div className="stat-pill text-warning bg-warning/10">
            <Bell className="h-3 w-3" />
            {data!.followupsNeeded} follow-ups needed
          </div>
        )}
      </div>

      <div className="dash-card-body">
        <div className="grid grid-cols-4 gap-3">
          {items.map(item => (
            <div key={item.label} className="text-center py-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center mx-auto mb-2">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-10 mx-auto" />
              ) : (
                <p className="text-lg font-bold tracking-tight tabular-nums">{item.value}</p>
              )}
              <p className="text-2xs text-muted-foreground mt-0.5 font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
