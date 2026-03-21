import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileCache } from "@/hooks/useProfileCache";
import { useIsMobile } from "@/hooks/use-mobile";
import RevenueKPICards from "@/modules/dashboard/components/RevenueKPICards";
import NextActionsWidget from "@/modules/dashboard/components/NextActionsWidget";
import DashboardActivityFeed from "@/modules/dashboard/components/DashboardActivityFeed";
import GrowthTrends from "@/modules/dashboard/components/GrowthTrends";
import MobileJobDashboard from "@/modules/dashboard/components/MobileJobDashboard";
import MobileQuickCreate from "@/modules/invoices/components/MobileQuickCreate";
import ReferralActivationChecker from "@/modules/dashboard/components/ReferralActivationChecker";
import EstimateDutyPanel from "@/modules/dashboard/components/EstimateDutyPanel";
import {
  Pencil, UserPlus, CalendarPlus, Share2, ExternalLink,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardHome() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfileCache();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-6 max-w-[1200px]">
      <ReferralActivationChecker />

      {/* ── Hero Header ── */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/30 p-6 sm:p-8"
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }} />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {greeting}, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Here's how your business is doing today
            </p>
          </div>

          {!isMobile && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="gap-2 rounded-xl h-9 text-[13px] font-medium"
                onClick={() => navigate("/app/card")}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Card
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl h-9 text-[13px] font-medium"
                onClick={() => navigate("/app/contacts?new=1")}
              >
                <UserPlus className="h-3.5 w-3.5" /> Add Lead
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl h-9 text-[13px] font-medium"
                onClick={() => navigate("/app/bookings?new=1")}
              >
                <CalendarPlus className="h-3.5 w-3.5" /> Book
              </Button>
              {profile?.handle && (
                <Button variant="outline" size="sm" className="gap-2 rounded-xl h-9 text-[13px] font-medium" asChild>
                  <a href={`/${profile.handle}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> View Card
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Mobile Job Dashboard */}
      {isMobile && <MobileJobDashboard />}

      {/* Estimate Duty (contextual) */}
      <EstimateDutyPanel />

      {/* ── KPI Cards ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.08, duration: 0.5 }}>
        <RevenueKPICards />
      </motion.div>

      {/* ── Main Content: Actions + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.14, duration: 0.5 }}
          className="lg:col-span-2"
        >
          <NextActionsWidget />
        </motion.div>
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.18, duration: 0.5 }}
          className="lg:col-span-3"
        >
          <DashboardActivityFeed />
        </motion.div>
      </div>

      {/* ── Growth Trends ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.22, duration: 0.5 }}>
        <GrowthTrends />
      </motion.div>

      {/* Mobile floating quick-create */}
      {isMobile && <MobileQuickCreate />}
    </div>
  );
}
