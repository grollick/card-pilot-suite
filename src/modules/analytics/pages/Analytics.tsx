import { Eye, MousePointer, Users, TrendingUp, Mail, BarChart3, Calendar, Globe, Smartphone, Monitor, Tablet, Download, Clock, RefreshCw, ArrowDown } from "lucide-react";
import DesktopGuidanceNotice from "@/components/DesktopGuidanceNotice";
import KPICard from "@/components/KPICard";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useAnalyticsStats, useCtaBreakdown, useEmailStats, useReferrerBreakdown, useDeviceBreakdown, useConversionFunnel, useLeadResponseTime, useRepeatCustomers } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  Mobile: <Smartphone className="h-3.5 w-3.5" />,
  Desktop: <Monitor className="h-3.5 w-3.5" />,
  Tablet: <Tablet className="h-3.5 w-3.5" />,
};

export default function Analytics() {
  const [period, setPeriod] = useState("7");
  const days = parseInt(period);
  const { data: stats, isLoading } = useAnalyticsStats(days);
  const { data: ctaData = [] } = useCtaBreakdown(days);
  const { data: emailStats } = useEmailStats(days);
  const { data: referrerData = [] } = useReferrerBreakdown(days);
  const { data: deviceData = [] } = useDeviceBreakdown(days);
  const { data: funnel } = useConversionFunnel(days);
  const { data: responseTime } = useLeadResponseTime(days);
  const { data: repeatData } = useRepeatCustomers();

  const fmtChange = (c?: { value: number; type: string }) => {
    if (!c || c.type === "neutral") return { text: `${days}d`, type: "neutral" as const };
    const prefix = c.type === "positive" ? "+" : "-";
    return { text: `${prefix}${c.value}% vs prev ${days}d`, type: c.type as "positive" | "negative" };
  };

  const maxViews = Math.max(...(stats?.dailyData?.map(d => d.views) ?? [1]), 1);

  return (
    <div className="space-y-8 max-w-6xl">
      <DesktopGuidanceNotice toolKey="analytics" />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight"><span className="font-extrabold text-primary">guzzl</span> <span className="font-normal">Analytics</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Track your card performance and engagement</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
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

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <KPICard icon={Eye} title="Card Views" value={stats?.views ?? 0}
            change={fmtChange(stats?.viewsChange).text} changeType={fmtChange(stats?.viewsChange).type} />
          <KPICard icon={MousePointer} title="CTA Clicks" value={stats?.clicks ?? 0}
            change={fmtChange(stats?.clicksChange).text} changeType={fmtChange(stats?.clicksChange).type} />
          <KPICard icon={Users} title="Leads Captured" value={stats?.contacts ?? 0}
            change={fmtChange(stats?.contactsChange).text} changeType={fmtChange(stats?.contactsChange).type} />
          <KPICard icon={Download} title="Contact Saves" value={stats?.contactSaves ?? 0}
            sparklineData={stats?.dailyData?.map(d => d.contactSaves)}
            change={fmtChange(stats?.contactSavesChange).text} changeType={fmtChange(stats?.contactSavesChange).type} />
          <KPICard icon={Calendar} title="Bookings" value={stats?.bookings ?? 0}
            change={fmtChange(stats?.bookingsChange).text} changeType={fmtChange(stats?.bookingsChange).type} />
          <KPICard icon={TrendingUp} title="Conversion Rate" value={`${stats?.conversionRate ?? 0}%`}
            change={`${(stats?.conversionChange ?? 0) >= 0 ? "+" : ""}${stats?.conversionChange ?? 0}% vs prev`}
            changeType={(stats?.conversionChange ?? 0) > 0 ? "positive" : (stats?.conversionChange ?? 0) < 0 ? "negative" : "neutral"} />
        </div>
      )}

      {/* Conversion Funnel + Response Time + Repeat Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Funnel */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Conversion Funnel</h2>
          </div>
          {funnel ? (
            <div className="space-y-1">
              {[
                { label: "Visitors", value: funnel.visitors, pct: 100 },
                { label: "Leads", value: funnel.leads, pct: funnel.visitorToLead },
                { label: "Bookings", value: funnel.bookings, pct: funnel.leadToBooking },
              ].map((step, i) => (
                <div key={step.label}>
                  {i > 0 && (
                    <div className="flex justify-center my-0.5">
                      <ArrowDown className="h-3 w-3 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{step.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold tabular-nums">{step.value.toLocaleString()}</span>
                        {i > 0 && <Badge variant="secondary" className="text-2xs">{step.pct}%</Badge>}
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(step.pct, 2)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Skeleton className="h-40" />
          )}
        </motion.div>

        {/* Lead Response Time */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-warning" />
            <h2 className="font-semibold">Lead Response Time</h2>
          </div>
          {responseTime ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-4xl font-bold tracking-tight">{responseTime.avgFormatted}</p>
                <p className="text-sm text-muted-foreground mt-1">Average response time</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <p className="text-2xl font-bold">{responseTime.respondedPct}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">Leads responded to</p>
              </div>
              <p className="text-2xs text-muted-foreground text-center">
                {responseTime.avgMinutes <= 60
                  ? "⚡ Great! You're responding fast."
                  : responseTime.avgMinutes <= 240
                  ? "⏱ Good — keep it up!"
                  : "⚠ Try to respond within 1 hour for best conversion."}
              </p>
            </div>
          ) : (
            <Skeleton className="h-40" />
          )}
        </motion.div>

        {/* Repeat Customers */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}
          className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="h-4 w-4 text-success" />
            <h2 className="font-semibold">Repeat Customers</h2>
          </div>
          {repeatData ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-4xl font-bold tracking-tight">{repeatData.repeatPct}%</p>
                <p className="text-sm text-muted-foreground mt-1">Repeat rate</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-xl font-bold">{repeatData.totalCustomers}</p>
                  <p className="text-2xs text-muted-foreground mt-0.5">Total customers</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-xl font-bold">{repeatData.repeatCustomers}</p>
                  <p className="text-2xs text-muted-foreground mt-0.5">Repeat bookings</p>
                </div>
              </div>
              <p className="text-2xs text-muted-foreground text-center">
                {repeatData.repeatPct >= 30
                  ? "🎉 Strong loyalty — customers keep coming back!"
                  : "💡 Send follow-up offers after jobs to boost repeat bookings."}
              </p>
            </div>
          ) : (
            <Skeleton className="h-40" />
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Views & Clicks</h2>
          {stats?.dailyData ? (
            <>
              <div className="flex items-end gap-1 h-40">
                {stats.dailyData.map(d => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-md bg-primary/20 relative"
                      style={{ height: `${Math.max((d.views / maxViews) * 100, 2)}%` }}>
                      {d.clicks > 0 && (
                        <div className="absolute inset-x-0 bottom-0 rounded-t-md bg-primary"
                          style={{ height: `${(d.clicks / Math.max(d.views, 1)) * 100}%` }} />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{d.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-primary/20" /> Views</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-primary" /> Clicks</span>
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
          )}
        </motion.div>

        {/* Top CTAs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Top Actions</h2>
          {ctaData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No CTA clicks recorded yet</div>
          ) : (
            <div className="space-y-4">
              {ctaData.slice(0, 5).map(a => (
                <div key={a.action}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium capitalize">{a.action}</span>
                    <span className="text-muted-foreground">{a.count} ({a.pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${a.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Referrer & Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Traffic Sources</h2>
          </div>
          {referrerData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">No traffic data yet</div>
          ) : (
            <div className="space-y-3">
              {referrerData.slice(0, 6).map(r => (
                <div key={r.source}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium truncate max-w-[180px]">{r.source}</span>
                    <span className="text-muted-foreground text-xs">{r.count} ({r.pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
          className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Devices</h2>
          </div>
          {deviceData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">No device data yet</div>
          ) : (
            <div className="space-y-4">
              {deviceData.map(d => (
                <div key={d.device} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                    {DEVICE_ICONS[d.device] ?? <Monitor className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{d.device}</span>
                      <span className="text-muted-foreground text-xs">{d.count} ({d.pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Email & Period Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Email Performance</h2>
          </div>
          {emailStats ? (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Total Sent", value: emailStats.sent },
                { label: "Pending", value: emailStats.pending },
                { label: "Failed", value: emailStats.failed },
                { label: "Bounced", value: emailStats.bounced },
              ].map(s => (
                <div key={s.label} className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-semibold">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Period Summary</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Card Views", value: stats?.views ?? 0 },
              { label: "Contact Saves", value: stats?.contactSaves ?? 0 },
              { label: "Form Submits", value: stats?.formSubmits ?? 0 },
              { label: "Bookings", value: stats?.bookings ?? 0 },
              { label: "Booking Events", value: stats?.bookingEvents ?? 0 },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}