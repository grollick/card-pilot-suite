import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Eye, Users, Calendar, TrendingUp,
  BarChart3, Target, Send, MessageSquare, CheckCircle2, MapPin, Star,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import { useMarketplacePerformance } from "@/hooks/useMarketplacePerformance";
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
  const { data: profile } = useProfile();

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
          <h1 className="text-3xl font-bold tracking-tight"><span className="font-extrabold text-primary">guzzl</span> <span className="font-normal">Marketplace Performance</span></h1>
          <p className="text-muted-foreground text-sm">See how your marketplace presence generates views, leads, and bookings.</p>
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

      {/* Status badges — growth focused */}
      <div className="flex flex-wrap gap-2">
        {(profile as any)?.marketplace_enabled && (
          <Badge className="bg-success/10 text-success gap-1">
            <CheckCircle2 className="h-3 w-3" /> Listed on Marketplace
          </Badge>
        )}
        {(profile as any)?.city && (
          <Badge variant="outline" className="gap-1">
            <MapPin className="h-3 w-3" /> {(profile as any).city}
          </Badge>
        )}
        {d.totalLeads > 0 && (
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" /> {d.totalLeads} Leads Generated
          </Badge>
        )}
      </div>

      {/* KPIs — user-facing metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={Eye} label="Profile Views" value={d.totalViews.toLocaleString()} />
        <KPI icon={Users} label="Leads Generated" value={d.totalLeads} sub={`${d.conversionRate.toFixed(1)}% conversion`} />
        <KPI icon={MessageSquare} label="Profile Clicks" value={Math.round(d.totalViews * 0.35).toLocaleString()} sub="Est. click-throughs" />
        <KPI icon={Calendar} label="Bookings" value={d.totalBookings} />
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

      {/* Lead Sources + Growth Tips */}
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

        {/* Growth Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Grow Your Visibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {[
                { label: "Complete your profile", desc: "A complete profile ranks higher in search results", done: (profile as any)?.bio && (profile as any)?.city },
                { label: "Add services", desc: "Listings with services get more engagement", done: d.totalLeads > 0 },
                { label: "Get reviews", desc: "Professionals with reviews appear first", done: false },
                { label: "Go On Duty", desc: "On-duty pros get priority routing for estimate requests", done: false },
              ].map((tip) => (
                <div key={tip.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${tip.done ? "text-success" : "text-muted-foreground/40"}`} />
                  <div>
                    <p className="text-sm font-medium">{tip.label}</p>
                    <p className="text-xs text-muted-foreground">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              className="w-full gap-1.5"
              variant="outline"
              onClick={() => navigate("/app/settings")}
            >
              <Star className="h-4 w-4" /> Optimize My Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LeadRoutingStatsSection() {
  const stats = useLeadRoutingStats();

  if (stats.totalDelivered === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          Lead Routing Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.totalDelivered}</p>
            <p className="text-xs text-muted-foreground">Leads Delivered</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.responded}</p>
            <p className="text-xs text-muted-foreground">Responded</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.responseRate}%</p>
            <p className="text-xs text-muted-foreground">Response Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.conversionRate}%</p>
            <p className="text-xs text-muted-foreground">Conversion Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
