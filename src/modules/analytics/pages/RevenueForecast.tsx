import { DollarSign, TrendingUp, Users, Calendar, ArrowUpRight, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, eachDayOfInterval, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

function useRevenueData(months = 3) {
  return useQuery({
    queryKey: ["revenue-forecast", months],
    queryFn: async () => {
      const since = subMonths(new Date(), months).toISOString();

      const [{ data: leads }, { data: bookings }, { data: services }] = await Promise.all([
        supabase.from("leads").select("id, created_at").gte("created_at", since),
        supabase.from("bookings").select("id, created_at, status, service_id").gte("created_at", since),
        supabase.from("booking_services").select("id, price"),
      ]);

      const allLeads = leads ?? [];
      const allBookings = bookings ?? [];
      const priceMap: Record<string, number> = {};
      (services ?? []).forEach(s => { if (s.price) priceMap[s.id] = Number(s.price); });

      const avgPrice = Object.values(priceMap).length > 0
        ? Object.values(priceMap).reduce((a, b) => a + b, 0) / Object.values(priceMap).length
        : 50;

      // Monthly breakdown
      const monthlyData: { month: string; leads: number; bookings: number; revenue: number }[] = [];
      for (let i = months - 1; i >= 0; i--) {
        const mStart = startOfMonth(subMonths(new Date(), i));
        const mEnd = endOfMonth(mStart);
        const mLeads = allLeads.filter(l => new Date(l.created_at) >= mStart && new Date(l.created_at) <= mEnd);
        const mBookings = allBookings.filter(b => new Date(b.created_at) >= mStart && new Date(b.created_at) <= mEnd);
        const mRevenue = mBookings.reduce((sum, b) => {
          const price = b.service_id ? (priceMap[b.service_id] ?? avgPrice) : avgPrice;
          return sum + (b.status !== "cancelled" ? price : 0);
        }, 0);
        monthlyData.push({
          month: format(mStart, "MMM yyyy"),
          leads: mLeads.length,
          bookings: mBookings.length,
          revenue: Math.round(mRevenue),
        });
      }

      // Current month stats
      const thisMonth = monthlyData[monthlyData.length - 1] ?? { leads: 0, bookings: 0, revenue: 0 };
      const conversionRate = thisMonth.leads > 0 ? Math.round((thisMonth.bookings / thisMonth.leads) * 100) : 0;

      // Forecast: project current month pace to full month
      const dayOfMonth = new Date().getDate();
      const daysInMonth = endOfMonth(new Date()).getDate();
      const projectedRevenue = dayOfMonth > 0 ? Math.round((thisMonth.revenue / dayOfMonth) * daysInMonth) : 0;

      return {
        thisMonth,
        conversionRate,
        avgPrice: Math.round(avgPrice),
        projectedRevenue,
        monthlyData,
        totalLeads: allLeads.length,
        totalBookings: allBookings.length,
        totalRevenue: monthlyData.reduce((s, m) => s + m.revenue, 0),
      };
    },
  });
}

const anim = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

export default function RevenueForecast() {
  const [period, setPeriod] = useState("6");
  const { data, isLoading } = useRevenueData(parseInt(period));

  const maxRevenue = Math.max(...(data?.monthlyData ?? []).map(m => m.revenue), 1);

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight"><span className="font-black text-primary">guzzl</span> <span className="font-normal">Revenue Forecast</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Track conversions and project monthly revenue</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Leads This Month", value: data?.thisMonth.leads ?? 0, icon: Users, color: "text-primary bg-primary/10" },
          { label: "Bookings This Month", value: data?.thisMonth.bookings ?? 0, icon: Calendar, color: "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10" },
          { label: "Conversion Rate", value: `${data?.conversionRate ?? 0}%`, icon: TrendingUp, color: "text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10" },
          { label: "Projected Revenue", value: `$${(data?.projectedRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-accent-foreground bg-accent" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...anim} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-3xl font-bold tracking-tight">{kpi.value}</p>
                )}
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <motion.div {...anim} transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Revenue Trend</h2>
          </div>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="space-y-3">
              {(data?.monthlyData ?? []).map(m => (
                <div key={m.month}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{m.month}</span>
                    <span className="text-muted-foreground">${m.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(m.revenue / maxRevenue) * 100}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Conversion Funnel */}
        <motion.div {...anim} transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Conversion Funnel</h2>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="space-y-4">
              {[
                { label: "Total Leads", value: data?.totalLeads ?? 0, width: "100%" },
                { label: "Total Bookings", value: data?.totalBookings ?? 0, width: `${((data?.totalBookings ?? 0) / Math.max(data?.totalLeads ?? 1, 1)) * 100}%` },
                { label: "Total Revenue", value: `$${(data?.totalRevenue ?? 0).toLocaleString()}`, width: `${Math.min(((data?.totalBookings ?? 0) / Math.max(data?.totalLeads ?? 1, 1)) * 100, 100)}%` },
              ].map((item, i) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                  <div className="h-8 rounded-lg bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-lg bg-primary/70 flex items-center justify-center"
                      initial={{ width: 0 }}
                      animate={{ width: item.width }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                    />
                  </div>
                </div>
              ))}
              {(data?.conversionRate ?? 0) > 0 && (
                <div className="text-center pt-2">
                  <p className="text-3xl font-bold text-primary">{data?.conversionRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Lead → Booking Rate</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Monthly Breakdown Table */}
      <motion.div {...anim} transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Monthly Breakdown</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 font-medium text-muted-foreground">Month</th>
                <th className="text-right p-2 font-medium text-muted-foreground">Leads</th>
                <th className="text-right p-2 font-medium text-muted-foreground">Bookings</th>
                <th className="text-right p-2 font-medium text-muted-foreground">Conv. Rate</th>
                <th className="text-right p-2 font-medium text-muted-foreground">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(data?.monthlyData ?? []).map(m => (
                <tr key={m.month} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-2 font-medium">{m.month}</td>
                  <td className="p-2 text-right">{m.leads}</td>
                  <td className="p-2 text-right">{m.bookings}</td>
                  <td className="p-2 text-right">{m.leads > 0 ? Math.round((m.bookings / m.leads) * 100) : 0}%</td>
                  <td className="p-2 text-right font-semibold">${m.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
