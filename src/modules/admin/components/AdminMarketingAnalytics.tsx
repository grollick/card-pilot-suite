import { Users, UserCheck, Target, Mail, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { AdminStats } from "@/hooks/useAdminStats";

interface Props {
  stats?: AdminStats | null;
  isLoading: boolean;
}

export default function AdminMarketingAnalytics({ stats, isLoading }: Props) {
  const signupTrend = stats?.signupsByDate
    ? Object.entries(stats.signupsByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date: date.slice(5), signups: count }))
    : [];

  const growthRate = stats
    ? stats.signupsPrev30d > 0
      ? Math.round(((stats.signups30d - stats.signupsPrev30d) / stats.signupsPrev30d) * 100)
      : stats.signups30d > 0 ? 100 : 0
    : 0;

  const activeUsers = stats ? Math.round(stats.totalUsers * 0.4) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Growth Analytics</h2>
        <p className="text-sm text-muted-foreground">Track platform growth and engagement metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticCard
          icon={Users}
          label="New Users (30d)"
          value={stats?.signups30d ?? 0}
          trend={growthRate}
          loading={isLoading}
        />
        <AnalyticCard
          icon={UserCheck}
          label="Active Users (est.)"
          value={activeUsers}
          loading={isLoading}
        />
        <AnalyticCard
          icon={Target}
          label="Leads Generated (30d)"
          value={stats?.leads30d ?? 0}
          loading={isLoading}
        />
        <AnalyticCard
          icon={Mail}
          label="Bookings (30d)"
          value={stats?.bookings30d ?? 0}
          loading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Daily Signups (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {signupTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={signupTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="signups" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              {isLoading ? "Loading chart data..." : "No signup data available"}
            </p>
          )}
        </CardContent>
      </Card>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.planCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([plan, count]) => {
                  const pct = Math.round((count / Math.max(stats.totalUsers, 1)) * 100);
                  return (
                    <div key={plan} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-24 capitalize">{plan}</span>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AnalyticCard({ icon: Icon, label, value, trend, loading }: {
  icon: any;
  label: string;
  value: number;
  trend?: number;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">
                {loading ? <span className="animate-pulse text-muted-foreground">—</span> : value.toLocaleString()}
              </p>
            </div>
          </div>
          {trend !== undefined && !loading && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend >= 0 ? "+" : ""}{trend}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
