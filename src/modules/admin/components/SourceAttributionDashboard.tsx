import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3, Globe, Users, TrendingUp, Megaphone,
  Facebook, MessageCircle, Share2, Search, ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface SourceData {
  source: string;
  count: number;
  activated: number;
}

const SOURCE_LABELS: Record<string, { label: string; icon: typeof Globe; color: string }> = {
  direct: { label: "Direct", icon: Globe, color: "text-primary" },
  referral: { label: "Referral", icon: Share2, color: "text-success" },
  facebook: { label: "Facebook Group", icon: Facebook, color: "text-blue-500" },
  marketplace: { label: "Marketplace", icon: Search, color: "text-warning" },
  dm: { label: "Direct Message", icon: MessageCircle, color: "text-purple-500" },
  cold_email: { label: "Cold Email", icon: Megaphone, color: "text-orange-500" },
};

function useSourceAttribution(days: number) {
  return useQuery({
    queryKey: ["source-attribution", days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("signup_source, onboarding_completed, created_at")
        .gte("created_at", since.toISOString());

      if (error) throw error;

      const map = new Map<string, { count: number; activated: number }>();
      for (const p of (profiles as any[]) ?? []) {
        const src = p.signup_source || "direct";
        const entry = map.get(src) || { count: 0, activated: 0 };
        entry.count++;
        if (p.onboarding_completed) entry.activated++;
        map.set(src, entry);
      }

      const result: SourceData[] = [];
      for (const [source, data] of map) {
        result.push({ source, ...data });
      }
      result.sort((a, b) => b.count - a.count);
      return result;
    },
  });
}

export default function SourceAttributionDashboard() {
  const [days, setDays] = useState(30);
  const { data: sources = [], isLoading } = useSourceAttribution(days);

  const total = useMemo(() => sources.reduce((s, d) => s + d.count, 0), [sources]);
  const totalActivated = useMemo(() => sources.reduce((s, d) => s + d.activated, 0), [sources]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Source Attribution</h2>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Signups</span>
            </div>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Activated</span>
            </div>
            <p className="text-2xl font-bold">{totalActivated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="h-4 w-4 text-warning" />
              <span className="text-xs text-muted-foreground">Activation Rate</span>
            </div>
            <p className="text-2xl font-bold">{total > 0 ? Math.round((totalActivated / total) * 100) : 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Source breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Users by Source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">No signups in this period.</p>
          ) : (
            sources.map((s) => {
              const meta = SOURCE_LABELS[s.source] || { label: s.source, icon: Globe, color: "text-muted-foreground" };
              const Icon = meta.icon;
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
              const convRate = s.count > 0 ? Math.round((s.activated / s.count) * 100) : 0;
              const barColor = convRate >= 50 ? "bg-success" : convRate >= 25 ? "bg-warning" : "bg-destructive";

              return (
                <div key={s.source} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${meta.color}`} />
                      <span className="text-sm font-medium">{meta.label}</span>
                      <Badge variant="secondary" className="text-2xs">{pct}%</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{s.count} users</span>
                      <span>{s.activated} activated</span>
                      <Badge variant={convRate >= 50 ? "default" : "outline"} className="text-2xs">
                        {convRate}% conv
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
