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
      {/* System widgets (always render, not layout-controlled) */}
      <ReferralActivationChecker />
      <SecondSessionBanner />
      <Week1RetentionWidget />

      {/* Layout toolbar */}
      <DashboardLayoutToolbar
        widgets={widgets}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
        onToggleVisibility={toggleVisibility}
        onCycleSize={cycleSize}
        onMove={moveWidget}
        onReset={resetLayout}
      />

      {/* Dynamic widget grid */}
      <div className="grid grid-cols-12 gap-4">
        {widgets
          .filter(w => w.visible)
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

      {/* Mobile floating quick-create */}
      {isMobile && <MobileQuickCreate />}

      {/* AI Business Assistant (floating) */}
      <AIBusinessAssistant />
    </motion.div>
  );
}
