import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, UserCheck, Zap, Briefcase, BarChart3, TrendingUp,
  Activity, Target, Shield, DollarSign, Mail, Workflow,
  Megaphone, FlaskConical, Gift, Lightbulb, Rocket,
  AlertTriangle, Clock, Eye, Globe, Layers, CreditCard,
  MessageSquare, CheckCircle2, XCircle, ArrowUpRight,
  Send, FileText, BookOpen, Settings, RefreshCw, UserPlus,
  Loader2, ShieldAlert, Flame, Heart, Star, Ban
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ResearchSummaryWidget from "@/modules/admin/components/ResearchSummaryWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useAdminGrowthStats } from "@/hooks/useAdminGrowthStats";

// ─── Metric Card ───
function MetricCard({ icon: Icon, label, value, sub, color = "text-primary", loading }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string; loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center">
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
      {loading ? <Skeleton className="h-7 w-16" /> : (
        <p className="text-2xl font-bold tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Section Header ───
function SectionHeader({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <Icon className="h-4 w-4 text-primary" />
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// ─── Funnel Step ───
function FunnelStep({ label, value, pct, loading }: { label: string; value: number; pct: number; loading: boolean }) {
  return (
    <div className="flex-1 text-center">
      {loading ? <Skeleton className="h-6 w-10 mx-auto" /> : (
        <p className="text-lg font-bold tabular-nums">{value.toLocaleString()}</p>
      )}
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <Progress value={pct} className="h-1.5 mt-1" />
      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{pct}%</p>
    </div>
  );
}

export default function FounderCommandCenter({ onNavigateSection }: { onNavigateSection?: (section: string) => void }) {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: growth, isLoading: growthLoading } = useAdminGrowthStats();
  const loading = statsLoading || growthLoading;

  const kpis = growth?.kpis;
  const funnel = growth?.funnel;
  const marketplace = growth?.marketplace;
  const referrals = growth?.referrals;

  // Derived metrics
  const paidUsers = useMemo(() => {
    if (!stats) return 0;
    return Object.entries(stats.planCounts)
      .filter(([p]) => p !== "starter" && p !== "free")
      .reduce((s, [, c]) => s + c, 0);
  }, [stats]);

  const freeUsers = useMemo(() => {
    if (!stats) return 0;
    return (stats.planCounts["starter"] || 0) + (stats.planCounts["free"] || 0);
  }, [stats]);

  const conversionRate = useMemo(() => {
    if (!stats?.totalUsers) return 0;
    return Math.round((paidUsers / stats.totalUsers) * 100);
  }, [stats, paidUsers]);

  const funnelMax = Math.max(funnel?.outreach ?? 1, 1);
  const funnelPcts = funnel ? {
    outreach: 100,
    signups: Math.round((funnel.signups / funnelMax) * 100),
    activated: Math.round((funnel.activated / funnelMax) * 100),
    leads: Math.round((funnel.leads / funnelMax) * 100),
    wins: Math.round((funnel.wins / funnelMax) * 100),
  } : { outreach: 0, signups: 0, activated: 0, leads: 0, wins: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">Founder Command Center</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Full visibility and control over platform growth, activity, and health
        </p>
      </div>

      {/* ── SECTION 2: KPI Overview ── */}
      <SectionHeader icon={BarChart3} title="KPI Overview" description="Core platform metrics at a glance" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} loading={loading} />
        <MetricCard icon={UserCheck} label="Active Users" value={kpis?.activatedUsers ?? 0} color="text-[hsl(var(--success))]" loading={loading} />
        <MetricCard icon={Zap} label="Leads Today" value={kpis?.leads30d ?? 0} sub="Last 30 days" color="text-[hsl(var(--warning))]" loading={loading} />
        <MetricCard icon={Briefcase} label="Job Requests" value={kpis?.jobRequests30d ?? 0} color="text-[hsl(var(--accent-foreground))]" loading={loading} />
        <MetricCard icon={Target} label="Conversion Rate" value={`${conversionRate}%`} sub="Free → Paid" loading={loading} />
      </div>

      {/* ── SECTION 3: Growth Funnel ── */}
      <SectionHeader icon={TrendingUp} title="Growth Funnel" description="Outreach → Signups → Activated → Leads → Wins" />
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 items-end">
            <FunnelStep label="Outreach" value={funnel?.outreach ?? 0} pct={funnelPcts.outreach} loading={loading} />
            <ArrowUpRight className="h-3 w-3 text-muted-foreground mb-6 shrink-0" />
            <FunnelStep label="Signups" value={funnel?.signups ?? 0} pct={funnelPcts.signups} loading={loading} />
            <ArrowUpRight className="h-3 w-3 text-muted-foreground mb-6 shrink-0" />
            <FunnelStep label="Activated" value={funnel?.activated ?? 0} pct={funnelPcts.activated} loading={loading} />
            <ArrowUpRight className="h-3 w-3 text-muted-foreground mb-6 shrink-0" />
            <FunnelStep label="Leads" value={funnel?.leads ?? 0} pct={funnelPcts.leads} loading={loading} />
            <ArrowUpRight className="h-3 w-3 text-muted-foreground mb-6 shrink-0" />
            <FunnelStep label="Wins" value={funnel?.wins ?? 0} pct={funnelPcts.wins} loading={loading} />
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 4: Marketplace Health + SECTION 8: Revenue ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <SectionHeader icon={Globe} title="Marketplace Health" description="Supply-side activity" />
          <Card className="mt-2">
            <CardContent className="pt-6 grid grid-cols-2 gap-4">
              <MetricCard icon={Briefcase} label="Active Businesses" value={marketplace?.activeBusinesses ?? 0} loading={loading} />
              <MetricCard icon={UserCheck} label="On-Duty Users" value={marketplace?.onDutyUsers ?? 0} color="text-[hsl(var(--success))]" loading={loading} />
              <MetricCard icon={Send} label="Total Requests" value={marketplace?.totalRequests ?? 0} loading={loading} />
              <MetricCard icon={MessageSquare} label="Avg Responses" value={marketplace?.avgResponses ?? 0} loading={loading} />
            </CardContent>
          </Card>
        </div>

        <div>
          <SectionHeader icon={DollarSign} title="Revenue & Plans" description="Free vs paid breakdown" />
          <Card className="mt-2">
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Free Users</span>
                {loading ? <Skeleton className="h-5 w-12" /> : <span className="font-bold">{freeUsers.toLocaleString()}</span>}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Paid Users</span>
                {loading ? <Skeleton className="h-5 w-12" /> : <span className="font-bold text-[hsl(var(--success))]">{paidUsers.toLocaleString()}</span>}
              </div>
              <Progress value={conversionRate} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">{conversionRate}% conversion rate</p>
              {stats?.planCounts && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {Object.entries(stats.planCounts).map(([plan, count]) => (
                    <div key={plan} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-muted/40">
                      <Badge variant="outline" className="text-[10px] capitalize">{plan}</Badge>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── SECTION 5: Live Activity ── */}
      <SectionHeader icon={Activity} title="Live Activity" description="Recent platform events" />
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (growth?.activityFeed?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {growth!.activityFeed.slice(0, 10).map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm py-1.5 border-b border-border/50 last:border-0">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                    item.type === "signup" ? "bg-primary/10" : item.type === "job_request" ? "bg-[hsl(var(--warning))]/10" : "bg-[hsl(var(--success))]/10"
                  }`}>
                    {item.type === "signup" ? <UserPlus className="h-3 w-3 text-primary" /> :
                     item.type === "job_request" ? <Briefcase className="h-3 w-3 text-[hsl(var(--warning))]" /> :
                     <MessageSquare className="h-3 w-3 text-[hsl(var(--success))]" />}
                  </div>
                  <span className="flex-1 truncate">{item.title}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{item.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SECTION 6: User Management + SECTION 7: Trust & Security ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <SectionHeader icon={Users} title="User Management" description="View and manage platform users" />
          <Card className="mt-2">
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Users</span>
                {loading ? <Skeleton className="h-4 w-10" /> : <span className="font-medium">{stats?.totalUsers ?? 0}</span>}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recent Signups (7d)</span>
                {loading ? <Skeleton className="h-4 w-10" /> : <span className="font-medium">{stats?.signups7d ?? 0}</span>}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Published Cards</span>
                {loading ? <Skeleton className="h-4 w-10" /> : <span className="font-medium">{stats?.publishedCards ?? 0}</span>}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => navigate("/app/platform-admin")}>
                  <Eye className="h-3 w-3" /> View Users
                </Button>
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onNavigateSection?.("system")}>
                  <Gift className="h-3 w-3" /> Beta Access
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <SectionHeader icon={ShieldAlert} title="Trust & Security" description="Flagged accounts and threats" />
          <Card className="mt-2">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--warning))]" />
                <span className="text-muted-foreground">Low trust accounts</span>
                <Badge variant="outline" className="ml-auto text-[10px]">Monitor</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Ban className="h-3.5 w-3.5 text-destructive" />
                <span className="text-muted-foreground">Flagged users</span>
                <Badge variant="outline" className="ml-auto text-[10px]">Review</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">Blocked attempts</span>
                <Badge variant="outline" className="ml-auto text-[10px]">Logged</Badge>
              </div>
              <Button size="sm" variant="outline" className="text-xs gap-1 w-full mt-2" onClick={() => onNavigateSection?.("abuse")}>
                <ShieldAlert className="h-3 w-3" /> Abuse Monitor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── SECTION 9: Feature Usage + SECTION 10: Leads & Messaging ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <SectionHeader icon={Layers} title="Feature Usage" description="How users engage with core features" />
          <Card className="mt-2">
            <CardContent className="pt-6 space-y-3">
              {[
                { name: "Card Builder", icon: CreditCard, value: stats?.publishedCards ?? 0, label: "published" },
                { name: "CRM / Contacts", icon: Users, value: kpis?.totalLeads ?? 0, label: "contacts" },
                { name: "Bookings", icon: Clock, value: stats?.bookings30d ?? 0, label: "30d bookings" },
                { name: "Marketplace", icon: Globe, value: marketplace?.totalRequests ?? 0, label: "requests" },
              ].map(f => (
                <div key={f.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <f.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{f.name}</span>
                  </div>
                  {loading ? <Skeleton className="h-4 w-12" /> : (
                    <span className="text-xs text-muted-foreground">{f.value.toLocaleString()} {f.label}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <SectionHeader icon={MessageSquare} title="Leads & Messaging" description="Lead response metrics" />
          <Card className="mt-2">
            <CardContent className="pt-6 grid grid-cols-2 gap-3">
              <MetricCard icon={Zap} label="New Leads (30d)" value={stats?.leads30d ?? 0} color="text-[hsl(var(--warning))]" loading={loading} />
              <MetricCard icon={BarChart3} label="Response Rate" value={`${kpis?.responseRate ?? 0}%`} loading={loading} />
              <MetricCard icon={Target} label="Total Leads" value={kpis?.totalLeads ?? 0} loading={loading} />
              <MetricCard icon={Clock} label="Job Requests (30d)" value={kpis?.jobRequests30d ?? 0} loading={loading} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── SECTION 11: Automation Status + SECTION 12: Marketing ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <SectionHeader icon={Workflow} title="Automation Status" description="System automation health" />
          <Card className="mt-2">
            <CardContent className="pt-6 space-y-3">
              {[
                { name: "Lead Assignment", icon: UserCheck, status: "active" },
                { name: "Recovery System", icon: RefreshCw, status: "active" },
                { name: "Email Automation", icon: Mail, status: "active" },
                { name: "Daily Reports", icon: FileText, status: "active" },
              ].map(a => (
                <div key={a.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <a.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{a.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20">
                    <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> {a.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <SectionHeader icon={Megaphone} title="Marketing" description="Campaign and outreach tools" />
          <Card className="mt-2">
            <CardContent className="pt-6 space-y-2">
              {[
                { name: "Email Campaigns", icon: Send, route: "/app/admin-marketing" },
                { name: "Templates", icon: FileText, route: "/app/admin-marketing" },
                { name: "Sequences", icon: Workflow, route: "/app/admin-marketing" },
              ].map(m => (
                <Button key={m.name} variant="ghost" size="sm" className="w-full justify-start text-sm gap-2" onClick={() => navigate(m.route)}>
                  <m.icon className="h-3.5 w-3.5" /> {m.name}
                  <ArrowUpRight className="h-3 w-3 ml-auto text-muted-foreground" />
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── SECTION 13: A/B Testing + SECTION 14: Referrals ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <SectionHeader icon={FlaskConical} title="A/B Testing" description="Test performance overview" />
          <Card className="mt-2">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-3">Manage experiments and view winning variants</p>
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => navigate("/app/admin-marketing")}>
                <FlaskConical className="h-3 w-3" /> View A/B Tests
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <SectionHeader icon={Gift} title="Referrals" description="Referral program metrics" />
          <Card className="mt-2">
            <CardContent className="pt-6 grid grid-cols-2 gap-3">
              <MetricCard icon={Send} label="Total Invites" value={referrals?.total ?? 0} loading={loading} />
              <MetricCard icon={UserCheck} label="Activated" value={referrals?.activated ?? 0} color="text-[hsl(var(--success))]" loading={loading} />
              <MetricCard icon={Gift} label="Rewards Issued" value={referrals?.rewardsIssued ?? 0} color="text-[hsl(var(--warning))]" loading={loading} />
              <MetricCard icon={Star} label="Reward Days" value={referrals?.totalRewardDays ?? 0} loading={loading} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── SECTION 15: Insights ── */}
      <SectionHeader icon={Lightbulb} title="Insights" description="Actionable suggestions based on current data" />
      <Card>
        <CardContent className="pt-6 space-y-3">
          {!loading && kpis && funnel ? (
            <>
              {(kpis.responseRate ?? 0) < 50 && (
                <div className="flex items-start gap-2 text-sm p-3 rounded-lg bg-[hsl(var(--warning))]/5 border border-[hsl(var(--warning))]/10">
                  <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Low response rate ({kpis.responseRate}%)</p>
                    <p className="text-xs text-muted-foreground">Enable auto-notifications and lead assignment to improve response time.</p>
                  </div>
                </div>
              )}
              {conversionRate < 5 && (
                <div className="flex items-start gap-2 text-sm p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Low free-to-paid conversion ({conversionRate}%)</p>
                    <p className="text-xs text-muted-foreground">Consider targeted upgrade campaigns or extended trial offers.</p>
                  </div>
                </div>
              )}
              {(funnel.activated / Math.max(funnel.signups, 1)) < 0.3 && (
                <div className="flex items-start gap-2 text-sm p-3 rounded-lg bg-[hsl(var(--success))]/5 border border-[hsl(var(--success))]/10">
                  <Flame className="h-4 w-4 text-[hsl(var(--success))] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Activation gap</p>
                    <p className="text-xs text-muted-foreground">Only {Math.round((funnel.activated / Math.max(funnel.signups, 1)) * 100)}% of signups activate. Improve onboarding flow and checklist completion.</p>
                  </div>
                </div>
              )}
              {(kpis.responseRate ?? 0) >= 50 && conversionRate >= 5 && (
                <div className="flex items-start gap-2 text-sm p-3 rounded-lg bg-[hsl(var(--success))]/5 border border-[hsl(var(--success))]/10">
                  <Heart className="h-4 w-4 text-[hsl(var(--success))] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Platform health is looking good!</p>
                    <p className="text-xs text-muted-foreground">Focus on scaling outreach and maintaining activation rates.</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          )}
        </CardContent>
      </Card>

      {/* ── SECTION: Research Summary ── */}
      <ResearchSummaryWidget onNavigate={() => onNavigateSection?.("research")} />

      {/* ── SECTION 16: Quick Actions ── */}
      <SectionHeader icon={Rocket} title="Quick Actions" description="Common admin tasks" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { label: "Users", icon: Users, action: () => navigate("/app/platform-admin") },
          { label: "Marketing", icon: Megaphone, action: () => navigate("/app/admin-marketing") },
          { label: "Growth", icon: TrendingUp, action: () => onNavigateSection?.("growth") },
          { label: "Abuse", icon: ShieldAlert, action: () => onNavigateSection?.("abuse") },
          { label: "Feedback", icon: MessageSquare, action: () => onNavigateSection?.("feedback") },
          { label: "Research", icon: BookOpen, action: () => onNavigateSection?.("research") },
          { label: "Settings", icon: Settings, action: () => navigate("/app/settings") },
        ].map(a => (
          <Button key={a.label} variant="outline" size="sm" className="flex flex-col gap-1 h-auto py-3 text-xs" onClick={a.action}>
            <a.icon className="h-4 w-4" />
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
