import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Users, TrendingUp, CreditCard, Eye, Loader2, Shield,
  BarChart3, UserPlus, Globe, Layers, ChevronRight, ExternalLink,
  Mail, MoreHorizontal, UserCheck, Ban, Gift
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats, useIsAdmin } from "@/hooks/useAdminStats";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const anim = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  starter: { label: "Free", color: "bg-muted text-muted-foreground" },
  free: { label: "Free", color: "bg-muted text-muted-foreground" },
  pro: { label: "Pro", color: "bg-primary/15 text-primary" },
  pro_plus: { label: "Pro Plus", color: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]" },
  business: { label: "Pro Plus", color: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]" },
  agency: { label: "Agency", color: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]" },
};

const PLAN_PRICES: Record<string, number> = {
  pro: 29,
  pro_plus: 79,
  business: 79,
  agency: 249,
};

export default function PlatformAdminDashboard() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: stats, isLoading } = useAdminStats();
  const navigate = useNavigate();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const mrr = useMemo(() => {
    if (!stats) return 0;
    return Object.entries(stats.planCounts).reduce((sum, [plan, count]) => {
      return sum + (PLAN_PRICES[plan] || 0) * count;
    }, 0);
  }, [stats]);

  const paidUsers = useMemo(() => {
    if (!stats) return 0;
    return Object.entries(stats.planCounts)
      .filter(([plan]) => plan !== "starter" && plan !== "free")
      .reduce((sum, [, count]) => sum + count, 0);
  }, [stats]);

  const growthPct = useMemo(() => {
    if (!stats || !stats.signupsPrev30d) return null;
    return Math.round(((stats.signups30d - stats.signupsPrev30d) / stats.signupsPrev30d) * 100);
  }, [stats]);

  const sparkData = useMemo(() => {
    if (!stats?.signupsByDate) return [];
    const today = new Date();
    const points: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      points.push(stats.signupsByDate[key] || 0);
    }
    return points;
  }, [stats]);

  if (adminLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Shield className="h-12 w-12 text-muted-foreground/30" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">You don't have admin privileges to view this page.</p>
      </div>
    );
  }

  const kpis = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      sub: `+${stats?.signups7d ?? 0} this week`,
      icon: Users,
      color: "text-primary bg-primary/10",
      onClick: () => navigate("/app/admin/marketing"),
    },
    {
      label: "Signups (30d)",
      value: stats?.signups30d ?? 0,
      sub: growthPct !== null ? `${growthPct >= 0 ? "+" : ""}${growthPct}% vs prev 30d` : "—",
      icon: UserPlus,
      color: "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10",
      onClick: () => navigate("/app/admin/marketing"),
    },
    {
      label: "Monthly Revenue",
      value: `$${mrr.toLocaleString()}`,
      sub: `${paidUsers} paying customer${paidUsers !== 1 ? "s" : ""}`,
      icon: CreditCard,
      color: "text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10",
      onClick: () => navigate("/app/settings/admin"),
    },
    {
      label: "Card Views (30d)",
      value: stats?.totalCardViews30d ?? 0,
      sub: `${stats?.publishedCards ?? 0} published cards`,
      icon: Eye,
      color: "text-accent-foreground bg-accent",
      onClick: () => navigate("/app/settings/admin"),
    },
  ];

  const quickActions = [
    { label: "Marketing", icon: Mail, to: "/app/admin/marketing", desc: "Campaigns & sequences" },
    { label: "Growth", icon: TrendingUp, to: "/app/settings/admin", desc: "KPIs & goals" },
    { label: "Abuse Monitor", icon: Shield, to: "/app/settings/admin", desc: "Flagged accounts" },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Platform Admin
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of all platform users, plans, revenue, and activity.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/app/admin/marketing")}>
            <Mail className="h-3.5 w-3.5 mr-1" /> Marketing
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/app/settings/admin")}>
            <TrendingUp className="h-3.5 w-3.5 mr-1" /> Growth
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.to)}
            className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-card-hover hover:border-border/80 transition-all text-left group active:scale-[0.98]"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <action.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        ))}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.button
            key={kpi.label}
            {...anim}
            transition={{ delay: i * 0.05 }}
            onClick={kpi.onClick}
            className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-all text-left active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</p>
                {isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                )}
                <p className="text-xs text-muted-foreground">{kpi.sub}</p>
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Signups — 2 cols */}
        <motion.div {...anim} transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Signups</h2>
            <Badge variant="secondary" className="text-[10px]">{stats?.totalUsers ?? 0} total</Badge>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-5 w-14" />
                </div>
              ))}
            </div>
          ) : !stats?.recentSignups?.length ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No users yet.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {stats.recentSignups.map((user) => {
                const planInfo = PLAN_LABELS[user.plan || "starter"] || PLAN_LABELS.starter;
                const initials = user.name
                  ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                  : "?";
                const isExpanded = expandedUser === user.id;

                return (
                  <div key={user.id}>
                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors text-left active:scale-[0.99]"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{user.name || "Unnamed"}</p>
                          <Badge className={`text-[10px] px-1.5 py-0 border-0 ${planInfo.color}`}>
                            {planInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                          {user.handle && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Globe className="h-3 w-3" /> @{user.handle}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </span>
                        <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </div>
                    </button>

                    {/* Expanded actions */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-[52px] pb-3 flex flex-wrap gap-2"
                      >
                        {user.handle && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); navigate(`/${user.handle}`); }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" /> View Card
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-3 w-3 mr-1" /> Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => toast.info(`Grant beta to ${user.name}`)}>
                              <Gift className="h-3.5 w-3.5 mr-2" /> Grant Beta Access
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info(`Verify ${user.name}`)}>
                              <UserCheck className="h-3.5 w-3.5 mr-2" /> Mark Verified
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => toast.info(`Suspend ${user.name}`)}
                            >
                              <Ban className="h-3.5 w-3.5 mr-2" /> Suspend Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Plan Breakdown */}
          <motion.div {...anim} transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="font-semibold mb-4">Plan Breakdown</h2>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(PLAN_LABELS)
                  .filter(([key], idx, arr) => {
                    // Deduplicate: skip "starter" since it's same as "free", skip "business" same as "pro_plus"
                    if (key === "starter" || key === "business") return false;
                    return true;
                  })
                  .map(([key, info]) => {
                    const count = stats?.planCounts[key] || 0;
                    const total = stats?.totalUsers || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium flex items-center gap-1.5">
                            <Badge className={`text-[10px] px-1.5 py-0 border-0 ${info.color}`}>{info.label}</Badge>
                          </span>
                          <span className="text-xs text-muted-foreground">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div className="h-full rounded-full bg-primary"
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </motion.div>

          {/* Activity Summary */}
          <motion.div {...anim} transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="font-semibold mb-4">Platform Activity (30d)</h2>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { label: "Total Cards", value: stats?.totalCards ?? 0, icon: Layers },
                  { label: "Published Cards", value: stats?.publishedCards ?? 0, icon: Globe },
                  { label: "New Leads", value: stats?.leads30d ?? 0, icon: UserPlus },
                  { label: "Bookings", value: stats?.bookings30d ?? 0, icon: BarChart3 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1.5">
                    <span className="text-sm flex items-center gap-1.5">
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground" /> {item.label}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">{item.value}</Badge>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Signup Trend Mini Chart */}
          <motion.div {...anim} transition={{ delay: 0.25 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="font-semibold mb-3">Signup Trend (30d)</h2>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <MiniBarChart data={sparkData} />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function MiniBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px] h-16">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 bg-primary/60 rounded-t-sm min-h-[2px] transition-all hover:bg-primary"
          style={{ height: `${(v / max) * 100}%` }}
          title={`${v} signups`}
        />
      ))}
    </div>
  );
}
