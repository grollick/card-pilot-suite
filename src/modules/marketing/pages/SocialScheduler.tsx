import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutDashboard, FileText, CalendarDays, Columns3, ListOrdered, BarChart3, Users, LayoutPanelLeft, Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SocialOverview from "../components/social/SocialOverview";
import SocialPostsList from "../components/social/SocialPostsList";
import SocialCalendar from "../components/social/SocialCalendar";
import SocialPlanner from "../components/social/SocialPlanner";
import SocialStreams from "../components/social/SocialStreams";
import SocialQueue from "../components/social/SocialQueue";
import SocialAnalyticsTab from "../components/social/SocialAnalyticsTab";
import SocialAccountsPanel from "../components/social/SocialAccountsPanel";
import SocialComposerDialog from "../components/social/SocialComposerDialog";
import PostDetailDrawer from "../components/social/PostDetailDrawer";
import type { SocialPost } from "@/hooks/useSocialPosts";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "posts", label: "Posts", icon: FileText },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "planner", label: "Planner", icon: LayoutPanelLeft },
  { id: "streams", label: "Streams", icon: Columns3 },
  { id: "queue", label: "Queue", icon: ListOrdered },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "accounts", label: "Accounts", icon: Users },
];

export default function SocialScheduler() {
  const navigate = useNavigate();
  const [composerOpen, setComposerOpen] = useState(false);
  const [editPost, setEditPost] = useState<SocialPost | null>(null);
  const [detailPost, setDetailPost] = useState<SocialPost | null>(null);

  const openComposer = (post?: SocialPost) => {
    setEditPost(post ?? null);
    setComposerOpen(true);
  };

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Social</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Plan, schedule, and monitor your social media</p>
        </div>
        <Button className="shadow-glow" onClick={() => openComposer()}>
          <Plus className="h-4 w-4 mr-2" /> New Post
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-0.5 bg-muted/50 p-1">
          {TABS.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs data-[state=active]:shadow-sm">
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <SocialOverview onNewPost={() => openComposer()} onViewPost={setDetailPost} />
        </TabsContent>
        <TabsContent value="posts" className="mt-4">
          <SocialPostsList onEdit={openComposer} onViewDetail={setDetailPost} />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <SocialCalendar onNewPost={() => openComposer()} onViewPost={setDetailPost} />
        </TabsContent>
        <TabsContent value="planner" className="mt-4">
          <SocialPlanner onEdit={openComposer} onViewDetail={setDetailPost} />
        </TabsContent>
        <TabsContent value="streams" className="mt-4">
          <SocialStreams onViewPost={setDetailPost} />
        </TabsContent>
        <TabsContent value="queue" className="mt-4">
          <SocialQueue />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <SocialAnalyticsTab />
        </TabsContent>
        <TabsContent value="accounts" className="mt-4">
          <SocialAccountsPanel />
        </TabsContent>
      </Tabs>

      <SocialComposerDialog
        open={composerOpen}
        onOpenChange={setComposerOpen}
        editPost={editPost}
        onClose={() => { setComposerOpen(false); setEditPost(null); }}
      />

      <PostDetailDrawer
        post={detailPost}
        onClose={() => setDetailPost(null)}
        onEdit={openComposer}
      />
    </div>
  );
}
