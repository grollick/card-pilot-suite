import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import {
  Search, Bug, Lightbulb, HelpCircle, ThumbsUp, MessageSquare,
  Eye, CheckCircle2, Calendar, ExternalLink, Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  useAdminFeedbackList,
  useUpdateFeedbackStatus,
  type BetaFeedback,
  type FeedbackType,
  type FeedbackStatus,
} from "@/hooks/useBetaFeedback";
import { supabase } from "@/integrations/supabase/client";

const TYPE_CONFIG: Record<FeedbackType, { icon: React.ReactNode; label: string; color: string }> = {
  bug: { icon: <Bug className="h-3 w-3" />, label: "Bug", color: "text-destructive" },
  suggestion: { icon: <Lightbulb className="h-3 w-3" />, label: "Suggestion", color: "text-primary" },
  confusing: { icon: <HelpCircle className="h-3 w-3" />, label: "Confusing", color: "text-amber-500" },
  positive: { icon: <ThumbsUp className="h-3 w-3" />, label: "Positive", color: "text-emerald-500" },
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  new: { label: "New", variant: "default" },
  in_review: { label: "In Review", variant: "secondary" },
  planned: { label: "Planned", variant: "outline" },
  fixed: { label: "Fixed", variant: "outline" },
};

export default function AdminFeedbackTab() {
  const { data: feedbackList = [], isLoading } = useAdminFeedbackList();
  const updateStatus = useUpdateFeedbackStatus();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | FeedbackType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | FeedbackStatus>("all");
  const [selected, setSelected] = useState<BetaFeedback | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [signedScreenshotUrl, setSignedScreenshotUrl] = useState<string | null>(null);

  // Generate signed URL when a feedback item with screenshot is selected
  useEffect(() => {
    setSignedScreenshotUrl(null);
    if (!selected?.screenshot_url) return;
    // If it's already a full URL (legacy), use directly
    if (selected.screenshot_url.startsWith("http")) {
      setSignedScreenshotUrl(selected.screenshot_url);
      return;
    }
    // Generate signed URL from private bucket
    const { supabase } = require("@/integrations/supabase/client");
    supabase.storage
      .from("feedback-screenshots")
      .createSignedUrl(selected.screenshot_url, 3600)
      .then(({ data }: any) => {
        if (data?.signedUrl) setSignedScreenshotUrl(data.signedUrl);
      });
  }, [selected]);

  // Metrics
  const metrics = useMemo(() => {
    const m = { total: feedbackList.length, new: 0, bugs: 0, suggestions: 0 };
    for (const f of feedbackList) {
      if (f.status === "new") m.new++;
      if (f.feedback_type === "bug") m.bugs++;
      if (f.feedback_type === "suggestion") m.suggestions++;
    }
    return m;
  }, [feedbackList]);

  // Filtered
  const filtered = useMemo(() => {
    let list = feedbackList;
    if (typeFilter !== "all") list = list.filter((f) => f.feedback_type === typeFilter);
    if (statusFilter !== "all") list = list.filter((f) => f.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.message.toLowerCase().includes(q) ||
          f.user_name?.toLowerCase().includes(q) ||
          f.user_email?.toLowerCase().includes(q) ||
          f.feature_tag?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [feedbackList, typeFilter, statusFilter, search]);

  const openDetail = (f: BetaFeedback) => {
    setSelected(f);
    setAdminNotes(f.admin_notes || "");
  };

  const handleStatusChange = (id: string, status: FeedbackStatus) => {
    updateStatus.mutate({ id, status });
  };

  const handleSaveNotes = () => {
    if (selected) {
      updateStatus.mutate({ id: selected.id, admin_notes: adminNotes });
      setSelected(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Total Feedback" value={metrics.total} icon={<MessageSquare className="h-4 w-4" />} />
        <MetricCard label="New" value={metrics.new} icon={<Eye className="h-4 w-4" />} />
        <MetricCard label="Bugs" value={metrics.bugs} icon={<Bug className="h-4 w-4" />} />
        <MetricCard label="Suggestions" value={metrics.suggestions} icon={<Lightbulb className="h-4 w-4" />} />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search feedback…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="suggestion">Suggestion</SelectItem>
              <SelectItem value="confusing">Confusing</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="fixed">Fixed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No feedback found.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="min-w-[200px]">Message</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f) => {
                const tc = TYPE_CONFIG[f.feedback_type];
                const sc = STATUS_CONFIG[f.status];

                return (
                  <TableRow key={f.id} className="cursor-pointer" onClick={() => openDetail(f)}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{f.user_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{f.user_email || f.user_id.slice(0, 8)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`flex items-center gap-1 text-xs font-medium ${tc.color}`}>
                        {tc.icon} {tc.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm line-clamp-2 max-w-[280px]">{f.message}</p>
                      {f.screenshot_url && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <ImageIcon className="h-3 w-3" /> Screenshot attached
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {f.feature_tag && (
                        <Badge variant="outline" className="text-xs">{f.feature_tag}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={f.status}
                        onValueChange={(v) => {
                          handleStatusChange(f.id, v as FeedbackStatus);
                        }}
                      >
                        <SelectTrigger className="h-7 w-[110px] text-xs" onClick={(e) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="in_review">In Review</SelectItem>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="fixed">Fixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(f.created_at), "MMM d")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={(e) => { e.stopPropagation(); openDetail(f); }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected && (
                <span className={TYPE_CONFIG[selected.feedback_type].color}>
                  {TYPE_CONFIG[selected.feedback_type].icon}
                </span>
              )}
              Feedback Detail
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">User</p>
                  <p className="font-medium">{selected.user_name || selected.user_email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selected.feedback_type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Feature</p>
                  <p>{selected.feature_tag || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Device</p>
                  <p className="capitalize">{selected.device_type || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Page</p>
                  <p className="text-xs font-mono">{selected.page_url || "—"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Message</p>
                <div className="bg-muted/50 rounded-lg p-3 text-sm">{selected.message}</div>
              </div>

              {selected.screenshot_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Screenshot</p>
                  <a href={selected.screenshot_url} target="_blank" rel="noreferrer" className="block">
                    <img
                      src={selected.screenshot_url}
                      alt="Feedback screenshot"
                      className="rounded-lg border border-border max-h-48 object-contain w-full"
                    />
                  </a>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-1">Admin Notes</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes…"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Status:</p>
                <Select
                  value={selected.status}
                  onValueChange={(v) => handleStatusChange(selected.id, v as FeedbackStatus)}
                >
                  <SelectTrigger className="h-8 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
            <Button onClick={handleSaveNotes} disabled={updateStatus.isPending}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-3">
      <div className="flex items-center gap-2 mb-1 text-muted-foreground">{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
