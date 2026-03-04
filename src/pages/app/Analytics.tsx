import { BarChart3, Eye, MousePointer, Users, TrendingUp } from "lucide-react";
import KPICard from "@/components/KPICard";
import { motion } from "framer-motion";

const weeklyData = [
  { day: "Mon", views: 28, clicks: 8 },
  { day: "Tue", views: 35, clicks: 12 },
  { day: "Wed", views: 22, clicks: 6 },
  { day: "Thu", views: 40, clicks: 15 },
  { day: "Fri", views: 32, clicks: 10 },
  { day: "Sat", views: 18, clicks: 5 },
  { day: "Sun", views: 12, clicks: 3 },
];

const topActions = [
  { action: "Call", count: 24, pct: 40 },
  { action: "Email", count: 18, pct: 30 },
  { action: "Text", count: 12, pct: 20 },
  { action: "Save Contact", count: 6, pct: 10 },
];

export default function Analytics() {
  const maxViews = Math.max(...weeklyData.map(d => d.views));

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your card performance and engagement</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Eye} title="Total Views" value="1,247" change="+18% this month" changeType="positive" />
        <KPICard icon={MousePointer} title="Total Clicks" value="342" change="+12% this month" changeType="positive" />
        <KPICard icon={Users} title="Leads Generated" value="48" change="+22% this month" changeType="positive" />
        <KPICard icon={TrendingUp} title="Conversion Rate" value="3.8%" change="+0.5% from last month" changeType="positive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Weekly Views</h2>
          <div className="flex items-end gap-2 h-40">
            {weeklyData.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-md bg-primary/20 relative"
                  style={{ height: `${(d.views / maxViews) * 100}%` }}>
                  <div className="absolute inset-x-0 bottom-0 rounded-t-md bg-primary"
                    style={{ height: `${(d.clicks / d.views) * 100}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-primary/20" /> Views</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-primary" /> Clicks</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Top Actions</h2>
          <div className="space-y-4">
            {topActions.map(a => (
              <div key={a.action}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium">{a.action}</span>
                  <span className="text-muted-foreground">{a.count} ({a.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${a.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
