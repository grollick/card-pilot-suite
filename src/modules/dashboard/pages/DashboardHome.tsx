import { motion } from "framer-motion";
import RevenueKPICards from "@/modules/dashboard/components/RevenueKPICards";
import FunnelView from "@/modules/dashboard/components/FunnelView";
import MissedOpportunities from "@/modules/dashboard/components/MissedOpportunities";
import RevenueQuickActions from "@/modules/dashboard/components/RevenueQuickActions";
import GrowthTrends from "@/modules/dashboard/components/GrowthTrends";
import NextActionsWidget from "@/modules/dashboard/components/NextActionsWidget";
import LeadQualityWidget from "@/modules/dashboard/components/LeadQualityWidget";
import LeadVelocityWidget from "@/modules/dashboard/components/LeadVelocityWidget";
import RevenueOpportunities from "@/modules/dashboard/components/RevenueOpportunities";
import DashboardActivityFeed from "@/modules/dashboard/components/DashboardActivityFeed";
import ShareCardWidget from "@/modules/dashboard/components/ShareCardWidget";
import MobileJobDashboard from "@/modules/dashboard/components/MobileJobDashboard";
import ActivationChecklist from "@/modules/dashboard/components/ActivationChecklist";
import ShareMessageCard from "@/modules/dashboard/components/ShareMessageCard";
import FirstLeadCelebration from "@/modules/dashboard/components/FirstLeadCelebration";
import PostLeadSharePrompt from "@/modules/dashboard/components/PostLeadSharePrompt";
import BusinessPerformancePanel from "@/modules/dashboard/components/BusinessPerformancePanel";
import RetentionInsightsWidget from "@/modules/dashboard/components/RetentionInsightsWidget";
import AIGrowthAssistantPanel from "@/modules/dashboard/components/AIGrowthAssistantPanel";
import EstimateDutyPanel from "@/modules/dashboard/components/EstimateDutyPanel";
import RevenuePipelineWidget from "@/modules/dashboard/components/RevenuePipelineWidget";
import SmartRevenueWidget from "@/modules/dashboard/components/SmartRevenueWidget";
import LeadPerformanceWidget from "@/modules/dashboard/components/LeadPerformanceWidget";
import LeadGuaranteeBanner from "@/components/LeadGuaranteeBanner";
import MobileQuickCreate from "@/modules/invoices/components/MobileQuickCreate";
import AhaPromptBanner from "@/modules/dashboard/components/AhaPromptBanner";
import ChurnRecoveryBanner from "@/modules/dashboard/components/ChurnRecoveryBanner";
import MilestoneCelebrationListener from "@/modules/dashboard/components/MilestoneCelebrationListener";
import ReferralActivationChecker from "@/modules/dashboard/components/ReferralActivationChecker";
import ReferralWidget from "@/modules/dashboard/components/ReferralWidget";
import VerificationChecklist from "@/modules/dashboard/components/VerificationChecklist";
import MarketplaceAwarenessWidget from "@/modules/dashboard/components/MarketplaceAwarenessWidget";
import YouAreLiveBanner from "@/modules/dashboard/components/YouAreLiveBanner";
import { useLeadGuarantee } from "@/hooks/useLeadGuarantee";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DashboardHome() {
  const isMobile = useIsMobile();
  const { data: guaranteeData } = useLeadGuarantee();

  return (
    <div className="space-y-4 max-w-[1280px]">
      <ReferralActivationChecker />
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your revenue control center
          </p>
        </div>
        {!isMobile && <RevenueQuickActions />}
      </motion.div>

      {/* Mobile Job Dashboard */}
      {isMobile && <MobileJobDashboard />}

      {/* ── Contextual banners (grouped to avoid empty gaps) ── */}
      <div className="flex flex-col gap-4 empty:hidden [&:not(:has(>*))]:hidden">
        <YouAreLiveBanner />
        <FirstLeadCelebration />
        <MilestoneCelebrationListener />
        <ChurnRecoveryBanner />
        <AhaPromptBanner />
        <PostLeadSharePrompt />
        <EstimateDutyPanel />
        <MarketplaceAwarenessWidget />
      </div>

      {/* ── SECTION 2: KPI Row ── */}
      <RevenueKPICards />

      {/* ── AI Growth Assistant Panel ── */}
      <AIGrowthAssistantPanel />

      {/* ── Business Performance ── */}
      <BusinessPerformancePanel />

      {/* ── Referral Widget ── */}
      <ReferralWidget />

      {/* ── Activation System ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <VerificationChecklist />
          <ActivationChecklist />
        </div>
        <div className="space-y-5">
          <ShareMessageCard />
          <ShareCardWidget />
        </div>
      </div>

      {/* ── Smart Revenue & Coaching ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RevenuePipelineWidget />
        <SmartRevenueWidget />
      </div>

      {/* ── Lead Performance ── */}
      <LeadPerformanceWidget />

      {/* ── Next Actions ── */}
      <NextActionsWidget />

      {/* ── Main Grid: 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left Column (3/5) */}
        <div className="lg:col-span-3 space-y-5">
          <RevenueOpportunities />
          <MissedOpportunities />
          <DashboardActivityFeed />
        </div>

        {/* Right Column (2/5) */}
        <div className="lg:col-span-2 space-y-5">
          <FunnelView />
          {guaranteeData && !guaranteeData.targetMet && (
            <LeadGuaranteeBanner variant="dashboard" guaranteeData={guaranteeData} />
          )}
          <LeadQualityWidget />
          <LeadVelocityWidget />
          <RetentionInsightsWidget />
          <GrowthTrends />
        </div>
      </div>

      {/* Mobile floating quick-create buttons */}
      {isMobile && <MobileQuickCreate />}
    </div>
  );
}
