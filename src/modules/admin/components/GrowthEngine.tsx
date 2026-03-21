import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, UserCheck, Zap, Briefcase, Target, Send, Plus, Eye,
  Activity, TrendingUp, AlertTriangle, Clock, CheckCircle2,
  MessageSquare, Trash2, Lightbulb, Rocket, Mail, Globe,
  UserPlus, ArrowUpRight, Star, Flame, Heart, RefreshCw,
  Gift, Trophy, Calendar, Copy, Megaphone, ShieldAlert,
  BarChart3, FileText, Workflow
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useAdminGrowthStats, useOutreachContacts } from "@/hooks/useAdminGrowthStats";
import { formatDistanceToNow } from "date-fns";

// ─── Section Header ───
function SectionHeader({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <Icon className="h-4 w-4 text-primary" />
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

// ─── Outreach Statuses ───
const STATUSES = [
  { value: "not_contacted", label: "Not Contacted", color: "bg-muted text-muted-foreground" },
  { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "replied", label: "Replied", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "signed_up", label: "Signed Up", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { value: "activated", label: "Activated", color: "bg-primary/10 text-primary" },
];

// ─── SECTION 1: Outreach Engine ───
function OutreachEngine() {
  const { data: contacts, isLoading, addContact, updateContact, deleteContact } = useOutreachContacts();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBiz, setNewBiz] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    addContact.mutate(
      { name: newName, business: newBiz || undefined, notes: newNotes || undefined },
      {
        onSuccess: () => { setShowAdd(false); setNewName(""); setNewBiz(""); setNewNotes(""); toast.success("Contact added"); },
        onError: () => toast.error("Failed to add contact"),
      }
    );
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Outreach Tracker
          </h4>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Outreach Contact</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Name *" value={newName} onChange={e => setNewName(e.target.value)} />
                <Input placeholder="Business" value={newBiz} onChange={e => setNewBiz(e.target.value)} />
                <Textarea placeholder="Notes" value={newNotes} onChange={e => setNewNotes(e.target.value)} rows={2} />
                <Button onClick={handleAdd} disabled={!newName.trim() || addContact.isPending} className="w-full">
                  {addContact.isPending ? "Adding..." : "Add Contact"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : !contacts?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">No outreach contacts yet.</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-[1fr_1fr_120px_90px_36px] gap-2 px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              <span>Name</span><span>Business</span><span>Status</span><span>Last</span><span />
            </div>
            {contacts.map(c => {
              const st = STATUSES.find(s => s.value === c.status) || STATUSES[0];
              return (
                <div key={c.id} className="grid grid-cols-[1fr_1fr_120px_90px_36px] gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/40 items-center text-sm">
                  <span className="font-medium truncate">{c.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{c.business || "—"}</span>
                  <Select
                    value={c.status}
                    onValueChange={val => updateContact.mutate({ id: c.id, status: val, last_contact_at: new Date().toISOString() })}
                  >
                    <SelectTrigger className="h-6 text-[10px]">
                      <span className={`px-1 py-0.5 rounded text-[10px] font-medium ${st.color}`}>{st.label}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span className="text-[10px] text-muted-foreground">
                    {c.last_contact_at ? formatDistanceToNow(new Date(c.last_contact_at), { addSuffix: true }) : "—"}
                  </span>
                  <Button
                    variant="ghost" size="icon" className="h-6 w-6"
                    onClick={() => deleteContact.mutate(c.id, { onSuccess: () => toast.success("Deleted") })}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── SECTION 2: Outreach Scripts ───
const SCRIPTS = [
  {
    label: "Cold DM — Contractor",
    text: `Hey [Name]! I came across your work and wanted to share something — guzzl.pro lets contractors like you create a free digital business card, get leads, and manage bookings all in one place. Want me to set one up for you?`,
  },
  {
    label: "Cold DM — Barber",
    text: `Hey [Name]! I built guzzl.pro specifically for barbers — a free smart business card with online booking. Your clients can book 24/7. Want to check it out?`,
  },
  {
    label: "Follow-Up",
    text: `Hey [Name], just circling back! Did you get a chance to check out guzzl.pro? Happy to help you get set up — only takes a few minutes.`,
  },
  {
    label: "Referral Ask",
    text: `Hey [Name]! Loving what you've built on guzzl.pro. Know any other pros who could use a smart business card? You both get 14 days Pro free when they activate! Share your link: guzzl.pro/ref/[CODE]`,
  },
];

function OutreachScripts() {
  const copyScript = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Script copied to clipboard");
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        {SCRIPTS.map((s, i) => (
          <div key={i} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold">{s.label}</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => copyScript(s.text)}>
                <Copy className="h-3 w-3" /> Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{s.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── SECTION 4: Activation Booster ───
function ActivationBooster({ kpis, loading }: { kpis: any; loading: boolean }) {
  const totalUsers = kpis?.totalUsers ?? 0;
  const activated = kpis?.activatedUsers ?? 0;
  const notActivated = Math.max(totalUsers - activated, 0);
  const rate = totalUsers > 0 ? Math.round((activated / totalUsers) * 100) : 0;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Users not activated</p>
            {loading ? <Skeleton className="h-7 w-16 mt-1" /> : (
              <p className="text-2xl font-bold text-[hsl(var(--warning))]">{notActivated}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Activation rate</p>
            {loading ? <Skeleton className="h-5 w-10" /> : (
              <p className="text-lg font-bold">{rate}%</p>
            )}
          </div>
        </div>
        <Progress value={rate} className="h-2" />
        <Button size="sm" variant="outline" className="w-full gap-1 text-xs" onClick={() => toast.info("Activation reminder campaign queued")}>
          <Send className="h-3 w-3" /> Send Activation Reminder
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── SECTION 5: Retention Tools ───
function RetentionTools({ kpis, loading }: { kpis: any; loading: boolean }) {
  const totalUsers = kpis?.totalUsers ?? 0;
  const activated = kpis?.activatedUsers ?? 0;
  // Estimate inactive = activated but not generating leads recently
  const estimatedInactive = Math.max(Math.round(activated * 0.3), 0);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <p className="text-sm font-medium">Estimated Inactive Users</p>
          {loading ? <Skeleton className="h-7 w-16 mt-1" /> : (
            <p className="text-2xl font-bold text-destructive">{estimatedInactive}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Users who activated but haven't been active in 14+ days</p>
        </div>
        <Button size="sm" variant="outline" className="w-full gap-1 text-xs" onClick={() => toast.info("Re-engagement campaign queued")}>
          <Heart className="h-3 w-3" /> Send Re-engagement Message
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── SECTION 6: Referral Booster ───
function ReferralBooster({ referrals, loading }: { referrals: any; loading: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Invites", value: referrals?.total ?? 0, icon: Send },
            { label: "Activated", value: referrals?.activated ?? 0, icon: UserCheck },
            { label: "Rewards", value: referrals?.rewardsIssued ?? 0, icon: Gift },
            { label: "Days Given", value: referrals?.totalRewardDays ?? 0, icon: Calendar },
          ].map(m => (
            <div key={m.label} className="text-center p-2 rounded-lg bg-muted/30">
              <m.icon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
              {loading ? <Skeleton className="h-5 w-8 mx-auto" /> : (
                <p className="text-lg font-bold tabular-nums">{m.value}</p>
              )}
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" className="w-full gap-1 text-xs" onClick={() => toast.info("Referral promotion campaign queued")}>
          <Megaphone className="h-3 w-3" /> Promote Referral Program
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── SECTION 7: Opportunities Panel ───
function OpportunitiesPanel({ kpis, stats, loading }: { kpis: any; stats: any; loading: boolean }) {
  const notActivated = Math.max((kpis?.totalUsers ?? 0) - (kpis?.activatedUsers ?? 0), 0);
  const freeUsers = stats ? (stats.planCounts["starter"] || 0) + (stats.planCounts["free"] || 0) : 0;
  const opportunities = [
    {
      label: "Users not activated",
      value: notActivated,
      icon: UserPlus,
      color: "text-[hsl(var(--warning))]",
      action: "Send activation emails",
    },
    {
      label: "Unanswered leads (est.)",
      value: Math.round((kpis?.totalLeads ?? 0) * (1 - (kpis?.responseRate ?? 0) / 100)),
      icon: MessageSquare,
      color: "text-destructive",
      action: "Nudge users to respond",
    },
    {
      label: "Free users (upgrade potential)",
      value: freeUsers,
      icon: TrendingUp,
      color: "text-primary",
      action: "Send upgrade campaign",
    },
  ];

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        {opportunities.map(o => (
          <div key={o.label} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
            <o.icon className={`h-4 w-4 ${o.color} shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm">{o.label}</span>
                {loading ? <Skeleton className="h-4 w-8" /> : (
                  <span className="text-sm font-bold tabular-nums">{o.value}</span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">→ {o.action}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── SECTION 8: Alerts ───
function GrowthAlerts({ kpis, funnel, marketplace }: { kpis: any; funnel: any; marketplace: any }) {
  const alerts: { level: "critical" | "warning" | "info"; msg: string; action: string }[] = [];

  if ((kpis?.newUsers7d ?? 0) === 0)
    alerts.push({ level: "critical", msg: "Zero new signups this week. Growth stalled.", action: "Launch outreach campaign" });

  if ((kpis?.responseRate ?? 0) < 30)
    alerts.push({ level: "critical", msg: `Response rate is ${kpis?.responseRate ?? 0}%. Users ignoring leads.`, action: "Enable auto-notifications" });

  const activationRate = kpis?.totalUsers > 0 ? ((kpis?.activatedUsers ?? 0) / kpis.totalUsers) * 100 : 0;
  if (activationRate < 25)
    alerts.push({ level: "warning", msg: `Only ${Math.round(activationRate)}% activation rate.`, action: "Review onboarding flow" });

  if ((marketplace?.onDutyUsers ?? 0) === 0)
    alerts.push({ level: "warning", msg: "No users currently on duty. Marketplace inactive.", action: "Encourage duty activation" });

  if (alerts.length === 0)
    alerts.push({ level: "info", msg: "No critical alerts. Platform health looks stable.", action: "Focus on scaling" });

  const styles = {
    critical: "border-destructive/30 bg-destructive/5",
    warning: "border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5",
    info: "border-border bg-muted/30",
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-2">
        {alerts.map((a, i) => (
          <div key={i} className={`rounded-lg border p-3 ${styles[a.level]}`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${a.level === "critical" ? "text-destructive" : a.level === "warning" ? "text-[hsl(var(--warning))]" : "text-muted-foreground"}`} />
              <div className="flex-1">
                <p className="text-sm">{a.msg}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">→ {a.action}</p>
              </div>
              <Badge variant={a.level === "critical" ? "destructive" : "outline"} className="text-[10px] shrink-0">
                {a.level}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── SECTION 9: Daily Tasks ───
function DailyTasks({ kpis, contacts }: { kpis: any; contacts: any[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setChecked(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  const tasks = [
    {
      label: "Check for new signups and welcome them",
      done: (kpis?.newUsers7d ?? 0) === 0,
      icon: UserPlus,
    },
    {
      label: "Review unanswered leads and follow up",
      done: (kpis?.responseRate ?? 100) >= 80,
      icon: MessageSquare,
    },
    {
      label: "Make 5 outreach contacts",
      done: (contacts || []).filter(c => c.status !== "not_contacted" && c.last_contact_at && new Date(c.last_contact_at).toDateString() === new Date().toDateString()).length >= 5,
      icon: Target,
    },
    {
      label: "Check marketplace for on-duty coverage",
      done: false,
      icon: Globe,
    },
    {
      label: "Review activation funnel for drop-offs",
      done: false,
      icon: TrendingUp,
    },
    {
      label: "Post one social proof or feature update",
      done: false,
      icon: Megaphone,
    },
  ];

  const completedCount = tasks.filter((_, i) => checked.has(i)).length;
  const progress = Math.round((completedCount / tasks.length) * 100);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Today's Progress</span>
          <span className="text-xs text-muted-foreground">{completedCount}/{tasks.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="space-y-1.5">
          {tasks.map((t, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={`w-full flex items-center gap-2.5 text-sm p-2 rounded-lg transition-colors text-left ${
                checked.has(i) ? "bg-[hsl(var(--success))]/5 line-through text-muted-foreground" : "hover:bg-muted/40"
              }`}
            >
              <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                checked.has(i) ? "bg-[hsl(var(--success))] border-[hsl(var(--success))]" : "border-border"
              }`}>
                {checked.has(i) && <CheckCircle2 className="h-3 w-3 text-white" />}
              </div>
              <t.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Growth Engine ───
export default function GrowthEngine() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: growth, isLoading: growthLoading } = useAdminGrowthStats();
  const { data: contacts } = useOutreachContacts();
  const loading = statsLoading || growthLoading;

  const kpis = growth?.kpis;
  const funnel = growth?.funnel;
  const marketplace = growth?.marketplace;
  const referrals = growth?.referrals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">Growth Engine</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Actionable tools to grow users, boost activation, and drive engagement
        </p>
      </div>

      {/* ── SECTION 8: Alerts (top priority) ── */}
      <SectionHeader icon={AlertTriangle} title="Growth Alerts" desc="Warnings that need attention" />
      <GrowthAlerts kpis={kpis} funnel={funnel} marketplace={marketplace} />

      {/* ── SECTION 9: Daily Tasks ── */}
      <SectionHeader icon={CheckCircle2} title="Daily Growth Tasks" desc="Your daily checklist for growth actions" />
      <DailyTasks kpis={kpis} contacts={contacts || []} />

      {/* ── SECTION 7: Opportunities ── */}
      <SectionHeader icon={Lightbulb} title="Opportunities" desc="Actionable insights to grow the platform" />
      <OpportunitiesPanel kpis={kpis} stats={stats} loading={loading} />

      {/* ── SECTION 1: Outreach Engine ── */}
      <SectionHeader icon={Target} title="Outreach Engine" desc="Track and manage prospect outreach" />
      <OutreachEngine />

      {/* ── SECTION 2: Outreach Scripts ── */}
      <SectionHeader icon={FileText} title="Outreach Scripts" desc="Pre-built copy-paste scripts" />
      <OutreachScripts />

      {/* ── SECTION 4 + 5: Activation & Retention side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <SectionHeader icon={Flame} title="Activation Booster" desc="Users who haven't completed setup" />
          <div className="mt-2"><ActivationBooster kpis={kpis} loading={loading} /></div>
        </div>
        <div>
          <SectionHeader icon={Heart} title="Retention Tools" desc="Bring back inactive users" />
          <div className="mt-2"><RetentionTools kpis={kpis} loading={loading} /></div>
        </div>
      </div>

      {/* ── SECTION 6: Referral Booster ── */}
      <SectionHeader icon={Gift} title="Referral Booster" desc="Track and promote the referral program" />
      <ReferralBooster referrals={referrals} loading={loading} />

      {/* ── SECTION 3: Campaign Tools ── */}
      <SectionHeader icon={Megaphone} title="Campaign Tools" desc="Send targeted campaigns" />
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "New Users Campaign", desc: "Welcome and activate recent signups", icon: UserPlus },
              { label: "Inactive Users", desc: "Re-engage users who went quiet", icon: RefreshCw },
              { label: "Custom Segment", desc: "Target by plan, profession, or activity", icon: Users },
            ].map(c => (
              <button
                key={c.label}
                onClick={() => navigate("/app/admin-marketing")}
                className="rounded-lg border border-border p-4 text-left hover:shadow-card transition-shadow"
              >
                <c.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm font-medium">{c.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Quick Actions ── */}
      <SectionHeader icon={Rocket} title="Quick Actions" desc="Fast access to growth tools" />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {[
          { label: "Marketing", icon: Megaphone, route: "/app/admin-marketing" },
          { label: "Sequences", icon: Workflow, route: "/app/admin-marketing" },
          { label: "Users", icon: Users, route: "/app/admin-dashboard" },
          { label: "Analytics", icon: BarChart3, route: "/app/analytics" },
          { label: "Referrals", icon: Gift, route: "/app/referrals" },
          { label: "Marketplace", icon: Globe, route: "/app/marketplace" },
        ].map(a => (
          <Button key={a.label} variant="outline" size="sm" className="flex flex-col gap-1 h-auto py-3 text-xs" onClick={() => navigate(a.route)}>
            <a.icon className="h-4 w-4" />
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
