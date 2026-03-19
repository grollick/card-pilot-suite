import { Helmet } from "react-helmet-async";
import { useIndustryInsights } from "@/hooks/useIndustryInsights";
import { Loader2, TrendingUp, DollarSign, Clock, BarChart3, Users, Zap, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function IndustryInsightsPage() {
  const { data: insights, isLoading, error } = useIndustryInsights();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
        <Globe className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">
          {insights?.message || "Complete onboarding to see industry insights."}
        </p>
      </div>
    );
  }

  if (insights.message && !insights.benchmarks) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
        <Users className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">{insights.message}</p>
        <p className="text-xs text-muted-foreground/60">
          {insights.peerCount} business{insights.peerCount !== 1 ? "es" : ""} in your industry so far
        </p>
      </div>
    );
  }

  const comparisonData = [
    {
      metric: "Lead Conversion",
      you: insights.userComparison.leadConversion,
      industry: insights.industryAverages.leadConversion,
    },
    {
      metric: "Booking Rate",
      you: insights.userComparison.bookingRate,
      industry: insights.industryAverages.bookingRate,
    },
    {
      metric: "Est. Approval",
      you: insights.userComparison.estimateApproval,
      industry: insights.industryAverages.estimateApproval,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Industry Insights – guzzl.pro</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <motion.div {...fade} className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{insights.professionName} Insights</h1>
          <p className="text-sm text-muted-foreground">
            Anonymized trends from {insights.peerCount} businesses in your industry
          </p>
        </motion.div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <InsightCard
            icon={DollarSign}
            title="Avg Job Value"
            value={`$${insights.benchmarks!.avgJobValue.toLocaleString()}`}
            subtitle={`$${insights.benchmarks!.lowRange} – $${insights.benchmarks!.highRange} range`}
          />
          <InsightCard
            icon={TrendingUp}
            title="Lead Conversion"
            value={`${insights.industryAverages.leadConversion}%`}
            subtitle="Industry average"
          />
          <InsightCard
            icon={BarChart3}
            title="Booking Rate"
            value={`${insights.industryAverages.bookingRate}%`}
            subtitle="Leads → Bookings"
          />
          <InsightCard
            icon={Clock}
            title="Best Booking Time"
            value={insights.bestTimes.bestBookingHour ?? "—"}
            subtitle={insights.bestTimes.bestBookingDay ? `on ${insights.bestTimes.bestBookingDay}s` : ""}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comparison Chart */}
          <motion.div {...fade} transition={{ delay: 0.1 }} className="dash-card p-5">
            <h3 className="text-sm font-semibold mb-1">You vs Industry</h3>
            <p className="text-xs text-muted-foreground mb-4">Performance comparison (%)</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="you" name="You" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="industry" name="Industry Avg" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Lead Conversion Trend */}
          <motion.div {...fade} transition={{ delay: 0.15 }} className="dash-card p-5">
            <h3 className="text-sm font-semibold mb-1">Lead Conversion Trend</h3>
            <p className="text-xs text-muted-foreground mb-4">Industry-wide weekly data</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={insights.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Line type="monotone" dataKey="leads" name="Leads" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="converted" name="Converted" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trending Services */}
          <motion.div {...fade} transition={{ delay: 0.2 }} className="dash-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-semibold">Trending Services</h3>
            </div>
            <div className="space-y-3">
              {(insights.trendingServices ?? []).map((s, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{s.name}</span>
                    <span className="text-muted-foreground text-xs">{s.popularity}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${Math.min(s.popularity, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {(!insights.trendingServices || insights.trendingServices.length === 0) && (
                <p className="text-xs text-muted-foreground">No service data yet</p>
              )}
            </div>
          </motion.div>

          {/* Top Lead Sources */}
          <motion.div {...fade} transition={{ delay: 0.25 }} className="dash-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Top Lead Sources</h3>
            </div>
            <div className="space-y-3">
              {(insights.topSources ?? []).map((s, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="capitalize">{s.source.replace(/_/g, " ")}</span>
                  <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">{s.pct}%</span>
                </div>
              ))}
              {(!insights.topSources || insights.topSources.length === 0) && (
                <p className="text-xs text-muted-foreground">No source data yet</p>
              )}
            </div>
          </motion.div>

          {/* Marketing Insights */}
          <motion.div {...fade} transition={{ delay: 0.3 }} className="dash-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold">Marketing Insights</h3>
            </div>
            <div className="space-y-4">
              <MarketingStat
                label="Best Day to Post"
                value={insights.bestTimes.bestPostDay ?? "—"}
              />
              <MarketingStat
                label="Peak Booking Time"
                value={insights.bestTimes.bestBookingHour ?? "—"}
              />
              <MarketingStat
                label="Est. Approval Rate"
                value={`${insights.industryAverages.estimateApproval}%`}
              />
              <div className="pt-2 border-t border-border">
                <p className="text-[11px] text-muted-foreground/60">
                  Based on aggregated, anonymized data. No individual business data is shared.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pricing Benchmark Banner */}
        {insights.benchmarks && insights.benchmarks.avgJobValue > 0 && (
          <motion.div {...fade} transition={{ delay: 0.35 }} className="dash-card p-6 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold">Pricing Benchmark</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Average {insights.professionName} job value across the network
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  ${insights.benchmarks.lowRange.toLocaleString()} – ${insights.benchmarks.highRange.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Your avg: <span className={
                    insights.userComparison.avgJobValue >= insights.benchmarks.avgJobValue
                      ? "text-success font-medium"
                      : "text-warning font-medium"
                  }>
                    ${insights.userComparison.avgJobValue.toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}

function InsightCard({ icon: Icon, title, value, subtitle }: {
  icon: React.ElementType;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <motion.div {...fade} className="dash-card p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
    </motion.div>
  );
}

function MarketingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
