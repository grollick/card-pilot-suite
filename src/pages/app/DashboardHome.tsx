import { useNavigate } from "react-router-dom";
import {
  Eye, MousePointer, Users, Calendar, ArrowUpRight, Clock,
  CheckCircle2, Circle, Plus, CreditCard, Mail, Share2, Bookmark
} from "lucide-react";
import KPICard from "@/components/KPICard";
import { Button } from "@/components/ui/button";
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

const todayTasks = [
  { text: "Follow up with Sarah Johnson", done: false, priority: "high" },
  { text: "Send proposal to Lisa Park", done: false, priority: "high" },
  { text: "Call John Doe about booking", done: false, priority: "medium" },
  { text: "Initial outreach complete", done: true, priority: "low" },
];

const quickActions = [
  { label: "Publish Card", icon: CreditCard, href: "/app/card" },
  { label: "Create Email", icon: Mail, href: "/app/email" },
  { label: "Social Post", icon: Share2, href: "/app/social" },
  { label: "Add Service", icon: Bookmark, href: "/app/booking" },
];

const priorityColors: Record<string, string> = {
  high: "text-destructive",
  medium: "text-[hsl(var(--warning))]",
  low: "text-muted-foreground",
};

export default function DashboardHome() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Here's what needs your attention this week.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Eye} title="Card Views" value={148} change="+12% from last week" changeType="positive" />
        <KPICard icon={MousePointer} title="Button Clicks" value={42} change="+8% from last week" changeType="positive" />
        <KPICard icon={Users} title="New Contacts" value={7} change="+3 from last week" changeType="positive" />
        <KPICard icon={Calendar} title="Bookings" value={5} change="2 pending" changeType="neutral" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map(action => (
          <motion.button
            key={action.label}
            whileHover={{ y: -2 }}
            onClick={() => navigate(action.href)}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <action.icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium">{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Row 2: Tasks + Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks due today */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Tasks Due Today</h2>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/app/tasks")}>
              View all <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1">
            {todayTasks.map((task, i) => (
              <div key={i} className={`flex items-center gap-3 py-2 ${task.done ? "opacity-50" : ""}`}>
                {task.done ? (
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))] shrink-0" />
                ) : (
                  <Circle className={`h-5 w-5 shrink-0 ${priorityColors[task.priority]}`} />
                )}
                <span className={`text-sm flex-1 ${task.done ? "line-through" : ""}`}>{task.text}</span>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-3 text-xs gap-1 w-full justify-center">
            <Plus className="h-3 w-3" /> Add Task
          </Button>
        </motion.div>

        {/* Next bookings */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Upcoming Bookings</h2>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/app/booking")}>
              View all <ArrowUpRight className="h-3 w-3" />
            </Button>
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

      {/* Row 3: Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Contact Activity</h2>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/app/contacts")}>
            View all <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
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
    </div>
  );
}
