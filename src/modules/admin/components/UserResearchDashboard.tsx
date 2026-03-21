import { useState, useMemo } from "react";
import { format, isThisWeek } from "date-fns";
import {
  Users, ClipboardList, Tag, BarChart3, CheckCircle2, Search,
  Plus, MessageSquare, ArrowRight, Lightbulb, AlertTriangle,
  Heart, Zap, UserCheck, Clock, Eye, Send, Star, BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  useInterviews,
  useInterviewInsights,
  useInterviewCandidates,
  useCreateInterview,
  useUpdateInterview,
  useCreateInsight,
  useUpdateInsightStatus,
  INTERVIEW_QUESTIONS,
  INSIGHT_CATEGORIES,
  CANDIDATE_GROUPS,
  type UserInterview,
  type InterviewInsight,
  type CandidateGroup,
  type InsightCategory,
  type ActionStatus,
  type FollowUpStatus,
  type InterviewStatus,
} from "@/hooks/useUserResearch";

const ACTION_STATUS_COLORS: Record<ActionStatus, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  reviewing: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  planned: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  fixed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  ignored: "bg-muted text-muted-foreground border-border",
};

const CATEGORY_LABELS: Record<InsightCategory, string> = {
  onboarding: "Onboarding", card_editor: "Card Editor", marketplace: "Marketplace",
  social: "Social", estimates: "Estimates", invoices: "Invoices",
  confusing: "Confusing", high_value: "High Value", churn_risk: "Churn Risk",
};

const FOLLOW_UP_LABELS: Record<FollowUpStatus, string> = {
  none: "None", follow_up_later: "Follow Up Later", invite_to_test: "Invite to Test Fix",
  testimonial_candidate: "Testimonial", case_study_candidate: "Case Study",
};

// ─── Main Dashboard ───
export default function UserResearchDashboard() {
  const { data: interviews = [], isLoading: loadingInterviews } = useInterviews();
  const { data: insights = [], isLoading: loadingInsights } = useInterviewInsights();
  const { data: candidates = [] } = useInterviewCandidates();
  const createInterview = useCreateInterview();
  const updateInterview = useUpdateInterview();
  const createInsight = useCreateInsight();
  const updateInsightStatus = useUpdateInsightStatus();

  const [activeTab, setActiveTab] = useState("queue");
  const [selectedInterview, setSelectedInterview] = useState<UserInterview | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newInsightDialog, setNewInsightDialog] = useState<string | null>(null);

  // ─── Pattern Summary ───
  const patterns = useMemo(() => {
    const catCounts: Record<string, { count: number; texts: string[] }> = {};
    for (const i of insights) {
      if (!catCounts[i.category]) catCounts[i.category] = { count: 0, texts: [] };
      catCounts[i.category].count++;
      if (catCounts[i.category].texts.length < 3) catCounts[i.category].texts.push(i.insight_text);
    }
    const sorted = Object.entries(catCounts).sort((a, b) => b[1].count - a[1].count);
    const issues = sorted.filter(([cat]) => ["confusing", "churn_risk", "onboarding"].includes(cat));
    const positives = sorted.filter(([cat]) => ["high_value", "marketplace"].includes(cat));
    return { all: sorted, issues, positives };
  }, [insights]);

  const weeklyCompleted = interviews.filter(
    i => i.status === "completed" && isThisWeek(new Date(i.interview_date))
  ).length;

  // ─── Candidate Queue with smart grouping ───
  const candidateQueue = useMemo(() => {
    const interviewed = new Set(interviews.map(i => i.user_id));
    return candidates
      .filter(c => !interviewed.has(c.id))
      .map(c => {
        let group: CandidateGroup = "not_activated";
        let reason = "Has not activated yet";
        const daysSince = Math.floor((Date.now() - new Date(c.updated_at).getTime()) / 86400000);
        if (c.verification_level === "pro_verified") {
          group = "highly_engaged";
          reason = "Pro verified user with high engagement";
        } else if (c.verification_level === "verified") {
          group = "newly_activated";
          reason = "Recently verified and activated";
        } else if (daysSince > 14) {
          group = "dropped_off";
          reason = `Inactive for ${daysSince} days`;
        }
        return { ...c, group, reason };
      })
      .slice(0, 50);
  }, [candidates, interviews]);

  return (
    <div className="space-y-5">
      {/* Header Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricBox icon={ClipboardList} label="Total Interviews" value={interviews.length} />
        <MetricBox icon={CheckCircle2} label="Completed This Week" value={weeklyCompleted} color="text-emerald-500" />
        <MetricBox icon={Tag} label="Total Insights" value={insights.length} />
        <MetricBox icon={AlertTriangle} label="Open Issues" value={insights.filter(i => i.action_status === "new").length} color="text-amber-500" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="queue" className="gap-1"><Users className="h-3.5 w-3.5" />Queue</TabsTrigger>
          <TabsTrigger value="interviews" className="gap-1"><ClipboardList className="h-3.5 w-3.5" />Interviews</TabsTrigger>
          <TabsTrigger value="insights" className="gap-1"><Tag className="h-3.5 w-3.5" />Insights</TabsTrigger>
          <TabsTrigger value="patterns" className="gap-1"><BarChart3 className="h-3.5 w-3.5" />Patterns</TabsTrigger>
        </TabsList>

        {/* ─── QUEUE TAB ─── */}
        <TabsContent value="queue" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Users recommended for interviews based on behavior signals</p>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-xs">
                  <th className="text-left px-3 py-2 font-medium">Name</th>
                  <th className="text-left px-3 py-2 font-medium">Business</th>
                  <th className="text-left px-3 py-2 font-medium">Group</th>
                  <th className="text-left px-3 py-2 font-medium">Reason</th>
                  <th className="text-left px-3 py-2 font-medium">Last Active</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {candidateQueue.slice(0, 20).map(c => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-medium">{c.name || "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{c.company || "—"}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className="text-[10px]">
                        {CANDIDATE_GROUPS.find(g => g.value === c.group)?.label}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs max-w-[200px] truncate">{c.reason}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {format(new Date(c.updated_at), "MMM d")}
                    </td>
                    <td className="px-3 py-2.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          createInterview.mutate({
                            user_id: c.id,
                            candidate_group: c.group,
                            candidate_reason: c.reason,
                          });
                        }}
                        disabled={createInterview.isPending}
                      >
                        <Plus className="h-3 w-3" /> Interview
                      </Button>
                    </td>
                  </tr>
                ))}
                {candidateQueue.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No candidates found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ─── INTERVIEWS TAB ─── */}
        <TabsContent value="interviews" className="mt-4 space-y-3">
          <div className="space-y-3">
            {interviews.map(interview => (
              <Card key={interview.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedInterview(interview)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{interview.user_id.slice(0, 8)}…</p>
                        <Badge variant="outline" className="text-[10px]">
                          {interview.candidate_group ? CANDIDATE_GROUPS.find(g => g.value === interview.candidate_group)?.label : "Manual"}
                        </Badge>
                        <StatusBadge status={interview.status} />
                      </div>
                      {interview.candidate_reason && (
                        <p className="text-xs text-muted-foreground mt-1">{interview.candidate_reason}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{format(new Date(interview.interview_date), "MMM d, yyyy")}</p>
                      <p className="mt-0.5">{interview.interviewer_name || "Admin"}</p>
                    </div>
                  </div>
                  {(interview.pain_points?.length > 0 || interview.positive_reactions?.length > 0) && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {interview.pain_points?.slice(0, 2).map((p, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] text-destructive border-destructive/20">{p}</Badge>
                      ))}
                      {interview.positive_reactions?.slice(0, 2).map((p, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/20">{p}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {interviews.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No interviews yet. Start from the Queue tab.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── INSIGHTS TAB ─── */}
        <TabsContent value="insights" className="mt-4 space-y-3">
          <div className="space-y-2">
            {insights.map(insight => (
              <div key={insight.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {CATEGORY_LABELS[insight.category]}
                </Badge>
                <p className="text-sm flex-1">{insight.insight_text}</p>
                <Select
                  value={insight.action_status}
                  onValueChange={(v) => updateInsightStatus.mutate({ id: insight.id, action_status: v as ActionStatus })}
                >
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["new", "reviewing", "planned", "fixed", "ignored"] as ActionStatus[]).map(s => (
                      <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            {insights.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Tag className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No insights yet. Complete interviews to add them.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── PATTERNS TAB ─── */}
        <TabsContent value="patterns" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Top Issues
                </CardTitle>
                <CardDescription className="text-xs">Repeated pain points across interviews</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {patterns.all.filter(([cat]) => !["high_value"].includes(cat)).slice(0, 5).map(([cat, data]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0">{CATEGORY_LABELS[cat as InsightCategory] || cat}</Badge>
                    <div className="flex-1 bg-muted/50 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (data.count / Math.max(1, insights.length)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums">{data.count}</span>
                  </div>
                ))}
                {patterns.all.length === 0 && <p className="text-xs text-muted-foreground">No patterns yet</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Heart className="h-4 w-4 text-emerald-500" /> Positive Signals
                </CardTitle>
                <CardDescription className="text-xs">What users love about the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {patterns.all.filter(([cat]) => ["high_value", "marketplace"].includes(cat)).map(([cat, data]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0 text-emerald-600 border-emerald-500/20">
                      {CATEGORY_LABELS[cat as InsightCategory] || cat}
                    </Badge>
                    <div className="flex-1 bg-muted/50 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (data.count / Math.max(1, insights.length)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums">{data.count}</span>
                  </div>
                ))}
                {patterns.positives.length === 0 && <p className="text-xs text-muted-foreground">No positive signals yet</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Interview Detail Dialog ─── */}
      <InterviewDetailDialog
        interview={selectedInterview}
        onClose={() => setSelectedInterview(null)}
        onUpdate={(updates) => {
          if (!selectedInterview) return;
          updateInterview.mutate({ id: selectedInterview.id, ...updates });
          setSelectedInterview({ ...selectedInterview, ...updates } as UserInterview);
        }}
        onAddInsight={(text, category) => {
          if (!selectedInterview) return;
          createInsight.mutate({ interview_id: selectedInterview.id, insight_text: text, category });
        }}
      />
    </div>
  );
}

// ─── Interview Detail Dialog ───
function InterviewDetailDialog({
  interview,
  onClose,
  onUpdate,
  onAddInsight,
}: {
  interview: UserInterview | null;
  onClose: () => void;
  onUpdate: (updates: Partial<UserInterview>) => void;
  onAddInsight: (text: string, category: InsightCategory) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [painPoint, setPainPoint] = useState("");
  const [positive, setPositive] = useState("");
  const [improvement, setImprovement] = useState("");
  const [insightText, setInsightText] = useState("");
  const [insightCategory, setInsightCategory] = useState<InsightCategory>("onboarding");

  // Sync state when interview changes
  const [lastId, setLastId] = useState<string | null>(null);
  if (interview && interview.id !== lastId) {
    setLastId(interview.id);
    setAnswers(interview.answers || {});
    setNotes(interview.notes || "");
  }

  if (!interview) return null;

  const handleSave = () => {
    onUpdate({
      answers,
      notes,
      status: "completed" as InterviewStatus,
    });
  };

  return (
    <Dialog open={!!interview} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Interview Record
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status & Follow-up */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Status</Label>
              <Select
                value={interview.status}
                onValueChange={(v) => onUpdate({ status: v as InterviewStatus })}
              >
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["new", "in_progress", "completed", "cancelled"] as InterviewStatus[]).map(s => (
                    <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Follow-up</Label>
              <Select
                value={interview.follow_up_status}
                onValueChange={(v) => onUpdate({ follow_up_status: v as FollowUpStatus })}
              >
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FOLLOW_UP_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Interview Script */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Interview Questions
            </h4>
            {INTERVIEW_QUESTIONS.map((q, i) => (
              <div key={i}>
                <Label className="text-xs text-muted-foreground">{i + 1}. {q}</Label>
                <Textarea
                  value={answers[`q${i}`] || ""}
                  onChange={(e) => setAnswers({ ...answers, [`q${i}`]: e.target.value })}
                  rows={2}
                  className="mt-1 text-sm resize-none"
                  placeholder="Record answer..."
                />
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs">General Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 text-sm resize-none"
              placeholder="Additional observations..."
            />
          </div>

          {/* Pain Points / Positives / Improvements */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ArrayField
              label="Pain Points"
              items={interview.pain_points || []}
              value={painPoint}
              onChange={setPainPoint}
              onAdd={() => {
                if (!painPoint.trim()) return;
                onUpdate({ pain_points: [...(interview.pain_points || []), painPoint.trim()] });
                setPainPoint("");
              }}
              color="text-destructive"
            />
            <ArrayField
              label="Positive Reactions"
              items={interview.positive_reactions || []}
              value={positive}
              onChange={setPositive}
              onAdd={() => {
                if (!positive.trim()) return;
                onUpdate({ positive_reactions: [...(interview.positive_reactions || []), positive.trim()] });
                setPositive("");
              }}
              color="text-emerald-600"
            />
            <ArrayField
              label="Improvements"
              items={interview.suggested_improvements || []}
              value={improvement}
              onChange={setImprovement}
              onAdd={() => {
                if (!improvement.trim()) return;
                onUpdate({ suggested_improvements: [...(interview.suggested_improvements || []), improvement.trim()] });
                setImprovement("");
              }}
              color="text-primary"
            />
          </div>

          {/* Add Insight */}
          <div className="border border-border rounded-lg p-3 space-y-2">
            <h4 className="text-xs font-semibold flex items-center gap-1"><Tag className="h-3 w-3" /> Tag an Insight</h4>
            <div className="flex gap-2">
              <Input
                value={insightText}
                onChange={(e) => setInsightText(e.target.value)}
                placeholder="Insight..."
                className="text-xs h-8 flex-1"
              />
              <Select value={insightCategory} onValueChange={(v) => setInsightCategory(v as InsightCategory)}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INSIGHT_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="text-xs">{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  if (!insightText.trim()) return;
                  onAddInsight(insightText.trim(), insightCategory);
                  setInsightText("");
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleSave} className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Save & Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Small Components ───
function MetricBox({ icon: Icon, label, value, color = "text-primary" }: {
  icon: any; label: string; value: number; color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: InterviewStatus }) {
  const colors: Record<InterviewStatus, string> = {
    new: "bg-blue-500/10 text-blue-600",
    in_progress: "bg-amber-500/10 text-amber-600",
    completed: "bg-emerald-500/10 text-emerald-600",
    cancelled: "bg-muted text-muted-foreground",
  };
  return <Badge variant="outline" className={`text-[10px] ${colors[status]}`}>{status.replace("_", " ")}</Badge>;
}

function ArrayField({ label, items, value, onChange, onAdd, color }: {
  label: string; items: string[]; value: string; onChange: (v: string) => void; onAdd: () => void; color: string;
}) {
  return (
    <div>
      <Label className={`text-xs ${color}`}>{label}</Label>
      <div className="flex gap-1 mt-1">
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="text-xs h-7 flex-1" placeholder="Add..." onKeyDown={(e) => e.key === "Enter" && onAdd()} />
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onAdd}><Plus className="h-3 w-3" /></Button>
      </div>
      <div className="flex flex-wrap gap-1 mt-1.5">
        {items.map((item, i) => (
          <Badge key={i} variant="outline" className={`text-[10px] ${color}`}>{item}</Badge>
        ))}
      </div>
    </div>
  );
}
