import { useState, useMemo } from "react";
import {
  Search, Bug, AlertTriangle, ArrowUpDown, Plus, Trash2,
  TrendingUp, Shield, Zap, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  useBugIssues, useCreateBugIssue, useUpdateBugIssue, useDeleteBugIssue,
  autoAdjustScores, type BugIssue, type PriorityLevel, type RoadmapStatus,
} from "@/hooks/useBugIssues";

const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; class: string }> = {
  critical: { label: "Critical", class: "bg-destructive text-destructive-foreground" },
  high: { label: "High", class: "bg-orange-500 text-white" },
  medium: { label: "Medium", class: "bg-amber-500 text-white" },
  low: { label: "Low", class: "bg-muted text-muted-foreground" },
};

const ROADMAP_LABELS: Record<RoadmapStatus, string> = {
  backlog: "Backlog", next_up: "Next Up", in_progress: "In Progress", done: "Done",
};

export default function BugPriorityDashboard() {
  const { data: issues = [], isLoading } = useBugIssues();
  const createIssue = useCreateBugIssue();
  const updateIssue = useUpdateBugIssue();
  const deleteIssue = useDeleteBugIssue();

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | PriorityLevel>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | RoadmapStatus>("all");
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [featureTag, setFeatureTag] = useState("");
  const [impact, setImpact] = useState(3);
  const [frequency, setFrequency] = useState(3);
  const [revenueRisk, setRevenueRisk] = useState(3);

  const metrics = useMemo(() => {
    const m = { total: issues.length, critical: 0, high: 0, open: 0, avgScore: 0 };
    let scoreSum = 0;
    for (const i of issues) {
      if (i.priority_level === "critical") m.critical++;
      if (i.priority_level === "high") m.high++;
      if (i.roadmap_status !== "done") m.open++;
      scoreSum += i.priority_score;
    }
    m.avgScore = issues.length ? Math.round(scoreSum / issues.length) : 0;
    return m;
  }, [issues]);

  const filtered = useMemo(() => {
    let list = issues;
    if (priorityFilter !== "all") list = list.filter((i) => i.priority_level === priorityFilter);
    if (statusFilter !== "all") list = list.filter((i) => i.roadmap_status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.feature_tag?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [issues, priorityFilter, statusFilter, search]);

  // Weekly summary
  const weeklySummary = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recent = issues.filter((i) => new Date(i.created_at) >= weekAgo);
    const topIssues = [...issues]
      .filter((i) => i.roadmap_status !== "done")
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, 5);
    const mostReported = [...issues]
      .sort((a, b) => b.report_count - a.report_count)
      .slice(0, 3);
    return { newThisWeek: recent.length, topIssues, mostReported };
  }, [issues]);

  const handleCreate = () => {
    if (!title.trim()) return;
    createIssue.mutate({
      title: title.trim(),
      description: description || undefined,
      feature_tag: featureTag || undefined,
      impact_score: impact,
      frequency_score: frequency,
      revenue_risk_score: revenueRisk,
    });
    setShowCreate(false);
    setTitle(""); setDescription(""); setFeatureTag("");
    setImpact(3); setFrequency(3); setRevenueRisk(3);
  };

  const handleAutoAdjust = (issue: BugIssue) => {
    const adjusted = autoAdjustScores(issue);
    updateIssue.mutate({
      id: issue.id,
      frequency_score: adjusted.frequency_score,
      revenue_risk_score: adjusted.revenue_risk_score,
    });
  };

  const previewScore = impact * frequency * revenueRisk;
  const previewLevel: PriorityLevel =
    previewScore >= 64 ? "critical" : previewScore >= 27 ? "high" : previewScore >= 8 ? "medium" : "low";

  return (
    <div className="space-y-5">
      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Open Issues" value={metrics.open} icon={<Bug className="h-4 w-4" />} />
        <MetricCard label="Critical" value={metrics.critical} icon={<AlertTriangle className="h-4 w-4" />} accent />
        <MetricCard label="High Priority" value={metrics.high} icon={<TrendingUp className="h-4 w-4" />} />
        <MetricCard label="Avg Score" value={metrics.avgScore} icon={<BarChart3 className="h-4 w-4" />} />
      </div>

      {/* Weekly Summary */}
      {weeklySummary.topIssues.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Weekly Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">New this week</p>
              <p className="text-lg font-bold">{weeklySummary.newThisWeek}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Top priority</p>
              {weeklySummary.topIssues.slice(0, 3).map((i) => (
                <p key={i.id} className="text-xs truncate">{i.title} <span className="text-muted-foreground">({i.priority_score})</span></p>
              ))}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Most reported</p>
              {weeklySummary.mostReported.map((i) => (
                <p key={i.id} className="text-xs truncate">{i.title} <span className="text-muted-foreground">({i.report_count} reports)</span></p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input placeholder="Search issues…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
            <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="next_up">Next Up</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" /> New Issue
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <Bug className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No issues found.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Issue</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Reports</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Roadmap</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((issue) => {
                const pc = PRIORITY_CONFIG[issue.priority_level];
                return (
                  <TableRow key={issue.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{issue.title}</p>
                      {issue.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{issue.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="text-lg font-bold">{issue.priority_score}</span>
                        <p className="text-[10px] text-muted-foreground">
                          {issue.impact_score}×{issue.frequency_score}×{issue.revenue_risk_score}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={pc.class}>{pc.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{issue.report_count}</span>
                    </TableCell>
                    <TableCell>
                      {issue.feature_tag && (
                        <Badge variant="outline" className="text-xs">{issue.feature_tag}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={issue.roadmap_status}
                        onValueChange={(v) => updateIssue.mutate({
                          id: issue.id,
                          roadmap_status: v as RoadmapStatus,
                          resolved_at: v === "done" ? new Date().toISOString() : null,
                        })}
                      >
                        <SelectTrigger className="h-7 w-[110px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="backlog">Backlog</SelectItem>
                          <SelectItem value="next_up">Next Up</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => handleAutoAdjust(issue)}>
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="text-xs h-7 text-destructive"
                          onClick={() => deleteIssue.mutate(issue.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Issue title…" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details…" rows={2} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Feature Tag</Label>
              <Select value={featureTag} onValueChange={setFeatureTag}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select feature…" /></SelectTrigger>
                <SelectContent>
                  {["card-builder", "crm", "pipeline", "estimates", "invoices", "bookings", "social-marketing", "analytics", "settings", "general"].map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <ScoreSlider label="Impact" value={impact} onChange={setImpact} />
              <ScoreSlider label="Frequency" value={frequency} onChange={setFrequency} />
              <ScoreSlider label="Rev. Risk" value={revenueRisk} onChange={setRevenueRisk} />
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Score:</span>
              <span className="text-lg font-bold">{previewScore}</span>
              <Badge className={PRIORITY_CONFIG[previewLevel].class}>{PRIORITY_CONFIG[previewLevel].label}</Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!title.trim() || createIssue.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScoreSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}: {value}</Label>
      <Slider min={1} max={5} step={1} value={[value]} onValueChange={([v]) => onChange(v)} className="mt-1" />
    </div>
  );
}

function MetricCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-lg px-3 py-3 ${accent ? "bg-destructive/10" : "bg-muted/50"}`}>
      <div className="flex items-center gap-2 mb-1 text-muted-foreground">{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className={`text-2xl font-bold ${accent ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}
