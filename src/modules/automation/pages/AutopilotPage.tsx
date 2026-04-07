import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Bot, Zap, Mail, FileText, Star, Share2, Tag,
  Clock, CheckCircle2, AlertCircle, Play, Shield,
  Loader2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
import GuzzlLogo from "@/components/brand/GuzzlLogo";
  useAutopilotSettings,
  useUpsertAutopilotSettings,
  useAutopilotLog,
  useAutopilotStats,
  useRunAutopilot,
} from "@/hooks/useAutopilot";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const ACTION_ICONS: Record<string, React.ElementType> = {
  lead_followup: Mail,
  estimate_reminder: FileText,
  review_request: Star,
  social_post: Share2,
  promotion: Tag,
};

const ACTION_COLORS: Record<string, string> = {
  lead_followup: "text-primary",
  estimate_reminder: "text-warning",
  review_request: "text-success",
  social_post: "text-accent",
  promotion: "text-destructive",
};

export default function AutopilotPage() {
  const { data: settings, isLoading: loadingSettings } = useAutopilotSettings();
  const { data: log, isLoading: loadingLog } = useAutopilotLog();
  const { data: stats } = useAutopilotStats();
  const upsert = useUpsertAutopilotSettings();
  const runAutopilot = useRunAutopilot();

  const isEnabled = settings?.enabled ?? false;

  const toggleSetting = (key: string, value: boolean) => {
    upsert.mutate({ [key]: value }, {
      onError: () => toast.error("Failed to update setting"),
    });
  };

  const handleRunNow = () => {
    runAutopilot.mutate(undefined, {
      onSuccess: (data) => toast.success(`Autopilot ran: ${data?.actions ?? 0} actions taken`),
      onError: () => toast.error("Failed to run autopilot"),
    });
  };

  if (loadingSettings) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const automationOptions = [
    { key: "lead_followup", label: "Lead Follow-up", desc: "Auto-send welcome messages to new leads", icon: Mail },
    { key: "estimate_reminders", label: "Estimate Reminders", desc: "Remind clients about pending estimates", icon: FileText },
    { key: "review_requests", label: "Review Requests", desc: "Ask for reviews after completed jobs", icon: Star },
    { key: "social_posts", label: "Social Posts", desc: "AI-generated social media content", icon: Share2 },
    { key: "promotions", label: "Promotions", desc: "Suggest promotions when schedule is light", icon: Tag },
  ];

  return (
    <>
      <Helmet>
        <title>AI Autopilot – guzzl.pro</title>
      </Helmet>

      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <motion.div {...fade} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight"><GuzzlLogo to={null} size="lg" suffix="AI Autopilot" /></h1>
              {isEnabled && (
                <Badge variant="default" className="bg-success text-success-foreground text-[10px] uppercase tracking-wider">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Automate lead follow-ups, reminders, reviews, and marketing tasks
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRunNow}
            disabled={!isEnabled || runAutopilot.isPending}
          >
            {runAutopilot.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            Run Now
          </Button>
        </motion.div>

        {/* Master Toggle */}
        <motion.div {...fade} transition={{ delay: 0.05 }} className="dash-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                isEnabled ? "bg-success/10" : "bg-muted"
              }`}>
                <Zap className={`h-5 w-5 ${isEnabled ? "text-success" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-semibold">Autopilot Mode</p>
                <p className="text-xs text-muted-foreground">
                  {isEnabled ? "AI is actively managing your tasks" : "Turn on to automate business tasks"}
                </p>
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={(v) => toggleSetting("enabled", v)}
            />
          </div>
        </motion.div>

        {/* Stats Row */}
        {stats && stats.total > 0 && (
          <motion.div {...fade} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Actions (30d)" value={stats.total} />
            <StatCard label="Follow-ups" value={stats.leadFollowups} />
            <StatCard label="Reminders" value={stats.estimateReminders} />
            <StatCard label="Pending" value={stats.pendingApproval} highlight />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Settings Panel */}
          <motion.div {...fade} transition={{ delay: 0.15 }} className="lg:col-span-2 space-y-4">
            <div className="dash-card p-5 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Automation Controls
              </h3>

              {automationOptions.map(opt => {
                const Icon = opt.icon;
                const val = settings?.[opt.key as keyof typeof settings] ?? false;
                return (
                  <div key={opt.key} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={!!val}
                      onCheckedChange={(v) => toggleSetting(opt.key, v)}
                      disabled={!isEnabled}
                    />
                  </div>
                );
              })}

              <Separator />

              {/* Approval Mode */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Approval Mode</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={settings?.approval_mode === "automatic" ? "default" : "outline"}
                    onClick={() => toggleSetting("approval_mode", "automatic" as any)}
                    disabled={!isEnabled}
                    className="text-xs"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Automatic
                  </Button>
                  <Button
                    size="sm"
                    variant={settings?.approval_mode === "approval" ? "default" : "outline"}
                    onClick={() => toggleSetting("approval_mode", "approval" as any)}
                    disabled={!isEnabled}
                    className="text-xs"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Require Approval
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {settings?.approval_mode === "approval"
                    ? "Actions will wait for your approval before sending"
                    : "Actions are sent automatically"
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Activity Log */}
          <motion.div {...fade} transition={{ delay: 0.2 }} className="lg:col-span-3">
            <div className="dash-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Activity Log
              </h3>

              {loadingLog ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (log ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bot className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No autopilot actions yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Enable autopilot and actions will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {(log ?? []).map((entry) => {
                    const Icon = ACTION_ICONS[entry.action_type] ?? Bot;
                    const color = ACTION_COLORS[entry.action_type] ?? "text-muted-foreground";
                    const isPending = entry.status === "pending_approval";
                    return (
                      <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`mt-0.5 ${color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{entry.title}</p>
                            {isPending && (
                              <Badge variant="outline" className="text-[10px] border-warning text-warning shrink-0">
                                <AlertCircle className="h-3 w-3 mr-0.5" />
                                Needs Approval
                              </Badge>
                            )}
                          </div>
                          {entry.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {entry.description}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground/60 mt-1">
                            {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="dash-card p-4 text-center">
      <p className={`text-xl font-bold tabular-nums ${highlight && value > 0 ? "text-warning" : ""}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
