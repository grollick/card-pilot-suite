import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Eye, Users, Calendar, DollarSign, TrendingUp, Zap, Crown,
  BarChart3, Target, ArrowUpRight, Rocket, Receipt, Send, MessageSquare,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { useMarketplacePerformance } from "@/hooks/useMarketplacePerformance";
import { useActiveBoosts } from "@/hooks/useBoosts";
import { useProfile } from "@/hooks/useCard";
import { useLeadRoutingStats } from "@/hooks/useLeadRouting";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(280 67% 54%)",
  "hsl(199 89% 48%)",
];

function KPI({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-3">
        <div className={`p-2.5 rounded-xl bg-primary/10 ${color ?? "text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketplacePerformancePage() {
  const navigate = useNavigate();
  const [range, setRange] = useState("30");
  const { data, isLoading } = useMarketplacePerformance(Number(range));
  const { data: activeBoosts } = useActiveBoosts();
  const { data: profile } = useProfile();

  const isFeatured = profile?.featured || (profile as any)?.featured_until && new Date((profile as any).featured_until) > new Date();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const d = data!;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketplace Performance</h1>
          <p className="text-muted-foreground text-sm">Track how your marketplace presence generates leads and revenue.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        {isFeatured && (
          <Badge className="bg-primary/10 text-primary gap-1">
            <Crown className="h-3 w-3" /> Featured Listing Active
          </Badge>
        )}
        {(activeBoosts?.length ?? 0) > 0 && (
          <Badge className="bg-accent/10 text-accent-foreground gap-1">
            <Rocket className="h-3 w-3" /> {activeBoosts!.length} Active Boost{activeBoosts!.length > 1 ? "s" : ""}
          </Badge>
        )}
        {d.unbilledLeads > 0 && (
          <Badge variant="outline" className="gap-1">
            <Receipt className="h-3 w-3" /> {d.unbilledLeads} Unbilled Leads
          </Badge>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={Eye} label="Card Views" value={d.totalViews.toLocaleString()} />
        <KPI icon={Users} label="Leads Generated" value={d.totalLeads} sub={`${d.conversionRate.toFixed(1)}% conversion`} />
        <KPI icon={Calendar} label="Bookings" value={d.totalBookings} />
        <KPI icon={DollarSign} label="Revenue" value={`$${d.totalRevenue.toLocaleString()}`} />
      </div>

      {/* Lead Routing Stats */}
      <LeadRoutingStatsSection />

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Performance Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {d.dailyMetrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={d.dailyMetrics}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip />
                <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#colorViews)" name="Views" />
                <Area type="monotone" dataKey="leads" stroke="hsl(142 71% 45%)" fill="url(#colorLeads)" name="Leads" />
                <Area type="monotone" dataKey="bookings" stroke="hsl(38 92% 50%)" fill="transparent" name="Bookings" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">No data for this period yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Lead Sources + Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Lead sources pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Lead Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.leadsBySource.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={d.leadsBySource} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {d.leadsBySource.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {d.leadsBySource.slice(0, 5).map((s, i) => (
                    <div key={s.source} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="capitalize">{s.source.replace(/_/g, " ")}</span>
                      </span>
                      <span className="font-medium">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No leads yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Monetization Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Grow Your Visibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-between gap-2"
              variant={isFeatured ? "outline" : "default"}
              onClick={() => navigate("/app/settings")}
            >
              <span className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                {isFeatured ? "Featured Listing Active" : "Get Featured Placement"}
              </span>
              {!isFeatured && <ArrowUpRight className="h-4 w-4" />}
            </Button>

            <Button
              className="w-full justify-between gap-2"
              variant="outline"
              onClick={() => navigate("/app/boost")}
            >
              <span className="flex items-center gap-2">
                <Rocket className="h-4 w-4" />
                Boost My Card
              </span>
              <Badge variant="secondary" className="text-xs">
                {(activeBoosts?.length ?? 0) > 0 ? `${activeBoosts!.length} active` : "From $5"}
              </Badge>
            </Button>

            <Separator />

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-muted-foreground" /> Pay-Per-Lead Summary
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Leads</p>
                  <p className="font-semibold text-lg">{d.totalLeads}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Unbilled</p>
                  <p className="font-semibold text-lg">{d.unbilledLeads}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Leads from the marketplace are tracked automatically. Billing will be available soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
