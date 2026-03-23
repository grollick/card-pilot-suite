import { useState } from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialSidebar from "../components/social/SocialSidebar";
import type { SocialView } from "../components/social/SocialSidebar";
import SocialCreateView from "../components/social/SocialCreateView";
import SocialCalendar from "../components/social/SocialCalendar";
import SocialCampaignsTab from "../components/social/SocialCampaignsTab";
import ContentFeedTab from "../components/social/ContentFeedTab";
import SocialAnalyticsTab from "../components/social/SocialAnalyticsTab";
import DFYMarketingTab from "../components/social/DFYMarketingTab";
import SocialStreams from "../components/social/SocialStreams";
import SocialPlanner from "../components/social/SocialPlanner";
import SocialBulkImport from "../components/social/SocialBulkImport";
import SocialInbox from "../components/social/SocialInbox";
import PostDetailDrawer from "../components/social/PostDetailDrawer";
import { SocialFeatureGate, useSocialPostLimits } from "../components/social/SocialPlanGate";
import type { SocialPost } from "@/hooks/useSocialPosts";
import { cn } from "@/lib/utils";

export default function SocialScheduler() {
  const [activeView, setActiveView] = useState<SocialView>("streams");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [detailPost, setDetailPost] = useState<SocialPost | null>(null);
  const [editPost, setEditPost] = useState<SocialPost | null>(null);
  const [pendingContent, setPendingContent] = useState<{ content: string; hashtags: string[]; imageUrl?: string } | null>(null);
  const socialLimits = useSocialPostLimits();

  const handleChangeView = (view: SocialView) => {
    setDetailPost(null);
    if (view !== "compose") setEditPost(null);
    setActiveView(view);
  };

  const openCompose = (post?: SocialPost) => {
    setDetailPost(null);
    setEditPost(post ?? null);
    setActiveView("compose");
  };

  const handleUseFeedPost = (data: { content: string; hashtags: string[]; imageUrl?: string }) => {
    setDetailPost(null);
    setPendingContent(data);
    setActiveView("compose");
  };

  // Determine which features are locked
  const lockedFeatures = new Set<string>();
  if (!socialLimits.canSchedule) { lockedFeatures.add("calendar"); lockedFeatures.add("planner"); lockedFeatures.add("campaigns"); }
  if (!socialLimits.canUseFeed) lockedFeatures.add("feed");
  if (!socialLimits.canViewAnalytics) lockedFeatures.add("analytics");
  if (!socialLimits.canUseDFY) lockedFeatures.add("dfy");

  const renderView = () => {
    switch (activeView) {
      case "streams":
        return <SocialStreams onViewPost={setDetailPost} onCompose={(data) => { setDetailPost(null); setPendingContent(data); setActiveView("compose"); }} />;
      case "compose":
        return (
          <SocialCreateView
            editPost={editPost}
            onDone={() => setEditPost(null)}
            pendingContent={pendingContent}
            onPendingConsumed={() => setPendingContent(null)}
          />
        );
      case "calendar":
        return (
          <SocialFeatureGate feature="social_scheduling" label="Content Calendar" description="Schedule and queue posts to publish at the perfect time.">
            <SocialCalendar onNewPost={() => openCompose()} onViewPost={setDetailPost} />
          </SocialFeatureGate>
        );
      case "planner":
        return (
          <SocialFeatureGate feature="social_scheduling" label="Content Planner" description="Drag-and-drop Kanban board for your content pipeline.">
            <SocialPlanner onEdit={openCompose} onViewDetail={setDetailPost} />
          </SocialFeatureGate>
        );
      case "bulk":
        return (
          <SocialFeatureGate feature="social_scheduling" label="Bulk Import" description="Upload a CSV to schedule dozens of posts at once.">
            <SocialBulkImport />
          </SocialFeatureGate>
        );
      case "inbox":
        return <SocialInbox />;
      case "campaigns":
        return (
          <SocialFeatureGate feature="social_scheduling" label="Campaigns" description="Organize posts into campaigns for focused marketing efforts.">
            <SocialCampaignsTab />
          </SocialFeatureGate>
        );
      case "feed":
        return (
          <SocialFeatureGate feature="social_content_feed" label="Content Feed" description="Get AI-generated trending content ideas tailored to your industry.">
            <ContentFeedTab onUsePost={handleUseFeedPost} />
          </SocialFeatureGate>
        );
      case "analytics":
        return (
          <SocialFeatureGate feature="social_analytics" label="Social Analytics" description="Track post performance, engagement, and get AI insights.">
            <SocialAnalyticsTab />
          </SocialFeatureGate>
        );
      case "dfy":
        return <DFYMarketingTab onSwitchToCalendar={() => handleChangeView("calendar")} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-4 md:-m-6 lg:-m-8">
      {/* Sidebar */}
      <SocialSidebar
        activeView={activeView}
        onChangeView={handleChangeView}
        lockedFeatures={lockedFeatures}
        collapsed={sidebarCollapsed}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between h-12 px-4 border-b border-border shrink-0 bg-background">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
            <h1 className="text-sm font-bold capitalize"><span className="font-black text-primary text-4xl">guzzl</span> <span className="font-normal">{activeView === "dfy" ? "Done-For-You" : "Social"}</span></h1>
          </div>
          {socialLimits.monthlyLimit !== -1 && (
            <div className="text-right">
              <p className={cn("text-xs font-medium", socialLimits.isAtLimit ? "text-destructive" : "text-muted-foreground")}>
                {socialLimits.postsThisMonth}/{socialLimits.monthlyLimit} posts this month
              </p>
            </div>
          )}
        </div>

        {/* View content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {renderView()}
        </div>
      </div>

      <PostDetailDrawer
        post={detailPost}
        onClose={() => setDetailPost(null)}
        onEdit={openCompose}
      />
    </div>
  );
}
