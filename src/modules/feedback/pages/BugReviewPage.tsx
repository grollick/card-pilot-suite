import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bug, AlertTriangle, ChevronUp, MessageSquare, Send, CheckCircle2, Clock, Flame } from "lucide-react";
import { motion } from "framer-motion";

type BugIssue = {
  id: string;
  title: string;
  description: string | null;
  priority_level: string;
  roadmap_status: string;
  report_count: number;
  feature_tag: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  backlog: { label: "Backlog", color: "bg-muted text-muted-foreground", icon: Clock },
  planned: { label: "Planned", color: "bg-primary/10 text-primary", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-amber-500/10 text-amber-600", icon: Flame },
  done: { label: "Fixed", color: "bg-success/10 text-success", icon: CheckCircle2 },
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-muted text-muted-foreground border-border",
};

export default function BugReviewPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [reportTitle, setReportTitle] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [reportType, setReportType] = useState<string>("bug");
  const [reportPage, setReportPage] = useState("");

  // Fetch known issues
  const { data: issues = [], isLoading } = useQuery({
    queryKey: ["bug-issues-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bug_issues")
        .select("*")
        .order("priority_score", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BugIssue[];
    },
  });

  // Submit bug report
  const submitReport = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in");
      if (!reportMessage.trim()) throw new Error("Please describe the issue");
      const { error } = await supabase.from("beta_feedback").insert({
        user_id: user.id,
        feedback_type: reportType as any,
        message: reportMessage.trim(),
        page_url: reportPage || window.location.href,
        device_type: /mobile/i.test(navigator.userAgent) ? "mobile" : "desktop",
        feature_tag: reportTitle.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thanks for reporting! We'll look into it.");
      setReportTitle("");
      setReportMessage("");
      setReportPage("");
      queryClient.invalidateQueries({ queryKey: ["bug-issues-public"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = filter === "all"
    ? issues
    : filter === "open"
      ? issues.filter(i => i.roadmap_status !== "done")
      : issues.filter(i => i.roadmap_status === "done");

  const openCount = issues.filter(i => i.roadmap_status !== "done").length;
  const fixedCount = issues.filter(i => i.roadmap_status === "done").length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bug className="h-6 w-6 text-destructive" />
            Bug Review
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Help us squash bugs — browse known issues or report new ones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> {openCount} open
          </Badge>
          <Badge variant="outline" className="gap-1 bg-success/5 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3" /> {fixedCount} fixed
          </Badge>
        </div>
      </div>

      {/* Report a Bug */}
      <Card className="border-destructive/20 bg-destructive/[0.02]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4 text-destructive" />
            Report a Bug
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Short title (e.g. 'Button doesn't work')"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">🐛 Bug</SelectItem>
                  <SelectItem value="confusing">😕 Confusing</SelectItem>
                  <SelectItem value="suggestion">💡 Suggestion</SelectItem>
                  <SelectItem value="positive">🎉 Love it</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Which page?"
                value={reportPage}
                onChange={(e) => setReportPage(e.target.value)}
                className="text-sm flex-1"
              />
            </div>
          </div>
          <Textarea
            placeholder="Describe what happened, what you expected, and any steps to reproduce..."
            value={reportMessage}
            onChange={(e) => setReportMessage(e.target.value)}
            rows={3}
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={() => submitReport.mutate()}
            disabled={submitReport.isPending || !reportMessage.trim()}
            className="gap-2"
          >
            <Send className="h-3.5 w-3.5" />
            {submitReport.isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </CardContent>
      </Card>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {[
          { key: "all", label: `All (${issues.length})` },
          { key: "open", label: `Open (${openCount})` },
          { key: "fixed", label: `Fixed (${fixedCount})` },
        ].map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
            className="text-xs"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Issues list */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Loading known issues...</div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              {filter === "open" ? "No open issues — nice!" : "No issues found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((issue, idx) => {
            const status = STATUS_LABELS[issue.roadmap_status] ?? STATUS_LABELS.backlog;
            const StatusIcon = status.icon;
            return (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-start gap-3 py-3 px-4">
                    <div className="mt-0.5">
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${PRIORITY_COLORS[issue.priority_level] || PRIORITY_COLORS.low}`}>
                        {issue.priority_level}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{issue.title}</h3>
                      {issue.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{issue.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        {issue.feature_tag && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {issue.feature_tag}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <ChevronUp className="h-3 w-3" /> {issue.report_count} report{issue.report_count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] gap-1 shrink-0 ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
