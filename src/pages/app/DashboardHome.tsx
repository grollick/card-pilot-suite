import { Eye, MousePointer, Users, Calendar, ArrowUpRight, Clock } from "lucide-react";
import KPICard from "@/components/KPICard";
import { motion } from "framer-motion";

const recentActivity = [
  { type: "view", text: "Someone viewed your card", time: "2 min ago" },
  { type: "lead", text: "New lead: Sarah Johnson", time: "15 min ago" },
  { type: "booking", text: "Booking confirmed: John Doe", time: "1 hour ago" },
  { type: "click", text: "3 clicks on your Call button", time: "2 hours ago" },
  { type: "lead", text: "New lead: Mike Chen", time: "3 hours ago" },
];

const upcomingBookings = [
  { name: "Sarah Johnson", service: "Consultation", time: "Today, 2:00 PM" },
  { name: "John Doe", service: "Follow-up", time: "Tomorrow, 10:00 AM" },
  { name: "Lisa Park", service: "Strategy Session", time: "Mar 6, 3:00 PM" },
];

export default function DashboardHome() {
  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back! Here's what's happening this week.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Eye} title="Card Views" value={148} change="+12% from last week" changeType="positive" />
        <KPICard icon={MousePointer} title="Button Clicks" value={42} change="+8% from last week" changeType="positive" />
        <KPICard icon={Users} title="New Leads" value={7} change="+3 from last week" changeType="positive" />
        <KPICard icon={Calendar} title="Bookings" value={5} change="2 pending confirmation" changeType="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Activity</h2>
            <button className="text-xs text-primary flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  {item.type === "view" && <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                  {item.type === "lead" && <Users className="h-3.5 w-3.5 text-primary" />}
                  {item.type === "booking" && <Calendar className="h-3.5 w-3.5 text-[hsl(var(--success))]" />}
                  {item.type === "click" && <MousePointer className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{item.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Upcoming Bookings</h2>
            <button className="text-xs text-primary flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {upcomingBookings.map((booking, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {booking.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{booking.name}</p>
                  <p className="text-xs text-muted-foreground">{booking.service}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{booking.time}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
