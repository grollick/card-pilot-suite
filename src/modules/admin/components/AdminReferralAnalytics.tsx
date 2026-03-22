import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Users, TrendingUp, Award, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function AdminReferralAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-referral-analytics"],
    staleTime: 60_000,
    queryFn: async () => {
      // Get all referrals
      const { data: referrals } = await (supabase as any)
        .from("referrals")
        .select("id, referrer_id, referred_user_id, status, reward_days, activated_at, created_at")
        .order("created_at", { ascending: false });

      const all = referrals || [];
      const completed = all.filter((r: any) => r.status === "completed");
      const pending = all.filter((r: any) => r.status === "pending");
      const totalRewardDays = completed.reduce((sum: number, r: any) => sum + (r.reward_days || 0), 0);

      // Top referrers
      const referrerCounts: Record<string, number> = {};
      for (const r of all) {
        referrerCounts[r.referrer_id] = (referrerCounts[r.referrer_id] || 0) + 1;
      }
      const topReferrerIds = Object.entries(referrerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id, count]) => ({ id, count }));

      // Fetch names for top referrers
      let topReferrers: { name: string; count: number }[] = [];
      if (topReferrerIds.length > 0) {
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("id, name")
          .in("id", topReferrerIds.map((r) => r.id));
        const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.name || "Unknown"]));
        topReferrers = topReferrerIds.map((r) => ({ name: (nameMap.get(r.id) as string) || "Unknown", count: r.count }));
      }

      return {
        total: all.length,
        completed: completed.length,
        pending: pending.length,
        conversionRate: all.length > 0 ? Math.round((completed.length / all.length) * 100) : 0,
        totalRewardDays,
        topReferrers,
        recent: all.slice(0, 15),
      };
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] text-muted-foreground">Total Invites</p>
                <p className="text-xl font-bold">{data?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-[10px] text-muted-foreground">Activated</p>
                <p className="text-xl font-bold text-green-600">{data?.completed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-[10px] text-muted-foreground">Conversion Rate</p>
                <p className="text-xl font-bold">{data?.conversionRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-violet-600" />
              <div>
                <p className="text-[10px] text-muted-foreground">Reward Days Issued</p>
                <p className="text-xl font-bold">{(data?.totalRewardDays || 0) * 2}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Referrers */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Top Referrers</CardTitle></CardHeader>
          <CardContent>
            {data?.topReferrers?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No referrals yet</p>
            ) : (
              <div className="space-y-2">
                {data?.topReferrers?.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                      <span className="text-sm font-medium">{r.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{r.count} invites</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent referrals */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Referrals</CardTitle></CardHeader>
          <CardContent>
            {data?.recent?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No referrals yet</p>
            ) : (
              <div className="space-y-2">
                {data?.recent?.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</span>
                    <Badge variant={r.status === "completed" ? "default" : "outline"} className="text-xs">{r.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
