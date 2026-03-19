import { useState } from "react";
import { BarChart3, TrendingUp, Clock, Send, Zap, Target, ArrowUpRight, Sparkles, Crown, MousePointerClick, Users, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSocialPosts, useUpdatePost } from "@/hooks/useSocialPosts";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { PLATFORMS, getPlatformConfig, CONTENT_LABELS, getLabelConfig } from "./constants";
import { format, subDays, isAfter } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SocialPost } from "@/hooks/useSocialPosts";

// ── AI Insights Hook ──
function useContentInsights(posts: SocialPost[], planKey: string) {
  const [insights, setInsights] = useState<{ title: string; description: string; type: string; action?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    if (planKey === "starter") {
      toast.error("Upgrade to Pro for AI insights");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("content-performance-ai", {
        body: { posts: posts.slice(0, 50) },
      });
      if (error) throw error;
      setInsights(data?.insights ?? []);
    } catch {
      toast.error("Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  return { insights, loading, generateInsights };
}

// ── Stat Card ──
function StatCard({ icon: Icon, label, value, trend, color }: { icon: any; label: string; value: string | number; trend?: string; color: string }) {
  return (
    <Card className="dash-card">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        {trend && (
          <Badge variant="secondary" className="text-[10px] gap-0.5">
            <ArrowUpRight className="h-3 w-3" />
            {trend}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

// ── Top Post Row ──
function TopPostRow({ post, rank, onCreateSimilar, onImprove, canUseAI }: { post: SocialPost; rank: number; onCreateSimilar: (p: SocialPost) => void; onImprove: (p: SocialPost) => void; canUseAI: boolean }) {
  const totalEngagement = post.clicks + post.link_clicks + post.leads_generated + post.bookings_generated;
  const labelCfg = post.content_label ? getLabelConfig(post.content_label) : null;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
        {rank}
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm line-clamp-2">{post.content}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {((post.platforms_json as any) || []).map((p: string) => {
            const cfg = getPlatformConfig(p);
            return <span key={p} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${cfg?.color}`}>{p}</span>;
          })}
          {labelCfg && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${labelCfg.color}`}>{labelCfg.label}</span>}
          <span className="text-[10px] text-muted-foreground">{format(new Date(post.created_at), "MMM d")}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><MousePointerClick className="h-3 w-3" />{post.clicks} clicks</span>
          <span className="flex items-center gap-0.5"><Target className="h-3 w-3" />{post.link_clicks} link clicks</span>
          <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{post.leads_generated} leads</span>
          <span className="flex items-center gap-0.5"><CalendarCheck className="h-3 w-3" />{post.bookings_generated} bookings</span>
        </div>
      </div>
      {canUseAI && (
        <div className="flex flex-col gap-1 flex-shrink-0">
          <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => onCreateSimilar(post)}>
            <Sparkles className="h-3 w-3 mr-1" />Similar
          </Button>
          <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => onImprove(post)}>
            <Zap className="h-3 w-3 mr-1" />Improve
          </Button>
        </div>
      )}
    </div>
  );
}

export default function SocialAnalyticsTab() {
  const { data: posts = [] } = useSocialPosts();
  const updatePost = useUpdatePost();
  const { planKey } = usePlanLimits();
  const isPro = planKey !== "starter";
  const isProPlus = planKey === "pro" || planKey === "agency";

  const published = posts.filter(p => p.status === "published");
  const scheduled = posts.filter(p => p.status === "scheduled");
  const last30 = published.filter(p => isAfter(new Date(p.created_at), subDays(new Date(), 30)));

  // Performance metrics
  const totalClicks = published.reduce((s, p) => s + (p.clicks || 0), 0);
  const totalLinkClicks = published.reduce((s, p) => s + (p.link_clicks || 0), 0);
  const totalLeads = published.reduce((s, p) => s + (p.leads_generated || 0), 0);
  const totalBookings = published.reduce((s, p) => s + (p.bookings_generated || 0), 0);

  // Top performing posts by engagement
  const topPosts = [...published]
    .sort((a, b) => {
      const scoreA = (a.clicks || 0) + (a.link_clicks || 0) * 2 + (a.leads_generated || 0) * 5 + (a.bookings_generated || 0) * 10;
      const scoreB = (b.clicks || 0) + (b.link_clicks || 0) * 2 + (b.leads_generated || 0) * 5 + (b.bookings_generated || 0) * 10;
      return scoreB - scoreA;
    })
    .slice(0, 5);

  // Content type breakdown
  const contentTypeStats = CONTENT_LABELS.map(label => {
    const typePosts = published.filter(p => p.content_label === label.value);
    return {
      ...label,
      count: typePosts.length,
      leads: typePosts.reduce((s, p) => s + (p.leads_generated || 0), 0),
      clicks: typePosts.reduce((s, p) => s + (p.clicks || 0), 0),
    };
  }).filter(t => t.count > 0).sort((a, b) => b.leads - a.leads);

  // Platform performance
  const platformPerf = PLATFORMS.map(platform => {
    const platPosts = published.filter(p => ((p.platforms_json as any) || []).includes(platform.id));
    return {
      ...platform,
      count: platPosts.length,
      clicks: platPosts.reduce((s, p) => s + (p.clicks || 0), 0),
      leads: platPosts.reduce((s, p) => s + (p.leads_generated || 0), 0),
    };
  }).filter(p => p.count > 0).sort((a, b) => b.leads - a.leads);

  // Day frequency
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayFrequency = dayNames.map((name, i) => ({
    name,
    count: published.filter(p => new Date(p.created_at).getDay() === i).length,
    leads: published.filter(p => new Date(p.created_at).getDay() === i).reduce((s, p) => s + (p.leads_generated || 0), 0),
  }));

  const { insights, loading: insightsLoading, generateInsights } = useContentInsights(published, planKey);

  const handleCreateSimilar = async (post: SocialPost) => {
    try {
      const { data, error } = await supabase.functions.invoke("content-performance-ai", {
        body: { action: "create_similar", post },
      });
      if (error) throw error;
      toast.success("Similar post draft created!");
    } catch {
      toast.error("Failed to create similar post");
    }
  };

  const handleImprove = async (post: SocialPost) => {
    try {
      const { data, error } = await supabase.functions.invoke("content-performance-ai", {
        body: { action: "improve", post },
      });
      if (error) throw error;
      if (data?.improved_content) {
        await updatePost.mutateAsync({ id: post.id, performance_notes: data.improved_content } as any);
        toast.success("Improvement suggestions added to post notes");
      }
    } catch {
      toast.error("Failed to generate improvements");
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Send} label="Published" value={published.length} color="bg-emerald-500/10 text-emerald-600" />
        <StatCard icon={MousePointerClick} label="Total Clicks" value={totalClicks} color="bg-blue-500/10 text-blue-600" />
        <StatCard icon={Users} label="Leads Generated" value={totalLeads} color="bg-primary/10 text-primary" />
        <StatCard icon={CalendarCheck} label="Bookings" value={totalBookings} color="bg-amber-500/10 text-amber-600" />
      </div>

      {/* AI Insights Section */}
      <Card className="dash-card">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">AI Content Insights</CardTitle>
            {!isPro && <Badge variant="secondary" className="text-[9px] gap-0.5"><Crown className="h-3 w-3" />Pro</Badge>}
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={generateInsights} disabled={insightsLoading || !isPro}>
            {insightsLoading ? "Analyzing..." : "Generate Insights"}
          </Button>
        </CardHeader>
        <CardContent>
          {!isPro ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-sm text-muted-foreground">Upgrade to Pro to unlock AI-powered content insights</p>
              <p className="text-xs text-muted-foreground">Learn which posts generate the most leads and get improvement suggestions</p>
            </div>
          ) : insights.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Click "Generate Insights" to analyze your content performance</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {insights.map((insight, i) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  insight.type === "warning" ? "border-amber-500/30 bg-amber-500/5" :
                  insight.type === "tip" ? "border-emerald-500/30 bg-emerald-500/5" :
                  "border-border bg-accent/30"
                }`}>
                  <p className="text-xs font-medium mb-0.5">{insight.title}</p>
                  <p className="text-[10px] text-muted-foreground">{insight.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Performing Posts */}
        <Card className="dash-card md:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Top Performing Posts</CardTitle>
            <Badge variant="secondary" className="text-[10px]">{published.length} total</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {topPosts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No published posts yet. Create and publish posts to see performance data.</p>
            ) : topPosts.map((post, i) => (
              <TopPostRow
                key={post.id}
                post={post}
                rank={i + 1}
                onCreateSimilar={handleCreateSimilar}
                onImprove={handleImprove}
                canUseAI={isPro}
              />
            ))}
          </CardContent>
        </Card>

        {/* Content Type Performance */}
        <Card className="dash-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Performance by Content Type</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {contentTypeStats.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Label your posts to track content type performance</p>
            ) : contentTypeStats.map(ct => {
              const maxLeads = contentTypeStats[0]?.leads || 1;
              return (
                <div key={ct.value} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ct.color}`}>{ct.label}</span>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-muted-foreground">{ct.count} posts</span>
                      <span className="font-medium">{ct.leads} leads</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(ct.leads / maxLeads) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Platform Performance */}
        <Card className="dash-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Performance by Platform</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {platformPerf.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No published posts yet</p>
            ) : platformPerf.map(p => {
              const cfg = getPlatformConfig(p.id);
              const maxLeads = platformPerf[0]?.leads || 1;
              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg?.color}`}>{p.id}</span>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-muted-foreground">{p.clicks} clicks</span>
                      <span className="font-medium">{p.leads} leads</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${maxLeads > 0 ? (p.leads / maxLeads) * 100 : 0}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Post Frequency & Leads by Day */}
        <Card className="dash-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Posts & Leads by Day</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {dayFrequency.map(d => {
                const maxCount = Math.max(...dayFrequency.map(x => x.count), 1);
                const height = (d.count / maxCount) * 100;
                return (
                  <div key={d.name} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-muted-foreground">{d.leads}L</span>
                    <span className="text-[9px] font-medium">{d.count}</span>
                    <div className="w-full bg-primary/20 rounded-t transition-all" style={{ height: `${Math.max(height, 4)}%` }}>
                      <div className="w-full h-full bg-primary rounded-t" />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{d.name}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Report (Pro Plus) */}
        <Card className="dash-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Weekly Report</CardTitle>
            {!isProPlus && <Badge variant="secondary" className="text-[9px] gap-0.5"><Crown className="h-3 w-3" />Pro Plus</Badge>}
          </CardHeader>
          <CardContent>
            {!isProPlus ? (
              <div className="text-center py-4 space-y-1">
                <p className="text-xs text-muted-foreground">Weekly AI performance reports with auto-optimization</p>
                <p className="text-[10px] text-muted-foreground">Available on Pro Plus</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Posts this week</span>
                  <span className="font-medium">{last30.filter(p => isAfter(new Date(p.created_at), subDays(new Date(), 7))).length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Leads this week</span>
                  <span className="font-medium">
                    {last30.filter(p => isAfter(new Date(p.created_at), subDays(new Date(), 7))).reduce((s, p) => s + (p.leads_generated || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Avg leads/post</span>
                  <span className="font-medium">
                    {published.length > 0 ? (totalLeads / published.length).toFixed(1) : "0"}
                  </span>
                </div>
                <Button size="sm" variant="outline" className="w-full h-7 text-xs mt-2" onClick={generateInsights} disabled={insightsLoading}>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Generate Weekly Summary
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
