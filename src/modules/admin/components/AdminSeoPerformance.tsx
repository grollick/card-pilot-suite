import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Eye, FileText, MapPin, Loader2, TrendingUp } from "lucide-react";
import { format, subDays } from "date-fns";

export default function AdminSeoPerformance() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-seo-performance"],
    staleTime: 60_000,
    queryFn: async () => {
      // Get estimate requests (from SEO pages)
      const { data: requests } = await (supabase as any)
        .from("estimate_requests")
        .select("id, profession, city, source, status, created_at")
        .order("created_at", { ascending: false });

      const all = requests || [];
      const seoRequests = all.filter((r: any) => r.source === "seo_landing" || r.source === "landing_page");
      const last30d = all.filter((r: any) => new Date(r.created_at) >= subDays(new Date(), 30));

      // Group by city
      const byCityMap: Record<string, number> = {};
      for (const r of all) {
        const city = r.city || "Unknown";
        byCityMap[city] = (byCityMap[city] || 0) + 1;
      }
      const byCity = Object.entries(byCityMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([city, count]) => ({ city, count }));

      // Group by profession
      const byProfMap: Record<string, number> = {};
      for (const r of all) {
        const prof = r.profession || "Unknown";
        byProfMap[prof] = (byProfMap[prof] || 0) + 1;
      }
      const byProfession = Object.entries(byProfMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([profession, count]) => ({ profession, count }));

      // Get landing page content count
      const { count: landingPageCount } = await (supabase as any)
        .from("landing_page_content")
        .select("id", { count: "exact", head: true });

      // Analytics events for SEO-related pages
      const { count: seoViews } = await (supabase as any)
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "card_view")
        .gte("created_at", subDays(new Date(), 30).toISOString());

      return {
        totalRequests: all.length,
        seoRequests: seoRequests.length,
        last30d: last30d.length,
        landingPages: landingPageCount || 0,
        seoViews: seoViews || 0,
        byCity,
        byProfession,
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
              <FileText className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] text-muted-foreground">Landing Pages</p>
                <p className="text-xl font-bold">{data?.landingPages || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-[10px] text-muted-foreground">Total Requests</p>
                <p className="text-xl font-bold">{data?.totalRequests || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-[10px] text-muted-foreground">Requests (30d)</p>
                <p className="text-xl font-bold">{data?.last30d || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-[10px] text-muted-foreground">Card Views (30d)</p>
                <p className="text-xl font-bold">{data?.seoViews || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Cities */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />Top Cities</CardTitle></CardHeader>
          <CardContent>
            {data?.byCity?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-2">
                {data?.byCity?.map((c, i) => (
                  <div key={c.city} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-sm">{c.city}</span>
                    <Badge variant="secondary" className="text-xs">{c.count} requests</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Professions */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Top Professions Requested</CardTitle></CardHeader>
          <CardContent>
            {data?.byProfession?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-2">
                {data?.byProfession?.map((p) => (
                  <div key={p.profession} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-sm">{p.profession}</span>
                    <Badge variant="secondary" className="text-xs">{p.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent requests */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Service Requests</CardTitle></CardHeader>
        <CardContent>
          {data?.recent?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No requests yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Profession</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">City</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Source</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recent?.map((r: any) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-1.5 text-muted-foreground">{format(new Date(r.created_at), "MMM d")}</td>
                      <td className="py-1.5">{r.profession || "—"}</td>
                      <td className="py-1.5">{r.city || "—"}</td>
                      <td className="py-1.5"><Badge variant="outline" className="text-[10px]">{r.source}</Badge></td>
                      <td className="py-1.5"><Badge variant="outline" className="text-[10px]">{r.status}</Badge></td>
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
