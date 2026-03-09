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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm">Yesterday's Results</h2>
        {!isLoading && (data?.followupsNeeded ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10 px-2.5 py-1 rounded-full">
            <Bell className="h-3 w-3" />
            {data!.followupsNeeded} follow-ups needed
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {items.map(item => (
          <div key={item.label} className="text-center py-2">
            <item.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            {isLoading ? (
              <Skeleton className="h-6 w-10 mx-auto" />
            ) : (
              <p className="text-lg font-bold tracking-tight">{item.value}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
