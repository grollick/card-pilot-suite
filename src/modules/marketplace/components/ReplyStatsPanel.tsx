import { MessageSquare, Send, Bot, Pencil, Users, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useReplyStats } from "../hooks/useAutoReply";

export default function ReplyStatsPanel() {
  const { data: stats, isLoading } = useReplyStats();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
        <div className="h-5 w-40 bg-muted rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!stats || stats.total_replies === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">AI Reply Performance</h2>
        </div>
        <div className="p-6 text-center">
          <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Start using AI replies to see your stats here</p>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: "Replies Generated", value: stats.total_replies, icon: MessageSquare, color: "text-primary" },
    { label: "Replies Sent", value: stats.sent_replies, icon: Send, color: "text-success" },
    { label: "Leads Answered", value: stats.leads_answered, icon: Users, color: "text-warning" },
    { label: "This Week", value: stats.replies_7d, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">AI Reply Performance</h2>
        </div>
        <Badge variant="outline" className="text-xs">Last 30 days: {stats.replies_30d}</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
        {metrics.map((m) => (
          <div key={m.label} className="p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
              <span className="text-xs text-muted-foreground">{m.label}</span>
            </div>
            <span className="text-xl font-bold text-foreground">{m.value}</span>
          </div>
        ))}
      </div>

      {stats.auto_sent_replies > 0 && (
        <div className="px-5 py-3 bg-primary/5 border-t border-primary/10 flex items-center gap-2">
          <Bot className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-foreground">
            <span className="font-medium">{stats.auto_sent_replies}</span> auto-sent · <span className="font-medium">{stats.edited_replies}</span> edited before sending
          </span>
        </div>
      )}
    </div>
  );
}
