import { useNavigate } from "react-router-dom";
import {
  Users, ArrowUpRight, Circle, Plus,
  FileText, QrCode, MessageSquareQuote,
  UserPlus, CalendarCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useRecentActivity } from "@/hooks/useDashboardStats";
import { formatDistanceToNow } from "date-fns";
import RevenueKPICards from "@/modules/dashboard/components/RevenueKPICards";
import FunnelView from "@/modules/dashboard/components/FunnelView";
import MissedOpportunities from "@/modules/dashboard/components/MissedOpportunities";
import RevenueQuickActions from "@/modules/dashboard/components/RevenueQuickActions";
import GrowthTrends from "@/modules/dashboard/components/GrowthTrends";
import NextActionsWidget from "@/modules/dashboard/components/NextActionsWidget";
import RevenueOpportunities from "@/modules/dashboard/components/RevenueOpportunities";
import MobileJobDashboard from "@/modules/dashboard/components/MobileJobDashboard";
import ShareCardWidget from "@/modules/dashboard/components/ShareCardWidget";
import { useIsMobile } from "@/hooks/use-mobile";

const feedIcons: Record<string, typeof Users> = {
  lead: UserPlus,
  booking: CalendarCheck,
  qr_scan: QrCode,
};

const feedColors: Record<string, string> = {
  lead: "bg-success/10 text-success",
  booking: "bg-warning/10 text-warning",
  qr_scan: "bg-primary/10 text-primary",
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] as const },
};

export default function DashboardHome() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: feed = [], isLoading: feedLoading } = useRecentActivity();

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Revenue Dashboard</h1>
        <p className="page-description">
          Track leads, bookings, and revenue — then take action to grow.
        </p>
      </div>

      {/* Mobile Job Dashboard */}
      {isMobile && <MobileJobDashboard />}

      {/* ── SECTION 1: KPI Cards ── */}
      <RevenueKPICards />

      {/* ── SECTION 5: Quick Actions ── */}
      {!isMobile && <RevenueQuickActions />}

      {/* Share Your Card CTA */}
      <ShareCardWidget />

      {/* ── "What should I do next?" ── */}
      <NextActionsWidget />

      {/* ── Main Grid: 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── SECTION 3: Opportunities Panel ── */}
          <RevenueOpportunities />
          <MissedOpportunities />

          {/* ── SECTION 4: Activity Feed ── */}
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="dash-card">
            <div className="dash-card-header">
              <h2 className="font-semibold text-sm">Live Activity</h2>
              <Badge variant="secondary" className="text-2xs font-medium">Last 7 days</Badge>
            </div>
            <div className="dash-card-body">
              {feedLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-3 w-14" />
                    </div>
                  ))}
                </div>
              ) : feed.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Share your card to start getting leads and bookings.</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {feed.map(item => {
                    const Icon = feedIcons[item.type] ?? FileText;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
                        onClick={() => {
                          if (item.type === "lead") navigate(`/app/contacts/${item.id}`);
                          else if (item.type === "booking") navigate("/app/bookings");
                          else if (item.type === "qr_scan") navigate("/app/qr");
                        }}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${feedColors[item.type]}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                        </div>
                        <span className="text-2xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* ── SECTION 2: Funnel View ── */}
          <FunnelView />

          {/* ── SECTION 6: Growth Trends ── */}
          <GrowthTrends />
        </div>
      </div>
    </div>
  );
}
