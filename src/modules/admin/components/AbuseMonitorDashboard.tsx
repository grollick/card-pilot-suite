import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, Ban, Search, Eye, AlertTriangle, Shield, CheckCircle, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRecalculateTrust } from "@/hooks/useTrustScore";
import { Progress } from "@/components/ui/progress";

export default function AbuseMonitorDashboard() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const recalcTrust = useRecalculateTrust();

  // Fetch abuse logs
  const { data: abuseLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["abuse-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signup_abuse_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Fetch flagged profiles
  const { data: flaggedProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["flagged-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, trust_level, trust_score, trust_signals, abuse_flags, is_suspended, suspended_reason, created_at")
        .or("is_suspended.eq.true,trust_level.eq.new,abuse_flags.cs.{disposable_email}")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Suspend user
  const suspendUser = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: true, suspended_reason: reason })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Account suspended");
      queryClient.invalidateQueries({ queryKey: ["flagged-profiles"] });
    },
  });

  // Unsuspend user
  const unsuspendUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: false, suspended_reason: null, trust_level: "verified" })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Account unsuspended");
      queryClient.invalidateQueries({ queryKey: ["flagged-profiles"] });
    },
  });

  // Update trust level
  const updateTrust = useMutation({
    mutationFn: async ({ userId, level }: { userId: string; level: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ trust_level: level })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Trust level updated");
      queryClient.invalidateQueries({ queryKey: ["flagged-profiles"] });
    },
  });

  // Stats
  const totalLogs = abuseLogs?.length ?? 0;
  const highRisk = abuseLogs?.filter(l => l.risk_level === "high").length ?? 0;
  const mediumRisk = abuseLogs?.filter(l => l.risk_level === "medium").length ?? 0;
  const blocked = abuseLogs?.filter(l => l.blocked).length ?? 0;
  const suspendedCount = flaggedProfiles?.filter(p => p.is_suspended).length ?? 0;

  // Top repeated IPs
  const ipCounts = abuseLogs?.reduce((acc, l) => {
    acc[l.ip_hash] = (acc[l.ip_hash] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};
  const topIPs = Object.entries(ipCounts)
    .filter(([, count]) => count > 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Top repeated domains
  const domainCounts = abuseLogs?.reduce((acc, l) => {
    if (l.email_domain) acc[l.email_domain] = (acc[l.email_domain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};
  const topDomains = Object.entries(domainCounts)
    .filter(([, count]) => count > 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const filteredLogs = abuseLogs?.filter(l =>
    !search || l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.ip_hash.includes(search) || l.email_domain?.includes(search.toLowerCase())
  );

  const riskBadge = (level: string) => {
    if (level === "high") return <Badge variant="destructive" className="text-[10px]">High</Badge>;
    if (level === "medium") return <Badge className="bg-amber-500/15 text-amber-600 text-[10px]">Medium</Badge>;
    return <Badge variant="secondary" className="text-[10px]">Low</Badge>;
  };

  const trustBadge = (level: string) => {
    const map: Record<string, { color: string; label: string }> = {
      new: { color: "bg-muted text-muted-foreground", label: "New" },
      verified: { color: "bg-emerald-500/15 text-emerald-600", label: "Verified" },
      trusted: { color: "bg-primary/15 text-primary", label: "Trusted" },
      suspended: { color: "bg-destructive/15 text-destructive", label: "Suspended" },
    };
    const info = map[level] || map.new;
    return <Badge className={`${info.color} text-[10px]`}>{info.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Signup Logs", value: totalLogs, icon: Eye, color: "text-primary" },
          { label: "High Risk", value: highRisk, icon: ShieldAlert, color: "text-destructive" },
          { label: "Medium Risk", value: mediumRisk, icon: AlertTriangle, color: "text-amber-500" },
          { label: "Blocked", value: blocked, icon: Ban, color: "text-destructive" },
          { label: "Suspended", value: suspendedCount, icon: Ban, color: "text-orange-500" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <kpi.icon className={`h-5 w-5 ${kpi.color} shrink-0`} />
              <div>
                <p className="text-lg font-bold">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Repeated IPs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              Repeated IPs ({topIPs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topIPs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No repeated IPs detected</p>
            ) : (
              <div className="space-y-1.5">
                {topIPs.map(([ip, count]) => (
                  <div key={ip} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                    <code className="text-xs">{ip.slice(0, 12)}…</code>
                    <Badge variant="destructive" className="text-[10px]">{count} attempts</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Suspicious Domains */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Repeated Domains ({topDomains.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topDomains.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No repeated domains detected</p>
            ) : (
              <div className="space-y-1.5">
                {topDomains.map(([domain, count]) => (
                  <div key={domain} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                    <span className="font-mono text-xs">{domain}</span>
                    <Badge className="bg-amber-500/15 text-amber-600 text-[10px]">{count} signups</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Flagged Accounts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Flagged Accounts ({flaggedProfiles?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profilesLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
          ) : !flaggedProfiles?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No flagged accounts</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Trust Score</TableHead>
                    <TableHead className="text-xs">Level</TableHead>
                    <TableHead className="text-xs">Flags</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flaggedProfiles.map(p => {
                    const score = (p as any).trust_score ?? 10;
                    const scoreColor = score >= 60 ? "bg-emerald-500" : score >= 30 ? "bg-amber-500" : "bg-destructive";
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-medium">{p.name || "—"}</TableCell>
                        <TableCell className="text-xs">{p.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${score}%` }} />
                            </div>
                            <span className="text-[11px] font-mono font-medium w-6 text-right">{score}</span>
                          </div>
                        </TableCell>
                        <TableCell>{p.is_suspended ? trustBadge("suspended") : trustBadge(p.trust_level)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {(p.abuse_flags as string[] || []).map(f => (
                              <Badge key={f} variant="outline" className="text-[9px]">{f}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                              title="Recalculate trust score"
                              onClick={() => recalcTrust.mutate(p.id)}>
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            {p.is_suspended ? (
                              <Button size="sm" variant="outline" className="h-6 text-[10px]"
                                onClick={() => unsuspendUser.mutate(p.id)}>
                                <CheckCircle className="h-3 w-3 mr-1" />Unsuspend
                              </Button>
                            ) : (
                              <Button size="sm" variant="destructive" className="h-6 text-[10px]"
                                onClick={() => suspendUser.mutate({ userId: p.id, reason: "Admin review" })}>
                                <Ban className="h-3 w-3 mr-1" />Suspend
                              </Button>
                            )}
                            {p.trust_level === "new" && !p.is_suspended && (
                              <Button size="sm" variant="outline" className="h-6 text-[10px]"
                                onClick={() => updateTrust.mutate({ userId: p.id, level: "trusted" })}>
                                <Shield className="h-3 w-3 mr-1" />Trust
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Abuse Logs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Signup Abuse Logs
            </CardTitle>
            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search email, IP…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 pl-7 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
          ) : !filteredLogs?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No abuse logs found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Domain</TableHead>
                    <TableHead className="text-xs">IP Hash</TableHead>
                    <TableHead className="text-xs">Risk</TableHead>
                    <TableHead className="text-xs">Flags</TableHead>
                    <TableHead className="text-xs">Blocked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.slice(0, 50).map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell className="text-xs">{log.email || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{log.email_domain || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{log.ip_hash.slice(0, 10)}…</TableCell>
                      <TableCell>{riskBadge(log.risk_level)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {(log.flags as string[] || []).map((f, i) => (
                            <Badge key={i} variant="outline" className="text-[9px]">{f}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.blocked ? <Ban className="h-3.5 w-3.5 text-destructive" /> : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
