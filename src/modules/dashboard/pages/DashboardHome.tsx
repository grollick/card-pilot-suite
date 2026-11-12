import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileCache } from "@/hooks/useProfileCache";
import { useIsMobile } from "@/hooks/use-mobile";
import { useJobRequestStats } from "@/hooks/useJobRequests";
import { useDashboardLayout } from "@/modules/dashboard/hooks/useDashboardLayout";
import DashboardLayoutToolbar from "@/modules/dashboard/components/DashboardLayoutToolbar";
import DashboardWidgetWrapper from "@/modules/dashboard/components/DashboardWidgetWrapper";
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
import DailyNotesWidget from "@/modules/dashboard/components/DailyNotesWidget";
import SecondSessionBanner from "@/modules/dashboard/components/SecondSessionBanner";
import Week1RetentionWidget from "@/modules/dashboard/components/Week1RetentionWidget";
import DashboardHeroHeader from "@/modules/dashboard/components/DashboardHeroHeader";
import DashboardOpportunityAlert from "@/modules/dashboard/components/DashboardOpportunityAlert";
import ShareCardWidget from "@/modules/dashboard/components/ShareCardWidget";
import TodaysSchedule from "@/modules/dashboard/components/TodaysSchedule";
import { useShowAllTools } from "@/hooks/useShowAllTools";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

/** Strip shown while booking requests are waiting for the pro to confirm. */
function BookingRequestsStrip() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: count = 0 } = useQuery({
    queryKey: ["bookings", "waiting-count", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .in("status", ["requested", "pending"]);
      if (error) throw error;
      return count ?? 0;
    },
  });
  if (count < 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-primary/30 bg-primary/5 p-3">
      <p className="text-sm font-medium">
        {count === 1 ? "1 booking request is waiting." : `${count} booking requests are waiting.`}{" "}
        Confirm {count === 1 ? "it" : "them"} so your {count === 1 ? "customer knows" : "customers know"} you're coming.
      </p>
      <Button size="sm" onClick={() => navigate("/app/bookings")}>Review</Button>
    </div>
  );
}
function PaymentReportsStrip() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: count = 0 } = useQuery({
    queryKey: ["invoices", "customer-says-paid-count", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .not("customer_reported_at", "is", null)
        .not("status", "in", "(paid,cancelled)");
      if (error) throw error;
      return count ?? 0;
    },
  });
  if (count < 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-primary/30 bg-primary/5 p-3">
      <p className="text-sm font-medium">
        {count === 1 ? "1 customer says they've paid." : `${count} customers say they've paid.`}{" "}
        Check and mark {count === 1 ? "it" : "them"} paid.
      </p>
      <Button size="sm" onClick={() => navigate("/app/invoices")}>Invoices</Button>
    </div>
  );
}
import {
  Pencil, UserPlus, CalendarPlus, ExternalLink,
  Zap, Sparkles, Bell, Store, Globe,
} from "lucide-react";

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

/** Map widget id → React component */
const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  "estimate-duty": EstimateDutyPanel,
  "first-lead-guarantee": FirstLeadGuaranteeWidget,
  "first-lead-assistant": FirstLeadAssistant,
  "kpi-cards": RevenueKPICards,
  "ai-coach": AIBusinessCoachWidget,
  "health-score": BusinessHealthScore,
  "quick-actions": MobileJobDashboard,
  "next-actions": NextActionsWidget,
  "daily-notes": DailyNotesWidget,
  "activity-feed": DashboardActivityFeed,
  "growth-trends": GrowthTrends,
};

export default function DashboardHome() {
  const isMobile = useIsMobile();
  const [showAllTools] = useShowAllTools();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfileCache();
  const { data: jobStats } = useJobRequestStats();
  const hasPendingOpportunity = (jobStats?.newRequests ?? 0) > 0 || (jobStats?.hasGuaranteeMatch ?? false);

  const {
    widgets,
    isEditing,
    setIsEditing,
    toggleVisibility,
    cycleSize,
    moveWidget,
    resetLayout,
  } = useDashboardLayout();

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case "opportunity-alert":
        return hasPendingOpportunity ? <DashboardOpportunityAlert /> : null;
      case "hero-header":
        return <DashboardHeroHeader />;
      default: {
        const Component = WIDGET_COMPONENTS[widgetId];
        return Component ? <Component /> : null;
      }
    }
  };

  return (
    <motion.div
      className="space-y-2 max-w-[1200px]"
      initial="initial"
      animate="animate"
      variants={stagger}
    >
      <BookingRequestsStrip />
      <PaymentReportsStrip />
      {/* System widgets (always render, not layout-controlled) */}
      <ReferralActivationChecker />
      {showAllTools && <SecondSessionBanner />}
      {showAllTools && <Week1RetentionWidget />}

      {/* Layout toolbar */}
      {showAllTools && <DashboardLayoutToolbar
        widgets={widgets}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
        onToggleVisibility={toggleVisibility}
        onCycleSize={cycleSize}
        onMove={moveWidget}
        onReset={resetLayout}
      />}

      {/* Dynamic widget grid */}
      <div className="grid grid-cols-12 gap-4">
        {widgets
          .filter(w => w.visible && (showAllTools || ["hero-header", "kpi-cards", "first-lead-assistant", "activity-feed"].includes(w.id)))
          .map(widget => {
            const content = renderWidget(widget.id);
            if (!content) return null;
            return (
              <DashboardWidgetWrapper key={widget.id} size={widget.size}>
                {content}
              </DashboardWidgetWrapper>
            );
          })}
      </div>
      {!showAllTools && <><ShareCardWidget /><TodaysSchedule /></>}

      {/* Mobile floating buttons */}
      {showAllTools && isMobile && <MobileJobDashboard />}
      {showAllTools && isMobile && <MobileQuickCreate />}

      {/* AI Business Assistant (floating) */}
      {showAllTools && <AIBusinessAssistant />}
    </motion.div>
  );
}
