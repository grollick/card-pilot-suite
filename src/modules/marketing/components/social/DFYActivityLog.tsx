import { forwardRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, CheckCircle2, Sparkles, Send, Pause, Play, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "post_generated" | "post_published" | "post_scheduled" | "campaign_paused" | "campaign_resumed" | "autopilot";
  title: string;
  description?: string;
  timestamp: string;
}

const ICON_MAP: Record<ActivityItem["type"], typeof Sparkles> = {
  post_generated: Sparkles,
  post_published: CheckCircle2,
  post_scheduled: Clock,
  campaign_paused: Pause,
  campaign_resumed: Play,
  autopilot: Send,
};

const COLOR_MAP: Record<ActivityItem["type"], string> = {
  post_generated: "text-primary",
  post_published: "text-emerald-500",
  post_scheduled: "text-blue-500",
  campaign_paused: "text-amber-500",
  campaign_resumed: "text-primary",
  autopilot: "text-violet-500",
};

const DFYActivityLog = forwardRef<HTMLDivElement>(function DFYActivityLog(_props, ref) {
  const { user } = useAuth();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["dfy-activity-log", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const items: ActivityItem[] = [];

      // Fetch recent social posts created by DFY
      const { data: posts } = await supabase
        .from("social_posts")
        .select("id, content, status, created_at, scheduled_at, content_type, content_label")
        .eq("user_id", user!.id)
        .like("content_label", "dfy:%")
        .order("created_at", { ascending: false })
        .limit(30);

      for (const p of posts ?? []) {
        const snippet = (p.content || "").slice(0, 60);

        if (p.status === "published") {
          items.push({
            id: `pub-${p.id}`,
            type: "post_published",
            title: "Post published",
            description: snippet,
            timestamp: p.created_at,
          });
        }
        if (p.status === "scheduled" && p.scheduled_at) {
          items.push({
            id: `sched-${p.id}`,
            type: "post_scheduled",
            title: "Post scheduled",
            description: snippet,
            timestamp: p.created_at,
          });
        }

        items.push({
          id: `gen-${p.id}`,
          type: "post_generated",
          title: `AI generated ${p.content_type || "post"}`,
          description: snippet,
          timestamp: p.created_at,
        });
      }

      const { data: logs } = await supabase
        .from("autopilot_log")
        .select("id, action_type, title, description, status, created_at")
        .eq("user_id", user!.id)
        .in("action_type", ["social_post", "dfy_marketing", "social_promotion"])
        .order("created_at", { ascending: false })
        .limit(20);

      for (const l of logs ?? []) {
        items.push({
          id: `log-${l.id}`,
          type: "autopilot",
          title: l.title,
          description: l.description || undefined,
          timestamp: l.created_at,
        });
      }

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return items.slice(0, 25);
    },
  });

  if (isLoading) {
    return (
      <Card ref={ref} className="border">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">Activity Log</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={ref} className="border">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Activity Log</h3>
          <span className="text-[10px] text-muted-foreground ml-auto">{activities.length} events</span>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No activity yet. Actions will appear here as your DFY campaign runs.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border pointer-events-none" />

            <div className="space-y-1">
              {activities.map((item) => {
                const Icon = ICON_MAP[item.type] || Sparkles;
                const color = COLOR_MAP[item.type] || "text-muted-foreground";

                return (
                  <div key={item.id} className="flex items-start gap-3 py-2 pl-0 relative">
                    <div
                      className={cn(
                        "h-[30px] w-[30px] rounded-full bg-background border flex items-center justify-center shrink-0 z-10",
                        color
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-xs font-medium leading-tight">{item.title}</p>
                      {item.description && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 pt-1">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default DFYActivityLog;
