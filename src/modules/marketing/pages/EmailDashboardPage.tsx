import { useState, useMemo } from "react";
import GuzzlLogo from "@/components/brand/GuzzlLogo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  Mail, CheckCircle, XCircle, AlertTriangle, Filter,
  Loader2, Calendar, BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type TimeRange = "24h" | "7d" | "30d" | "custom";
type StatusFilter = "all" | "sent" | "failed" | "suppressed";

const STATUS_BADGES: Record<string, { className: string; label: string }> = {
  sent: { className: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]", label: "Sent" },
  pending: { className: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]", label: "Pending" },
  failed: { className: "bg-destructive/10 text-destructive", label: "Failed" },
  dlq: { className: "bg-destructive/10 text-destructive", label: "Failed" },
  suppressed: { className: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]", label: "Suppressed" },
  bounced: { className: "bg-destructive/10 text-destructive", label: "Bounced" },
  complained: { className: "bg-destructive/10 text-destructive", label: "Complained" },
};

const PAGE_SIZE = 50;

function getDateRange(range: TimeRange): { start: Date; end: Date } {
  const end = endOfDay(new Date());
  switch (range) {
    case "24h": return { start: subDays(end, 1), end };
    case "7d": return { start: subDays(end, 7), end };
    case "30d": return { start: subDays(end, 30), end };
    default: return { start: subDays(end, 7), end };
  }
}

export default function EmailDashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { start, end } = useMemo(() => getDateRange(timeRange), [timeRange]);

  // Fetch all logs within time range (deduplicate client-side by message_id)
  const { data: rawLogs = [], isLoading } = useQuery({
    queryKey: ["email-logs", start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_send_log")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  // Deduplicate by message_id (keep latest status per message)
  const deduped = useMemo(() => {
    const map = new Map<string, typeof rawLogs[0]>();
    for (const row of rawLogs) {
      const key = row.message_id || row.id;
      const existing = map.get(key);
      if (!existing || new Date(row.created_at) > new Date(existing.created_at)) {
        map.set(key, row);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [rawLogs]);

  // Get distinct template names for filter
  const templateNames = useMemo(() => {
    const names = new Set(deduped.map((r) => r.template_name));
    return Array.from(names).sort();
  }, [deduped]);

  // Apply filters
  const filtered = useMemo(() => {
    return deduped.filter((row) => {
      if (statusFilter === "sent" && row.status !== "sent") return false;
      if (statusFilter === "failed" && !["failed", "dlq", "bounced", "complained"].includes(row.status)) return false;
      if (statusFilter === "suppressed" && row.status !== "suppressed") return false;
      if (templateFilter !== "all" && row.template_name !== templateFilter) return false;
      return true;
    });
  }, [deduped, statusFilter, templateFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const sent = filtered.filter((r) => r.status === "sent").length;
    const failed = filtered.filter((r) => ["failed", "dlq", "bounced", "complained"].includes(r.status)).length;
    const suppressed = filtered.filter((r) => r.status === "suppressed").length;
    return { total, sent, failed, suppressed };
  }, [filtered]);

  // Paginate
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight"><GuzzlLogo to={null} size="lg" suffix="Email Dashboard" /></h1>
        <p className="text-sm text-muted-foreground">Monitor email delivery across all templates</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Mail} label="Total Emails" value={stats.total} />
        <StatCard icon={CheckCircle} label="Sent" value={stats.sent} color="text-[hsl(var(--success))]" />
        <StatCard icon={XCircle} label="Failed" value={stats.failed} color="text-destructive" />
        <StatCard icon={AlertTriangle} label="Suppressed" value={stats.suppressed} color="text-[hsl(var(--warning))]" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {(["24h", "7d", "30d"] as TimeRange[]).map((r) => (
            <Button
              key={r}
              variant={timeRange === r ? "default" : "ghost"}
              size="sm"
              onClick={() => { setTimeRange(r); setPage(0); }}
              className="h-8 text-xs"
            >
              {r === "24h" ? "24h" : r === "7d" ? "7 days" : "30 days"}
            </Button>
          ))}
        </div>

        <Select value={templateFilter} onValueChange={(v) => { setTemplateFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[200px] h-9">
            <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All templates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All templates</SelectItem>
            {templateNames.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(0); }}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="suppressed">Suppressed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No emails found for this period
                  </TableCell>
                </TableRow>
              )}
              {paginated.map((row) => {
                const badge = STATUS_BADGES[row.status] || STATUS_BADGES.pending;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-sm">{row.template_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {row.recipient_email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badge.className}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(row.created_at), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                      {row.error_message || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color || "text-foreground"}`}>{value}</p>
    </div>
  );
}
