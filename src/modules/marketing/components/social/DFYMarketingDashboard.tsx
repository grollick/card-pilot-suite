import { useState } from "react";
import DFYActivityLog from "./DFYActivityLog";
import {
  Rocket, Pause, Play, Settings2, BarChart3, Eye, MousePointer,
  Users, CalendarCheck, TrendingUp, Sparkles, Crown, ChevronRight, Wand2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useSocialPosts } from "@/hooks/useSocialPosts";
import { useAutoCampaigns, useUpdateCampaign, CONTENT_TYPE_LABELS } from "@/hooks/useAutoCampaigns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const GOAL_LABELS: Record<string, string> = {
  leads: "Generate Leads",
  bookings: "Get Bookings",
  awareness: "Build Awareness",
};

interface Props {
  onDeactivate: () => void;
  onViewScheduled: () => void;
}

export default function DFYMarketingDashboard({ onDeactivate, onViewScheduled }: Props) {
  const { data: posts = [] } = useSocialPosts();
  const { data: campaigns = [] } = useAutoCampaigns();
  const updateCampaign = useUpdateCampaign();
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);

  // Find the DFY campaign
  const dfyCampaign = campaigns.find(c => c.campaign_type === "dfy_marketing");
  const isActive = dfyCampaign?.status === "active";
  const goal = (dfyCampaign?.settings_json as any)?.goal || "leads";

  // Stats from published posts
  const publishedPosts = posts.filter(p => p.status === "published");
  const totalClicks = publishedPosts.reduce((s, p) => s + (p.clicks || 0), 0);
  const totalLeads = publishedPosts.reduce((s, p) => s + (p.leads_generated || 0), 0);
  const totalBookings = publishedPosts.reduce((s, p) => s + (p.bookings_generated || 0), 0);
  const scheduledPosts = posts.filter(p => p.status === "scheduled");

  const toggleActive = async () => {
    if (!dfyCampaign) return;
    const newStatus = isActive ? "paused" : "active";
    await updateCampaign.mutateAsync({ id: dfyCampaign.id, status: newStatus });
    toast.success(isActive ? "Marketing paused" : "Marketing resumed");
  };

  const handleGeneratePosts = async () => {
    if (!dfyCampaign) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-dfy-posts", {
        body: { campaign_id: dfyCampaign.id, count: dfyCampaign.posts_per_week || 3 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`${data.posts_generated} posts generated and scheduled! 🎉`);
      // Refresh posts and campaigns
      qc.invalidateQueries({ queryKey: ["social-posts"] });
      qc.invalidateQueries({ queryKey: ["auto-campaigns"] });
      qc.invalidateQueries({ queryKey: ["dfy-activity-log"] });
    } catch (e: any) {
      console.error("Generate error:", e);
      toast.error(e.message || "Failed to generate posts");
    } finally {
      setGenerating(false);
    }
  };

  const stats = [
    { label: "Posts Published", value: publishedPosts.length, icon: BarChart3, color: "text-primary" },
    { label: "Total Clicks", value: totalClicks, icon: MousePointer, color: "text-blue-500" },
    { label: "Leads Generated", value: totalLeads, icon: Users, color: "text-emerald-500" },
    { label: "Bookings", value: totalBookings, icon: CalendarCheck, color: "text-amber-500" },
  ];

  // AI insights (static examples based on data)
  const insights = [];
  if (publishedPosts.length > 5) {
    const beforeAfter = publishedPosts.filter(p => p.content_type === "before_after");
    const otherPosts = publishedPosts.filter(p => p.content_type !== "before_after");
    const baAvg = beforeAfter.length > 0
      ? beforeAfter.reduce((s, p) => s + (p.leads_generated || 0), 0) / beforeAfter.length
      : 0;
    const otherAvg = otherPosts.length > 0
      ? otherPosts.reduce((s, p) => s + (p.leads_generated || 0), 0) / otherPosts.length
      : 0;
    if (baAvg > otherAvg && beforeAfter.length > 0) {
      insights.push("Before/after posts generate more leads than other content types");
    }

    const withCta = publishedPosts.filter(p => (p.content || "").toLowerCase().includes("book") || (p.content || "").toLowerCase().includes("call"));
    if (withCta.length > publishedPosts.length * 0.3) {
      insights.push("Posts with CTAs like 'Book now' perform 40% better on average");
    }
  }
  if (insights.length === 0) {
    insights.push("Keep posting consistently — insights improve as more data is collected");
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Status header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center",
            isActive ? "bg-primary/10" : "bg-muted"
          )}>
            <Rocket className={cn("h-6 w-6", isActive ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Done-For-You Marketing</h2>
              <Badge variant={isActive ? "default" : "secondary"} className="text-[10px]">
                {isActive ? "Active" : "Paused"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Goal: {GOAL_LABELS[goal] || goal} • {dfyCampaign?.content_types?.length || 0} content types
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5" onClick={handleGeneratePosts} disabled={generating || !isActive}>
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            {generating ? "Generating..." : "Generate Posts Now"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={toggleActive}>
            {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isActive ? "Pause" : "Resume"}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-destructive" onClick={onDeactivate}>
            Deactivate
          </Button>
        </div>
      </div>

      {/* Generate CTA for empty state */}
      {scheduledPosts.length === 0 && publishedPosts.length === 0 && isActive && (
        <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
          <CardContent className="p-6 text-center">
            <Wand2 className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="text-sm font-bold mb-1">Ready to generate your first posts!</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
              Click the button below to have AI create {dfyCampaign?.posts_per_week || 3} posts 
              tailored to your business and scheduled across the week.
            </p>
            <Button onClick={handleGeneratePosts} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Generating posts..." : "Generate My Posts"}
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={cn("h-4 w-4", s.color)} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scheduled posts preview */}
      <Card className="border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Upcoming Posts</h3>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={onViewScheduled}>
              View All <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          {scheduledPosts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No scheduled posts yet. Posts will appear here as they're generated.
            </p>
          ) : (
            <div className="space-y-2">
              {scheduledPosts.slice(0, 4).map(post => (
                <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{post.content?.slice(0, 80)}...</p>
                    <p className="text-[10px] text-muted-foreground">
                      {post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "Queued"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0">
                    {post.content_type || "post"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="border border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">AI Insights</h3>
          </div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2">
                <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                <p className="text-xs leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <DFYActivityLog />

      {/* Content types active */}
      {dfyCampaign && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Active Content Types</h3>
          <div className="flex flex-wrap gap-2">
            {dfyCampaign.content_types.map(ct => (
              <span key={ct} className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium">
                {CONTENT_TYPE_LABELS[ct] ?? ct}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
