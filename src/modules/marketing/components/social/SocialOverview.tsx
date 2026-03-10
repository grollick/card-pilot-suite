import { CalendarDays, Clock, AlertCircle, Send, Sparkles, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSocialPosts } from "@/hooks/useSocialPosts";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { useQueueSlots } from "@/hooks/useSocialQueue";
import { getPlatformConfig, getStatusConfig } from "./constants";
import { format } from "date-fns";
import type { SocialPost } from "@/hooks/useSocialPosts";

interface Props {
  onNewPost: () => void;
  onViewPost: (post: SocialPost) => void;
}

export default function SocialOverview({ onNewPost, onViewPost }: Props) {
  const { data: posts = [] } = useSocialPosts();
  const { data: accounts = [] } = useSocialAccounts();
  const { data: queueSlots = [] } = useQueueSlots();

  const connectedAccounts = accounts.filter(a => a.connected);
  const scheduledPosts = posts.filter(p => p.status === "scheduled");
  const pendingApproval = posts.filter(p => p.approval_status === "pending_approval");
  const publishedPosts = posts.filter(p => p.status === "published");
  const draftPosts = posts.filter(p => ["draft", "idea"].includes(p.approval_status ?? "draft"));

  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const scheduledThisWeek = scheduledPosts.filter(p => p.scheduled_at && new Date(p.scheduled_at) <= weekEnd);

  const nextScheduled = scheduledPosts
    .filter(p => p.scheduled_at && new Date(p.scheduled_at) > now)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0];

  const enabledSlots = queueSlots.filter(s => s.enabled);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="dash-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connectedAccounts.length}</p>
                <p className="text-xs text-muted-foreground">Connected Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dash-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledThisWeek.length}</p>
                <p className="text-xs text-muted-foreground">Scheduled This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dash-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingApproval.length}</p>
                <p className="text-xs text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dash-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Send className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{publishedPosts.length}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="dash-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> Queue Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Posts in queue</span>
              <span className="font-medium">{scheduledPosts.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Queue slots</span>
              <span className="font-medium">{enabledSlots.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Drafts ready</span>
              <span className="font-medium">{draftPosts.length}</span>
            </div>
            {nextScheduled && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">Next publish</p>
                <p className="text-sm font-medium">{format(new Date(nextScheduled.scheduled_at!), "MMM d, h:mm a")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="dash-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" /> Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {connectedAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No accounts connected</p>
            ) : (
              connectedAccounts.map(acct => {
                const cfg = getPlatformConfig(acct.provider);
                return (
                  <div key={acct.id} className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg?.color ?? "bg-muted"}`}>{acct.provider}</span>
                    <span className="text-xs text-muted-foreground truncate">{acct.account_name ? `@${acct.account_name}` : "Connected"}</span>
                    <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="dash-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> AI Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={onNewPost}>✨ Generate post from your services</Button>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={onNewPost}>📝 Create a before & after showcase</Button>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={onNewPost}>🎯 Write a seasonal promotion</Button>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={onNewPost}>💬 Draft a customer testimonial post</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="dash-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" /> Recent Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {posts.slice(0, 5).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No posts yet. Create your first post!</p>
          ) : (
            <div className="space-y-2">
              {posts.slice(0, 5).map(post => {
                const statusCfg = getStatusConfig(post.approval_status ?? "draft");
                return (
                  <button
                    key={post.id}
                    onClick={() => onViewPost(post)}
                    className="w-full text-left rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-1">{post.content}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {((post.platforms_json as any) || []).map((p: string) => {
                            const cfg = getPlatformConfig(p);
                            return <span key={p} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${cfg?.color ?? "bg-muted"}`}>{p}</span>;
                          })}
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${statusCfg.color}`}>{statusCfg.label}</Badge>
                        </div>
                      </div>
                      {post.scheduled_at && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{format(new Date(post.scheduled_at), "MMM d")}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
