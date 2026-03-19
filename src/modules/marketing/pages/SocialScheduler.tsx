import { useState } from "react";
import { PenLine, CalendarDays, Megaphone, Newspaper, BarChart3 } from "lucide-react";
import SocialCreateView from "../components/social/SocialCreateView";
import SocialCalendar from "../components/social/SocialCalendar";
import SocialCampaignsTab from "../components/social/SocialCampaignsTab";
import ContentFeedTab from "../components/social/ContentFeedTab";
import SocialAnalyticsTab from "../components/social/SocialAnalyticsTab";
import PostDetailDrawer from "../components/social/PostDetailDrawer";
import type { SocialPost } from "@/hooks/useSocialPosts";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "create", label: "Create", icon: PenLine },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "feed", label: "Content Feed", icon: Newspaper },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function SocialScheduler() {
  const [activeTab, setActiveTab] = useState("create");
  const [detailPost, setDetailPost] = useState<SocialPost | null>(null);
  const [editPost, setEditPost] = useState<SocialPost | null>(null);
  const [pendingContent, setPendingContent] = useState<{ content: string; hashtags: string[]; imageUrl?: string } | null>(null);

  const openCreate = (post?: SocialPost) => {
    setEditPost(post ?? null);
    setActiveTab("create");
  };

  const handleUseFeedPost = (data: { content: string; hashtags: string[]; imageUrl?: string }) => {
    setPendingContent(data);
    setActiveTab("create");
  };

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Social</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Create, schedule, and grow with AI-powered social content</p>
      </div>

      {/* Top Navigation */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
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
          <SocialCalendar
            onNewPost={() => openCreate()}
            onViewPost={setDetailPost}
          />
        )}
        {activeTab === "campaigns" && <SocialCampaignsTab />}
        {activeTab === "feed" && <ContentFeedTab onUsePost={handleUseFeedPost} />}
        {activeTab === "analytics" && <SocialAnalyticsTab />}
      </div>

      <PostDetailDrawer
        post={detailPost}
        onClose={() => setDetailPost(null)}
        onEdit={openCreate}
      />
    </div>
  );
}
