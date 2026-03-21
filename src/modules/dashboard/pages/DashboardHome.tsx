import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileCache } from "@/hooks/useProfileCache";
import { useIsMobile } from "@/hooks/use-mobile";
import { useJobRequestStats } from "@/hooks/useJobRequests";
import RevenueKPICards from "@/modules/dashboard/components/RevenueKPICards";
import NextActionsWidget from "@/modules/dashboard/components/NextActionsWidget";
import DashboardActivityFeed from "@/modules/dashboard/components/DashboardActivityFeed";
import GrowthTrends from "@/modules/dashboard/components/GrowthTrends";
import MobileJobDashboard from "@/modules/dashboard/components/MobileJobDashboard";
import MobileQuickCreate from "@/modules/invoices/components/MobileQuickCreate";
import ReferralActivationChecker from "@/modules/dashboard/components/ReferralActivationChecker";
import EstimateDutyPanel from "@/modules/dashboard/components/EstimateDutyPanel";
import FirstLeadAssistant from "@/modules/dashboard/components/FirstLeadAssistant";
import BusinessHealthScore from "@/modules/dashboard/components/BusinessHealthScore";
import AIBusinessCoachWidget from "@/modules/dashboard/components/AIBusinessCoachWidget";
import AIBusinessAssistant from "@/modules/dashboard/components/AIBusinessAssistant";
import FirstLeadGuaranteeWidget from "@/modules/dashboard/components/FirstLeadGuaranteeWidget";
import {
  Pencil, UserPlus, CalendarPlus, ExternalLink,
  Zap, Sparkles, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
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
    <motion.div
      className="space-y-6 max-w-[1200px]"
      initial="initial"
      animate="animate"
      variants={stagger}
    >
      <ReferralActivationChecker />

      {/* ── Hero Header ── */}
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="relative overflow-hidden rounded-2xl border border-primary/10 p-6 sm:p-8"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--card)), hsl(var(--accent) / 0.06))",
        }}
      >
        <motion.div
          className="absolute -top-20 -right-20 h-60 w-60 rounded-full blur-3xl pointer-events-none"
          style={{ background: "hsl(var(--primary) / 0.12)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: "hsl(var(--accent) / 0.1)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }} />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <motion.h1
              className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              {greeting}, {firstName}
              <motion.span
                className="inline-block ml-2"
                animate={{ rotate: [0, 14, -8, 14, 0] }}
                transition={{ duration: 1.8, delay: 0.8, ease: "easeInOut" }}
              >
                👋
              </motion.span>
            </motion.h1>
            <motion.p
              className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Zap className="h-3.5 w-3.5 text-primary animate-pulse" />
              Here's how your business is doing today
            </motion.p>
          </div>

          {!isMobile && (
            <motion.div
              className="flex flex-wrap gap-2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <Button
                size="sm"
                className="gap-2 rounded-xl h-9 text-[13px] font-medium shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 transition-all hover:scale-[1.02]"
                onClick={() => navigate("/app/card")}
              >
                <Pencil className="h-3.5 w-3.5" /> Tweak Card
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl h-9 text-[13px] font-medium hover:scale-[1.02] transition-all backdrop-blur-sm"
                onClick={() => navigate("/app/contacts?new=1")}
              >
                <UserPlus className="h-3.5 w-3.5" /> Add Lead
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl h-9 text-[13px] font-medium hover:scale-[1.02] transition-all backdrop-blur-sm"
                onClick={() => navigate("/app/bookings?new=1")}
              >
                <CalendarPlus className="h-3.5 w-3.5" /> Book
              </Button>
              {profile?.handle && (
                <Button variant="outline" size="sm" className="gap-2 rounded-xl h-9 text-[13px] font-medium hover:scale-[1.02] transition-all backdrop-blur-sm" asChild>
                  <a href={`/${profile.handle}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> View Card
                  </a>
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Mobile Job Dashboard */}
      {isMobile && <MobileJobDashboard />}

      {/* Estimate Duty (contextual) */}
      <EstimateDutyPanel />

      {/* ── First Lead Guarantee ── */}
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <FirstLeadGuaranteeWidget />
      </motion.div>

      {/* ── First Win Experience ── */}
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <FirstLeadAssistant />
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <RevenueKPICards />
      </motion.div>

      {/* ── AI Business Coach ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="lg:col-span-3"
        >
          <AIBusinessCoachWidget />
        </motion.div>
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="lg:col-span-2"
        >
          <BusinessHealthScore />
        </motion.div>
      </div>

      {/* ── Main Content: Actions ── */}
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <NextActionsWidget />
      </motion.div>

      {/* ── Activity Feed ── */}
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <DashboardActivityFeed />
      </motion.div>

      {/* ── Growth Trends ── */}
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <GrowthTrends />
      </motion.div>

      {/* Mobile floating quick-create */}
      {isMobile && <MobileQuickCreate />}

      {/* AI Business Assistant (floating) */}
      <AIBusinessAssistant />
    </motion.div>
  );
}
