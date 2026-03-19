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
import LeadGuaranteeBanner from "@/components/LeadGuaranteeBanner";
import { useLeadGuarantee } from "@/hooks/useLeadGuarantee";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DashboardHome() {
  const isMobile = useIsMobile();
  const { data: guaranteeData } = useLeadGuarantee();

  return (
    <div className="space-y-6 max-w-[1280px]">
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

      {/* ── First Lead Celebration ── */}
      <FirstLeadCelebration />

      {/* ── Post-Lead Share Prompt ── */}
      <PostLeadSharePrompt />

      {/* ── On Duty for Estimates ── */}
      <EstimateDutyPanel />

      {/* ── SECTION 2: KPI Row ── */}
      <RevenueKPICards />

      {/* ── AI Growth Assistant Panel ── */}
      <AIGrowthAssistantPanel />

      {/* ── Business Performance ── */}
      <BusinessPerformancePanel />

      {/* ── Activation System ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivationChecklist />
        <div className="space-y-6">
          <ShareMessageCard />
          <ShareCardWidget />
        </div>
      </div>

      {/* ── Revenue Pipeline ── */}
      <RevenuePipelineWidget />

      {/* ── Next Actions ── */}
      <NextActionsWidget />

      {/* ── Main Grid: 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left Column (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          {/* ── SECTION 4: Opportunities ── */}
          <RevenueOpportunities />
          <MissedOpportunities />

          {/* ── SECTION 5: Activity Feed ── */}
          <DashboardActivityFeed />
        </div>

        {/* Right Column (2/5) */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── SECTION 3: Funnel ── */}
          <FunnelView />

          {/* ── On Duty for Estimates ── */}
          <EstimateDutyPanel />

          {/* ── Lead Guarantee Tracker ── */}
          {guaranteeData && !guaranteeData.targetMet && (
            <LeadGuaranteeBanner variant="dashboard" guaranteeData={guaranteeData} />
          )}

          {/* ── Lead Quality ── */}
          <LeadQualityWidget />

          {/* ── Lead Velocity ── */}
          <LeadVelocityWidget />

          {/* ── Retention Insights ── */}
          <RetentionInsightsWidget />

          {/* ── SECTION 7: Growth & Insights ── */}
          <GrowthTrends />
        </div>
      </div>
    </div>
  );
}
