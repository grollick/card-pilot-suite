import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, subDays, subHours } from "date-fns";

type TimeRange = "24h" | "7d" | "30d";

const STATUS_COLORS: Record<string, string> = {
  sent: "bg-green-500/10 text-green-700 border-green-200",
  dlq: "bg-destructive/10 text-destructive border-destructive/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  suppressed: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  pending: "bg-muted text-muted-foreground border-border",
  bounced: "bg-orange-500/10 text-orange-700 border-orange-200",
  complained: "bg-red-500/10 text-red-700 border-red-200",
};

export default function AdminEmailPerformance() {
  const [range, setRange] = useState<TimeRange>("7d");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const startDate = range === "24h" ? subHours(new Date(), 24) : range === "7d" ? subDays(new Date(), 7) : subDays(new Date(), 30);

  const { data: templates } = useQuery({
    queryKey: ["email-templates-list"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("email_send_log")
        .select("template_name")
        .order("template_name");
      const unique = [...new Set((data || []).map((r: any) => r.template_name))];
      return unique as string[];
    },
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["email-performance", range, templateFilter, statusFilter],
    queryFn: async () => {
      let q = (supabase as any)
        .from("email_send_log")
        .select("id, message_id, template_name, recipient_email, status, error_message, created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);

      if (templateFilter !== "all") q = q.eq("template_name", templateFilter);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Deduplicate by message_id (latest status per email)
  const deduplicated = (() => {
    if (!logs) return [];
    const map = new Map<string, any>();
    for (const row of logs) {
      const key = row.message_id || row.id;
      if (!map.has(key) || new Date(row.created_at) > new Date(map.get(key).created_at)) {
        map.set(key, row);
      }
    }
    return Array.from(map.values());
  })();

  const stats = {
    total: deduplicated.length,
    sent: deduplicated.filter((r) => r.status === "sent").length,
    failed: deduplicated.filter((r) => ["dlq", "failed"].includes(r.status)).length,
    suppressed: deduplicated.filter((r) => r.status === "suppressed").length,
    bounced: deduplicated.filter((r) => r.status === "bounced").length,
  };

  // Daily chart data
  const chartData = (() => {
    const days = range === "24h" ? 1 : range === "7d" ? 7 : 30;
    const buckets: Record<string, { date: string; sent: number; failed: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      buckets[d] = { date: d, sent: 0, failed: 0 };
    }
    for (const row of deduplicated) {
      const d = format(new Date(row.created_at), "yyyy-MM-dd");
      if (buckets[d]) {
        if (row.status === "sent") buckets[d].sent++;
        else if (["dlq", "failed"].includes(row.status)) buckets[d].failed++;
      }
    }
    return Object.values(buckets).reverse();
  })();

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {(["24h", "7d", "30d"] as TimeRange[]).map((r) => (
          <Button key={r} variant={range === r ? "default" : "outline"} size="sm" onClick={() => setRange(r)}>
            {r === "24h" ? "Last 24h" : r === "7d" ? "Last 7 days" : "Last 30 days"}
          </Button>
        ))}
        <Select value={templateFilter} onValueChange={setTemplateFilter}>
          <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="All Templates" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Templates</SelectItem>
            {templates?.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="dlq">Failed</SelectItem>
            <SelectItem value="suppressed">Suppressed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard icon={Mail} label="Total Emails" value={stats.total} loading={isLoading} />
        <StatCard icon={CheckCircle} label="Sent" value={stats.sent} loading={isLoading} color="text-green-600" />
        <StatCard icon={XCircle} label="Failed" value={stats.failed} loading={isLoading} color="text-destructive" />
        <StatCard icon={AlertTriangle} label="Suppressed" value={stats.suppressed} loading={isLoading} color="text-yellow-600" />
        <StatCard icon={AlertTriangle} label="Bounced" value={stats.bounced} loading={isLoading} color="text-orange-600" />
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Send Volume</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => format(new Date(v), "MMM d")} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="sent" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                <Bar dataKey="failed" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Log table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Email Log ({deduplicated.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : deduplicated.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No emails found for this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-muted-foreground">Template</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Recipient</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Time</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {deduplicated.slice(0, 50).map((row) => (
                    <tr key={row.id} className="border-b border-border/50">
                      <td className="py-1.5 font-mono">{row.template_name}</td>
                      <td className="py-1.5 truncate max-w-[200px]">{row.recipient_email}</td>
                      <td className="py-1.5">
                        <Badge variant="outline" className={STATUS_COLORS[row.status] || ""}>{row.status}</Badge>
                      </td>
                      <td className="py-1.5 text-muted-foreground">{format(new Date(row.created_at), "MMM d, HH:mm")}</td>
                      <td className="py-1.5 text-destructive truncate max-w-[200px]">{row.error_message || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, loading, color }: { icon: any; label: string; value: number; loading: boolean; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color || "text-primary"}`} />
          <div>
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="text-lg font-bold">{loading ? "—" : value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
