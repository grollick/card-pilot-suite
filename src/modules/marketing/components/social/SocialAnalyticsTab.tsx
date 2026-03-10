import { BarChart3, TrendingUp, Clock, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSocialPosts } from "@/hooks/useSocialPosts";
import { PLATFORMS, getPlatformConfig } from "./constants";
import { format, subDays, isAfter } from "date-fns";

export default function SocialAnalyticsTab() {
  const { data: posts = [] } = useSocialPosts();

  const published = posts.filter(p => p.status === "published");
  const scheduled = posts.filter(p => p.status === "scheduled");
  const failed = posts.filter(p => p.approval_status === "failed");
  const last30 = published.filter(p => isAfter(new Date(p.created_at), subDays(new Date(), 30)));

  const platformCounts = PLATFORMS.map(platform => ({
    ...platform,
    count: published.filter(p => ((p.platforms_json as any) || []).includes(platform.id)).length,
  })).filter(p => p.count > 0).sort((a, b) => b.count - a.count);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayFrequency = dayNames.map((name, i) => ({
    name,
    count: published.filter(p => new Date(p.created_at).getDay() === i).length,
  }));

  const totalAttempted = published.length + failed.length;
  const successRate = totalAttempted > 0 ? Math.round((published.length / totalAttempted) * 100) : 100;

  const topPost = [...published].sort((a, b) =>
    ((b.platforms_json as any) || []).length - ((a.platforms_json as any) || []).length
  )[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="dash-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Send className="h-4 w-4 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold">{published.length}</p><p className="text-xs text-muted-foreground">Published</p></div>
          </CardContent>
        </Card>
        <Card className="dash-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center"><Clock className="h-4 w-4 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{scheduled.length}</p><p className="text-xs text-muted-foreground">Scheduled</p></div>
          </CardContent>
        </Card>
        <Card className="dash-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-primary" /></div>
            <div><p className="text-2xl font-bold">{last30.length}</p><p className="text-xs text-muted-foreground">Last 30 Days</p></div>
          </CardContent>
        </Card>
        <Card className="dash-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center"><BarChart3 className="h-4 w-4 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{successRate}%</p><p className="text-xs text-muted-foreground">Success Rate</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="dash-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Posts by Platform</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {platformCounts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No published posts yet</p>
            ) : platformCounts.map(p => {
              const cfg = getPlatformConfig(p.id);
              const maxCount = platformCounts[0]?.count || 1;
              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg?.color}`}>{p.id}</span>
                    <span className="text-xs font-medium">{p.count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(p.count / maxCount) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="dash-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Post Frequency by Day</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {dayFrequency.map(d => {
                const maxCount = Math.max(...dayFrequency.map(x => x.count), 1);
                const height = (d.count / maxCount) * 100;
                return (
                  <div key={d.name} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-muted-foreground">{d.count}</span>
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

        {topPost && (
          <Card className="dash-card md:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Top Performing Post</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border p-3">
                <p className="text-sm">{topPost.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  {((topPost.platforms_json as any) || []).map((p: string) => {
                    const cfg = getPlatformConfig(p);
                    return <span key={p} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg?.color}`}>{p}</span>;
                  })}
                  <span className="text-xs text-muted-foreground ml-auto">{format(new Date(topPost.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
