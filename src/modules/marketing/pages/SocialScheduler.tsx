import { useState } from "react";
import { PenLine, CalendarDays, Megaphone, Newspaper, BarChart3, Rocket, Crown } from "lucide-react";
import SocialCreateView from "../components/social/SocialCreateView";
import SocialCalendar from "../components/social/SocialCalendar";
import SocialCampaignsTab from "../components/social/SocialCampaignsTab";
import ContentFeedTab from "../components/social/ContentFeedTab";
import SocialAnalyticsTab from "../components/social/SocialAnalyticsTab";
import DFYMarketingTab from "../components/social/DFYMarketingTab";
import PostDetailDrawer from "../components/social/PostDetailDrawer";
import { SocialFeatureGate, useSocialPostLimits, ProBadge } from "../components/social/SocialPlanGate";
import type { SocialPost } from "@/hooks/useSocialPosts";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "create", label: "Create", icon: PenLine, feature: null },
  { id: "calendar", label: "Calendar", icon: CalendarDays, feature: "social_scheduling" as const },
  { id: "campaigns", label: "Campaigns", icon: Megaphone, feature: "social_scheduling" as const },
  { id: "feed", label: "Content Feed", icon: Newspaper, feature: "social_content_feed" as const },
  { id: "analytics", label: "Analytics", icon: BarChart3, feature: "social_analytics" as const },
  { id: "dfy", label: "Done-For-You", icon: Rocket, feature: "social_dfy" as const },
];

export default function SocialScheduler() {
  const [activeTab, setActiveTab] = useState("create");
  const [detailPost, setDetailPost] = useState<SocialPost | null>(null);
  const [editPost, setEditPost] = useState<SocialPost | null>(null);
  const [pendingContent, setPendingContent] = useState<{ content: string; hashtags: string[]; imageUrl?: string } | null>(null);
  const socialLimits = useSocialPostLimits();

  const openCreate = (post?: SocialPost) => {
    setEditPost(post ?? null);
    setActiveTab("create");
  };

  const handleUseFeedPost = (data: { content: string; hashtags: string[]; imageUrl?: string }) => {
    setPendingContent(data);
    setActiveTab("create");
  };

  const isFeatureLocked = (feature: string | null) => {
    if (!feature) return false;
    if (feature === "social_scheduling") return !socialLimits.canSchedule;
    if (feature === "social_content_feed") return !socialLimits.canUseFeed;
    if (feature === "social_analytics") return !socialLimits.canViewAnalytics;
    if (feature === "social_dfy") return !socialLimits.canUseDFY;
    return false;
  };

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Social</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Create, schedule, and grow with AI-powered social content</p>
        </div>
        {socialLimits.monthlyLimit !== -1 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Posts this month</p>
            <p className={cn("text-sm font-semibold", socialLimits.isAtLimit && "text-destructive")}>
              {socialLimits.postsThisMonth}/{socialLimits.monthlyLimit}
            </p>
          </div>
        )}
      </div>

      {/* Top Navigation */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {TABS.map(tab => {
          const locked = isFeatureLocked(tab.feature);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                tab.id === "dfy" && activeTab !== "dfy" && "text-primary"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {locked && <ProBadge tier={tab.feature === "social_dfy" ? "Pro Plus" : "Pro"} />}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-2">
        {activeTab === "create" && (
          <SocialCreateView
            editPost={editPost}
            onDone={() => setEditPost(null)}
            pendingContent={pendingContent}
            onPendingConsumed={() => setPendingContent(null)}
          />
        )}
        {activeTab === "calendar" && (
          <SocialFeatureGate feature="social_scheduling" label="Post Scheduling" description="Schedule and queue posts to publish at the perfect time. Upgrade to Pro to unlock the content calendar.">
            <SocialCalendar
              onNewPost={() => openCreate()}
              onViewPost={setDetailPost}
            />
          </SocialFeatureGate>
        )}
        {activeTab === "campaigns" && (
          <SocialFeatureGate feature="social_scheduling" label="Campaigns" description="Organize posts into campaigns for focused marketing efforts. Available on Pro and above.">
            <SocialCampaignsTab />
          </SocialFeatureGate>
        )}
        {activeTab === "feed" && (
          <SocialFeatureGate feature="social_content_feed" label="Content Feed" description="Get AI-generated trending content ideas tailored to your industry. Available on Pro and above.">
            <ContentFeedTab onUsePost={handleUseFeedPost} />
          </SocialFeatureGate>
        )}
        {activeTab === "analytics" && (
          <SocialFeatureGate feature="social_analytics" label="Social Analytics" description="Track post performance, engagement, leads generated, and get AI insights. Available on Pro and above.">
            <SocialAnalyticsTab />
          </SocialFeatureGate>
        )}
        {activeTab === "dfy" && <DFYMarketingTab onSwitchToCalendar={() => setActiveTab("calendar")} />}
      </div>

      <PostDetailDrawer
        post={detailPost}
        onClose={() => setDetailPost(null)}
        onEdit={openCreate}
      />
    </div>
  );
}
